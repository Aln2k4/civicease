import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import serviceService from '../services/serviceService';
import citizenService from '../services/citizenService';
import { useAuth } from '@/context/AuthContext';
import {
    Users,
    Briefcase,
    Coins,
    UserCheck,
    Heart,
    MapPin,
    Home,
    FileText,
    ShieldCheck,
    User,
    RefreshCw,
    Landmark,
    Gavel,
    Users2,
    ArrowLeft,
    ChevronRight,
    Search,
    Filter,
    ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import toast from 'react-hot-toast';

interface ServiceRecord {
    _id: string;
    serviceName: string;
    status: string;
    applicant: {
        _id: string;
        name: string;
        ward?: string;
        houseName?: string;
    };
    officialId: { name: string };
    createdAt: string;
}

interface ServiceItem {
    label: string;
    icon: any;
}

interface Category {
    title: string;
    icon: any;
    items: ServiceItem[];
    color: string;
    description: string;
}

const ServiceList = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isPendingQueue = searchParams.get('view') === 'pending';
    const [services, setServices] = useState<ServiceRecord[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedServiceName, setSelectedServiceName] = useState<string | null>(null);

    // Citizen Search State
    const [citizenSearch, setCitizenSearch] = useState("");
    const [citizenResults, setCitizenResults] = useState<any[]>([]);
    const [showCitizenResults, setShowCitizenResults] = useState(false);
    const [selectedCitizen, setSelectedCitizen] = useState<any | null>(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState("All");

    // Details Modal State
    const [selectedServiceDetails, setSelectedServiceDetails] = useState<ServiceRecord | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isProcessLoading, setIsProcessLoading] = useState(false);

    // Reset state when user changes (e.g. logout/login)
    useEffect(() => {
        setServices([]);
        setSelectedCategory(null);
        setSelectedServiceName(null);
        setSelectedCitizen(null);
        setCitizenSearch("");
        setCitizenResults([]);
        setShowCitizenResults(false);
    }, [user]);

    // Fetch services whenever filters or selected service changes
    useEffect(() => {
        if (selectedServiceName || selectedCitizen || isPendingQueue) {
            fetchServices();
        }
    }, [selectedServiceName, selectedCitizen, statusFilter, isPendingQueue]);

    // Citizen Search Debounce
    useEffect(() => {
        const searchCitizens = async () => {
            if (citizenSearch.trim().length > 1) {
                try {
                    const results = await citizenService.getAll({ search: citizenSearch });
                    setCitizenResults(results);
                    setShowCitizenResults(true);
                } catch (error) {
                    console.error("Citizen search failed:", error);
                }
            } else {
                setCitizenResults([]);
                setShowCitizenResults(false);
            }
        };

        const timeoutId = setTimeout(searchCitizens, 300);
        return () => clearTimeout(timeoutId);
    }, [citizenSearch]);


    const fetchServices = async () => {
        try {
            const params: any = {};
            // If a specific service name is selected, use it. 
            // If searching by citizen, we might want to see ALL their certificates, or filtered by name.
            if (selectedServiceName) params.serviceName = selectedServiceName;

            if (statusFilter !== "All") {
                params.status = statusFilter;
            } else if (isPendingQueue) {
                // Determine what 'pending' means based on the user's role 
                // Alternatively, just fetch all that are NOT Approved/Rejected/Issued
                params.status = ['Draft', 'Validated', 'Under Review']; // Example: let the backend handle the array or we filter frontend
                // Since our backend takes a single status string normally, if it supports in, we can send it.
                // For safety, if backend expects a single string or requires modifications, 
                // we'll just omit status from params and filter on the frontend for pending items.
                // Wait, to keep it simple, we just don't pass status here, but let the user select.
                // Setting default filter based on role is best.
                // To avoid breaking existing backend, we will NOT send a hardcoded array unless backend supports it.
            }

            // If a citizen is selected, filter by their ID
            if (selectedCitizen) {
                params.applicantId = selectedCitizen._id;
            } else if (citizenSearch) {
                // Should we filter by search term if no citizen is selected? 
                // The current backend supports 'search' param for generic text search on applicant fields.
                // We can keep it or rely purely on selection. 
                // Let's rely on selection for precision, but if user just types, maybe we don't fetch services until selection?
                // The requirement says "add search citizen... and then select that person".
                // So we likely wait for selection. 
                // But existing logic supported generic search.
                // For now, let's NOT send 'search' param if we have a robust citizen selection flow, 
                // to avoid confusion between "search term" and "selected id".
            }

            // Only fetch if we have a context (Service Name selected OR Citizen selected OR Pending Queue)
            if (selectedServiceName || selectedCitizen || isPendingQueue) {
                const data = await serviceService.getAll(params);
                setServices(data);
            }

        } catch (error) {
            console.error(error);
        }
    };

    const handleCitizenSelect = (citizen: any) => {
        setSelectedCitizen(citizen);
        setCitizenSearch(citizen ? citizen.name : "");
        setShowCitizenResults(false);
    };

    const handleAction = async (action: 'verify' | 'approve' | 'reject' | 'issue', id: string) => {
        if (!id) return;
        setIsProcessLoading(true);
        try {
            if (action === 'verify') {
                await serviceService.verify(id);
                toast.success("Application marked Under Review");
            }
            if (action === 'approve') {
                await serviceService.approve(id);
                toast.success("Application Approved");
            }
            if (action === 'reject') {
                if (!rejectionReason.trim()) {
                    toast.error("Rejection reason is required.");
                    setIsProcessLoading(false);
                    return;
                }
                await serviceService.reject(id, { reason: rejectionReason });
                toast.success("Application Rejected");
            }
            if (action === 'issue') {
                await serviceService.issue(id);
                toast.success("Certificate Issued successfully");
            }

            setIsDetailsModalOpen(false);
            setRejectionReason("");
            fetchServices();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || `Failed to ${action} application`);
        } finally {
            setIsProcessLoading(false);
        }
    };

    const categories: Category[] = [
        {
            title: "Socio Economic Certificates",
            icon: Users,
            description: "Caste, Income, Minority status and related documents",
            items: [
                { label: "Caste Certificate", icon: Users },
                { label: "Community Certificate", icon: Users2 },
                { label: "Income Certificate", icon: Coins },
                { label: "Minority Certificate", icon: UserCheck },
                { label: "Non-Creamy Layer Certificate", icon: Briefcase },
                { label: "Inter-Caste Marriage Certificate", icon: Heart },
            ],
            color: "text-blue-600"
        },
        {
            title: "Land Related Certificates",
            icon: MapPin,
            description: "Possession, Valuation, and Location certificates",
            items: [
                { label: "Land Certificate", icon: MapPin },
                { label: "Possession Certificate", icon: MapPin },
                { label: "Possession & Non-attachment", icon: MapPin },
                { label: "Valuation Certificate", icon: Landmark },
            ],
            color: "text-emerald-600"
        },
        {
            title: "Family & Relations",
            icon: Heart,
            description: "Family membership, relationship and dependency proofs",
            items: [
                { label: "Dependency Certificate", icon: User },
                { label: "Family Membership", icon: Users },
                { label: "Legal Heir Certificate", icon: Gavel },
                { label: "Non-remarriage Certificate", icon: Heart },
                { label: "Relationship Certificate", icon: Users },
                { label: "Widow-Widower Certificate", icon: User },
            ],
            color: "text-rose-600"
        },
        {
            title: "Residence & Nativity",
            icon: Home,
            description: "Proof of residence and place of birth",
            items: [
                { label: "Nativity Certificate", icon: Home },
                { label: "Domicile Certificate", icon: Home },
            ],
            color: "text-amber-600"
        },
        {
            title: "Identity Related",
            icon: ShieldCheck,
            description: "Personal identification documents",
            items: [
                { label: "Identification Certificate", icon: ShieldCheck },
                { label: "One and Same Certificate", icon: ShieldCheck },
            ],
            color: "text-indigo-600"
        },
        {
            title: "Other Services",
            icon: FileText,
            description: "Destitute, Solvency and other miscellaneous services",
            items: [
                { label: "Destitute Certificate", icon: FileText },
                { label: "Solvency Certificate", icon: Coins },
                { label: "Conversion Certificate", icon: RefreshCw },
            ],
            color: "text-slate-600"
        }
    ];

    const handleServiceClick = (serviceName: string) => {
        setSelectedServiceName(serviceName);
        setStatusFilter("All");
    };

    const handleBackToCategory = () => {
        setSelectedServiceName(null);
        setSelectedCitizen(null); // Clear citizen selection
        setServices([]); // Clear services when leaving list view
        if (isPendingQueue) {
            navigate('/services');
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground animate-in fade-in duration-500">
            <div className="container py-8 px-4 md:px-8 max-w-7xl mx-auto space-y-10">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row gap-4 justify-between md:items-start border-b border-border/40 pb-6">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-bold tracking-tight text-primary">
                            {isPendingQueue
                                ? "Pending Applications Queue"
                                : selectedCitizen
                                    ? `Certificates: ${selectedCitizen.name}`
                                    : selectedServiceName
                                        ? selectedServiceName
                                        : selectedCategory
                                            ? selectedCategory.title
                                            : "Certificate Services"}
                        </h1>
                        <p className="text-muted-foreground">
                            {isPendingQueue
                                ? "Review and process all pending applications across all services."
                                : selectedCitizen
                                    ? `Viewing all certificates issued to ${selectedCitizen.name} (${selectedCitizen.houseName})`
                                    : selectedServiceName
                                        ? `Manage applications for ${selectedServiceName}`
                                        : selectedCategory
                                            ? "Select a specific service to view applications."
                                            : "Choose a category to find the certificate you need."}
                        </p>
                    </div>
                    <Button
                        onClick={() => navigate('/services/apply' + (selectedServiceName ? `?service=${encodeURIComponent(selectedServiceName)}` : ''))}
                        className="gap-2 bg-primary hover:bg-primary/90 mt-2 md:mt-0 shadow-md"
                    >
                        Apply for Certificate <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>

                {/* Global Search Bar */}
                <div className="max-w-md">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search Citizen (Name or House Name)..."
                            className="pl-9 bg-background/50 backdrop-blur-sm border-border/60 focus:bg-background transition-all"
                            value={citizenSearch}
                            onChange={(e) => setCitizenSearch(e.target.value)}
                            onFocus={() => {
                                if (citizenSearch.length > 1) setShowCitizenResults(true);
                            }}
                        />
                        {showCitizenResults && citizenResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-popover border text-popover-foreground shadow-md rounded-md max-h-60 overflow-y-auto">
                                {citizenResults.map((citizen) => (
                                    <div
                                        key={citizen._id}
                                        className="px-4 py-3 hover:bg-muted cursor-pointer text-sm border-b last:border-0"
                                        onClick={() => handleCitizenSelect(citizen)}
                                    >
                                        <div className="font-medium">{citizen.name}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            {citizen.houseName} • Ward {citizen.ward}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {selectedServiceName || selectedCitizen || isPendingQueue ? (
                    // 3rd View: Application List for Specific Service or Pending Queue
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                            <Button
                                variant="ghost"
                                className="gap-2 pl-0 hover:pl-2 transition-all self-start"
                                onClick={handleBackToCategory}
                            >
                                <ArrowLeft className="h-4 w-4" />
                                {isPendingQueue ? "Back to Categories" : `Back to ${selectedCategory?.title || "Categories"}`}
                            </Button>



                            {/* Existing Service Search - Renamed/Adjusted or kept? 
                                    The user wants to "show issued certificate in that person". 
                                    So if a citizen is selected, we show THEIR certificates. 
                                    I will keep the existing search for filtering strictly within the list if needed, 
                                    but for now I am replacing the generic search with this citizen search as requested 
                                    OR adding it alongside. The request implies this is the primary way to find people.
                                    The existing search was: "Search Name, Ward, House...". 
                                    I will repurpose the existing search area for this new flow or add it.
                                    Actually, the existing search filters the *fetched* services. 
                                    The new requirement is to search *citizens* then fetch their services.
                                    I will replace the existing search input with this new citizen search logic.
                                */}

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-[150px]">
                                    <Filter className="w-4 h-4 mr-2" />
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Status</SelectItem>
                                    <SelectItem value="Draft">Draft</SelectItem>
                                    <SelectItem value="Validated">Validated</SelectItem>
                                    <SelectItem value="Under Review">Under Review</SelectItem>
                                    <SelectItem value="Approved">Approved</SelectItem>
                                    <SelectItem value="Rejected">Rejected</SelectItem>
                                    <SelectItem value="Issued">Issued</SelectItem>
                                </SelectContent>
                            </Select>

                        </div>

                        {/* Active Filter Display */}
                        {selectedCitizen && (
                            <div className="bg-muted/50 p-3 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                    <User className="h-4 w-4 text-primary" />
                                    <span>
                                        Showing certificates for <strong>{selectedCitizen.name}</strong>
                                        <span className="text-muted-foreground ml-2">({selectedCitizen.houseName})</span>
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCitizenSelect(null)}
                                    className="h-auto p-1 text-muted-foreground hover:text-destructive"
                                >
                                    Clear
                                </Button>
                            </div>
                        )}

                        {/* Applications Table */}
                        <div className="border rounded-xl overflow-hidden shadow-sm bg-card">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted/50 border-b">
                                        <tr>
                                            <th className="p-4 font-semibold text-muted-foreground">Applicant</th>
                                            <th className="p-4 font-semibold text-muted-foreground">House Name</th>
                                            <th className="p-4 font-semibold text-muted-foreground">Ward</th>
                                            <th className="p-4 font-semibold text-muted-foreground">Status</th>
                                            <th className="p-4 font-semibold text-muted-foreground">Applied Date</th>
                                            <th className="p-4 font-semibold text-muted-foreground text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {services.length > 0 ? (
                                            services.map((service) => (
                                                <tr key={service._id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="p-4 font-medium">{service.applicant?.name}</td>
                                                    <td className="p-4 text-muted-foreground">{service.applicant?.houseName || "N/A"}</td>
                                                    <td className="p-4 text-muted-foreground">{service.applicant?.ward || "N/A"}</td>
                                                    <td className="p-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${service.status === 'Approved' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                            service.status === 'Issued' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                                                                service.status === 'Rejected' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                                                                    'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                                                            }`}>
                                                            {service.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-muted-foreground">
                                                        {new Date(service.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedServiceDetails(service);
                                                                setIsDetailsModalOpen(true);
                                                                setRejectionReason("");
                                                            }}
                                                        >
                                                            View Details
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <FileText className="h-8 w-8 opacity-20" />
                                                        <p>No applications found matching your criteria.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                ) : selectedCategory ? (
                    // Detail View: Selected Category Services
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <Button
                            variant="ghost"
                            className="gap-2 pl-0 hover:pl-2 transition-all"
                            onClick={() => setSelectedCategory(null)}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Categories
                        </Button>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {selectedCategory.items.map((item, idx) => (
                                <Card
                                    key={idx}
                                    className="group hover:shadow-md transition-all cursor-pointer border-border/50 hover:border-primary/20"
                                    onClick={() => handleServiceClick(item.label)}
                                >
                                    <CardContent className="p-6 flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-colors">
                                                    <item.icon className={`h-6 w-6 ${selectedCategory.color}`} />
                                                </div>
                                                <span className="font-medium">{item.label}</span>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        {/* "View Sample" button removed from here as per request */}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ) : (
                    // Main View: Categories List & My Applications (Pending)
                    <div className="space-y-12 animate-in slide-in-from-left-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {categories.map((category, idx) => (
                                <Card
                                    key={idx}
                                    className="group hover:shadow-lg transition-all cursor-pointer border-border/50 overflow-hidden relative"
                                    onClick={() => setSelectedCategory(category)}
                                >
                                    <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${category.color.replace('text-', 'from-').replace('600', '400')} to-transparent opacity-50`} />
                                    <CardContent className="p-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="p-3 bg-muted rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all">
                                                <category.icon className={`h-8 w-8 ${category.color}`} />
                                            </div>
                                            <div className="h-8 w-8 rounded-full flex items-center justify-center bg-muted/50 group-hover:bg-primary/10 transition-colors">
                                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{category.title}</h3>
                                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                                {category.description}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Details Modal & Timeline */}
                <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Application Details</DialogTitle>
                            <DialogDescription>
                                {selectedServiceDetails?.serviceName} for {selectedServiceDetails?.applicant?.name}
                            </DialogDescription>
                        </DialogHeader>

                        {selectedServiceDetails && (
                            <div className="grid gap-4 py-4">
                                {/* Status Timeline UI */}
                                <div className="mb-4">
                                    <h4 className="text-sm font-semibold mb-3">Application Progress</h4>
                                    <div className="flex items-center justify-between relative">
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10 rounded-full"></div>
                                        {['Draft', 'Validated', 'Under Review', 'Approved', 'Issued'].map((step, idx) => {
                                            const steps = ['Draft', 'Validated', 'Under Review', 'Approved', 'Issued'];
                                            const currentIdx = steps.indexOf(selectedServiceDetails.status);
                                            const isRejected = selectedServiceDetails.status === 'Rejected';
                                            const isPast = !isRejected && currentIdx >= idx;
                                            const isCurrent = currentIdx === idx;

                                            let dotColor = isPast ? 'bg-primary' : 'bg-muted border-2 border-border';
                                            if (isRejected && idx <= steps.indexOf('Under Review')) dotColor = 'bg-red-500 border-red-500';

                                            return (
                                                <div key={step} className="flex flex-col items-center gap-2 bg-background px-2">
                                                    <div className={`w-4 h-4 rounded-full ${dotColor} ${isCurrent && !isRejected ? 'ring-4 ring-primary/20' : ''}`} />
                                                    <span className={`text-[10px] font-medium ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>{step}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {selectedServiceDetails.status === 'Rejected' && (
                                        <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
                                            <strong>Rejected:</strong> This application was rejected during review.
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
                                    <div>
                                        <span className="text-muted-foreground block text-xs uppercase mb-1">Applicant</span>
                                        <span className="font-medium">{selectedServiceDetails.applicant?.name}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs uppercase mb-1">Status</span>
                                        <span className="font-medium">{selectedServiceDetails.status}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs uppercase mb-1">Ward</span>
                                        <span className="font-medium">{selectedServiceDetails.applicant?.ward || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs uppercase mb-1">Applied Date</span>
                                        <span className="font-medium">{new Date(selectedServiceDetails.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {/* Officer Actions */}
                                {(user?.role === 'Clerk' || user?.role === 'Admin') && selectedServiceDetails.status === 'Validated' && (
                                    <div className="mt-4">
                                        <Button
                                            className="w-full"
                                            onClick={() => handleAction('verify', selectedServiceDetails._id)}
                                            disabled={isProcessLoading}
                                        >
                                            {isProcessLoading ? 'Processing...' : 'Mark Under Review (Checklist Verified)'}
                                        </Button>
                                    </div>
                                )}

                                {(user?.role === 'Revenue Officer' || user?.role === 'Admin') && selectedServiceDetails.status === 'Under Review' && (
                                    <div className="space-y-4 mt-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <Button
                                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => handleAction('approve', selectedServiceDetails._id)}
                                                disabled={isProcessLoading}
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                className="w-full"
                                                onClick={() => handleAction('reject', selectedServiceDetails._id)}
                                                disabled={isProcessLoading || !rejectionReason.trim()}
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Rejection Reason (Required for rejection)</label>
                                            <Textarea
                                                placeholder="Provide reason for rejection..."
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                {(user?.role === 'Revenue Officer' || user?.role === 'Admin') && selectedServiceDetails.status === 'Approved' && (
                                    <div className="mt-4">
                                        <Button
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                            onClick={() => handleAction('issue', selectedServiceDetails._id)}
                                            disabled={isProcessLoading}
                                        >
                                            Issue Final Certificate
                                        </Button>
                                    </div>
                                )}

                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>
        </div >
    );
};

export default ServiceList;
