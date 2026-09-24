import { useNavigate } from 'react-router-dom';
import { useFormState } from 'react-hook-form';
import { useSaveContext } from 'react-admin';
import { Button } from '../ui/button';
export const EditToolbar = () => {
 const navigate=useNavigate(); const {isSubmitting}=useFormState(); const {saving}=useSaveContext();
 return <div className="admin-shadcn-savebar"><Button type="submit" disabled={isSubmitting||saving}>{isSubmitting||saving?'Saving…':'Save changes'}</Button><Button type="button" variant="outline" disabled={isSubmitting||saving} onClick={()=>navigate(-1)}>Cancel</Button></div>;
};