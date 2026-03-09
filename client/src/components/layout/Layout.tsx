import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAuth } from "@/context/AuthContext";
import AdminLayout from "./AdminLayout";

export default function Layout() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin' || user?.role === 'admin';

    if (isAdmin) {
        return <AdminLayout />;
    }

    return (
        <div className="min-h-screen w-full bg-muted/40">
            <Header />
            <div className="flex">
                <Sidebar />
                <div className="flex flex-col sm:pl-14 lg:pl-[280px] w-full">
                    <div className="flex-1 flex flex-col pt-4 sm:pt-4">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
}
