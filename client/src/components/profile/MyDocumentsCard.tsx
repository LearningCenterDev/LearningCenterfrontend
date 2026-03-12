import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { File, FileText, Image as ImageIcon, FileSpreadsheet, FileVideo, FileAudio, FileArchive, Download, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { UserDocument } from "@shared/schema";

export default function MyDocumentsCard({ userId }: { userId: string }) {
    const { data: documents = [], isLoading } = useQuery<UserDocument[]>({
        queryKey: ['/api/users', userId, 'documents'],
        enabled: !!userId,
    });

    const getFileIcon = (type?: string | null) => {
        if (!type) return <File className="w-4 h-4 text-muted-foreground" />;
        if (type.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
        if (type.includes('image')) return <ImageIcon className="w-4 h-4 text-blue-500" />;
        if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return <FileSpreadsheet className="w-4 h-4 text-green-500" />;
        if (type.includes('video')) return <FileVideo className="w-4 h-4 text-purple-500" />;
        if (type.includes('audio')) return <FileAudio className="w-4 h-4 text-orange-500" />;
        if (type.includes('zip') || type.includes('archive')) return <FileArchive className="w-4 h-4 text-yellow-500" />;
        return <File className="w-4 h-4 text-muted-foreground" />;
    };

    const formatFileSize = (bytes?: number | null) => {
        if (!bytes) return '-';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (isLoading || documents.length === 0) return null;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 overflow-hidden">
                <CardHeader className="border-b dark:border-slate-700">
                    <CardTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#1F3A5F] rounded-xl flex items-center justify-center shadow-md">
                            <File className="w-5 h-5 text-white" />
                        </div>
                        My Documents ({documents.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Description</TableHead><TableHead>Size</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {documents.map((doc) => (
                                    <TableRow key={doc.id}>
                                        <TableCell><div className="flex items-center gap-2">{getFileIcon(doc.type)}<span className="font-medium">{doc.name}</span></div></TableCell>
                                        <TableCell className="max-w-[200px] truncate">{doc.description || '-'}</TableCell>
                                        <TableCell>{formatFileSize(doc.size)}</TableCell>
                                        <TableCell>{doc.createdAt ? format(new Date(doc.createdAt), "MMM d, yyyy") : '-'}</TableCell>
                                        <TableCell className="text-right">
                                            <Button size="icon" variant="ghost" onClick={() => window.open(`/api/users/${userId}/documents/${doc.id}/download`, '_blank')}><ExternalLink className="w-4 h-4" /></Button>
                                            <Button size="icon" variant="ghost" asChild><a href={`/api/users/${userId}/documents/${doc.id}/download`} download={doc.name}><Download className="w-4 h-4" /></a></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
