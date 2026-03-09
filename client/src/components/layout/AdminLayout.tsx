import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Terminal, Users, UserPlus, FileText, LogOut, Code, Cpu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export default function AdminLayout() {
    const location = useLocation();
    const pathname = location.pathname;
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const navItems = [
        { href: "/dashboard", label: "System Monitor", icon: Cpu },
        { href: "/citizens", label: "Citizen Data", icon: Users },
        { href: "/families", label: "Family Trees", icon: UserPlus },
        { href: "/services", label: "Digital Services", icon: FileText },
    ];

    const isActive = (href: string) => {
        if (href === "/dashboard" && pathname === "/dashboard") return true;
        if (href !== "/dashboard" && pathname.startsWith(href)) return true;
        return false;
    };

    const handleLogout = () => {
        if (logout) {
            logout();
            navigate('/', { replace: true });
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#050505] text-green-500 font-mono flex">
            {/* Sidebar */}
            <div className="hidden border-r border-green-500/20 bg-black md:block w-[220px] lg:w-[280px] h-screen fixed left-0 top-0 overflow-y-auto shadow-[0_0_15px_rgba(34,197,94,0.1)] z-50">
                <div className="flex h-full flex-col">
                    <div className="flex h-20 items-center px-6 border-b border-green-500/20 bg-green-500/5">
                        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-green-500 hover:text-green-400 transition-colors">
                            <Terminal className="h-6 w-6" />
                            <span className="text-xl tracking-wider">ROOT_ACCESS</span>
                        </Link>
                    </div>

                    <div className="flex-1 py-6">
                        <nav className="grid items-start px-4 text-sm font-medium gap-2">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    className={`flex items-center gap-3 rounded-none px-4 py-3 transition-all duration-200 border-l-2 ${isActive(item.href)
                                        ? "bg-green-500/10 border-green-500 text-green-400 font-bold"
                                        : "border-transparent text-green-600/60 hover:bg-green-500/5 hover:text-green-500 hover:border-green-500/50"
                                        }`}
                                >
                                    <item.icon className="h-4 w-4" />
                                    <span>[{item.label}]</span>
                                </Link>
                            ))}
                        </nav>
                    </div>

                    <div className="mt-auto p-4 border-t border-green-500/20 bg-black">
                        <div className="text-xs text-green-600/50 mb-4 px-2 font-mono break-all">
                            ID: {user?._id || "SYSTEM_ADMIN_HASH"}<br />
                            ROLE: {(user?.role || 'Admin').toUpperCase()}
                        </div>
                        <Button
                            variant="ghost"
                            className="w-full flex gap-2 justify-start text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-none border border-transparent hover:border-red-500/30 transition-all font-mono uppercase text-xs"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4" />
                            TERMINATE_SESSION
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-col sm:pl-14 lg:pl-[280px] w-full min-h-screen">
                {/* Header */}
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 bg-black/90 backdrop-blur-md px-6 border-b border-green-500/20 shadow-sm shadow-green-500/5 font-mono justify-between">
                    <div className="flex items-center gap-2 text-green-500/70 text-sm">
                        <Code className="h-4 w-4" />
                        <span>civicease_core_node v1.0.0</span>
                        <span className="animate-pulse font-bold text-green-500">_</span>
                    </div>
                    <div className="text-xs text-green-600/50">
                        {new Date().toISOString().split('T')[0]} [RUNNING]
                    </div>
                </header>

                {/* Page View */}
                <div className="flex-1 p-6 relative">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.03)_1px,transparent_1px)] bg-[size:100px_100px] pointer-events-none" />
                    <div className="relative z-10">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
}
