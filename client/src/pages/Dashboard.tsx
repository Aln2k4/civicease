import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, User, FileText, Home, RefreshCw, TrendingUp, AlertCircle, Search as SearchIcon } from "lucide-react";
import api from "@/services/api";
import { useLanguage } from "@/context/LanguageContext";

type DashboardStats = {
    citizens: number;
    families: number;
    servicesToday: number;
    pending: number;
};

import { useAuth } from "@/context/AuthContext";

import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";

export default function Dashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin' || user?.role === 'admin';
    const { t } = useLanguage();
    const [stats, setStats] = useState<DashboardStats>({
        citizens: 0,
        families: 0,
        servicesToday: 0,
        pending: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any>(null);
    const [isSearching, setIsSearching] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim().length > 0) {
                performSearch(searchQuery);
            } else {
                setSearchResults(null);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const performSearch = async (query: string) => {
        setIsSearching(true);
        try {
            const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
            setSearchResults(res.data);
        } catch (error) {
            console.error("Search failed", error);
            setSearchResults(null);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get("/dashboard");
                if (res.data) setStats(res.data);
            } catch (error) {
                console.error("Failed to load dashboard stats", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchStats();
        }
    }, [user]);

    return (
        <main className={`flex flex-col flex-1 p-4 sm:px-6 sm:py-6 gap-6 min-h-[calc(100vh-5rem)] transition-colors duration-300 ${isAdmin ? 'bg-black/95 text-green-500 font-mono' : 'bg-slate-50/40'}`}>
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
                <div>
                    <h1 className={`text-3xl font-bold tracking-tight ${isAdmin ? 'text-green-500 uppercase' : 'text-slate-800'}`}>
                        {isAdmin ? 'GLOBAL_SYSTEM_METRICS' : (user?.villageContext?.villageName ? `${user.villageContext.villageName}` : t('dashboard'))}
                    </h1>
                    <p className={`mt-1 text-sm ${isAdmin ? 'text-green-600/70' : 'text-slate-500'}`}>
                        {isAdmin ? 'Real-time root data access across all nodes. Monitoring active.' : (user?.villageContext?.villageName ? t('dashboardSubtitle') : t('dashboardSubtitle'))}
                    </p>
                </div>

            </div>

            {/* Global Search Bar */}
            <div className="relative z-50">
                <div className={`relative flex items-center w-full shadow-sm rounded-xl overflow-hidden border transition-all focus-within:shadow-md focus-within:ring-1 focus-within:ring-primary/20 ${isAdmin ? 'bg-black/60 border-green-500/30' : 'bg-white border-slate-200/60'}`}>
                    <SearchIcon className={`absolute left-4 h-5 w-5 ${isAdmin ? 'text-green-500' : 'text-slate-400'}`} />
                    <Input
                        id="global-search"
                        placeholder="Global Search: Citizen Name, Aadhaar, Family ID, Certificate Number..."
                        className={`pl-12 h-14 border-0 bg-transparent shadow-none rounded-none focus-visible:ring-0 text-md ${isAdmin ? 'text-green-400 placeholder:text-green-700/50' : 'text-slate-700 placeholder:text-slate-400'}`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoComplete="off"
                    />
                    {isSearching && (
                        <div className="absolute right-4 text-slate-400">
                            <RefreshCw className="h-5 w-5 animate-spin" />
                        </div>
                    )}
                </div>

                {/* Search Results Dropdown */}
                {searchResults && searchQuery.length > 0 && (
                    <Card className={`absolute top-16 left-0 right-0 shadow-xl border-slate-200 max-h-[60vh] overflow-y-auto z-50 rounded-xl ${isAdmin ? 'bg-black border-green-500/50' : 'bg-white'}`}>
                        <CardContent className="p-4 grid gap-6">
                            {searchResults.citizens?.length > 0 && (
                                <div>
                                    <h3 className={`font-semibold text-xs mb-3 uppercase tracking-wider ${isAdmin ? 'text-green-600' : 'text-slate-400'}`}>Citizens</h3>
                                    <div className="grid gap-2">
                                        {searchResults.citizens.map((c: any) => (
                                            <div key={c._id} className={`p-3 rounded-lg cursor-pointer border transition-colors ${isAdmin ? 'border-green-500/20 hover:bg-green-500/10' : 'border-slate-100 hover:bg-slate-50 hover:border-slate-200'}`} onClick={() => navigate(`/citizens/${c._id}`)}>
                                                <div className={`font-medium ${isAdmin ? 'text-green-400' : 'text-slate-800'}`}>{c.name}</div>
                                                <div className={`text-xs mt-1 ${isAdmin ? 'text-green-600/70' : 'text-slate-500'}`}>ID: {c.uniqueId || 'N/A'} | Age: {c.age}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {searchResults.families?.length > 0 && (
                                <div>
                                    <h3 className={`font-semibold text-xs mb-3 uppercase tracking-wider ${isAdmin ? 'text-green-600' : 'text-slate-400'}`}>Families</h3>
                                    <div className="grid gap-2">
                                        {searchResults.families.map((f: any) => (
                                            <div key={f._id} className={`p-3 rounded-lg cursor-pointer border transition-colors ${isAdmin ? 'border-green-500/20 hover:bg-green-500/10' : 'border-slate-100 hover:bg-slate-50 hover:border-slate-200'}`} onClick={() => navigate(`/families/${f._id}`)}>
                                                <div className={`font-medium ${isAdmin ? 'text-green-400' : 'text-slate-800'}`}>{f.familyName}</div>
                                                <div className={`text-xs mt-1 ${isAdmin ? 'text-green-600/70' : 'text-slate-500'}`}>Ration Card: {f.rationCardNumber} | Ward: {f.wardNumber}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {searchResults.services?.length > 0 && (
                                <div>
                                    <h3 className={`font-semibold text-xs mb-3 uppercase tracking-wider ${isAdmin ? 'text-green-600' : 'text-slate-400'}`}>Certificates</h3>
                                    <div className="grid gap-2">
                                        {searchResults.services.map((s: any) => (
                                            <div key={s._id} className={`p-3 rounded-lg cursor-pointer border transition-colors ${isAdmin ? 'border-green-500/20 hover:bg-green-500/10' : 'border-slate-100 hover:bg-slate-50 hover:border-slate-200'}`} onClick={() => navigate(`/services/${s._id}`)}>
                                                <div className={`font-medium ${isAdmin ? 'text-green-400' : 'text-slate-800'}`}>{s.serviceName}</div>
                                                <div className="flex justify-between items-center text-xs mt-2">
                                                    <span className={isAdmin ? 'text-green-600/70' : 'text-slate-500'}>Applicant: {s.applicant?.name || 'Unknown'}</span>
                                                    <span className={`px-2 py-0.5 rounded-full font-medium ${s.status === 'Issued' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{s.status}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {searchResults.citizens?.length === 0 && searchResults.families?.length === 0 && searchResults.services?.length === 0 && (
                                <div className={`text-center p-6 ${isAdmin ? 'text-green-600/50' : 'text-slate-400'}`}>
                                    No results found for "{searchQuery}"
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Metrics SECTION */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className={`cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group ${isAdmin ? 'bg-black/60 border-green-500/30 rounded-none shadow-[0_0_10px_rgba(34,197,94,0.05)] text-green-500' : 'bg-white border-slate-100 shadow-sm'}`} onClick={() => navigate('/citizens')}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 p-5 space-y-0 relative z-10">
                        <CardTitle className={`text-sm font-medium ${isAdmin ? 'text-green-500/70' : 'text-slate-500'}`}>
                            {isAdmin ? 'CITIZEN_RECORDS' : 'Total Citizens'}
                        </CardTitle>
                        <div className={`p-2.5 rounded-xl transition-colors ${isAdmin ? 'bg-green-500/10 text-green-500' : 'bg-blue-50/80 text-blue-500 group-hover:bg-blue-100'}`}>
                            <Users className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 relative z-10">
                        <div className={`text-3xl font-bold tracking-tight ${isAdmin ? 'text-green-400' : 'text-slate-800'}`}>
                            {isLoading ? "..." : stats.citizens.toLocaleString()}
                        </div>
                        <p className={`text-[11px] mt-2 flex items-center gap-1.5 ${isAdmin ? 'text-green-600/70' : 'text-slate-500'}`}>
                            <span className="flex items-center text-emerald-600 bg-emerald-50/80 px-1.5 py-0.5 rounded font-medium"><TrendingUp className="w-3 h-3 mr-1" /> +2.5%</span>
                            <span>{isAdmin ? 'UP_SYS_AVG' : 'from last month'}</span>
                        </p>
                    </CardContent>
                </Card>

                <Card className={`cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group ${isAdmin ? 'bg-black/60 border-green-500/30 rounded-none shadow-[0_0_10px_rgba(34,197,94,0.05)] text-green-500' : 'bg-white border-slate-100 shadow-sm'}`} onClick={() => navigate('/families')}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 p-5 space-y-0 relative z-10">
                        <CardTitle className={`text-sm font-medium ${isAdmin ? 'text-green-500/70' : 'text-slate-500'}`}>
                            {isAdmin ? 'FAMILY_TREES_DB' : 'Total Families'}
                        </CardTitle>
                        <div className={`p-2.5 rounded-xl transition-colors ${isAdmin ? 'bg-green-500/10 text-green-500' : 'bg-indigo-50/80 text-indigo-500 group-hover:bg-indigo-100'}`}>
                            <Home className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 relative z-10">
                        <div className={`text-3xl font-bold tracking-tight ${isAdmin ? 'text-green-400' : 'text-slate-800'}`}>
                            {isLoading ? "..." : stats.families.toLocaleString()}
                        </div>
                        <p className={`text-[11px] mt-2 flex items-center gap-1.5 ${isAdmin ? 'text-green-600/70' : 'text-slate-500'}`}>
                            <span className="flex items-center text-emerald-600 bg-emerald-50/80 px-1.5 py-0.5 rounded font-medium"><TrendingUp className="w-3 h-3 mr-1" /> +1.2%</span>
                            <span>{isAdmin ? 'UP_SYS_AVG' : 'from last month'}</span>
                        </p>
                    </CardContent>
                </Card>

                <Card className={`cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group ${isAdmin ? 'bg-black/60 border-green-500/30 rounded-none shadow-[0_0_10px_rgba(34,197,94,0.05)] text-green-500' : 'bg-white border-slate-100 shadow-sm'}`} onClick={() => navigate('/services')}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 p-5 space-y-0 relative z-10">
                        <CardTitle className={`text-sm font-medium ${isAdmin ? 'text-green-500/70' : 'text-slate-500'}`}>
                            {isAdmin ? 'SERVICES_DISPATCHED' : 'Services Issued'}
                        </CardTitle>
                        <div className={`p-2.5 rounded-xl transition-colors ${isAdmin ? 'bg-green-500/10 text-green-500' : 'bg-amber-50/80 text-amber-500 group-hover:bg-amber-100'}`}>
                            <FileText className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 relative z-10">
                        <div className={`text-3xl font-bold tracking-tight ${isAdmin ? 'text-green-400' : 'text-slate-800'}`}>
                            {isLoading ? "..." : stats.servicesToday}
                        </div>
                        <p className={`text-xs mt-2 font-medium ${isAdmin ? 'text-green-600/70 uppercase' : 'text-slate-500'}`}>
                            {isAdmin ? 'ISSUED_LAST_24H' : 'Issued today'}
                        </p>
                    </CardContent>
                </Card>

                <Card className={`cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group ${isAdmin ? 'bg-black/60 border-red-500/40 rounded-none shadow-[0_0_15px_rgba(239,68,68,0.1)] text-red-500' : 'bg-white border-slate-100 shadow-sm'}`} onClick={() => navigate('/services?view=pending')}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 p-5 space-y-0 relative z-10">
                        <CardTitle className={`text-sm font-medium ${isAdmin ? 'text-red-500/80' : 'text-slate-500'}`}>
                            {isAdmin ? 'PENDING_ACTIONS_QUEUE' : 'Pending Requests'}
                        </CardTitle>
                        <div className={`p-2.5 rounded-xl transition-colors ${isAdmin ? 'bg-red-500/10 text-red-500' : 'bg-rose-50/80 text-rose-500 group-hover:bg-rose-100'}`}>
                            <AlertCircle className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 relative z-10">
                        <div className={`text-3xl font-bold tracking-tight ${isAdmin ? 'text-red-500' : 'text-slate-800'}`}>
                            {isLoading ? "..." : stats.pending}
                        </div>
                        <p className={`text-xs mt-2 font-medium ${isAdmin ? 'text-red-500/70 uppercase font-bold' : 'text-rose-500/80'}`}>
                            {isAdmin ? 'WARNING: QUEUED_JOBS' : 'Requires action'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* QUICK ACTIONS SECTION */}
            <div className="mt-4">
                <h2 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isAdmin ? 'text-green-500/60' : 'text-slate-400'}`}>Quick Actions</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className={`cursor-pointer group flex items-center p-4 transition-all duration-300 hover:shadow-md hover:bg-slate-50 border-slate-100 ${isAdmin ? 'bg-black/40 border-green-500/20 text-green-500 rounded-none hover:bg-green-500/5' : 'bg-white shadow-sm'}`} onClick={() => navigate('/citizens/add')}>
                        <div className={`p-3 rounded-xl mr-4 transition-colors ${isAdmin ? 'bg-green-500/10 text-green-400 group-hover:bg-green-500/20' : 'bg-blue-50/60 text-blue-500 group-hover:bg-blue-100'}`}>
                            <User className="h-5 w-5" />
                        </div>
                        <span className={`font-semibold text-sm ${isAdmin ? '' : 'text-slate-700'}`}>Add Citizen</span>
                    </Card>
                    <Card className={`cursor-pointer group flex items-center p-4 transition-all duration-300 hover:shadow-md hover:bg-slate-50 border-slate-100 ${isAdmin ? 'bg-black/40 border-green-500/20 text-green-500 rounded-none hover:bg-green-500/5' : 'bg-white shadow-sm'}`} onClick={() => navigate('/services/apply')}>
                        <div className={`p-3 rounded-xl mr-4 transition-colors ${isAdmin ? 'bg-green-500/10 text-green-400 group-hover:bg-green-500/20' : 'bg-amber-50/60 text-amber-500 group-hover:bg-amber-100'}`}>
                            <FileText className="h-5 w-5" />
                        </div>
                        <span className={`font-semibold text-sm ${isAdmin ? '' : 'text-slate-700'}`}>Apply Certificate</span>
                    </Card>
                    <Card className={`cursor-pointer group flex items-center p-4 transition-all duration-300 hover:shadow-md hover:bg-slate-50 border-slate-100 ${isAdmin ? 'bg-black/40 border-green-500/20 text-green-500 rounded-none hover:bg-green-500/5' : 'bg-white shadow-sm'}`} onClick={() => document.getElementById('global-search')?.focus()}>
                        <div className={`p-3 rounded-xl mr-4 transition-colors ${isAdmin ? 'bg-green-500/10 text-green-400 group-hover:bg-green-500/20' : 'bg-indigo-50/60 text-indigo-500 group-hover:bg-indigo-100'}`}>
                            <SearchIcon className="h-5 w-5" />
                        </div>
                        <span className={`font-semibold text-sm ${isAdmin ? '' : 'text-slate-700'}`}>Search Records</span>
                    </Card>
                    <Card className={`cursor-pointer group flex items-center p-4 transition-all duration-300 hover:shadow-md hover:bg-slate-50 border-slate-100 ${isAdmin ? 'bg-black/40 border-green-500/20 text-green-500 rounded-none hover:bg-green-500/5' : 'bg-white shadow-sm'}`} onClick={() => navigate('/services')}>
                        <div className={`p-3 rounded-xl mr-4 transition-colors ${isAdmin ? 'bg-green-500/10 text-green-400 group-hover:bg-green-500/20' : 'bg-emerald-50/60 text-emerald-500 group-hover:bg-emerald-100'}`}>
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <span className={`font-semibold text-sm ${isAdmin ? '' : 'text-slate-700'}`}>View Services</span>
                    </Card>
                </div>
            </div>
        </main>
    );
}
