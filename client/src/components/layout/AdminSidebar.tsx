import Link from 'next/link'
import { LayoutDashboard, ListFilter, LogOut, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logout } from '@/lib/actions/auth.actions'

export function AdminSidebar() {
    return (
        <div className="hidden border-r bg-muted/40 md:block w-[220px] lg:w-[280px] h-screen fixed left-0 top-0 overflow-y-auto">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold">
                        <Shield className="h-6 w-6 text-primary" />
                        <span className="">CivicEase Admin</span>
                    </Link>
                </div>
                <div className="flex-1">
                    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                        <Link
                            href="/admin/dashboard"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Overview
                        </Link>
                        <Link
                            href="/admin/complaints"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                        >
                            <ListFilter className="h-4 w-4" />
                            Manage Complaints
                        </Link>
                    </nav>
                </div>
                <div className="mt-auto p-4">
                    <form action={logout}>
                        <Button variant="outline" className="w-full flex gap-2">
                            <LogOut className="h-4 w-4" />
                            Logout
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}
