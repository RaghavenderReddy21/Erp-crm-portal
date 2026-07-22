import { useEffect, useState, FormEvent } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { Product } from "../types";
import Layout from "../components/Layout";

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState("");
  const [movementType, setMovementType] = useState<"IN" | "OUT">("IN");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await api.get(`/products/${id}`);
    setProduct(res.data);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleAddMovement(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.post(`/products/${id}/stock-movements`, {
        quantity: Number(quantity),
        movementType,
        reason,
      });
      setQuantity("");
      setReason("");
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to record stock movement");
    } finally {
      setSaving(false);
    }
  }

  if (!product) return <Layout><p>Loading...</p></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <h2>{product.name}</h2>
      </div>

      <div className="card">
        <p><strong>SKU:</strong> {product.sku}</p>
        <p><strong>Category:</strong> {product.category || "—"}</p>
        <p><strong>Unit Price:</strong> ₹{Number(product.unitPrice).toFixed(2)}</p>
        <p><strong>Current Stock:</strong> {product.currentStock}</p>
        <p><strong>Minimum Alert Qty:</strong> {product.minStockAlert}</p>
        <p><strong>Location:</strong> {product.location || "—"}</p>
        {product.currentStock <= product.minStockAlert && (
          <div className="error-banner">Stock is at or below the minimum alert quantity.</div>
        )}
      </div>

      <div className="card">
        <h3>Record Stock Movement</h3>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleAddMovement}>
          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select value={movementType} onChange={(e) => setMovementType(e.target.value as "IN" | "OUT")}>
                <option value="IN">IN (stock received)</option>
                <option value="OUT">OUT (stock removed)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Reason</label>
            <input value={reason} onChange={(e) => setReason(e.target.value)} required />
          </div>
          <button className="btn btn-primary btn-sm" disabled={saving}>
            {saving ? "Saving..." : "Record Movement"}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Movement History</h3>
        {product.stockMovements && product.stockMovements.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {product.stockMovements.map((m) => (
                <tr key={m.id}>
                  <td>{new Date(m.createdAt).toLocaleString()}</td>
                  <td>{m.movementType}</td>
                  <td>{m.quantity}</td>
                  <td>{m.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty-state">No stock movements yet.</p>
        )}
      </div>
    </Layout>
  );
}
