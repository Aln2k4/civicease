import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface FileDropZoneProps {
    onFileSelect: (file: File) => void;
    selectedFile: File | null;
    onClear: () => void;
    accept?: Record<string, string[]>;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({ onFileSelect, selectedFile, onClear, accept = { 'text/csv': ['.csv'] } }) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            onFileSelect(acceptedFiles[0]);
        }
    }, [onFileSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        maxFiles: 1,
        multiple: false
    });

    if (selectedFile) {
        return (
            <div className="border-2 border-primary/20 bg-primary/5 rounded-xl p-8 flex flex-col items-center justify-center gap-4 relative animate-in fade-in zoom-in-95 duration-200">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 hover:bg-destructive/10 hover:text-destructive transition-colors"
                    onClick={onClear}
                >
                    <X className="h-4 w-4" />
                </Button>
                <div className="p-4 bg-white rounded-full shadow-sm">
                    <FileSpreadsheet className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                    <p className="font-medium text-lg">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                </div>
                <p className="text-xs text-green-600 font-medium bg-green-100 px-3 py-1 rounded-full">
                    Ready to Upload
                </p>
            </div>
        );
    }

    return (
        <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200
                ${isDragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}
        >
            <input {...getInputProps()} />
            <div className={`p-4 rounded-full transition-colors ${isDragActive ? 'bg-primary/20' : 'bg-muted'}`}>
                <Upload className={`h-8 w-8 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div className="text-center space-y-1">
                <p className="font-medium">
                    {isDragActive ? "Drop the CSV file here" : "Click to upload or drag and drop"}
                </p>
                <p className="text-sm text-muted-foreground">
                    CSV files up to 50MB
                </p>
            </div>
        </div>
    );
};

export default FileDropZone;
