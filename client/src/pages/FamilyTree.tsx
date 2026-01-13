import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import familyService from '../services/familyService';

interface Family {
    _id: string;
    familyName: string;
    village: string;
    headOfFamily: {
        name: string;
    };
}

const FamilyTree = () => {
    const [families, setFamilies] = useState<Family[]>([]);

    useEffect(() => {
        fetchFamilies();
    }, []);

    const fetchFamilies = async () => {
        try {
            const data = await familyService.getAll();
            setFamilies(data);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container p-8">
                <h1 className="mb-6">Family Registry</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {families.map((family) => (
                        <div key={family._id} className="bg-surface p-6 rounded shadow hover:shadow-lg transition-shadow">
                            <h2 className="text-xl font-bold mb-2">{family.familyName} Family</h2>
                            <p className="text-muted mb-2">Village: {family.village}</p>
                            <p className="text-sm">Head: {family.headOfFamily?.name || 'N/A'}</p>
                            <button className="mt-4 text-primary font-medium hover:underline">View Tree</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FamilyTree;
