import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { requireAdminSession } from "@/lib/admin-route-guard";
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
  DialogDescription,
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
import { createRouteMeta } from "@/lib/route-meta";

export const Route = createFileRoute("/admin/users")({
  beforeLoad: ({ location }) => requireAdminSession(location.pathname),
  head: createRouteMeta({
    titleKey: "admin.users.meta.title",
    descriptionKey: "admin.users.meta.description",
    ogDescriptionKey: "admin.users.meta.ogDescription",
    noIndex: true,
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
  const { t, tr } = useI18n();
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
      <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-hidden">
        <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
          {tr({ vi: "Quản trị viên: toàn quyền. Cộng tác viên (Mod): chỉ Tin tuyển dụng, Tin tức và Danh mục.", en: "Administrator: full access. Moderator: job postings, news and categories only." })}
        </div>
        <div className="grid shrink-0 gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 items-center gap-2 rounded-md border border-input bg-card px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={tr({ vi: "Tìm theo email hoặc tên...", en: "Search email or name..." })}
              className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </div>
        <div className="hidden min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs md:flex">
          <div className="shrink-0 overflow-hidden rounded-t-xl border-b-2 border-border/80 bg-muted/60 backdrop-blur-sm">
            <Table className="table-fixed w-full">
              <TableHeader className="bg-transparent">
                <TableRow className="h-10 border-none hover:bg-transparent">
                  <TableHead className="w-[60px] text-center text-xs font-semibold text-foreground/80 select-none">{tr({ vi: "STT", en: "No." })}</TableHead>
                  <TableHead className="text-xs font-semibold text-foreground/80 select-none">{tr({ vi: "Email", en: "Email" })}</TableHead>
                  <TableHead className="text-xs font-semibold text-foreground/80 select-none">{tr({ vi: "Tên hiển thị", en: "Display name" })}</TableHead>
                  <TableHead className="w-[140px] text-xs font-semibold text-foreground/80 select-none">{tr({ vi: "Nhóm quyền", en: "Role" })}</TableHead>
                  <TableHead className="w-[130px] text-xs font-semibold text-foreground/80 select-none">{tr({ vi: "Trạng thái", en: "Status" })}</TableHead>
                  <TableHead className="w-[130px] text-xs font-semibold text-foreground/80 select-none">{tr({ vi: "Ngày tạo", en: "Created" })}</TableHead>
                  <TableHead className="w-[100px] pr-4 text-right text-xs font-semibold text-foreground/80 select-none">{tr({ vi: "Hành động", en: "Actions" })}</TableHead>
                </TableRow>
              </TableHeader>
            </Table>
          </div>
          <div className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden [&>div]:overflow-visible [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [scrollbar-width:thin] [scrollbar-color:hsl(var(--muted-foreground)/0.2)_transparent]">
            <Table className="table-fixed w-full">
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={7} className="p-2 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>}
                {!isLoading && users.length === 0 && <TableRow><TableCell colSpan={7} className="p-2 text-center text-sm text-muted-foreground">{tr({ vi: "Không có người dùng.", en: "No users found." })}</TableCell></TableRow>}
                {!isLoading && users.map((user, index) => <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="w-[60px] text-center tabular-nums text-muted-foreground">{(page - 1) * PAGE_SIZE + index + 1}</TableCell>
                  <TableCell className="min-w-0"><span className="block truncate font-medium">{user.email}{currentUser?.id === user.id && <span className="ml-2 text-xs text-muted-foreground">{tr({ vi: "(bạn)", en: "(you)" })}</span>}</span></TableCell>
                  <TableCell className="min-w-0 truncate">{user.name}</TableCell>
                  <TableCell className="w-[140px]"><Badge variant={user.role === "admin" ? "default" : "secondary"}>{roleLabel(user.role)}</Badge></TableCell>
                  <TableCell className="w-[130px]"><Badge variant={user.active ? "outline" : "destructive"}>{user.active ? tr({ vi: "Hoạt động", en: "Active" }) : tr({ vi: "Đã khoá", en: "Locked" })}</Badge></TableCell>
                  <TableCell className="w-[130px] text-sm text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="w-[100px] pr-4 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={tr({ vi: "Sửa", en: "Edit" })} title={tr({ vi: "Sửa", en: "Edit" })} onClick={() => openEdit(user)} disabled={isSaving}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md text-muted-foreground hover:bg-muted hover:text-destructive" aria-label={tr({ vi: "Xóa", en: "Delete" })} title={tr({ vi: "Xóa", en: "Delete" })} onClick={() => setPendingDelete(user)} disabled={isSaving || currentUser?.id === user.id}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>)}
              </TableBody>
            </Table>
          </div>
          <div className="h-10 min-h-10 shrink-0 border-t border-border/70 bg-muted/30 px-4 py-0 flex items-center justify-between gap-3 select-none">
            <div className="text-xs text-muted-foreground">
              {totalCount > 0 ? <>{t("admin.jobs.footer.showing")} <strong className="font-semibold text-foreground">{(page - 1) * PAGE_SIZE + 1}</strong> - <strong className="font-semibold text-foreground">{Math.min(page * PAGE_SIZE, totalCount)}</strong> {t("admin.jobs.footer.of")} <strong className="font-semibold text-foreground">{totalCount}</strong> {t("admin.jobs.footer.records")}</> : <span>{t("admin.jobs.footer.noRecords")}</span>}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{t("admin.jobs.footer.page")} <strong className="font-semibold text-foreground">{page}</strong> / {totalPages || 1}</span>
              <div className="flex items-center gap-1">
                <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-lg border-border/70" onClick={() => setPage(1)} disabled={page <= 1 || isLoading} title={t("admin.jobs.footer.firstPage")}><ChevronsLeft className="h-4 w-4" /></Button>
                <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-lg border-border/70" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || isLoading} title={t("admin.jobs.footer.prevPage")}><ChevronLeft className="h-4 w-4" /></Button>
                <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-lg border-border/70" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages || isLoading} title={t("admin.jobs.footer.nextPage")}><ChevronRight className="h-4 w-4" /></Button>
                <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-lg border-border/70" onClick={() => setPage(totalPages)} disabled={page >= totalPages || isLoading} title={t("admin.jobs.footer.lastPage")}><ChevronsRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-auto md:hidden">
          {isLoading && <p className="rounded-xl border border-dashed border-border p-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></p>}
          {!isLoading && users.length === 0 && <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{tr({ vi: "Không có người dùng.", en: "No users found." })}</p>}
          {!isLoading && users.map((user) => <div key={user.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{user.email}{currentUser?.id === user.id && <span className="ml-2 text-xs text-muted-foreground">{tr({ vi: "(bạn)", en: "(you)" })}</span>}</p>
              <p className="truncate text-sm text-muted-foreground">{user.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant={user.role === "admin" ? "default" : "secondary"}>{roleLabel(user.role)}</Badge>
                <Badge variant={user.active ? "outline" : "destructive"}>{user.active ? tr({ vi: "Hoạt động", en: "Active" }) : tr({ vi: "Đã khoá", en: "Locked" })}</Badge>
                <span>{formatDate(user.createdAt)}</span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col">
              <Button variant="ghost" size="icon" onClick={() => openEdit(user)} disabled={isSaving}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setPendingDelete(user)} disabled={isSaving || currentUser?.id === user.id}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </div>)}
        </div>
      </div>

      <Dialog open={draft !== null} onOpenChange={(open) => !open && !isSaving && setDraft(null)}>
        <DialogContent
          className="max-h-[90vh] overflow-hidden rounded-xl border border-border p-0 shadow-lg sm:max-w-md"
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          {draft && (
            <form
              className="flex max-h-[90vh] flex-col overflow-hidden"
              onSubmit={(event) => {
                event.preventDefault();
                void save();
              }}
            >
              <DialogHeader className="shrink-0 border-b border-border/70 px-6 py-4">
                <DialogTitle>{draft.id ? tr({ vi: "Sửa tài khoản", en: "Edit account" }) : tr({ vi: "Thêm tài khoản", en: "New account" })}</DialogTitle>
                <DialogDescription className="truncate">
                  {draft.email || tr({ vi: "Tài khoản truy cập khu vực quản trị.", en: "Console access account." })}
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
                <div className="space-y-2"><Label htmlFor="user-email">{tr({ vi: "Email", en: "Email" })}</Label><Input id="user-email" type="email" value={draft.email} disabled={Boolean(draft.id)} onChange={(event) => setDraft({ ...draft, email: event.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="user-name">{tr({ vi: "Tên hiển thị", en: "Display name" })}</Label><Input id="user-name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="user-password">{draft.id ? tr({ vi: "Mật khẩu mới (bỏ trống nếu giữ nguyên)", en: "New password (optional)" }) : tr({ vi: "Mật khẩu", en: "Password" })}</Label><Input id="user-password" type="password" autoComplete="new-password" value={draft.password} onChange={(event) => setDraft({ ...draft, password: event.target.value })} /></div>
                <div className="space-y-2"><Label>{tr({ vi: "Nhóm quyền", en: "Role" })}</Label><Select value={draft.role} onValueChange={(role) => setDraft({ ...draft, role: role as UserRole })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">{roleLabel("admin")}</SelectItem><SelectItem value="mod">{roleLabel("mod")}</SelectItem></SelectContent></Select></div>
                {draft.id && <label className="flex items-center gap-2 text-sm"><Switch checked={draft.active} onCheckedChange={(active) => setDraft({ ...draft, active })} />{tr({ vi: "Cho phép đăng nhập", en: "Allow sign in" })}</label>}
              </div>

              <DialogFooter className="shrink-0 border-t border-border/70 bg-muted/20 px-6 py-3.5 flex flex-row items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 rounded-md px-3.5 text-xs" onClick={() => setDraft(null)} disabled={isSaving}>
                  <X className="h-3.5 w-3.5" />
                  {tr({ vi: "Hủy", en: "Cancel" })}
                </Button>
                <Button type="submit" size="sm" className="h-8 gap-1.5 rounded-md px-4 text-xs font-medium" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  {tr({ vi: "Lưu", en: "Save" })}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && !isSaving && setPendingDelete(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{tr({ vi: "Xoá tài khoản này?", en: "Delete this account?" })}</AlertDialogTitle><AlertDialogDescription>{pendingDelete?.email} — {tr({ vi: "Tài khoản sẽ bị vô hiệu hoá.", en: "The account will be disabled." })}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={isSaving}>{tr({ vi: "Hủy", en: "Cancel" })}</AlertDialogCancel><AlertDialogAction onClick={(event) => { event.preventDefault(); void remove(); }} disabled={isSaving}>{isSaving && <Loader2 className="h-4 w-4 animate-spin" />}{tr({ vi: "Xóa", en: "Delete" })}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
