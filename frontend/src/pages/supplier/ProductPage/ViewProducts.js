import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import SupplierSidebar from "../Suppliersidebar";
import SupplierTopbar from "../SupplierTopbar";
import axios from "../../../api/axiosInstance";
import "./ViewProducts.css";

const ViewProducts = () => {
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [file, setFile] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const itemsPerPage = 10;
  const BASE_URL = "http://localhost:5000";

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
  });

  const categories = [
    "Beverages","Dairy","Snacks","Frozen Foods","Canned Goods",
    "Bakery","Meat","Produce","Condiments","Cleaning Supplies",
    "Computers","Electronics","Personal Care","Other",
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (location.state?.openAdd) {
      openAddModal();
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/products/my-products");
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      stock: "",
      category: "",
    });
    setFile(null);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price,
      stock: product.stock,
      category: product.category || "",
    });
    setFile(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append("image", file);

      if (editingProduct) {
        await axios.patch(`/products/${editingProduct._id}`, fd);
      } else {
        await axios.post("/products", fd);
      }

      closeModal();
      fetchProducts();
    } catch (err) {
      alert("Save failed");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await axios.delete(`/products/${id}`);
    fetchProducts();
  };

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = categoryFilter === "all" || p.category === categoryFilter;

    let matchStock = true;
    if (statusFilter === "out") matchStock = p.stock === 0;
    if (statusFilter === "low") matchStock = p.stock > 0 && p.stock <= 10;
    if (statusFilter === "in") matchStock = p.stock > 10;

    return matchSearch && matchCategory && matchStock;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const pageProducts = filteredProducts.slice(start, start + itemsPerPage);

  return (
    <div className="supplier-layout">
      <SupplierSidebar />
      <div className="supplier-main-content">
        <SupplierTopbar />

        <div className="view-products-page">
          <h1>Products</h1>

          <div className="products-toolbar">
            <input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button onClick={openAddModal}>+ Add Product</button>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <table className="products-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Category</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pageProducts.map((p) => (
                  <tr key={p._id}>
                    <td>
                      {p.image ? (
                        <img src={`${BASE_URL}${p.image}`} alt="" width="40" />
                      ) : "—"}
                    </td>
                    <td>{p.name}</td>
                    <td>Rs. {p.price}</td>
                    <td>{p.stock}</td>
                    <td>{p.category}</td>

                    {/* ✅ FIXED ACTION CELL */}
                    <td>
                      <button onClick={() => openEditModal(p)}>Edit</button>
                      <button onClick={() => handleDelete(p._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {showModal && (
            <div className="modal-overlay" onClick={closeModal}>
              <div className="product-modal" onClick={(e) => e.stopPropagation()}>
                <h2>{editingProduct ? "Edit Product" : "Add Product"}</h2>

                <form onSubmit={handleSubmit}>
                  <input
                    name="name"
                    placeholder="Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                  <input
                    name="price"
                    type="number"
                    placeholder="Price"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                  <input
                    name="stock"
                    type="number"
                    placeholder="Stock"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                  />
                  <select
                    name="category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  >
                    <option value="">Select</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  <input type="file" onChange={(e) => setFile(e.target.files[0])} />

                  <button type="submit">
                    {formLoading ? "Saving..." : "Save"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewProducts;
