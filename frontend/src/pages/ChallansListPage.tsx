import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Challan, Paginated } from "../types";
import Layout from "../components/Layout";

const statusClass: Record<string, string> = {
  DRAFT: "badge-draft",
  CONFIRMED: "badge-confirmed",
  CANCELLED: "badge-cancelled",
};

export default function ChallansListPage() {
  const [result, setResult] = useState<Paginated<Challan> | null>(null);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get("/challans", { params: { status: status || undefined, page, limit: 10 } })
      .then((res) => active && setResult(res.data))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [status, page]);

  return (
    <Layout>
      <div className="page-header">
        <h2>Sales Challans</h2>
        <Link to="/challans/new" className="btn btn-primary">
          + New Challan
        </Link>
      </div>

      <div className="search-bar">
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <p>Loading...</p>
        ) : !result || result.data.length === 0 ? (
          <div className="empty-state">No challans found.</div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Challan #</th>
                  <th>Customer</th>
                  <th>Total Qty</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/challans/${c.id}`}>{c.challanNumber}</Link>
                    </td>
                    <td>{c.customer?.name}</td>
                    <td>{c.totalQuantity}</td>
                    <td>
                      <span className={`badge ${statusClass[c.status]}`}>{c.status}</span>
                    </td>
                    <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pagination">
              <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <span>
                Page {result.pagination.page} of {result.pagination.totalPages || 1}
              </span>
              <button
                className="btn btn-sm"
                disabled={page >= result.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
