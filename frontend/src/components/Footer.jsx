// frontend/src/components/Footer.jsx
import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container" id="contact">

        {/* LEFT: Brand & Description */}
        <div className="footer-column">
          <h3 className="footer-title">📦 BridgeMart</h3>
          <p className="footer-text">
            BridgeMart is a modern B2B inventory and ordering platform designed
            to seamlessly connect suppliers and supermarkets across Sri Lanka.
            We focus on efficiency, transparency, and reliable business growth.
          </p>
        </div>

        {/* MIDDLE: Contact Details */}
        <div className="footer-column">
          <h4 className="footer-subtitle">Contact Us</h4>
          <p><strong>Email:</strong> support@bridgemart.com</p>
          <p><strong>Phone:</strong> +94 11 311 0225</p>
          <p><strong>Address:</strong> Colombo, Sri Lanka</p>
        </div>

        {/* RIGHT: Contact Form */}
        <div className="footer-column">
          <h4 className="footer-subtitle">Send a Message</h4>
          <form className="footer-form">
            <input type="text" placeholder="Your Name" required />
            <input type="email" placeholder="Your Email" required />
            <textarea placeholder="Your Message" rows="3" required />
            <button type="submit">Send</button>
          </form>
        </div>

      </div>

      
      <div className="footer-bottom">
         {/* BOTTOM
        <div className="social-icons">
          <a href="#" aria-label="Facebook">🌐</a>
          <a href="#" aria-label="Instagram">📸</a>
          <a href="#" aria-label="LinkedIn">💼</a>
          <a href="#" aria-label="WhatsApp">💬</a>
        </div>
        */}
        <p>© {new Date().getFullYear()} BridgeMart. All rights reserved.</p>
      </div>
      
    </footer>
  );
};

export default Footer;
