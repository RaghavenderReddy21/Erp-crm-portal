import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import Layout from "../components/Layout";

export default function ProductFormPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "",
    unitPrice: "",
    currentStock: "0",
    minStockAlert: "0",
    location: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await api.post("/products", {
        name: form.name,
        sku: form.sku,
        category: form.category || undefined,
        unitPrice: Number(form.unitPrice),
        currentStock: Number(form.currentStock),
        minStockAlert: Number(form.minStockAlert),
        location: form.location || undefined,
      });
      navigate(`/products/${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <h2>Add Product</h2>
      </div>
      {error && <div className="error-banner">{error}</div>}
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Product Name *</label>
              <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
            </div>
            <div className="form-group">
              <label>SKU / Code *</label>
              <input value={form.sku} onChange={(e) => update("sku", e.target.value)} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <input value={form.category} onChange={(e) => update("category", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Unit Price *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.unitPrice}
                onChange={(e) => update("unitPrice", e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Opening Stock</label>
              <input
                type="number"
                min="0"
                value={form.currentStock}
                onChange={(e) => update("currentStock", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Minimum Stock Alert Qty</label>
              <input
                type="number"
                min="0"
                value={form.minStockAlert}
                onChange={(e) => update("minStockAlert", e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Location / Warehouse</label>
            <input value={form.location} onChange={(e) => update("location", e.target.value)} />
          </div>
          <button className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save Product"}
          </button>
        </form>
      </div>
    </Layout>
  );
}
