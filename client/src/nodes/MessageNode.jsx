import { Handle, Position, useEdges } from "reactflow";

export default function MessageNode({ id, data, selected }) {
  const edges = useEdges();
  const isConnected = (handleId) => edges.some(e => e.source === id && e.sourceHandle === handleId);

  const components = data.components || [];
  // Migrate old data structure on the fly
  if (components.length === 0 && (data.text || data.message_configured)) {
    components.push({
      id: 'comp-legacy',
      type: 'text',
      text: data.text || '',
      buttons: data.buttons || []
    });
  }

  const isConfigured = components.length > 0;

  return (
    <div className="relative flex flex-col items-center w-[300px]">
      
      {/* Circle Icon */}
      <div className={`relative w-[110px] h-[110px] bg-[#d9d9d9] rounded-full flex items-center justify-center mb-1 shadow-sm border-2 border-transparent transition-all ${selected ? 'border-black' : ''}`}>
        <Handle
          type="target"
          position={Position.Left}
          className="!absolute !left-0 !top-1/2 !-translate-y-1/2 !w-full !h-full !opacity-0 !border-none !bg-transparent !m-0 !transform-none"
          style={{ left: 0 }}
        />
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          <line x1="8" y1="10" x2="16" y2="10"></line>
          <line x1="8" y1="14" x2="14" y2="14"></line>
        </svg>
      </div>

      {/* Label */}
      <span className="text-[22px] text-white mb-2 font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>Send Message</span>

      {/* White Container */}
      <div className={`relative w-full bg-white rounded-[24px] p-3 flex flex-col shadow-sm border-2 border-transparent transition-all ${selected ? 'border-[#d9d9d9]' : ''}`}>

        {/* Content Area */}
        {!isConfigured ? (
          <div className="bg-[#fafafa] rounded-[16px] py-6 flex flex-col items-center justify-center cursor-pointer hover:bg-[#f1f5f9] transition-colors border border-transparent">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
              <path d="M4 7V4h16v3" />
              <path d="M12 4v12" />
              <path d="M9 16h6" />
              <path d="M8 20h8" />
            </svg>
            <span className="text-black text-[15px] font-medium mt-1">Click to add text</span>
          </div>
        ) : (
          <div className="space-y-3.5 w-full">
            {components.map((comp, compIdx) => {
              if (comp.type === 'text') {
                return (
                  <div key={comp.id || compIdx} className="bg-[#fafafa] rounded-[16px] p-4 border border-slate-100 shadow-sm relative w-full">
                    <p className="text-black text-[14px] whitespace-pre-wrap leading-relaxed">
                      {comp.text || "No text content yet..."}
                    </p>
                    {(comp.buttons || []).length > 0 && (
                      <div className="flex flex-col gap-2 mt-3.5">
                        {(comp.buttons || []).map((btn, i) => {
                          const connected = isConnected(btn.id);
                          return (
                            <div key={btn.id} className="relative w-full bg-white rounded-xl py-2 px-4 flex items-center justify-between border border-slate-100 shadow-sm">
                              <span className="text-[13px] font-semibold text-black">{btn.label || `Option ${i + 1}`}</span>
                              <Handle
                                type="source"
                                position={Position.Right}
                                id={btn.id}
                                className={`!absolute !-right-2.5 !top-1/2 !-translate-y-1/2 !w-5 !h-5 !border-[2.5px] !border-black !rounded-full !m-0 !transform-none transition-colors ${connected ? '!bg-black' : '!bg-white'}`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              } else if (comp.type === 'card') {
                const cardsList = comp.cards || [];
                if (cardsList.length === 0) {
                  return (
                    <div key={comp.id || compIdx} className="bg-slate-50 border border-dashed border-slate-200 rounded-[16px] p-4 text-center shadow-sm w-full">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Empty Card Component</span>
                    </div>
                  );
                }

                // Render the active card as preview on the canvas node
                const activeIdx = comp.activeCardIdx || 0;
                const activeCard = cardsList[activeIdx] || cardsList[0] || { id: 'default', image: '', title: '', subtitle: '', buttons: [] };
                return (
                  <div key={comp.id || compIdx} className="bg-white rounded-[16px] border border-slate-150 shadow-sm overflow-hidden w-full flex flex-col">
                    {/* Card Image */}
                    {activeCard.image ? (
                      <img src={activeCard.image} alt={activeCard.title || "Card Preview"} className="w-full h-32 object-cover" />
                    ) : (
                      <div className="w-full h-32 bg-slate-100 flex flex-col items-center justify-center border-b border-slate-100">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <span className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">No Image</span>
                      </div>
                    )}

                    {/* Card Content */}
                    <div className="p-3.5 space-y-1">
                      <h4 className="text-sm font-bold text-slate-800 truncate">{activeCard.title || "Card Title"}</h4>
                      <p className="text-xs text-slate-500 leading-normal line-clamp-2">{activeCard.subtitle || "Card description/subtitle..."}</p>
                    </div>

                    {/* Carousel Indicators if multiple cards */}
                    {cardsList.length > 1 && (
                      <div className="flex justify-center gap-1.5 pb-2.5">
                        {cardsList.map((_, idx) => (
                          <span key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === activeIdx ? 'bg-slate-850 w-3' : 'bg-slate-200'}`} />
                        ))}
                      </div>
                    )}

                    {/* Card Buttons */}
                    {(activeCard.buttons || []).length > 0 && (
                      <div className="border-t border-slate-50 p-2 space-y-1.5 bg-slate-50/50">
                        {(activeCard.buttons || []).map((btn, i) => {
                          const connected = isConnected(btn.id);
                          return (
                            <div key={btn.id} className="relative w-full bg-white rounded-xl py-1.5 px-3.5 flex items-center justify-between border border-slate-100 shadow-sm">
                              <span className="text-[12px] font-semibold text-black">{btn.label || `Button ${i + 1}`}</span>
                              <Handle
                                type="source"
                                position={Position.Right}
                                id={btn.id}
                                className={`!absolute !-right-2.5 !top-1/2 !-translate-y-1/2 !w-5 !h-5 !border-[2.5px] !border-black !rounded-full !m-0 !transform-none transition-colors ${connected ? '!bg-black' : '!bg-white'}`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              } else if (comp.type === 'media') {
                const mediaType = comp.mediaType || '';
                const mediaUrl = comp.mediaUrl || '';
                const mediaName = comp.mediaName || '';
                const mediaSize = comp.mediaSize || '';
                const loc = comp.location || { latitude: '', longitude: '', name: '', address: '' };

                return (
                  <div key={comp.id || compIdx} className="bg-white rounded-[16px] border border-slate-150 shadow-sm overflow-hidden w-full flex flex-col p-3.5 space-y-2">
                    {/* Media Type Title */}
                    <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-50">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                        Rich Media {mediaType ? `• ${mediaType}` : ''}
                      </span>
                    </div>

                    {!mediaType ? (
                      <div className="py-4 flex flex-col items-center justify-center text-slate-400">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-1">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Empty Rich Media</span>
                      </div>
                    ) : mediaType === 'location' ? (
                      <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                        </div>
                        <div className="text-left overflow-hidden">
                          <p className="text-xs font-bold text-slate-800 truncate">{loc.name || 'Location Name'}</p>
                          <p className="text-[10px] text-slate-500 truncate leading-relaxed">{loc.address || 'Address not configured...'}</p>
                          {(loc.latitude || loc.longitude) && (
                            <p className="text-[9px] font-mono text-slate-400 mt-0.5">
                              {loc.latitude || '0'}, {loc.longitude || '0'}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : mediaUrl ? (
                      <div className="w-full rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                        {mediaType === 'image' || mediaType === 'sticker' ? (
                          <img src={mediaUrl} alt={mediaName} className="w-full h-32 object-cover" />
                        ) : mediaType === 'video' ? (
                          <div className="relative w-full h-32 flex items-center justify-center bg-slate-900 text-white">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                            <span className="absolute bottom-2 left-2 text-[9px] font-bold bg-black/60 px-1.5 py-0.5 rounded text-white truncate max-w-[80%]">
                              {mediaName}
                            </span>
                          </div>
                        ) : mediaType === 'audio' ? (
                          <div className="p-3 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M9 18V5l12-2v13" />
                                <circle cx="6" cy="18" r="3" />
                                <circle cx="18" cy="16" r="3" />
                              </svg>
                            </div>
                            <div className="text-left overflow-hidden">
                              <p className="text-xs font-bold text-slate-700 truncate">{mediaName}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">{mediaSize || 'Audio'}</p>
                            </div>
                          </div>
                        ) : (
                          // Document/File
                          <div className="p-3 flex items-center gap-3 bg-white">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                              </svg>
                            </div>
                            <div className="text-left overflow-hidden">
                              <p className="text-xs font-bold text-slate-700 truncate">{mediaName}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">{mediaSize || 'File'}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-6 border-2 border-dashed border-slate-100 bg-slate-50/50 rounded-xl flex flex-col items-center justify-center text-slate-400">
                        <span className="text-[10px] font-bold uppercase tracking-wider">No {mediaType} file selected</span>
                      </div>
                    )}
                  </div>
                );
              } else if (comp.type === 'others') {
                const otherType = comp.otherType || '';
                const typeLabels = {
                  template: 'WhatsApp Template',
                  call_permission: 'WhatsApp Call Permission',
                  single_product: 'WhatsApp Single Product',
                  multi_product: 'WhatsApp Multiple Products',
                  catalog: 'WhatsApp Catalog Message',
                  flow: 'WhatsApp Flow',
                  contact: 'WhatsApp Contact',
                  typing: 'Typing Indicator'
                };

                return (
                  <div key={comp.id || compIdx} className="bg-white rounded-[16px] border border-slate-150 shadow-sm overflow-hidden w-full flex flex-col p-3.5 space-y-2 text-left">
                    <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-50">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                        Action • {typeLabels[otherType] || 'Others'}
                      </span>
                    </div>

                    {!otherType ? (
                      <div className="py-4 flex flex-col items-center justify-center text-slate-400">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-1">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="16" />
                          <line x1="8" y1="12" x2="16" y2="12" />
                        </svg>
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Empty Action</span>
                      </div>
                    ) : (
                      <div className="text-left space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {otherType === 'template' && (
                          <>
                            <p className="text-xs font-bold text-slate-800 truncate">Template Name</p>
                            <p className="text-[10px] text-slate-500 truncate font-mono bg-white px-1.5 py-0.5 rounded border border-slate-100">{comp.templateName || 'No template selected'}</p>
                          </>
                        )}
                        {otherType === 'call_permission' && (
                          <>
                            <p className="text-xs font-bold text-slate-800 truncate">{comp.callButtonText || 'Call Support'}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{comp.callPhoneNumber || 'No number configured'}</p>
                          </>
                        )}
                        {otherType === 'single_product' && (
                          <>
                            <p className="text-xs font-bold text-slate-800">Catalog SKU</p>
                            <p className="text-[10px] text-slate-500 font-mono truncate">ID: {comp.productRetailerId || 'Not configured'}</p>
                          </>
                        )}
                        {otherType === 'multi_product' && (
                          <>
                            <p className="text-xs font-bold text-slate-800 truncate">{comp.sectionTitle || 'Section Title'}</p>
                            <p className="text-[10px] text-slate-500 font-mono truncate">SKUs: {comp.productIds || 'None'}</p>
                          </>
                        )}
                        {otherType === 'catalog' && (
                          <>
                            <p className="text-xs font-bold text-slate-800 truncate">{comp.catalogHeader || 'Catalog Store'}</p>
                            <p className="text-[10px] text-slate-500 truncate leading-relaxed">{comp.catalogBody || 'Catalog details...'}</p>
                          </>
                        )}
                        {otherType === 'flow' && (
                          <>
                            <p className="text-xs font-bold text-slate-800 truncate">{comp.flowButtonLabel || 'Launch Flow'}</p>
                            <p className="text-[10px] text-slate-500 font-mono truncate">ID: {comp.flowId || 'None'}</p>
                          </>
                        )}
                        {otherType === 'contact' && (
                          <>
                            <p className="text-xs font-bold text-slate-800 truncate">
                              {comp.contact?.firstName || ''} {comp.contact?.lastName || '' || 'Contact Card'}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">{comp.contact?.phone || 'No phone'}</p>
                          </>
                        )}
                        {otherType === 'typing' && (
                          <div className="flex items-center gap-2 py-0.5">
                            <span className="flex gap-1 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-75" />
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-150" />
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Typing Indicator {comp.typingDelay || 2}s</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              } else {
                const labelMap = {
                  card: 'Card Component',
                  foreach: 'For Each Loop',
                  dynamic: 'Dynamic Content',
                  ecommerce: 'Ecommerce',
                  debug: 'Debug Text'
                };
                return (
                  <div key={comp.id || compIdx} className="bg-slate-50 border border-dashed border-slate-200 rounded-[16px] p-4 text-center shadow-sm w-full">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{labelMap[comp.type] || comp.type}</span>
                  </div>
                );
              }
            })}
          </div>
        )}

        {/* Continue to Next Step */}
        <div className="relative w-full flex items-center justify-center pt-4 pb-2">
          <span className="text-black text-[15px] font-medium tracking-wide pr-4">Continue to Next Step</span>
          <Handle
            type="source"
            position={Position.Right}
            id="continue"
            className={`!absolute !right-1 !top-1/2 !translate-y-[calc(-50%+4px)] !w-6 !h-6 !border-[2.5px] !border-black !rounded-full !m-0 !transform-none hover:!bg-black/10 transition-colors ${isConnected("continue") ? '!bg-black' : '!bg-transparent'}`}
          />
        </div>

      </div>
    </div>
  );
}
