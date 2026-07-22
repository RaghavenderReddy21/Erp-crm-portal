import { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { Customer, Product } from "../types";
import Layout from "../components/Layout";

interface LineItem {
  productId: string;
  quantity: string;
}

export default function ChallanFormPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ productId: "", quantity: "1" }]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/customers", { params: { limit: 100 } }).then((res) => setCustomers(res.data.data));
    api.get("/products", { params: { limit: 100 } }).then((res) => setProducts(res.data.data));
  }, []);

  function updateItem(idx: number, field: keyof LineItem, value: string) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, { productId: "", quantity: "1" }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function productStock(productId: string) {
    return products.find((p) => p.id === productId)?.currentStock;
  }

  async function submit(status: "DRAFT" | "CONFIRMED") {
    setError(null);
    if (!customerId) {
      setError("Please select a customer");
      return;
    }
    const validItems = items.filter((i) => i.productId && Number(i.quantity) > 0);
    if (validItems.length === 0) {
      setError("Please add at least one product with a quantity");
      return;
    }

    setSaving(true);
    try {
      const res = await api.post("/challans", {
        customerId,
        status,
        items: validItems.map((i) => ({ productId: i.productId, quantity: Number(i.quantity) })),
      });
      navigate(`/challans/${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save challan");
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
  }

  return (
    <Layout>
      <div className="page-header">
        <h2>New Sales Challan</h2>
      </div>
      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Customer *</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
              <option value="">Select a customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.businessName ? `(${c.businessName})` : ""}
                </option>
              ))}
            </select>
          </div>

          <h3 style={{ marginTop: 24 }}>Products</h3>
          {items.map((item, idx) => (
            <div className="form-row" key={idx} style={{ alignItems: "flex-end" }}>
              <div className="form-group" style={{ flex: 2 }}>
                <label>Product</label>
                <select
                  value={item.productId}
                  onChange={(e) => updateItem(idx, "productId", e.target.value)}
                >
                  <option value="">Select a product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — stock: {p.currentStock}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>
                  Quantity{" "}
                  {item.productId && (
                    <span style={{ color: "#6b7280", fontWeight: 400 }}>
                      (avail: {productStock(item.productId)})
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                />
              </div>
              <div className="form-group" style={{ flex: "0 0 auto" }}>
                <button type="button" className="btn btn-sm" onClick={() => removeItem(idx)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-sm" onClick={addItem} style={{ marginBottom: 20 }}>
            + Add Product
          </button>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              className="btn"
              disabled={saving}
              onClick={() => submit("DRAFT")}
            >
              Save as Draft
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={saving}
              onClick={() => submit("CONFIRMED")}
            >
              Confirm & Deduct Stock
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
