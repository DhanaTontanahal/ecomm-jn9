import { useParams } from "react-router-dom";
import InvoicePrint from "../../components/admin/InvoicePrint";

export default function InvoicePrintByRoute() {
    const { invoiceId } = useParams();
    return <InvoicePrint invoiceId={invoiceId} />;
}

