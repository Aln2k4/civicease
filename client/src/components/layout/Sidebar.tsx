import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, FileText, Users, UserPlus, Building2, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useContext } from 'react'
import { AuthContext } from '@/context/AuthContext'

export function Sidebar() {
    const location = useLocation();
    const pathname = location.pathname;
    const navigate = useNavigate();
    const auth = useContext(AuthContext);

    const navItems = [
        { href: "/dashboard", label: "Dashboard", icon: Home },
        { href: "/citizens", label: "Citizens", icon: Users },
        { href: "/families", label: "Families", icon: UserPlus },
        { href: "/services", label: "Certificates", icon: FileText },
        { href: "/officials", label: "Officials", icon: Building2 },
    ];

    const isActive = (href: string) => {
        if (href === "/dashboard" && pathname === "/dashboard") return true;
        if (href !== "/dashboard" && pathname.startsWith(href)) return true;
        return false;
    };

    const handleLogout = () => {
        if (auth?.logout) {
            auth.logout();
            navigate('/', { replace: true });
        }
    };

    return (
        <div className="hidden border-r bg-primary text-primary-foreground md:block w-[220px] lg:w-[280px] h-screen fixed left-0 top-0 overflow-y-auto shadow-xl z-50">
            <div className="flex h-full flex-col">
                <div className="flex h-20 items-center px-6 border-b border-primary-foreground/10 bg-primary-foreground/5">
                    <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
                        <Building2 className="h-6 w-6 text-accent" />
                        <span className="text-xl tracking-tight font-bold">CivicEase</span>
                    </Link>
                </div>

                <div className="flex-1 py-6">
                    <nav className="grid items-start px-4 text-sm font-medium gap-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200 group ${isActive(item.href)
                                    ? "bg-accent text-accent-foreground shadow-md"
                                    : "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-white"
                                    }`}
                            >
                                <item.icon className={`h-5 w-5 ${isActive(item.href) ? "text-accent-foreground" : "text-primary-foreground/70 group-hover:text-white"}`} />
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto p-6 border-t border-primary-foreground/10">
                    <Button
                        variant="ghost"
                        className="w-full flex gap-2 justify-start text-primary-foreground/70 hover:text-white hover:bg-primary-foreground/10"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-5 w-5" />
                        Logout
                    </Button>
                </div>
            </div>
        </div>
    )
}
