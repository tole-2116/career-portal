import { createFileRoute } from "@tanstack/react-router";
import { Eye, Search, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminDataTable, type AdminColumn } from "@/components/admin/AdminDataTable";
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
  const { tr } = useI18n();
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

  const columns: AdminColumn<AdminContact>[] = [
    { header: tr({ vi: "Email", en: "Email" }), cell: (c) => <span className="block truncate font-medium">{c.email}</span> },
    { header: tr({ vi: "Tên", en: "Name" }), className: "min-w-0 truncate", cell: (c) => c.name },
    { header: tr({ vi: "Tiêu đề", en: "Subject" }), className: "min-w-0 truncate", cell: (c) => c.subject },
    { header: tr({ vi: "Điện thoại", en: "Phone" }), className: "w-[140px] text-sm text-muted-foreground", cell: (c) => c.phone || "—" },
    { header: tr({ vi: "Ngày tạo", en: "Created" }), className: "w-[130px] text-sm text-muted-foreground", cell: (c) => formatDate(c.createdAt) },
    {
      header: tr({ vi: "Hành động", en: "Actions" }),
      className: "w-[100px] text-center",
      cell: (c) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={tr({ vi: "Xem", en: "View" })}
          title={tr({ vi: "Xem", en: "View" })}
          onClick={() => void openView(c)}
          disabled={isLoading}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

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
        <AdminDataTable
          columns={columns}
          rows={contacts}
          loading={isLoading}
          emptyMessage={tr({ vi: "Không có liên hệ nào.", en: "No contacts found." })}
          rowKey={(contact) => contact.id}
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          onRefresh={() => void loadContacts()}
          renderCard={(contact) => (
            <div key={contact.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-card p-3">
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
            </div>
          )}
        />
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
