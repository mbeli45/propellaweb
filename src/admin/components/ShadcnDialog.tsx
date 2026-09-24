import { Dialog as Root, DialogContent as Content, DialogTitle as Title, DialogDescription } from '@/admin/ui/dialog';
import { Button as ShadcnButton } from '@/admin/ui/button';

// Small compatibility layer lets existing workflows retain their submit handlers.
export const Dialog = ({open,onClose,children,onClick,...props}:any) => <Root open={open} onOpenChange={next=>{if(!next)onClose?.();}}><Content className="admin-shadcn-dialog" onClick={onClick} aria-describedby={props['aria-describedby']} aria-labelledby={props['aria-labelledby']}>{children}</Content></Root>;
export const DialogTitle = ({children,id}:any) => <Title id={id} className="admin-dialog-title">{children}</Title>;
export const DialogContent = ({children}:any) => <div className="admin-dialog-body">{children}</div>;
export const DialogContentText = ({children,id}:any) => <DialogDescription id={id} className="leading-relaxed">{children}</DialogDescription>;
export const DialogActions = ({children}:any) => <div className="admin-dialog-actions">{children}</div>;
export const Button = ({sx,color,size,variant,children,autoFocus,...props}:any) => <ShadcnButton {...props} autoFocus={autoFocus} size={size==='small'?'sm':'default'} variant={color==='error'||sx?.backgroundColor?.startsWith('#DC')?'destructive':variant==='contained'?'default':variant==='outlined'?'outline':'ghost'}>{children}</ShadcnButton>;
