import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Trash2, Network } from "lucide-react";
import familyService from "@/services/familyService";
import FamilyTreeVisualizer from "@/components/FamilyTreeVisualizer";

interface Citizen {
    _id: string;
    name: string;
    uniqueId: string;
    relationshipToHead?: string;
}

interface RemovedMember {
    citizen: Citizen;
    reason: string;
    removedAt: string;
}

interface Family {
    _id: string;
    familyName: string;
    headOfFamily: Citizen;
    members: Citizen[];
    removedMembers?: RemovedMember[];
    village: string;
    wardNumber: string;
    rationCardNumber: string;
    totalAnnualIncome: number;
}

export default function FamilyDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [family, setFamily] = useState<Family | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isTreeOpen, setIsTreeOpen] = useState(false);

    // Add Member State
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [availableCitizens, setAvailableCitizens] = useState<Citizen[]>([]);
    const [searchResults, setSearchResults] = useState<Citizen[]>([]);
    const [selectedCitizenId, setSelectedCitizenId] = useState("");
    const [selectedRelationship, setSelectedRelationship] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    // Remove Member State
    const [isRemoveOpen, setIsRemoveOpen] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState<Citizen | null>(null);
    const [removeReason, setRemoveReason] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isRemoving, setIsRemoving] = useState(false);

    useEffect(() => {
        if (id) {
            fetchFamily(id);
        }
    }, [id]);

    const fetchFamily = async (familyId: string) => {
        try {
            const data = await familyService.getById(familyId);
            setFamily(data);
        } catch (err) {
            console.error("Failed to fetch family details", err);
            setError("Failed to load family details.");
        } finally {
            setIsLoading(false);
        }
    };

    // Load available citizens when dialog opens
    useEffect(() => {
        if (isAddMemberOpen) {
            fetchAvailableCitizens();
        } else {
            setSearchQuery("");
            setSearchResults([]);
            setSelectedCitizenId("");
            setSelectedRelationship("");
        }
    }, [isAddMemberOpen]);

    const fetchAvailableCitizens = async () => {
        try {
            const citizens = await familyService.getAvailableCitizens();
            setAvailableCitizens(citizens);
            setSearchResults(citizens); // Show all initially
        } catch (err) {
            console.error("Failed to load available citizens", err);
        }
    };

    // Filter locally when user types
    useEffect(() => {
        if (!searchQuery) {
            setSearchResults(availableCitizens);
        } else {
            const filtered = availableCitizens.filter((c: Citizen) =>
                c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.uniqueId && c.uniqueId.includes(searchQuery))
            );
            setSearchResults(filtered);
        }
    }, [searchQuery, availableCitizens]);

    const handleAddMember = async () => {
        if (!selectedCitizenId || !id) return;
        setIsAdding(true);
        try {
            const updatedFamily = await familyService.addMember(id, selectedCitizenId, selectedRelationship);
            setFamily(updatedFamily);
            setIsAddMemberOpen(false);
            setSelectedCitizenId("");
            setSelectedRelationship("");
            setSearchQuery("");
            setSearchResults([]);
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to add member");
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveMember = async () => {
        if (!memberToRemove || !id || !removeReason || !selectedFile) return;
        setIsRemoving(true);
        try {
            const updatedFamily = await familyService.removeMember(id, memberToRemove._id, removeReason, selectedFile);
            setFamily(updatedFamily);
            setIsRemoveOpen(false);
            setMemberToRemove(null);
            setRemoveReason("");
            setSelectedFile(null);
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to remove member");
        } finally {
            setIsRemoving(false);
        }
    };

    const openRemoveDialog = (member: Citizen) => {
        setMemberToRemove(member);
        setIsRemoveOpen(true);
    };

    if (isLoading) return <div className="flex justify-center p-8">Loading...</div>;
    if (error || !family) return <div className="p-8 text-red-500">{error || "Family not found"}</div>;

    if (isLoading) return <div className="flex justify-center p-8">Loading...</div>;
    if (error || !family) return <div className="p-8 text-red-500">{error || "Family not found"}</div>;

    return (
        <main className="flex flex-col items-center p-4 sm:px-6 sm:py-0 mt-8">
            <Card className="w-full max-w-4xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl">{family.familyName}</CardTitle>
                        <CardDescription>Ration Card: {family.rationCardNumber}</CardDescription>
                    </div>
                    <Button onClick={() => navigate('/families')}>Back to List</Button>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-semibold">Head of Family:</span> {family.headOfFamily?.name}
                        </div>
                        <div>
                            <span className="font-semibold">Village:</span> {family.village}
                        </div>
                        <div>
                            <span className="font-semibold">Ward:</span> {family.wardNumber}
                        </div>
                        <div>
                            <span className="font-semibold">Total Annual Income:</span> ₹{family.totalAnnualIncome}
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Family Members</h3>
                            <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="gap-2">
                                        <Plus className="h-4 w-4" /> Add Member
                                    </Button>
                                </DialogTrigger>
                                <Button size="sm" variant="outline" className="gap-2 ml-2" onClick={() => setIsTreeOpen(true)}>
                                    <Network className="h-4 w-4" /> View Family Tree
                                </Button>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Add Family Member</DialogTitle>
                                        <DialogDescription>
                                            Search for an existing citizen to add to this family.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Search available citizens..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                            <Button size="icon" variant="ghost" disabled>
                                                <Search className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="max-h-[200px] overflow-y-auto space-y-2">
                                            {searchResults.length === 0 && searchQuery && <p className="text-sm text-muted-foreground text-center">No results found (or already in family)</p>}
                                            {searchResults.map(citizen => (
                                                <div
                                                    key={citizen._id}
                                                    className={`flex items-center justify-between p-2 rounded border cursor-pointer ${selectedCitizenId === citizen._id ? 'border-primary bg-primary/10' : 'hover:bg-muted'}`}
                                                    onClick={() => setSelectedCitizenId(citizen._id)}
                                                >
                                                    <div>
                                                        <p className="font-medium">{citizen.name}</p>
                                                        <p className="text-xs text-muted-foreground">ID: {citizen.uniqueId}</p>
                                                    </div>
                                                    {selectedCitizenId === citizen._id && <div className="h-2 w-2 rounded-full bg-primary" />}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>Relationship to Head</Label>
                                            <Select value={selectedRelationship} onValueChange={setSelectedRelationship}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select relationship" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Wife">Wife</SelectItem>
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
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" onClick={handleAddMember} disabled={!selectedCitizenId || isAdding}>
                                            {isAdding ? "Adding..." : "Add Member"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="bg-muted/50 rounded-md p-2">
                            {family.members && family.members.length > 0 ? (
                                <ul className="space-y-4">
                                    {family.members.map((member: any) => (
                                        <li key={member._id} className="flex justify-between items-start bg-background p-4 rounded shadow-sm">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-lg">{member.name}</span>
                                                    <span className="text-sm bg-primary/10 text-primary px-2 py-0.5 rounded-full">{member.relationshipToHead}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-2 text-sm text-muted-foreground">
                                                    <span>Age: {member.age}</span>
                                                    <span>Gender: {member.gender}</span>
                                                    <span>Income: ₹{member.annualIncome || 0}</span>
                                                    <span>ID: {member.uniqueId}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => openRemoveDialog(member)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-muted-foreground py-4">No other family members added.</p>
                            )}
                        </div>

                        {family.removedMembers && family.removedMembers.length > 0 && (
                            <div className="mt-6 border-t pt-4">
                                <h3 className="text-lg font-semibold mb-2">Removed Members</h3>
                                <div className="bg-red-50 rounded-md p-2">
                                    <ul className="space-y-2">
                                        {family.removedMembers.map((item, index) => (
                                            <li key={index} className="flex justify-between items-center bg-background p-3 rounded shadow-sm border border-red-100">
                                                <div>
                                                    <span className="font-medium">{item.citizen.name}</span>
                                                    <span className="text-xs text-red-500 ml-2">({item.reason})</span>
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(item.removedAt).toLocaleDateString()}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        <Dialog open={isRemoveOpen} onOpenChange={setIsRemoveOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Remove Member</DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to remove {memberToRemove?.name}? This action will record the reason for removal.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label>Reason for Removal</Label>
                                        <Select value={removeReason} onValueChange={setRemoveReason}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select reason" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Death">Death</SelectItem>
                                                <SelectItem value="Marriage">Marriage</SelectItem>
                                                <SelectItem value="Family Change">Family Change</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Certificate (Required)</Label>
                                        <Input
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsRemoveOpen(false)}>Cancel</Button>
                                    <Button variant="destructive" onClick={handleRemoveMember} disabled={!removeReason || !selectedFile || isRemoving}>
                                        {isRemoving ? "Removing..." : "Remove Member"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardContent>
            </Card>

            <FamilyTreeVisualizer
                isOpen={isTreeOpen}
                onClose={() => setIsTreeOpen(false)}
                family={family}
            />
        </main>
    );
}
