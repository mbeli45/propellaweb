import { useContext, useState } from 'react';
import { ChoicesContext, useInput, useChoicesContext } from 'react-admin';
import { Input } from '@/admin/ui/input';
import { Textarea } from '@/admin/ui/textarea';
import { Label } from '@/admin/ui/label';
import { Checkbox } from '@/admin/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/admin/ui/select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/admin/ui/dropdown-menu';
import { Button } from '@/admin/ui/button';

const title = (props: any) => props.label ?? String(props.source || '').replace(/@.*$/, '').replace(/_/g,' ').replace(/^./, c=>c.toUpperCase());
const ErrorText = ({error}:any) => error ? <span className="text-xs text-destructive" role="alert">{error.message}</span> : null;

export const TextInput = (props:any) => {
  const {field,fieldState,id,isRequired}=useInput(props);
  const Control=props.multiline?Textarea:Input;
  return <div className={`shadcn-field ${props.fullWidth?'shadcn-field-wide':''}`}><Label htmlFor={id}>{title(props)}{isRequired?' *':''}</Label><Control {...field} id={id} type={props.type||'text'} value={field.value??''} disabled={props.disabled} required={props.required} placeholder={props.placeholder} rows={props.rows} aria-invalid={!!fieldState.error}/><ErrorText error={fieldState.error}/></div>;
};
export const NumberInput = (props:any) => <TextInput {...props} type="number" parse={props.parse || ((value:string)=>value===''?null:Number(value))}/>;
export const BooleanInput = (props:any) => {
  const {field,fieldState,id}=useInput({...props,type:'checkbox'});
  return <div className="shadcn-field shadcn-boolean"><Checkbox id={id} checked={!!field.value} onCheckedChange={field.onChange} onBlur={field.onBlur} disabled={props.disabled}/><Label htmlFor={id}>{title(props)}</Label><ErrorText error={fieldState.error}/></div>;
};
export const SelectInput = (props:any) => {
  const context=useContext(ChoicesContext);
  const source=props.source||context?.source;
  const {field,fieldState,id}=useInput({...props,source});
  const choices=useChoicesContext({choices:props.choices});
  const options=choices.allChoices||[];
  const name=(choice:any)=>typeof props.optionText==='function'?props.optionText(choice):choice[props.optionText||'name']||choice.full_name||choice.email||String(choice.id);
  return <div className="shadcn-field"><Label htmlFor={id}>{title({...props,source})}</Label><Select value={field.value==null||field.value===''?'__all__':String(field.value)} onValueChange={value=>field.onChange(value==='__all__'?null:options.find((option:any)=>String(option[props.optionValue||'id'])===value)?.[props.optionValue||'id']??value)} disabled={props.disabled}>
    <SelectTrigger id={id} onBlur={field.onBlur} aria-invalid={!!fieldState.error}><SelectValue placeholder="Select…"/></SelectTrigger><SelectContent><SelectItem value="__all__">{props.required?'Select…':'Any'}</SelectItem>{options.map((choice:any)=><SelectItem key={choice.id} value={String(choice[props.optionValue||'id'])}>{name(choice)}</SelectItem>)}</SelectContent>
  </Select><ErrorText error={fieldState.error}/></div>;
};
export const AutocompleteInput = (props:any) => {
  const context=useContext(ChoicesContext);
  const source=props.source||context?.source;
  const {field,fieldState,id}=useInput({...props,source});
  const choices=useChoicesContext({choices:props.choices});
  const [open,setOpen]=useState(false);
  const [search,setSearch]=useState('');
  const name=(choice:any)=>typeof props.optionText==='function'?props.optionText(choice):choice[props.optionText||'name']||choice.full_name||choice.email||String(choice.id);
  const options=choices.allChoices||[];
  const selected=options.find((choice:any)=>String(choice.id)===String(field.value));
  return <div className="shadcn-field"><Label htmlFor={id}>{title({...props,source})}</Label><DropdownMenu open={open} onOpenChange={setOpen}><DropdownMenuTrigger asChild><Button id={id} variant="outline" className="w-full justify-between font-normal" disabled={props.disabled} onBlur={field.onBlur}>{selected?name(selected):field.value?'Selected account':'Any'}<span>⌄</span></Button></DropdownMenuTrigger><DropdownMenuContent className="w-72 p-2" onCloseAutoFocus={()=>field.onBlur()}>
    <Input aria-label={`Search ${title({...props,source})}`} placeholder="Search…" value={search} onKeyDown={event=>event.stopPropagation()} onChange={event=>{setSearch(event.target.value);if(choices.isFromReference)choices.setFilters(props.filterToQuery?props.filterToQuery(event.target.value):{q:event.target.value},undefined,true);}}/>
    <div className="max-h-60 overflow-auto" role="listbox" aria-label={title({...props,source})}><Button variant="ghost" className="w-full justify-start" onClick={()=>{field.onChange(null);setOpen(false);}}>Any</Button>{options.filter((choice:any)=>choices.isFromReference||String(name(choice)).toLowerCase().includes(search.toLowerCase())).map((choice:any)=><Button role="option" aria-selected={String(field.value)===String(choice.id)} variant="ghost" className="w-full justify-start" key={choice.id} onClick={()=>{field.onChange(choice.id);setOpen(false);}}>{name(choice)}</Button>)}{choices.isPending&&<p className="text-sm text-muted-foreground">Loading…</p>}{!choices.isPending&&!options.length&&<p className="text-sm text-muted-foreground">No matches</p>}</div>
  </DropdownMenuContent></DropdownMenu><ErrorText error={fieldState.error}/></div>;
};
