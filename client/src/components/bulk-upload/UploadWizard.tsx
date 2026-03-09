import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import FileDropZone from './FileDropZone';
import PreviewTable from './PreviewTable';
import ProgressTracker from './ProgressTracker';
import { ArrowRight, UploadCloud, AlertTriangle } from 'lucide-react';
import api from '../../services/api'; // Using raw api for now or better create service
// Or create a dedicated uploadService

interface UploadWizardProps {
    uploadType: 'CITIZEN' | 'FAMILY';
    onClose: () => void;
    onDownloadTemplate: () => void;
}

const UploadWizard: React.FC<UploadWizardProps> = ({ uploadType, onClose, onDownloadTemplate }) => {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [session, setSession] = useState<any>(null);
    const [previewData, setPreviewData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Polling Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (step === 3 && session && session.status !== 'COMPLETED' && session.status !== 'FAILED') {
            interval = setInterval(async () => {
                try {
                    const response = await api.get(`/upload/status/${session._id || session.sessionId}`);
                    setSession(response.data);

                    if (response.data.status === 'COMPLETED' || response.data.status === 'FAILED') {
                        clearInterval(interval);
                    }
                } catch (err) {
                    console.error("Polling error", err);
                }
            }, 2000);
        }

        return () => clearInterval(interval);
    }, [step, session]);

    const handleFileSelect = (selectedFile: File) => {
        setFile(selectedFile);
        setError(null);
    };

    const handleStageUpload = async () => {
        if (!file) return;

        setIsLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('uploadType', uploadType);

        try {
            const response = await api.post('/upload/stage', formData, {
                headers: { 'Content-Type': undefined } as any
            });

            setSession(response.data); // Should contain sessionId
            setPreviewData(response.data);
            setStep(2);
        } catch (err: any) {
            console.log(err);
            setError(err.response?.data?.message || "Failed to stage file for upload.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmUpload = async () => {
        if (!session) return;

        setIsLoading(true);
        try {
            await api.post(`/upload/confirm/${session.sessionId || session._id}`);
            const updatedSession = { ...session, status: 'PROCESSING' };
            setSession(updatedSession);
            setStep(3);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to start processing.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadErrors = async () => {
        if (!session) return;
        // Trigger download
        window.open(`http://localhost:5000/api/upload/errors/${session._id || session.sessionId}`, '_blank');
        // Note: Hardcoded URL needs env config
    };

    return (
        <Card className="w-full max-w-4xl mx-auto border-0 shadow-none sm:border sm:shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {step === 1 && "Select CSV File"}
                    {step === 2 && "Preview & Verify"}
                    {step === 3 && "Processing Upload"}
                </CardTitle>
                <CardDescription>
                    {uploadType === 'CITIZEN' ? "Bulk Citizen Import" : "Bulk Family Import"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <Button variant="outline" size="sm" onClick={onDownloadTemplate} className="gap-2">
                                <span className="text-xs">Download {uploadType === 'CITIZEN' ? 'Citizen' : 'Family'} Template</span>
                            </Button>
                        </div>
                        <FileDropZone
                            onFileSelect={handleFileSelect}
                            selectedFile={file}
                            onClear={() => setFile(null)}
                        />
                        {error && (
                            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                {error}
                            </div>
                        )}
                    </div>
                )}

                {step === 2 && previewData && (
                    <div className="space-y-4">
                        <PreviewTable rows={previewData.previewRows} headers={previewData.headers} totalRecords={previewData.totalRecords} />
                        {error && (
                            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                {error}
                            </div>
                        )}
                    </div>
                )}

                {step === 3 && session && (
                    <ProgressTracker
                        status={session}
                        onDownloadErrors={handleDownloadErrors}
                        onReset={() => {
                            setStep(1);
                            setFile(null);
                            setSession(null);
                        }}
                    />
                )}
            </CardContent>
            <CardFooter className="flex justify-between">
                {step === 1 && (
                    <>
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleStageUpload} disabled={!file || isLoading}>
                            {isLoading ? "Analyzing..." : "Next: Preview"} <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </>
                )}
                {step === 2 && (
                    <>
                        <Button variant="ghost" onClick={() => setStep(1)} disabled={isLoading}>Back</Button>
                        <Button onClick={handleConfirmUpload} disabled={isLoading} className="gap-2">
                            {isLoading ? "Starting..." : "Start Import"} <UploadCloud className="h-4 w-4" />
                        </Button>
                    </>
                )}
                {step === 3 && session?.status !== 'COMPLETED' && session?.status !== 'FAILED' && (
                    <Button variant="ghost" className="w-full text-muted-foreground" disabled>
                        Import in progress... do not close
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};

export default UploadWizard;
