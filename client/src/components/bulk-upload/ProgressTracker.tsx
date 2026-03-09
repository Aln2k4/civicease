import React, { useEffect } from 'react';
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Loader2, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadStatus {
    _id: string;
    contactNumber?: string; // Optional depending on how we fetch
    status: 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'VALIDATING' | 'READY_TO_CONFIRM';
    processedRecords: number;
    totalRecords: number;
    successCount: number;
    errorCount: number;
    fileName: string;
}

interface ProgressTrackerProps {
    status: UploadStatus;
    onDownloadErrors: () => void;
    onReset: () => void;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ status, onDownloadErrors, onReset }) => {

    // Calculate percentage
    const percentage = status.totalRecords > 0
        ? Math.round((status.processedRecords / status.totalRecords) * 100)
        : 0;

    const isCompleted = status.status === 'COMPLETED';
    const isFailed = status.status === 'FAILED';
    const isRunning = status.status === 'PROCESSING';

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center p-4 bg-muted rounded-full mb-2">
                    {isCompleted ? (
                        <CheckCircle className="h-8 w-8 text-green-600 animate-in zoom-in spin-in-12" />
                    ) : isFailed ? (
                        <XCircle className="h-8 w-8 text-red-600 animate-in zoom-in" />
                    ) : (
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    )}
                </div>
                <h2 className="text-2xl font-bold tracking-tight">
                    {isCompleted ? "Import Completed" : isFailed ? "Import Failed" : "Processing Records"}
                </h2>
                <p className="text-muted-foreground">
                    {status.fileName}
                </p>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                    <span>Progress</span>
                    <span>{percentage}%</span>
                </div>
                <Progress value={percentage} className="h-3" />
                <p className="text-xs text-center text-muted-foreground pt-1">
                    {status.processedRecords} of {status.totalRecords} records processed
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-100 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-700">{status.successCount}</p>
                    <p className="text-xs text-green-600 uppercase font-semibold">Success</p>
                </div>
                <div className={`border p-4 rounded-lg text-center ${status.errorCount > 0 ? 'bg-red-50 border-red-100' : 'bg-muted border-transparent'}`}>
                    <p className={`text-2xl font-bold ${status.errorCount > 0 ? 'text-red-700' : 'text-muted-foreground'}`}>{status.errorCount}</p>
                    <p className={`text-xs uppercase font-semibold ${status.errorCount > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>Errors</p>
                </div>
            </div>

            {(isCompleted || isFailed) && (
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button variant="outline" className="flex-1" onClick={onReset}>
                        Upload Another File
                    </Button>

                    {status.errorCount > 0 && (
                        <Button className="flex-1 gap-2" variant="destructive" onClick={onDownloadErrors}>
                            <FileDown className="h-4 w-4" />
                            Download Error Report
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProgressTracker;
