import { useEffect, useState, FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { Customer } from "../types";
import Layout from "../components/Layout";

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [note, setNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await api.get(`/customers/${id}`);
    setCustomer(res.data);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleAddNote(e: FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setError(null);
    setSaving(true);
    try {
      await api.post(`/customers/${id}/follow-ups`, {
        note,
        followUpDate: followUpDate ? new Date(followUpDate).toISOString() : undefined,
      });
      setNote("");
      setFollowUpDate("");
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to add note");
    } finally {
      setSaving(false);
    }
  }

  if (!customer) return <Layout><p>Loading...</p></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <h2>{customer.name}</h2>
        <Link to={`/customers/${customer.id}/edit`} className="btn">
          Edit
        </Link>
      </div>

      <div className="card">
        <p><strong>Mobile:</strong> {customer.mobile}</p>
        <p><strong>Email:</strong> {customer.email || "—"}</p>
        <p><strong>Business:</strong> {customer.businessName || "—"}</p>
        <p><strong>GST:</strong> {customer.gstNumber || "—"}</p>
        <p><strong>Type:</strong> {customer.customerType}</p>
        <p><strong>Status:</strong> {customer.status}</p>
        <p><strong>Address:</strong> {customer.address || "—"}</p>
        <p><strong>Notes:</strong> {customer.notes || "—"}</p>
      </div>

      <div className="card">
        <h3>Follow-up Notes</h3>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleAddNote} style={{ marginBottom: 16 }}>
          <div className="form-group">
            <label>New note</label>
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Next follow-up date (optional)</label>
              <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
            </div>
          </div>
          <button className="btn btn-primary btn-sm" disabled={saving}>
            {saving ? "Saving..." : "Add Note"}
          </button>
        </form>

        {customer.followUps && customer.followUps.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Note</th>
                <th>Next Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {customer.followUps.map((f) => (
                <tr key={f.id}>
                  <td>{new Date(f.createdAt).toLocaleString()}</td>
                  <td>{f.note}</td>
                  <td>{f.followUpDate ? new Date(f.followUpDate).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty-state">No follow-up notes yet.</p>
        )}
      </div>

      <div className="card">
        <h3>Challan History</h3>
        {customer.challans && customer.challans.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Challan #</th>
                <th>Status</th>
                <th>Total Qty</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {customer.challans.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/challans/${c.id}`}>{c.challanNumber}</Link>
                  </td>
                  <td>{c.status}</td>
                  <td>{c.totalQuantity}</td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty-state">No challans yet.</p>
        )}
      </div>
    </Layout>
  );
}
