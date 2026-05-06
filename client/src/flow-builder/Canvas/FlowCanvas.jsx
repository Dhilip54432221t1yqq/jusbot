import React, { useCallback, useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  MarkerType,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';

// Node Components (To be created)
import StartNode from './nodes/StartNode';
import SendMessageNode from './nodes/SendMessageNode';
import QuestionNode from './nodes/QuestionNode';
import ActionNode from './nodes/ActionNode';
import ConditionNode from './nodes/ConditionNode';
import SplitNode from './nodes/SplitNode';
import EmailNode from './nodes/EmailNode';
import GoToNode from './nodes/GoToNode';
import FunctionOutputNode from './nodes/FunctionOutputNode';

const nodeTypes = {
  start: StartNode,
  message: SendMessageNode,
  question: QuestionNode,
  action: ActionNode,
  condition: ConditionNode,
  split: SplitNode,
  email: EmailNode,
  goto: GoToNode,
  functionOutput: FunctionOutputNode,
};

const initialNodes = [
  { 
    id: 'start-1', 
    type: 'start', 
    position: { x: 250, y: 100 }, 
    data: { label: 'Entry Point' } 
  },
];

const initialEdges = [];

export default function FlowCanvas({ onNodeSelect, selectedNodeId }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({
      ...params,
      animated: true,
      style: { strokeWidth: 3, stroke: '#94a3b8' },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
    }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event, node) => {
    onNodeSelect(node);
  }, [onNodeSelect]);

  const onPaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  const edgeOptions = useMemo(() => ({
    type: 'smoothstep',
    animated: true,
    style: { strokeWidth: 3, stroke: '#94a3b8' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
  }), []);

  return (
    <div className="w-full h-full bg-[#f8fbff]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={edgeOptions}
        fitView
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={24} 
           size={1} 
           color="#e2e8f0" 
        />
        <Controls 
          className="bg-white border-slate-200 shadow-xl rounded-xl overflow-hidden" 
          showInteractive={false}
        />
        <MiniMap 
          className="bg-white border-slate-200 shadow-xl rounded-xl overflow-hidden"
          nodeStrokeWidth={3}
          maskColor="rgba(241, 245, 249, 0.6)"
        />
      </ReactFlow>

      {/* Connection Mode Indicator */}
      <div className="absolute top-6 left-6 pointer-events-none">
         <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-md border border-slate-200 rounded-full shadow-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Main Canvas</span>
         </div>
      </div>
    </div>
  );
}
