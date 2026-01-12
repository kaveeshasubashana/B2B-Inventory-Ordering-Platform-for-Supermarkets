import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";

export default function SupermarketDashboard() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const [me, setMe] = useState(null);
  const [meLoading, setMeLoading] = useState(true);

  // ✅ UI controls
  const [stockFilter, setStockFilter] = useState("all"); // all | in | low | out
  const [sortBy, setSortBy] = useState("newest"); // newest | priceAsc | priceDesc | name

  // ✅ CART
  const [cart, setCart] = useState([]); // [{ product, qty }]
  const [qtyByProduct, setQtyByProduct] = useState({}); // { [id]: qty }

  // ✅ CHECKOUT
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [placing, setPlacing] = useState(false);

  // --------- LOAD DATA ----------
  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);
        setMeLoading(true);

        const [meRes, prodRes] = await Promise.all([
          api.get("/api/auth/me"),
          api.get("/api/products"), // if you have district endpoint: "/api/supermarkets/products"
        ]);

        setMe(meRes.data);
        const list = prodRes.data || [];
        setProducts(list);

        // default qty = 1
        setQtyByProduct((prev) => {
          const next = { ...prev };
          for (const p of list) {
            if (p?._id && next[p._id] == null) next[p._id] = 1;
          }
          return next;
        });
      } catch (err) {
        console.error(err);
        alert(err?.response?.data?.message || "Dashboard load failed");
      } finally {
        setLoading(false);
        setMeLoading(false);
      }
    };

    loadAll();
  }, []);

  const fmtLKR = (n) =>
    new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 0,
    }).format(Number(n || 0));

  const stockBadge = (stock) => {
    const s = Number(stock || 0);
    if (s <= 0) return { text: "Out of stock", bg: "#3b0d0d", bd: "#7f1d1d" };
    if (s <= 10) return { text: "Low stock", bg: "#3b2a0d", bd: "#a16207" };
    return { text: "In stock", bg: "#0f2f1f", bd: "#15803d" };
  };

  // --------- HELPERS ----------
  const getSupplierId = (p) =>
    p?.supplier_id || p?.supplierId || p?.supplier?._id || p?.supplier || null;

  const cartSupplierId = useMemo(() => {
    if (cart.length === 0) return null;
    return getSupplierId(cart[0].product);
  }, [cart]);

  const cartCount = useMemo(
    () => cart.reduce((sum, x) => sum + Number(x.qty || 0), 0),
    [cart]
  );

  const cartTotal = useMemo(
    () =>
      cart.reduce(
        (sum, x) =>
          sum + Number(x.product?.price || 0) * Number(x.qty || 0),
        0
      ),
    [cart]
  );

  // ✅ Stats
  const stats = useMemo(() => {
    const total = products.length;
    const out = products.filter((p) => Number(p.stock || 0) <= 0).length;
    const low = products.filter((p) => {
      const s = Number(p.stock || 0);
      return s > 0 && s <= 10;
    }).length;
    const instock = products.filter((p) => Number(p.stock || 0) > 10).length;

    return { total, instock, low, out };
  }, [products]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = [...products];

    // search
    if (s) {
      list = list.filter((p) => {
        const name = (p.name || "").toLowerCase();
        const category = (p.category || "").toLowerCase();
        const supplier = (p.supplier?.name || "").toLowerCase();
        return name.includes(s) || category.includes(s) || supplier.includes(s);
      });
    }

    // stock filter
    if (stockFilter === "out") {
      list = list.filter((p) => Number(p.stock || 0) <= 0);
    } else if (stockFilter === "low") {
      list = list.filter((p) => {
        const st = Number(p.stock || 0);
        return st > 0 && st <= 10;
      });
    } else if (stockFilter === "in") {
      list = list.filter((p) => Number(p.stock || 0) > 10);
    }

    // sort
    if (sortBy === "priceAsc") {
      list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortBy === "priceDesc") {
      list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sortBy === "name") {
      list.sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""))
      );
    } else {
      // newest
      list.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
    }

    return list;
  }, [products, q, stockFilter, sortBy]);

  // --------- QTY per product (card) ----------
  const setProductQty = (id, qty) => {
    const n = Number(qty);
    const safe = Number.isFinite(n) ? Math.max(1, Math.min(999, n)) : 1;
    setQtyByProduct((prev) => ({ ...prev, [id]: safe }));
  };
  const incProductQty = (id) =>
    setQtyByProduct((prev) => ({
      ...prev,
      [id]: Math.min(999, Number(prev[id] || 1) + 1),
    }));
  const decProductQty = (id) =>
    setQtyByProduct((prev) => ({
      ...prev,
      [id]: Math.max(1, Number(prev[id] || 1) - 1),
    }));

  // --------- CART actions ----------
  const addToCart = (product) => {
    const stock = Number(product.stock || 0);
    if (stock <= 0) return alert("Out of stock!");

    const supplierId = getSupplierId(product);
    if (!supplierId) return alert("This product has no supplier_id field.");

    // one supplier per cart (optional but safe)
    if (cartSupplierId && String(supplierId) !== String(cartSupplierId)) {
      return alert("Cart can contain products from ONE supplier only. Clear cart to switch.");
    }

    const addQty = Number(qtyByProduct[product._id] || 1);

    setCart((prev) => {
      const idx = prev.findIndex((x) => x.product?._id === product._id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: Math.min(999, copy[idx].qty + addQty) };
        return copy;
      }
      return [...prev, { product, qty: addQty }];
    });
  };

  const updateCartQty = (productId, qty) => {
    const n = Number(qty);
    if (!Number.isFinite(n)) return;
    setCart((prev) =>
      prev
        .map((x) =>
          x.product?._id === productId ? { ...x, qty: Math.max(0, n) } : x
        )
        .filter((x) => x.qty > 0)
    );
  };

  const clearCart = () => {
    setCart([]);
    setCheckoutOpen(false);
    setDeliveryAddress("");
    setOrderNote("");
  };

  // --------- PLACE ORDER ----------
const placeOrder = async () => {
  if (cart.length === 0) return alert("Cart is empty");

  const supplierId = cartSupplierId;
  if (!supplierId) return alert("Supplier missing in cart");

  if (!deliveryAddress.trim()) {
    return alert("Please enter delivery address");
  }

  // ✅ token force attach (sometimes interceptor not working)
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  const itemsNormalized = cart.map((x) => ({
    product: x.product._id,
    qty: x.qty,
    quantity: x.qty,        // ✅ some backends expect "quantity"
    price: x.product.price,
    name: x.product.name,
  }));

  // ✅ send multiple key variants so backend mismatch won't break
  const payload = {
    supplier: supplierId,
    supplier_id: supplierId,
    supermarket: me?._id,
    supermarket_id: me?._id,

    items: itemsNormalized,
    orderItems: itemsNormalized, // ✅ some backends expect "orderItems"

    totalAmount: cartTotal,
    total_amount: cartTotal,
    total: cartTotal,

    deliveryAddress,
    delivery_address: deliveryAddress,

    note: orderNote,
    orderNote: orderNote,
  };

  try {
    setPlacing(true);

    const res = await api.post("/api/orders", payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    alert("✅ Order placed successfully!");
    clearCart();
    setCheckoutOpen(false);

    console.log("ORDER RES:", res.data);
  } catch (err) {
    console.error("ORDER ERR:", err);
    console.log("STATUS:", err?.response?.status);
    console.log("DATA:", err?.response?.data);
    alert(err?.response?.data?.message || "Order failed (check console/network)");
  } finally {
    setPlacing(false);
  }
};


  // --------- UI ----------
  if (loading) {
    return (
      <div style={styles.page}>
        <Header
          q={q}
          setQ={setQ}
          count={0}
          me={me}
          meLoading={meLoading}
          cartCount={0}
          onCart={() => {}}
        />
        <div style={styles.grid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={styles.skeletonCard} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <Header
        q={q}
        setQ={setQ}
        count={filtered.length}
        me={me}
        meLoading={meLoading}
        cartCount={cartCount}
        onCart={() => setCheckoutOpen(true)}
      />

      {/* ✅ Quick stats + controls */}
      <div style={styles.topBar}>
        <div style={styles.statsRow}>
          <StatChip label="Total" value={stats.total} />
          <StatChip label="In Stock" value={stats.instock} />
          <StatChip label="Low" value={stats.low} />
          <StatChip label="Out" value={stats.out} />
        </div>

        <div style={styles.controls}>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            style={styles.select}
          >
            <option value="all">All stock</option>
            <option value="in">In stock</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={styles.select}
          >
            <option value="newest">Sort: Newest</option>
            <option value="priceAsc">Sort: Price ↑</option>
            <option value="priceDesc">Sort: Price ↓</option>
            <option value="name">Sort: Name A→Z</option>
          </select>

          <button
            style={styles.resetBtn}
            onClick={() => {
              setQ("");
              setStockFilter("all");
              setSortBy("newest");
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={styles.emptyWrap}>
          <div style={styles.emptyIcon}>🛒</div>
          <div style={styles.emptyTitle}>No products found</div>
          <div style={styles.emptyText}>Try a different keyword or reset filters.</div>
        </div>
      ) : (
        <div style={styles.grid}>
          {filtered.map((p) => {
            const badge = stockBadge(p.stock);
            const selectedQty = Number(qtyByProduct[p._id] || 1);
            const out = Number(p.stock || 0) <= 0;

            return (
              <div key={p._id} style={styles.card}>
                <div style={styles.imgWrap}>
                  {p.image ? (
                    <img
                      src={`http://localhost:5000${p.image}`}
                      alt={p.name}
                      style={styles.img}
                    />
                  ) : (
                    <div style={styles.noImg}>No Image</div>
                  )}

                  <div
                    style={{
                      ...styles.badge,
                      background: badge.bg,
                      borderColor: badge.bd,
                    }}
                  >
                    {badge.text}
                  </div>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.topRow}>
                    <div style={styles.title} title={p.name}>
                      {p.name}
                    </div>
                    <div style={styles.price}>{fmtLKR(p.price)}</div>
                  </div>

                  <div style={styles.meta}>
                    <div style={styles.metaRow}>
                      <span style={styles.metaLabel}>Supplier</span>
                      <span style={styles.metaValue}>{p.supplier?.name || "-"}</span>
                    </div>
                    <div style={styles.metaRow}>
                      <span style={styles.metaLabel}>Category</span>
                      <span style={styles.metaValue}>{p.category || "-"}</span>
                    </div>
                    <div style={styles.metaRow}>
                      <span style={styles.metaLabel}>Stock</span>
                      <span style={styles.metaValue}>{p.stock}</span>
                    </div>
                  </div>

                  {/* ✅ Qty + Add to cart */}
                  <div style={styles.cartRow}>
                    <div style={styles.qtyWrap}>
                      <button
                        style={styles.qtyBtn}
                        onClick={() => decProductQty(p._id)}
                        disabled={out}
                      >
                        −
                      </button>
                      <input
                        style={styles.qtyInput}
                        type="number"
                        min={1}
                        value={selectedQty}
                        onChange={(e) => setProductQty(p._id, e.target.value)}
                        disabled={out}
                      />
                      <button
                        style={styles.qtyBtn}
                        onClick={() => incProductQty(p._id)}
                        disabled={out}
                      >
                        +
                      </button>
                    </div>

                    <button
                      style={{
                        ...styles.addBtn,
                        opacity: out ? 0.6 : 1,
                        cursor: out ? "not-allowed" : "pointer",
                      }}
                      disabled={out}
                      onClick={() => addToCart(p)}
                    >
                      Add
                    </button>
                  </div>

                  <div style={styles.footerRow}>
                    <div style={styles.smallNote}>
                      Updated:{" "}
                      {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : "-"}
                    </div>
                    <button
                      style={styles.viewBtn}
                      onClick={() => alert(`Selected: ${p.name}`)}
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ✅ CHECKOUT MODAL */}
      {checkoutOpen && (
        <div style={styles.modalOverlay} onClick={() => setCheckoutOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHead}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 16 }}>Checkout</div>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>
                  Items: <b>{cartCount}</b> • Total: <b>{fmtLKR(cartTotal)}</b>
                </div>
              </div>
              <button style={styles.modalClose} onClick={() => setCheckoutOpen(false)}>
                ✕
              </button>
            </div>

            {cart.length === 0 ? (
              <div style={{ color: "#94a3b8", padding: 12 }}>
                Cart is empty.
              </div>
            ) : (
              <>
                <div style={styles.cartTable}>
                  {cart.map((x) => (
                    <div key={x.product._id} style={styles.cartItemRow}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800 }}>{x.product.name}</div>
                        <div style={{ color: "#94a3b8", fontSize: 12 }}>
                          {fmtLKR(x.product.price)} each
                        </div>
                      </div>

                      <input
                        style={styles.cartQty}
                        type="number"
                        min={1}
                        value={x.qty}
                        onChange={(e) => updateCartQty(x.product._id, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Delivery Address</label>
                  <textarea
                    style={styles.textarea}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter delivery address..."
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Note (optional)</label>
                  <input
                    style={styles.input}
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="Any note..."
                  />
                </div>

                <div style={styles.modalFoot}>
                  <button style={styles.resetBtn} onClick={clearCart} disabled={placing}>
                    Clear Cart
                  </button>
                  <button
                    style={{ ...styles.addBtn, padding: "10px 14px" }}
                    onClick={placeOrder}
                    disabled={placing}
                  >
                    {placing ? "Placing..." : "Place Order"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Header({ q, setQ, count, me, meLoading, cartCount, onCart }) {
  return (
    <div style={styles.header}>
      {/* Left */}
      <div>
        <div style={styles.hTitle}>Supermarket Dashboard</div>
        <div style={styles.hSub}>
          Showing <b>{count}</b> supplier products
        </div>
      </div>

      {/* Middle search */}
      <div style={styles.searchWrap}>
        <span style={styles.searchIcon}>🔍</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search product / category / supplier..."
          style={styles.search}
        />
      </div>

      {/* Right profile + cart */}
      <div style={styles.profileMini}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {meLoading ? (
            <div style={{ color: "#94a3b8", fontSize: 13 }}>Loading...</div>
          ) : me ? (
            <div>
              <div style={styles.profileMiniName}>{me.name}</div>
              <div style={styles.profileMiniEmail}>{me.email}</div>
            </div>
          ) : (
            <div style={{ color: "#94a3b8", fontSize: 13 }}>No profile</div>
          )}
        </div>

        <button style={styles.cartBtn} onClick={onCart}>
          🧺 Cart <b>({cartCount})</b>
        </button>
      </div>
    </div>
  );
}

function StatChip({ label, value }) {
  return (
    <div style={styles.statChip}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

const styles = {
  page: {
    padding: 20,
    minHeight: "100vh",
    background:
      "radial-gradient(1200px 600px at 20% 0%, rgba(99,102,241,0.18), transparent 55%), radial-gradient(1000px 500px at 90% 10%, rgba(34,197,94,0.14), transparent 55%), #0b1220",
    color: "#e5e7eb",
  },

  header: {
    display: "grid",
    gridTemplateColumns: "1fr minmax(260px, 520px) auto",
    gap: 12,
    alignItems: "end",
    marginBottom: 14,
  },

  hTitle: { fontSize: 22, fontWeight: 800, letterSpacing: 0.2 },
  hSub: { fontSize: 13, color: "#94a3b8", marginTop: 6 },

  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 12,
    padding: "10px 12px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  },
  searchIcon: { opacity: 0.8 },
  search: {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#e5e7eb",
    fontSize: 14,
  },

  profileMini: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
    minWidth: 280,
  },
  profileMiniName: { fontSize: 14, fontWeight: 900, lineHeight: 1.2 },
  profileMiniEmail: { fontSize: 12, color: "#94a3b8", marginTop: 3 },

  cartBtn: {
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.08)",
    color: "#e5e7eb",
    padding: "8px 12px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 14,
  },
  statsRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  statChip: {
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: "10px 12px",
    minWidth: 110,
    boxShadow: "0 10px 30px rgba(0,0,0,0.20)",
  },
  statLabel: { fontSize: 12, color: "#94a3b8" },
  statValue: { fontSize: 18, fontWeight: 900, marginTop: 4 },

  controls: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
  select: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    color: "#e5e7eb",
    outline: "none",
  },
  resetBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.08)",
    color: "#e5e7eb",
    cursor: "pointer",
    fontWeight: 800,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 14,
  },

  card: {
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    boxShadow: "0 12px 40px rgba(0,0,0,0.30)",
  },

  imgWrap: { position: "relative", height: 160, background: "rgba(255,255,255,0.06)" },
  img: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  noImg: { height: "100%", display: "grid", placeItems: "center", color: "#94a3b8", fontSize: 13 },
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid",
    color: "#e5e7eb",
    backdropFilter: "blur(8px)",
  },

  cardBody: { padding: 12 },
  topRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
  title: {
    fontWeight: 800,
    fontSize: 16,
    lineHeight: 1.2,
    maxWidth: 180,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  price: { fontWeight: 800, fontSize: 14, color: "#a7f3d0" },

  meta: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    background: "rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  metaRow: { display: "flex", justifyContent: "space-between", gap: 10, padding: "6px 0" },
  metaLabel: { fontSize: 12, color: "#94a3b8" },
  metaValue: { fontSize: 13, color: "#e5e7eb", fontWeight: 600 },

  cartRow: { marginTop: 10, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" },
  qtyWrap: { display: "flex", alignItems: "center", gap: 6 },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.08)",
    color: "#e5e7eb",
    cursor: "pointer",
    fontWeight: 900,
  },
  qtyInput: {
    width: 64,
    height: 34,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.18)",
    color: "#e5e7eb",
    outline: "none",
    textAlign: "center",
    fontWeight: 800,
  },

  addBtn: {
    border: "1px solid rgba(34,197,94,0.35)",
    background: "rgba(34,197,94,0.14)",
    color: "#e5e7eb",
    padding: "8px 12px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  footerRow: { marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  smallNote: { fontSize: 12, color: "#94a3b8" },
  viewBtn: {
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.08)",
    color: "#e5e7eb",
    padding: "8px 12px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 700,
  },

  skeletonCard: {
    height: 290,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background:
      "linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.09), rgba(255,255,255,0.04))",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.2s infinite",
  },

  emptyWrap: {
    marginTop: 28,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    padding: 22,
    textAlign: "center",
  },
  emptyIcon: { fontSize: 34, marginBottom: 10 },
  emptyTitle: { fontSize: 18, fontWeight: 800 },
  emptyText: { marginTop: 6, color: "#94a3b8", fontSize: 13 },

  // ✅ MODAL
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "grid",
    placeItems: "center",
    zIndex: 50,
    padding: 16,
  },
  modal: {
    width: "min(560px, 100%)",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#0b1220",
    boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
    overflow: "hidden",
  },
  modalHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  modalClose: {
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.08)",
    color: "#e5e7eb",
    borderRadius: 10,
    padding: "6px 10px",
    cursor: "pointer",
    fontWeight: 900,
  },
  cartTable: { padding: 14, display: "flex", flexDirection: "column", gap: 10 },
  cartItemRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    padding: 10,
    borderRadius: 12,
  },
  cartQty: {
    width: 70,
    height: 34,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.18)",
    color: "#e5e7eb",
    outline: "none",
    textAlign: "center",
    fontWeight: 900,
  },
  formGroup: { padding: "0 14px 14px" },
  label: { display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 6 },
  textarea: {
    width: "100%",
    minHeight: 70,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#e5e7eb",
    outline: "none",
    padding: 10,
  },
  input: {
    width: "100%",
    height: 40,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#e5e7eb",
    outline: "none",
    padding: "0 10px",
  },
  modalFoot: {
    padding: 14,
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
};
