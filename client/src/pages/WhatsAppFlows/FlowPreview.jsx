import React from 'react';
import { User, ChevronLeft } from 'lucide-react';

export default function FlowPreview({ flowJson }) {
    
    // Safety check
    let screens = [];
    let initialScreen = '';
    
    try {
        if (flowJson && typeof flowJson === 'object' && flowJson.screens) {
            screens = flowJson.screens;
            initialScreen = flowJson.routing?.default_screen || (screens[0] ? screens[0].id : '');
        }
    } catch (e) {
        console.error(e);
    }

    const currentScreen = screens.find(s => s.id === initialScreen) || screens[0];

    const renderComponent = (comp, idx) => {
        if (!comp) return null;
        switch(comp.type) {
            case 'TextHeading':
                return <h3 key={idx} className="font-bold text-slate-800 text-lg mb-2">{comp.text}</h3>;
            case 'TextSubheading':
                return <h4 key={idx} className="font-semibold text-slate-700 text-base mb-2">{comp.text}</h4>;
            case 'TextBody':
                return <p key={idx} className="text-slate-600 text-sm mb-4 leading-relaxed">{comp.text}</p>;
            case 'TextInput':
                return (
                    <div key={idx} className="mb-4">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">{comp.label}</label>
                        <input type="text" placeholder={comp.label} disabled className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-lg text-sm" />
                    </div>
                );
            case 'TextArea':
                return (
                    <div key={idx} className="mb-4">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">{comp.label}</label>
                        <textarea placeholder={comp.label} disabled rows={3} className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-lg text-sm resize-none"></textarea>
                    </div>
                );
            case 'Dropdown':
                return (
                    <div key={idx} className="mb-4">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">{comp.label}</label>
                        <select disabled className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-lg text-sm text-slate-400">
                            <option>Select an option...</option>
                        </select>
                    </div>
                );
            case 'RadioButtonsGroup':
                return (
                    <div key={idx} className="mb-4">
                        <label className="block text-xs font-semibold text-slate-500 mb-2">{comp.label}</label>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <input type="radio" disabled className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-slate-600">Option 1</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="radio" disabled className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-slate-600">Option 2</span>
                            </div>
                        </div>
                    </div>
                );
            case 'OptIn':
                return (
                    <div key={idx} className="mb-4 flex items-start gap-2">
                        <input type="checkbox" disabled className="mt-1" />
                        <span className="text-xs text-slate-500 leading-tight">{comp.label || 'Opt-in required'}</span>
                    </div>
                );
            case 'Image':
                return (
                    <div key={idx} className="mb-4 w-full h-32 bg-slate-200 rounded-lg flex items-center justify-center">
                        <span className="text-slate-400 text-xs">Image Placeholder</span>
                    </div>
                );
            case 'Footer':
                return (
                    <div key={idx} className="mt-8 pt-4 border-t border-slate-200">
                        <button disabled className="w-full py-3 bg-[#00a884] text-white font-semibold rounded-full text-sm shadow-sm">
                            {comp.label || 'Submit'}
                        </button>
                    </div>
                );
            default:
                return <div key={idx} className="p-2 border border-dashed border-slate-300 text-xs text-slate-400 mb-2">{comp.type} Component</div>;
        }
    };

    return (
        <div className="w-[320px] shrink-0 bg-[#f0f2f5] rounded-[2rem] border-8 border-slate-800 shadow-2xl relative overflow-hidden flex flex-col h-[650px]">
            {/* Phone Top Bar */}
            <div className="bg-[#075e54] text-white px-4 py-3 flex items-center gap-3 shrink-0">
                <ChevronLeft size={20} />
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <User size={18} />
                </div>
                <div>
                    <div className="font-medium text-sm leading-tight">Business Account</div>
                    <div className="text-[11px] text-white/70">bot</div>
                </div>
            </div>

            {/* Simulated Chat Message to Open Flow */}
            <div className="p-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-cover bg-blend-multiply bg-[#e5ddd5]/40 h-24 shrink-0 flex items-center">
                <div className="bg-white p-3 rounded-lg max-w-[85%] shadow-sm w-full">
                    <p className="text-sm text-slate-800 mb-2">Please fill out this form.</p>
                    <button className="w-full text-[#00a884] font-medium text-sm border border-[#00a884] rounded py-1 bg-[#00a884]/5">Open Flow</button>
                </div>
            </div>

            {/* Actual Flow Modal overlay simulation */}
            <div className="flex-1 bg-white rounded-t-xl shadow-[0_-4px_10px_rgba(0,0,0,0.1)] flex flex-col relative overflow-hidden z-10 mt-[-10px]">
                {/* Modal Header */}
                <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-3 bg-white">
                    <button className="text-slate-500"><ChevronLeft size={20} /></button>
                    <span className="font-semibold text-slate-800 text-sm truncate">{currentScreen?.title || 'Loading Screen...'}</span>
                </div>
                
                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-4 pb-8 custom-scrollbar">
                    {currentScreen?.layout?.children?.map((comp, idx) => renderComponent(comp, idx))}
                    {!currentScreen?.layout?.children?.length && (
                        <div className="text-center text-slate-400 mt-10 text-sm">Add components to screen</div>
                    )}
                </div>
            </div>
        </div>
    );
}
