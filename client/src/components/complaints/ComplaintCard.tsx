import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge' // Need to create Badge
import { format } from 'date-fns'

interface ComplaintCardProps {
    complaint: {
        id: string
        title: string
        category: string
        status: string
        created_at: string
        description: string
    }
}

export function ComplaintCard({ complaint }: ComplaintCardProps) {
    const statusColors: Record<string, string> = {
        submitted: 'bg-blue-500',
        in_progress: 'bg-yellow-500',
        resolved: 'bg-green-500',
        rejected: 'bg-red-500',
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-bold">{complaint.title}</CardTitle>
                <Badge className={`${statusColors[complaint.status] || 'bg-gray-500'} text-white capitalize`}>
                    {complaint.status.replace('_', ' ')}
                </Badge>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                    Category: <span className="font-medium">{complaint.category}</span>
                </p>
                <p className="text-sm line-clamp-2">{complaint.description}</p>
            </CardContent>
            <CardFooter>
                <p className="text-xs text-muted-foreground">
                    Submitted on {format(new Date(complaint.created_at), 'PPP')}
                </p>
            </CardFooter>
        </Card>
    )
}
