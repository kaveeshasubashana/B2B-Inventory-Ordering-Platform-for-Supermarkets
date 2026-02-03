import React, { useMemo, useState } from "react";
import { MapContainer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// ✅ IMPORT the GeoJSON (NO fetch needed)
import sriLankaDistricts from "../assets/geo/sri_lanka_districts.json";

// Sri Lanka bounds (rough, but good)
const SL_BOUNDS = [
  [5.7, 79.4],  // SW
  [10.1, 82.1], // NE
];

const normalizeDistrict = (name = "") =>
  String(name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/ district$/i, "");

const money = (n = 0) =>
  `Rs. ${Number(n || 0).toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;

// Color palette for districts with buyers
const getDistrictColor = (buyerCount) => {
  if (buyerCount >= 5) return "#059669"; // Dark emerald
  if (buyerCount >= 3) return "#10b981"; // Emerald
  if (buyerCount >= 1) return "#34d399"; // Light emerald
  return null;
};

export default function SriLankaLeafletMap({
  districtStats = {},
  selectedDistrict = "all",
  onSelectDistrict,
  height = 380,
}) {
  const [err, setErr] = useState("");

  // ✅ Use imported data directly
  const geo = sriLankaDistricts;

  const selectedKey = useMemo(
    () => (selectedDistrict === "all" ? "all" : normalizeDistrict(selectedDistrict)),
    [selectedDistrict]
  );

  // ✅ Safety check (shows friendly error if file is not valid)
  if (!geo || geo.type !== "FeatureCollection" || !Array.isArray(geo.features)) {
    return (
      <div style={{ padding: 14, border: "1px solid #e2e8f0", borderRadius: 14, color: "#b91c1c" }}>
        Map load failed: GeoJSON file is not a valid FeatureCollection.
        <br />
        Please make sure the file contains ONLY JSON (no extra text).
      </div>
    );
  }

  // style function - Enhanced with better colors and effects
  const geoStyle = (feature) => {
    const shapeName = feature?.properties?.shapeName || "";
    const key = normalizeDistrict(shapeName.replace(/ district$/i, ""));

    const stats = districtStats[key];
    const hasData = !!stats;
    const buyerCount = stats?.buyers || 0;
    const isSelected = selectedKey !== "all" && selectedKey === key;

    // Enhanced color scheme
    const activeColor = getDistrictColor(buyerCount) || "#10b981";
    
    return {
      weight: isSelected ? 3 : hasData ? 2 : 1,
      color: isSelected ? "#047857" : hasData ? "#6ee7b7" : "#94a3b8",
      fillOpacity: hasData ? 0.85 : 0.4,
      fillColor: hasData ? activeColor : "#cbd5e1",
      dashArray: isSelected ? "" : hasData ? "" : "3",
    };
  };

  const onEachFeature = (feature, layer) => {
    const raw = feature?.properties?.shapeName || "Unknown";
    const name = raw.replace(/ district$/i, "");
    const key = normalizeDistrict(name);

    const stats = districtStats[key];
    const hasData = !!stats;

    // Enhanced popup with better styling
    const popupHtml = `
      <div style="font-family: 'Inter', -apple-system, sans-serif; min-width: 200px; padding: 4px;">
        <div style="font-weight: 700; font-size: 16px; color: #1e293b; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 2px solid ${hasData ? '#10b981' : '#e2e8f0'};">
          ${name}
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="color: #64748b;">Buyers:</span>
          <span style="font-weight: 600; color: ${hasData ? '#10b981' : '#94a3b8'};">${stats?.buyers ?? 0}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="color: #64748b;">Orders:</span>
          <span style="font-weight: 600; color: ${hasData ? '#3b82f6' : '#94a3b8'};">${stats?.orders ?? 0}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #64748b;">Revenue:</span>
          <span style="font-weight: 600; color: ${hasData ? '#8b5cf6' : '#94a3b8'};">${money(stats?.revenue ?? 0)}</span>
        </div>
        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
          ${hasData ? '👆 Click to filter buyers' : 'No buyers in this district'}
        </div>
      </div>
    `;

    layer.bindPopup(popupHtml, {
      className: 'custom-popup',
      closeButton: false,
    });

    layer.on("click", () => onSelectDistrict?.(name));
    layer.on("mouseover", () => {
      layer.setStyle({ 
        weight: 3, 
        fillOpacity: hasData ? 0.95 : 0.5,
        color: hasData ? "#047857" : "#64748b"
      });
      layer.bringToFront();
    });
    layer.on("mouseout", () => layer.setStyle(geoStyle(feature)));
  };

  if (err) {
    return (
      <div style={{ padding: 14, border: "1px solid #e2e8f0", borderRadius: 14, color: "#b91c1c" }}>
        <b>Map error:</b> {err}
      </div>
    );
  }

  return (
    <div
      style={{
        height,
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid #e2e8f0",
        background: "linear-gradient(145deg, #f1f5f9 0%, #e2e8f0 100%)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
        position: "relative",
      }}
    >
      {/* Decorative corner accents */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "4px",
        background: "linear-gradient(90deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%)",
        zIndex: 1000,
      }} />
      
      <MapContainer
        bounds={SL_BOUNDS}
        maxBounds={SL_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{ height: "100%", width: "100%", background: "transparent" }}
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={true}
        doubleClickZoom={false}
        attributionControl={false}
      >
        {/* No TileLayer = only Sri Lanka vector */}
        <GeoJSON data={geo} style={geoStyle} onEachFeature={onEachFeature} />
      </MapContainer>
      
      {/* Legend - Compact */}
      <div style={{
        position: "absolute",
        bottom: 10,
        left: 10,
        background: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(6px)",
        borderRadius: 8,
        padding: "8px 10px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        zIndex: 1000,
        fontSize: 10,
      }}>
        <div style={{ fontWeight: 600, marginBottom: 5, color: "#475569", fontSize: 11 }}>Buyer Density</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: "#059669" }} />
            <span style={{ color: "#64748b" }}>5+ buyers</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: "#10b981" }} />
            <span style={{ color: "#64748b" }}>3-4 buyers</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: "#34d399" }} />
            <span style={{ color: "#64748b" }}>1-2 buyers</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: "#cbd5e1", border: "1px dashed #94a3b8" }} />
            <span style={{ color: "#94a3b8" }}>No buyers</span>
          </div>
        </div>
      </div>
    </div>
  );
}
