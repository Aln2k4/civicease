import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import citizenService from '../services/citizenService';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Citizen {
    _id: string;
    name: string;
    uniqueId: string;
    houseName?: string;
    ward?: string;
    place?: string;
    pinCode?: string;
    contactNumber: string;
    villageOfficeId?: {
        _id: string;
        villageName: string;
        district: string;
        taluk?: string;
    };
}

const CitizenList = () => {
    const { user } = useAuth();
    const [citizens, setCitizens] = useState<Citizen[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [filterValue, setFilterValue] = useState("all");
    const [filterDistrict, setFilterDistrict] = useState("all");
    const [filterVillage, setFilterVillage] = useState("all");

    const [allCitizens, setAllCitizens] = useState<Citizen[]>([]);

    const isAdmin = user?.role === 'Admin' || user?.role === 'admin';

    // Fetch once for dropdown options
    useEffect(() => {
        if (user) {
            citizenService.getAll().then(data => setAllCitizens(data)).catch(console.error);
        }
    }, [user]);

    // Fetch dynamically based on filters
    useEffect(() => {
        if (user) {
            fetchCitizens();
        }
    }, [user, searchTerm, filterDistrict, filterVillage, filterType, filterValue]);

    const fetchCitizens = async () => {
        try {
            const params: any = {};
            if (searchTerm.trim()) params.search = searchTerm;
            if (isAdmin && filterDistrict !== "all") params.district = filterDistrict;
            // Note: filterVillage is currently the string name, backend needs villageId for strict filtering, 
            // but for frontend we map name back to ID if we can, or let frontend do the name filter.
            // Let's pass ward if selected
            if (filterType === "ward" && filterValue !== "all") params.ward = filterValue;

            const data = await citizenService.getAll(params);
            setCitizens(data);
        } catch (error) {
            console.error('Failed to fetch citizens', error);
        }
    };

    // Extract unique Wards and Places for filter dropdowns from allCitizens
    const uniqueWards = useMemo(() => {
        const wards = new Set(allCitizens.map(c => c.ward).filter(Boolean));
        return Array.from(wards).sort();
    }, [allCitizens]);

    const uniquePlaces = useMemo(() => {
        const places = new Set(allCitizens.map(c => c.place).filter(Boolean));
        return Array.from(places).sort();
    }, [allCitizens]);

    const uniqueDistricts = useMemo(() => {
        const districts = new Set(
            allCitizens
                .map(c => c.villageOfficeId?.district)
                .filter(Boolean)
        );
        return Array.from(districts).sort();
    }, [allCitizens]);

    const uniqueVillages = useMemo(() => {
        const villages = new Set(
            allCitizens
                .filter(c => filterDistrict === "all" || c.villageOfficeId?.district === filterDistrict)
                .map(c => c.villageOfficeId?.villageName)
                .filter(Boolean)
        );
        return Array.from(villages).sort();
    }, [allCitizens, filterDistrict]);

    const filteredCitizens = citizens.filter(citizen => {
        // Backend handles search, district, and ward. 
        // Frontend still needs to handle 'villageName' and 'place' since we didn't add exact backend params for them yet.
        if (isAdmin) {
            if (filterVillage !== "all" && citizen.villageOfficeId?.villageName !== filterVillage) return false;
        }

        if (filterType === "place") {
            return filterValue === "all" || citizen.place === filterValue;
        }

        return true;
    });

    const formatAddress = (citizen: Citizen) => {
        const parts = [
            citizen.houseName,
            citizen.ward ? `Ward: ${citizen.ward}` : null,
            citizen.place,
            citizen.pinCode
        ].filter(Boolean);
        return parts.length > 0 ? parts.join(", ") : "N/A";
    };

    return (
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Citizen Management</h1>
                    <p className="text-muted-foreground">Manage and view all registered citizens.</p>
                </div>
                <Link to="/citizens/add" className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-sm">
                    + Add Citizen
                </Link>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-4 items-center bg-white p-4 rounded-lg border shadow-sm w-full">
                <div className="relative w-full md:w-1/3">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by Name or Unique ID..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium whitespace-nowrap">Filter by:</span>

                    <Select value={filterType} onValueChange={(val) => { setFilterType(val); setFilterValue("all"); }}>
                        <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">None</SelectItem>
                            <SelectItem value="ward">Ward</SelectItem>
                            <SelectItem value="place">Place</SelectItem>
                        </SelectContent>
                    </Select>

                    {filterType !== "all" && (
                        <Select value={filterValue} onValueChange={setFilterValue}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder={`Select ${filterType === 'ward' ? 'Ward' : 'Place'}`} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All {filterType === 'ward' ? 'Wards' : 'Places'}</SelectItem>
                                {filterType === 'ward'
                                    ? uniqueWards.map(w => <SelectItem key={w} value={w as string}>{w}</SelectItem>)
                                    : uniquePlaces.map(p => <SelectItem key={p} value={p as string}>{p}</SelectItem>)
                                }
                            </SelectContent>
                        </Select>
                    )}

                    {/* Admin Jurisdiction Filters */}
                    {isAdmin && (
                        <>
                            <div className="flex items-center gap-2 w-full md:w-auto ml-2 border-l pl-4">
                                <span className="text-sm font-medium whitespace-nowrap">District:</span>
                                <Select value={filterDistrict} onValueChange={(val) => { setFilterDistrict(val); setFilterVillage("all"); }}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        {uniqueDistricts.map(d => <SelectItem key={d as string} value={d as string}>{d as string}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto ml-2">
                                <span className="text-sm font-medium whitespace-nowrap">Village:</span>
                                <Select value={filterVillage} onValueChange={setFilterVillage}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        {uniqueVillages.map(v => <SelectItem key={v as string} value={v as string}>{v as string}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="bg-surface rounded-lg shadow-sm overflow-hidden bg-card text-card-foreground border">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse caption-bottom text-sm">
                        <thead className="bg-muted/50 [&_tr]:border-b">
                            <tr className="border-b transition-colors">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Unique ID</th>
                                {isAdmin && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Jurisdiction</th>}
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Address</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Contact</th>
                                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {filteredCitizens.length > 0 ? (
                                filteredCitizens.map((citizen) => (
                                    <tr key={citizen._id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <td className="p-4 align-middle font-medium">{citizen.name}</td>
                                        <td className="p-4 align-middle text-muted-foreground">{citizen.uniqueId || "N/A"}</td>
                                        {isAdmin && (
                                            <td className="p-4 align-middle text-muted-foreground text-xs">
                                                <div className="font-medium text-foreground">{citizen.villageOfficeId?.villageName || "Unknown"}</div>
                                                <div className="opacity-70">{citizen.villageOfficeId?.district || ""}</div>
                                            </td>
                                        )}
                                        <td className="p-4 align-middle max-w-[250px] truncate" title={formatAddress(citizen)}>
                                            {formatAddress(citizen)}
                                        </td>
                                        <td className="p-4 align-middle">{citizen.contactNumber}</td>
                                        <td className="p-4 align-middle text-center">
                                            <Button variant="outline" size="sm" asChild className="hover:bg-primary hover:text-primary-foreground">
                                                <Link to={`/citizens/${citizen._id}`}>View Details</Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={isAdmin ? 6 : 5} className="p-8 text-center text-muted-foreground">
                                        {searchTerm || filterType !== 'all' || filterDistrict !== 'all' || filterVillage !== 'all' ? "No citizens match your search/filter." : "No citizens found."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
};

export default CitizenList;
