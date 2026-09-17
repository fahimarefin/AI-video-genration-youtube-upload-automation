"use client";

import React, { useState, useEffect } from "react";
import { 
  FolderKanban, 
  Film, 
  Music, 
  Upload, 
  Play, 
  CheckCircle2, 
  Volume2
} from "lucide-react";
import { fetchMediaAssets } from "@/lib/api";
import { MediaAsset } from "@/lib/types";

export default function MediaPage() {
  const [tab, setTab] = useState<"gameplay" | "music">("gameplay");
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssets();
  }, [tab]);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const data = await fetchMediaAssets(tab);
      setAssets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.85rem", fontWeight: "800", color: "#ffffff", marginBottom: "6px" }}>
          Media Assets Vault
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Vertical 9:16 Minecraft gameplay footage and copyright-safe background audio tracks used to compose Shorts.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={() => setTab("gameplay")}
          className={tab === "gameplay" ? "btn-primary" : "btn-secondary"}
        >
          <Film size={16} />
          <span>Minecraft Gameplay Clips</span>
        </button>
        <button
          onClick={() => setTab("music")}
          className={tab === "music" ? "btn-primary" : "btn-secondary"}
        >
          <Music size={16} />
          <span>Background Audio Tracks</span>
        </button>
      </div>

      {/* Assets Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="glass-card"
            style={{
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px"
            }}
          >
            <div style={{
              height: "140px",
              borderRadius: "10px",
              background: tab === "gameplay" 
                ? "linear-gradient(135deg, #065f46 0%, #0f172a 100%)" 
                : "linear-gradient(135deg, #312e81 0%, #0f172a 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative"
            }}>
              {tab === "gameplay" ? (
                <Film size={36} color="#34d399" />
              ) : (
                <Volume2 size={36} color="#818cf8" />
              )}
              <span style={{
                position: "absolute",
                bottom: "8px",
                right: "8px",
                background: "rgba(0,0,0,0.7)",
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "0.75rem",
                color: "#ffffff"
              }}>
                {asset.duration_sec}s
              </span>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span className="badge badge-ready" style={{ fontSize: "0.65rem" }}>
                  {asset.is_default ? "DEFAULT PRESET" : "CUSTOM"}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {tab === "gameplay" ? "9:16 Vertical" : "Stereo 44.1kHz"}
                </span>
              </div>
              <h3 style={{ fontSize: "1rem", color: "#ffffff", marginTop: "4px" }}>
                {asset.title}
              </h3>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                {asset.filename}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
