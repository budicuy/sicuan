"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Edit2,
  Filter,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

export interface Column<T> {
  header: string;
  render: (item: T) => React.ReactNode;
  className?: string;
  sortKey?: string;
  /**
   * When `groupByFn` is set on DataTable, columns marked with `grouped: true`
   * are rendered once per group using rowSpan (e.g. the "Periode" column).
   */
  grouped?: boolean;
}

export interface TableFilter<T> {
  id: string;
  label: string;
  options: { label: string; value: string }[];
  filterFn?: (item: T, value: string) => boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  search: string;
  onSearchChange: (search: string) => void;
  searchPlaceholder?: string;
  filters?: TableFilter<T>[];
  filterValues?: Record<string, string>;
  onFilterChange?: (filterId: string, value: string) => void;
  onAdd?: () => void;
  addLabel?: string;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (key: string) => void;
  /**
   * When provided, the table renders in "grouped" mode:
   * consecutive rows sharing the same group key are merged with rowSpan.
   * An auto "No" column (group index) is prepended.
   * Columns with `grouped: true` are rowspanned and centred.
   * The actions column is rowspanned and centred.
   */
  groupByFn?: (item: T) => string;
}

export function DataTable<T extends { id: number }>({
  data,
  columns,
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  search,
  onSearchChange,
  searchPlaceholder = "Cari data...",
  filters,
  filterValues = {},
  onFilterChange = () => {},
  onAdd,
  addLabel = "Tambah Data",
  onEdit,
  onDelete,
  sortBy,
  sortOrder,
  onSort,
  groupByFn,
}: DataTableProps<T>) {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = totalItems > 0 ? (activePage - 1) * pageSize : 0;
  const endIndex = Math.min(startIndex + data.length, totalItems);

  const hasActions = !!(onEdit || onDelete);

  // ── helpers ──────────────────────────────────────────────────────────────

  const SortTh = ({ col }: { col: Column<T> }) => (
    <th
      className={`px-6 py-4 text-xs font-semibold uppercase text-primary-700 tracking-wider ${
        col.sortKey && onSort
          ? "cursor-pointer select-none hover:bg-primary-100/80 transition-all"
          : ""
      } ${col.className || ""}`}
      onClick={() => col.sortKey && onSort && onSort(col.sortKey)}
    >
      <div className="flex items-center gap-1.5">
        <span>{col.header}</span>
        {col.sortKey && onSort && (
          <span className="inline-flex text-neutral-400">
            {sortBy === col.sortKey ? (
              sortOrder === "asc" ? (
                <ArrowUp className="w-3.5 h-3.5 text-primary-600 stroke-[2.5]" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-primary-600 stroke-[2.5]" />
              )
            ) : (
              <ArrowUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100 transition-opacity" />
            )}
          </span>
        )}
      </div>
    </th>
  );

  // ── grouped rendering ────────────────────────────────────────────────────

  const renderGroupedBody = () => {
    // Build consecutive groups
    const groups: { key: string; items: T[] }[] = [];
    for (const item of data) {
      const key = (groupByFn as (item: T) => string)(item);
      const last = groups[groups.length - 1];
      if (last && last.key === key) {
        last.items.push(item);
      } else {
        groups.push({ key, items: [item] });
      }
    }

    const groupedCols = columns.filter((c) => c.grouped);
    const regularCols = columns.filter((c) => !c.grouped);

    return groups.flatMap((group, groupIdx) => {
      const rowSpan = group.items.length;

      return group.items.map((item, itemIdx) => {
        const isFirst = itemIdx === 0;
        const isLastInGroup = itemIdx === rowSpan - 1;

        return (
          <tr
            key={item.id}
            className={`hover:bg-primary-50/30 transition-all ${
              isLastInGroup
                ? "border-b border-neutral-200"
                : "border-b border-dashed border-neutral-100"
            }`}
          >
            {/* Auto NO — group index */}
            {isFirst && (
              <td
                rowSpan={rowSpan}
                className="px-4 py-4 text-xs text-neutral-400 font-semibold border-r border-neutral-100 align-middle text-center w-10 select-none"
              >
                {groupIdx + 1}
              </td>
            )}

            {/* Grouped columns — rendered once per group */}
            {groupedCols.map((col) =>
              isFirst ? (
                <td
                  key={col.header}
                  rowSpan={rowSpan}
                  className={`px-6 py-4 border-r border-neutral-100 align-middle text-center ${col.className || ""}`}
                >
                  {col.render(item)}
                </td>
              ) : null,
            )}

            {/* Regular columns — rendered for every row */}
            {regularCols.map((col) => (
              <td
                key={`${item.id}-${col.header}`}
                className={`px-6 py-3 ${col.className || ""}`}
              >
                {col.render(item)}
              </td>
            ))}

            {/* Actions — rendered once per group */}
            {hasActions &&
              (isFirst ? (
                <td
                  rowSpan={rowSpan}
                  className="px-4 py-4 border-l border-neutral-100 align-middle"
                >
                  <div className="flex items-center justify-center gap-1">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="p-1.5 rounded-lg text-neutral-600 hover:text-primary-600 hover:bg-neutral-100 transition-all border-0 cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="p-1.5 rounded-lg text-neutral-600 hover:text-red-500 hover:bg-red-50 transition-all border-0 cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              ) : null)}
          </tr>
        );
      });
    });
  };

  // ── flat (normal) rendering ──────────────────────────────────────────────

  const renderFlatBody = () =>
    data.map((item, idx) => (
      <tr
        key={item.id}
        className={`hover:bg-primary-50/30 transition-all ${
          idx % 2 === 1 ? "bg-neutral-50/40" : "bg-white"
        }`}
      >
        {columns.map((col) => (
          <td
            key={`${item.id}-${col.header}`}
            className={`px-6 py-4 ${col.className || ""}`}
          >
            {col.render(item)}
          </td>
        ))}
        {hasActions && (
          <td className="px-6 py-4 text-right">
            <div className="flex justify-end gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="p-1.5 rounded-lg text-neutral-600 hover:text-primary-600 hover:bg-neutral-100 transition-all border-0 cursor-pointer"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(item)}
                  className="p-1.5 rounded-lg text-neutral-600 hover:text-red-500 hover:bg-red-50 transition-all border-0 cursor-pointer"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </td>
        )}
      </tr>
    ));

  // ── render ───────────────────────────────────────────────────────────────

  // In grouped mode the column order in <thead> must be: NO | grouped cols | regular cols | Aksi
  const orderedColumns = groupByFn
    ? [
        ...columns.filter((c) => c.grouped),
        ...columns.filter((c) => !c.grouped),
      ]
    : columns;

  return (
    <div className="space-y-4">
      {/* Search, Filter & Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all text-neutral-800"
            />
          </div>

          {filters && filters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {filters.map((filter) => (
                <div key={filter.id} className="relative flex items-center">
                  <Filter className="absolute left-2.5 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                  <select
                    value={filterValues[filter.id] || ""}
                    onChange={(e) => onFilterChange(filter.id, e.target.value)}
                    className="pl-8 pr-3 py-2 border border-neutral-200 rounded-lg text-xs font-medium bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all text-neutral-700 appearance-none cursor-pointer hover:bg-neutral-50/50"
                  >
                    <option value="">{filter.label}</option>
                    {filter.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer border-0"
          >
            <Plus className="w-4 h-4" />
            {addLabel}
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary-100/50 border-b border-neutral-200">
                {/* Auto NO header in grouped mode */}
                {groupByFn && (
                  <th className="px-4 py-4 text-xs font-semibold uppercase text-primary-700 tracking-wider w-10 text-center">
                    No
                  </th>
                )}

                {orderedColumns.map((col) => (
                  <SortTh key={col.header} col={col} />
                ))}

                {hasActions && (
                  <th
                    className={`px-6 py-4 text-xs font-semibold uppercase text-primary-700 tracking-wider ${
                      groupByFn ? "text-center" : "text-right"
                    }`}
                  >
                    Aksi
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-sm">
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      (groupByFn ? 1 : 0) +
                      columns.length +
                      (hasActions ? 1 : 0)
                    }
                    className="px-6 py-10 text-center text-neutral-500 font-medium"
                  >
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              ) : groupByFn ? (
                renderGroupedBody()
              ) : (
                renderFlatBody()
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white px-6 py-4 rounded-xl border border-neutral-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
          <div className="flex items-center gap-2">
            <span>Tampilkan</span>
            <select
              value={pageSize}
              onChange={onPageSizeChange}
              className="px-2 py-1 border border-neutral-200 rounded-md bg-white focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600/10 text-neutral-800 text-xs font-semibold cursor-pointer"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={150}>150</option>
            </select>
            <span>data</span>
          </div>
          <span className="hidden sm:inline text-neutral-300">|</span>
          <span>
            Menampilkan{" "}
            <span className="font-semibold text-neutral-800">
              {totalItems > 0 ? startIndex + 1 : 0}
            </span>{" "}
            sampai{" "}
            <span className="font-semibold text-neutral-800">{endIndex}</span>{" "}
            dari{" "}
            <span className="font-semibold text-neutral-800">{totalItems}</span>{" "}
            data
          </span>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(activePage - 1, 1))}
              disabled={activePage === 1}
              className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:hover:bg-white cursor-pointer select-none transition-all"
            >
              Sebelumnya
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                if (
                  totalPages > 5 &&
                  Math.abs(p - activePage) > 1 &&
                  p !== 1 &&
                  p !== totalPages
                ) {
                  if (p === 2 || p === totalPages - 1) {
                    return (
                      <span key={p} className="px-1 text-neutral-400 text-xs">
                        ...
                      </span>
                    );
                  }
                  return null;
                }
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onPageChange(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activePage === p
                        ? "bg-primary-600 text-white"
                        : "text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => onPageChange(Math.min(activePage + 1, totalPages))}
              disabled={activePage === totalPages}
              className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:hover:bg-white cursor-pointer select-none transition-all"
            >
              Selanjutnya
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
