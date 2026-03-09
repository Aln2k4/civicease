import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import citizenService from "@/services/citizenService";

export default function AddCitizen() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [official, setOfficial] = useState<any>(null);

    const [formData, setFormData] = useState({
        // Section 1: Basic Personal Details
        name: "",
        dob: "",
        age: "",
        gender: "",
        maritalStatus: "",
        occupation: "",
        annualIncome: "",
        familyAnnualIncome: "",

        // Section 2: Present Address
        houseName: "",
        ward: "",
        place: "",
        pinCode: "",
        // residenceYears removed

        // Permanent Address
        sameAsPresent: false,
        permHouseName: "",
        permPlace: "",
        permVillage: "",
        permTaluk: "",
        permDistrict: "",
        permPinCode: "",
        // ... rest of state
        // Section 3: Family Details
        fatherName: "",
        motherName: "",
        spouseName: "",

        // Section 4: Contact
        contactNumber: "",
        alternateMobile: "",
        email: "",

        // Section 5: IDs
        uniqueId: "", // Aadhaar
        rationCardNumber: "",
        electionId: "",
        drivingLicence: "",
        passportNumber: "",

        // Section 6: Community
        religion: "",
        caste: "",
        communityCategory: "",
        fatherReligion: "",
        fatherCaste: "",
        motherReligion: "",
        motherCaste: "",
        birthCertificate: null as File | null,
    });

    useEffect(() => {
        // Load official details for Jurisdiction Locking
        const storedOfficial = localStorage.getItem('official');
        if (storedOfficial) {
            const parsed = JSON.parse(storedOfficial);
            setOfficial(parsed);
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;

        // Handle File Input
        if (e.target instanceof HTMLInputElement && e.target.type === 'file') {
            const files = e.target.files;
            if (files && files.length > 0) {
                setFormData(prev => ({ ...prev, birthCertificate: files[0] }));
            }
            return;
        }

        setFormData(prev => {
            const updated = { ...prev, [id]: value };

            // Auto-calculate Age
            if (id === 'dob') {
                const birthDate = new Date(value);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                updated.age = age >= 0 ? age.toString() : "";
            }

            // Reset incomes if occupation changes
            if (id === 'occupation') {
                if (value === 'Student') {
                    updated.annualIncome = "0";
                    updated.familyAnnualIncome = "";
                } else {
                    updated.annualIncome = "";
                    updated.familyAnnualIncome = "0";
                }
            }

            return updated;
        });
    };


    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setFormData(prev => ({
            ...prev,
            sameAsPresent: checked,
            // If checked, we might want to clear or auto-fill visual fields, 
            // but usually we just hide them and handle data on submit.
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            // Validation
            if (!formData.birthCertificate) {
                throw new Error("Birth Certificate is mandatory. Please upload a valid document.");
            }

            // Construct FormData payload
            const payload = new FormData();

            // Append all simple fields
            payload.append('name', formData.name);
            payload.append('dob', formData.dob);
            payload.append('age', formData.age);
            payload.append('gender', formData.gender);
            payload.append('maritalStatus', formData.maritalStatus);
            payload.append('occupation', formData.occupation);
            payload.append('annualIncome', formData.occupation !== 'Student' ? formData.annualIncome : '0');
            payload.append('familyAnnualIncome', formData.occupation === 'Student' ? formData.familyAnnualIncome : '0');

            payload.append('houseName', formData.houseName);
            payload.append('ward', formData.ward);
            payload.append('place', formData.place);
            payload.append('pinCode', formData.pinCode);

            // Handle Nested / Conditional Fields manually for FormData
            if (formData.sameAsPresent) {
                payload.append('permanentAddress[houseName]', formData.houseName);
                payload.append('permanentAddress[place]', formData.place);
                payload.append('permanentAddress[village]', official?.villageContext?.villageName || '');
                payload.append('permanentAddress[taluk]', official?.villageContext?.taluk || '');
                payload.append('permanentAddress[district]', official?.villageContext?.district || '');
                payload.append('permanentAddress[pinCode]', formData.pinCode);
            } else {
                payload.append('permanentAddress[houseName]', formData.permHouseName);
                payload.append('permanentAddress[place]', formData.permPlace);
                payload.append('permanentAddress[village]', formData.permVillage);
                payload.append('permanentAddress[taluk]', formData.permTaluk);
                payload.append('permanentAddress[district]', formData.permDistrict);
                payload.append('permanentAddress[pinCode]', formData.permPinCode);
            }
            payload.append('isPermanentSameAsPresent', String(formData.sameAsPresent)); // Convert boolean to string

            payload.append('fatherName', formData.fatherName);
            if (formData.motherName) payload.append('motherName', formData.motherName);
            if (formData.maritalStatus === 'Married') payload.append('spouseName', formData.spouseName);

            payload.append('contactNumber', formData.contactNumber);
            if (formData.alternateMobile) payload.append('alternateMobile', formData.alternateMobile);
            if (formData.email) payload.append('email', formData.email);

            if (formData.uniqueId) payload.append('uniqueId', formData.uniqueId);
            if (formData.rationCardNumber) payload.append('rationCardNumber', formData.rationCardNumber);
            if (formData.electionId) payload.append('electionId', formData.electionId);
            if (formData.drivingLicence) payload.append('drivingLicence', formData.drivingLicence);
            if (formData.passportNumber) payload.append('passportNumber', formData.passportNumber);

            if (formData.religion) payload.append('religion', formData.religion);
            if (formData.caste) payload.append('caste', formData.caste);
            if (formData.communityCategory) payload.append('communityCategory', formData.communityCategory);

            // Append File
            if (formData.birthCertificate) {
                payload.append('birthCertificate', formData.birthCertificate);
            }

            // Note: citizenService.create needs to handle FormData correctly (removing Content-Type header usually lets browser set it)
            await citizenService.create(payload);
            navigate("/citizens");
        } catch (err: any) {
            console.error(err);
            setError(err.message || err.response?.data?.message || "Failed to create citizen. Please check all fields.");
            setIsLoading(false);
        }
    };

    if (!official) return null; // or loading spinner

    // Jurisdiction Data
    const jurisdiction = official.villageContext || {};

    return (
        <main className="flex flex-col items-center w-full mt-8 pb-10">
            <Card className="w-full max-w-5xl">
                <CardHeader className="bg-slate-50 border-b">
                    <CardTitle className="text-2xl text-primary">Add New Citizen</CardTitle>
                    <CardDescription>
                        Register a new citizen under <strong>{jurisdiction.villageName}</strong>, {jurisdiction.taluk}, {jurisdiction.district}.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="grid gap-8 pt-6">
                        {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

                        {/* SECTION 1: Personal Details */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">1. Basic Personal Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                                    <Input id="name" value={formData.name} onChange={handleInputChange} required placeholder="Name in Malayalam or English" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dob">Date of Birth <span className="text-red-500">*</span></Label>
                                    <Input type="date" id="dob" value={formData.dob} onChange={handleInputChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="birthCertificate">Birth Certificate (Validation Required) <span className="text-red-500">*</span></Label>
                                    <Input type="file" id="birthCertificate" accept="image/*,.pdf" onChange={handleInputChange} required className="cursor-pointer" />
                                    <p className="text-[10px] text-muted-foreground">Upload clear image of valid Birth Certificate.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="age">Age</Label>
                                    <Input id="age" value={formData.age} readOnly className="bg-slate-100" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gender">Gender <span className="text-red-500">*</span></Label>
                                    <select id="gender" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.gender} onChange={handleInputChange} required>
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Transgender">Transgender</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maritalStatus">Marital Status <span className="text-red-500">*</span></Label>
                                    <select id="maritalStatus" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.maritalStatus} onChange={handleInputChange} required>
                                        <option value="">Select Status</option>
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                        <option value="Widow">Widow</option>
                                        <option value="Divorced">Divorced</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="occupation">Occupation <span className="text-red-500">*</span></Label>
                                    <select id="occupation" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.occupation} onChange={handleInputChange} required>
                                        <option value="">Select Occupation</option>
                                        <option value="Student">Student</option>
                                        <option value="Daily Wager">Daily Wager</option>
                                        <option value="Government Employee">Government Employee</option>
                                        <option value="Private Employee">Private Employee</option>
                                        <option value="Self Employed">Self Employed</option>
                                        <option value="Unemployed">Unemployed</option>
                                        <option value="Retired">Retired</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                {formData.occupation === 'Student' ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="familyAnnualIncome">Family Annual Income <span className="text-red-500">*</span></Label>
                                        <Input id="familyAnnualIncome" type="number" value={formData.familyAnnualIncome} onChange={handleInputChange} required placeholder="Total Family Income" />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label htmlFor="annualIncome">Annual Income <span className="text-red-500">*</span></Label>
                                        <Input id="annualIncome" type="number" value={formData.annualIncome} onChange={handleInputChange} required placeholder="Individual Income" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SECTION 2: Address Details */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">2. Address Details</h3>

                            {/* Present Address */}
                            <div className="bg-slate-50 p-4 rounded-md space-y-4">
                                <h4 className="text-sm font-medium text-slate-500 uppercase">Present Address (Jurisdiction)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="houseName">House No / Name</Label>
                                        <Input id="houseName" value={formData.houseName} onChange={handleInputChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="ward">Ward</Label>
                                        <Input id="ward" value={formData.ward} onChange={handleInputChange} placeholder="Ward Name/No." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="place">Place</Label>
                                        <Input id="place" value={formData.place} onChange={handleInputChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Village</Label>
                                        <Input value={jurisdiction.villageName || ''} readOnly className="bg-slate-200 cursor-not-allowed" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Taluk</Label>
                                        <Input value={jurisdiction.taluk || ''} readOnly className="bg-slate-200 cursor-not-allowed" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>District</Label>
                                        <Input value={jurisdiction.district || ''} readOnly className="bg-slate-200 cursor-not-allowed" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="pinCode">PIN Code <span className="text-red-500">*</span></Label>
                                        <Input id="pinCode" value={formData.pinCode} onChange={handleInputChange} required maxLength={6} pattern="\d{6}" placeholder="6 digits" />
                                    </div>
                                </div>
                            </div>


                            {/* Permanent Address */}
                            <div className="space-y-4 p-4 border rounded-md">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="sameAsPresent" checked={formData.sameAsPresent} onChange={handleCheckboxChange} />
                                    <Label htmlFor="sameAsPresent" className="cursor-pointer font-medium">Permanent Address is same as Present Address</Label>
                                </div>

                                {!formData.sameAsPresent && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="permHouseName">House No / Name</Label>
                                            <Input id="permHouseName" value={formData.permHouseName} onChange={handleInputChange} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="permPlace">Place</Label>
                                            <Input id="permPlace" value={formData.permPlace} onChange={handleInputChange} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="permVillage">Village</Label>
                                            <Input id="permVillage" value={formData.permVillage} onChange={handleInputChange} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="permTaluk">Taluk</Label>
                                            <Input id="permTaluk" value={formData.permTaluk} onChange={handleInputChange} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="permDistrict">District</Label>
                                            <Input id="permDistrict" value={formData.permDistrict} onChange={handleInputChange} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="permPinCode">PIN Code</Label>
                                            <Input id="permPinCode" value={formData.permPinCode} onChange={handleInputChange} maxLength={6} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SECTION 3: Family Details */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">3. Family Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fatherName">Father's Name <span className="text-red-500">*</span></Label>
                                    <Input id="fatherName" value={formData.fatherName} onChange={handleInputChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="motherName">Mother's Name</Label>
                                    <Input id="motherName" value={formData.motherName} onChange={handleInputChange} />
                                </div>
                                {formData.maritalStatus === 'Married' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="spouseName">Spouse Name <span className="text-red-500">*</span></Label>
                                        <Input id="spouseName" value={formData.spouseName} onChange={handleInputChange} required />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SECTION 4: Contact Details */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">4. Contact Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="contactNumber">Mobile Number <span className="text-red-500">*</span></Label>
                                    <Input id="contactNumber" value={formData.contactNumber} onChange={handleInputChange} required maxLength={10} pattern="\d{10}" placeholder="10-digit Mobile" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="alternateMobile">Alternate Mobile</Label>
                                    <Input id="alternateMobile" value={formData.alternateMobile} onChange={handleInputChange} maxLength={10} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email ID</Label>
                                    <Input id="email" type="email" value={formData.email} onChange={handleInputChange} />
                                </div>
                            </div>
                        </div>

                        {/* SECTION 5: Identity & Government IDs */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">5. Identity & Government IDs</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="uniqueId">Aadhaar Number</Label>
                                    <Input id="uniqueId" value={formData.uniqueId} onChange={handleInputChange} maxLength={12} placeholder="12-digit UID" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rationCardNumber">Ration Card Number</Label>
                                    <Input id="rationCardNumber" value={formData.rationCardNumber} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="electionId">Voter ID (Election ID)</Label>
                                    <Input id="electionId" value={formData.electionId} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="drivingLicence">Driving Licence</Label>
                                    <Input id="drivingLicence" value={formData.drivingLicence} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="passportNumber">Passport Number</Label>
                                    <Input id="passportNumber" value={formData.passportNumber} onChange={handleInputChange} />
                                </div>
                            </div>
                        </div>

                        {/* SECTION 6: Community & Religion */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">6. Community & Religion Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="religion">Religion</Label>
                                    <select id="religion" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.religion} onChange={handleInputChange}>
                                        <option value="">Select Religion</option>
                                        <option value="Hindu">Hindu</option>
                                        <option value="Christian">Christian</option>
                                        <option value="Muslim">Muslim</option>
                                        <option value="Sikh">Sikh</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="caste">Caste</Label>
                                    <Input id="caste" value={formData.caste} onChange={handleInputChange} placeholder="E.g. Nair, Ezhava, etc." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="communityCategory">Community Category</Label>
                                    <select id="communityCategory" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.communityCategory} onChange={handleInputChange}>
                                        <option value="">Select Category</option>
                                        <option value="General">General</option>
                                        <option value="OBC">OBC</option>
                                        <option value="SC">SC</option>
                                        <option value="ST">ST</option>
                                    </select>
                                </div>
                                {/* Parent's Religion/Caste if different - Optional, currently using simple text/select for simplicity */}
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter className="justify-between border-t pt-6 bg-slate-50">
                        <Button variant="outline" type="button" onClick={() => navigate('/citizens')}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="w-40">
                            {isLoading ? "Creating..." : "Create Citizen"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </main>
    );
}
