import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import citizenService from "@/services/citizenService";

interface Citizen {
    _id: string;
    name: string;
    dob?: string;
    age: number;
    gender: string;
    houseName?: string;
    place?: string;
    locality?: string;
    district?: string;
    address: string;
    contactNumber: string;
    uniqueId: string;
    headOfFamily: boolean;
    occupation?: string;
    annualIncome?: number;
}

export default function CitizenDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [citizen, setCitizen] = useState<Citizen | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (id) {
            fetchCitizen(id);
        }
    }, [id]);

    const fetchCitizen = async (citizenId: string) => {
        try {
            const data = await citizenService.getById(citizenId);
            setCitizen(data);
        } catch (err) {
            console.error("Failed to fetch citizen details", err);
            setError("Failed to load citizen details.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen w-full bg-muted/40 items-center justify-center">
                Loading...
            </div>
        );
    }

    if (error || !citizen) {
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <p className="text-red-500 mb-4">{error || "Citizen not found"}</p>
                <Button variant="outline" onClick={() => navigate('/citizens')}>Back to List</Button>
            </div>
        );
    }

    return (
        <main className="flex flex-col items-center w-full mt-8">
            <Card className="w-full max-w-3xl">
                <CardHeader>
                    <CardTitle className="text-2xl">Citizen Details</CardTitle>
                    <CardDescription>Full information for {citizen.name}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="grid gap-1">
                            <Label className="text-muted-foreground">Name</Label>
                            <p className="font-medium">{citizen.name}</p>
                        </div>
                        <div className="grid gap-1">
                            <Label className="text-muted-foreground">Unique ID (Aadhaar)</Label>
                            <p className="font-medium">{citizen.uniqueId}</p>
                        </div>
                        <div className="grid gap-1">
                            <Label className="text-muted-foreground">Date of Birth</Label>
                            <p className="font-medium">{citizen.dob ? new Date(citizen.dob).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div className="grid gap-1">
                            <Label className="text-muted-foreground">Age</Label>
                            <p className="font-medium">{citizen.age}</p>
                        </div>
                        <div className="grid gap-1">
                            <Label className="text-muted-foreground">Gender</Label>
                            <p className="font-medium">{citizen.gender}</p>
                        </div>
                        <div className="grid gap-1">
                            <Label className="text-muted-foreground">Mobile Number</Label>
                            <p className="font-medium">{citizen.contactNumber}</p>
                        </div>

                        <div className="grid gap-1 md:col-span-2">
                            <Label className="text-muted-foreground">Address Details</Label>
                            <div className="text-sm space-y-1">
                                {/* Fallback parsing if individual fields are missing */}
                                {(() => {
                                    const house = citizen.houseName || (citizen.address ? citizen.address.split(',')[0]?.trim() : 'N/A');
                                    const place = citizen.place || (citizen.address ? citizen.address.split(',')[1]?.trim() : 'N/A');
                                    const locality = citizen.locality || (citizen.address ? citizen.address.split(',')[2]?.trim() : 'N/A');
                                    const district = citizen.district || (citizen.address ? citizen.address.split(',')[3]?.trim() : 'N/A');

                                    return (
                                        <>
                                            <p><span className="font-semibold">House:</span> {house}</p>
                                            <p><span className="font-semibold">Place:</span> {place}</p>
                                            <p><span className="font-semibold">Locality:</span> {locality}</p>
                                            <p><span className="font-semibold">District:</span> {district}</p>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>

                        <div className="grid gap-1">
                            <Label className="text-muted-foreground">Head of Family</Label>
                            <p className="font-medium">{citizen.headOfFamily ? "Yes" : "No"}</p>
                        </div>
                        <div className="grid gap-1">
                            <Label className="text-muted-foreground">Occupation</Label>
                            <p className="font-medium">{citizen.occupation || 'N/A'}</p>
                        </div>
                        <div className="grid gap-1">
                            <Label className="text-muted-foreground">Annual Income</Label>
                            <p className="font-medium">{citizen.annualIncome || '0'}</p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button onClick={() => navigate('/citizens')}>Back to List</Button>
                </CardFooter>
            </Card>
        </main>
    );
}
