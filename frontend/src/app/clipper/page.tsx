"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Scissors,
  Sparkles,
  Upload,
  Play,
  Film,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  Wand2,
  Zap,
  Flame,
  Clock,
  Check,
  Sliders,
  FileVideo,
  Video
} from "lucide-react";
import {
  fetchClipperSources,
  uploadVideoForClipping,
  analyzeVideoMoments,
  createClip,
  createAllClips
} from "@/lib/api";
import {
  MediaSourceItem,
  ClippedMoment,
  AnalyzeResponse,
  VideoJob
} from "@/lib/types";

export default function ClipperPage() {
  const [sources, setSources] = useState<MediaSourceItem[]>([]);
  const [selectedSource, setSelectedSource] = useState<MediaSourceItem | null>(null);
  const [loadingSources, setLoadingSources] = useState(true);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analysis state & settings
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>("");
  const [minDuration, setMinDuration] = useState(25);
  const [maxDuration, setMaxDuration] = useState(55);
  const [numMoments, setNumMoments] = useState(3);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResponse | null>(null);

  // Short formatting options
  const [reframeMode, setReframeMode] = useState<"center_crop" | "blur_background">("center_crop");
  const [subtitleStyle, setSubtitleStyle] = useState("yellow_glow");

  // Clip creation state
  const [generatingMoments, setGeneratingMoments] = useState<Record<string, boolean>>({});
  const [createdJobs, setCreatedJobs] = useState<Record<string, VideoJob>>({});
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchFeedback, setBatchFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load sources on mount
  const loadSources = async () => {
    try {
      setLoadingSources(true);
      const data = await fetchClipperSources();
      setSources(data);
      if (data.length > 0 && !selectedSource) {
        setSelectedSource(data[0]);
      }
    } catch (err: any) {
      console.error("Error loading clipper sources:", err);
    } finally {
      setLoadingSources(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024 * 1024) {
      setErrorMessage("File exceeds 500MB limit. Please choose a smaller video.");
      return;
    }

    setUploading(true);
    setErrorMessage(null);
    try {
      const uploadedItem = await uploadVideoForClipping(file);
      await loadSources();
      setSelectedSource(uploadedItem);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to upload video file");
    } finally {
      setUploading(false);
    }
  };

  // Run AI Video Analysis
  const handleAnalyze = async () => {
    if (!selectedSource) {
      setErrorMessage("Please select or upload a video source first.");
      return;
    }

    setAnalyzing(true);
    setErrorMessage(null);
    setAnalysisStep("Extracting audio & transcribing with OpenAI Whisper...");

    const stepTimer = setTimeout(() => {
      setAnalysisStep("Analyzing speech patterns & high-retention hooks with GPT-4o...");
    }, 3500);

    try {
      const res = await analyzeVideoMoments({
        video_path: selectedSource.path || selectedSource.name,
        target_clips: numMoments,
        min_duration: minDuration,
        max_duration: maxDuration,
        num_moments: numMoments
      });
      setAnalysisResult(res);
    } catch (err: any) {
      setErrorMessage(err.message || "AI video analysis failed. Please verify OpenAI API key.");
    } finally {
      clearTimeout(stepTimer);
      setAnalyzing(false);
      setAnalysisStep("");
    }
  };

  // Generate single 9:16 clip
  const handleCreateClip = async (moment: ClippedMoment, idx: number) => {
    if (!selectedSource) return;

    const momentKey = moment.id || `moment_${idx}`;
    setGeneratingMoments((prev) => ({ ...prev, [momentKey]: true }));
    setErrorMessage(null);

    const start = moment.start_sec ?? moment.start_time ?? 0;
    const end = moment.end_sec ?? moment.end_time ?? (start + (moment.duration || 30));

    try {
      const job = await createClip({
        video_path: selectedSource.path || selectedSource.name,
        start_sec: start,
        end_sec: end,
        title: moment.title,
        hook: moment.hook,
        subtitle_style: subtitleStyle,
        reframe_mode: reframeMode
      });
      setCreatedJobs((prev) => ({ ...prev, [momentKey]: job }));
    } catch (err: any) {
      setErrorMessage(err.message || `Failed to create clip for moment "${moment.title}"`);
    } finally {
      setGeneratingMoments((prev) => ({ ...prev, [momentKey]: false }));
    }
  };

  // Batch generate all moments
  const handleCreateAll = async () => {
    if (!selectedSource || !analysisResult || !analysisResult.moments || analysisResult.moments.length === 0) return;

    setBatchGenerating(true);
    setBatchFeedback(null);
    setErrorMessage(null);

    try {
      const res = await createAllClips({
        video_path: selectedSource.path || selectedSource.name,
        moments: analysisResult.moments,
        subtitle_style: subtitleStyle,
        reframe_mode: reframeMode
      });
      setBatchFeedback(`Successfully created ${res.total_created} viral 9:16 Shorts in the Vault!`);
      const newCreated: Record<string, VideoJob> = { ...createdJobs };
      res.jobs.forEach((j, idx) => {
        const m = analysisResult.moments[idx];
        const k = m?.id || `moment_${idx}`;
        newCreated[k] = j;
      });
      setCreatedJobs(newCreated);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to batch create clips");
    } finally {
      setBatchGenerating(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span style={{
              fontSize: "0.72rem",
              fontWeight: "700",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "4px 10px",
              borderRadius: "20px",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#34d399",
              border: "1px solid rgba(16, 185, 129, 0.3)"
            }}>
              AI Long-Form Repurposer
            </span>
            <span style={{
              fontSize: "0.72rem",
              fontWeight: "700",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "4px 10px",
              borderRadius: "20px",
              background: "rgba(59, 130, 246, 0.15)",
              color: "#60a5fa",
              border: "1px solid rgba(59, 130, 246, 0.3)"
            }}>
              9:16 Vertical Video Engine
            </span>
          </div>
          <h1 style={{ fontSize: "1.9rem", fontWeight: "800", color: "#ffffff", marginBottom: "6px" }}>
            AI Video Analyzer & Viral Clipper
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "800px", lineHeight: "1.5" }}>
            Convert long videos and gameplay into high-retention 9:16 vertical YouTube Shorts.
            AI identifies peak viral moments, cuts lossless clips, burns animated retention captions, and formats for maximum engagement.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Link href="/library" className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
            <Film size={16} />
            <span>Shorts Vault</span>
          </Link>
        </div>
      </div>

      {/* Error & Feedback Alerts */}
      {errorMessage && (
        <div style={{
          padding: "14px 18px",
          borderRadius: "10px",
          background: "rgba(239, 68, 68, 0.12)",
          border: "1px solid #ef4444",
          color: "#fca5a5",
          fontSize: "0.85rem",
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}>
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {batchFeedback && (
        <div style={{
          padding: "14px 18px",
          borderRadius: "10px",
          background: "rgba(16, 185, 129, 0.15)",
          border: "1px solid #10b981",
          color: "#34d399",
          fontSize: "0.85rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <CheckCircle2 size={18} />
            <span>{batchFeedback}</span>
          </div>
          <Link
            href="/library"
            style={{
              background: "#10b981",
              color: "#ffffff",
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "0.8rem",
              fontWeight: "600",
              textDecoration: "none"
            }}
          >
            View in Vault →
          </Link>
        </div>
      )}

      {/* Main Grid Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "24px", alignItems: "start" }}>
        
        {/* LEFT COLUMN: Source Video & Analysis Settings */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Video Selector Card */}
          <div className="glass-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
                <Film size={18} color="#10b981" />
                1. Select Source Video
              </h3>
              <button
                onClick={loadSources}
                title="Refresh Sources"
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {/* Video List */}
            {loadingSources ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                Loading source videos...
              </div>
            ) : sources.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                No video sources found. Upload an MP4 video below.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "240px", overflowY: "auto", marginBottom: "16px", paddingRight: "4px" }}>
                {sources.map((src) => {
                  const isSelected = selectedSource?.path === src.path;
                  const dur = src.duration_sec ?? src.duration_seconds;
                  const size = src.file_size_mb ?? src.size_mb ?? 0;
                  return (
                    <div
                      key={src.path}
                      onClick={() => setSelectedSource(src)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: isSelected ? "1px solid #10b981" : "1px solid var(--border-subtle)",
                        background: isSelected ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 255, 255, 0.02)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <FileVideo size={16} color={isSelected ? "#10b981" : "var(--text-muted)"} />
                        <div style={{ minWidth: 0 }}>
                          <p style={{
                            fontSize: "0.82rem",
                            fontWeight: isSelected ? "600" : "500",
                            color: isSelected ? "#ffffff" : "var(--text-secondary)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}>
                            {src.name}
                          </p>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                            {dur ? `${Math.round(dur)}s` : "60s"} • {size} MB
                          </span>
                        </div>
                      </div>
                      {isSelected && <Check size={14} color="#10b981" />}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="video/mp4,video/quicktime,video/webm,video/mkv"
              style={{ display: "none" }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-secondary"
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "0.82rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                borderStyle: "dashed"
              }}
            >
              <Upload size={14} />
              <span>{uploading ? "Uploading Video..." : "Upload Long-Form MP4 / MOV"}</span>
            </button>
          </div>

          {/* AI Analyzer Parameters */}
          <div className="glass-card" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <Sliders size={18} color="#10b981" />
              2. Analysis Settings
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "6px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Moment Duration Range</span>
                  <span style={{ color: "#34d399", fontWeight: "600" }}>{minDuration}s – {maxDuration}s</span>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <input
                    type="range"
                    min="15"
                    max="45"
                    value={minDuration}
                    onChange={(e) => setMinDuration(Number(e.target.value))}
                    style={{ flex: 1, accentColor: "#10b981" }}
                  />
                  <input
                    type="range"
                    min="45"
                    max="60"
                    value={maxDuration}
                    onChange={(e) => setMaxDuration(Number(e.target.value))}
                    style={{ flex: 1, accentColor: "#10b981" }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "6px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Moments to Detect</span>
                  <span style={{ color: "#34d399", fontWeight: "600" }}>{numMoments} Highlights</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={numMoments}
                  onChange={(e) => setNumMoments(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#10b981" }}
                />
              </div>

              <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "14px" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>
                  Vertical 9:16 Reframe Mode
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setReframeMode("center_crop")}
                    style={{
                      padding: "8px",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      background: reframeMode === "center_crop" ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.04)",
                      border: reframeMode === "center_crop" ? "1px solid #10b981" : "1px solid var(--border-subtle)",
                      color: reframeMode === "center_crop" ? "#34d399" : "var(--text-secondary)",
                      cursor: "pointer"
                    }}
                  >
                    Center Crop (9:16)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReframeMode("blur_background")}
                    style={{
                      padding: "8px",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      background: reframeMode === "blur_background" ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.04)",
                      border: reframeMode === "blur_background" ? "1px solid #10b981" : "1px solid var(--border-subtle)",
                      color: reframeMode === "blur_background" ? "#34d399" : "var(--text-secondary)",
                      cursor: "pointer"
                    }}
                  >
                    Blur Background
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>
                  Burn-in Captions Preset
                </label>
                <select
                  value={subtitleStyle}
                  onChange={(e) => setSubtitleStyle(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    color: "#ffffff",
                    fontSize: "0.8rem",
                    outline: "none"
                  }}
                >
                  <option value="yellow_glow" style={{ background: "#0e0e12" }}>🔥 TikTok Bold Yellow Glow</option>
                  <option value="clean_white" style={{ background: "#0e0e12" }}>✨ Clean Minimal White</option>
                  <option value="neon_box" style={{ background: "#0e0e12" }}>🟩 Neon Cyber Boxed</option>
                </select>
              </div>

              {/* Big Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={analyzing || !selectedSource}
                className="btn-primary"
                style={{
                  width: "100%",
                  padding: "14px",
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  marginTop: "8px",
                  boxShadow: "0 0 20px rgba(16, 185, 129, 0.3)"
                }}
              >
                <Sparkles size={18} />
                <span>{analyzing ? "AI Analyzing Video..." : "Detect High-Performing Moments"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Results & High-Performing Moments */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Analyzing Loading Banner */}
          {analyzing && (
            <div className="glass-card" style={{ padding: "40px", textAlign: "center", background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
              <div style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                boxShadow: "0 0 25px rgba(16, 185, 129, 0.4)"
              }}>
                <Wand2 size={28} color="#10b981" />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#ffffff", marginBottom: "8px" }}>
                AI Video Analysis in Progress
              </h3>
              <p style={{ color: "#34d399", fontSize: "0.9rem", fontWeight: "500", marginBottom: "12px" }}>
                {analysisStep}
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", maxWidth: "500px", margin: "0 auto" }}>
                Scanning audio transcription, calculating narrative retention curve, identifying opening hooks, and ranking clip virality scores.
              </p>
            </div>
          )}

          {/* Initial Blank State (Before analysis) */}
          {!analyzing && !analysisResult && (
            <div className="glass-card" style={{ padding: "50px 30px", textAlign: "center" }}>
              <div style={{
                width: "64px",
                height: "64px",
                borderRadius: "16px",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px"
              }}>
                <Scissors size={30} color="#10b981" />
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#ffffff", marginBottom: "10px" }}>
                Ready to Extract Viral YouTube Shorts
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", maxWidth: "560px", margin: "0 auto 28px", lineHeight: "1.6" }}>
                Select an existing gameplay recording or upload a long-form video, then click <strong>Detect High-Performing Moments</strong>. The AI will inspect narrative hooks, pacing, and viral triggers.
              </p>

              {/* 3 Step Feature Highlights */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", textAlign: "left", maxWidth: "750px", margin: "0 auto" }}>
                <div style={{ padding: "16px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ color: "#10b981", fontWeight: "700", fontSize: "0.85rem", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Zap size={15} /> 1. Moment Detection
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", lineHeight: "1.4" }}>
                    Whisper AI transcribes speech & GPT-4o identifies peak emotional or educational spikes.
                  </p>
                </div>

                <div style={{ padding: "16px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ color: "#60a5fa", fontWeight: "700", fontSize: "0.85rem", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Video size={15} /> 2. 9:16 Re-Framing
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", lineHeight: "1.4" }}>
                    Converts horizontal 16:9 into crisp vertical 1080x1920 with centered focus or blurred canvas.
                  </p>
                </div>

                <div style={{ padding: "16px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ color: "#facc15", fontWeight: "700", fontSize: "0.85rem", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Flame size={15} /> 3. Captions & SEO
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", lineHeight: "1.4" }}>
                    Burns high-contrast animated subtitles, generates viral titles, hashtags, and description tags.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Analysis Results Grid */}
          {!analyzing && analysisResult && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Results Action Bar */}
              <div className="glass-card" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>Found {analysisResult.moments?.length || analysisResult.total_moments_found || 0} High-Performing Moments</span>
                    <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "4px", background: "rgba(16, 185, 129, 0.2)", color: "#34d399" }}>
                      AI Analyzed
                    </span>
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Source: {analysisResult.video_info?.filename || (analysisResult.source_video ? analysisResult.source_video.split("/").pop() : selectedSource?.name) || "Video"} • {Math.round(analysisResult.duration_seconds ?? analysisResult.video_info?.duration_sec ?? 60)}s duration
                  </p>
                </div>

                <button
                  onClick={handleCreateAll}
                  disabled={batchGenerating}
                  className="btn-primary"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 18px",
                    fontSize: "0.85rem",
                    fontWeight: "600"
                  }}
                >
                  <Layers size={16} />
                  <span>{batchGenerating ? "Batch Generating All Shorts..." : `Batch Create All (${analysisResult.moments?.length || 0}) Shorts`}</span>
                </button>
              </div>

              {/* Moment Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {analysisResult.moments?.map((moment, idx) => {
                  const momentKey = moment.id || `moment_${idx}`;
                  const isGenerating = generatingMoments[momentKey] || batchGenerating;
                  const createdJob = createdJobs[momentKey];
                  const scoreColor = moment.virality_score >= 90 ? "#10b981" : moment.virality_score >= 80 ? "#3b82f6" : "#facc15";

                  const start = moment.start_sec ?? moment.start_time ?? 0;
                  const end = moment.end_sec ?? moment.end_time ?? (start + (moment.duration || 30));
                  const dur = moment.duration ?? (end - start);

                  const rawTags = moment.tags || (moment.keywords ? moment.keywords.join(", ") : "");
                  const tagList = rawTags ? rawTags.split(",").map((t) => t.trim()).filter(Boolean) : [];

                  return (
                    <div
                      key={momentKey}
                      className="glass-card"
                      style={{
                        padding: "22px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "14px",
                        borderLeft: `4px solid ${scoreColor}`
                      }}
                    >
                      {/* Top Meta Bar */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {/* Virality Badge */}
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 12px",
                            borderRadius: "20px",
                            background: `${scoreColor}20`,
                            border: `1px solid ${scoreColor}50`,
                            color: scoreColor,
                            fontWeight: "700",
                            fontSize: "0.8rem"
                          }}>
                            <Flame size={14} />
                            <span>{moment.virality_score}/100 Virality Score</span>
                          </div>

                          {/* Timestamp Pill */}
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            background: "rgba(255, 255, 255, 0.05)",
                            fontSize: "0.75rem",
                            color: "var(--text-secondary)"
                          }}>
                            <Clock size={13} />
                            <span>{Math.round(start)}s – {Math.round(end)}s ({Math.round(dur)}s)</span>
                          </div>
                        </div>

                        {/* Action CTA */}
                        {createdJob ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "0.78rem", color: "#34d399", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                              <CheckCircle2 size={14} /> Ready in Vault
                            </span>
                            <Link
                              href="/library"
                              style={{
                                background: "rgba(16, 185, 129, 0.15)",
                                border: "1px solid #10b981",
                                color: "#34d399",
                                padding: "6px 14px",
                                borderRadius: "6px",
                                fontSize: "0.8rem",
                                fontWeight: "600",
                                textDecoration: "none",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                            >
                              Inspect Short →
                            </Link>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleCreateClip(moment, idx)}
                            disabled={isGenerating}
                            className="btn-primary"
                            style={{
                              padding: "8px 16px",
                              fontSize: "0.82rem",
                              fontWeight: "600",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px"
                            }}
                          >
                            <Scissors size={14} />
                            <span>{isGenerating ? "Rendering 9:16 Short..." : "Create 9:16 Short"}</span>
                          </button>
                        )}
                      </div>

                      {/* Moment Title & Hook */}
                      <div>
                        <h4 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#ffffff", marginBottom: "6px" }}>
                          {moment.title}
                        </h4>
                        <div style={{
                          padding: "10px 14px",
                          borderRadius: "8px",
                          background: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid var(--border-subtle)",
                          fontSize: "0.85rem",
                          color: "#f8fafc",
                          fontStyle: "italic",
                          lineHeight: "1.4"
                        }}>
                          "{moment.hook || moment.suggested_caption || moment.title}"
                        </div>
                      </div>

                      {/* Virality Reason & SEO Keywords */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", fontSize: "0.78rem" }}>
                        <div style={{ color: "var(--text-muted)", maxWidth: "550px" }}>
                          <strong style={{ color: "var(--text-secondary)" }}>Viral Trigger: </strong>
                          {moment.summary || moment.key_reason || "Strong retention hook and rapid pacing."}
                        </div>

                        {tagList.length > 0 && (
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            {tagList.map((tag, i) => (
                              <span
                                key={i}
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                  background: "rgba(59, 130, 246, 0.1)",
                                  color: "#60a5fa",
                                  fontSize: "0.72rem"
                                }}
                              >
                                {tag.startsWith("#") ? tag : `#${tag}`}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
