import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import citizenService from '../services/citizenService';

interface Citizen {
    _id: string;
    name: string;
    uniqueId: string;
    address: string;
    contactNumber: string;
}

const CitizenList = () => {
    const [citizens, setCitizens] = useState<Citizen[]>([]);

    useEffect(() => {
        fetchCitizens();
    }, []);

    const fetchCitizens = async () => {
        try {
            const data = await citizenService.getAll();
            setCitizens(data);
        } catch (error) {
            console.error('Failed to fetch citizens', error);
        }
    };

    return (
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Citizen Management</h1>
                <Link to="/citizens/add" className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                    + Add Citizen
                </Link>
            </div>

            <div className="bg-surface rounded shadow overflow-hidden bg-card text-card-foreground border">
                <table className="w-full text-left border-collapse caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Name</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Unique ID</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Address</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Contact</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {citizens.map((citizen) => (
                            <tr key={citizen._id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <td className="p-4 align-middle">{citizen.name}</td>
                                <td className="p-4 align-middle">{citizen.uniqueId}</td>
                                <td className="p-4 align-middle">{citizen.address}</td>
                                <td className="p-4 align-middle">{citizen.contactNumber}</td>
                                <td className="p-4 align-middle">
                                    <td className="p-4 align-middle">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link to={`/citizens/${citizen._id}`}>View</Link>
                                        </Button>
                                    </td>
                                </td>
                            </tr>
                        ))}
                        {citizens.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-muted-foreground">No citizens found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </main>
    );
};

export default CitizenList;
