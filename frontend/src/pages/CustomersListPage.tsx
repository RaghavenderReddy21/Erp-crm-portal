import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Customer, Paginated } from "../types";
import Layout from "../components/Layout";

const statusClass: Record<string, string> = {
  LEAD: "badge-lead",
  ACTIVE: "badge-active",
  INACTIVE: "badge-inactive",
};

export default function CustomersListPage() {
  const [result, setResult] = useState<Paginated<Customer> | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get("/customers", { params: { search: search || undefined, page, limit: 10 } })
      .then((res) => {
        if (active) setResult(res.data);
      })
      .catch((err) => setError(err.response?.data?.error || "Failed to load customers"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [search, page]);

  return (
    <Layout>
      <div className="page-header">
        <h2>Customers</h2>
        <Link to="/customers/new" className="btn btn-primary">
          + Add Customer
        </Link>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="search-bar">
        <input
          placeholder="Search by name, mobile, business, or email..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
      </div>

      <div className="card">
        {loading ? (
          <p>Loading...</p>
        ) : !result || result.data.length === 0 ? (
          <div className="empty-state">No customers found.</div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Business</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/customers/${c.id}`}>{c.name}</Link>
                    </td>
                    <td>{c.mobile}</td>
                    <td>{c.businessName || "—"}</td>
                    <td>{c.customerType}</td>
                    <td>
                      <span className={`badge ${statusClass[c.status]}`}>{c.status}</span>
                    </td>
                    <td>{c.followUpDate ? new Date(c.followUpDate).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pagination">
              <button
                className="btn btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span>
                Page {result.pagination.page} of {result.pagination.totalPages || 1} (
                {result.pagination.total} total)
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
