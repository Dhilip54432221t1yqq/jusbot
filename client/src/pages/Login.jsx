/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Lock, Mail, Shield } from "lucide-react";
import { supabase } from "../supabase";

export default function LoginPage() {
    const navigate = useNavigate();
    const [showPass, setShowPass] = useState(false);
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState("");
    const [mounted, setMounted] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotSuccess, setForgotSuccess] = useState(false);
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [lockoutUntil, setLockoutUntil] = useState(null);
    const [showWorkspaceInput, setShowWorkspaceInput] = useState(false);
    const [workspaceName, setWorkspaceName] = useState("");
    const [loggedInUser, setLoggedInUser] = useState(null);

    useEffect(() => {
        const link = document.createElement("link");
        link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Sora:wght@600;700;800&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);
        setTimeout(() => setMounted(true), 100);

        // Check for existing session and redirect if logged in
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: workspaces } = await supabase
                    .from('workspaces')
                    .select('id')
                    .eq('user_id', session.user.id)
                    .order('created_at', { ascending: false })
                    .limit(1);
                if (workspaces && workspaces.length > 0) {
                    navigate(`/${workspaces[0].id}/dashboard`, { replace: true });
                } else {
                    setLoggedInUser(session.user);
                    setShowWorkspaceInput(true);
                }
            }
        };
        checkSession();
    }, [navigate]);

    const handleForgotPassword = async () => {
        if (!forgotEmail) {
            setErrorMsg("Please enter your email address.");
            return;
        }
        setForgotLoading(true);
        setErrorMsg("");
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
                redirectTo: `${window.location.origin}/`
            });
            if (error) throw error;
            setForgotSuccess(true);
        } catch (error) {
            setErrorMsg(error instanceof Error ? error.message : "Failed to send reset email.");
        } finally {
            setForgotLoading(false);
        }
    };

    const handleAuth = async () => {
        if (!email || !pass) {
            setErrorMsg("Please enter both email and password.");
            return;
        }

        // Client-side rate limiting
        if (lockoutUntil && Date.now() < lockoutUntil) {
            const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
            setErrorMsg(`Too many attempts. Please wait ${remaining} seconds.`);
            return;
        }

        setErrorMsg("");
        setLoading(true);

        try {
            console.log('Attempting auth for:', email);
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password: pass,
                });
                if (error) throw error;
                if (data?.user?.identities?.length === 0) {
                    setErrorMsg("This email is already registered. Please sign in instead.");
                } else {
                    alert("Check your email for the confirmation link!");
                    setIsSignUp(false);
                }
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password: pass,
                });
                if (error) {
                    console.error('SignIn Error:', error);
                    throw error;
                }

                const user = data.user;
                if (user) {
                    console.log('User logged in:', user.id);
                    
                    // Upsert profile for members management
                    await supabase
                        .from('profiles')
                        .upsert({ id: user.id, email: user.email }, { onConflict: 'id' });

                    // Check for existing workspace
                    let { data: workspaces, error: wsError } = await supabase
                        .from('workspaces')
                        .select('id')
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false })
                        .limit(1);

                    console.log('Existing workspaces:', workspaces, 'Error:', wsError);

                    let workspaceId;
                    if (wsError) {
                        console.error('Workspace fetch error:', wsError);
                        throw wsError;
                    }

                    if (workspaces && workspaces.length > 0) {
                        workspaceId = workspaces[0].id;
                        console.log('Redirecting to workspace:', workspaceId);
                        void navigate(`/${workspaceId}/dashboard`);
                    } else {
                        console.log('No workspace found, showing inline input...');
                        setLoggedInUser(user);
                        setShowWorkspaceInput(true);
                    }
                }
            }
        } catch (error) {
            console.error('Auth handler caught error:', error);
            setErrorMsg(error instanceof Error ? error.message : "An unexpected error occurred: " + JSON.stringify(error));
            // Increment login attempts for rate limiting
            const newAttempts = loginAttempts + 1;
            setLoginAttempts(newAttempts);
            if (newAttempts >= 5) {
                setLockoutUntil(Date.now() + 30000); // 30 second lockout
                setErrorMsg("Too many failed attempts. Please wait 30 seconds before trying again.");
                setTimeout(() => {
                    setLoginAttempts(0);
                    setLockoutUntil(null);
                }, 30000);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateWorkspace = async () => {
        if (!workspaceName.trim()) {
            setErrorMsg("Please enter a workspace name.");
            return;
        }

        setLoading(true);
        setErrorMsg("");

        try {
            const user = loggedInUser;
            
            // 1. Create Workspace
            const { data: workspace, error: wsError } = await supabase
                .from('workspaces')
                .insert([{ name: workspaceName, user_id: user.id }])
                .select()
                .single();

            if (wsError) throw wsError;

            // 2. Add as Owner
            const { error: memError } = await supabase
                .from('workspace_members')
                .insert({
                    workspace_id: workspace.id,
                    user_id: user.id,
                    role: 'owner'
                });
            
            if (memError && memError.code !== '23505') throw memError;

            // 3. Create Default Fields
            const defaultFields = [
                { name: 'User Name', type: 'Text', workspace_id: workspace.id },
                { name: 'User Id', type: 'Number', workspace_id: workspace.id },
                { name: 'Phone', type: 'Text', workspace_id: workspace.id },
                { name: 'Email', type: 'Text', workspace_id: workspace.id },
                { name: 'Last User Input', type: 'Text', workspace_id: workspace.id }
            ];

            await supabase.from('user_fields').insert(defaultFields);

            console.log('Workspace created, redirecting...');
            navigate(`/${workspace.id}/dashboard`);

        } catch (error) {
            console.error('Error creating workspace:', error);
            setErrorMsg(error instanceof Error ? error.message : "Failed to create workspace.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            fontFamily: "'Inter', sans-serif",
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f0fdf4", // Very light green background
        }}>

            {/* Card */}
            <div style={{
                display: "flex",
                width: 1100, // Increased width
                minHeight: 650, // Increased height
                background: "#ffffff",
                borderRadius: 24,
                overflow: "hidden",
                boxShadow: "0 4px 40px rgba(0,0,0,0.08)",
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)",
            }}>

                {/* LEFT — Brand Panel */}
                <div style={{
                    width: 400, // Increased panel width
                    background: "linear-gradient(160deg, #22c55e 0%, #16a34a 100%)", // Green gradient
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "48px 40px",
                    position: "relative",
                    overflow: "hidden",
                }}>
                    {/* Subtle circle decoration */}
                    <div style={{
                        position: "absolute", bottom: -80, right: -80,
                        width: 260, height: 260,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.06)",
                    }} />
                    <div style={{
                        position: "absolute", top: -40, left: -60,
                        width: 180, height: 180,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.05)",
                    }} />

                    {/* Logo */}
                    <div>
                        <div style={{ display: "flex", alignItems: "center", marginBottom: 48 }}>
                            <img 
                                src="https://cjlngemrulrgmlhixjbs.supabase.co/storage/v1/object/public/brand-assets/jusbot_logo.jpg" 
                                alt="JusBot" 
                                style={{
                                    height: 48,
                                    width: "auto",
                                    objectFit: "contain",
                                    borderRadius: 8,
                                }}
                            />
                        </div>

                        {/* Headline */}
                        <h2 style={{
                            fontFamily: "'Sora', sans-serif",
                            fontWeight: 700, fontSize: 28,
                            color: "#fff", letterSpacing: "-0.03em",
                            lineHeight: 1.25, margin: "0 0 14px",
                        }}>
                            Automate your conversations
                        </h2>
                        <p style={{
                            fontSize: 14, color: "rgba(255,255,255,0.85)", // Slightly more opaque
                            lineHeight: 1.7, margin: 0, letterSpacing: "-0.01em",
                        }}>
                            The smart WhatsApp chatbot platform built for modern businesses.
                        </p>
                    </div>

                    {/* Bottom tag */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "12px 16px",
                        background: "rgba(255,255,255,0.08)",
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.1)",
                    }}>
                        <Shield size={14} color="rgba(255,255,255,0.9)" />
                        <span style={{
                            fontSize: 12, color: "rgba(255,255,255,0.9)",
                            letterSpacing: "-0.01em",
                        }}>
                            256-bit SSL · Enterprise secure
                        </span>
                    </div>
                </div>

                {/* RIGHT — Form Panel */}
                <div style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "48px 52px",
                }}>
                    <div style={{ width: "100%", maxWidth: 380 }}>

                        {/* Header */}
                        <div style={{ marginBottom: 32 }}>
                            <h3 style={{
                                fontFamily: "'Sora', sans-serif",
                                fontWeight: 700, fontSize: 26,
                                color: "#111", margin: "0 0 8px",
                                letterSpacing: "-0.03em",
                            }}>{isSignUp ? "Sign up" : "Sign in"}</h3>
                        </div>

                        {/* Error Message */}
                        {errorMsg && (
                            <div style={{
                                marginBottom: 16, padding: "10px",
                                background: "#fee2e2", color: "#b91c1c",
                                borderRadius: 8, fontSize: 13,
                                border: "1px solid #fecaca"
                            }}>
                                {errorMsg}
                            </div>
                        )}

                        {/* Email */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{
                                display: "block", marginBottom: 7,
                                fontSize: 13, fontWeight: 600,
                                color: "#444", letterSpacing: "-0.01em",
                            }}>Email</label>
                            <div style={{ position: "relative" }}>
                                <Mail size={15} style={{
                                    position: "absolute", left: 14, top: "50%",
                                    transform: "translateY(-50%)", pointerEvents: "none",
                                    color: focused === "email" ? "#22c55e" : "#ccc", // Green focus icon
                                    transition: "color 0.2s",
                                }} />
                                <input
                                    disabled={showWorkspaceInput}
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    onFocus={() => setFocused("email")}
                                    onBlur={() => setFocused("")}
                                    style={{
                                        width: "100%", padding: "12px 14px 12px 42px",
                                        border: `1.5px solid ${focused === "email" ? "#22c55e" : "#e5e7eb"}`, // Green focus border
                                        borderRadius: 10, fontSize: 14, color: "#111",
                                        outline: "none", boxSizing: "border-box",
                                        transition: "border-color 0.2s",
                                        fontFamily: "'Inter', sans-serif",
                                        background: showWorkspaceInput ? "#f9fafb" : "#fff",
                                        cursor: showWorkspaceInput ? "not-allowed" : "text",
                                    }}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: 10 }}>
                            <label style={{
                                display: "block", marginBottom: 7,
                                fontSize: 13, fontWeight: 600,
                                color: "#444", letterSpacing: "-0.01em",
                            }}>Password</label>
                            <div style={{ position: "relative" }}>
                                <Lock size={15} style={{
                                    position: "absolute", left: 14, top: "50%",
                                    transform: "translateY(-50%)", pointerEvents: "none",
                                    color: focused === "pass" ? "#22c55e" : "#ccc", // Green focus icon
                                    transition: "color 0.2s",
                                }} />
                                <input
                                    disabled={showWorkspaceInput}
                                    type={showPass ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={pass}
                                    onChange={e => setPass(e.target.value)}
                                    onFocus={() => setFocused("pass")}
                                    onBlur={() => setFocused("")}
                                    style={{
                                        width: "100%", padding: "12px 42px 12px 42px",
                                        border: `1.5px solid ${focused === "pass" ? "#22c55e" : "#e5e7eb"}`, // Green focus border
                                        borderRadius: 10, fontSize: 14, color: "#111",
                                        outline: "none", boxSizing: "border-box",
                                        transition: "border-color 0.2s",
                                        fontFamily: "'Inter', sans-serif",
                                        background: showWorkspaceInput ? "#f9fafb" : "#fff",
                                        cursor: showWorkspaceInput ? "not-allowed" : "password",
                                    }}
                                />
                                <button 
                                    disabled={showWorkspaceInput}
                                    onClick={() => setShowPass(!showPass)} 
                                    style={{
                                        position: "absolute", right: 12, top: "50%",
                                        transform: "translateY(-50%)",
                                        background: "none", border: "none",
                                        cursor: showWorkspaceInput ? "not-allowed" : "pointer", 
                                        color: "#bbb", display: "flex", padding: 4,
                                    }}>
                                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        {showWorkspaceInput && (
                            <div style={{ marginTop: 20, marginBottom: 20 }}>
                                <label style={{
                                    display: "block", marginBottom: 7,
                                    fontSize: 13, fontWeight: 600,
                                    color: "#444", letterSpacing: "-0.01em",
                                }}>Workspace Name</label>
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="e.g. Acme Corp"
                                    value={workspaceName}
                                    onChange={e => setWorkspaceName(e.target.value)}
                                    style={{
                                        width: "100%", padding: "12px 14px",
                                        border: "1.5px solid #22c55e", 
                                        borderRadius: 10, fontSize: 14, color: "#111",
                                        outline: "none", boxSizing: "border-box",
                                        fontFamily: "'Inter', sans-serif",
                                        background: "#fff",
                                    }}
                                />
                                <div style={{ textAlign: 'center', marginTop: 12 }}>
                                    <span 
                                        onClick={async () => {
                                            await supabase.auth.signOut();
                                            setShowWorkspaceInput(false);
                                            setLoggedInUser(null);
                                            setEmail("");
                                            setPass("");
                                        }}
                                        style={{ fontSize: 12, color: '#666', cursor: 'pointer', fontWeight: 600 }}
                                    >
                                        Sign out / Use different account
                                    </span>
                                </div>
                            </div>
                        )}

                        {!isSignUp && !showWorkspaceInput && (
                            <div style={{ textAlign: "right", marginBottom: 26 }}>
                                <span
                                    onClick={() => {
                                        setShowForgotPassword(true);
                                        setForgotEmail(email);
                                        setForgotSuccess(false);
                                        setErrorMsg("");
                                    }}
                                    style={{
                                        fontSize: 13, color: "#22c55e",
                                        fontWeight: 600, cursor: "pointer",
                                    }}>Forgot password?</span>
                            </div>
                        )}

                        {isSignUp && !showWorkspaceInput && <div style={{ marginBottom: 26 }}></div>}

                        {/* Button */}
                        <button
                            onClick={() => { if (showWorkspaceInput) void handleCreateWorkspace(); else void handleAuth(); }}
                            disabled={loading}
                            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#16a34a"; }} // Green-600 hover
                            onMouseLeave={e => { e.currentTarget.style.background = "#22c55e"; }} // Green-500 normal
                            style={{
                                width: "100%", padding: "13px 20px",
                                background: loading ? "#86efac" : "#22c55e", // Light green loading, Green-500 normal
                                border: "none", borderRadius: 10,
                                color: "#fff", fontSize: 14, fontWeight: 700,
                                cursor: loading ? "not-allowed" : "pointer",
                                display: "flex", alignItems: "center",
                                justifyContent: "center", gap: 8,
                                transition: "background 0.2s",
                                fontFamily: "'Sora', sans-serif",
                                letterSpacing: "-0.01em",
                            }}
                        >
                            {loading ? (
                                <>
                                    <div style={{
                                        width: 16, height: 16,
                                        border: "2px solid rgba(255,255,255,0.35)",
                                        borderTop: "2px solid #fff",
                                        borderRadius: "50%",
                                        animation: "spin 0.8s linear infinite",
                                    }} />
                                    {showWorkspaceInput ? "Creating Workspace..." : (isSignUp ? "Signing up..." : "Signing in...")}
                                </>
                            ) : (
                                <>{showWorkspaceInput ? "Create Workspace" : (isSignUp ? "Sign Up" : "Sign In")} <ArrowRight size={15} /></>
                            )}
                        </button>

                        {/* Terms */}
                        <p style={{
                            marginTop: 20, textAlign: "center",
                            fontSize: 12, color: "#bbb", lineHeight: 1.6,
                        }}>
                            By {isSignUp ? "signing up" : "signing in"} you agree to our{" "}
                            <span style={{ color: "#888", cursor: "pointer" }}>Terms</span>
                            {" "}&{" "}
                            <span style={{ color: "#888", cursor: "pointer" }}>Privacy Policy</span>
                        </p>

                    </div>
                </div>

            </div>

            <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        input::placeholder { color: #d1d5db !important; }
        * { box-sizing: border-box; }
      `}</style>

            {/* Forgot Password Modal */}
            {showForgotPassword && (
                <div style={{
                    position: "fixed", inset: 0,
                    background: "rgba(0,0,0,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    zIndex: 100,
                }}>
                    <div style={{
                        background: "#fff", borderRadius: 20, padding: 32,
                        maxWidth: 400, width: "90%",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                    }}>
                        <h4 style={{
                            fontFamily: "'Sora', sans-serif",
                            fontWeight: 700, fontSize: 20,
                            color: "#111", margin: "0 0 8px",
                        }}>Reset your password</h4>
                        <p style={{ fontSize: 13, color: "#999", margin: "0 0 20px" }}>
                            Enter your email and we'll send you a reset link.
                        </p>
                        {forgotSuccess ? (
                            <div style={{
                                padding: "16px", background: "#f0fdf4",
                                borderRadius: 10, border: "1px solid #bbf7d0",
                                fontSize: 13, color: "#16a34a", marginBottom: 16,
                            }}>
                                ✓ Reset link sent! Check your inbox.
                            </div>
                        ) : (
                            <>
                                {errorMsg && (
                                    <div style={{
                                        marginBottom: 12, padding: "10px",
                                        background: "#fee2e2", color: "#b91c1c",
                                        borderRadius: 8, fontSize: 13,
                                    }}>{errorMsg}</div>
                                )}
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={forgotEmail}
                                    onChange={e => setForgotEmail(e.target.value)}
                                    style={{
                                        width: "100%", padding: "12px 14px",
                                        border: "1.5px solid #e5e7eb",
                                        borderRadius: 10, fontSize: 14, color: "#111",
                                        outline: "none", boxSizing: "border-box",
                                        marginBottom: 16,
                                        fontFamily: "'Inter', sans-serif",
                                    }}
                                />
                                <button
                                    onClick={handleForgotPassword}
                                    disabled={forgotLoading}
                                    style={{
                                        width: "100%", padding: "12px",
                                        background: forgotLoading ? "#86efac" : "#22c55e",
                                        border: "none", borderRadius: 10,
                                        color: "#fff", fontSize: 14, fontWeight: 700,
                                        cursor: forgotLoading ? "not-allowed" : "pointer",
                                        fontFamily: "'Sora', sans-serif",
                                        marginBottom: 12,
                                    }}
                                >
                                    {forgotLoading ? "Sending..." : "Send Reset Link"}
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => { setShowForgotPassword(false); setErrorMsg(""); }}
                            style={{
                                width: "100%", padding: "10px",
                                background: "transparent", border: "1px solid #e5e7eb",
                                borderRadius: 10, fontSize: 13, fontWeight: 600,
                                color: "#666", cursor: "pointer",
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            Back to Sign In
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
