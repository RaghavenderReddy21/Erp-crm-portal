import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Product, Paginated } from "../types";
import Layout from "../components/Layout";

export default function ProductsListPage() {
  const [result, setResult] = useState<Paginated<Product> | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get("/products", { params: { search: search || undefined, page, limit: 10 } })
      .then((res) => active && setResult(res.data))
      .catch((err) => setError(err.response?.data?.error || "Failed to load products"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [search, page]);

  return (
    <Layout>
      <div className="page-header">
        <h2>Products & Inventory</h2>
        <Link to="/products/new" className="btn btn-primary">
          + Add Product
        </Link>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="search-bar">
        <input
          placeholder="Search by name, SKU, or category..."
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
          <div className="empty-state">No products found.</div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>Stock</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((p) => {
                  const low = p.currentStock <= p.minStockAlert;
                  return (
                    <tr key={p.id}>
                      <td>
                        <Link to={`/products/${p.id}`}>{p.name}</Link>
                      </td>
                      <td>{p.sku}</td>
                      <td>{p.category || "—"}</td>
                      <td>₹{Number(p.unitPrice).toFixed(2)}</td>
                      <td>
                        {p.currentStock}
                        {low && (
                          <span className="badge badge-cancelled" style={{ marginLeft: 8 }}>
                            LOW STOCK
                          </span>
                        )}
                      </td>
                      <td>{p.location || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="pagination">
              <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
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
