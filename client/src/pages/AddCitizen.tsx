import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/components/ui/card";
import citizenService from "@/services/citizenService";

const districts = [
    "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam",
    "Idukki", "Ernakulam", "Thrissur", "Palakkad", "Malappuram",
    "Kozhikode", "Wayanad", "Kannur", "Kasaragod"
];

export default function AddCitizen() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        dob: "",
        gender: "Male",
        houseName: "",
        place: "",
        locality: "",
        district: "",
        contactNumber: "",
        uniqueId: "", // Aadhaar
        annualIncome: "",
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleGenderChange = (value: string) => {
        setFormData({ ...formData, gender: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            // Calculate age from DOB roughly
            const birthDate = new Date(formData.dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            await citizenService.create({
                ...formData,
                age: age,
                address: `${formData.houseName}, ${formData.place}, ${formData.locality}, ${formData.district}`
            });
            navigate("/citizens");
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError(err.response?.data?.message || "Failed to create citizen");
            setIsLoading(false);
        }
    };

    return (
        <main className="flex flex-col items-center w-full mt-8">
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <CardTitle className="text-2xl">Add New Citizen</CardTitle>
                    <CardDescription>Enter the personal details of the citizen.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="grid gap-6">
                        {error && <div className="text-red-500 text-sm">{error}</div>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name */}
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                                <Input id="name" value={formData.name} onChange={handleInputChange} required />
                            </div>

                            {/* Date of Birth */}
                            <div className="grid gap-2">
                                <Label htmlFor="dob">Date of Birth <span className="text-red-500">*</span></Label>
                                <Input type="date" id="dob" value={formData.dob} onChange={handleInputChange} required />
                            </div>

                            {/* Gender */}
                            <div className="grid gap-2 md:col-span-2">
                                <Label>Gender <span className="text-red-500">*</span></Label>
                                <div className="flex gap-4">
                                    {["Male", "Female", "Transgender"].map((g) => (
                                        <div key={g} className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id={g}
                                                name="gender"
                                                value={g}
                                                checked={formData.gender === g}
                                                onChange={() => handleGenderChange(g)}
                                                className="aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                            <Label htmlFor={g} className="font-normal cursor-pointer">{g}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* House No/Name */}
                            <div className="grid gap-2">
                                <Label htmlFor="houseName">House No/Name <span className="text-red-500">*</span></Label>
                                <Input id="houseName" value={formData.houseName} onChange={handleInputChange} required />
                            </div>

                            {/* Place */}
                            <div className="grid gap-2">
                                <Label htmlFor="place">Place <span className="text-red-500">*</span></Label>
                                <Input id="place" value={formData.place} onChange={handleInputChange} required />
                            </div>

                            {/* Locality */}
                            <div className="grid gap-2">
                                <Label htmlFor="locality">Locality <span className="text-red-500">*</span></Label>
                                <Input id="locality" value={formData.locality} onChange={handleInputChange} required />
                            </div>

                            {/* District */}
                            <div className="grid gap-2">
                                <Label htmlFor="district">District <span className="text-red-500">*</span></Label>
                                <select
                                    id="district"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.district}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="" disabled>--Select District--</option>
                                    {districts.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Mobile No */}
                            <div className="grid gap-2">
                                <Label htmlFor="contactNumber">Mobile No <span className="text-red-500">*</span></Label>
                                <Input id="contactNumber" value={formData.contactNumber} onChange={handleInputChange} required />
                                <p className="text-xs text-red-500">Enter the mobile number registered in your Aadhaar</p>
                            </div>

                            {/* Aadhaar No */}
                            <div className="grid gap-2">
                                <Label htmlFor="uniqueId">Aadhaar No</Label>
                                <Input id="uniqueId" value={formData.uniqueId} onChange={handleInputChange} required />
                            </div>

                            {/* Annual Income */}
                            <div className="grid gap-2">
                                <Label htmlFor="annualIncome">Annual Income</Label>
                                <Input id="annualIncome" type="number" value={formData.annualIncome} onChange={handleInputChange} />
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter className="justify-between">
                        <Button variant="outline" type="button" onClick={() => navigate('/citizens')}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Creating..." : "Create Citizen"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </main>
    );
}
