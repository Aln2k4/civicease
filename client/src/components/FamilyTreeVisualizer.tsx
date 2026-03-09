
import { User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Citizen {
    _id: string;
    name: string;
    gender?: string; // "Male" | "Female"
    relationshipToHead?: string;
    age?: number;
    photo?: string; // Assuming photo might be available or placeholder
}

interface RemovedMember {
    citizen: Citizen;
    reason: string;
    removedAt: string;
}

interface Family {
    headOfFamily: Citizen;
    members: Citizen[];
    removedMembers?: RemovedMember[];
}

interface FamilyTreeVisualizerProps {
    isOpen: boolean;
    onClose: () => void;
    family: Family;
}

const FamilyMemberNode = ({ member, role, isRemoved, removalReason }: { member: Citizen; role?: string; isRemoved?: boolean; removalReason?: string }) => {
    return (
        <div className={`flex flex-col items-center group relative cursor-pointer hover:z-10 ${isRemoved ? 'opacity-70 grayscale' : ''}`}>
            <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center bg-white shadow-sm overflow-hidden 
                ${member.gender === 'Female' ? 'border-pink-300' : 'border-blue-300'} ${isRemoved ? 'border-dashed border-gray-400' : ''}`}>
                {member.photo ? (
                    <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                    <User className={`w-8 h-8 ${member.gender === 'Female' ? 'text-pink-400' : 'text-blue-400'} ${isRemoved ? 'text-gray-400' : ''}`} />
                )}
            </div>
            <div className={`mt-2 text-center bg-white/90 backdrop-blur-sm px-2 py-1 rounded shadow-sm border text-xs min-w-[100px] ${isRemoved ? 'border-red-200 bg-red-50' : ''}`}>
                <p className="font-bold truncate max-w-[120px]" title={member.name}>{member.name}</p>
                <p className="text-[10px] text-muted-foreground">
                    {role || member.relationshipToHead}
                    {isRemoved && <span className="block text-red-500 font-semibold text-[9px] uppercase">(Deleted: {removalReason})</span>}
                </p>
            </div>
        </div>
    );
};

export default function FamilyTreeVisualizer({ isOpen, onClose, family }: FamilyTreeVisualizerProps) {
    if (!family) return null;

    // Combine active and removed members for tree generation
    type TreeMember = Citizen & { isRemoved?: boolean; removalReason?: string };

    // We map removed members to have an `isRemoved` flag. 
    // IMPORTANT: removedMembers is an array of objects { citizen: Citizen, ... }. We need to extract the citizen.
    const removedCitizens: TreeMember[] = (family.removedMembers || []).map(r => ({
        ...r.citizen,
        isRemoved: true,
        removalReason: r.reason
    }));

    const activeMembers: TreeMember[] = family.members.map(m => ({ ...m }));

    const allMembers: TreeMember[] = [...activeMembers, ...removedCitizens];

    // Categorize members
    let head = family.headOfFamily;

    // Check if Head is in removed list (rare if reallocated, but possible if simple removal without reallocation logic applied yet)
    const removedHead = removedCitizens.find(r => r._id === head._id);
    if (removedHead) {
        head = { ...head, ...removedHead, isRemoved: true, removalReason: removedHead.removalReason } as any;
    }

    // Find Previous Heads (Removed members who were Head, but are not the current Head Object)
    // Note: head._id comparison is important to avoid duplicating if head IS removed (and not reallocated)
    const previousHeads = removedCitizens.filter(r => r.relationshipToHead === 'Head' && r._id !== head._id);

    const spouse = allMembers.find(m => m.relationshipToHead === 'Wife' || m.relationshipToHead === 'Husband' || m.relationshipToHead === 'Spouse');

    // Parents of Head
    const parents = allMembers.filter(m => ['Father', 'Mother'].includes(m.relationshipToHead || ''));

    // Children
    const children = allMembers.filter(m => ['Son', 'Daughter'].includes(m.relationshipToHead || ''));

    // Grandparents
    const grandparents = allMembers.filter(m => ['Grandfather', 'Grandmother'].includes(m.relationshipToHead || ''));

    // Grandchildren
    const grandchildren = allMembers.filter(m => ['Grandson', 'Granddaughter'].includes(m.relationshipToHead || ''));

    // Siblings
    const siblings = allMembers.filter(m => ['Brother', 'Sister'].includes(m.relationshipToHead || ''));

    // Removed members that don't fit into these standard categories (e.g., 'Other' relationship or simply not matched)
    // could be displayed separately or we assume they fall into above if relationship is preserved.
    // If relationship is NOT preserved in removedMembers (check earlier logic), they might disappear from tree.
    // Assuming relationship IS preserved in the `citizen` object stored in `removedMembers`.

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-50">
                <DialogHeader className="p-4 border-b bg-white z-20">
                    <DialogTitle>Family Tree Structure</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-auto p-12 relative flex justify-center items-start min-w-full">

                    {/* Tree Container */}
                    <div className="flex flex-col items-center gap-12 pt-8">

                        {/* Level 1: Grandparents */}
                        {grandparents.length > 0 && (
                            <div className="flex gap-8 relative">
                                {grandparents.map(gp => (
                                    <FamilyMemberNode key={gp._id} member={gp} isRemoved={gp.isRemoved} removalReason={gp.removalReason} />
                                ))}
                                {/* Connector down to Parents or Head */}
                                <div className="absolute top-full left-1/2 w-px h-12 bg-slate-300 -translate-x-1/2" />
                            </div>
                        )}

                        {/* Level 2: Parents of Head (Father/Mother) */}
                        {parents.length > 0 && (
                            <div className="flex gap-8 relative">
                                {parents.map(p => (
                                    <FamilyMemberNode key={p._id} member={p} isRemoved={p.isRemoved} removalReason={p.removalReason} />
                                ))}
                                <div className="absolute top-full left-1/2 w-px h-12 bg-slate-300 -translate-x-1/2" />
                            </div>
                        )}

                        {/* Level 3: Head & Spouse & Siblings */}
                        <div className="flex items-start gap-12 relative">
                            {/* Connector from above */}
                            {(parents.length > 0 || grandparents.length > 0) && (
                                <div className="absolute bottom-full left-1/2 w-px h-12 bg-slate-300 -translate-x-1/2" />
                            )}

                            {siblings.length > 0 && (
                                <div className="flex gap-6 mr-8">
                                    {siblings.map(sib => <FamilyMemberNode key={sib._id} member={sib} isRemoved={sib.isRemoved} removalReason={sib.removalReason} />)}
                                </div>
                            )}

                            <div className="flex items-center gap-4 relative p-4 border border-dashed border-slate-300 rounded-xl bg-slate-100/50">

                                {/* Previous Heads (Deceased/Removed) */}
                                {previousHeads.map(prevHead => (
                                    <div key={prevHead._id} className="flex items-center gap-4">
                                        <FamilyMemberNode member={prevHead} role={`Head (Deleted)`} isRemoved={prevHead.isRemoved} removalReason={prevHead.removalReason} />
                                        <div className="w-8 h-px bg-slate-400" />
                                    </div>
                                ))}

                                <FamilyMemberNode member={head} role="Head of Family" isRemoved={(head as any).isRemoved} removalReason={(head as any).removalReason} />

                                {spouse && (
                                    <>
                                        <div className="w-8 h-px bg-slate-400" />
                                        <FamilyMemberNode member={spouse} isRemoved={spouse.isRemoved} removalReason={spouse.removalReason} />
                                    </>
                                )}
                                {/* Connector down to Children */}
                                {children.length > 0 && (
                                    <div className="absolute top-full left-1/2 w-px h-12 bg-slate-300 -translate-x-1/2" />
                                )}
                            </div>
                        </div>

                        {/* Level 4: Children */}
                        {children.length > 0 && (
                            <div className="relative pt-4">
                                {/* Horizontal bar for children */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[calc(100%-4rem)] h-px bg-slate-300" />
                                {/* Vertical connects for bar */}
                                <div className="absolute bottom-full left-1/2 w-px h-4 bg-slate-300 -translate-x-1/2" />

                                <div className="flex gap-12">
                                    {children.map(child => (
                                        <div key={child._id} className="flex flex-col items-center relative">
                                            {/* Vertical line from horizontal bar to child */}
                                            <div className="absolute bottom-full left-1/2 w-px h-4 bg-slate-300 -translate-x-1/2" />
                                            <FamilyMemberNode member={child} isRemoved={child.isRemoved} removalReason={child.removalReason} />

                                            {/* Connector to Grandchildren */}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Level 5: Grandchildren (Generic) */}
                        {grandchildren.length > 0 && (
                            <div className="relative pt-8 flex gap-8">
                                <div className="absolute top-0 left-1/2 w-px h-8 bg-slate-300 -translate-x-1/2" />
                                {grandchildren.map(gc => (
                                    <div key={gc._id} className="relative">
                                        <div className="absolute bottom-full left-1/2 w-px h-8 bg-slate-300 -translate-x-1/2" />
                                        <FamilyMemberNode key={gc._id} member={gc} isRemoved={gc.isRemoved} removalReason={gc.removalReason} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}
