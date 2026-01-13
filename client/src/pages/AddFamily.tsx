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

import { Textarea } from "@/components/ui/textarea";
import citizenService from "@/services/citizenService";
import familyService from "@/services/familyService";
import { Search, X, Plus } from "lucide-react";

interface Citizen {
    _id: string;
    name: string;
    uniqueId: string;
}

export default function AddFamily() {
    const navigate = useNavigate();
    const [citizens, setCitizens] = useState<Citizen[]>([]);
    const [formData, setFormData] = useState({
        familyName: "",
        address: "",
        village: "",
        wardNumber: "",
        rationCardNumber: "",
        headOfFamily: "",
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMembers, setSelectedMembers] = useState<Citizen[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchCitizens();
    }, []);

    const fetchCitizens = async () => {
        try {
            const data = await citizenService.getAll();
            setCitizens(data);
        } catch (err) {
            console.error("Failed to fetch citizens", err);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleHeadChange = (value: string) => {
        setFormData({ ...formData, headOfFamily: value });
    };

    const handleAddMember = (citizen: Citizen) => {
        if (!selectedMembers.find(m => m._id === citizen._id)) {
            setSelectedMembers([...selectedMembers, citizen]);
        }
        setSearchTerm("");
    };

    const handleRemoveMember = (id: string) => {
        setSelectedMembers(selectedMembers.filter(m => m._id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            await familyService.create({
                ...formData,
                members: selectedMembers.map(m => m._id),
            });
            navigate("/families");
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError(err.response?.data?.message || "Failed to create family");
            setIsLoading(false);
        }
    };

    const filteredCitizens = citizens.filter(c =>
        (c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.uniqueId.includes(searchTerm)) &&
        !selectedMembers.find(m => m._id === c._id) &&
        c._id !== formData.headOfFamily
    );

    return (
        <main className="flex flex-col items-center w-full mt-8">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl">Add New Family</CardTitle>
                    <CardDescription>Enter family details and add members.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="grid gap-6">
                        {error && <div className="text-red-500 text-sm">{error}</div>}

                        {/* Basic Details */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="familyName">Family Name</Label>
                                <Input id="familyName" placeholder="e.g. The Smith Family" value={formData.familyName} onChange={handleInputChange} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="village">Village</Label>
                                <Input id="village" placeholder="Village Name" value={formData.village} onChange={handleInputChange} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea id="address" placeholder="Full Address" value={formData.address} onChange={handleInputChange} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="wardNumber">Ward Number</Label>
                                <Input id="wardNumber" placeholder="Ward No." value={formData.wardNumber} onChange={handleInputChange} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="rationCardNumber">Ration Card Number</Label>
                                <Input id="rationCardNumber" placeholder="Ration Card No." value={formData.rationCardNumber} onChange={handleInputChange} />
                            </div>
                        </div>

                        {/* Head of Family */}
                        <div className="grid gap-2">
                            <Label htmlFor="headOfFamily">Head of Family</Label>
                            <select
                                id="headOfFamily"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.headOfFamily}
                                onChange={(e) => handleHeadChange(e.target.value)}
                            >
                                <option value="" disabled>Select Head of Family</option>
                                {citizens.map(citizen => (
                                    <option key={citizen._id} value={citizen._id}>
                                        {citizen.name} ({citizen.uniqueId})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Members Section */}
                        <div className="grid gap-2">
                            <Label>Family Members</Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search citizens to add..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Search Results */}
                            {searchTerm && (
                                <div className="border rounded-md mt-2 max-h-40 overflow-y-auto bg-background shadow-sm">
                                    {filteredCitizens.length > 0 ? (
                                        filteredCitizens.map(citizen => (
                                            <div
                                                key={citizen._id}
                                                className="p-2 hover:bg-muted cursor-pointer flex justify-between items-center"
                                                onClick={() => handleAddMember(citizen)}
                                            >
                                                <span>{citizen.name} <span className="text-muted-foreground text-xs">({citizen.uniqueId})</span></span>
                                                <Plus className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-2 text-sm text-muted-foreground text-center">
                                            No citizen found.
                                            <Button variant="link" className="h-auto p-0 ml-1" onClick={() => navigate('/citizens')}>Add new citizen?</Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Selected Members List */}
                            <div className="space-y-2 mt-2">
                                {selectedMembers.map(member => (
                                    <div key={member._id} className="flex items-center justify-between bg-secondary/50 p-2 rounded-md">
                                        <span className="text-sm">{member.name}</span>
                                        <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(member._id)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter className="justify-between">
                        <Button variant="outline" type="button" onClick={() => navigate('/families')}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Creating..." : "Create Family"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </main>
    );
}
