import { Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Header() {
    return (
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b bg-background px-6 shadow-sm">
            <div className="flex flex-col">
                <h1 className="text-2xl font-bold uppercase tracking-wider text-primary">
                    CivicEase
                </h1>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                    A Government Service Portal
                </p>
            </div>
            <div className="ml-auto flex items-center gap-4">
                <div className="relative hidden sm:block">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search services..."
                        className="w-[200px] pl-8 lg:w-[300px]"
                    />
                </div>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-600" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                    <span className="sr-only">User profile</span>
                </Button>
            </div>
        </header>
    );
}
