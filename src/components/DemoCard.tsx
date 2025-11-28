'use client';

import { DApp } from '@/lib/dapps';
import { generateDAppSlug } from '@/lib/utils';

interface DemoCardProps {
  dapp: DApp;
  gradientColors: [string, string];
  index: number;
}

export function DemoCard({ dapp, gradientColors, index }: DemoCardProps) {
  const [color1, color2] = gradientColors;
  const gradientStyle = {
    '--gradient-color-1': color1,
    '--gradient-color-2': color2,
    background: `linear-gradient(315deg, ${color1}, ${color2})`,
  } as React.CSSProperties;

  const slug = dapp.slug || generateDAppSlug(dapp.name);

  return (
    <div className="demo-card-box" style={gradientStyle}>
      <span></span>
      <div className="demo-card-content">
        <h2>{dapp.name}</h2>
        <p>{dapp.description || dapp.utility || 'A decentralized application on the Kaspa network.'}</p>
        <a href={`/dapps/${slug}`}>Read More</a>
      </div>
    </div>
  );
}

