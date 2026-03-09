import { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

import api from '@/services/api';
import CertificateTemplate, { type CertificateData } from './CertificateTemplate';

interface CertificateDemoProps {
    isOpen: boolean;
    onClose: () => void;
    certificateName: string;
}

export function CertificateDemo({ isOpen, onClose, certificateName }: CertificateDemoProps) {
    const [data, setData] = useState<CertificateData | null>(null);
    const [loading, setLoading] = useState(false);

    const templateRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && certificateName) {
            fetchCertificateData();
        } else {
            setData(null);
        }
    }, [isOpen, certificateName]);

    const fetchCertificateData = async () => {
        setLoading(true);
        try {
            // Encode cert name for URL
            const res = await api.get(`/certificates/preview/${encodeURIComponent(certificateName)}`);
            setData(res.data);
        } catch (error) {
            console.error("Failed to fetch certificate data", error);
        } finally {
            setLoading(false);
        }
    };



    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                <div className="p-6 border-b">
                    <DialogHeader>
                        <DialogTitle>{certificateName} - Preview</DialogTitle>
                        <DialogDescription>
                            This is a digital preview of the certificate. Verify specific details before printing.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-100 p-8 flex justify-center">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin mb-4" />
                            <p>Generating Preview...</p>
                        </div>
                    ) : data ? (
                        <div className="origin-top scale-[0.6] sm:scale-[0.7] md:scale-[0.85] lg:scale-100 transition-transform duration-200">
                            <CertificateTemplate ref={templateRef} data={data} type={certificateName} />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-red-500">
                            Failed to load preview data.
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-background flex justify-end gap-2 shrink-0 z-50">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>

                </div>
            </DialogContent>
        </Dialog>
    );
}

export default CertificateDemo;
