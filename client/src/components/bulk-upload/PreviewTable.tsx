import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface PreviewTableProps {
    rows: any[];
    headers: string[];
    totalRecords: number;
}

const PreviewTable: React.FC<PreviewTableProps> = ({ rows, headers, totalRecords }) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">
                    Previewing first {rows.length} of {totalRecords} records
                </h3>
                <div className="flex gap-2">
                    <Badge variant="outline" className="gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" /> Valid
                    </Badge>
                    {/* Placeholder for future error filtering */}
                </div>
            </div>

            <div className="border rounded-md">
                <ScrollArea className="h-[400px] w-full">
                    <div className="w-full min-w-max">
                        {/* Wrapper for horizontal scroll if needed, though ScrollArea handles it roughly */}
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">#</TableHead>
                                    {headers.map((header, idx) => (
                                        <TableHead key={idx} className="capitalize whitespace-nowrap">
                                            {header.replace(/([A-Z])/g, ' $1').trim()}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((row, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell className="font-medium text-xs text-muted-foreground">
                                            {idx + 1}
                                        </TableCell>
                                        {headers.map((header, cellIdx) => (
                                            <TableCell key={cellIdx} className="whitespace-nowrap max-w-[200px] truncate" title={row[header]}>
                                                {row[header] || <span className="text-muted-foreground/30 italic">Empty</span>}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </ScrollArea>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-md text-sm flex gap-2 items-start">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                    This is a preview. Please verify that columns match the expected format used in the template.
                    Blank optional fields will be ignored.
                </p>
            </div>
        </div>
    );
};

export default PreviewTable;
