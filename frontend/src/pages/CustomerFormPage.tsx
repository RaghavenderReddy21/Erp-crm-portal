import { useEffect, useState, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import Layout from "../components/Layout";

const emptyForm = {
  name: "",
  mobile: "",
  email: "",
  businessName: "",
  gstNumber: "",
  customerType: "RETAIL",
  address: "",
  status: "LEAD",
  followUpDate: "",
  notes: "",
};

export default function CustomerFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/customers/${id}`).then((res) => {
      const c = res.data;
      setForm({
        name: c.name || "",
        mobile: c.mobile || "",
        email: c.email || "",
        businessName: c.businessName || "",
        gstNumber: c.gstNumber || "",
        customerType: c.customerType,
        address: c.address || "",
        status: c.status,
        followUpDate: c.followUpDate ? c.followUpDate.slice(0, 10) : "",
        notes: c.notes || "",
      });
    });
  }, [id, isEdit]);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        ...form,
        email: form.email || undefined,
        followUpDate: form.followUpDate ? new Date(form.followUpDate).toISOString() : undefined,
      };
      if (isEdit) {
        await api.put(`/customers/${id}`, payload);
        navigate(`/customers/${id}`);
      } else {
        const res = await api.post("/customers", payload);
        navigate(`/customers/${res.data.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save customer");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <h2>{isEdit ? "Edit Customer" : "Add Customer"}</h2>
      </div>
      {error && <div className="error-banner">{error}</div>}
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Name *</label>
              <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Mobile *</label>
              <input value={form.mobile} onChange={(e) => update("mobile", e.target.value)} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Business Name</label>
              <input
                value={form.businessName}
                onChange={(e) => update("businessName", e.target.value)}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>GST Number</label>
              <input value={form.gstNumber} onChange={(e) => update("gstNumber", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Customer Type *</label>
              <select value={form.customerType} onChange={(e) => update("customerType", e.target.value)}>
                <option value="RETAIL">Retail</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="DISTRIBUTOR">Distributor</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={(e) => update("status", e.target.value)}>
                <option value="LEAD">Lead</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="form-group">
              <label>Follow-up Date</label>
              <input
                type="date"
                value={form.followUpDate}
                onChange={(e) => update("followUpDate", e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Address</label>
            <textarea rows={2} value={form.address} onChange={(e) => update("address", e.target.value)} />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
          </div>
          <button className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save Customer"}
          </button>
        </form>
      </div>
    </Layout>
  );
}
