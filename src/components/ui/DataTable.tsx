import { useState, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { Search } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface DataTableProps<TData, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageSize?: number;
  searchPlaceholder?: string;
}

export function DataTable<TData, TValue = unknown>({
  columns,
  data,
  pageSize = 10000, // Set to a large number to virtualize all data
  searchPlaceholder = "Search records...",
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize,
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    state: {
      pagination,
      globalFilter,
    },
  });

  const parentRef = useRef<HTMLDivElement>(null);
  const rows = table.getRowModel().rows;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className="space-y-4">
      {/* Global Search Bar */}
      <div className="relative w-full md:w-72">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          value={globalFilter ?? ''}
          onChange={e => setGlobalFilter(e.target.value)}
          placeholder={searchPlaceholder}
          className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all"
        />
      </div>

      <div 
        className="bg-white border border-slate-200 rounded-lg overflow-auto h-[600px]" 
        ref={parentRef}
      >
        <table className="w-full text-left text-sm relative">
          <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 font-bold text-slate-500 uppercase text-xs">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody 
            className="divide-y divide-slate-100 relative"
            style={{ height: `${virtualizer.getTotalSize()}px` }}
          >
            {virtualItems.length ? (
              virtualItems.map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <tr 
                    key={row.id} 
                    className="hover:bg-slate-50 transition-colors"
                    style={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      width: '100%', 
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)` 
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-slate-700">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center text-slate-500">
                  No records found matching "{globalFilter}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2">
        <div className="text-xs text-slate-500 font-medium">
          Showing {rows.length} records
        </div>
      </div>
    </div>
  );
}
