"use client";

import React, { useState, useEffect } from "react";
import { 
  Layers, 
  Play, 
  CheckCircle2, 
  Clock, 
  Zap, 
  RefreshCw, 
  ArrowRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { triggerBatch, fetchVideos, fetchVoices } from "@/lib/api";
import { VideoJob, VoiceOption } from "@/lib/types";
import { ShortPlayerModal } from "@/components/video/ShortPlayerModal";

export default function BatchEnginePage() {
  const [batchCount, setBatchCount] = useState(10);
  const [selectedVoice, setSelectedVoice] = useState("onyx");
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeBatchJobs, setActiveBatchJobs] = useState<VideoJob[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoJob | null>(null);

  useEffect(() => {
    fetchVoices().then(setVoices);
    loadJobs();
    const interval = setInterval(loadJobs, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadJobs = async () => {
    try {
      const all = await fetchVideos();
      // Show latest 10 jobs
      setActiveBatchJobs(all.slice(0, 10));
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartBatch = async () => {
    setLoading(true);
    try {
      await triggerBatch(batchCount, selectedVoice);
      await loadJobs();
    } catch (err) {
      alert("Error starting batch: " + err);
    } finally {
      setLoading(false);
    }
  };

  const completedCount = activeBatchJobs.filter(j => j.status === "READY" || j.status === "PUBLISHED").length;
  const inProgressCount = activeBatchJobs.filter(j => !["READY", "PUBLISHED", "FAILED"].includes(j.status)).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Page Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <span className="badge badge-ready">
            <Zap size={13} /> High-Velocity Cadence
          </span>
        </div>
        <h1 style={{ fontSize: "1.85rem", fontWeight: "800", color: "#ffffff", marginBottom: "6px" }}>
          High-Frequency Batch Engine (10 Videos / Day)
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "800px" }}>
          Trigger automated multi-threaded generation of 10 Minecraft Shorts simultaneously. 
          Each job independently runs Scripting → AI Voiceover → Dynamic Subtitles → 9:16 Video Composition → Viral SEO.
        </p>
      </div>

      {/* Control Panel */}
      <div className="glass-card" style={{ padding: "28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", alignItems: "flex-end" }}>
          {/* Target Count */}
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600", display: "block", marginBottom: "8px" }}>
              Batch Volume (Algorithm Target)
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              {[5, 10, 15].map((num) => (
                <button
                  key={num}
                  onClick={() => setBatchCount(num)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    background: batchCount === num ? "rgba(16, 185, 129, 0.2)" : "rgba(255,255,255,0.04)",
                    border: batchCount === num ? "1px solid #10b981" : "1px solid var(--border-subtle)",
                    color: batchCount === num ? "#34d399" : "var(--text-secondary)",
                    fontWeight: "700",
                    fontSize: "0.9rem",
                    cursor: "pointer"
                  }}
                >
                  {num} Shorts
                </button>
              ))}
            </div>
          </div>

          {/* Voice selector */}
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600", display: "block", marginBottom: "8px" }}>
              Batch Voiceover Model
            </label>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "8px",
                padding: "10px 12px",
                color: "#ffffff",
                fontSize: "0.9rem",
                outline: "none"
              }}
            >
              {voices.map((v) => (
                <option key={v.id} value={v.id} style={{ background: "#18181b", color: "#fff" }}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Trigger Button */}
          <div>
            <button
              onClick={handleStartBatch}
              disabled={loading}
              className="btn-primary"
              style={{ width: "100%", padding: "12px 20px", fontSize: "1rem" }}
            >
              <Layers size={18} />
              <span>{loading ? "Launching Batch..." : `Queue ${batchCount} Automated Shorts`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Batch Progress Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
        <div className="glass-card" style={{ padding: "18px 22px" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600", marginBottom: "6px" }}>BATCH STATUS</div>
          <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
            {inProgressCount > 0 ? (
              <>
                <span className="animate-pulse-slow" style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#facc15" }} />
                <span>Processing ({inProgressCount})</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={24} color="#10b981" />
                <span>Idle / Complete</span>
              </>
            )}
          </div>
        </div>

        <div className="glass-card" style={{ padding: "18px 22px" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600", marginBottom: "6px" }}>COMPLETED SHORTS</div>
          <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "#10b981" }}>
            {completedCount} / {activeBatchJobs.length || 10}
          </div>
        </div>

        <div className="glass-card" style={{ padding: "18px 22px" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600", marginBottom: "6px" }}>CADENCE TARGET</div>
          <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "#60a5fa" }}>
            10 Shorts / 24h
          </div>
        </div>
      </div>

      {/* Real-time Concurrent Jobs Grid */}
      <div>
        <h2 style={{ fontSize: "1.2rem", color: "#ffffff", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          Active Batch Pipeline Queue
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "400" }}>
            (Auto-updating live)
          </span>
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
          {activeBatchJobs.map((job, idx) => {
            const isDone = job.status === "READY" || job.status === "PUBLISHED";
            const isFailed = job.status === "FAILED";

            return (
              <div
                key={job.id}
                className="glass-card"
                onClick={() => isDone && setSelectedVideo(job)}
                style={{
                  padding: "18px",
                  cursor: isDone ? "pointer" : "default",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  position: "relative"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "700" }}>
                      SHORT #{idx + 1}
                    </span>
                    <h3 style={{ fontSize: "0.95rem", color: "#ffffff", marginTop: "2px", lineHeight: 1.3 }}>
                      {job.topic}
                    </h3>
                  </div>
                  <span className={`badge badge-${job.status.toLowerCase()}`}>
                    {job.status}
                  </span>
                </div>

                {/* Status description */}
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  {job.current_step}
                </div>

                {/* Progress Bar */}
                <div style={{ width: "100%", height: "6px", backgroundColor: "rgba(255, 255, 255, 0.06)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{
                    width: `${job.progress}%`,
                    height: "100%",
                    background: isDone 
                      ? "linear-gradient(90deg, #10b981 0%, #34d399 100%)" 
                      : isFailed 
                      ? "#ef4444" 
                      : "linear-gradient(90deg, #facc15 0%, #10b981 100%)",
                    transition: "width 0.4s ease"
                  }} />
                </div>

                {/* Bottom preview info */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  <span>{job.niche_category}</span>
                  {isDone && (
                    <span style={{ color: "#10b981", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Play size={12} /> Click to Preview
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Video Preview Modal */}
      <ShortPlayerModal
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
        onPublished={() => {
          loadJobs();
          setSelectedVideo(null);
        }}
      />
    </div>
  );
}
