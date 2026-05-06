export default function RightPanel({ selectedNode, setNodes }) {
  if (!selectedNode)
    return <div className="w-80 bg-white border-l p-4">Select a node</div>;

  return (
    <div className="w-80 bg-white border-l p-4">
      <h3 className="font-sora font-semibold mb-4">Edit Node</h3>

      {selectedNode.type === "messageNode" && (
        <button
          className="w-full bg-blue-500 text-white rounded-lg py-2"
          onClick={() => {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === selectedNode.id
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        buttons: [
                          ...(n.data.buttons || []),
                          { id: Date.now(), label: "Button" },
                        ],
                      },
                    }
                  : n
              )
            );
          }}
        >
          + Add Button
        </button>
      )}
    </div>
  );
}
