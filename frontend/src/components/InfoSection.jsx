import React from "react";
import "./InfoSection.css";

const InfoSection = () => {
  const features = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      ),
      title: "Centralized Management",
      description: "Admins control users, approvals, and system operations from one secure dashboard.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
      ),
      title: "Supplier Operations",
      description: "Suppliers manage products, stock levels, and orders efficiently with real-time updates.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
      ),
      title: "Supermarket Ordering",
      description: "Supermarkets browse products, place orders, and track deliveries with ease.",
    },
  ];

  return (
    <section className="info-section" id="features">
      {/* Background decorations */}
      <div className="info-bg-decoration">
        <div className="info-decoration-circle info-decoration-1"></div>
        <div className="info-decoration-circle info-decoration-2"></div>
      </div>

      <div className="info-container">
        {/* Section Header */}
        <div className="info-header">
          <div className="info-badge">
            <span className="info-badge-dot"></span>
            <span>Features</span>
          </div>
          <h2 className="info-title">
            How <span className="text-accent">BridgeMart</span> Works
          </h2>
          <p className="info-subtitle">
            A simple B2B platform designed to streamline inventory and business operations across Sri Lanka.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="info-cards">
          {features.map((feature, index) => (
            <div className="info-card" key={index}>
              <div className="info-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <div className="card-glow"></div>
            </div>
          ))}
        </div>

      
      </div>
    </section>
  );
};

export default InfoSection;
