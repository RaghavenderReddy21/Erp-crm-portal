import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { Challan } from "../types";
import Layout from "../components/Layout";

export default function ChallanDetailPage() {
  const { id } = useParams();
  const [challan, setChallan] = useState<Challan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  async function load() {
    const res = await api.get(`/challans/${id}`);
    setChallan(res.data);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function updateStatus(status: "CONFIRMED" | "CANCELLED") {
    setError(null);
    setUpdating(true);
    try {
      await api.patch(`/challans/${id}/status`, { status });
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update challan status");
    } finally {
      setUpdating(false);
    }
  }

  if (!challan) return <Layout><p>Loading...</p></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <h2>{challan.challanNumber}</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {challan.status === "DRAFT" && (
            <>
              <button className="btn btn-primary" disabled={updating} onClick={() => updateStatus("CONFIRMED")}>
                Confirm (deduct stock)
              </button>
              <button className="btn btn-danger" disabled={updating} onClick={() => updateStatus("CANCELLED")}>
                Cancel
              </button>
            </>
          )}
          {challan.status === "CONFIRMED" && (
            <button className="btn btn-danger" disabled={updating} onClick={() => updateStatus("CANCELLED")}>
              Cancel (restores stock)
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <p><strong>Customer:</strong> {challan.customer?.name}</p>
        <p><strong>Status:</strong> {challan.status}</p>
        <p><strong>Total Quantity:</strong> {challan.totalQuantity}</p>
        <p><strong>Created:</strong> {new Date(challan.createdAt).toLocaleString()}</p>
      </div>

      <div className="card">
        <h3>Line Items</h3>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Unit Price (at time of sale)</th>
              <th>Qty</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {challan.items.map((item) => (
              <tr key={item.id}>
                <td>{item.productNameSnapshot}</td>
                <td>{item.productSkuSnapshot}</td>
                <td>₹{Number(item.unitPriceSnapshot).toFixed(2)}</td>
                <td>{item.quantity}</td>
                <td>₹{(Number(item.unitPriceSnapshot) * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
