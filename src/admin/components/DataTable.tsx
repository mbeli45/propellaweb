import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Icon } from '@iconify/react';
import { useState } from 'react';
import { Colors } from '@/constants/Colors';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = 'Search...',
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination: {
        pageIndex: page,
        pageSize,
      },
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
    table.setPageIndex(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPageSize = parseInt(event.target.value, 10);
    setPageSize(newPageSize);
    setPage(0);
    table.setPageSize(newPageSize);
    table.setPageIndex(0);
  };

  return (
    <Box>
      {searchable && (
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder={searchPlaceholder}
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Icon icon="lucide:search" width={20} style={{ color: Colors.neutral[400] }} />
                </InputAdornment>
              ),
              endAdornment: globalFilter && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setGlobalFilter('')}
                    sx={{ color: Colors.neutral[400] }}
                  >
                    <Icon icon="lucide:x" width={18} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: Colors.white,
              },
            }}
          />
        </Box>
      )}

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 2,
          border: `1px solid ${Colors.neutral[200]}`,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}
      >
        <Table>
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                sx={{
                  backgroundColor: Colors.neutral[50],
                  '& th': {
                    fontWeight: 600,
                    color: Colors.neutral[700],
                    borderBottom: `2px solid ${Colors.neutral[200]}`,
                  },
                }}
              >
                {headerGroup.headers.map((header) => (
                  <TableCell
                    key={header.id}
                    sx={{
                      cursor: header.column.getCanSort() ? 'pointer' : 'default',
                      userSelect: 'none',
                    }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', ml: 0.5 }}>
                          <Icon
                            icon="lucide:chevron-up"
                            width={16}
                            style={{
                              color:
                                header.column.getIsSorted() === 'asc'
                                  ? Colors.primary[500]
                                  : Colors.neutral[400],
                              opacity: header.column.getIsSorted() === 'asc' ? 1 : 0.3,
                            }}
                          />
                          <Icon
                            icon="lucide:chevron-down"
                            width={16}
                            style={{
                              color:
                                header.column.getIsSorted() === 'desc'
                                  ? Colors.primary[500]
                                  : Colors.neutral[400],
                              opacity: header.column.getIsSorted() === 'desc' ? 1 : 0.3,
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Icon icon="lucide:inbox" width={48} style={{ color: Colors.neutral[400] }} />
                    <Box sx={{ color: Colors.neutral[500], fontSize: '0.875rem' }}>
                      No data available
                    </Box>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{
                    '&:hover': {
                      backgroundColor: Colors.primary[50],
                    },
                    '& td': {
                      borderBottom: `1px solid ${Colors.neutral[100]}`,
                    },
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={table.getFilteredRowModel().rows.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={pageSize}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        sx={{
          borderTop: `1px solid ${Colors.neutral[200]}`,
          mt: 1,
        }}
      />
    </Box>
  );
}
