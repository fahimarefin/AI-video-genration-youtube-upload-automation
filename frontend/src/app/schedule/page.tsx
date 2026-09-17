"use client";

import React, { useState, useEffect } from "react";
import { 
  CalendarClock, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Sparkles, 
  Youtube,
  Zap,
  Play
} from "lucide-react";
import { fetchScheduleSlots, autoSchedule, fetchVideos } from "@/lib/api";
import { ScheduleSlot, VideoJob } from "@/lib/types";

export default function SchedulePage() {
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [videos, setVideos] = useState<VideoJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);

  const loadData = async () => {
    try {
      const [s, v] = await Promise.all([fetchScheduleSlots(), fetchVideos()]);
      setSlots(s);
      setVideos(v);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAutoSchedule = async () => {
    setScheduling(true);
    try {
      const res = await autoSchedule();
      alert(res.message);
      await loadData();
    } catch (e) {
      alert("Auto scheduling failed: " + e);
    } finally {
      setScheduling(false);
    }
  };

  const getVideoForSlot = (videoJobId?: number) => {
    if (!videoJobId) return null;
    return videos.find((v) => v.id === videoJobId);
  };

  const filledCount = slots.filter((s) => s.video_job_id !== null).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span className="badge badge-scheduled">
              <Clock size={13} /> 24/7 Cadence Active
            </span>
          </div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: "800", color: "#ffffff", marginBottom: "6px" }}>
            24/7 Shorts Broadcast Schedule
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Automated calendar designed to post 10 Shorts per day at optimal audience activity windows.
          </p>
        </div>

        <button
          onClick={handleAutoSchedule}
          disabled={scheduling}
          className="btn-primary"
          style={{ padding: "12px 20px" }}
        >
          <Sparkles size={16} />
          <span>{scheduling ? "Matching Slots..." : "Auto-Fill All Slots"}</span>
        </button>
      </div>

      {/* Overview Stat Box */}
      <div className="glass-card" style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: "rgba(59, 130, 246, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(59, 130, 246, 0.3)"
          }}>
            <CalendarClock size={24} color="#60a5fa" />
          </div>
          <div>
            <h3 style={{ fontSize: "1.1rem", color: "#ffffff" }}>
              Daily Queue: {filledCount} of {slots.length} Slots Filled
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Posting spaced out across 1.5 - 2 hour intervals throughout the day and evening.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <span className="badge badge-ready">Auto-Pilot Active</span>
          <span className="badge badge-scheduled">Minecraft Niche Target</span>
        </div>
      </div>

      {/* Slots Timeline Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "18px" }}>
        {slots.map((slot, index) => {
          const assignedVideo = getVideoForSlot(slot.video_job_id);

          return (
            <div
              key={slot.id}
              className="glass-card"
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                border: assignedVideo ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid var(--border-subtle)",
                background: assignedVideo ? "rgba(16, 185, 129, 0.05)" : "var(--bg-card)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Clock size={16} color={assignedVideo ? "#10b981" : "var(--text-muted)"} />
                  <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "#ffffff" }}>
                    {slot.slot_time}
                  </span>
                </div>
                <span className={`badge ${assignedVideo ? "badge-ready" : "badge-failed"}`} style={{ fontSize: "0.7rem" }}>
                  {assignedVideo ? "ASSIGNED" : "EMPTY SLOT"}
                </span>
              </div>

              {/* Slot Content */}
              {assignedVideo ? (
                <div style={{
                  padding: "12px",
                  borderRadius: "8px",
                  background: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid var(--border-subtle)"
                }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                    READY SHORT #{assignedVideo.id}
                  </div>
                  <h4 style={{
                    fontSize: "0.85rem",
                    color: "#ffffff",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical"
                  }}>
                    {assignedVideo.seo_title || assignedVideo.title}
                  </h4>
                </div>
              ) : (
                <div style={{
                  padding: "20px",
                  borderRadius: "8px",
                  border: "1px dashed var(--border-subtle)",
                  textAlign: "center"
                }}>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    No short assigned yet.
                  </p>
                </div>
              )}

              <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                <span>Slot #{index + 1}</span>
                <span>Cadence: 24/7</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
