import * as React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export type Column<T> = {
  id: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  sortValue?: (row: T) => string | number; // Sıralama için gerçek değer
};

type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  className?: string;
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
};

type SortState = {
  column: string | null;
  direction: 'asc' | 'desc';
};

export function DataTable<T extends { id?: number | string }>({
  data,
  columns,
  onRowClick,
  emptyMessage = 'Veri bulunamadı',
  className,
  selectable = false,
  onSelectionChange,
}: DataTableProps<T>) {
  const [sortState, setSortState] = React.useState<SortState>({ column: null, direction: 'asc' });
  const [selectedRows, setSelectedRows] = React.useState<Set<string | number>>(new Set());

  const sortedData = React.useMemo(() => {
    if (!sortState.column) return data;

    const column = columns.find((c) => c.id === sortState.column);
    if (!column || !column.sortable) return data;

    return [...data].sort((a, b) => {
      // Sıralama için özel sortValue fonksiyonu varsa onu kullan, yoksa accessor'dan değer çıkar
      let aVal: string | number;
      let bVal: string | number;
      
      if (column.sortValue) {
        aVal = column.sortValue(a);
        bVal = column.sortValue(b);
      } else {
        // Accessor'dan değer çıkarmaya çalış, eğer React element ise row'dan direkt değer al
        const aAccessor = column.accessor(a);
        const bAccessor = column.accessor(b);
        
        // Eğer React element ise, row'dan direkt değer almaya çalış
        if (React.isValidElement(aAccessor) || React.isValidElement(bAccessor)) {
          // Row'dan direkt değer al (id'ye göre)
          const rowA = a as any;
          const rowB = b as any;
          aVal = rowA[column.id] ?? '';
          bVal = rowB[column.id] ?? '';
        } else {
          aVal = String(aAccessor ?? '').toLowerCase();
          bVal = String(bAccessor ?? '').toLowerCase();
        }
      }

      // Sayısal karşılaştırma
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortState.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // String karşılaştırma
      const aStr = String(aVal ?? '').toLowerCase();
      const bStr = String(bVal ?? '').toLowerCase();

      if (sortState.direction === 'asc') {
        return aStr.localeCompare(bStr, 'tr');
      }
      return bStr.localeCompare(aStr, 'tr');
    });
  }, [data, sortState, columns]);

  const handleSort = (columnId: string) => {
    setSortState((prev) => ({
      column: columnId,
      direction: prev.column === columnId && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(data.map((row) => row.id ?? ''));
      setSelectedRows(allIds);
      onSelectionChange?.(Array.from(allIds).map((id) => data.find((r) => (r.id ?? '') === id)!).filter(Boolean));
    } else {
      setSelectedRows(new Set());
      onSelectionChange?.([]);
    }
  };

  const handleSelectRow = (row: T, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    const id = row.id ?? '';
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
    onSelectionChange?.(Array.from(newSelected).map((id) => data.find((r) => (r.id ?? '') === id)!).filter(Boolean));
  };

  const allSelected = data.length > 0 && selectedRows.size === data.length;
  const someSelected = selectedRows.size > 0 && selectedRows.size < data.length;

  return (
    <div className={cn('rounded-md border bg-card', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              {selectable && (
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={cn(
                    'h-12 px-4 text-left align-middle font-medium text-muted-foreground',
                    column.className
                  )}
                >
                  {column.sortable ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 -ml-4 hover:bg-transparent"
                      onClick={() => handleSort(column.id)}
                    >
                      {column.header}
                      {sortState.column === column.id ? (
                        sortState.direction === 'asc' ? (
                          <ChevronUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-2 h-4 w-4" />
                        )
                      ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                      )}
                    </Button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, index) => (
                <motion.tr
                  key={row.id ?? index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    'border-b transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-muted/50',
                    selectedRows.has(row.id ?? '') && 'bg-muted/30'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row.id ?? '')}
                        onChange={(e) => handleSelectRow(row, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={column.id} className={cn('px-4 py-2', column.className)}>
                      {column.accessor(row)}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

