"use client";

import React, { useState } from "react";
import { X, Play, Pause, Youtube, Download, Copy, Check, Sparkles, Trash2, AlertTriangle, Settings, ExternalLink } from "lucide-react";
import { VideoJob } from "@/lib/types";
import { publishVideo, deleteVideo } from "@/lib/api";

interface ShortPlayerModalProps {
  video: VideoJob | null;
  onClose: () => void;
  onPublished?: () => void;
  onDeleted?: () => void;
}

export function ShortPlayerModal({ video, onClose, onPublished, onDeleted }: ShortPlayerModalProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);

  if (!video) return null;

  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishError(null);
    try {
      await publishVideo(video.id);
      if (onPublished) onPublished();
    } catch (err: any) {
      setPublishError(err.message || "Failed to publish video to YouTube");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to permanently delete "${video.title}"?`)) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteVideo(video.id);
      if (onDeleted) onDeleted();
      onClose();
    } catch (err) {
      alert("Error deleting video: " + err);
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text: string, type: "title" | "desc") => {
    navigator.clipboard.writeText(text);
    if (type === "title") {
      setCopiedTitle(true);
      setTimeout(() => setCopiedTitle(false), 2000);
    } else {
      setCopiedDesc(true);
      setTimeout(() => setCopiedDesc(false), 2000);
    }
  };

  const videoSrc = video.video_path ? `/storage/exports/${video.video_path}` : null;
  const audioSrc = video.audio_path ? `/storage/audio/${video.audio_path}` : null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0, 0, 0, 0.85)",
      backdropFilter: "blur(8px)",
      zIndex: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px"
    }}>
      <div className="glass-card" style={{
        maxWidth: "920px",
        width: "100%",
        maxHeight: "90vh",
        display: "flex",
        overflow: "hidden",
        position: "relative"
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "rgba(255, 255, 255, 0.1)",
            border: "none",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            cursor: "pointer",
            zIndex: 10
          }}
        >
          <X size={20} />
        </button>

        {/* Left: 9:16 Video Mock Player */}
        <div style={{
          flex: "0 0 340px",
          backgroundColor: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          padding: "20px"
        }}>
          <div className="shorts-container" style={{ width: "100%", height: "540px" }}>
            {videoSrc ? (
              <video
                src={videoSrc}
                autoPlay
                loop
                muted={false}
                controls
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
                padding: "24px",
                textAlign: "center"
              }}>
                <div style={{
                  padding: "12px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(16, 185, 129, 0.2)",
                  marginBottom: "16px"
                }}>
                  <Play size={28} color="#10b981" />
                </div>
                <h4 style={{ fontSize: "1rem", color: "#ffffff", marginBottom: "8px" }}>Short Preview</h4>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
                  {video.current_step || "Processing..."}
                </p>
                {audioSrc && (
                  <audio src={audioSrc} controls style={{ width: "90%", marginTop: "12px" }} />
                )}
                <div style={{
                  position: "absolute",
                  bottom: "40px",
                  padding: "8px 16px",
                  background: "rgba(0,0,0,0.8)",
                  borderRadius: "8px",
                  color: "#facc15",
                  fontWeight: "800",
                  fontSize: "1.1rem",
                  textShadow: "2px 2px 4px #000"
                }}>
                  MINECRAFT SECRET #1
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Metadata & Actions */}
        <div style={{ flex: 1, padding: "32px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span className={`badge badge-${video.status.toLowerCase()}`}>
                {video.status}
              </span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {video.niche_category} • {video.duration_sec}s
              </span>
            </div>
            <h3 style={{ fontSize: "1.35rem", color: "#ffffff", lineHeight: 1.3 }}>
              {video.seo_title || video.title}
            </h3>
          </div>

          {/* SEO Title Box */}
          <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase" }}>High-CTR Viral Title</span>
              <button
                onClick={() => copyToClipboard(video.seo_title || video.title, "title")}
                style={{ background: "none", border: "none", color: "#10b981", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem" }}
              >
                {copiedTitle ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedTitle ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <p style={{ fontSize: "0.9rem", color: "#f8fafc" }}>{video.seo_title || video.title}</p>
          </div>

          {/* Description & Hashtags */}
          <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase" }}>SEO Description & Tags</span>
              <button
                onClick={() => copyToClipboard(video.seo_description || "", "desc")}
                style={{ background: "none", border: "none", color: "#10b981", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem" }}
              >
                {copiedDesc ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedDesc ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <pre style={{
              fontSize: "0.8rem",
              color: "var(--text-secondary)",
              whiteSpace: "pre-wrap",
              maxHeight: "120px",
              overflowY: "auto",
              fontFamily: "inherit"
            }}>
              {video.seo_description || "No description generated yet."}
            </pre>
          </div>

          {/* Error Banner */}
          {publishError && (
            <div style={{
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              borderRadius: "10px",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f87171", fontWeight: "700", fontSize: "0.85rem" }}>
                <AlertTriangle size={16} />
                <span>YouTube Upload Failed</span>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
                {publishError}
              </p>
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <a
                  href="/channel"
                  style={{
                    fontSize: "0.78rem",
                    color: "#ffffff",
                    background: "#dc2626",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    textDecoration: "none",
                    fontWeight: "600",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <Settings size={14} />
                  <span>Configure YouTube Channel Credentials</span>
                </a>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ marginTop: "auto", display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              style={{
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "10px",
                padding: "10px 16px",
                color: "#f87171",
                fontWeight: "600",
                fontSize: "0.875rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s ease"
              }}
            >
              <Trash2 size={16} />
              <span>{isDeleting ? "Deleting..." : "Delete"}</span>
            </button>

            {video.video_path && (
              <a
                href={`/storage/exports/${video.video_path}`}
                download
                className="btn-secondary"
                style={{ textDecoration: "none", flex: 1 }}
              >
                <Download size={16} />
                <span>Download MP4</span>
              </a>
            )}

            {video.youtube_url && !video.youtube_video_id?.startsWith("mc_") && (
              <a
                href={video.youtube_url}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#ef4444",
                  border: "1px solid rgba(239, 68, 68, 0.3)"
                }}
              >
                <ExternalLink size={16} />
                <span>Watch on YouTube</span>
              </a>
            )}

            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="btn-primary"
              style={{
                flex: 1.2,
                background: video.status === "PUBLISHED" && !video.youtube_video_id?.startsWith("mc_")
                  ? "#047857"
                  : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                boxShadow: "0 4px 14px rgba(239, 68, 68, 0.3)"
              }}
            >
              <Youtube size={16} />
              <span>
                {isPublishing
                  ? "Uploading to YouTube..."
                  : video.status === "PUBLISHED" && !video.youtube_video_id?.startsWith("mc_")
                  ? "Published (Re-publish)"
                  : "Publish to YouTube"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
