"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Layers, Youtube, Activity, Bell } from "lucide-react";

export function Navbar() {
  return (
    <header style={{
      height: "70px",
      backgroundColor: "rgba(14, 14, 18, 0.8)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--border-subtle)",
      position: "sticky",
      top: 0,
      zIndex: 40,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 32px"
    }}>
      {/* Left indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 12px",
          borderRadius: "8px",
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid var(--border-subtle)",
          fontSize: "0.8rem",
          color: "var(--text-secondary)"
        }}>
          <span style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "#10b981",
            boxShadow: "0 0 8px #10b981"
          }} />
          <span>Pipeline: Ready</span>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          borderRadius: "8px",
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          fontSize: "0.8rem",
          color: "#f87171"
        }}>
          <Youtube size={14} color="#ef4444" />
          <span>Channel: Terry's Minecraft Realm</span>
        </div>
      </div>

      {/* Right Quick Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Link href="/batch" className="btn-secondary" style={{ textDecoration: "none" }}>
          <Layers size={16} color="#94a3b8" />
          <span>Batch 10 Shorts</span>
        </Link>
        <Link href="/studio" className="btn-primary" style={{ textDecoration: "none" }}>
          <Sparkles size={16} />
          <span>Create Short</span>
        </Link>
      </div>
    </header>
  );
}
