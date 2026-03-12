import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import familyService from "@/services/familyService";
import { Trash2, ArrowLeft } from "lucide-react";

interface Citizen {
    _id: string;
    name: string;
    uniqueId?: string; // Aadhaar
    age: number;
    gender: string;
    dob?: string;
    address?: string; // Present address
    permanentAddress?: any;
    rationCardNumber?: string;
}

interface MemberSelection {
    citizenId: string;
    relationship: string;
    name: string; // for display
}

export default function AddFamily() {
    const navigate = useNavigate();
    const [availableCitizens, setAvailableCitizens] = useState<Citizen[]>([]);
    const [isLoadingCitizens, setIsLoadingCitizens] = useState(true);

    // Form State
    const [familyName, setFamilyName] = useState("");
    const [wardNumber, setWardNumber] = useState("");
    const [address, setAddress] = useState("");
    const [rationCardNumber, setRationCardNumber] = useState("");
    const [headId, setHeadId] = useState("");

    const [members, setMembers] = useState<MemberSelection[]>([]);
    const [selectedMemberId, setSelectedMemberId] = useState("");
    const [selectedRelationship, setSelectedRelationship] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Jurisdiction context
    const [jurisdiction, setJurisdiction] = useState<any>(null);

    useEffect(() => {
        // 1. Get Jurisdiction from local storage
        const storedOfficial = localStorage.getItem('official');
        if (storedOfficial) {
            const parsed = JSON.parse(storedOfficial);
            setJurisdiction(parsed.villageContext);
        } else {
            navigate('/login');
            return;
        }

        // 2. Fetch Available Citizens
        fetchAvailableCitizens();
    }, [navigate]);

    const fetchAvailableCitizens = async () => {
        setIsLoadingCitizens(true);
        try {
            const data = await familyService.getAvailableCitizens();
            setAvailableCitizens(data);
        } catch (err) {
            console.error("Failed to fetch citizens", err);
            setError("Failed to load citizens. Please try again.");
        } finally {
            setIsLoadingCitizens(false);
        }
    };

    // -- Handlers --

    const handleHeadChange = (value: string) => {
        setHeadId(value);
        // Remove Head from members list if they were already added (edge case)
        setMembers(prev => prev.filter(m => m.citizenId !== value));
    };

    const handleAddressAutoPopulate = (checked: boolean) => {
        if (checked && headId) {
            const head = availableCitizens.find(c => c._id === headId);
            if (head) {
                // Prefer permanent address parts, construct string
                // Or just use the 'address' field if string. 
                // The citizen object from backend has 'permanentAddress' populated if available.
                const perm = head.permanentAddress;
                if (perm && typeof perm === 'object') {
                    const addrParts = [
                        perm.houseName,
                        perm.place,
                        perm.village,
                        perm.taluk,
                        perm.district,
                        perm.pinCode
                    ].filter(Boolean).join(", ");
                    setAddress(addrParts);
                } else if (head.address) {
                    setAddress(head.address);
                }
            }
        }
    };

    const handleAddMember = () => {
        if (!selectedMemberId || !selectedRelationship) return;

        const citizen = availableCitizens.find(c => c._id === selectedMemberId);
        if (!citizen) return;

        // Prevent duplicates
        if (members.find(m => m.citizenId === selectedMemberId)) return;
        if (selectedMemberId === headId) return; // Cannot add Head as normal member

        setMembers(prev => [...prev, {
            citizenId: selectedMemberId,
            relationship: selectedRelationship,
            name: citizen.name
        }]);

        // Reset selection
        setSelectedMemberId("");
        setSelectedRelationship("");
    };

    const handleRemoveMember = (id: string) => {
        setMembers(prev => prev.filter(m => m.citizenId !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        if (!headId) {
            setError("Head of Family is required.");
            setIsSubmitting(false);
            return;
        }

        try {
            const payload = {
                familyName,
                wardNumber: Number(wardNumber),
                address,
                rationCardNumber,
                headCitizenId: headId,
                members: members.map(m => ({
                    citizenId: m.citizenId,
                    relationship: m.relationship
                }))
            };

            await familyService.create(payload);
            navigate("/families"); // Redirect to list (not yet created but good practice)
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to create family.");
            setIsSubmitting(false);
        }
    };

    // -- Derived State --

    // Filter potential heads: Age >= 18
    const eligibleHeads = availableCitizens
        .filter(c => c.age >= 18)
        .filter(c => {
            if (rationCardNumber && c.rationCardNumber) {
                return c.rationCardNumber.toLowerCase().includes(rationCardNumber.toLowerCase());
            }
            return true;
        })
        .sort((a, b) => {
            if (rationCardNumber) {
                const aExact = a.rationCardNumber === rationCardNumber ? 1 : 0;
                const bExact = b.rationCardNumber === rationCardNumber ? 1 : 0;
                return bExact - aExact;
            }
            return 0;
        });

    // Filter potential members: Not Head, Not already selected
    const eligibleMembers = availableCitizens
        .filter(c => c._id !== headId && !members.find(m => m.citizenId === c._id))
        .filter(c => {
            if (rationCardNumber && c.rationCardNumber) {
                return c.rationCardNumber.toLowerCase().includes(rationCardNumber.toLowerCase());
            }
            return true;
        })
        .sort((a, b) => {
            if (rationCardNumber) {
                const aExact = a.rationCardNumber === rationCardNumber ? 1 : 0;
                const bExact = b.rationCardNumber === rationCardNumber ? 1 : 0;
                return bExact - aExact;
            }
            return 0;
        });

    if (!jurisdiction) return null;

    return (
        <main className="flex flex-col items-center w-full mt-8 pb-10">
            <Card className="w-full max-w-3xl">
                <CardHeader className="bg-slate-50 border-b flex flex-row items-center gap-4 space-y-0">
                    <Button variant="ghost" size="icon" type="button" onClick={() => navigate(-1)} className="rounded-full shrink-0 -ml-2">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <CardTitle className="text-2xl text-primary">Create New Family</CardTitle>
                        <CardDescription>
                            Create a family group for citizens in <strong>{jurisdiction.villageName}</strong>.
                        </CardDescription>
                    </div>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="grid gap-6 pt-6">
                        {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

                        {/* Family Meta Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="familyName">Family Name <span className="text-red-500">*</span></Label>
                                <Input id="familyName" value={familyName} onChange={e => setFamilyName(e.target.value)} required placeholder="e.g. Puthenveedu" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rationCard">Ration Card Number <span className="text-red-500">*</span></Label>
                                <Input id="rationCard" value={rationCardNumber} onChange={e => setRationCardNumber(e.target.value)} required placeholder="Unique Ration Card No." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="wardNumber">Ward Number <span className="text-red-500">*</span></Label>
                                <Input id="wardNumber" type="number" value={wardNumber} onChange={e => setWardNumber(e.target.value)} required placeholder="Ward No." />
                            </div>
                        </div>

                        {/* Head of Family Selection */}
                        <div className="space-y-2 border p-4 rounded-md bg-slate-50">
                            <Label htmlFor="head">Head of Family <span className="text-red-500">*</span></Label>
                            <Select value={headId} onValueChange={handleHeadChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder={isLoadingCitizens ? "Loading..." : "Select Head of Family (Age 18+)"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {eligibleHeads.map(citizen => (
                                        <SelectItem key={citizen._id} value={citizen._id}>
                                            {citizen.name} (Age: {citizen.age}, ID: {citizen.uniqueId}) {citizen.rationCardNumber ? `[Ration: ${citizen.rationCardNumber}]` : ''}
                                        </SelectItem>
                                    ))}
                                    {eligibleHeads.length === 0 && !isLoadingCitizens && (
                                        <div className="p-2 text-sm text-slate-500">No eligible citizens found.</div>
                                    )}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-slate-500">Only citizens aged 18+ who are not in any family are listed.</p>
                        </div>

                        {/* Address */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="address">Family Address <span className="text-red-500">*</span></Label>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="autoAddress" onChange={(e: any) => handleAddressAutoPopulate(e.target.checked)} disabled={!headId} />
                                    <Label htmlFor="autoAddress" className="font-normal text-xs cursor-pointer">Use Head's Address</Label>
                                </div>
                            </div>
                            <Textarea id="address" value={address} onChange={e => setAddress(e.target.value)} required placeholder="Full Address of the house" />
                        </div>

                        {/* Members Selection */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="font-medium">Add Family Members</h3>

                            <div className="flex gap-2 items-end">
                                <div className="flex-1 space-y-2">
                                    <Label>Select Member</Label>
                                    <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Citizen" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {eligibleMembers.map(citizen => (
                                                <SelectItem key={citizen._id} value={citizen._id}>
                                                    {citizen.name} (Age: {citizen.age}) {citizen.rationCardNumber ? `[Ration: ${citizen.rationCardNumber}]` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-[200px] space-y-2">
                                    <Label>Relationship to Head</Label>
                                    <Select value={selectedRelationship} onValueChange={setSelectedRelationship}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Relationship" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Spouse">Spouse</SelectItem>
                                            <SelectItem value="Son">Son</SelectItem>
                                            <SelectItem value="Daughter">Daughter</SelectItem>
                                            <SelectItem value="Father">Father</SelectItem>
                                            <SelectItem value="Mother">Mother</SelectItem>
                                            <SelectItem value="Brother">Brother</SelectItem>
                                            <SelectItem value="Sister">Sister</SelectItem>
                                            <SelectItem value="Grandfather">Grandfather</SelectItem>
                                            <SelectItem value="Grandmother">Grandmother</SelectItem>
                                            <SelectItem value="Grandson">Grandson</SelectItem>
                                            <SelectItem value="Granddaughter">Granddaughter</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button type="button" onClick={handleAddMember} disabled={!selectedMemberId || !selectedRelationship}>
                                    Add
                                </Button>
                            </div>

                            {/* Added Members List */}
                            {members.length > 0 && (
                                <div className="bg-slate-50 rounded-md border text-sm mt-2">
                                    <div className="grid grid-cols-12 gap-2 p-2 font-medium border-b text-slate-500">
                                        <div className="col-span-1">#</div>
                                        <div className="col-span-6">Name</div>
                                        <div className="col-span-4">Relationship</div>
                                        <div className="col-span-1"></div>
                                    </div>
                                    {members.map((m, idx) => (
                                        <div key={m.citizenId} className="grid grid-cols-12 gap-2 p-2 items-center hover:bg-white border-b last:border-0">
                                            <div className="col-span-1">{idx + 1}</div>
                                            <div className="col-span-6 font-medium">{m.name}</div>
                                            <div className="col-span-4">{m.relationship}</div>
                                            <div className="col-span-1 text-right">
                                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemoveMember(m.citizenId)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </CardContent>
                    <CardFooter className="justify-between border-t pt-6 bg-slate-50">
                        <Button variant="outline" type="button" onClick={() => navigate('/families')}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="w-40">
                            {isSubmitting ? "Creating..." : "Create Family"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </main>
    );
}
