import React from 'react';
import { User } from 'lucide-react';

export default function PhonePreview({ templateData }) {
    const { name, category, language, format, components = [] } = templateData;

    const getComponent = (type) => components.find(c => c.type === type) || {};

    const header = getComponent('HEADER');
    const body = getComponent('BODY');
    const footer = getComponent('FOOTER');
    const buttons = getComponent('BUTTONS');

    // Substitute variables in body
    let bodyText = body.text || '';
    if (body.example && bodyText) {
        if (format === 'named' && body.example.body_text_named_params) {
            body.example.body_text_named_params.forEach(param => {
                bodyText = bodyText.replace(`{{${param.param_name}}}`, param.example || `{{${param.param_name}}}`);
            });
        } else if (format === 'positional' && body.example.body_text && body.example.body_text[0]) {
            body.example.body_text[0].forEach((val, index) => {
                bodyText = bodyText.replace(`{{${index + 1}}}`, val || `{{${index + 1}}}`);
            });
        }
    }

    return (
        <div className="w-[320px] shrink-0 bg-[#e5ddd5] rounded-[2rem] border-8 border-slate-800 shadow-2xl relative overflow-hidden flex flex-col h-[650px]">
            {/* Phone Top Bar */}
            <div className="bg-[#075e54] text-white px-4 py-3 flex items-center gap-3 shrink-0">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <User size={18} />
                </div>
                <div>
                    <div className="font-medium text-sm leading-tight">Business Account</div>
                    <div className="text-[11px] text-white/70">WhatsApp</div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-4 overflow-y-auto" style={{
                backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
                backgroundSize: 'cover',
                backgroundBlendMode: 'multiply',
                backgroundColor: 'rgba(229, 221, 213, 0.4)'
            }}>
                <div className="bg-white rounded-lg rounded-tl-none p-2 shadow-sm max-w-[90%] float-left">
                    {/* Header */}
                    {header.format === 'TEXT' && header.text && (
                        <div className="font-bold text-slate-800 mb-1">{header.text}</div>
                    )}
                    {header.format === 'IMAGE' && (
                        <div className="w-full h-32 bg-slate-200 rounded-md mb-2 flex items-center justify-center text-slate-400 text-xs">
                            📷 Image Header
                        </div>
                    )}
                    {header.format === 'VIDEO' && (
                        <div className="w-full h-32 bg-slate-200 rounded-md mb-2 flex items-center justify-center text-slate-400 text-xs">
                            🎥 Video Header
                        </div>
                    )}
                    {header.format === 'DOCUMENT' && (
                        <div className="w-full p-3 bg-slate-100 rounded-md mb-2 flex items-center gap-2 text-slate-600 text-xs">
                            📄 Document Header
                        </div>
                    )}

                    {/* Body */}
                    <div className="text-[13px] text-slate-800 whitespace-pre-wrap">
                        {bodyText || 'Start typing to see preview...'}
                    </div>

                    {/* Footer */}
                    {footer.text && (
                        <div className="text-[11px] text-slate-500 mt-2">
                            {footer.text}
                        </div>
                    )}
                </div>

                {/* Buttons */}
                {buttons.buttons && buttons.buttons.length > 0 && (
                    <div className="max-w-[90%] float-left clear-both mt-1 space-y-1 w-full">
                        {buttons.buttons.map((btn, idx) => (
                            <div key={idx} className="bg-white rounded-lg p-2 text-center text-[13px] text-[#00a884] font-medium shadow-sm">
                                {btn.type === 'URL' && '🔗 '}
                                {btn.type === 'PHONE_NUMBER' && '📞 '}
                                {btn.text || 'Button Text'}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
