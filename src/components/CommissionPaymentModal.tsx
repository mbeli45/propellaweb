import { useNavigate } from 'react-router-dom';
import '@/pages/Deals.css';
export default function DealNextStep({visible,onClose,reservation,propertyTitle}:{visible:boolean;onClose:()=>void;reservation:{id:string};propertyTitle:string;agentName?:string;onPaymentSuccess?:()=>void}) {
 const navigate=useNavigate();
 if(!visible)return null;
 return <div className="deal-page" style={{minHeight:0,padding:0}}><div className="deal-overlay"><section className="deal-dialog" role="dialog" aria-modal="true" aria-labelledby="next-deal-step"><h2 id="next-deal-step">What happens next?</h2><p>Your viewing of {propertyTitle} is complete. Tell us whether you want to proceed, are still deciding, or want to keep searching.</p><p>No agency commission is due for a viewing. Review the agency’s quote in My Deals and pay through Propella only if you rent or buy.</p><div className="deal-actions"><button className="deal-primary" onClick={()=>{onClose();navigate(`/user/deals?reservation=${encodeURIComponent(reservation.id)}`);}}>Open my property deal</button><button onClick={onClose}>Decide later</button></div></section></div></div>;
}
