import { Bell, User, Menu, Moon, Sun, Monitor, Languages, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useNavigate } from "react-router-dom";
export function Header() {
    const { setTheme, theme } = useTheme();
    const { setLanguage, language, t } = useLanguage();
    const navigate = useNavigate();
    const { user, logout } = useAuth(); // Use AuthContext

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 bg-background px-6 shadow-sm border-b border-border/40">
            <div className="flex flex-col md:hidden">
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                </Button>
            </div>

            <div className="flex flex-col md:ml-0">
                <h1 className="text-xl font-bold tracking-tight text-primary md:text-2xl hidden md:block">
                    {user?.villageContext?.villageName || t('dashboard')}
                </h1>
                <p className="text-xs font-medium text-muted-foreground hidden md:block">
                    {t('welcome')}, {user?.username || 'Administrator'}
                </p>
            </div>

            <div className="ml-auto flex items-center gap-4">

                <Button variant="ghost" size="icon" className="relative hover:bg-secondary/10 hover:text-primary transition-colors">
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-600 ring-2 ring-background" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary/10 hover:text-primary transition-colors border border-border/40">
                            <User className="h-5 w-5" />
                            <span className="sr-only">User profile</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>{t('profile')}</DropdownMenuLabel>
                        <DropdownMenuItem className="text-muted-foreground text-xs" disabled>
                            {user?.username || 'Admin'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />

                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                <span>{t('theme')}</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => setTheme("light")}>
                                    <Sun className="mr-2 h-4 w-4" />
                                    <span>{t('light')}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme("dark")}>
                                    <Moon className="mr-2 h-4 w-4" />
                                    <span>{t('dark')}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme("system")}>
                                    <Monitor className="mr-2 h-4 w-4" />
                                    <span>{t('system')}</span>
                                </DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <Languages className="mr-2 h-4 w-4" />
                                <span>{t('language')}</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => setLanguage("en")}>
                                    <span className={language === 'en' ? 'font-bold' : ''}>English</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setLanguage("ml")}>
                                    <span className={language === 'ml' ? 'font-bold' : ''}>മലയാളം</span>
                                </DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>{t('logout')}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
