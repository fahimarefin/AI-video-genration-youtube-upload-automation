"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Sparkles, 
  Layers, 
  Film, 
  CalendarClock, 
  FolderKanban, 
  Settings,
  Youtube,
  Zap,
  Scissors
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Command Center", icon: LayoutDashboard, badge: null },
    { href: "/studio", label: "Shorts Studio", icon: Sparkles, badge: "AI" },
    { href: "/clipper", label: "AI Clipper", icon: Scissors, badge: "NEW" },
    { href: "/batch", label: "Batch Engine", icon: Layers, badge: "10/Day" },
    { href: "/library", label: "Video Library", icon: Film, badge: null },
    { href: "/schedule", label: "24/7 Schedule", icon: CalendarClock, badge: null },
    { href: "/media", label: "Media Vault", icon: FolderKanban, badge: null },
    { href: "/channel", label: "Channel & Setup", icon: Settings, badge: null },
  ];

  return (
    <aside style={{
      width: "260px",
      minHeight: "100vh",
      backgroundColor: "var(--bg-sidebar)",
      borderRight: "1px solid var(--border-subtle)",
      display: "flex",
      flexDirection: "column",
      position: "fixed",
      left: 0,
      top: 0,
      bottom: 0,
      zIndex: 50
    }}>
      {/* Brand Header */}
      <div style={{
        padding: "24px 20px",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "center",
        gap: "12px"
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          background: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 15px rgba(16, 185, 129, 0.4)"
        }}>
          <Youtube size={22} color="#ffffff" />
        </div>
        <div>
          <h2 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#ffffff", display: "flex", alignItems: "center", gap: "6px" }}>
            Terry Shorts
            <span style={{
              fontSize: "0.65rem",
              background: "rgba(16, 185, 129, 0.2)",
              color: "#34d399",
              padding: "2px 6px",
              borderRadius: "4px",
              fontWeight: "700"
            }}>PRO</span>
          </h2>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Minecraft Automation</p>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "20px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 14px",
                borderRadius: "10px",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: isActive ? "600" : "500",
                color: isActive ? "#ffffff" : "var(--text-secondary)",
                backgroundColor: isActive ? "rgba(16, 185, 129, 0.15)" : "transparent",
                border: isActive ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid transparent",
                transition: "all 0.15s ease"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Icon size={18} color={isActive ? "#10b981" : "#94a3b8"} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span style={{
                  fontSize: "0.65rem",
                  fontWeight: "700",
                  padding: "2px 6px",
                  borderRadius: "6px",
                  backgroundColor: item.badge === "AI" ? "rgba(250, 204, 21, 0.15)" : "rgba(16, 185, 129, 0.2)",
                  color: item.badge === "AI" ? "#facc15" : "#34d399",
                  border: item.badge === "AI" ? "1px solid rgba(250, 204, 21, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)"
                }}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Status Card */}
      <div style={{ padding: "16px 14px", borderTop: "1px solid var(--border-subtle)" }}>
        <div style={{
          padding: "14px",
          borderRadius: "12px",
          background: "rgba(16, 185, 129, 0.08)",
          border: "1px solid rgba(16, 185, 129, 0.2)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <Zap size={15} color="#10b981" />
            <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "#34d399" }}>Algorithm Engine</span>
          </div>
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
            High-velocity cadence: 10 daily Shorts target active.
          </p>
        </div>
      </div>
    </aside>
  );
}
