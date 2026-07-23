import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import Layout from "../components/Layout";

interface Stats {
  customers: number | null;
  products: number | null;
  lowStock: number | null;
  challans: number | null;
  draftChallans: number | null;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    customers: null,
    products: null,
    lowStock: null,
    challans: null,
    draftChallans: null,
  });

  useEffect(() => {
    let active = true;

    Promise.all([
      api.get("/customers", { params: { limit: 1 } }),
      api.get("/products", { params: { limit: 1 } }),
      api.get("/products", { params: { limit: 1, lowStock: true } }),
      api.get("/challans", { params: { limit: 1 } }),
      api.get("/challans", { params: { limit: 1, status: "DRAFT" } }),
    ])
      .then(([customersRes, productsRes, lowStockRes, challansRes, draftRes]) => {
        if (!active) return;
        setStats({
          customers: customersRes.data.pagination.total,
          products: productsRes.data.pagination.total,
          lowStock: lowStockRes.data.pagination.total,
          challans: challansRes.data.pagination.total,
          draftChallans: draftRes.data.pagination.total,
        });
      })
      .catch(() => {
        // Dashboard stats are a nice-to-have; if they fail to load, the
        // cards below just show placeholders instead of blocking the page.
      });

    return () => {
      active = false;
    };
  }, []);

  const modules = [
    {
      key: "customers",
      title: "Customer CRM",
      description: "Manage leads and active accounts, track follow-ups.",
      stat: stats.customers,
      statLabel: "total customers",
      path: "/customers",
      accent: "#12182b",
    },
    {
      key: "products",
      title: "Products & inventory",
      description: "Track stock levels and every IN/OUT movement.",
      stat: stats.products,
      statLabel: "products tracked",
      subStat: stats.lowStock,
      subStatLabel: "at or below minimum stock",
      path: "/products",
      accent: "#c9a227",
      danger: (stats.lowStock ?? 0) > 0,
    },
    {
      key: "challans",
      title: "Sales challans",
      description: "Dispatch orders, confirm stock deduction, track status.",
      stat: stats.challans,
      statLabel: "total challans",
      subStat: stats.draftChallans,
      subStatLabel: "awaiting confirmation",
      path: "/challans",
      accent: "#a8402a",
    },
  ];

  return (
    <Layout>
      <div className="page-header">
        <h2>Dashboard</h2>
      </div>

      <div className="dash-grid">
        {modules.map((m) => (
          <button key={m.key} className="dash-card" onClick={() => navigate(m.path)}>
            <div className="dash-card-top" style={{ borderColor: m.accent }}>
              <span className="dash-card-title">{m.title}</span>
              <span className="dash-card-arrow" style={{ color: m.accent }}>→</span>
            </div>
            <p className="dash-card-desc">{m.description}</p>

            <div className="dash-card-stats">
              <div className="dash-stat-main">
                <span className="dash-stat-number" style={{ color: m.accent }}>
                  {m.stat === null ? "—" : m.stat}
                </span>
                <span className="dash-stat-label">{m.statLabel}</span>
              </div>

              {m.subStat !== undefined && (
                <div className={`dash-stat-sub ${m.danger ? "dash-stat-warn" : ""}`}>
                  <span className="dash-stat-sub-number">{m.subStat === null ? "—" : m.subStat}</span>
                  <span className="dash-stat-sub-label">{m.subStatLabel}</span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="card dash-welcome">
        <h3>Quick start</h3>
        <p>
          Add a customer, add a product with opening stock, then create a sales challan to see
          the full flow — including automatic stock deduction and the negative-stock guard.
        </p>
      </div>
    </Layout>
  );
}