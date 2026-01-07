import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api"; // (පහල 2) බලන්න

export default function SupermarketDashboard() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/products"); // ✅ supplier add කරපු active products
        setProducts(res.data || []);
      } catch (err) {
        console.error(err);
        alert("Products load failed");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return products;

    return products.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const category = (p.category || "").toLowerCase();
      const supplier = (p.supplier?.name || "").toLowerCase();
      return name.includes(s) || category.includes(s) || supplier.includes(s);
    });
  }, [products, q]);

  if (loading) return <div style={{ padding: 20 }}>Loading products...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Supermarket Dashboard</h2>
      <p>Supplier add කරපු products list එක මෙතන පෙන්නනවා.</p>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by product / category / supplier..."
        style={{ padding: 10, width: "100%", maxWidth: 520, margin: "12px 0" }}
      />

      {filtered.length === 0 ? (
        <div>No products found.</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
          {filtered.map((p) => (
            <div
              key={p._id}
              style={{
                border: "1px solid #333",
                borderRadius: 10,
                padding: 12,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 16 }}>{p.name}</div>
              <div>Supplier: {p.supplier?.name || "-"}</div>
              <div>Category: {p.category || "-"}</div>
              <div>Price: Rs. {p.price}</div>
              <div>Stock: {p.stock}</div>

              {p.image ? (
                <img
                  src={`http://localhost:5000${p.image}`}
                  alt={p.name}
                  style={{
                    width: "100%",
                    height: 140,
                    objectFit: "cover",
                    marginTop: 10,
                    borderRadius: 8,
                  }}
                />
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
