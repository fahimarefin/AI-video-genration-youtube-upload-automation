"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  Layers, 
  Play, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Film, 
  ArrowRight,
  RefreshCw,
  Zap,
  Youtube
} from "lucide-react";
import { fetchStats, fetchVideos, triggerBatch } from "@/lib/api";
import { ChannelStats, VideoJob } from "@/lib/types";
import { ShortPlayerModal } from "@/components/video/ShortPlayerModal";

export default function DashboardPage() {
  const [stats, setStats] = useState<ChannelStats | null>(null);
  const [recentVideos, setRecentVideos] = useState<VideoJob[]>([]);
  const [activeJobs, setActiveJobs] = useState<VideoJob[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [batchLoading, setBatchLoading] = useState(false);

  const loadData = async () => {
    try {
      const [s, v] = await Promise.all([fetchStats(), fetchVideos()]);
      setStats(s);
      setRecentVideos(v.slice(0, 6));
      setActiveJobs(v.filter(j => !["READY", "PUBLISHED", "FAILED"].includes(j.status)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Polling for live pipeline updates
    return () => clearInterval(interval);
  }, []);

  const handleQuickBatch = async () => {
    setBatchLoading(true);
    try {
      await triggerBatch(10);
      await loadData();
    } catch (e) {
      alert("Batch trigger failed: " + e);
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Hero Banner */}
      <div className="glass-card glow-emerald" style={{
        padding: "32px",
        borderRadius: "16px",
        background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(22, 22, 28, 0.95) 100%)",
        border: "1px solid var(--border-highlight)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "24px"
      }}>
        <div style={{ maxWidth: "600px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span style={{
              background: "rgba(16, 185, 129, 0.2)",
              color: "#34d399",
              padding: "4px 10px",
              borderRadius: "20px",
              fontSize: "0.75rem",
              fontWeight: "700",
              letterSpacing: "0.05em",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px"
            }}>
              <Zap size={14} /> PHASE 1: YOUTUBE AUTOMATION
            </span>
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "#ffffff", marginBottom: "8px" }}>
            Minecraft Shorts Command Center
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.5 }}>
            Automated pipeline for Terry Harris. Hands-off AI scripts, neural voiceovers, vertical 9:16 gameplay stitching, and viral SEO designed for 10 videos/day.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            onClick={handleQuickBatch}
            disabled={batchLoading}
            className="btn-primary"
            style={{ padding: "12px 24px", fontSize: "1rem" }}
          >
            <Layers size={18} />
            <span>{batchLoading ? "Queueing 10 Shorts..." : "Instant Daily Batch (10 Shorts)"}</span>
          </button>
          <Link href="/studio" className="btn-secondary" style={{ padding: "12px 20px", textDecoration: "none" }}>
            <Sparkles size={18} color="#facc15" />
            <span>Studio Creator</span>
          </Link>
        </div>
      </div>

      {/* Target Daily Progress Bar (Algorithm Trigger) */}
      <div className="glass-card" style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div>
            <h3 style={{ fontSize: "1rem", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
              <TrendingUp size={18} color="#10b981" />
              Daily Algorithm Velocity: {stats?.today_created ?? 0} / 10 Videos Created Today
            </h3>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Consistent high-frequency posting triggers the YouTube Shorts recommendation feed.
            </p>
          </div>
          <span style={{ fontSize: "1.2rem", fontWeight: "700", color: "#10b981" }}>
            {stats?.today_progress_pct ?? 0}%
          </span>
        </div>
        
        <div style={{ width: "100%", height: "10px", backgroundColor: "rgba(255, 255, 255, 0.06)", borderRadius: "6px", overflow: "hidden" }}>
          <div style={{
            width: `${Math.min(100, stats?.today_progress_pct ?? 0)}%`,
            height: "100%",
            background: "linear-gradient(90deg, #10b981 0%, #34d399 100%)",
            boxShadow: "0 0 12px rgba(16, 185, 129, 0.6)",
            transition: "width 0.5s ease"
          }} />
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        <div className="glass-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>READY TO UPLOAD</span>
            <CheckCircle2 size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "#ffffff" }}>{stats?.ready_count ?? 0}</div>
          <p style={{ fontSize: "0.75rem", color: "#34d399", marginTop: "4px" }}>Fully rendered & styled</p>
        </div>

        <div className="glass-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>ACTIVE QUEUE</span>
            <RefreshCw size={20} color="#facc15" />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "#ffffff" }}>{stats?.processing_count ?? 0}</div>
          <p style={{ fontSize: "0.75rem", color: "#facc15", marginTop: "4px" }}>Synthesizing in pipeline</p>
        </div>

        <div className="glass-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>SCHEDULED SLOTS</span>
            <Clock size={20} color="#60a5fa" />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "#ffffff" }}>{stats?.scheduled_count ?? 0}</div>
          <p style={{ fontSize: "0.75rem", color: "#60a5fa", marginTop: "4px" }}>In 24/7 calendar queue</p>
        </div>

        <div className="glass-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>TOTAL PUBLISHED</span>
            <Youtube size={20} color="#ef4444" />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "#ffffff" }}>{stats?.published_count ?? 0}</div>
          <p style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: "4px" }}>Live on YouTube Shorts</p>
        </div>
      </div>

      {/* Active Pipeline Queue */}
      {activeJobs.length > 0 && (
        <div className="glass-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "1.1rem", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="animate-pulse-slow" style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#facc15" }} />
              Live Pipeline Workers ({activeJobs.length} processing)
            </h2>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Auto-refreshing every 5s</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {activeJobs.map((job) => (
              <div key={job.id} style={{
                padding: "16px",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                flexDirection: "column",
                gap: "10px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: "600", fontSize: "0.9rem", color: "#ffffff" }}>{job.title}</span>
                  <span className="badge badge-processing">{job.current_step}</span>
                </div>
                <div style={{ width: "100%", height: "6px", backgroundColor: "rgba(255, 255, 255, 0.06)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{
                    width: `${job.progress}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #facc15 0%, #10b981 100%)",
                    transition: "width 0.3s ease"
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Videos Grid */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#ffffff" }}>Recently Generated Shorts</h2>
          <Link href="/library" style={{ fontSize: "0.85rem", color: "#10b981", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
            <span>View All ({stats?.total_library_count ?? 0})</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {recentVideos.length === 0 ? (
          <div className="glass-card" style={{ padding: "48px", textAlign: "center" }}>
            <Film size={40} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: "1.1rem", color: "#ffffff", marginBottom: "8px" }}>No Shorts Generated Yet</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "20px" }}>
              Launch your first automated video or queue up 10 shorts for today!
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
              <button onClick={handleQuickBatch} className="btn-primary">
                <Layers size={16} />
                <span>Generate 10 Shorts Now</span>
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "18px" }}>
            {recentVideos.map((video) => (
              <div
                key={video.id}
                className="glass-card"
                onClick={() => setSelectedVideo(video)}
                style={{
                  padding: "16px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}
              >
                {/* 9:16 Thumbnail Mock Preview */}
                <div style={{
                  aspectRatio: "9/16",
                  maxHeight: "220px",
                  borderRadius: "10px",
                  background: "linear-gradient(180deg, #1e293b 0%, #090d16 100%)",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden"
                }}>
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: "radial-gradient(circle at center, rgba(16, 185, 129, 0.15) 0%, transparent 70%)"
                  }} />
                  <div style={{
                    padding: "8px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    border: "1px solid rgba(255, 255, 255, 0.2)"
                  }}>
                    <Play size={20} color="#10b981" />
                  </div>
                  <span style={{
                    position: "absolute",
                    bottom: "8px",
                    right: "8px",
                    fontSize: "0.7rem",
                    background: "rgba(0,0,0,0.8)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    color: "#ffffff"
                  }}>
                    {video.duration_sec ? `${Math.round(video.duration_sec)}s` : "45s"}
                  </span>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span className={`badge badge-${video.status.toLowerCase()}`}>
                      {video.status}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      {video.niche_category}
                    </span>
                  </div>
                  <h4 style={{
                    fontSize: "0.95rem",
                    color: "#ffffff",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    lineHeight: 1.3
                  }}>
                    {video.seo_title || video.title}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Preview Modal */}
      <ShortPlayerModal
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
        onPublished={() => {
          loadData();
          setSelectedVideo(null);
        }}
      />
    </div>
  );
}
