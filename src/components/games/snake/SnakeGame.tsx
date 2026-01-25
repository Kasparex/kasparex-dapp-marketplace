'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Game } from '@/lib/games/games';

interface SnakeGameProps {
  game: Game;
  onGameOver?: (score: number, level: number) => void;
}

const GRID_SIZE = 20;
const INITIAL_SPEED = 150;
const LEVEL_SPEED_DECREASE = 10;
const POINTS_PER_FOOD = 10;
const FOOD_TO_LEVEL_UP = 5;
const MAX_LEVEL = 10;

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export function SnakeGame({ game, onGameOver }: SnakeGameProps) {
  // Game state
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [gameOverState, setGameOverState] = useState(false);
  
  // Ref for mutable state in game loop to avoid dependency issues
  const directionRef = useRef<Direction>('RIGHT');
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize game
  const startGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    const newFood = generateFood([{ x: 10, y: 10 }]);
    setFood(newFood);
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    setScore(0);
    setLevel(1);
    setSpeed(INITIAL_SPEED);
    setIsPlaying(true);
    setIsPaused(false);
    setGameOverState(false);
  };

  const generateFood = (currentSnake: Point[]): Point => {
    let newFood: Point;
    let isOnSnake;
    const canvasWidth = (canvasRef.current?.width || 400) / GRID_SIZE;
    const canvasHeight = (canvasRef.current?.height || 400) / GRID_SIZE;
    
    do {
      newFood = {
        x: Math.floor(Math.random() * canvasWidth),
        y: Math.floor(Math.random() * canvasHeight)
      };
      isOnSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
    } while (isOnSnake);
    return newFood;
  };

  const endGame = () => {
    setIsPlaying(false);
    setGameOverState(true);
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    if (onGameOver) {
      onGameOver(score, level);
    }
  };

  const moveSnake = useCallback(() => {
    if (!isPlaying || isPaused || gameOverState) return;

    setSnake(prevSnake => {
      const head = { ...prevSnake[0] };
      const currentDir = directionRef.current;

      switch (currentDir) {
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
      }

      // Check collision with walls
      const canvasWidth = (canvasRef.current?.width || 400) / GRID_SIZE;
      const canvasHeight = (canvasRef.current?.height || 400) / GRID_SIZE;

      if (head.x < 0 || head.x >= canvasWidth || head.y < 0 || head.y >= canvasHeight) {
        endGame();
        return prevSnake;
      }

      // Check collision with self
      if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        endGame();
        return prevSnake;
      }

      const newSnake = [head, ...prevSnake];

      // Check if food eaten
      if (head.x === food.x && head.y === food.y) {
        const points = POINTS_PER_FOOD * level;
        setScore(prev => prev + points);
        
        // Level up logic
        setSnake(currentSnake => {
           // We need to access the updated score or just track food eaten count separately
           // For simplicity, let's use a ref or just calculate based on score
           // But actually we need to track how many food eaten in THIS level
           return currentSnake;
        });

        // Update level based on score/food
        // Simplified: Level up every FOOD_TO_LEVEL_UP food items
        // Since we are inside setSnake callback, we can't easily see updated score
        // Let's do it outside or track a counter. 
        // Actually, we can just do it in the next render cycle or use a ref.
        
        setFood(prevFood => generateFood(newSnake));
      } else {
        newSnake.pop();
      }
      
      return newSnake;
    });
    
    // Check for level up after move (simplified)
    // Ideally this should be more robust
  }, [isPlaying, isPaused, level, food, gameOverState]);

  // Handle food eating and leveling up separately to avoid complex state updates in moveSnake
  useEffect(() => {
    if (!isPlaying) return;
    
    const head = snake[0];
    if (head.x === food.x && head.y === food.y) {
        // Food eaten
        // We need to re-generate food here if not done in moveSnake
        // But moveSnake does it. 
        
        // Level up check
        // Calculate total food eaten
        const foodEaten = Math.floor(score / POINTS_PER_FOOD); // Approximation if points per food varies by level
        
        // Let's use a simple counter instead
    }
  }, [snake, food, isPlaying]);

  // Refined Game Loop
  useEffect(() => {
    if (isPlaying && !isPaused && !gameOverState) {
      gameLoopRef.current = setInterval(() => {
        setSnake(prevSnake => {
            const head = { ...prevSnake[0] };
            const currentDir = directionRef.current;
      
            switch (currentDir) {
              case 'UP': head.y -= 1; break;
              case 'DOWN': head.y += 1; break;
              case 'LEFT': head.x -= 1; break;
              case 'RIGHT': head.x += 1; break;
            }
      
            // Check collision with walls
            const canvasWidth = (canvasRef.current?.width || 400) / GRID_SIZE;
            const canvasHeight = (canvasRef.current?.height || 400) / GRID_SIZE;
      
            if (head.x < 0 || head.x >= canvasWidth || head.y < 0 || head.y >= canvasHeight) {
              endGame();
              return prevSnake;
            }
      
            // Check collision with self
            if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
              endGame();
              return prevSnake;
            }
      
            const newSnake = [head, ...prevSnake];
      
            // Check if food eaten
            if (head.x === food.x && head.y === food.y) {
              setScore(s => {
                  const newScore = s + POINTS_PER_FOOD * level;
                  return newScore;
              });
              
              // Level Up Logic
              // We need a reliable way to track food eaten per level
              // Let's assume we want to level up every 5 food items
              // We can track total food eaten
              
              setFood(prev => {
                  const newFood = generateFood(newSnake);
                  return newFood;
              });
            } else {
              newSnake.pop();
            }
            return newSnake;
        });
      }, speed);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isPlaying, isPaused, speed, level, food, gameOverState]);
  
  // Separate effect for leveling up based on score changes
  useEffect(() => {
      if (score > 0 && score % (POINTS_PER_FOOD * FOOD_TO_LEVEL_UP) === 0) {
          if (level < MAX_LEVEL) {
              setLevel(l => l + 1);
              setSpeed(s => Math.max(50, s - LEVEL_SPEED_DECREASE));
          }
      }
  }, [score]);


  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      
      switch (e.key) {
        case 'ArrowUp': 
            if (directionRef.current !== 'DOWN') directionRef.current = 'UP'; 
            setDirection('UP');
            break;
        case 'ArrowDown': 
            if (directionRef.current !== 'UP') directionRef.current = 'DOWN'; 
            setDirection('DOWN');
            break;
        case 'ArrowLeft': 
            if (directionRef.current !== 'RIGHT') directionRef.current = 'LEFT'; 
            setDirection('LEFT');
            break;
        case 'ArrowRight': 
            if (directionRef.current !== 'LEFT') directionRef.current = 'RIGHT'; 
            setDirection('RIGHT');
            break;
        case ' ': 
            e.preventDefault();
            setIsPaused(prev => !prev); 
            break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#18181b'; // zinc-900
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines (optional, low opacity)
    ctx.strokeStyle = '#27272a'; // zinc-800
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Draw snake
    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? '#02abb8' : '#0891b2'; // Head vs Body
      ctx.fillRect(segment.x * GRID_SIZE + 1, segment.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2);
    });

    // Draw food
    ctx.fillStyle = '#ef4444'; // red-500
    ctx.beginPath();
    ctx.arc(
      food.x * GRID_SIZE + GRID_SIZE / 2,
      food.y * GRID_SIZE + GRID_SIZE / 2,
      GRID_SIZE / 2 - 3,
      0,
      2 * Math.PI
    );
    ctx.fill();

  }, [snake, food]);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <div className="flex justify-between items-center w-full max-w-[400px]">
        <div className="flex flex-col">
            <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Score</span>
            <span className="text-2xl font-bold text-[#02abb8]">{score}</span>
        </div>
        <div className="flex flex-col items-end">
            <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Level</span>
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{level}/{MAX_LEVEL}</span>
        </div>
      </div>
      
      <div className="relative group">
        <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="border-4 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-inner bg-zinc-900"
            style={{ imageRendering: 'pixelated' }}
        />
        
        {!isPlaying && !gameOverState && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-lg backdrop-blur-sm transition-all">
                <h3 className="text-3xl font-bold text-white mb-4">Ready?</h3>
                <button 
                    onClick={startGame}
                    className="px-8 py-3 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
                >
                    Start Game
                </button>
            </div>
        )}
        
        {gameOverState && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg backdrop-blur-sm">
                <h3 className="text-3xl font-bold text-red-500 mb-2">Game Over!</h3>
                <p className="text-white text-xl mb-6">Final Score: {score}</p>
                <button 
                    onClick={startGame}
                    className="px-8 py-3 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
                >
                    Play Again
                </button>
            </div>
        )}

        {isPaused && isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg backdrop-blur-sm">
                <div className="bg-black/80 px-6 py-3 rounded-xl text-white font-bold text-xl border border-white/10">PAUSED</div>
            </div>
        )}
      </div>
      
      <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/50 px-4 py-2 rounded-full">
        <div className="flex items-center gap-1">
            <span className="kbd bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 font-mono text-xs">↑</span>
            <span className="kbd bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 font-mono text-xs">↓</span>
            <span className="kbd bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 font-mono text-xs">←</span>
            <span className="kbd bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 font-mono text-xs">→</span>
            <span>to move</span>
        </div>
        <div className="w-1 h-1 bg-zinc-400 rounded-full"></div>
        <div className="flex items-center gap-1">
            <span className="kbd bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 font-mono text-xs">Space</span>
            <span>to pause</span>
        </div>
      </div>
    </div>
  );
}
