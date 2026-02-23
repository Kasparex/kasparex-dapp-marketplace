'use client';

import { useMemo, useEffect } from 'react';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  FitViewOptions,
  Node,
  Edge,
  ConnectionLineType,
  type NodeProps,
} from 'reactflow';
import dagre from '@dagrejs/dagre';
import 'reactflow/dist/style.css';
import { useContractParam } from '@/hooks/useContractParams';
import type { ContractListItem } from './SmartContractsPage';

const NODE_WIDTH = 260;
const NODE_HEIGHT = 140;

function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
): { nodes: Node[]; edges: Edge[] } {
  if (nodes.length === 0) return { nodes: [], edges };
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  const isHorizontal = direction === 'LR';
  g.setGraph({ rankdir: direction, nodesep: 40, ranksep: 60 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const newNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      targetPosition: (isHorizontal ? 'left' : 'top') as Node['targetPosition'],
      sourcePosition: (isHorizontal ? 'right' : 'bottom') as Node['sourcePosition'],
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: newNodes as Node[], edges };
}

function ContractNode({ data, id }: NodeProps<{ contract: ContractListItem; chainId: number }>) {
  const { contract, chainId } = data;
  const paramKeys = contract.metadata.params ?? [];
  const p0 = paramKeys[0];
  const p1 = paramKeys[1];
  const r0 = useContractParam(chainId, contract.key, p0 ?? 'balance');
  const r1 = useContractParam(chainId, contract.key, p1 ?? 'balance');
  const param0 = p0 ? r0.value : null;
  const param1 = p1 ? r1.value : null;

  return (
    <div className="rounded-lg border-2 border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 shadow-md p-3 min-w-[220px] max-w-[260px]">
      <div className="font-semibold text-zinc-900 dark:text-white text-sm truncate" title={contract.key}>
        {contract.key}
      </div>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
        {contract.metadata.description}
      </p>
      <div className="mt-2">
        {contract.explorerUrl !== '#' ? (
          <a
            href={contract.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-mono text-violet-600 dark:text-violet-400 hover:underline truncate block"
          >
            {contract.address.slice(0, 8)}…{contract.address.slice(-6)}
          </a>
        ) : (
          <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 truncate block">
            {contract.address.slice(0, 8)}…{contract.address.slice(-6)}
          </span>
        )}
      </div>
      {(param0 !== null && param0 !== '—') || (param1 !== null && param1 !== '—') ? (
        <div className="mt-1.5 text-[10px] text-zinc-600 dark:text-zinc-400">
          {param0 !== null && param0 !== '—' && <div>{param0}</div>}
          {param1 !== null && param1 !== '—' && <div>{param1}</div>}
        </div>
      ) : null}
    </div>
  );
}

const nodeTypes = { contract: ContractNode };

const fitViewOptions: FitViewOptions = { padding: 0.2, maxZoom: 1 };

export function ContractFlowView({
  contractList,
  chainId,
}: {
  contractList: ContractListItem[];
  chainId: number;
}) {
  const keySet = useMemo(() => new Set(contractList.map((c) => c.key)), [contractList]);

  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = contractList.map((c, i) => ({
      id: c.key,
      type: 'contract',
      position: { x: 0, y: 0 },
      data: { contract: c, chainId },
    }));
    const edges: Edge[] = [];
    for (const c of contractList) {
      for (const target of c.metadata.linksTo ?? []) {
        if (keySet.has(target)) {
          edges.push({ id: `${c.key}-${target}`, source: c.key, target });
        }
      }
    }
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges, 'TB');
    return { initialNodes: layoutedNodes, initialEdges: layoutedEdges };
  }, [contractList, chainId, keySet]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div className="h-[600px] w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/30">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={fitViewOptions}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
