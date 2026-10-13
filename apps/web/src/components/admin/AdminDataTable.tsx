import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react";
import type * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useI18n } from "@/lib/i18n";

const BODY_SCROLLBAR =
  "relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden [&>div]:overflow-visible [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [scrollbar-width:thin] [scrollbar-color:hsl(var(--muted-foreground)/0.2)_transparent]";

export type AdminColumn<T> = {
  header: React.ReactNode;
  className?: string;
  cell: (row: T, index: number) => React.ReactNode;
};

export type AdminDataTableProps<T extends { id: string }> = {
  columns: AdminColumn<T>[];
  rows: T[];
  loading: boolean;
  emptyMessage: React.ReactNode;
  indexHeader?: React.ReactNode;
  rowClassName?: string;
  rowKey?: (row: T) => string;
  onRowClick?: (row: T) => void;
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  renderCard?: (row: T) => React.ReactNode;
};

export function AdminDataTable<T extends { id: string }>({
  columns,
  rows,
  loading,
  emptyMessage,
  indexHeader = "",
  rowClassName,
  rowKey,
  onRowClick,
  page,
  totalPages,
  totalCount,
  pageSize = 10,
  onPageChange,
  renderCard,
}: AdminDataTableProps<T>) {
  const { t } = useI18n();
  const colSpan = columns.length + 1;
  const keyOf = rowKey ?? ((row: T) => row.id);

  const goTo = (next: number) => onPageChange(next);

  return (
    <>
      <div className="hidden min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs md:flex">
        <div className="shrink-0 overflow-hidden rounded-t-xl border-b-2 border-border/80 bg-muted/60 backdrop-blur-sm">
          <Table className="table-fixed w-full">
            <TableHeader className="bg-transparent">
              <TableRow className="h-10 border-none hover:bg-transparent">
                <TableHead className="w-[60px] text-center text-xs font-semibold text-foreground/80 select-none">
                  {indexHeader}
                </TableHead>
                {columns.map((column, index) => (
                  <TableHead
                    key={index}
                    className={cnHeader(column.className)}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
          </Table>
        </div>

        <div className={BODY_SCROLLBAR}>
          <Table className="table-fixed w-full">
            <TableBody key={page} className="animate-in fade-in slide-in-from-bottom-1 duration-150">
              {loading && (
                <TableRow>
                  <TableCell
                    colSpan={colSpan}
                    className="p-2 text-center text-sm text-muted-foreground"
                  >
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </TableCell>
                </TableRow>
              )}
              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={colSpan}
                    className="p-2 text-center text-sm text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                rows.map((row, index) => (
                  <TableRow
                    key={keyOf(row)}
                    className={rowClassName ?? "hover:bg-muted/50 transition-colors"}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    <TableCell className="w-[60px] text-center tabular-nums text-muted-foreground">
                      {(page - 1) * pageSize + index + 1}
                    </TableCell>
                    {columns.map((column, colIndex) => (
                      <TableCell key={colIndex} className={column.className}>
                        {column.cell(row, index)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>

        <div className="h-10 min-h-10 shrink-0 border-t border-border/70 bg-muted/30 px-4 py-0 flex items-center justify-between gap-3 select-none">
          <div className="text-xs text-muted-foreground">
            {totalCount > 0 ? (
              <>
                {t("admin.jobs.footer.showing")}{" "}
                <strong className="font-semibold text-foreground">
                  {(page - 1) * pageSize + 1}
                </strong>{" "}
                -{" "}
                <strong className="font-semibold text-foreground">
                  {Math.min(page * pageSize, totalCount)}
                </strong>{" "}
                {t("admin.jobs.footer.of")}{" "}
                <strong className="font-semibold text-foreground">{totalCount}</strong>{" "}
                {t("admin.jobs.footer.records")}
              </>
            ) : (
              <span>{t("admin.jobs.footer.noRecords")}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {t("admin.jobs.footer.page")}{" "}
              <strong className="font-semibold text-foreground">{page}</strong> / {totalPages || 1}
            </span>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md border-border/70"
                onClick={() => goTo(1)}
                disabled={page <= 1 || loading}
                title={t("admin.jobs.footer.firstPage")}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md border-border/70"
                onClick={() => goTo(Math.max(page - 1, 1))}
                disabled={page <= 1 || loading}
                title={t("admin.jobs.footer.prevPage")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md border-border/70"
                onClick={() => goTo(Math.min(page + 1, totalPages))}
                disabled={page >= totalPages || loading}
                title={t("admin.jobs.footer.nextPage")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md border-border/70"
                onClick={() => goTo(totalPages)}
                disabled={page >= totalPages || loading}
                title={t("admin.jobs.footer.lastPage")}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {renderCard && (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto md:hidden">
          {loading && (
            <p className="rounded-xl border border-dashed border-border p-10 text-center">
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
            </p>
          )}
          {!loading && rows.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </p>
          )}
          {!loading && rows.map((row) => renderCard(row))}
        </div>
      )}
    </>
  );
}

function cnHeader(className?: string) {
  return `text-xs font-semibold text-foreground/80 select-none${className ? ` ${className}` : ""}`;
}
