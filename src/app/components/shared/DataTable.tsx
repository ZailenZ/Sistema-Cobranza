import { useState } from "react";
import { ChevronDown, ChevronUp, Download, Plus, Search } from "lucide-react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { cn } from "../ui/utils";

interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  onAdd?: () => void;
  onExport?: () => void;
  searchPlaceholder?: string;
  title?: string;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  onRowClick,
  onAdd,
  onExport,
  searchPlaceholder = "Buscar...",
  title,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortColumn(columnKey);
    setSortDirection("asc");
  };

  const filteredData = data.filter((item) => {
    const searchValue = searchTerm.toLowerCase();
    return Object.values(item as Record<string, unknown>).some((value) =>
      String(value).toLowerCase().includes(searchValue),
    );
  });

  const sortedData = [...filteredData].sort((left, right) => {
    if (!sortColumn) return 0;

    const leftValue = String((left as Record<string, unknown>)[sortColumn] ?? "");
    const rightValue = String((right as Record<string, unknown>)[sortColumn] ?? "");
    const comparison = leftValue.localeCompare(rightValue, undefined, {
      numeric: true,
      sensitivity: "base",
    });

    return sortDirection === "asc" ? comparison : -comparison;
  });

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          {title && <h3 className="shrink-0 text-sm font-semibold text-foreground">{title}</h3>}
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-9 rounded-lg border-border bg-background pl-9 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport} className="rounded-lg">
              <Download className="size-4" />
              Exportar
            </Button>
          )}
          {onAdd && (
            <Button size="sm" onClick={onAdd} className="rounded-lg">
              <Plus className="size-4" />
              Agregar nuevo
            </Button>
          )}
        </div>
      </div>

      <div className="scrollbar-modern overflow-x-auto border-t border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className="px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(String(column.key))}
                      className="flex items-center gap-1.5 transition-colors hover:text-foreground"
                    >
                      {column.label}
                      {sortColumn === column.key &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="size-3.5" />
                        ) : (
                          <ChevronDown className="size-3.5" />
                        ))}
                    </button>
                  ) : (
                    column.label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedData.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Sin resultados para tu búsqueda.
                </TableCell>
              </TableRow>
            )}
            {paginatedData.map((item, index) => (
              <TableRow
                key={item.id || index}
                onClick={() => onRowClick?.(item)}
                className={cn(onRowClick && "cursor-pointer")}
              >
                {columns.map((column) => (
                  <TableCell
                    key={String(column.key)}
                    className="px-4 py-3 text-sm text-foreground"
                  >
                    {column.render
                      ? column.render(item)
                      : String((item as Record<string, unknown>)[String(column.key)] ?? "-")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, sortedData.length)} de{" "}
            {sortedData.length} resultados
          </p>

          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="rounded-lg"
            >
              Anterior
            </Button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
              const pageNumber = index + 1;
              return (
                <Button
                  key={pageNumber}
                  variant={currentPage === pageNumber ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNumber)}
                  className="min-w-9 rounded-lg"
                >
                  {pageNumber}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg"
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
