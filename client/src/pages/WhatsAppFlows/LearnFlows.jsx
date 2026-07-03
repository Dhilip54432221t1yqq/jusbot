import React from 'react';
import { BookOpen, Zap, MessageSquare, Shield, HelpCircle, Layers } from 'lucide-react';

export default function LearnFlows() {
    return (
        <div className="p-8 h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-12 pb-12">
                {/* Hero */}
                <div className="bg-gradient-to-r from-[#128C7E] to-[#25D366] rounded-3xl p-10 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10 max-w-2xl">
                        <h1 className="text-3xl font-bold mb-4">What are WhatsApp Flows?</h1>
                        <p className="text-lg opacity-90 leading-relaxed">
                            WhatsApp Flows allow you to create rich, interactive forms and workflows natively inside WhatsApp. 
                            Instead of relying on back-and-forth chatbot messages, you can collect leads, book appointments, 
                            and run surveys all within a seamless, app-like experience.
                        </p>
                    </div>
                    <Layers className="absolute -right-10 -bottom-10 w-64 h-64 text-white opacity-10" />
                </div>

                {/* Flows vs Messages */}
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                            <MessageSquare size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-3">Vs. Chatbot Messages</h3>
                        <p className="text-slate-600">
                            Traditional chatbots require users to answer one question at a time. This can cause high drop-off rates for complex data collection. Flows combine multiple fields into a single, structured form, dramatically improving conversion rates.
                        </p>
                    </div>
                    
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                            <Zap size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-3">Static vs Dynamic</h3>
                        <p className="text-slate-600">
                            <strong>Static Flows</strong> contain all data in the JSON and just submit a final payload. <br/><br/>
                            <strong>Dynamic Flows</strong> connect to an Endpoint URL, allowing them to fetch real-time data (like available appointment slots) during the form-filling process.
                        </p>
                    </div>
                </div>

                {/* Use Cases */}
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <BookOpen size={24} className="text-green-600" /> Common Use Cases
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                            'Lead Generation', 'Appointment Booking', 'Customer Support Forms', 
                            'Surveys & Feedback', 'Product Interest Forms', 'Sign-up / Sign-in', 
                            'Contact Us Forms'
                        ].map((useCase, i) => (
                            <div key={i} className="bg-slate-50 border border-slate-100 p-4 rounded-xl font-medium text-slate-700">
                                {useCase}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Lifecycle */}
                <div className="bg-slate-800 text-white rounded-3xl p-8">
                    <h2 className="text-2xl font-bold mb-6">The Flow Lifecycle</h2>
                    <div className="space-y-4">
                        <div className="flex gap-4 items-start">
                            <div className="w-24 shrink-0 font-bold text-blue-400">Draft</div>
                            <div className="text-slate-300">Flow is saved locally. You can freely edit and test it.</div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="w-24 shrink-0 font-bold text-green-400">Published</div>
                            <div className="text-slate-300">Flow is locked and sent to Meta. It can now be attached to Message Templates and sent to users. Once published, the JSON cannot be edited.</div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="w-24 shrink-0 font-bold text-yellow-400">Throttled</div>
                            <div className="text-slate-300">Meta has temporarily restricted the flow (usually due to endpoint errors).</div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="w-24 shrink-0 font-bold text-red-400">Blocked</div>
                            <div className="text-slate-300">Flow violates Meta policies and cannot be used.</div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="w-24 shrink-0 font-bold text-slate-400">Deprecated</div>
                            <div className="text-slate-300">You have manually retired this flow.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
