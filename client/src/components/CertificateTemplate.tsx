import { forwardRef } from 'react';

export interface CertificateData {
    name: string;
    fatherName: string;
    motherName: string;
    dob: string;
    address: {
        houseName: string;
        ward: string;
        place: string;
        village: string;
        taluk: string;
        district: string;
        pinCode: string;
    };
    certificateNumber: string;
    issueDate: string;
    issuingOfficer: string;
    designation: string;
    officeName: string;
    caste?: string;
    religion?: string;
    annualIncome?: number;
    purpose?: string;
}

interface CertificateTemplateProps {
    data: CertificateData;
    type: string;
}

const CertificateTemplate = forwardRef<HTMLDivElement, CertificateTemplateProps>(({ data, type }, ref) => {
    return (
        <div
            ref={ref}
            className="w-[210mm] min-h-[297mm] bg-white text-black font-serif relative p-12 mx-auto shadow-2xl"
            style={{
                backgroundImage: 'url(/watermark_bg.png)', // We will use a subtle pattern or blank for now
                backgroundSize: '300px',
                backgroundRepeat: 'repeat',
            }}
        >
            {/* Watermark Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none z-0">
                <img src="/emblem.png" alt="Emblem" className="w-1/2" />
            </div>

            <div className="relative z-10 border-4 border-double border-slate-800 h-full p-8 flex flex-col justify-between">

                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="flex justify-center mb-4">
                        {/* Placeholder for Emblem */}
                        <div className="w-24 h-24 bg-contain bg-no-repeat bg-center" style={{ backgroundImage: "url('/emblem.png')" }}>
                            {/* If image missing, this won't show, which is fine for dev */}
                            <img src="/emblem.png" alt="Govt Emblem" className="w-full h-full object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold uppercase tracking-widest text-slate-900">Government of Kerala</h1>
                    <h2 className="text-xl font-semibold uppercase text-slate-800">Department of Revenue</h2>

                    <div className="my-8">
                        <h3 className="text-3xl font-bold uppercase underline decoration-double underline-offset-4 text-slate-900">
                            {type}
                        </h3>
                    </div>

                    <div className="flex justify-between items-end px-4 text-sm font-semibold">
                        <p>No: {data.certificateNumber}</p>
                        <p>Date: {data.issueDate}</p>
                    </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 px-8 py-12 space-y-6 text-lg leading-relaxed text-justify">
                    <p>
                        This is to certify that <strong>{data.name}</strong>,
                        {data.fatherName ? ` S/o / D/o ${data.fatherName}` : ''}
                        {data.motherName ? `, and ${data.motherName}` : ''},
                        residing at <strong>{data.address.houseName}</strong>,
                        {data.address.ward ? ` Ward: ${data.address.ward},` : ''}
                        <strong> {data.address.place}</strong> (Village),
                        <strong> {data.address.taluk}</strong> (Taluk),
                        <strong> {data.address.district}</strong> (District),
                        Kerala,
                        {data.dob ? ` born on ${data.dob},` : ''}
                        is known to this office.
                    </p>

                    {/* Specific Certificate Logic based on Type */}
                    {type.toLowerCase().includes('caste') && (
                        <p>
                            It is certified that the person belongs to the <strong>{data.caste || 'N/A'}</strong> caste
                            religiously known as <strong>{data.religion || 'N/A'}</strong>.
                        </p>
                    )}

                    {type.toLowerCase().includes('income') && (
                        <p>
                            It is certified that the annual family income of the person is
                            <strong> ₹ {data.annualIncome ? data.annualIncome.toLocaleString('en-IN') : '0'}</strong>
                            (Rupees {toWords(data.annualIncome || 0)} only).
                        </p>
                    )}

                    {type.toLowerCase().includes('nativity') && (
                        <p>
                            It is certified that the person is a native of Kerala by birth/residence.
                        </p>
                    )}

                    <p className="mt-8 text-sm text-muted-foreground italic">
                        This certificate is issued based on the details furnished by the applicant and the verification
                        report of the Village Officer, {data.officeName}.
                        {data.purpose ? ` This certificate is issued for the purpose of ${data.purpose}.` : ''}
                    </p>
                </div>

                {/* Footer */}
                <div className="grid grid-cols-2 mt-12 gap-8 items-end">
                    <div className="text-center">
                        <div className="inline-block w-24 h-24 border-2 border-dashed border-slate-300 rounded-full flex items-center justify-center mb-2">
                            <span className="text-xs text-muted-foreground">Office Seal</span>
                        </div>
                        <p className="text-sm font-semibold">{data.officeName}</p>
                    </div>

                    <div className="text-center space-y-2">
                        {/* Digital Signature Placeholder */}
                        <div className="h-16 flex items-end justify-center">
                            <span className="font-script text-2xl text-blue-800">Digitally Signed</span>
                        </div>
                        <p className="font-bold">{data.issuingOfficer}</p>
                        <p className="text-sm">{data.designation}</p>
                    </div>
                </div>

                <div className="mt-8 border-t pt-4 text-center text-xs text-slate-500">
                    <p>NOTE: This is a digitally signed certificate. The authenticity of this document can be verified using the Certificate Number at https://edistrict.kerala.gov.in</p>
                </div>
            </div>
        </div>
    );
});

// Simple helper to convert number to words (basic implementation for demo)
function toWords(num: number): string {
    // This is a placeholder. For production, use a library like 'number-to-words'
    return num.toString();
}

CertificateTemplate.displayName = "CertificateTemplate";

export default CertificateTemplate;
