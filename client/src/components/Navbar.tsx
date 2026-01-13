import { Link } from 'react-router-dom';
import { Home, Users, FileText, LogOut } from 'lucide-react';

const Navbar = () => {
    return (
        <nav className="bg-surface shadow p-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold text-primary">CivicEase</h1>
                <div className="flex gap-4 ml-8">
                    <Link to="/dashboard" className="flex items-center gap-2 hover:text-primary transition-colors">
                        <Home size={18} /> Dashboard
                    </Link>
                    <Link to="/citizens" className="flex items-center gap-2 hover:text-primary transition-colors">
                        <Users size={18} /> Citizens
                    </Link>
                    <Link to="/services" className="flex items-center gap-2 hover:text-primary transition-colors">
                        <FileText size={18} /> Services
                    </Link>
                </div>
            </div>
            <button className="flex items-center gap-2 text-error hover:text-red-600 transition-colors">
                <LogOut size={18} /> Logout
            </button>
        </nav>
    );
};

export default Navbar;
