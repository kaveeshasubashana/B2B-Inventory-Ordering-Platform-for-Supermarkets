// frontend/src/components/Footer.jsx
import React, { useState } from "react";
import "./Footer.css";
import api from "../api/axiosInstance";

const Footer = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");

    try {
      await api.post("/contact", formData);
      setStatus("Message sent successfully ✅");

      setFormData({
        name: "",
        email: "",
        message: "",
      });
    } catch (err) {
      setStatus("Failed to send message ❌");
    }
  };

  return (
    <footer className="footer">
      <div className="footer-container" id="contact">

        {/* LEFT */}
        <div className="footer-column">
          <h3 className="footer-title">📦 BridgeMart</h3>
          <p className="footer-text">
            BridgeMart is a modern B2B inventory and ordering platform designed
            to seamlessly connect suppliers and supermarkets across Sri Lanka.
          </p>
        </div>

        {/* MIDDLE */}
        <div className="footer-column">
          <h4 className="footer-subtitle">Contact Us</h4>
          <p><strong>Email:</strong> support@bridgemart.com</p>
          <p><strong>Phone:</strong> +94 11 311 0225</p>
          <p><strong>Address:</strong> Colombo, Sri Lanka</p>
        </div>

        {/* RIGHT */}
        <div className="footer-column">
          <h4 className="footer-subtitle">Send a Message</h4>

          <form className="footer-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <textarea
              name="message"
              placeholder="Your Message"
              rows="3"
              value={formData.message}
              onChange={handleChange}
              required
            />

            <button type="submit">Send</button>
          </form>

          {status && <p style={{ marginTop: "8px" }}>{status}</p>}
        </div>

      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} BridgeMart. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
