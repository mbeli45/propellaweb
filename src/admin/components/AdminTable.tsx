import { Button } from '@/admin/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '@/admin/ui/dropdown-menu';
import { Children, isValidElement, useMemo, useState, type ReactNode, type ReactElement } from 'react';
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef, type VisibilityState } from '@tanstack/react-table';
import { RecordContextProvider, useListContext, useCreatePath, BulkDeleteButton } from 'react-admin';
import { useNavigate } from 'react-router-dom';

const humanize = (value: string) => value.replace(/_/g, ' ').replace(/^./, letter=>letter.toUpperCase());

// React-admin remains the server-data controller; TanStack owns the table model.
export const AdminTable = ({ children, rowClick, bulkActionButtons = true }: { children: ReactNode; rowClick?: 'edit' | 'show' | false; bulkActionButtons?: ReactNode }) => {
  const { data = [], sort, setSort, isPending, resource, selectedIds, onSelect, onToggleItem } = useListContext();
  const navigate = useNavigate();
  const createPath = useCreatePath();
  const [visibility, setVisibility] = useState<VisibilityState>({});
  const [compact, setCompact] = useState(false);
  const originalFields = Children.toArray(children).filter(isValidElement) as ReactElement<any>[];
  const actionFields = originalFields.filter(field=>!field.props.source&&!field.props.sortBy&&field.props.label==null);
  const fields = originalFields.filter(field=>!actionFields.includes(field));
  const columns = useMemo<ColumnDef<any>[]>(()=>fields.map<ColumnDef<any>>((field,index)=>{
    const source = field.props.sortBy || field.props.source;
    const label = field.props.label === false ? '' : field.props.label ?? (source ? humanize(source) : 'Actions');
    const key=String(source || label).toLowerCase();
    const size=/title|description|body|comment/.test(key)?300:/location|email|reference/.test(key)?230:/owner|user_id|agent_id|name/.test(key)?190:/featured|verified|admin/.test(key)?100:150;
    return { id: source || `field-${index}`, size, meta:{label}, accessorFn: record=>source ? record[source] : undefined,
      header: ()=>label, enableSorting: !!source && field.props.sortable !== false,
      cell: ({row})=><RecordContextProvider value={row.original}><div className="admin-cell-content" title={typeof row.original[field.props.source]==='string'?row.original[field.props.source]:undefined}>{field}</div></RecordContextProvider> };
  }).concat(actionFields.length ? [{id:'actions',size:200,meta:{label:'Actions'},header:()=> 'Actions',enableSorting:false,cell:({row}:any)=><RecordContextProvider value={row.original}><div className="admin-cell-actions">{actionFields}</div></RecordContextProvider>}] as ColumnDef<any>[] : []), [children]);
  const table = useReactTable({ data, columns, getCoreRowModel:getCoreRowModel(), manualSorting:true, manualPagination:true,
    enableSortingRemoval:false, state:{columnVisibility:visibility,sorting:sort?[{id:sort.field,desc:sort.order==='DESC'}]:[]},
    onColumnVisibilityChange:setVisibility,
    onSortingChange:updater=>{const next=typeof updater==='function'?updater(sort?[{id:sort.field,desc:sort.order==='DESC'}]:[]):updater; if(next[0])setSort({field:next[0].id,order:next[0].desc?'DESC':'ASC'});},
  });
  const selectable=bulkActionButtons!==false;
  const openRecord=(id: string|number)=>{if(rowClick)navigate(createPath({resource,id,type:rowClick}));};
  return <div className={`admin-table ${compact?'is-dense':''}`}>
    <div className="admin-table-tools"><span>{selectedIds.length ? `${selectedIds.length} selected` : 'Results'}</span>
      <div>{selectable&&selectedIds.length>0&&(bulkActionButtons===true?<BulkDeleteButton/>:bulkActionButtons)}
        <Button variant="outline" type="button" aria-pressed={compact} onClick={()=>setCompact(!compact)}>{compact?'Comfortable rows':'Compact rows'}</Button>
        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline">Columns</Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="max-h-80 overflow-auto">{table.getAllLeafColumns().map((column,index)=><DropdownMenuCheckboxItem key={column.id} checked={column.getIsVisible()} disabled={column.getIsVisible()&&table.getVisibleLeafColumns().length===1} onCheckedChange={checked=>column.toggleVisibility(checked)} onSelect={event=>event.preventDefault()}>{String((column.columnDef.meta as any)?.label || humanize(column.id))}</DropdownMenuCheckboxItem>)}</DropdownMenuContent></DropdownMenu>
      </div>
    </div>
    <div className="admin-table-scroll" role="region" aria-label="Results table" tabIndex={0}>
      <table aria-busy={isPending} style={{minWidth:table.getTotalSize()+(selectable?44:0)+(rowClick?48:0)}}><colgroup>{selectable&&<col style={{width:44}}/>}{table.getVisibleLeafColumns().map(column=><col key={column.id} style={{width:column.getSize()}}/>)}{rowClick&&<col style={{width:48}}/>}</colgroup><thead>{table.getHeaderGroups().map(group=><tr key={group.id}>
        {selectable&&<th><input aria-label="Select this page" type="checkbox" checked={data.length>0&&data.every(record=>selectedIds.includes(record.id))} onChange={event=>onSelect(event.target.checked?[...new Set([...selectedIds,...data.map(record=>record.id)])]:selectedIds.filter(id=>!data.some(record=>record.id===id)))}/></th>}
        {group.headers.map(header=><th key={header.id} aria-sort={header.column.getIsSorted()==='asc'?'ascending':header.column.getIsSorted()==='desc'?'descending':undefined}>{header.column.getCanSort()?<Button variant="outline" onClick={header.column.getToggleSortingHandler()}>{flexRender(header.column.columnDef.header,header.getContext())}<span>{header.column.getIsSorted()==='asc'?'↑':header.column.getIsSorted()==='desc'?'↓':'↕'}</span></Button>:flexRender(header.column.columnDef.header,header.getContext())}</th>)}
        {rowClick&&<th><span className="admin-visually-hidden">Open record</span></th>}
      </tr>)}</thead><tbody>{table.getRowModel().rows.map(row=><tr key={row.original.id} onClick={event=>{if(event.currentTarget.contains(event.target as Node)&&!(event.target as HTMLElement).closest('a,button,input,summary,[role="button"]'))openRecord(row.original.id);}} className={rowClick?'is-clickable':''}>
        {selectable&&<td><input aria-label={`Select record ${row.original.id}`} type="checkbox" checked={selectedIds.includes(row.original.id)} onChange={()=>onToggleItem(row.original.id)}/></td>}
        {row.getVisibleCells().map(cell=><td key={cell.id}>{flexRender(cell.column.columnDef.cell,cell.getContext())}</td>)}
        {rowClick&&<td><Button variant="outline" className="admin-row-open" aria-label={`Open record ${row.original.id}`} onClick={()=>openRecord(row.original.id)}>→</Button></td>}
      </tr>)}</tbody></table>
      {!data.length&&<p className="admin-table-empty">{isPending?'Loading records…':'No records match your filters.'}</p>}
    </div>
  </div>;
};

export const AdminPagination = () => {
  const {page,perPage,setPage,setPerPage,total,isPending,hasNextPage}=useListContext();
  const pages=typeof total==='number'?Math.max(1,Math.ceil(total/perPage)):null;
  return <footer className="admin-table-pagination"><label>Rows <select value={perPage} onChange={event=>{setPerPage(Number(event.target.value));setPage(1);}}>{[10,25,50,100].map(size=><option key={size}>{size}</option>)}</select></label><span>{typeof total==='number'?`${total===0?0:(page-1)*perPage+1}–${Math.min(page*perPage,total)} of ${total.toLocaleString()}`:`Page ${page}`}</span><div><Button variant="outline" disabled={page<=1||isPending} onClick={()=>setPage(page-1)}>Previous</Button><span>{page}{pages?` / ${pages}`:''}</span><Button variant="outline" disabled={isPending||(pages?page>=pages:!hasNextPage)} onClick={()=>setPage(page+1)}>Next</Button></div></footer>;
};
