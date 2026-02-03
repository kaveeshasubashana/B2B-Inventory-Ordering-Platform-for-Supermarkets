import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";

export default function SupermarketDashboard() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const [me, setMe] = useState(null);
  const [meLoading, setMeLoading] = useState(true);

  // ✅ UI controls
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // ✅ CART
  const [cart, setCart] = useState([]);
  const [qtyByProduct, setQtyByProduct] = useState({});

  // ✅ CHECKOUT
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [placing, setPlacing] = useState(false);

  // ✅ ADDED ITEM POP-UP STATE
  const [addedItemPopup, setAddedItemPopup] = useState(null);

  const BASE_URL = "http://localhost:5000";

  // --------- LOAD DATA ----------
  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);
        setMeLoading(true);

        const [meRes, prodRes] = await Promise.all([
          api.get("/auth/me"),
          api.get("/products"),
        ]);

        setMe(meRes.data);
        const list = prodRes.data || [];
        setProducts(list);

        setQtyByProduct((prev) => {
          const next = { ...prev };
          for (const p of list) {
            if (p?._id && next[p._id] == null) next[p._id] = 1;
          }
          return next;
        });
      } catch (err) {
        console.error(err);
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
    if (s <= 0) return { text: "Out of stock", bg: "#451a1a", color: "#fca5a5", border: "#7f1d1d" };
    if (s <= 10) return { text: "Low stock", bg: "#422006", color: "#fdba74", border: "#9a3412" };
    return { text: "In stock", bg: "#064e3b", color: "#6ee7b7", border: "#047857" };
  };

  // --------- HELPERS ----------
  const getSupplierId = (p) => p?.supplier?._id || p?.supplier || null;

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

    if (s) {
      list = list.filter((p) => {
        const name = (p.name || "").toLowerCase();
        const category = (p.category || "").toLowerCase();
        const supplier = (p.supplier?.name || "").toLowerCase();
        return name.includes(s) || category.includes(s) || supplier.includes(s);
      });
    }

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

    if (sortBy === "priceAsc") {
      list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortBy === "priceDesc") {
      list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sortBy === "name") {
      list.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    } else {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return list;
  }, [products, q, stockFilter, sortBy]);

  // --------- QTY Logic ----------
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
  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((x) => x.product?._id !== productId));
  };

  const addToCart = (product) => {
    const stock = Number(product.stock || 0);
    if (stock <= 0) return alert("❌ Out of stock!");

    const supplierId = getSupplierId(product);
    if (!supplierId) return alert("Error: Product has no supplier info.");

    if (cartSupplierId && String(supplierId) !== String(cartSupplierId)) {
      if(!window.confirm("Cart contains items from another supplier. Clear cart and add this item?")) {
        return;
      }
      const addQty = Number(qtyByProduct[product._id] || 1);
      setCart([{ product, qty: addQty }]);
      setAddedItemPopup(product);
      return;
    }

    const addQty = Number(qtyByProduct[product._id] || 1);

    setCart((prev) => {
      const idx = prev.findIndex((x) => x.product?._id === product._id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: Math.min(stock, copy[idx].qty + addQty) }; 
        return copy;
      }
      return [...prev, { product, qty: addQty }];
    });

    setAddedItemPopup(product);
  };

  const updateCartQty = (productId, qty, maxStock) => {
    const n = Number(qty);
    if (!Number.isFinite(n)) return;
    const validQty = Math.min(Math.max(0, n), maxStock);
    
    setCart((prev) =>
      prev
        .map((x) =>
          x.product?._id === productId ? { ...x, qty: validQty } : x
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

  // --------- PLACE ORDER (COD Only) ----------
  const placeOrder = async () => {
    if (cart.length === 0) return alert("Cart is empty");
    
    const supplierId = cartSupplierId;
    if (!supplierId) return alert("Supplier missing in cart");

    if (!deliveryAddress.trim()) {
      return alert("Please enter delivery address");
    }

    const itemsPayload = cart.map((x) => ({
      product: x.product._id,
      name: x.product.name,
      quantity: x.qty,
      price: x.product.price
    }));

    const payload = {
      supplierId: supplierId,
      items: itemsPayload,
      totalAmount: cartTotal,
      deliveryAddress: deliveryAddress,
      note: orderNote,
      paymentMethod: "Cash",
    };

    try {
      setPlacing(true);
      await api.post("/orders", payload);
      alert("✅ Order Placed Successfully via Cash on Delivery!");
      clearCart();
    } catch (err) {
      console.error("ORDER ERR:", err);
      alert(err?.response?.data?.message || "Order failed. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  // --------- UI ----------
  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingContainer}>
            <div className="custom-spinner"></div>
            <p style={{marginTop: '10px', color: '#94a3b8'}}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* 🔴 INJECTED CSS FOR IMPROVED BACKGROUND ANIMATION */}
      <style>{`
        /* --- B2B Tech Grid Overlay --- */
        .bg-grid {
            position: absolute;
            inset: 0;
            background-image: linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
            background-size: 35px 35px;
            z-index: 1;
            pointer-events: none;
        }

        /* --- Advanced Floating Orbs --- */
        .bg-blob {
            position: absolute;
            border-radius: 50%;
            filter: blur(100px); /* Increased blur for softer blend */
            z-index: 0;
            will-change: transform;
        }
        
        /* Each orb has unique movement and duration for a non-repetitive organic feel */
        .blob-1 { 
            width: 450px; height: 450px; 
            background: rgba(59, 130, 246, 0.35); /* Blue */
            top: -10%; left: -10%; 
            animation: moveBlob1 25s infinite ease-in-out alternate; 
        }
        .blob-2 { 
            width: 350px; height: 350px; 
            background: rgba(139, 92, 246, 0.3); /* Purple */
            bottom: 5%; right: -5%; 
            animation: moveBlob2 30s infinite ease-in-out alternate; 
        }
        .blob-3 { 
            width: 400px; height: 400px; 
            background: rgba(6, 182, 212, 0.25); /* Cyan */
            top: 30%; left: 35%; 
            animation: moveBlob3 35s infinite ease-in-out alternate; 
        }

        @keyframes moveBlob1 {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(150px, 100px) scale(1.2); }
        }
        @keyframes moveBlob2 {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(-150px, -150px) scale(1.1); }
        }
        @keyframes moveBlob3 {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(100px, 200px) scale(0.9); }
        }

        /* --- Component Animations --- */
        .hover-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); border-color: #374151; }
        .hover-btn:hover { filter: brightness(1.1); transform: scale(1.02); }
        .hover-btn:active { transform: scale(0.98); }
        .custom-spinner { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.1); border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; }
        .modal-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
        
        .content-layer { position: relative; z-index: 10; }
      `}</style>

      {/* ✅ ANIMATED BACKGROUND ELEMENTS */}
      <div className="bg-grid"></div> {/* Tech grid overlay */}
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      <div className="bg-blob blob-3"></div>

      {/* ✅ WRAP EVERYTHING IN CONTENT LAYER */}
      <div className="content-layer">

        {/* ✅ ADD TO CART SUCCESS POP-UP */}
        {addedItemPopup && (
            <div style={styles.modalOverlay} onClick={() => setAddedItemPopup(null)}>
            <div className="modal-fade-in" style={styles.successModal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.successIcon}>🎉</div>
                <h2 style={{color: '#fff', fontSize: '22px', fontWeight: 'bold', marginBottom: '8px'}}>Success!</h2>
                <p style={{color: '#9ca3af', marginBottom: '24px', fontSize: '15px'}}>
                <span style={{color: '#fff', fontWeight: 600}}>{addedItemPopup.name}</span> is now in your cart.
                </p>

                <div style={{display: 'flex', gap: '12px', width: '100%'}}>
                <button className="hover-btn" style={styles.btnSecondary} onClick={() => setAddedItemPopup(null)}>
                    Continue Shopping
                </button>
                <button className="hover-btn" style={styles.btnPrimary} onClick={() => { setAddedItemPopup(null); setCheckoutOpen(true); }}>
                    Checkout Now
                </button>
                </div>
            </div>
            </div>
        )}

        <Header q={q} setQ={setQ} count={filtered.length} me={me} meLoading={meLoading} cartCount={cartCount} onCart={() => setCheckoutOpen(true)} />

        <div style={styles.topBar}>
            <div style={styles.statsRow}>
            <StatChip label="Total Products" value={stats.total} icon="📦" />
            <StatChip label="In Stock" value={stats.instock} icon="✅" />
            <StatChip label="Low Stock" value={stats.low} icon="⚠️" />
            <StatChip label="Out of Stock" value={stats.out} icon="⛔" />
            </div>

            <div style={styles.controls}>
            <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} style={styles.select}>
                <option value="all">All stock</option>
                <option value="in">In stock</option>
                <option value="low">Low stock</option>
                <option value="out">Out of stock</option>
            </select>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={styles.select}>
                <option value="newest">Sort: Newest</option>
                <option value="priceAsc">Sort: Price Low-High</option>
                <option value="priceDesc">Sort: Price High-Low</option>
                <option value="name">Sort: Name A-Z</option>
            </select>

            <button className="hover-btn" style={styles.resetBtn} onClick={() => { setQ(""); setStockFilter("all"); setSortBy("newest"); }}>
                ↻ Reset
            </button>
            </div>
        </div>

        {filtered.length === 0 ? (
            <div style={styles.emptyWrap}>
            <div style={styles.emptyIcon}>🔍</div>
            <div style={styles.emptyTitle}>No products found</div>
            <div style={styles.emptyText}>We couldn't find any products matching your search. Try changing the filters.</div>
            </div>
        ) : (
            <div style={styles.grid}>
            {filtered.map((p) => {
                const badge = stockBadge(p.stock);
                const selectedQty = Number(qtyByProduct[p._id] || 1);
                const out = Number(p.stock || 0) <= 0;

                return (
                <div key={p._id} className="hover-card" style={styles.card}>
                    <div style={styles.imgWrap}>
                    {p.image ? (
                        <img src={`${BASE_URL}${p.image}`} alt={p.name} style={styles.img} onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='grid'}} />
                    ) : null}
                    <div style={{...styles.noImg, display: p.image ? 'none' : 'grid'}}>No Image Available</div>
                    <div style={{...styles.badge, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`}}>{badge.text}</div>
                    </div>

                    <div style={styles.cardBody}>
                    <div style={styles.topRow}>
                        <div style={styles.title} title={p.name}>{p.name}</div>
                        <div style={styles.price}>{fmtLKR(p.price)}</div>
                    </div>

                    <div style={styles.metaContainer}>
                        <div style={styles.metaRow}><span style={styles.metaLabel}>Supplier</span><span style={styles.metaValue}>{p.supplier?.name || "-"}</span></div>
                        <div style={styles.metaRow}><span style={styles.metaLabel}>Category</span><span style={styles.metaValue}>{p.category || "-"}</span></div>
                        <div style={styles.metaRow}><span style={styles.metaLabel}>Available</span><span style={styles.metaValue}>{p.stock} Units</span></div>
                    </div>

                    <div style={styles.cartRow}>
                        <div style={styles.qtyWrap}>
                        <button className="hover-btn" style={styles.qtyBtn} onClick={() => decProductQty(p._id)} disabled={out}>−</button>
                        <input style={styles.qtyInput} type="number" min={1} value={selectedQty} onChange={(e) => setProductQty(p._id, e.target.value)} disabled={out} />
                        <button className="hover-btn" style={styles.qtyBtn} onClick={() => incProductQty(p._id)} disabled={out}>+</button>
                        </div>
                        <button className="hover-btn" style={{...styles.addBtn, opacity: out ? 0.5 : 1, cursor: out ? "not-allowed" : "pointer"}} disabled={out} onClick={() => addToCart(p)}>Add to Cart</button>
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
            <div className="modal-fade-in" style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.modalHead}>
                <div>
                    <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>Your Cart</div>
                    <div style={{ color: "#9ca3af", fontSize: 13, marginTop: '4px' }}>{cartCount} Items • Total: <b>{fmtLKR(cartTotal)}</b></div>
                </div>
                <button className="hover-btn" style={styles.modalClose} onClick={() => setCheckoutOpen(false)}>✕</button>
                </div>

                {cart.length === 0 ? (
                <div style={{ color: "#6b7280", padding: 40, textAlign: 'center', fontSize: '15px' }}>
                    <span style={{fontSize: '40px', display: 'block', marginBottom: '10px'}}>🛒</span>
                    Your cart is empty.
                </div>
                ) : (
                <>
                    <div style={styles.cartTable}>
                    {cart.map((x) => (
                        <div key={x.product._id} style={styles.cartItemRow}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, color: '#f3f4f6' }}>{x.product.name}</div>
                            <div style={{ color: "#9ca3af", fontSize: 13, marginTop: '2px' }}>{fmtLKR(x.product.price)} / unit</div>
                        </div>

                        <input style={styles.cartQty} type="number" min={1} max={x.product.stock} value={x.qty} onChange={(e) => updateCartQty(x.product._id, e.target.value, x.product.stock)} />

                        <button className="hover-btn" onClick={() => removeFromCart(x.product._id)} style={styles.removeBtn} title="Remove">✕</button>
                        </div>
                    ))}
                    </div>

                    <div style={styles.formGroup}>
                    <label style={styles.label}>Delivery Address</label>
                    <textarea style={styles.textarea} value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="E.g., 123 Main St, Colombo 03" />
                    </div>

                    <div style={styles.formGroup}>
                    <label style={styles.label}>Order Note (Optional)</label>
                    <input style={styles.input} value={orderNote} onChange={(e) => setOrderNote(e.target.value)} placeholder="E.g., Deliver before 5 PM" />
                    </div>

                    <div style={styles.formGroup}>
                    <label style={styles.label}>Payment Method</label>
                    <div style={styles.lockedPaymentBtn}>💵 Cash on Delivery (COD)</div>
                    </div>

                    <div style={styles.modalFoot}>
                    <button className="hover-btn" style={styles.btnSecondary} onClick={clearCart} disabled={placing}>Clear Cart</button>
                    <button className="hover-btn" style={styles.btnPrimary} onClick={placeOrder} disabled={placing}>
                        {placing ? "Processing..." : `Place Order (${fmtLKR(cartTotal)})`}
                    </button>
                    </div>
                </>
                )}
            </div>
            </div>
        )}
      </div> {/* End of Content Layer */}
    </div>
  );
}

function Header({ q, setQ, count, me, meLoading, cartCount, onCart }) {
  const navigate = useNavigate(); 

  return (
    <div style={styles.header}>
      <div>
        <div style={styles.hTitle}>Supermarket Dashboard</div>
        <div style={styles.hSub}>Browsing <b>{count}</b> products in <b>{me?.district || "your district"}</b></div>
      </div>
      <div style={styles.searchWrap}>
        <span style={styles.searchIcon}>🔍</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products, categories, or suppliers..." style={styles.search} />
      </div>
      <div style={styles.profileMini}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {meLoading ? <div style={{ color: "#9ca3af", fontSize: 13 }}>Loading...</div> : me ? <div><div style={styles.profileMiniName}>{me.name}</div><div style={styles.profileMiniEmail}>📍 {me.district}</div></div> : null}
        </div>
        
        <button className="hover-btn" style={{...styles.cartBtn, background: '#4f46e5'}} onClick={() => navigate('/supermarket/my-orders')}>
          📦 My Orders
        </button>

             <button
  style={{ ...styles.cartBtn, background: "#0ea5e9" }}
  onClick={() => navigate("/supermarket/profile")}
>
  👤 My Profile
</button>

  

        <button className="hover-btn" style={styles.cartBtn} onClick={onCart}>🛒 Cart <b>({cartCount})</b></button>
      </div>
    </div>
  );
}

function StatChip({ label, value, icon }) { 
  return (
    <div style={styles.statChip}>
      <div>
        <div style={styles.statLabel}>{label}</div>
        <div style={styles.statValue}>{value}</div>
      </div>
      <span style={{fontSize: '24px', opacity: 0.8}}>{icon}</span>
    </div>
  ); 
}

// 🎨 PREMIUM UI/UX STYLES
const styles = {
  page: { position: 'relative', overflow: 'hidden', padding: 30, minHeight: "100vh", background: "#050B14", color: "#e5e7eb", fontFamily: "'Inter', sans-serif" },
  loadingContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '70vh' },
  header: { display: "grid", gridTemplateColumns: "1fr minmax(300px, 500px) auto", gap: 20, alignItems: "center", marginBottom: 30 },
  hTitle: { fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: -0.5 },
  hSub: { fontSize: 14, color: "#9ca3af", marginTop: 4 },
  searchWrap: { display: "flex", alignItems: "center", gap: 10, background: "#111827", border: "1px solid #1f2937", borderRadius: 12, padding: "12px 16px", transition: 'all 0.2s', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' },
  searchIcon: { fontSize: 16, color: '#9ca3af' },
  search: { width: "100%", border: "none", outline: "none", background: "transparent", color: "#e5e7eb", fontSize: 14 },
  profileMini: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 15, padding: "8px 12px", borderRadius: 12, border: "1px solid #1f2937", background: "#111827" },
  profileMiniName: { fontSize: 14, fontWeight: 700, color: '#fff' },
  profileMiniEmail: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  cartBtn: { border: "none", background: "#10b981", color: "#ffffff", padding: "10px 18px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' },
  topBar: { display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap", alignItems: "center", marginBottom: 30 },
  statsRow: { display: "flex", gap: 15, flexWrap: "wrap" },
  statChip: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: "#111827", border: "1px solid #1f2937", borderRadius: 12, padding: "16px", minWidth: 160, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
  statLabel: { fontSize: 13, color: "#9ca3af", fontWeight: 500 },
  statValue: { fontSize: 24, fontWeight: 800, marginTop: 4, color: '#fff' },
  controls: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" },
  select: { padding: "10px 14px", borderRadius: 10, border: "1px solid #374151", background: "#1f2937", color: "#f3f4f6", outline: "none", fontSize: 14, fontWeight: 500, cursor: 'pointer' },
  resetBtn: { padding: "10px 18px", borderRadius: 10, border: "1px solid #374151", background: "transparent", color: "#d1d5db", cursor: "pointer", fontSize: 14, fontWeight: 600, transition: 'all 0.2s' },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 24 },
  card: { borderRadius: 16, overflow: "hidden", border: "1px solid #1f2937", background: "rgba(17, 24, 39, 0.8)", backdropFilter: 'blur(10px)', transition: "all 0.3s ease" },
  imgWrap: { position: "relative", height: 180, background: "#1f2937" },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  noImg: { height: "100%", display: "grid", placeItems: "center", color: "#6b7280", fontSize: 14, fontWeight: 500, background: '#111827' },
  badge: { position: "absolute", top: 12, left: 12, fontSize: 11, padding: "4px 10px", borderRadius: 6, fontWeight: 700, textTransform: 'uppercase', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  cardBody: { padding: 20 },
  topRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 15 },
  title: { fontWeight: 800, fontSize: 17, lineHeight: 1.3, color: '#fff' },
  price: { fontWeight: 800, fontSize: 18, color: "#10b981" },
  metaContainer: { marginBottom: 20, padding: 12, borderRadius: 10, background: "#1f2937", border: '1px solid #374151' },
  metaRow: { display: "flex", justifyContent: "space-between", gap: 10, padding: "5px 0", fontSize: 13 },
  metaLabel: { color: "#9ca3af", fontWeight: 500 },
  metaValue: { color: "#f3f4f6", fontWeight: 600 },
  cartRow: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" },
  qtyWrap: { display: "flex", alignItems: "center", background: '#1f2937', border: '1px solid #374151', borderRadius: 8, overflow: 'hidden' },
  qtyBtn: { width: 32, height: 32, background: "transparent", color: "#e5e7eb", cursor: "pointer", border: 'none', fontSize: 16, fontWeight: 700 },
  qtyInput: { width: 40, height: 32, background: "transparent", color: "#fff", outline: "none", textAlign: "center", border: 'none', fontSize: 14, fontWeight: 600 },
  addBtn: { flex: 1, border: "none", background: "#3b82f6", color: "#fff", padding: "10px 0", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 14, transition: 'all 0.2s' },
  emptyWrap: { marginTop: 60, padding: 60, textAlign: "center", background: "#111827", borderRadius: 20, border: '1px dashed #374151' },
  emptyIcon: { fontSize: 60, marginBottom: 16, opacity: 0.8 },
  emptyTitle: { fontSize: 20, fontWeight: 800, color: '#fff' },
  emptyText: { marginTop: 8, color: "#9ca3af", fontSize: 15, maxWidth: '400px', margin: '8px auto 0' },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: 'blur(5px)', display: "flex", justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { width: "100%", maxWidth: 500, borderRadius: 20, background: "#111827", border: '1px solid #1f2937', boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)", overflow: "hidden", maxHeight: '85vh', display: 'flex', flexDirection: 'column' },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #1f2937", background: '#111827' },
  modalClose: { background: "#1f2937", color: "#9ca3af", border: "none", cursor: "pointer", fontSize: 16, width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' },
  cartTable: { padding: "10px 24px", overflowY: 'auto', flex: 1 },
  cartItemRow: { display: "flex", gap: 15, alignItems: "center", padding: "16px 0", borderBottom: '1px solid #1f2937' },
  cartQty: { width: 60, padding: "8px", borderRadius: 8, border: "1px solid #374151", background: "#1f2937", color: "#fff", textAlign: "center", fontSize: 14, fontWeight: 600 },
  formGroup: { padding: "0 24px 20px" },
  label: { display: "block", fontSize: 14, color: "#d1d5db", marginBottom: 8, fontWeight: 600 },
  textarea: { width: "100%", minHeight: 80, borderRadius: 10, border: "1px solid #374151", background: "#1f2937", color: "#fff", padding: "12px 16px", outline: "none", resize: 'vertical', fontSize: 14 },
  input: { width: "100%", height: 46, borderRadius: 10, border: "1px solid #374151", background: "#1f2937", color: "#fff", padding: "0 16px", outline: "none", fontSize: 14 },
  modalFoot: { padding: "20px 24px", display: "flex", gap: 12, borderTop: "1px solid #1f2937", background: '#111827' },
  removeBtn: { background: "#7f1d1d", color: "#fca5a5", border: 'none', width: 34, height: 34, borderRadius: 8, cursor: "pointer", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", transition: 'all 0.2s' },
  lockedPaymentBtn: { background: "#1f2937", border: "1px solid #3b82f6", color: "#60a5fa", padding: "14px", borderRadius: 10, textAlign: "center", fontWeight: 700, cursor: "not-allowed", boxShadow: '0 0 0 1px #3b82f6' },
  
  // ✅ SUCCESS POP-UP STYLES
  successModal: { background: '#111827', padding: '30px', borderRadius: '20px', border: '1px solid #1f2937', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', textAlign: 'center', width: '90%', maxWidth: '360px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  successIcon: { fontSize: '48px', marginBottom: '16px', background: '#064e3b', width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnSecondary: { flex: 1, padding: '12px', background: 'transparent', border: '1px solid #374151', color: '#d1d5db', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', transition: 'all 0.2s' },
  btnPrimary: { flex: 1, padding: '12px', background: '#10b981', border: 'none', color: '#fff', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', transition: 'all 0.2s' }
};