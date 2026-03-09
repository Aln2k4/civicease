import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, Send } from "lucide-react";
import api from '@/services/api';
import toast from 'react-hot-toast';

interface ValidationResult {
    citizenId?: string;
    message: string;
    conflict?: boolean;
    duplicate?: boolean;
    manualVerificationRequired?: boolean;
    existingRecordId?: string;
    matchPriority?: number;
    profileData?: any;
    verificationChecklist?: any[];
}

export default function ApplyCertificate() {
    const navigate = useNavigate();
    const location = useLocation();

    const [stage, setStage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

    // Form Data
    const [formData, setFormData] = useState({
        serviceName: location.state?.serviceName || 'Income Certificate',
        uniqueId: '', // Aadhaar
        rationCardNumber: '',
        name: '',
        dob: '',
        ward: '',
        annualIncome: '', // specific to income cert
        occupation: '',
        caste: '', // specific to caste cert
        religion: '',
        purpose: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleValidateApplicant = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic Frontend Validations
        if (!formData.uniqueId && !formData.rationCardNumber && !(formData.name && formData.dob && formData.ward)) {
            toast.error("Please provide either Aadhaar/Ration Card or Name, DOB, and Ward.");
            return;
        }

        if (formData.uniqueId && formData.uniqueId.length !== 12) {
            toast.error("Aadhaar Number must be 12 digits.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post('/services/validate-applicant', formData);
            setValidationResult(response.data);
            setStage(2); // Move to Verification Stage
            toast.success("Applicant validated successfully");
        } catch (error: any) {
            console.error(error);
            if (error.response?.data) {
                const data = error.response.data;
                setValidationResult(data);
                if (data.duplicate) {
                    toast.error(`Duplicate Application: ${data.message}`);
                } else if (data.conflict) {
                    toast.error(`Conflict: ${data.message}`);
                } else if (data.manualVerificationRequired) {
                    toast("No precise match found. Manual verification will be required.", { icon: '⚠️' });
                    setStage(2); // Still move to stage 2 to show manual path
                } else {
                    toast.error(data.message || "Failed to validate applicant");
                }
            } else {
                toast.error("An unexpected error occurred connecting to the server.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitApplication = async () => {
        setIsLoading(true);
        try {
            // Include verification details to save in ServiceRecord
            const payload = {
                serviceName: formData.serviceName,
                applicant: validationResult?.citizenId,
                remarks: formData.purpose,
                status: validationResult?.manualVerificationRequired ? 'Pending' : 'Pending', // Everything starts as pending for Officer approval
                verificationDetails: {
                    checklist: validationResult?.verificationChecklist,
                    manualRequired: validationResult?.manualVerificationRequired,
                    matchPriority: validationResult?.matchPriority
                }
            };

            await api.post('/services', payload);
            toast.success("Certificate application submitted successfully!");
            navigate('/services');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to submit application");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container max-w-4xl mx-auto py-10 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-primary">Apply for Certificate</h1>
                <p className="text-muted-foreground mt-2">
                    Multi-stage validation and approval workflow integrated with Citizen database.
                </p>
            </div>

            {/* Stepper */}
            <div className="flex items-center mb-8 bg-muted/30 p-4 rounded-xl">
                <div className={`flex items-center \${stage >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 \${stage >= 1 ? 'border-primary bg-primary/10' : 'border-muted-foreground'}`}>1</div>
                    <span className="ml-2 font-medium hidden sm:inline">Data Collection</span>
                </div>
                <div className={`flex-1 h-1 mx-4 rounded \${stage >= 2 ? 'bg-primary' : 'bg-border'}`}></div>
                <div className={`flex items-center \${stage >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 \${stage >= 2 ? 'border-primary bg-primary/10' : 'border-muted-foreground'}`}>2</div>
                    <span className="ml-2 font-medium hidden sm:inline">Database Matching</span>
                </div>
                <div className={`flex-1 h-1 mx-4 rounded \${stage >= 3 ? 'bg-primary' : 'bg-border'}`}></div>
                <div className={`flex items-center \${stage >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 \${stage >= 3 ? 'border-primary bg-primary/10' : 'border-muted-foreground'}`}>3</div>
                    <span className="ml-2 font-medium hidden sm:inline">Dynamic Verification</span>
                </div>
            </div>

            {stage === 1 && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CardHeader>
                        <CardTitle>Stage 1: Application Form</CardTitle>
                        <CardDescription>Enter details to search the citizen database.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleValidateApplicant} className="space-y-6">

                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg border-b pb-2">Certificate Type</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Select Certificate *</Label>
                                        <Select
                                            value={formData.serviceName}
                                            onValueChange={(val) => handleSelectChange('serviceName', val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {/* Socio Economic */}
                                                <SelectItem value="Caste Certificate">Caste Certificate</SelectItem>
                                                <SelectItem value="Community Certificate">Community Certificate</SelectItem>
                                                <SelectItem value="Income Certificate">Income Certificate</SelectItem>
                                                <SelectItem value="Minority Certificate">Minority Certificate</SelectItem>
                                                <SelectItem value="Non-Creamy Layer Certificate">Non-Creamy Layer Certificate</SelectItem>
                                                <SelectItem value="Inter-Caste Marriage Certificate">Inter-Caste Marriage Certificate</SelectItem>
                                                {/* Land Related */}
                                                <SelectItem value="Land Certificate">Land Certificate</SelectItem>
                                                <SelectItem value="Possession Certificate">Possession Certificate</SelectItem>
                                                <SelectItem value="Possession & Non-attachment">Possession & Non-attachment</SelectItem>
                                                <SelectItem value="Valuation Certificate">Valuation Certificate</SelectItem>
                                                {/* Family & Relations */}
                                                <SelectItem value="Dependency Certificate">Dependency Certificate</SelectItem>
                                                <SelectItem value="Family Membership">Family Membership</SelectItem>
                                                <SelectItem value="Legal Heir Certificate">Legal Heir Certificate</SelectItem>
                                                <SelectItem value="Non-remarriage Certificate">Non-remarriage Certificate</SelectItem>
                                                <SelectItem value="Relationship Certificate">Relationship Certificate</SelectItem>
                                                <SelectItem value="Widow-Widower Certificate">Widow-Widower Certificate</SelectItem>
                                                {/* Residence & Nativity */}
                                                <SelectItem value="Nativity Certificate">Nativity Certificate</SelectItem>
                                                <SelectItem value="Domicile Certificate">Domicile Certificate</SelectItem>
                                                {/* Identity Related */}
                                                <SelectItem value="Identification Certificate">Identification Certificate</SelectItem>
                                                <SelectItem value="One and Same Certificate">One and Same Certificate</SelectItem>
                                                {/* Other Services */}
                                                <SelectItem value="Destitute Certificate">Destitute Certificate</SelectItem>
                                                <SelectItem value="Solvency Certificate">Solvency Certificate</SelectItem>
                                                <SelectItem value="Conversion Certificate">Conversion Certificate</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Purpose of Application</Label>
                                        <Input name="purpose" value={formData.purpose} onChange={handleInputChange} placeholder="e.g., Education, Scholarship" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg border-b pb-2">Primary Identification (Priority 1)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Aadhaar Number</Label>
                                        <Input
                                            name="uniqueId"
                                            value={formData.uniqueId}
                                            onChange={handleInputChange}
                                            placeholder="12 digit Aadhaar"
                                            maxLength={12}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ration Card Number</Label>
                                        <Input
                                            name="rationCardNumber"
                                            value={formData.rationCardNumber}
                                            onChange={handleInputChange}
                                            placeholder="10 digit Ration Card"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg border-b pb-2">Demographic Matching (Priority 2)</h3>
                                <p className="text-xs text-muted-foreground">Fill these if Primary ID is unavailable.</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Full Name</Label>
                                        <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="Applicant Name" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Date of Birth</Label>
                                        <Input type="date" name="dob" value={formData.dob} onChange={handleInputChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ward No.</Label>
                                        <Input name="ward" value={formData.ward} onChange={handleInputChange} placeholder="e.g., 10" />
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Fields based on Certificate Type */}
                            {formData.serviceName === 'Income Certificate' && (
                                <div className="space-y-4 p-4 bg-muted/20 rounded-lg border border-primary/10">
                                    <h3 className="font-semibold text-sm text-primary">Income Specific Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Claimed Annual Income (₹)</Label>
                                            <Input type="number" name="annualIncome" value={formData.annualIncome} onChange={handleInputChange} placeholder="e.g., 60000" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Applicant Occupation</Label>
                                            <Input name="occupation" value={formData.occupation} onChange={handleInputChange} placeholder="e.g., Farmer, Student" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(formData.serviceName === 'Community Certificate') && (
                                <div className="space-y-4 p-4 bg-muted/20 rounded-lg border border-primary/10">
                                    <h3 className="font-semibold text-sm text-primary">Community Specific Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Religion</Label>
                                            <Input name="religion" value={formData.religion} onChange={handleInputChange} placeholder="e.g., Hinduism" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Caste</Label>
                                            <Input name="caste" value={formData.caste} onChange={handleInputChange} placeholder="e.g., Nair, Ezhava" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={isLoading} className="gap-2">
                                    {isLoading ? 'Processing...' : 'Verify & Next'}
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {stage === 2 && validationResult && (
                <Card className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <CardHeader>
                        <CardTitle>Stage 2: Citizen Data Matching</CardTitle>
                        <CardDescription>Database check results and duplicate detection.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {validationResult.duplicate ? (
                            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-4">
                                <AlertCircle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-destructive">Duplicate Application Detected</h4>
                                    <p className="text-sm mt-1">{validationResult.message}</p>
                                    <p className="text-xs text-muted-foreground mt-2">Record ID: {validationResult.existingRecordId}</p>
                                </div>
                            </div>
                        ) : validationResult.manualVerificationRequired ? (
                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-4">
                                <AlertCircle className="h-6 w-6 text-yellow-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-yellow-700">Manual Verification Required</h4>
                                    <p className="text-sm text-yellow-800 mt-1">{validationResult.message}</p>
                                    <p className="text-sm mt-2">The system could not definitively match this request to a single citizen profile. The application will be flagged for manual scrutiny by a Village Officer.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-4">
                                <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                                <div className="w-full">
                                    <h4 className="font-semibold text-green-700">Database Match Successful</h4>
                                    <p className="text-sm text-green-800 mt-1">
                                        Matched using Priority {validationResult.matchPriority}
                                        ({validationResult.matchPriority === 1 ? 'Exact ID Match' : 'Demographic Match'})
                                    </p>

                                    <div className="mt-4 bg-white/60 p-4 rounded border grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground font-semibold uppercase">Profile Name</p>
                                            <p className="font-medium">{validationResult.profileData?.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-semibold uppercase">House Details</p>
                                            <p className="font-medium">{validationResult.profileData?.houseName} (Ward {validationResult.profileData?.ward})</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between pt-4 border-t">
                            <Button variant="outline" onClick={() => setStage(1)} className="gap-2">
                                <ArrowLeft className="h-4 w-4" /> Back to Form
                            </Button>
                            <Button
                                onClick={() => setStage(3)}
                                disabled={validationResult.duplicate}
                                className="gap-2"
                            >
                                Continue to Verification <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {stage === 3 && validationResult && (
                <Card className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <CardHeader>
                        <CardTitle>Stage 3: Dynamic Verification Engine</CardTitle>
                        <CardDescription>Rule-based checklist comparing retrieved DB parameters with entered form data.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {!validationResult.verificationChecklist || validationResult.verificationChecklist.length === 0 ? (
                            <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">
                                No automated verification rules available for this application type or match failure.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {validationResult.verificationChecklist.map((item, idx) => (
                                    <div key={idx} className={`p-4 rounded-lg border-l-4 shadow-sm border \${
                                        item.status === 'Verified' ? 'border-l-green-500 bg-green-50/30' : 
                                        item.status === 'Mismatch' ? 'border-l-red-500 bg-red-50/30' : 
                                        'border-l-yellow-500 bg-yellow-50/30'
                                    }`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-semibold text-sm">{item.label}</h4>
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold \${
                                                item.status === 'Verified' ? 'bg-green-100 text-green-700' : 
                                                item.status === 'Mismatch' ? 'bg-red-100 text-red-700' : 
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                                            <div className="bg-background/80 p-2 rounded border">
                                                <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Provided in Form</p>
                                                <p className={item.status === 'Mismatch' ? 'text-red-600 font-medium' : ''}>{item.provided}</p>
                                            </div>
                                            <div className="bg-background/80 p-2 rounded border">
                                                <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Database Record</p>
                                                <p className="font-medium text-slate-700">{item.expected}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="bg-muted p-4 rounded-lg">
                            <h4 className="font-medium mb-1 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" /> Automated Scrutiny Summary
                            </h4>
                            <p className="text-sm text-muted-foreground">
                                {validationResult.verificationChecklist?.some(item => item.status === 'Mismatch')
                                    ? "There are mismatches between the provided data and the central database. This application will be marked for manual investigation."
                                    : "All critical parameters verify against the central database. Application is ready for rapid approval."
                                }
                            </p>
                        </div>

                    </CardContent>
                    <CardFooter className="flex justify-between border-t p-6 pb-6">
                        <Button variant="outline" onClick={() => setStage(2)} className="gap-2">
                            <ArrowLeft className="h-4 w-4" /> Back
                        </Button>
                        <Button onClick={handleSubmitApplication} disabled={isLoading} className="gap-2 bg-primary hover:bg-primary/90">
                            {isLoading ? 'Submitting...' : 'Submit Application'} <Send className="h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            )}

        </div>
    );
}
