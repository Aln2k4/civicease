import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import familyService from "@/services/familyService";

export default function Families() {
    const [families, setFamilies] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchFamilies = async () => {
            try {
                const data = await familyService.getAll();
                setFamilies(data);
            } catch (error) {
                console.error("Failed to fetch families", error);
            }
        };
        fetchFamilies();
    }, []);

    const filteredFamilies = families.filter(
        (family) =>
            family.headOfFamily?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            family.familyName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Families</h1>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search..."
                            className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* Add Member button removed as per request */}
                    <Button className="gap-2" asChild>
                        <Link to="/families/add">
                            <Plus className="h-4 w-4" />
                            Add Family
                        </Link>
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Registered Families</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Head of Family</TableHead>
                                <TableHead>Family Name</TableHead>
                                <TableHead>Village</TableHead>
                                <TableHead>Ward</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredFamilies.map((family) => (
                                <TableRow key={family._id}>
                                    <TableCell className="font-medium">
                                        {family.headOfFamily?.name || 'N/A'}
                                    </TableCell>
                                    <TableCell>{family.familyName}</TableCell>
                                    <TableCell>{family.village}</TableCell>
                                    <TableCell>{family.wardNumber}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link to={`/families/${family._id}`}>View Details</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredFamilies.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No families found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </main>
    );
}
