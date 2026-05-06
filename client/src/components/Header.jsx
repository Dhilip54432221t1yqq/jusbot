import WorkspaceSwitcher from './WorkspaceSwitcher';
import UserDropdown from './UserDropdown';
import { Bell, Search } from 'lucide-react';

export default function Header() {
    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 sticky top-0 z-30" style={{ height: 72 }}>
            <div className="flex items-center justify-between h-full">
                {/* Left — Logo only */}
                <div className="flex items-center h-full">
                    <div className="flex items-center h-full" style={{ minWidth: 140 }}>
                        <img 
                            src="https://cjlngemrulrgmlhixjbs.supabase.co/storage/v1/object/public/brand-assets/jusbot_logo.jpg" 
                            alt="JusBot" 
                            style={{
                                height: 46,
                                width: "auto",
                                objectFit: "contain",
                                borderRadius: 4,
                            }}
                        />
                    </div>
                </div>

                {/* Right — Search, Workspace, Bell, User */}
                <div className="flex items-center gap-3">
                    <div className="relative hidden lg:block group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-500 transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="Quick search..." 
                            className="bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2 text-xs font-medium w-56 focus:ring-2 focus:ring-green-500/20 transition-all focus:bg-white focus:shadow-sm"
                        />
                    </div>
                    <WorkspaceSwitcher />
                    <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all relative">
                        <Bell size={19} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                    <UserDropdown />
                </div>
            </div>
        </header>
    );
}
