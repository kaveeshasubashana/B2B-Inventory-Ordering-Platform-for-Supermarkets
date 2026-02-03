// frontend/src/pages/HomePage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./HomePage.css";
import heroImage from "../assets/home.png";
import InfoSection from "../components/InfoSection";

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const benefits = [
    "Streamline inventory management",
    "Connect suppliers & supermarkets",
    
  ];

  return (
    <>
      <section id="home" className="hero-section">
        {/* Background decorations */}
        <div className="hero-bg-decoration">
          <div className="decoration-circle decoration-1"></div>
          <div className="decoration-circle decoration-2"></div>
        </div>

        <div className="hero-container">
          {/* Left Content */}
          <div className="hero-left">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              <span className="badge-text">B2B Inventory Platform</span>
            </div>

            <h1 className="hero-title">
              Welcome to the{" "}
              <span className="text-accent">Inventory</span>{" "}
              Ordering System
            </h1>

            <p className="hero-description">
              Connect admins, suppliers, and supermarkets in one powerful platform. 
              Streamline operations and grow your business across Sri Lanka.
            </p>

            {/* Benefits List */}
            <div className="hero-benefits">
              {benefits.map((benefit, index) => (
                <div key={index} className="benefit-item">
                  <svg className="benefit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            {!user && (
              <div className="hero-cta">
                <button
                  className="btn-primary"
                  onClick={() => navigate("/register")}
                >
                  Get Started Free
                  <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => navigate("/login")}
                >
                  Login
                </button>
              </div>
            )}
          </div>

          {/* Right Content - Hero Image */}
          <div className="hero-right">
            <div className="hero-image-wrapper">
              <img
                src={heroImage}
                alt="BridgeMart Inventory System"
                className="hero-image"
              />
              <div className="hero-image-glow"></div>
            </div>

            {/* Floating stats cards */}
            <div className="stats-card stats-card-left">
              <div className="stats-number">500+</div>
              <div className="stats-label">Active Suppliers</div>
            </div>

            <div className="stats-card stats-card-right">
              <div className="stats-number">1,200+</div>
              <div className="stats-label">Supermarkets</div>
            </div>
          </div>
        </div>
      </section>

      {/* InfoSection ONLY when NOT logged in */}
      {!user && <InfoSection />}
    </>
  );
};

export default HomePage;
