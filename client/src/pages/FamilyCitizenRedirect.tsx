import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import familyService from "@/services/familyService";

export default function FamilyCitizenRedirect() {
    const { id } = useParams<{ id: string }>(); // Citizen ID
    const navigate = useNavigate();
    const [error, setError] = useState("");

    useEffect(() => {
        if (id) {
            fetchFamilyAndRedirect(id);
        }
    }, [id, navigate]);

    const fetchFamilyAndRedirect = async (citizenId: string) => {
        try {
            console.log("Fetching family for citizen ID:", citizenId);
            const family = await familyService.getByCitizenId(citizenId);
            console.log("Found family:", family);
            if (family && family._id) {
                navigate(`/families/${family._id}`, { replace: true });
            } else {
                console.error("Family missing _id", family);
                setError("Family not found for this citizen.");
            }
        } catch (err: any) {
            console.error("Failed to fetch family by citizen ID:", err, err.response?.data);
            setError(err.response?.data?.message || "Failed to find family.");
        }
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 mt-10">
                <p className="text-red-500 mb-4">{error}</p>
                <button 
                    className="px-4 py-2 border rounded hover:bg-slate-50"
                    onClick={() => navigate(-1)}
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="flex min-h-[50vh] w-full items-center justify-center">
            <div className="flex flex-col items-center grid gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-muted-foreground mt-2">Loading family details...</p>
            </div>
        </div>
    );
}
