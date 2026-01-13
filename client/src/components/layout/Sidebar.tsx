import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, FileText, Users, UserPlus, Building2 } from 'lucide-react'
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
        <div className="hidden border-r bg-muted/40 md:block w-[220px] lg:w-[280px] h-[calc(100vh-5rem)] fixed left-0 top-20 overflow-y-auto">
            <div className="flex h-full max-h-screen flex-col gap-2">
                {/* Branding removed as it's now in the full-width header */}
                <div className="flex-1">
                    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary hover:bg-muted ${isActive(item.href)
                                    ? "bg-muted text-primary"
                                    : "text-muted-foreground"
                                    }`}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className="mt-auto p-4">
                    <Button variant="outline" className="w-full flex gap-2" onClick={handleLogout}>
                        Logout
                    </Button>
                </div>
            </div>
        </div>
    )
}
