import { useEffect, useState } from 'react';
import serviceService from '../services/serviceService';

interface ServiceRecord {
    _id: string;
    serviceName: string;
    status: string;
    applicant: { name: string };
    officialId: { name: string };
}

const ServiceList = () => {
    const [services, setServices] = useState<ServiceRecord[]>([]);

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const data = await serviceService.getAll();
            setServices(data);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="container p-8">
                <h1 className="mb-6">Service Records</h1>
                <div className="bg-surface rounded shadow overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-100 border-b border-border">
                            <tr>
                                <th className="p-4">Service Name</th>
                                <th className="p-4">Applicant</th>
                                <th className="p-4">Official</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.map((service) => (
                                <tr key={service._id} className="border-b border-border">
                                    <td className="p-4">{service.serviceName}</td>
                                    <td className="p-4">{service.applicant?.name}</td>
                                    <td className="p-4">{service.officialId?.name}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-sm ${service.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                            service.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {service.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {services.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-muted">No service records found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ServiceList;
