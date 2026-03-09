import { useState } from 'react';
import { ArrowLeft, ShieldCheck, FileSpreadsheet, Users, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import UploadWizard from '../components/bulk-upload/UploadWizard';

const Officials = () => {
    const [activeWizard, setActiveWizard] = useState<'CITIZEN' | 'FAMILY' | null>(null);

    // --- TEMPLATE LOGIC ---
    const downloadTemplate = (type: 'CITIZEN' | 'FAMILY') => {
        let headers: string[] = [];
        let exampleRows: string[] = [];
        let filename = "";

        if (type === 'CITIZEN') {
            headers = [
                "name", "dob", "gender", "maritalStatus", "houseName", "ward", "place", "pinCode",
                "village", "taluk", "district",
                "contactNumber", "fatherName", "motherName", "spouseName", "alternateMobile",
                "email", "uniqueId", "rationCardNumber", "electionId", "drivingLicence",
                "passportNumber", "religion", "caste", "communityCategory", "occupation",
                "annualIncome", "familyAnnualIncome"
            ];
            exampleRows = [
                "John Doe,1990-01-01,Male,Single,Rose Villa,12,Kottayam,686501,Kottayam,Kottayam,Kottayam,9876543210,Robert Doe,Mary Doe,,9876500000,john@example.com,A1234,R123,E123,D123,P123,Christian,RC,General,Engineer,500000,1000000",
                "Jane Smith,1995-05-15,Female,Married,Lily House,10,Pala,686575,Pala,Meenachil,Kottayam,8765432109,Thomas Smith,Sarah Smith,John Smith,,jane@example.com,A5678,R456,E456,D456,P456,Hindu,Nair,General,Teacher,400000,800000"
            ];
            filename = "citizens_template.csv";
        } else {
            headers = [
                "rationCardNumber", "familyName", "wardNumber", "address", "headCitizenUniqueId", "members"
            ];
            exampleRows = [
                "R001,John's Family,12,Rose Villa,A1234,A5678:Spouse|A999:Son",
                "R002,Ali's Family,5,Khan Manzil,A9012,U1001:Wife"
            ];
            filename = "families_template.csv";
        }

        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + exampleRows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- AUTH LOGIC (Keep existing mock auth for now) ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showForgot, setShowForgot] = useState(false);
    const [masterKey, setMasterKey] = useState("");

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (showForgot) {
            if (masterKey === "admin_recovery") {
                setIsAuthenticated(true);
                setError("");
            } else {
                setError("Invalid Recovery Key");
            }
            return;
        }

        if (password === "11223344") {
            setIsAuthenticated(true);
            setError("");
        } else {
            setError("Incorrect password");
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Officials Access</CardTitle>
                        <CardDescription>
                            {showForgot ? "Enter Recovery Key" : "Enter password to access this portal"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            {!showForgot ? (
                                <div className="space-y-2">
                                    <Input
                                        type="password"
                                        placeholder="Enter Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Input
                                        type="password"
                                        placeholder="Enter Master Recovery Key"
                                        value={masterKey}
                                        onChange={(e) => setMasterKey(e.target.value)}
                                    />
                                </div>
                            )}

                            {error && <p className="text-sm text-red-500">{error}</p>}

                            <Button type="submit" className="w-full">
                                {showForgot ? "Recover Access" : "Access Portal"}
                            </Button>

                            <div className="flex justify-between items-center mt-4">
                                <Button
                                    type="button"
                                    variant="link"
                                    className="text-xs text-muted-foreground"
                                    onClick={() => {
                                        setShowForgot(!showForgot);
                                        setError("");
                                    }}
                                >
                                    {showForgot ? "Back to Login" : "Forgot Password?"}
                                </Button>
                                <Link to="/dashboard">
                                    <Button variant="link" className="text-xs text-muted-foreground">Back to Dashboard</Button>
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-start p-8 relative overflow-hidden space-y-12">
            {/* Background Effects */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            {/* Header */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary">
                    Officials Portal
                </h1>
                <p className="text-lg text-muted-foreground">
                    Manage data, verify documents, and handle official village requests.
                </p>
            </div>

            {/* WIZARD OVERLAY */}
            {activeWizard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="w-full max-w-4xl relative">
                        <UploadWizard
                            uploadType={activeWizard}
                            onClose={() => setActiveWizard(null)}
                            onDownloadTemplate={() => downloadTemplate(activeWizard)}
                        />
                    </div>
                </div>
            )}

            {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl z-10 transition-all duration-300" style={{ filter: activeWizard ? 'blur(5px)' : 'none' }}>

                {/* Bulk Import Card - CITIZENS */}
                <Card className="bg-card/50 backdrop-blur-sm border-muted transition-all hover:border-primary/50 hover:shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="w-6 h-6 text-green-600" />
                            Bulk Citizen Import
                        </CardTitle>
                        <CardDescription>
                            Full-featured importer with validation and preview.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground min-h-[40px]">
                            Upload CSV files to add or update citizens. Supports duplicate detection and fuzzy matching.
                        </p>
                        <Button className="w-full" onClick={() => setActiveWizard('CITIZEN')}>
                            <Play className="mr-2 h-4 w-4" /> Start Citizen Import
                        </Button>
                    </CardContent>
                </Card>

                {/* Bulk Import Card - FAMILIES */}
                <Card className="bg-card/50 backdrop-blur-sm border-muted transition-all hover:border-blue-500/50 hover:shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-6 h-6 text-blue-600" />
                            Bulk Family Import
                        </CardTitle>
                        <CardDescription>
                            Link citizens into family units efficiently.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground min-h-[40px]">
                            Create families by defining relationships in CSV. Requires citizens to be pre-registered.
                        </p>
                        <Button className="w-full" variant="secondary" onClick={() => setActiveWizard('FAMILY')}>
                            <Play className="mr-2 h-4 w-4" /> Start Family Import
                        </Button>
                    </CardContent>
                </Card>

                {/* Coming Soon Placeholder */}
                <Card className="bg-card/30 backdrop-blur-sm border-dashed border-muted opacity-70 md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-muted-foreground">
                            <ShieldCheck className="w-6 h-6" />
                            Verification Requests
                        </CardTitle>
                        <CardDescription>
                            Pending document verification requests from citizens.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-24">
                        <span className="bg-muted px-3 py-1 rounded-full text-xs font-medium text-muted-foreground">Coming Soon</span>
                    </CardContent>
                </Card>

            </div>

            {/* Return Button */}
            <div className="pt-8">
                <Link to="/dashboard">
                    <Button variant="ghost" className="hover:bg-transparent hover:underline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </Link>
            </div>

            {/* Decorative Grid */}
            <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-20 dark:bg-grid-slate-800/20" />
        </div>
    );
};

export default Officials;
