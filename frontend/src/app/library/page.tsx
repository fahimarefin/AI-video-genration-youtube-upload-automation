"use client";

import React, { useState, useEffect } from "react";
import { 
  Film, 
  Search, 
  Play, 
  Download, 
  Youtube, 
  Clock, 
  CheckCircle2, 
  RefreshCw, 
  Trash2,
  Filter,
  BarChart3,
  Scissors,
  Eye,
  ThumbsUp
} from "lucide-react";
import { fetchVideos, deleteVideo, syncVideoAnalytics } from "@/lib/api";
import { VideoJob } from "@/lib/types";
import { ShortPlayerModal } from "@/components/video/ShortPlayerModal";

export default function LibraryPage() {
  const [videos, setVideos] = useState<VideoJob[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<VideoJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingAnalytics, setSyncingAnalytics] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const loadVideos = async () => {
    try {
      const data = await fetchVideos();
      setVideos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAnalytics = async () => {
    setSyncingAnalytics(true);
    setSyncFeedback(null);
    try {
      const res = await syncVideoAnalytics();
      await loadVideos();
      setSyncFeedback(`Synced ${res.synced_count} videos successfully!`);
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch (err: any) {
      alert("Failed to sync YouTube analytics: " + (err.message || err));
    } finally {
      setSyncingAnalytics(false);
    }
  };

  const handleDeleteVideo = async (e: React.MouseEvent, videoId: number, title: string) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      return;
    }
    try {
      await deleteVideo(videoId);
      await loadVideos();
    } catch (err) {
      alert("Failed to delete video: " + err);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const filtered = videos.filter((v) => {
    const matchesStatus = filterStatus === "ALL" || v.status === filterStatus;
    const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (v.seo_title && v.seo_title.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: "800", color: "#ffffff", marginBottom: "6px" }}>
            Minecraft Shorts Vault
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Manage generated videos, download MP4 renders, inspect SEO metadata, and track YouTube performance.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button 
            onClick={handleSyncAnalytics} 
            disabled={syncingAnalytics}
            className="btn-secondary"
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "8px", 
              borderColor: "rgba(16, 185, 129, 0.4)",
              background: "rgba(16, 185, 129, 0.1)"
            }}
          >
            <BarChart3 size={16} color="#10b981" />
            <span>{syncingAnalytics ? "Syncing YouTube..." : "Sync YouTube Analytics"}</span>
          </button>
          <button onClick={loadVideos} className="btn-secondary">
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div style={{
          padding: "12px 18px",
          borderRadius: "8px",
          background: "rgba(16, 185, 129, 0.15)",
          border: "1px solid #10b981",
          color: "#34d399",
          fontSize: "0.85rem",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <CheckCircle2 size={16} />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        {/* Filter Pills */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {["ALL", "READY", "SCHEDULED", "PUBLISHED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "0.8rem",
                fontWeight: "600",
                background: filterStatus === status ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.03)",
                border: filterStatus === status ? "1px solid #10b981" : "1px solid var(--border-subtle)",
                color: filterStatus === status ? "#34d399" : "var(--text-secondary)",
                cursor: "pointer"
              }}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: "relative", minWidth: "260px" }}>
          <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search titles or secrets..."
            style={{
              width: "100%",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              padding: "8px 12px 8px 36px",
              color: "#ffffff",
              fontSize: "0.85rem",
              outline: "none"
            }}
          />
        </div>
      </div>

      {/* Videos Grid */}
      {filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: "64px", textAlign: "center" }}>
          <Film size={48} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: "1.1rem", color: "#ffffff", marginBottom: "6px" }}>No Shorts Found</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Try adjusting your search query or generate new videos from the Studio or Batch Engine.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {filtered.map((video) => (
            <div
              key={video.id}
              className="glass-card"
              style={{
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                cursor: "pointer"
              }}
              onClick={() => setSelectedVideo(video)}
            >
              {/* Vertical 9:16 Mock Preview Thumbnail */}
              <div style={{
                height: "220px",
                backgroundColor: "#000",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(180deg, #1e293b 0%, #0a0e17 100%)"
              }}>
                {/* Delete button on thumbnail */}
                <button
                  onClick={(e) => handleDeleteVideo(e, video.id, video.seo_title || video.title)}
                  title="Delete Video"
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    background: "rgba(0, 0, 0, 0.65)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "8px",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#f87171",
                    cursor: "pointer",
                    zIndex: 5,
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.25)";
                    e.currentTarget.style.color = "#ffffff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(0, 0, 0, 0.65)";
                    e.currentTarget.style.color = "#f87171";
                  }}
                >
                  <Trash2 size={15} />
                </button>

                <div style={{
                  padding: "10px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.2)"
                }}>
                  <Play size={24} color="#10b981" />
                </div>
                <span style={{
                  position: "absolute",
                  bottom: "10px",
                  right: "10px",
                  background: "rgba(0,0,0,0.8)",
                  fontSize: "0.75rem",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  color: "#ffffff"
                }}>
                  {video.duration_sec ? `${Math.round(video.duration_sec)}s` : "45s"}
                </span>
              </div>

              {/* Card Body */}
              <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <span className={`badge badge-${video.status.toLowerCase()}`}>
                      {video.status}
                    </span>
                    {video.is_clipped && (
                      <span style={{
                        fontSize: "0.7rem",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: "rgba(16, 185, 129, 0.2)",
                        color: "#34d399",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}>
                        <Scissors size={11} />
                        Clipped
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {video.niche_category}
                  </span>
                </div>

                <h3 style={{
                  fontSize: "0.95rem",
                  color: "#ffffff",
                  lineHeight: 1.3,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical"
                }}>
                  {video.seo_title || video.title}
                </h3>

                {/* Published Metrics */}
                {video.status === "PUBLISHED" && (
                  <div style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    background: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    color: "#34d399"
                  }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Eye size={12} />
                      {video.views_count ?? 0} views
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <ThumbsUp size={12} />
                      {video.likes_count ?? 0} likes
                    </span>
                  </div>
                )}

                <div style={{
                  marginTop: "auto",
                  paddingTop: "12px",
                  borderTop: "1px solid var(--border-subtle)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {new Date(video.created_at).toLocaleDateString()}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <button
                      onClick={(e) => handleDeleteVideo(e, video.id, video.seo_title || video.title)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.75rem",
                        transition: "color 0.15s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                    <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: "600" }}>
                      Inspect →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Modal */}
      <ShortPlayerModal
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
        onPublished={() => {
          loadVideos();
          setSelectedVideo(null);
        }}
        onDeleted={() => {
          loadVideos();
          setSelectedVideo(null);
        }}
      />
    </div>
  );
}
