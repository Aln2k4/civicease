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
import { Separator } from "@/components/ui/separator";
import citizenService from "@/services/citizenService";
import serviceService from "@/services/serviceService";

interface Address {
    houseName?: string;
    place?: string;
    village?: string;
    taluk?: string;
    district?: string;
    pinCode?: string;
}

interface Citizen {
    _id: string;
    name: string;
    dob?: string;
    age: number;
    gender: string;
    maritalStatus?: string;

    // Present Address
    houseName?: string;
    place?: string;
    ward?: string;
    pinCode?: string;

    // Permanent Address
    permanentAddress?: Address;
    isPermanentSameAsPresent?: boolean;

    // Contact
    contactNumber: string;
    alternateMobile?: string;
    email?: string;

    // Family
    fatherName?: string;
    motherName?: string;
    spouseName?: string;

    // Stats/System
    uniqueId?: string;
    headOfFamily: boolean;
    occupation?: string;
    annualIncome?: number;
    familyAnnualIncome?: number;

    // IDs
    rationCardNumber?: string;
    electionId?: string;
    drivingLicence?: string;
    passportNumber?: string;

    // Community
    religion?: string;
    caste?: string;
    communityCategory?: string;

    // Documents
    birthCertificate?: string; // Path to file
}

export default function CitizenDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [citizen, setCitizen] = useState<Citizen | null>(null);
    const [services, setServices] = useState<any[]>([]);
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

            // Fetch certificates for this citizen
            const servicesData = await serviceService.getAll({ applicantId: citizenId });
            setServices(servicesData);
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

    const DetailItem = ({ label, value }: { label: string, value?: string | number }) => (
        <div className="grid gap-1">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">{label}</Label>
            <p className="font-medium text-sm">{value || "N/A"}</p>
        </div>
    );

    const calculateAge = (dobStr?: string): number | string => {
        if (!dobStr) return citizen.age || "N/A";
        const dob = new Date(dobStr);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        return age;
    };

    return (
        <main className="flex flex-col items-center w-full mt-8 pb-10">
            <Card className="w-full max-w-4xl shadow-md">
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl text-primary">Citizen Details</CardTitle>
                            <CardDescription>Full profile information for {citizen.name}</CardDescription>
                        </div>
                        {citizen.headOfFamily && (
                            <span className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-full font-semibold border border-primary/20">
                                Head of Family
                            </span>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="grid gap-8 p-6">

                    {/* Section 1: Personal Information */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
                            1. Personal Information
                        </h3>
                        <Separator />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <DetailItem label="Full Name" value={citizen.name} />
                            <DetailItem label="Date of Birth" value={citizen.dob ? new Date(citizen.dob).toLocaleDateString() : undefined} />
                            <DetailItem label="Age" value={calculateAge(citizen.dob)} />
                            <DetailItem label="Gender" value={citizen.gender} />
                            <DetailItem label="Marital Status" value={citizen.maritalStatus} />
                            <DetailItem label="Occupation" value={citizen.occupation} />

                            {citizen.occupation === 'Student' ? (
                                <DetailItem label="Family Annual Income" value={citizen.familyAnnualIncome ? `₹${citizen.familyAnnualIncome}` : undefined} />
                            ) : (
                                <DetailItem label="Annual Income" value={citizen.annualIncome ? `₹${citizen.annualIncome}` : undefined} />
                            )}
                        </div>
                    </section>

                    {/* Section 2: Address Details */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
                            2. Address Details
                        </h3>
                        <Separator />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-slate-50 p-4 rounded-md border">
                                <h4 className="font-semibold text-sm mb-3 text-slate-600 uppercase">Present Address</h4>
                                <div className="space-y-2 text-sm">
                                    <p><span className="text-muted-foreground">House:</span> {citizen.houseName || "N/A"}</p>
                                    <p><span className="text-muted-foreground">Ward:</span> {citizen.ward || "N/A"}</p>
                                    <p><span className="text-muted-foreground">Place:</span> {citizen.place || "N/A"}</p>
                                    <p><span className="text-muted-foreground">PIN Code:</span> {citizen.pinCode || "N/A"}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-md border">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-semibold text-sm text-slate-600 uppercase">Permanent Address</h4>
                                    {citizen.isPermanentSameAsPresent && (
                                        <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-600">Same as Present</span>
                                    )}
                                </div>
                                <div className="space-y-2 text-sm">
                                    <p><span className="text-muted-foreground">House:</span> {citizen.permanentAddress?.houseName || "N/A"}</p>
                                    <p><span className="text-muted-foreground">Place:</span> {citizen.permanentAddress?.place || "N/A"}</p>
                                    <p><span className="text-muted-foreground">Village:</span> {citizen.permanentAddress?.village || "N/A"}</p>
                                    <p><span className="text-muted-foreground">Taluk:</span> {citizen.permanentAddress?.taluk || "N/A"}</p>
                                    <p><span className="text-muted-foreground">District:</span> {citizen.permanentAddress?.district || "N/A"}</p>
                                    <p><span className="text-muted-foreground">PIN Code:</span> {citizen.permanentAddress?.pinCode || "N/A"}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Family & Relationships */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
                            3. Family Information
                        </h3>
                        <Separator />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <DetailItem label="Father's Name" value={citizen.fatherName} />
                            <DetailItem label="Mother's Name" value={citizen.motherName} />
                            {citizen.maritalStatus === 'Married' && (
                                <DetailItem label="Spouse Name" value={citizen.spouseName} />
                            )}
                        </div>
                    </section>

                    {/* Section 4: Contact Information */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
                            4. Contact Information
                        </h3>
                        <Separator />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <DetailItem label="Mobile Number" value={citizen.contactNumber} />
                            <DetailItem label="Alternate Mobile" value={citizen.alternateMobile} />
                            <DetailItem label="Email ID" value={citizen.email} />
                        </div>
                    </section>

                    {/* Section 5: IDs and Documents */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
                            5. Identity Documents
                        </h3>
                        <Separator />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <DetailItem label="Aadhaar (Unique ID)" value={citizen.uniqueId} />
                            <DetailItem label="Ration Card" value={citizen.rationCardNumber} />
                            <DetailItem label="Voter ID" value={citizen.electionId} />
                            <DetailItem label="Driving Licence" value={citizen.drivingLicence} />
                            <DetailItem label="Passport" value={citizen.passportNumber} />
                        </div>
                    </section>

                    {/* Section 6: Community & Religion */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
                            6. Community & Religion
                        </h3>
                        <Separator />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <DetailItem label="Religion" value={citizen.religion} />
                            <DetailItem label="Caste" value={citizen.caste} />
                            <DetailItem label="Category" value={citizen.communityCategory} />
                        </div>
                    </section>

                    {/* Section 7: Birth Certificate */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
                            7. Birth Certificate
                        </h3>
                        <Separator />
                        <div className="bg-slate-50 p-4 border rounded-md">
                            {citizen.birthCertificate ? (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-slate-600">Uploaded Document:</p>
                                    <div className="relative w-full max-w-sm overflow-hidden rounded-lg border bg-white shadow-sm">
                                        {/* Assuming server serves uploads at /uploads base URL */}
                                        <img
                                            src={`http://localhost:5000/${citizen.birthCertificate}`}
                                            alt="Birth Certificate"
                                            className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                                            onClick={() => window.open(`http://localhost:5000/${citizen.birthCertificate}`, '_blank')}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground pt-1">Click image to view full size.</p>
                                </div>
                            ) : (
                                <p className="text-sm text-red-500 font-medium">No Birth Certificate Uploaded.</p>
                            )}
                        </div>
                    </section>

                    {/* Section 8: Service Applications / Certificates */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
                            8. Certificates & Applications
                        </h3>
                        <Separator />
                        <div className="border rounded-xl overflow-hidden shadow-sm bg-card">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted/50 border-b">
                                        <tr>
                                            <th className="p-4 font-semibold text-muted-foreground w-1/3">Service Name</th>
                                            <th className="p-4 font-semibold text-muted-foreground">Status</th>
                                            <th className="p-4 font-semibold text-muted-foreground text-right">Applied Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {services && services.length > 0 ? (
                                            services.map((service, idx) => (
                                                <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                                    <td className="p-4 font-medium">{service.serviceName}</td>
                                                    <td className="p-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${service.status === 'Approved' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                                service.status === 'Issued' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                                                                    service.status === 'Rejected' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                                                                        'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                                                            }`}>
                                                            {service.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-muted-foreground text-right">
                                                        {new Date(service.createdAt).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="p-8 text-center text-muted-foreground">
                                                    No certificates applied yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>

                </CardContent>
                <CardFooter className="flex justify-between border-t p-6 bg-slate-50/50">
                    <Button variant="outline" onClick={() => navigate('/citizens')}>&larr; Back to List</Button>
                    {/* Potential future action: Edit Citizen */}
                    {/* <Button variant="default">Edit Details</Button> */}
                </CardFooter>
            </Card>
        </main >
    );
}
