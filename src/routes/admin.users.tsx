import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
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
import { useAuth, type AdminUser } from "@/lib/auth-store";
import { useI18n } from "@/lib/i18n";
import type { UserRole } from "@/lib/permissions";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Người dùng — TalentHub HR" },
      {
        name: "description",
        content: "Quản lý tài khoản quản trị viên và cộng tác viên của hệ thống tuyển dụng.",
      },
      { property: "og:title", content: "Người dùng — TalentHub HR" },
      { property: "og:description", content: "Quản lý tài khoản và nhóm quyền." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminUsersPage,
});

type Draft = {
  id: string | null;
  username: string;
  name: string;
  password: string;
  role: UserRole;
  active: boolean;
};

function AdminUsersPage() {
  const { tr } = useI18n();
  const { users, currentUser, addUser, updateUser, removeUser } = useAuth();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null);

  const roleLabel = (role: UserRole) =>
    role === "admin"
      ? tr({ vi: "Quản trị viên", en: "Administrator" })
      : tr({ vi: "Cộng tác viên (Mod)", en: "Moderator" });

  const openNew = () =>
    setDraft({ id: null, username: "", name: "", password: "", role: "mod", active: true });

  const openEdit = (user: AdminUser) =>
    setDraft({
      id: user.id,
      username: user.username,
      name: user.name,
      password: "",
      role: user.role,
      active: user.active,
    });

  const save = async () => {
    if (!draft) return;
    if (draft.id) {
      const result = await updateUser(draft.id, {
        name: draft.name,
        role: draft.role,
        active: draft.active,
        ...(draft.password ? { password: draft.password } : {}),
      });
      if (!result.ok) {
        toast.error(
          tr({
            vi: "Cần giữ lại ít nhất một quản trị viên đang hoạt động.",
            en: "At least one active administrator is required.",
          }),
        );
        return;
      }
      toast.success(tr({ vi: "Đã cập nhật tài khoản.", en: "Account updated." }));
    } else {
      if (!draft.username.trim() || draft.password.length < 6) {
        toast.error(
          tr({
            vi: "Nhập tên đăng nhập và mật khẩu từ 6 ký tự.",
            en: "Enter a username and a password of at least 6 characters.",
          }),
        );
        return;
      }
      const result = await addUser({
        username: draft.username,
        name: draft.name,
        password: draft.password,
        role: draft.role,
      });
      if (!result.ok) {
        toast.error(
          result.error === "duplicate"
            ? tr({ vi: "Tên đăng nhập đã tồn tại.", en: "That username is taken." })
            : tr({ vi: "Thông tin chưa hợp lệ.", en: "Invalid details." }),
        );
        return;
      }
      toast.success(tr({ vi: "Đã thêm tài khoản.", en: "Account created." }));
    }
    setDraft(null);
  };

  return (
    <AdminLayout
      title={tr({ vi: "Người dùng", en: "Users" })}
      description={tr({
        vi: "Tài khoản truy cập khu vực quản trị và nhóm quyền tương ứng.",
        en: "Console accounts and their permission groups.",
      })}
      action={
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4" /> {tr({ vi: "Thêm người dùng", en: "New user" })}
        </Button>
      }
    >
      <div className="space-y-5 p-4 sm:p-6">
        <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
          {tr({
            vi: "Quản trị viên: toàn quyền. Cộng tác viên (Mod): chỉ Tin tuyển dụng, Tin tức và Danh mục.",
            en: "Administrator: full access. Moderator: job postings, news and categories only.",
          })}
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tr({ vi: "Tên đăng nhập", en: "Username" })}</TableHead>
                <TableHead>{tr({ vi: "Họ tên", en: "Full name" })}</TableHead>
                <TableHead>{tr({ vi: "Nhóm quyền", en: "Role" })}</TableHead>
                <TableHead>{tr({ vi: "Trạng thái", en: "Status" })}</TableHead>
                <TableHead>{tr({ vi: "Ngày tạo", en: "Created" })}</TableHead>
                <TableHead className="w-24 text-right">
                  {tr({ vi: "Hành động", en: "Actions" })}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.username}
                    {currentUser?.id === user.id && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {tr({ vi: "(bạn)", en: "(you)" })}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {roleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.active ? "outline" : "destructive"}>
                      {user.active
                        ? tr({ vi: "Hoạt động", en: "Active" })
                        : tr({ vi: "Đã khoá", en: "Locked" })}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{user.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={tr({ vi: "Sửa", en: "Edit" })}
                      onClick={() => openEdit(user)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={tr({ vi: "Xóa", en: "Delete" })}
                      onClick={() => setPendingDelete(user)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {draft?.id
                ? tr({ vi: "Sửa tài khoản", en: "Edit account" })
                : tr({ vi: "Thêm tài khoản", en: "New account" })}
            </DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-username">
                  {tr({ vi: "Tên đăng nhập", en: "Username" })}
                </Label>
                <Input
                  id="user-username"
                  value={draft.username}
                  disabled={Boolean(draft.id)}
                  onChange={(e) => setDraft({ ...draft, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-name">{tr({ vi: "Họ tên", en: "Full name" })}</Label>
                <Input
                  id="user-name"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-password">
                  {draft.id
                    ? tr({ vi: "Mật khẩu mới (bỏ trống nếu giữ nguyên)", en: "New password (optional)" })
                    : tr({ vi: "Mật khẩu", en: "Password" })}
                </Label>
                <Input
                  id="user-password"
                  type="password"
                  autoComplete="new-password"
                  value={draft.password}
                  onChange={(e) => setDraft({ ...draft, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{tr({ vi: "Nhóm quyền", en: "Role" })}</Label>
                <Select
                  value={draft.role}
                  onValueChange={(role) => setDraft({ ...draft, role: role as UserRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{roleLabel("admin")}</SelectItem>
                    <SelectItem value="mod">{roleLabel("mod")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {draft.id && (
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={draft.active}
                    onCheckedChange={(active) => setDraft({ ...draft, active })}
                  />
                  {tr({ vi: "Cho phép đăng nhập", en: "Allow sign in" })}
                </label>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              {tr({ vi: "Hủy", en: "Cancel" })}
            </Button>
            <Button onClick={() => void save()}>{tr({ vi: "Lưu", en: "Save" })}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {tr({ vi: "Xoá tài khoản này?", en: "Delete this account?" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.username} —{" "}
              {tr({ vi: "Hành động này không thể hoàn tác.", en: "This cannot be undone." })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tr({ vi: "Hủy", en: "Cancel" })}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingDelete) return;
                const result = removeUser(pendingDelete.id);
                setPendingDelete(null);
                if (result.ok) toast.success(tr({ vi: "Đã xoá tài khoản.", en: "Account deleted." }));
                else
                  toast.error(
                    tr({
                      vi: "Cần giữ lại ít nhất một quản trị viên đang hoạt động.",
                      en: "At least one active administrator is required.",
                    }),
                  );
              }}
            >
              {tr({ vi: "Xóa", en: "Delete" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
