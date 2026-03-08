import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Folder,
  FileText,
  Upload,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Home,
  MoreVertical,
  Download,
  Share2,
  ArrowRightLeft,
  Trash2,
  Search,
  Link2,
  Copy,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutGrid,
  List,
  TableIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient as qc } from "@/lib/queryClient";
import type {
  DmsFolder,
  DmsFolderWithCount,
  DmsDocument,
  DmsDocumentWithUploader,
  DmsShareLink,
} from "@shared/schema";

const CATEGORY_MAP: Record<string, string> = {
  course_documents: "Course Documents",
  study_materials: "Study Materials",
  academic_resources: "Academic Resources",
  administrative_files: "Administrative Files",
  social_post: "Social Post",
};

const CATEGORIES = [
  { value: "course_documents", label: "Course Documents" },
  { value: "study_materials", label: "Study Materials" },
  { value: "academic_resources", label: "Academic Resources" },
  { value: "administrative_files", label: "Administrative Files" },
  { value: "social_post", label: "Social Post" },
];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(dateStr: string | Date | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface BreadcrumbItem {
  id: string;
  name: string;
}

interface FolderTreeNode extends DmsFolderWithCount {
  children: FolderTreeNode[];
  isExpanded?: boolean;
}

function buildFolderTree(folders: DmsFolderWithCount[]): FolderTreeNode[] {
  const map = new Map<string, FolderTreeNode>();
  const roots: FolderTreeNode[] = [];

  for (const folder of folders) {
    map.set(folder.id, { ...folder, children: [] });
  }

  for (const folder of folders) {
    const node = map.get(folder.id)!;
    if (folder.parentId && map.has(folder.parentId)) {
      map.get(folder.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

interface FolderTreeItemProps {
  node: FolderTreeNode;
  depth: number;
  selectedFolderId: string | null;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onSelect: (id: string, name: string, breadcrumbPath: BreadcrumbItem[]) => void;
  parentPath: BreadcrumbItem[];
}

function FolderTreeItem({
  node,
  depth,
  selectedFolderId,
  expandedIds,
  onToggleExpand,
  onSelect,
  parentPath,
}: FolderTreeItemProps) {
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedFolderId === node.id;
  const hasChildren = node.children.length > 0;
  const currentPath = [...parentPath, { id: node.id, name: node.name }];

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 px-2 cursor-pointer rounded-md text-sm transition-colors ${
          isSelected
            ? "bg-[#1F3A5F]/10 dark:bg-white/10 text-[#1F3A5F] dark:text-white font-medium"
            : "text-slate-600 dark:text-slate-400 hover-elevate"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(node.id, node.name, currentPath)}
      >
        <button
          className="flex-shrink-0 w-4 h-4 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggleExpand(node.id);
          }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )
          ) : (
            <span className="w-3" />
          )}
        </button>
        <Folder className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-amber-600 dark:text-amber-400" : "text-amber-500/70"}`} />
        <span className="truncate flex-1">{node.name}</span>
        <span className="text-xs text-slate-400 flex-shrink-0">{node.documentCount}</span>
      </div>
      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <FolderTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedFolderId={selectedFolderId}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
              parentPath={currentPath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface DocumentManagementProps {
  adminId: string;
}

export default function DocumentManagement({ adminId }: DocumentManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [folderStack, setFolderStack] = useState<BreadcrumbItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  type ViewMode = "table" | "grid" | "list";
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("dms-view-mode");
    return (saved === "table" || saved === "grid" || saved === "list") ? saved : "table";
  });
  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("dms-view-mode", mode);
  };
  const [treePanelOpen, setTreePanelOpen] = useState(true);
  const selectedFolderId = folderStack.length > 0 ? folderStack[folderStack.length - 1].id : null;
  const currentFolderId = selectedFolderId || "root";

  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderCategory, setNewFolderCategory] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadCategory, setUploadCategory] = useState("");

  const [shareOpen, setShareOpen] = useState(false);
  const [shareDocId, setShareDocId] = useState<string>("");
  const [shareExpiry, setShareExpiry] = useState("24");
  const [shareMaxDownloads, setShareMaxDownloads] = useState("");
  const [createdShareUrl, setCreatedShareUrl] = useState("");

  const [moveOpen, setMoveOpen] = useState(false);
  const [moveDocId, setMoveDocId] = useState<string>("");
  const [moveTargetFolder, setMoveTargetFolder] = useState("");

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameFolderId, setRenameFolderId] = useState("");
  const [renameFolderName, setRenameFolderName] = useState("");

  const [deleteDocOpen, setDeleteDocOpen] = useState(false);
  const [deleteDocId, setDeleteDocId] = useState("");
  const [deleteFolderOpen, setDeleteFolderOpen] = useState(false);
  const [deleteFolderId, setDeleteFolderId] = useState("");

  const isSearchActive = searchQuery.trim().length > 0;

  const { data: allFoldersFlat = [], isLoading: allFoldersLoading } = useQuery<DmsFolderWithCount[]>({
    queryKey: ["/api/dms/folders", "all-tree"],
    queryFn: async () => {
      const res = await fetch("/api/dms/folders?parentId=all", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch folders");
      return res.json();
    },
  });

  const folderTree = buildFolderTree(allFoldersFlat);

  const currentChildFolders = allFoldersFlat.filter((f) =>
    selectedFolderId ? f.parentId === selectedFolderId : !f.parentId
  );

  const docsQueryKey = ["/api/dms/documents", isSearchActive ? "search" : currentFolderId, categoryFilter, searchQuery];
  const { data: documents = [], isLoading: docsLoading } = useQuery<DmsDocumentWithUploader[]>({
    queryKey: docsQueryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (isSearchActive) {
        params.set("search", searchQuery.trim());
      } else {
        params.set("folderId", currentFolderId);
      }
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      const res = await fetch(`/api/dms/documents?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json();
    },
  });

  const { data: shareLinks = [], isLoading: shareLinksLoading } = useQuery<DmsShareLink[]>({
    queryKey: ["/api/dms/documents", shareDocId, "shares"],
    queryFn: async () => {
      const res = await fetch(`/api/dms/documents/${shareDocId}/shares`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch share links");
      return res.json();
    },
    enabled: shareOpen && !!shareDocId,
  });

  const createFolderMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/dms/folders", {
        name: newFolderName,
        parentId: currentFolderId,
        category: newFolderCategory,
        description: newFolderDescription || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dms/folders"] });
      setCreateFolderOpen(false);
      setNewFolderName("");
      setNewFolderCategory("");
      setNewFolderDescription("");
      toast({ title: "Folder Created", description: "New folder has been created successfully." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFile) throw new Error("No file selected");
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("title", uploadTitle);
      formData.append("folderId", currentFolderId);
      formData.append("category", uploadCategory);
      if (uploadDescription) formData.append("description", uploadDescription);
      const res = await fetch("/api/dms/documents/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Upload failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dms/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dms/folders"] });
      setUploadOpen(false);
      setUploadFile(null);
      setUploadTitle("");
      setUploadDescription("");
      setUploadCategory("");
      toast({ title: "File Uploaded", description: "Document has been uploaded successfully." });
    },
    onError: (err: Error) => {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    },
  });

  const createShareMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {};
      if (shareExpiry !== "none") body.expiresInHours = parseInt(shareExpiry);
      if (shareMaxDownloads) body.maxDownloads = parseInt(shareMaxDownloads);
      const res = await apiRequest("POST", `/api/dms/documents/${shareDocId}/share`, body);
      return res.json();
    },
    onSuccess: (data: { shareUrl: string }) => {
      setCreatedShareUrl(data.shareUrl);
      queryClient.invalidateQueries({ queryKey: ["/api/dms/documents", shareDocId, "shares"] });
      toast({ title: "Share Link Created", description: "Share link has been generated." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteShareMutation = useMutation({
    mutationFn: async (shareLinkId: string) => {
      await apiRequest("DELETE", `/api/dms/shares/${shareLinkId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dms/documents", shareDocId, "shares"] });
      toast({ title: "Share Link Deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const moveDocMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/dms/documents/${moveDocId}`, {
        folderId: moveTargetFolder || "root",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dms/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dms/folders"] });
      setMoveOpen(false);
      setMoveDocId("");
      setMoveTargetFolder("");
      toast({ title: "Document Moved", description: "Document has been moved successfully." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const renameFolderMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/dms/folders/${renameFolderId}`, {
        name: renameFolderName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dms/folders"] });
      setRenameOpen(false);
      setRenameFolderId("");
      setRenameFolderName("");
      toast({ title: "Folder Renamed" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteDocMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/dms/documents/${deleteDocId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dms/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dms/folders"] });
      setDeleteDocOpen(false);
      setDeleteDocId("");
      toast({ title: "Document Deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/dms/folders/${deleteFolderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dms/folders"] });
      if (selectedFolderId === deleteFolderId) {
        setFolderStack([]);
      }
      setDeleteFolderOpen(false);
      setDeleteFolderId("");
      toast({ title: "Folder Deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSelectFolder = useCallback((id: string, name: string, breadcrumbPath: BreadcrumbItem[]) => {
    setFolderStack(breadcrumbPath);
    setSearchQuery("");
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const navigateToFolder = (folderId: string, folderName: string) => {
    setFolderStack((prev) => [...prev, { id: folderId, name: folderName }]);
    setSearchQuery("");
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.add(folderId);
      return next;
    });
  };

  const navigateToBreadcrumb = (index: number) => {
    if (index < 0) {
      setFolderStack([]);
    } else {
      setFolderStack((prev) => prev.slice(0, index + 1));
    }
  };

  const handleDownload = (docId: string) => {
    window.open("/api/dms/documents/" + docId + "/download", "_blank");
  };

  const openShareDialog = (docId: string) => {
    setShareDocId(docId);
    setShareExpiry("24");
    setShareMaxDownloads("");
    setCreatedShareUrl("");
    setShareOpen(true);
  };

  const openMoveDialog = (docId: string) => {
    setMoveDocId(docId);
    setMoveTargetFolder("");
    setMoveOpen(true);
  };

  const openRenameDialog = (folder: DmsFolderWithCount) => {
    setRenameFolderId(folder.id);
    setRenameFolderName(folder.name);
    setRenameOpen(true);
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Link copied to clipboard." });
  };

  if (allFoldersLoading && documents.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="bg-gradient-to-r from-[#1F3A5F]/10 via-[#1F3A5F]/5 to-[#2a4a75]/5 relative overflow-hidden border-b border-[#1F3A5F]/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
            <Skeleton className="h-8 w-56 bg-[#1F3A5F]/10 dark:bg-white/20 mb-2" />
            <Skeleton className="h-4 w-36 bg-[#1F3A5F]/5 dark:bg-white/10" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="flex gap-3 flex-wrap">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-9 w-40" />
          </div>
          <div className="flex gap-6">
            <div className="w-64 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
            <div className="flex-1 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="bg-gradient-to-r from-[#1F3A5F]/10 via-[#1F3A5F]/5 to-[#2a4a75]/5 relative overflow-hidden border-b border-[#1F3A5F]/10">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: "radial-gradient(circle, #1F3A5F 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#2FBF71]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#1F3A5F]/10 rounded-md flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#1F3A5F]" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#1F3A5F] dark:text-white">Document Management</h1>
              </div>
              <p className="text-[#1F3A5F]/60 dark:text-white/60 text-sm sm:text-base font-medium">
                Manage files and folders
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={() => {
                  setNewFolderName("");
                  setNewFolderCategory("");
                  setNewFolderDescription("");
                  setCreateFolderOpen(true);
                }}
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                New Folder
              </Button>
              <Button
                onClick={() => {
                  setUploadFile(null);
                  setUploadTitle("");
                  setUploadDescription("");
                  setUploadCategory("");
                  setUploadOpen(true);
                }}
                className="bg-[#2FBF71] hover:bg-[#27a862] text-white shadow-md"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-md"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48 rounded-md border-slate-200 dark:border-slate-700">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-4">
          <div
            className={`transition-all duration-200 flex-shrink-0 ${treePanelOpen ? "w-64" : "w-0"}`}
          >
            {treePanelOpen && (
              <Card className="border-0 shadow-sm sticky top-4">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Folders
                    </h3>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setTreePanelOpen(false)}
                    >
                      <PanelLeftClose className="w-4 h-4" />
                    </Button>
                  </div>
                  <div
                    className={`flex items-center gap-1 py-1 px-2 cursor-pointer rounded-md text-sm transition-colors ${
                      !selectedFolderId
                        ? "bg-[#1F3A5F]/10 dark:bg-white/10 text-[#1F3A5F] dark:text-white font-medium"
                        : "text-slate-600 dark:text-slate-400 hover-elevate"
                    }`}
                    onClick={() => {
                      setFolderStack([]);
                      setSearchQuery("");
                    }}
                  >
                    <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                      <Home className="w-3.5 h-3.5" />
                    </span>
                    <span className="truncate flex-1">All Documents</span>
                  </div>
                  <div className="mt-1 max-h-[60vh] overflow-y-auto">
                    {folderTree.map((node) => (
                      <FolderTreeItem
                        key={node.id}
                        node={node}
                        depth={0}
                        selectedFolderId={selectedFolderId}
                        expandedIds={expandedIds}
                        onToggleExpand={handleToggleExpand}
                        onSelect={handleSelectFolder}
                        parentPath={[]}
                      />
                    ))}
                    {folderTree.length === 0 && !allFoldersLoading && (
                      <p className="text-xs text-slate-400 py-2 px-2">No folders yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex items-center gap-2">
              {!treePanelOpen && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setTreePanelOpen(true)}
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </Button>
              )}
              {!isSearchActive && (
                <div className="flex items-center gap-1 text-sm flex-wrap">
                  <button
                    onClick={() => navigateToBreadcrumb(-1)}
                    className={`flex items-center gap-1 transition-colors ${
                      !selectedFolderId
                        ? "text-[#1F3A5F] dark:text-white font-medium"
                        : "text-slate-500 hover:text-[#1F3A5F] dark:hover:text-white"
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    <span>Root</span>
                  </button>
                  {folderStack.map((item, index) => (
                    <span key={item.id} className="flex items-center gap-1">
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                      <button
                        onClick={() => navigateToBreadcrumb(index)}
                        className={`hover:text-[#1F3A5F] dark:hover:text-white transition-colors ${
                          index === folderStack.length - 1
                            ? "text-[#1F3A5F] dark:text-white font-medium"
                            : "text-slate-500"
                        }`}
                      >
                        {item.name}
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {isSearchActive && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Search className="w-4 h-4" />
                  <span>Showing search results for &quot;{searchQuery}&quot;</span>
                </div>
              )}
            </div>

            {!isSearchActive && currentChildFolders.length > 0 && (
              <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {currentChildFolders.map((folder) => (
                  <Card
                    key={folder.id}
                    className="border-0 shadow-sm hover-elevate cursor-pointer group"
                    onClick={() => navigateToFolder(folder.id, folder.name)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-md flex items-center justify-center flex-shrink-0">
                          <Folder className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ visibility: "visible" }}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => openRenameDialog(folder)}>
                              <FileText className="w-4 h-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setDeleteFolderId(folder.id);
                                setDeleteFolderOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <h3 className="font-medium mt-3 text-sm truncate">{folder.name}</h3>
                      <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
                        <span className="text-xs text-slate-500">{folder.documentCount} docs</span>
                        {folder.category && (
                          <Badge variant="secondary" className="text-xs">
                            {CATEGORY_MAP[folder.category] || folder.category}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {documents.length > 0 ? `${documents.length} document${documents.length !== 1 ? "s" : ""}` : "Documents"}
              </h3>
              <div className="flex items-center border rounded-md overflow-visible">
                <Button
                  size="icon"
                  variant="ghost"
                  className={`rounded-none ${viewMode === "table" ? "toggle-elevate toggle-elevated" : ""}`}
                  onClick={() => changeViewMode("table")}
                >
                  <TableIcon className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className={`rounded-none ${viewMode === "grid" ? "toggle-elevate toggle-elevated" : ""}`}
                  onClick={() => changeViewMode("grid")}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className={`rounded-none ${viewMode === "list" ? "toggle-elevate toggle-elevated" : ""}`}
                  onClick={() => changeViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {docsLoading ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </CardContent>
              </Card>
            ) : documents.length > 0 ? (
              <>
                {viewMode === "table" && (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead className="hidden sm:table-cell">Original Name</TableHead>
                            <TableHead className="hidden md:table-cell">Size</TableHead>
                            <TableHead className="hidden md:table-cell">Category</TableHead>
                            <TableHead className="hidden lg:table-cell">Uploaded By</TableHead>
                            <TableHead className="hidden lg:table-cell">Date</TableHead>
                            <TableHead className="w-10">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {documents.map((doc) => (
                            <TableRow key={doc.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                  <span className="font-medium text-sm truncate max-w-[200px]">{doc.title}</span>
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                <span className="text-sm text-slate-500 truncate max-w-[150px] block">{doc.originalName}</span>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <span className="text-sm text-slate-500">{formatFileSize(doc.size ?? 0)}</span>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {doc.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {CATEGORY_MAP[doc.category] || doc.category}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                <span className="text-sm text-slate-500">{doc.uploaderName}</span>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                <span className="text-sm text-slate-500">{formatDate(doc.createdAt)}</span>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="icon" variant="ghost">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleDownload(doc.id)}>
                                      <Download className="w-4 h-4 mr-2" />
                                      Download
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openShareDialog(doc.id)}>
                                      <Share2 className="w-4 h-4 mr-2" />
                                      Share
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openMoveDialog(doc.id)}>
                                      <ArrowRightLeft className="w-4 h-4 mr-2" />
                                      Move
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => {
                                        setDeleteDocId(doc.id);
                                        setDeleteDocOpen(true);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {viewMode === "grid" && (
                  <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {documents.map((doc) => (
                      <Card key={doc.id} className="border-0 shadow-sm group hover-elevate">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-md flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  style={{ visibility: "visible" }}
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleDownload(doc.id)}>
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openShareDialog(doc.id)}>
                                  <Share2 className="w-4 h-4 mr-2" />
                                  Share
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openMoveDialog(doc.id)}>
                                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                                  Move
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setDeleteDocId(doc.id);
                                    setDeleteDocOpen(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <h3 className="font-medium mt-3 text-sm truncate">{doc.title}</h3>
                          <p className="text-xs text-slate-500 truncate mt-1">{doc.originalName}</p>
                          <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
                            <span className="text-xs text-slate-400">{formatFileSize(doc.size ?? 0)}</span>
                            {doc.category && (
                              <Badge variant="outline" className="text-xs">
                                {CATEGORY_MAP[doc.category] || doc.category}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-2">{formatDate(doc.createdAt)}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {viewMode === "list" && (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-3 px-4 py-3 group hover-elevate">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-md flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{doc.title}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-xs text-slate-400">{formatFileSize(doc.size ?? 0)}</span>
                              <span className="text-xs text-slate-300 dark:text-slate-600">|</span>
                              <span className="text-xs text-slate-400">{formatDate(doc.createdAt)}</span>
                              {doc.uploaderName && (
                                <>
                                  <span className="text-xs text-slate-300 dark:text-slate-600">|</span>
                                  <span className="text-xs text-slate-400">{doc.uploaderName}</span>
                                </>
                              )}
                            </div>
                          </div>
                          {doc.category && (
                            <Badge variant="outline" className="text-xs hidden sm:inline-flex flex-shrink-0">
                              {CATEGORY_MAP[doc.category] || doc.category}
                            </Badge>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleDownload(doc.id)}>
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openShareDialog(doc.id)}>
                                <Share2 className="w-4 h-4 mr-2" />
                                Share
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openMoveDialog(doc.id)}>
                                <ArrowRightLeft className="w-4 h-4 mr-2" />
                                Move
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setDeleteDocId(doc.id);
                                  setDeleteDocOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                    <FileText className="w-10 h-10 mb-2" />
                    <p className="text-sm font-medium">
                      {isSearchActive ? "No documents found" : currentChildFolders.length > 0 ? "No loose files in this folder" : "No documents in this folder"}
                    </p>
                    <p className="text-xs mt-1">
                      {isSearchActive
                        ? "Try a different search term"
                        : currentChildFolders.length > 0
                          ? "Documents are inside subfolders"
                          : "Upload a file to get started"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent className="rounded-md">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>Add a new folder to organize your documents.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                className="rounded-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="folder-category">Category</Label>
              <Select value={newFolderCategory} onValueChange={setNewFolderCategory}>
                <SelectTrigger className="rounded-md">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="folder-desc">Description (optional)</Label>
              <Textarea
                id="folder-desc"
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
                placeholder="Enter description"
                className="rounded-md resize-none"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Parent Folder</Label>
              <Input
                disabled
                value={folderStack.length > 0 ? folderStack[folderStack.length - 1].name : "Root"}
                className="rounded-md bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateFolderOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createFolderMutation.mutate()}
              disabled={!newFolderName.trim() || !newFolderCategory || createFolderMutation.isPending}
            >
              {createFolderMutation.isPending ? "Creating..." : "Create Folder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="rounded-md">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>Upload a document to the current folder.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="upload-file">File</Label>
              <Input
                id="upload-file"
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.csv,.zip"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setUploadFile(file);
                  if (file && !uploadTitle) {
                    setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
                  }
                }}
                className="rounded-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upload-title">Title</Label>
              <Input
                id="upload-title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Document title"
                className="rounded-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upload-desc">Description (optional)</Label>
              <Textarea
                id="upload-desc"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Enter description"
                className="rounded-md resize-none"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upload-category">Category</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger className="rounded-md">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Folder</Label>
              <Input
                disabled
                value={folderStack.length > 0 ? folderStack[folderStack.length - 1].name : "Root"}
                className="rounded-md bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => uploadMutation.mutate()}
              disabled={!uploadFile || !uploadTitle.trim() || !uploadCategory || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shareOpen} onOpenChange={(open) => { setShareOpen(open); if (!open) setCreatedShareUrl(""); }}>
        <DialogContent className="rounded-md max-w-lg">
          <DialogHeader>
            <DialogTitle>Share Document</DialogTitle>
            <DialogDescription>Create a shareable link for this document.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Expiry Time</Label>
              <Select value={shareExpiry} onValueChange={setShareExpiry}>
                <SelectTrigger className="rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="168">7 days</SelectItem>
                  <SelectItem value="720">30 days</SelectItem>
                  <SelectItem value="none">No expiry</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="share-max-downloads">Max Downloads (optional)</Label>
              <Input
                id="share-max-downloads"
                type="number"
                min="1"
                value={shareMaxDownloads}
                onChange={(e) => setShareMaxDownloads(e.target.value)}
                placeholder="Unlimited"
                className="rounded-md"
              />
            </div>
            <Button
              onClick={() => createShareMutation.mutate()}
              disabled={createShareMutation.isPending}
              className="w-full"
            >
              <Link2 className="w-4 h-4 mr-2" />
              {createShareMutation.isPending ? "Creating..." : "Create Share Link"}
            </Button>

            {createdShareUrl && (
              <div className="border rounded-md p-3 bg-slate-50 dark:bg-slate-800 space-y-2">
                <Label className="text-xs text-slate-500">Share URL</Label>
                <div className="flex items-center gap-2">
                  <Input value={createdShareUrl} readOnly className="rounded-md text-xs flex-1" />
                  <Button size="icon" variant="outline" onClick={() => copyToClipboard(createdShareUrl)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {shareDocId && (
              <div className="space-y-2">
                <Label className="text-xs text-slate-500">Existing Share Links</Label>
                {shareLinksLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : shareLinks.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {shareLinks.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center justify-between gap-2 p-2 border rounded-md text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-slate-600 dark:text-slate-400">
                            {link.token}
                          </div>
                          <div className="text-slate-400 mt-0.5">
                            {link.expiresAt ? `Expires: ${formatDate(link.expiresAt)}` : "No expiry"}
                            {link.maxDownloads ? ` | Max: ${link.maxDownloads}` : ""}
                            {` | Downloads: ${link.downloadCount}`}
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteShareMutation.mutate(link.id)}
                          disabled={deleteShareMutation.isPending}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No existing share links.</p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent className="rounded-md">
          <DialogHeader>
            <DialogTitle>Move Document</DialogTitle>
            <DialogDescription>Select a destination folder.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Destination Folder</Label>
              <Select value={moveTargetFolder} onValueChange={setMoveTargetFolder}>
                <SelectTrigger className="rounded-md">
                  <SelectValue placeholder="Select folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">Root</SelectItem>
                  {allFoldersFlat.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => moveDocMutation.mutate()}
              disabled={!moveTargetFolder || moveDocMutation.isPending}
            >
              {moveDocMutation.isPending ? "Moving..." : "Move"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="rounded-md">
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogDescription>Enter a new name for this folder.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="rename-input">Folder Name</Label>
              <Input
                id="rename-input"
                value={renameFolderName}
                onChange={(e) => setRenameFolderName(e.target.value)}
                className="rounded-md"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => renameFolderMutation.mutate()}
              disabled={!renameFolderName.trim() || renameFolderMutation.isPending}
            >
              {renameFolderMutation.isPending ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDocOpen} onOpenChange={setDeleteDocOpen}>
        <DialogContent className="rounded-md">
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDocOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDocMutation.mutate()}
              disabled={deleteDocMutation.isPending}
            >
              {deleteDocMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteFolderOpen} onOpenChange={setDeleteFolderOpen}>
        <DialogContent className="rounded-md">
          <DialogHeader>
            <DialogTitle>Delete Folder</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this folder and all its contents? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFolderOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteFolderMutation.mutate()}
              disabled={deleteFolderMutation.isPending}
            >
              {deleteFolderMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
