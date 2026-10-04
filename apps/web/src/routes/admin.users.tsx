import { createFileRoute } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/lib/auth-store";
import { useI18n } from "@/lib/i18n";
import {
  createAdminUser,
  deleteAdminUser,
  fetchAdminUsers,
  updateAdminUser,
  type AdminManagedUser,
} from "@/services/admin-users.api";
import type { UserRole } from "@/lib/permissions";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Người dùng — TalentHub HR" },
      { name: "description", content: "Quản lý tài khoản quản trị viên và cộng tác viên." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminUsersPage,
});

const PAGE_SIZE = 10;

type Draft = {
  id: string | null;
  email: string;
  name: string;
  password: string;
  role: UserRole;
  active: boolean;
};

function AdminUsersPage() {
  const { tr } = useI18n();
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<AdminManagedUser[]>([]);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminManagedUser | null>(null);

  const roleLabel = (role: UserRole) =>
    role === "admin"
      ? tr({ vi: "Quản trị viên", en: "Administrator" })
      : tr({ vi: "Cộng tác viên (Mod)", en: "Moderator" });

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchAdminUsers({
        page,
        limit: PAGE_SIZE,
        ...(keyword.trim() ? { search: keyword.trim() } : {}),
      });
      setUsers(result.users);
      setTotalCount(result.total);
      setTotalPages(result.totalPages);
      if (result.page !== page) setPage(result.page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tr({ vi: "Không tải được người dùng.", en: "Failed to load users." }));
    } finally {
      setIsLoading(false);
    }
  }, [keyword, page, tr]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    setPage(1);
  }, [keyword]);

  const openNew = () => setDraft({ id: null, email: "", name: "", password: "", role: "mod", active: true });

  const openEdit = (user: AdminManagedUser) =>
    setDraft({ id: user.id, email: user.email, name: user.name, password: "", role: user.role, active: user.active });

  const save = async () => {
    if (!draft || isSaving) return;
    const email = draft.email.trim();
    const name = draft.name.trim();
    if (!email || !email.includes("@") || !name) {
      toast.error(tr({ vi: "Vui lòng nhập email và tên hiển thị hợp lệ.", en: "Enter a valid email and display name." }));
      return;
    }
    if (!draft.id && draft.password.length < 6 || draft.id && draft.password && draft.password.length < 6) {
      toast.error(tr({ vi: "Mật khẩu phải có ít nhất 6 ký tự.", en: "Password must be at least 6 characters." }));
      return;
    }

    setIsSaving(true);
    try {
      if (draft.id) {
        await updateAdminUser(draft.id, {
          email,
          name,
          role: draft.role,
          active: draft.active,
          ...(draft.password ? { password: draft.password } : {}),
        });
        toast.success(tr({ vi: "Đã cập nhật tài khoản.", en: "Account updated." }));
      } else {
        await createAdminUser({ email, name, password: draft.password, role: draft.role, active: true });
        toast.success(tr({ vi: "Đã thêm tài khoản.", en: "Account created." }));
      }
      setDraft(null);
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tr({ vi: "Không lưu được tài khoản.", en: "Failed to save account." }));
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    if (!pendingDelete || isSaving) return;
    setIsSaving(true);
    try {
      await deleteAdminUser(pendingDelete.id);
      setPendingDelete(null);
      toast.success(tr({ vi: "Đã xoá tài khoản.", en: "Account deleted." }));
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tr({ vi: "Không xoá được tài khoản.", en: "Failed to delete account." }));
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (value: string) => {
    try {
      return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
    } catch {
      return value;
    }
  };

  return (
    <AdminLayout
      title={tr({ vi: "Người dùng", en: "Users" })}
      description={tr({ vi: "Tài khoản truy cập khu vực quản trị và nhóm quyền tương ứng.", en: "Console accounts and their permission groups." })}
      action={<Button size="sm" onClick={openNew}><Plus className="h-4 w-4" /> {tr({ vi: "Thêm người dùng", en: "New user" })}</Button>}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-5 p-4 sm:p-6">
        <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
          {tr({ vi: "Quản trị viên: toàn quyền. Cộng tác viên (Mod): chỉ Tin tuyển dụng, Tin tức và Danh mục.", en: "Administrator: full access. Moderator: job postings, news and categories only." })}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder={tr({ vi: "Tìm theo email hoặc tên...", en: "Search email or name..." })} />
          </div>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden [&>div]:overflow-visible [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [scrollbar-width:thin] [scrollbar-color:hsl(var(--muted-foreground)/0.2)_transparent]">
            <Table className="table-fixed w-full">
              <TableHeader><TableRow>
                <TableHead>{tr({ vi: "Email", en: "Email" })}</TableHead>
                <TableHead>{tr({ vi: "Tên hiển thị", en: "Display name" })}</TableHead>
                <TableHead>{tr({ vi: "Nhóm quyền", en: "Role" })}</TableHead>
                <TableHead>{tr({ vi: "Trạng thái", en: "Status" })}</TableHead>
                <TableHead>{tr({ vi: "Ngày tạo", en: "Created" })}</TableHead>
                <TableHead className="w-24 text-right">{tr({ vi: "Hành động", en: "Actions" })}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {users.map((user) => <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}{currentUser?.id === user.id && <span className="ml-2 text-xs text-muted-foreground">{tr({ vi: "(bạn)", en: "(you)" })}</span>}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell><Badge variant={user.role === "admin" ? "default" : "secondary"}>{roleLabel(user.role)}</Badge></TableCell>
                  <TableCell><Badge variant={user.active ? "outline" : "destructive"}>{user.active ? tr({ vi: "Hoạt động", en: "Active" }) : tr({ vi: "Đã khoá", en: "Locked" })}</Badge></TableCell>
                  <TableCell className="text-sm">{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" aria-label={tr({ vi: "Sửa", en: "Edit" })} onClick={() => openEdit(user)} disabled={isSaving}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" aria-label={tr({ vi: "Xóa", en: "Delete" })} onClick={() => setPendingDelete(user)} disabled={isSaving || currentUser?.id === user.id}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>)}
                {!isLoading && users.length === 0 && <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">{tr({ vi: "Không có người dùng.", en: "No users found." })}</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground">
            <span>{totalCount} {tr({ vi: "tài khoản", en: "accounts" })}</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => setPage(1)} disabled={page <= 1 || isLoading}><ChevronsLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || isLoading}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="px-2">{page} / {totalPages}</span>
              <Button variant="outline" size="icon" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages || isLoading}><ChevronRight className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" onClick={() => setPage(totalPages)} disabled={page >= totalPages || isLoading}><ChevronsRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={draft !== null} onOpenChange={(open) => !open && !isSaving && setDraft(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{draft?.id ? tr({ vi: "Sửa tài khoản", en: "Edit account" }) : tr({ vi: "Thêm tài khoản", en: "New account" })}</DialogTitle></DialogHeader>
          {draft && <div className="space-y-4">
            <div className="space-y-2"><Label htmlFor="user-email">{tr({ vi: "Email", en: "Email" })}</Label><Input id="user-email" type="email" value={draft.email} disabled={Boolean(draft.id)} onChange={(event) => setDraft({ ...draft, email: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="user-name">{tr({ vi: "Tên hiển thị", en: "Display name" })}</Label><Input id="user-name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="user-password">{draft.id ? tr({ vi: "Mật khẩu mới (bỏ trống nếu giữ nguyên)", en: "New password (optional)" }) : tr({ vi: "Mật khẩu", en: "Password" })}</Label><Input id="user-password" type="password" autoComplete="new-password" value={draft.password} onChange={(event) => setDraft({ ...draft, password: event.target.value })} /></div>
            <div className="space-y-2"><Label>{tr({ vi: "Nhóm quyền", en: "Role" })}</Label><Select value={draft.role} onValueChange={(role) => setDraft({ ...draft, role: role as UserRole })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">{roleLabel("admin")}</SelectItem><SelectItem value="mod">{roleLabel("mod")}</SelectItem></SelectContent></Select></div>
            {draft.id && <label className="flex items-center gap-2 text-sm"><Switch checked={draft.active} onCheckedChange={(active) => setDraft({ ...draft, active })} />{tr({ vi: "Cho phép đăng nhập", en: "Allow sign in" })}</label>}
          </div>}
          <DialogFooter><Button variant="outline" onClick={() => setDraft(null)} disabled={isSaving}>{tr({ vi: "Hủy", en: "Cancel" })}</Button><Button onClick={() => void save()} disabled={isSaving}>{isSaving && <Loader2 className="h-4 w-4 animate-spin" />}{tr({ vi: "Lưu", en: "Save" })}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && !isSaving && setPendingDelete(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{tr({ vi: "Xoá tài khoản này?", en: "Delete this account?" })}</AlertDialogTitle><AlertDialogDescription>{pendingDelete?.email} — {tr({ vi: "Tài khoản sẽ bị vô hiệu hoá.", en: "The account will be disabled." })}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={isSaving}>{tr({ vi: "Hủy", en: "Cancel" })}</AlertDialogCancel><AlertDialogAction onClick={(event) => { event.preventDefault(); void remove(); }} disabled={isSaving}>{isSaving && <Loader2 className="h-4 w-4 animate-spin" />}{tr({ vi: "Xóa", en: "Delete" })}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
