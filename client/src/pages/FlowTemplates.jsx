import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MessageSquare, LayoutGrid, CheckCircle, ArrowRight, Play, Edit3, ShoppingCart, Key, Sparkles, Building2, Laptop, ShieldAlert, BookOpen } from "lucide-react";
import { supabase } from "../db";
import { useAuth } from "../contexts/AuthContext";

export default function FlowTemplates() {
    const { workspaceId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [activeCategory, setActiveCategory] = useState("Ecommerce");
    const [flowsList, setFlowsList] = useState([]);
    const [appliedFlows, setAppliedFlows] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const categories = [
        { name: "Ecommerce", icon: ShoppingCart },
        { name: "Real Estate", icon: Building2 },
        { name: "SaaS & Tech", icon: Laptop },
        { name: "Healthcare", icon: ShieldAlert },
        { name: "Education", icon: BookOpen }
    ];

    const templates = {
        "Ecommerce": [
            {
                id: "winback_21d",
                name: "Winback Flow \"21 days\"",
                flowName: "Winback Flow \"21 days\" Flow",
                whatsappTemplate: "winback_21_days_template",
                description: "Re-engage customers who haven't purchased in the last 21 days with a friendly nudge.",
                message: "Hey! We missed you. 😊 It's been 21 days since your last visit. Here is a special 10% coupon: WEBACK10. Shop now!"
            },
            {
                id: "winback_60d",
                name: "Winback Flow \"60 days\"",
                flowName: "Winback Flow \"60 days\" Flow",
                whatsappTemplate: "winback_60_days_template",
                description: "Recover inactive buyers after 60 days with a stronger discount offer.",
                message: "We miss you! It has been 60 days since your last order. Get 15% off today with coupon: MISSYOU15. Check our latest products!"
            },
            {
                id: "winback_90d",
                name: "Winback Flow \"90 days\"",
                flowName: "Winback Flow \"90 days\" Flow",
                whatsappTemplate: "winback_90_days_template",
                description: "Ultimate recovery sequence for customers inactive for 90 days. Offers a high-value incentive.",
                message: "It's been 90 days! We'd love to welcome you back. Enjoy a massive 20% discount on your next order: WINBACK20."
            }
        ],
        "Real Estate": [
            {
                id: "property_lead",
                name: "New Property Inquiry",
                flowName: "Property Inquiry Welcome Flow",
                whatsappTemplate: "property_inquiry_new",
                description: "Instantly greet leads looking at property listings and schedule tours.",
                message: "Thank you for inquiring about our properties! 🏠 Would you like to view our digital brochure or schedule a live property tour?"
            }
        ],
        "SaaS & Tech": [
            {
                id: "saas_onboarding",
                name: "Onboarding Sequence",
                flowName: "Onboarding Sequence Flow",
                whatsappTemplate: "saas_onboarding_welcome",
                description: "Welcome new signups, send setup guides, and boost activation rates.",
                message: "Welcome aboard! 🚀 Your trial account is set up. Let's configure your first workspace. Type 'Setup' to begin."
            }
        ],
        "Healthcare": [
            {
                id: "appointment_remind",
                name: "Appointment Reminder",
                flowName: "Appointment Reminder Flow",
                whatsappTemplate: "appt_remind_patient",
                description: "Automated healthcare and checkup notifications.",
                message: "Friendly reminder: You have an appointment tomorrow at 10:00 AM. 🏥 Type 'Confirm' or 'Reschedule'."
            }
        ],
        "Education": [
            {
                id: "course_welcome",
                name: "New Course Student Welcome",
                flowName: "Student Onboarding Flow",
                whatsappTemplate: "edu_student_welcome",
                description: "Send access instructions and syllabus information to new students.",
                message: "Welcome to the course! 📚 Here is your syllabus and link to the portal. Class starts Monday."
            }
        ]
    };

    useEffect(() => {
        if (workspaceId) {
            fetchExistingFlows();
        }
    }, [workspaceId]);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    const fetchExistingFlows = async () => {
        try {
            const { data, error } = await supabase
                .from('flows')
                .select('id, name')
                .eq('workspace_id', workspaceId);
            
            if (data) {
                setFlowsList(data);
                // Map templates to database flow IDs if names match
                const mapping = {};
                // Flatten all templates to check match
                Object.values(templates).flat().forEach(tmpl => {
                    const matchedFlow = data.find(f => f.name === tmpl.flowName);
                    if (matchedFlow) {
                        mapping[tmpl.id] = matchedFlow.id;
                    }
                });
                setAppliedFlows(mapping);
            }
        } catch (e) {
            console.error("Error fetching flows:", e);
        }
    };

    const handleApply = async (template) => {
        setIsLoading(true);
        try {
            // Check if already applied
            if (appliedFlows[template.id]) {
                showToast("Template already applied!", "info");
                setIsLoading(false);
                return;
            }

            // Get logged-in user ID
            const currentUserId = user?.id || (await supabase.auth.getUser()).data.user?.id;
            if (!currentUserId) {
                showToast("Please log in to apply templates", "error");
                setIsLoading(false);
                return;
            }

            // Create dummy flow structure
            const dummyNodes = [
                {
                    id: "start",
                    type: "start",
                    position: { x: 400, y: 150 },
                    data: { label: "Start", actions: [] }
                },
                {
                    id: "msg-1",
                    type: "message",
                    position: { x: 400, y: 300 },
                    data: {
                        text: template.message,
                        buttons: []
                    }
                }
            ];

            const dummyEdges = [
                {
                    id: "e-start-msg-1",
                    source: "start",
                    target: "msg-1",
                    type: "default",
                    animated: false,
                    style: { strokeWidth: 4.5, stroke: "#ffffff" }
                }
            ];

            const newFlow = {
                name: template.flowName,
                user_id: currentUserId,
                workspace_id: workspaceId,
                nodes: dummyNodes.length,
                flow_data: { nodes: dummyNodes, edges: dummyEdges },
                preview: "main",
                workspace_name: "WhatsApp Bot"
            };

            const { data, error } = await supabase
                .from('flows')
                .insert([newFlow])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                setAppliedFlows(prev => ({ ...prev, [template.id]: data.id }));
                showToast(`Applied "${template.name}" successfully!`);
                fetchExistingFlows();
            }
        } catch (err) {
            console.error(err);
            showToast("Failed to apply template: " + err.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (flowId) => {
        navigate(`/${workspaceId}/flow-builder/${flowId}`);
    };

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0 shadow-sm">
                <h1 className="text-base font-bold text-slate-800 leading-tight">Prefilled Templates</h1>
            </header>

            {/* Main Area */}
            <div className="flex-1 p-8 overflow-y-auto w-full">
                
                {/* Categories Tab Selectors */}
                <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white border border-slate-200/60 rounded-2xl shadow-sm w-fit mb-8">
                    {categories.map(cat => {
                        const isActive = activeCategory === cat.name;
                        return (
                            <button 
                                key={cat.name} 
                                onClick={() => setActiveCategory(cat.name)}
                                className={`px-6 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-300 ${
                                    isActive 
                                        ? 'bg-gradient-to-r from-emerald-500 to-[#25D366] text-white shadow-md shadow-green-200 scale-[1.02]' 
                                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                }`}
                            >
                                {cat.name}
                            </button>
                        );
                    })}
                </div>

                {/* Grid list of templates (Cart style cards) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {templates[activeCategory]?.map(tmpl => {
                        const isApplied = !!appliedFlows[tmpl.id];
                        const flowId = appliedFlows[tmpl.id];

                        return (
                            <div 
                                key={tmpl.id}
                                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-xl hover:border-slate-300 hover:scale-[1.01] transition-all duration-300 group"
                            >
                                {/* Cart top layout */}
                                <div className="p-6 border-b border-slate-100 flex-1">
                                    <div className="flex items-start justify-end gap-4 mb-4 min-h-[24px]">
                                        {isApplied && (
                                            <span className="flex items-center gap-1 text-[10px] bg-green-50 border border-green-200 text-green-700 font-bold px-2.5 py-0.5 rounded-full">
                                                <CheckCircle size={10} className="fill-green-700 stroke-white" />
                                                Applied
                                            </span>
                                        )}
                                    </div>
                                    
                                    <h3 className="font-extrabold text-slate-800 text-base leading-snug group-hover:text-emerald-600 transition-colors">
                                        {tmpl.name}
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-2 leading-relaxed min-h-[40px]">
                                        {tmpl.description}
                                    </p>

                                    <div className="mt-5 space-y-2 bg-slate-50 border border-slate-100 rounded-2xl p-3.5 text-[11px]">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Flow Name:</span>
                                            <span className="font-bold text-slate-700 truncate max-w-[160px]">{tmpl.flowName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">WhatsApp Template:</span>
                                            <span className="font-semibold text-slate-600 font-mono">{tmpl.whatsappTemplate}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Cart bottom actions */}
                                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 shrink-0">
                                    {!isApplied ? (
                                        <button 
                                            onClick={() => handleApply(tmpl)}
                                            disabled={isLoading}
                                            className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-[#25D366] text-white font-bold text-xs rounded-xl hover:shadow-lg hover:shadow-green-200 hover:scale-[1.01] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                                        >
                                            Apply Template
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => handleEdit(flowId)}
                                            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-1.5"
                                        >
                                            <Edit3 size={12} />
                                            Edit Flow builder
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Toast System */}
            <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0 pointer-events-none'}`}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-900 border-slate-700 text-white'}`}>
                    <CheckCircle size={16} className="text-green-400" />
                    {toast.message}
                </div>
            </div>
        </div>
    );
}
