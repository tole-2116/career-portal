import { createFileRoute } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { requireAdminSession } from "@/lib/admin-route-guard";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useI18n } from "@/lib/i18n";
import {
  fetchAdminContact,
  fetchAdminContacts,
  type AdminContact,
} from "@/services/admin-contacts.api";
import { createRouteMeta } from "@/lib/route-meta";

export const Route = createFileRoute("/admin/contacts")({
  beforeLoad: ({ location }) => requireAdminSession(location.pathname),
  head: createRouteMeta({
    titleKey: "admin.contacts.meta.title",
    descriptionKey: "admin.contacts.meta.description",
    ogDescriptionKey: "admin.contacts.meta.ogDescription",
    noIndex: true,
  }),
  component: AdminContactsPage,
});

const PAGE_SIZE = 10;

function AdminContactsPage() {
  const { t, tr } = useI18n();
  const [contacts, setContacts] = useState<AdminContact[]>([]);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<AdminContact | null>(null);

  const loadContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchAdminContacts({
        page,
        limit: PAGE_SIZE,
        ...(keyword.trim() ? { search: keyword.trim() } : {}),
      });
      setContacts(result.contacts);
      setTotalCount(result.total);
      setTotalPages(result.totalPages);
      if (result.page !== page) setPage(result.page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tr({ vi: "Không tải được danh sách liên hệ.", en: "Failed to load contacts." }));
    } finally {
      setIsLoading(false);
    }
  }, [keyword, page, tr]);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    setPage(1);
  }, [keyword]);

  const openView = async (contact: AdminContact) => {
    setSelected(contact);
    try {
      const detail = await fetchAdminContact(contact.id);
      setSelected(detail);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tr({ vi: "Không tải được chi tiết liên hệ.", en: "Failed to load contact details." }));
    }
  };

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <AdminLayout
      title={tr({ vi: "Liên hệ", en: "Contacts" })}
      description={tr({ vi: "Tin nhắn gửi từ biểu mẫu liên hệ trên website.", en: "Messages submitted through the website contact form." })}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-hidden">
        <div className="grid shrink-0 gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 items-center gap-2 rounded-md border border-input bg-card px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={tr({ vi: "Tìm theo tên, email hoặc tiêu đề...", en: "Search name, email or subject..." })}
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
                  <TableHead className="text-xs font-semibold text-foreground/80 select-none">{tr({ vi: "Tên", en: "Name" })}</TableHead>
                  <TableHead className="text-xs font-semibold text-foreground/80 select-none">{tr({ vi: "Tiêu đề", en: "Subject" })}</TableHead>
                  <TableHead className="w-[140px] text-xs font-semibold text-foreground/80 select-none">{tr({ vi: "Điện thoại", en: "Phone" })}</TableHead>
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
                {!isLoading && contacts.length === 0 && <TableRow><TableCell colSpan={7} className="p-2 text-center text-sm text-muted-foreground">{tr({ vi: "Không có liên hệ nào.", en: "No contacts found." })}</TableCell></TableRow>}
                {!isLoading && contacts.map((contact, index) => <TableRow key={contact.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="w-[60px] text-center tabular-nums text-muted-foreground">{(page - 1) * PAGE_SIZE + index + 1}</TableCell>
                  <TableCell className="min-w-0"><span className="block truncate font-medium">{contact.email}</span></TableCell>
                  <TableCell className="min-w-0 truncate">{contact.name}</TableCell>
                  <TableCell className="min-w-0 truncate">{contact.subject}</TableCell>
                  <TableCell className="w-[140px] text-sm text-muted-foreground">{contact.phone || "—"}</TableCell>
                  <TableCell className="w-[130px] text-sm text-muted-foreground">{formatDate(contact.createdAt)}</TableCell>
                  <TableCell className="w-[100px] pr-4 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={tr({ vi: "Xem", en: "View" })} title={tr({ vi: "Xem", en: "View" })} onClick={() => void openView(contact)} disabled={isLoading}><Eye className="h-4 w-4" /></Button>
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
          {!isLoading && contacts.length === 0 && <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{tr({ vi: "Không có liên hệ nào.", en: "No contacts found." })}</p>}
          {!isLoading && contacts.map((contact) => <div key={contact.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{contact.subject}</p>
              <p className="truncate text-sm text-muted-foreground">{contact.name} — {contact.email}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {contact.phone && <span>{contact.phone}</span>}
                <span>{formatDate(contact.createdAt)}</span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col">
              <Button variant="ghost" size="icon" onClick={() => void openView(contact)} disabled={isLoading}><Eye className="h-4 w-4" /></Button>
            </div>
          </div>)}
        </div>
      </div>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent
          className="max-h-[90vh] overflow-hidden rounded-xl border border-border p-0 shadow-lg sm:max-w-2xl"
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          {selected && (
            <div className="flex max-h-[90vh] flex-col overflow-hidden">
              <DialogHeader className="shrink-0 border-b border-border/70 px-6 py-4">
                <DialogTitle className="truncate">{tr({ vi: "Chi tiết liên hệ", en: "Contact details" })}</DialogTitle>
                <DialogDescription className="truncate">
                  {selected.code
                    ? `${tr({ vi: "Mã liên hệ", en: "Contact code" })}: ${selected.code}`
                    : tr({ vi: "Tin nhắn gửi từ biểu mẫu liên hệ.", en: "Message submitted through the contact form." })}
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5 text-sm">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="view-name">{tr({ vi: "Họ và tên", en: "Full name" })}</Label>
                    <Input id="view-name" readOnly value={selected.name} tabIndex={-1} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="view-email">{tr({ vi: "Email", en: "Email" })}</Label>
                    <Input id="view-email" readOnly value={selected.email} tabIndex={-1} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="view-phone">{tr({ vi: "Số điện thoại", en: "Phone number" })}</Label>
                    <Input id="view-phone" readOnly value={selected.phone || "—"} tabIndex={-1} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="view-subject">{tr({ vi: "Chủ đề", en: "Subject" })}</Label>
                    <Input id="view-subject" readOnly value={selected.subject} tabIndex={-1} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="view-created">{tr({ vi: "Ngày tạo", en: "Created" })}</Label>
                    <Input id="view-created" readOnly value={formatDate(selected.createdAt)} tabIndex={-1} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="view-body">{tr({ vi: "Nội dung", en: "Message" })}</Label>
                  <Textarea id="view-body" readOnly rows={7} value={selected.body} tabIndex={-1} className="whitespace-pre-wrap leading-relaxed" />
                </div>
              </div>

              <DialogFooter className="shrink-0 border-t border-border/70 bg-muted/20 px-6 py-3.5 flex flex-row items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 rounded-md px-3.5 text-xs" onClick={() => setSelected(null)}>
                  <X className="h-3.5 w-3.5" />
                  {tr({ vi: "Hủy", en: "Cancel" })}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
