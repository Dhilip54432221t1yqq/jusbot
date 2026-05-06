import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from './Sidebar/Sidebar';
import BuilderHeader from './Topbar/BuilderHeader';
import FlowCanvas from './Canvas/FlowCanvas';
import PropertyPanel from './Inspector/PropertyPanel';

export default function FlowBuilderShell() {
  const { id, workspaceId } = useParams();
  const [selectedNode, setSelectedNode] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Focus on selected node
  const handleNodeSelect = (node) => {
    setSelectedNode(node);
    setIsInspectorOpen(!!node);
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden text-slate-900 font-sans">
      {/* 1. Left Sidebar: Flow & Sub-flow Management */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        workspaceId={workspaceId}
      />

      {/* 2. Main Editor Area */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Top Header: Actions & Navigation */}
        <BuilderHeader 
          flowId={id} 
          workspaceId={workspaceId} 
        />

        {/* The Canvas: ReactFlow Graph */}
        <div className="flex-1 relative">
          <FlowCanvas 
            onNodeSelect={handleNodeSelect} 
            selectedNodeId={selectedNode?.id}
          />
        </div>
      </main>

      {/* 3. Right Property Inspector */}
      <PropertyPanel 
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        node={selectedNode}
        onUpdateNode={(updatedData) => {
          // This will be handled by the canvas context/state provider later
          console.log('Update node', updatedData);
        }}
      />
    </div>
  );
}
