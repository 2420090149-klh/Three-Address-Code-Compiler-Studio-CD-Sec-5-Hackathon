// src/components/ASTVisualizerView.tsx
import React, { useState, useMemo } from 'react';
import {
  Network,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  ChevronRight,
  ChevronDown,
  Info,
  Layers,
  Sparkles,
  Code2,
} from 'lucide-react';
import { ASTNode, CompilationResult } from '../compiler/types';
import { convertToVisualTree, VisualTreeNode, findNodeById, getASTChildren } from '../compiler/ast';

interface ASTVisualizerViewProps {
  compilationResult: CompilationResult | null;
  selectedNodeId?: string;
  onSelectNode?: (nodeId: string) => void;
}

interface LayoutNode extends VisualTreeNode {
  x: number;
  y: number;
  children: LayoutNode[];
}

export const ASTVisualizerView: React.FC<ASTVisualizerViewProps> = ({
  compilationResult,
  selectedNodeId,
  onSelectNode,
}) => {
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [activeNodeId, setActiveNodeId] = useState<string | null>(selectedNodeId || null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const ast = compilationResult?.ast;

  const toggleCollapse = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleNodeClick = (node: VisualTreeNode) => {
    setActiveNodeId(node.id);
    if (onSelectNode) onSelectNode(node.id);
  };

  // Convert raw AST into visual hierarchy tree
  const visualRoot = useMemo(() => {
    if (!ast) return null;
    return convertToVisualTree(ast);
  }, [ast]);

  // Tree layout algorithm with collapse awareness
  const { layoutTree, svgWidth, svgHeight } = useMemo(() => {
    if (!visualRoot) return { layoutTree: null, svgWidth: 800, svgHeight: 600 };

    let currentX = 50;
    const nodeWidth = 140;
    const nodeHeight = 44;
    const levelHeight = 90;
    const horizontalGap = 35;

    // Post-order traversal to compute layout
    const assignCoordinates = (node: VisualTreeNode, depth: number): LayoutNode => {
      const isCollapsed = collapsedNodes.has(node.id);
      const layoutChildren: LayoutNode[] = [];

      if (!isCollapsed && node.children && node.children.length > 0) {
        for (const child of node.children) {
          layoutChildren.push(assignCoordinates(child, depth + 1));
        }

        // Center parent over children
        const firstChild = layoutChildren[0];
        const lastChild = layoutChildren[layoutChildren.length - 1];
        const x = (firstChild.x + lastChild.x) / 2;
        const y = depth * levelHeight + 60;

        return {
          ...node,
          x,
          y,
          children: layoutChildren,
        };
      } else {
        // Leaf or collapsed node
        const x = currentX + nodeWidth / 2;
        const y = depth * levelHeight + 60;
        currentX += nodeWidth + horizontalGap;

        return {
          ...node,
          x,
          y,
          children: [],
        };
      }
    };

    const root = assignCoordinates(visualRoot, 0);
    const calculatedWidth = Math.max(currentX + 100, 1000);
    const calculatedHeight = 800;

    return { layoutTree: root, svgWidth: calculatedWidth, svgHeight: calculatedHeight };
  }, [visualRoot, collapsedNodes]);

  // Selected node details
  const selectedNode = useMemo(() => {
    if (!ast || !activeNodeId) return null;
    return findNodeById(ast, activeNodeId);
  }, [ast, activeNodeId]);

  // Corresponding TAC instructions for selected node
  const linkedTac = useMemo(() => {
    if (!compilationResult || !activeNodeId) return [];
    return compilationResult.tacInstructions.filter((i) => i.sourceNodeId === activeNodeId);
  }, [compilationResult, activeNodeId]);

  // Corresponding SDT step for selected node
  const linkedSDT = useMemo(() => {
    if (!compilationResult || !activeNodeId) return null;
    return compilationResult.sdtSteps.find((s) => s.nodeId === activeNodeId);
  }, [compilationResult, activeNodeId]);

  if (!ast || !layoutTree) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Network className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-sm">No Abstract Syntax Tree available. Click "Run Compiler" to generate AST.</p>
      </div>
    );
  }

  // Node category styling
  const getNodeCategoryStyles = (category: VisualTreeNode['category']) => {
    switch (category) {
      case 'program':
        return {
          bg: '#1e1b4b',
          stroke: '#6366f1',
          text: '#e0e7ff',
          badge: 'bg-indigo-950 text-indigo-300 border-indigo-700/50',
        };
      case 'statement':
        return {
          bg: '#2e1065',
          stroke: '#a855f7',
          text: '#f3e8ff',
          badge: 'bg-purple-950 text-purple-300 border-purple-700/50',
        };
      case 'operator':
        return {
          bg: '#083344',
          stroke: '#06b6d4',
          text: '#cffafe',
          badge: 'bg-cyan-950 text-cyan-300 border-cyan-700/50',
        };
      case 'identifier':
        return {
          bg: '#064e3b',
          stroke: '#10b981',
          text: '#d1fae5',
          badge: 'bg-emerald-950 text-emerald-300 border-emerald-700/50',
        };
      case 'literal':
        return {
          bg: '#451a03',
          stroke: '#f59e0b',
          text: '#fef3c7',
          badge: 'bg-amber-950 text-amber-300 border-amber-700/50',
        };
      default:
        return {
          bg: '#0f172a',
          stroke: '#64748b',
          text: '#f1f5f9',
          badge: 'bg-slate-900 text-slate-300 border-slate-700',
        };
    }
  };

  // SVG edges render
  const renderEdges = (node: LayoutNode): React.ReactNode[] => {
    const edges: React.ReactNode[] = [];
    for (const child of node.children) {
      const midY = (node.y + child.y) / 2;
      const pathD = `M ${node.x} ${node.y + 20} C ${node.x} ${midY}, ${child.x} ${midY}, ${child.x} ${child.y - 20}`;
      edges.push(
        <path
          key={`edge-${node.id}-${child.id}`}
          d={pathD}
          fill="none"
          stroke="#334155"
          strokeWidth="1.5"
          className="transition-all hover:stroke-purple-400"
        />
      );
      edges.push(...renderEdges(child));
    }
    return edges;
  };

  // SVG nodes render
  const renderNodes = (node: LayoutNode): React.ReactNode[] => {
    const nodes: React.ReactNode[] = [];
    const isSelected = activeNodeId === node.id;
    const hasChildren = node.astNode && getASTChildren(node.astNode).length > 0;
    const isCollapsed = collapsedNodes.has(node.id);
    const styles = getNodeCategoryStyles(node.category);

    nodes.push(
      <g
        key={`node-${node.id}`}
        transform={`translate(${node.x}, ${node.y})`}
        onClick={() => handleNodeClick(node)}
        className="cursor-pointer group select-none"
      >
        {/* Node Background Box */}
        <rect
          x="-65"
          y="-20"
          width="130"
          height="40"
          rx="10"
          fill={styles.bg}
          stroke={isSelected ? '#38bdf8' : styles.stroke}
          strokeWidth={isSelected ? '2.5' : '1.5'}
          filter={isSelected ? 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.4))' : undefined}
          className="transition-all duration-200 group-hover:brightness-125"
        />

        {/* Node Label Text */}
        <text
          x="0"
          y="-2"
          textAnchor="middle"
          fill={styles.text}
          fontSize="11"
          fontWeight="600"
          fontFamily="monospace"
        >
          {node.name.length > 16 ? node.name.slice(0, 15) + '…' : node.name}
        </text>

        {/* Category Pill Subtext */}
        <text
          x="0"
          y="12"
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="8.5"
          fontWeight="500"
          fontFamily="sans-serif"
          letterSpacing="0.05em"
        >
          {node.category.toUpperCase()}
        </text>

        {/* Collapse / Expand Toggle Button for nodes with children */}
        {hasChildren && (
          <g
            onClick={(e) => toggleCollapse(node.id, e)}
            transform="translate(55, -12)"
            className="hover:scale-110 transition-transform"
          >
            <circle cx="0" cy="0" r="7" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
            <text
              x="0"
              y="2.5"
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize="9"
              fontWeight="bold"
            >
              {isCollapsed ? '+' : '−'}
            </text>
          </g>
        )}
      </g>
    );

    for (const child of node.children) {
      nodes.push(...renderNodes(child));
    }

    return nodes;
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="h-full flex flex-col p-6 space-y-4 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Visualizer Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Network className="w-4 h-4 text-purple-400" />
            <span>Interactive Abstract Syntax Tree</span>
          </h2>
          <p className="text-[11px] text-slate-400">
            Hierarchical grammar tree synthesized by recursive descent. Click nodes to inspect or toggle subtrees.
          </p>
        </div>

        {/* Category Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300">
            <span className="w-2 h-2 rounded-full bg-indigo-500" /> Program
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-700/60 text-purple-300">
            <span className="w-2 h-2 rounded-full bg-purple-500" /> Statements
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-700/60 text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-500" /> Operators
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Identifiers
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-700/60 text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Literals
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.15, 2.0))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.15, 0.4))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 50, y: 50 });
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Visualizer & Inspector Layout */}
      <div className="flex-1 min-h-[500px] flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* SVG Canvas Area */}
        <div
          className="flex-1 rounded-xl border border-slate-800 bg-slate-950/90 relative overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <svg
            width="100%"
            height="100%"
            className="w-full h-full min-h-[480px]"
          >
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(51, 65, 85, 0.15)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {renderEdges(layoutTree)}
              {renderNodes(layoutTree)}
            </g>
          </svg>

          {/* Canvas Watermark */}
          <div className="absolute bottom-3 left-3 text-[10px] font-mono text-slate-600 pointer-events-none select-none">
            Pan: Drag Canvas • Zoom: {Math.round(zoom * 100)}% • Click node to inspect
          </div>
        </div>

        {/* Selected Node Attribute Inspector Panel */}
        <div className="w-full lg:w-80 shrink-0 rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between overflow-y-auto max-h-[540px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Node Inspector</span>
              </span>
              {activeNodeId && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                  {activeNodeId}
                </span>
              )}
            </div>

            {selectedNode ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                    Node Type
                  </label>
                  <p className="font-mono text-purple-300 font-semibold">{selectedNode.type}</p>
                </div>

                <div>
                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                    Source Coordinates
                  </label>
                  <p className="font-mono text-slate-300">
                    Line {selectedNode.line}, Column {selectedNode.column}
                  </p>
                </div>

                {/* SDT Production & Semantics */}
                {linkedSDT && (
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1.5">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      Grammar Production
                    </span>
                    <p className="font-mono text-[11px] text-indigo-200">{linkedSDT.productionRule}</p>

                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mt-2">
                      Semantic Action
                    </span>
                    <p className="font-mono text-[10px] text-slate-400 leading-relaxed">
                      {linkedSDT.semanticAction}
                    </p>
                  </div>
                )}

                {/* Synthesized Attributes */}
                {linkedSDT?.synthesized && Object.keys(linkedSDT.synthesized).length > 0 && (
                  <div>
                    <label className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
                      Synthesized Attributes (S-Attributed)
                    </label>
                    <div className="mt-1 space-y-1 font-mono text-[11px]">
                      {Object.entries(linkedSDT.synthesized).map(([key, val]) => (
                        <div key={key} className="flex justify-between bg-slate-950/70 p-1.5 rounded border border-slate-800">
                          <span className="text-slate-400">{key}:</span>
                          <span className="text-emerald-300 font-semibold">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inherited Attributes */}
                {linkedSDT?.inherited && Object.keys(linkedSDT.inherited).length > 0 && (
                  <div>
                    <label className="text-[10px] font-medium text-rose-400 uppercase tracking-wider">
                      Inherited Attributes (L-Attributed)
                    </label>
                    <div className="mt-1 space-y-1 font-mono text-[11px]">
                      {Object.entries(linkedSDT.inherited).map(([key, val]) => (
                        <div key={key} className="flex justify-between bg-slate-950/70 p-1.5 rounded border border-slate-800">
                          <span className="text-slate-400">{key}:</span>
                          <span className="text-rose-300 font-semibold">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Associated TAC Instructions */}
                <div>
                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                    Emitted TAC Instructions ({linkedTac.length})
                  </label>
                  {linkedTac.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic mt-1">
                      No standalone TAC emitted for this leaf/intermediate node.
                    </p>
                  ) : (
                    <div className="mt-1 space-y-1">
                      {linkedTac.map((tac) => (
                        <div
                          key={tac.id}
                          className="p-2 rounded bg-slate-950 border border-emerald-500/30 text-emerald-300 font-mono text-[11px]"
                        >
                          <span className="text-slate-500 mr-2 font-semibold">#{tac.id}</span>
                          <span>{tac.raw}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">
                <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p>Click any node in the SVG tree to inspect its type, coordinates, SDT attributes, and emitted TAC.</p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500">
            Total Nodes: {compilationResult?.astNodeCount || 0}
          </div>
        </div>
      </div>
    </div>
  );
};
