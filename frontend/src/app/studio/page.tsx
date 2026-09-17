"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Mic, 
  Video, 
  Type, 
  Check, 
  RefreshCw, 
  Play, 
  Film,
  Send,
  Sliders,
  Flame,
  Zap,
  Wand2
} from "lucide-react";
import { generateScript, refineScript, fetchPresetTopics, fetchVoices, createVideoJob } from "@/lib/api";
import { Script, VoiceOption, VideoJob } from "@/lib/types";
import { ShortPlayerModal } from "@/components/video/ShortPlayerModal";

const TONE_PRESETS = [
  { id: "Viral Hype", label: "⚡ Viral Hype" },
  { id: "Dark Lore", label: "🌑 Dark Lore" },
  { id: "Speedrun", label: "⏱️ Speedrun" },
  { id: "Glitches", label: "👾 Glitches" },
  { id: "Mind-Blowing", label: "🤯 Mind-Blowing" },
  { id: "Meme", label: "🤡 Sarcastic/Meme" },
];

export default function StudioPage() {
  const [topic, setTopic] = useState("");
  const [nicheCategory, setNicheCategory] = useState("Minecraft Facts");
  const [targetDuration, setTargetDuration] = useState(45);
  const [selectedVoice, setSelectedVoice] = useState("onyx");
  const [gameplayClip, setGameplayClip] = useState("minecraft_parkour.mp4");
  const [subtitleStyle, setSubtitleStyle] = useState("yellow_glow");
  
  const [presets, setPresets] = useState<any[]>([]);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [script, setScript] = useState<Script | null>(null);
  
  const [generatingScript, setGeneratingScript] = useState(false);
  const [renderingVideo, setRenderingVideo] = useState(false);
  const [createdJob, setCreatedJob] = useState<VideoJob | null>(null);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStep, setRenderStep] = useState("");

  const [selectedTone, setSelectedTone] = useState("Viral Hype");
  const [refiningAction, setRefiningAction] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [variationCount, setVariationCount] = useState(1);

  useEffect(() => {
    fetchPresetTopics().then(setPresets);
    fetchVoices().then(setVoices);
  }, []);

  const handleGenerateScript = async (customTopic?: string) => {
    setGeneratingScript(true);
    try {
      const effectiveTopic = customTopic || topic || undefined;
      // Pass previous script text to ensure AI writes a fresh variation every single click
      const previousScript = script?.full_text;
      const s = await generateScript({
        topic: effectiveTopic,
        niche_category: nicheCategory,
        target_duration_sec: targetDuration,
        voice_id: selectedVoice,
        previous_text: previousScript,
        tone: selectedTone,
      });
      setScript(s);
      setTopic(s.topic);
      setVariationCount((v) => v + 1);
    } catch (err) {
      alert("Error generating script: " + err);
    } finally {
      setGeneratingScript(false);
    }
  };

  const handleRefineScript = async (
    action: "regenerate" | "rewrite_hook" | "rewrite_body" | "rewrite_cta" | "change_tone" | "custom",
    toneOverride?: string,
    instructionText?: string
  ) => {
    if (!script) return;
    setRefiningAction(action);
    try {
      const toneToUse = toneOverride || selectedTone;
      const updated = await refineScript({
        script_id: script.id,
        topic: script.topic || topic,
        hook: script.hook,
        body: script.body,
        cta: script.cta,
        action,
        tone: toneToUse,
        instruction: instructionText || (action === "custom" ? customPrompt : undefined),
        voice_id: selectedVoice,
        niche_category: nicheCategory,
      });
      setScript(updated);
      if (toneOverride) setSelectedTone(toneOverride);
      if (action === "custom") setCustomPrompt("");
      if (action === "regenerate") setVariationCount((v) => v + 1);
    } catch (err) {
      alert("Error refining script: " + err);
    } finally {
      setRefiningAction(null);
    }
  };

  const updateScriptField = (field: "hook" | "body" | "cta", val: string) => {
    if (!script) return;
    const updated = { ...script, [field]: val };
    const fullText = `${updated.hook} ${updated.body} ${updated.cta}`.trim();
    const words = fullText.split(/\s+/).filter(Boolean);
    updated.full_text = fullText;
    updated.word_count = words.length;
    updated.estimated_duration_sec = Math.max(15, Math.min(60, Math.round(words.length / 2.5)));
    setScript(updated);
  };

  const handleRenderShort = async () => {
    if (!script) return;
    setRenderingVideo(true);
    setRenderProgress(10);
    setRenderStep("Initializing rendering job...");

    try {
      const job = await createVideoJob({
        topic: script.topic,
        title: script.topic,
        script_id: script.id,
        voice_id: selectedVoice,
        gameplay_clip: gameplayClip,
        bg_music: "minecraft_ambient.mp3",
        subtitle_style: subtitleStyle,
      });

      setCreatedJob(job);
      
      // Poll progress until complete
      const checkInterval = setInterval(async () => {
        try {
          const res = await fetch(`/api/v1/videos/${job.id}`);
          if (res.ok) {
            const updated = await res.json();
            setCreatedJob(updated);
            setRenderProgress(updated.progress);
            setRenderStep(updated.current_step);

            if (["READY", "FAILED"].includes(updated.status)) {
              clearInterval(checkInterval);
              setRenderingVideo(false);
            }
          }
        } catch (e) {
          clearInterval(checkInterval);
          setRenderingVideo(false);
        }
      }, 1500);

    } catch (err) {
      alert("Render failed: " + err);
      setRenderingVideo(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.85rem", fontWeight: "800", color: "#ffffff", marginBottom: "6px" }}>
          Shorts Creation Studio
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Interactive step-by-step Short generator with AI scriptwriting, neural voiceovers, and vertical composition.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "24px" }}>
        {/* Left Column: Script & Settings */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Step 1: Topic Input */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <span style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "#10b981",
                color: "#000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                fontSize: "0.8rem"
              }}>1</span>
              <h2 style={{ fontSize: "1.1rem", color: "#ffffff" }}>Choose or Prompt a Minecraft Topic</h2>
            </div>

            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. 3 Insane Glitches In Minecraft 1.21 or The Darkest Secret of Herobrine..."
                style={{
                  flex: 1,
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  color: "#ffffff",
                  fontSize: "0.9rem",
                  outline: "none"
                }}
              />
              <button
                onClick={() => handleGenerateScript()}
                disabled={generatingScript}
                className="btn-primary"
              >
                <Sparkles size={16} />
                <span>{generatingScript ? "Writing Script..." : "Generate AI Script"}</span>
              </button>
            </div>

            {/* Quick Topic Chips */}
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>
                Viral Presets (Minecraft Niche):
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                {presets.slice(0, 5).map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setTopic(p.topic);
                      handleGenerateScript(p.topic);
                    }}
                    style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "20px",
                      padding: "6px 12px",
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {p.topic}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 2: AI Script Editor */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: "#10b981",
                  color: "#000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "0.8rem"
                }}>2</span>
                <h2 style={{ fontSize: "1.1rem", color: "#ffffff" }}>Short Script & Retention Structure</h2>
              </div>
              {script && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "0.75rem", color: "#34d399", background: "rgba(16, 185, 129, 0.15)", padding: "4px 8px", borderRadius: "6px", fontWeight: "600" }}>
                    {script.word_count} Words • ~{script.estimated_duration_sec}s
                  </span>
                  <button
                    onClick={() => handleRefineScript("regenerate")}
                    disabled={Boolean(refiningAction) || generatingScript}
                    style={{
                      background: "rgba(16, 185, 129, 0.12)",
                      border: "1px solid rgba(16, 185, 129, 0.4)",
                      color: "#34d399",
                      padding: "5px 12px",
                      borderRadius: "8px",
                      fontSize: "0.8rem",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    title="Ask AI to regenerate a completely different angle and facts for this topic"
                  >
                    <RefreshCw size={13} style={{ animation: refiningAction === "regenerate" ? "spin 1s linear infinite" : "none" }} />
                    <span>{refiningAction === "regenerate" ? "Re-writing with AI..." : "🔄 Change Script with AI"}</span>
                  </button>
                </div>
              )}
            </div>

            {script ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Tone Style Selector Bar */}
                <div style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700" }}>
                      AI Script Tone / Vibe:
                    </span>
                    {refiningAction === "change_tone" && (
                      <span style={{ fontSize: "0.75rem", color: "#38bdf8", display: "flex", alignItems: "center", gap: "4px" }}>
                        <RefreshCw size={11} style={{ animation: "spin 1s linear infinite" }} /> Rewriting tone with AI...
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {TONE_PRESETS.map((t) => {
                      const isActive = selectedTone === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => handleRefineScript("change_tone", t.id)}
                          disabled={Boolean(refiningAction)}
                          style={{
                            background: isActive ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.04)",
                            border: isActive ? "1px solid #10b981" : "1px solid var(--border-subtle)",
                            color: isActive ? "#34d399" : "var(--text-secondary)",
                            borderRadius: "20px",
                            padding: "4px 10px",
                            fontSize: "0.75rem",
                            fontWeight: isActive ? "600" : "500",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 0-3S VIRAL HOOK */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: "700", color: "#facc15", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
                      🔥 0-3s Viral Hook (Stop The Scroll)
                    </label>
                    <button
                      onClick={() => handleRefineScript("rewrite_hook")}
                      disabled={Boolean(refiningAction)}
                      style={{
                        background: "rgba(250, 204, 21, 0.1)",
                        border: "1px solid rgba(250, 204, 21, 0.3)",
                        color: "#facc15",
                        borderRadius: "6px",
                        padding: "3px 8px",
                        fontSize: "0.72rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Sparkles size={11} style={{ animation: refiningAction === "rewrite_hook" ? "spin 1s linear infinite" : "none" }} />
                      <span>{refiningAction === "rewrite_hook" ? "Rewriting..." : "✨ Rewrite Hook"}</span>
                    </button>
                  </div>
                  <textarea
                    value={script.hook}
                    onChange={(e) => updateScriptField("hook", e.target.value)}
                    rows={2}
                    style={{
                      width: "100%",
                      background: "rgba(250, 204, 21, 0.05)",
                      border: "1px solid rgba(250, 204, 21, 0.2)",
                      borderRadius: "8px",
                      padding: "10px",
                      color: "#ffffff",
                      fontSize: "0.875rem",
                      outline: "none",
                      resize: "vertical"
                    }}
                  />
                </div>

                {/* CORE BODY POINTS & FACTS */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
                      💡 Core Body Points & Facts
                    </label>
                    <button
                      onClick={() => handleRefineScript("rewrite_body")}
                      disabled={Boolean(refiningAction)}
                      style={{
                        background: "rgba(255, 255, 255, 0.08)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        color: "#ffffff",
                        borderRadius: "6px",
                        padding: "3px 8px",
                        fontSize: "0.72rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Sparkles size={11} style={{ animation: refiningAction === "rewrite_body" ? "spin 1s linear infinite" : "none" }} />
                      <span>{refiningAction === "rewrite_body" ? "Generating..." : "✨ New Facts"}</span>
                    </button>
                  </div>
                  <textarea
                    value={script.body}
                    onChange={(e) => updateScriptField("body", e.target.value)}
                    rows={4}
                    style={{
                      width: "100%",
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "8px",
                      padding: "10px",
                      color: "#ffffff",
                      fontSize: "0.875rem",
                      outline: "none",
                      resize: "vertical"
                    }}
                  />
                </div>

                {/* CALL TO ACTION */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: "700", color: "#34d399", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
                      🚀 Call To Action (Subscribers & Retention)
                    </label>
                    <button
                      onClick={() => handleRefineScript("rewrite_cta")}
                      disabled={Boolean(refiningAction)}
                      style={{
                        background: "rgba(16, 185, 129, 0.1)",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        color: "#34d399",
                        borderRadius: "6px",
                        padding: "3px 8px",
                        fontSize: "0.72rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Sparkles size={11} style={{ animation: refiningAction === "rewrite_cta" ? "spin 1s linear infinite" : "none" }} />
                      <span>{refiningAction === "rewrite_cta" ? "Writing..." : "✨ New CTA"}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={script.cta}
                    onChange={(e) => updateScriptField("cta", e.target.value)}
                    style={{
                      width: "100%",
                      background: "rgba(16, 185, 129, 0.05)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      borderRadius: "8px",
                      padding: "10px",
                      color: "#ffffff",
                      fontSize: "0.875rem",
                      outline: "none"
                    }}
                  />
                </div>

                {/* Custom AI Adjustment Bar */}
                <div style={{
                  background: "rgba(56, 189, 248, 0.04)",
                  border: "1px solid rgba(56, 189, 248, 0.2)",
                  borderRadius: "10px",
                  padding: "12px",
                  marginTop: "4px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <Sparkles size={14} color="#38bdf8" />
                    <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#38bdf8" }}>
                      Custom AI Script Editor
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      (Instruct AI to adapt or change this script)
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && customPrompt.trim() && !refiningAction) {
                          handleRefineScript("custom");
                        }
                      }}
                      placeholder="e.g. Make it sound darker, add a cliffhanger, mention Herobrine..."
                      style={{
                        flex: 1,
                        background: "rgba(0, 0, 0, 0.25)",
                        border: "1px solid rgba(56, 189, 248, 0.25)",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        color: "#ffffff",
                        fontSize: "0.82rem",
                        outline: "none"
                      }}
                    />
                    <button
                      onClick={() => handleRefineScript("custom")}
                      disabled={!customPrompt.trim() || Boolean(refiningAction)}
                      style={{
                        background: customPrompt.trim() ? "#0284c7" : "rgba(255, 255, 255, 0.05)",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        padding: "0 14px",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        cursor: customPrompt.trim() && !refiningAction ? "pointer" : "not-allowed",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <Sparkles size={13} style={{ animation: refiningAction === "custom" ? "spin 1s linear infinite" : "none" }} />
                      <span>{refiningAction === "custom" ? "Applying..." : "Apply AI"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)" }}>
                <Type size={32} style={{ margin: "0 auto 12px" }} />
                <p style={{ fontSize: "0.85rem" }}>Select a topic above and click "Generate AI Script" to preview.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Audio, Gameplay & Render Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Step 3: Voiceover & Gameplay Style */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <span style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "#10b981",
                color: "#000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                fontSize: "0.8rem"
              }}>3</span>
              <h2 style={{ fontSize: "1.1rem", color: "#ffffff" }}>Voiceover & Visual Presets</h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Voice Selector */}
              <div>
                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600", display: "block", marginBottom: "6px" }}>
                  AI Neural Voice
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
                    fontSize: "0.875rem",
                    outline: "none"
                  }}
                >
                  {voices.map((v) => (
                    <option key={v.id} value={v.id} style={{ background: "#18181b", color: "#fff" }}>
                      {v.name} ({v.vibe})
                    </option>
                  ))}
                </select>
              </div>

              {/* Gameplay Footage */}
              <div>
                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600", display: "block", marginBottom: "6px" }}>
                  Background Gameplay Footage (9:16 Vertical)
                </label>
                <select
                  value={gameplayClip}
                  onChange={(e) => setGameplayClip(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    color: "#ffffff",
                    fontSize: "0.875rem",
                    outline: "none"
                  }}
                >
                  <option value="minecraft_parkour.mp4" style={{ background: "#18181b", color: "#fff" }}>Spiral Parkour Speedrun</option>
                  <option value="minecraft_nether.mp4" style={{ background: "#18181b", color: "#fff" }}>Nether Fortress Run</option>
                  <option value="minecraft_mining.mp4" style={{ background: "#18181b", color: "#fff" }}>Deepslate Mining Timelapse</option>
                  <option value="minecraft_building.mp4" style={{ background: "#18181b", color: "#fff" }}>Mega Build Montage</option>
                </select>
              </div>

              {/* Subtitle Style */}
              <div>
                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600", display: "block", marginBottom: "6px" }}>
                  Dynamic Subtitle Aesthetic
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <button
                    onClick={() => setSubtitleStyle("yellow_glow")}
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      background: subtitleStyle === "yellow_glow" ? "rgba(250, 204, 21, 0.15)" : "rgba(255,255,255,0.03)",
                      border: subtitleStyle === "yellow_glow" ? "1px solid #facc15" : "1px solid var(--border-subtle)",
                      color: subtitleStyle === "yellow_glow" ? "#facc15" : "var(--text-secondary)",
                      fontSize: "0.8rem",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    MrBeast Yellow
                  </button>
                  <button
                    onClick={() => setSubtitleStyle("emerald_neon")}
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      background: subtitleStyle === "emerald_neon" ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.03)",
                      border: subtitleStyle === "emerald_neon" ? "1px solid #10b981" : "1px solid var(--border-subtle)",
                      color: subtitleStyle === "emerald_neon" ? "#34d399" : "var(--text-secondary)",
                      fontSize: "0.8rem",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    Emerald Neon
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Render Action Card */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "1.05rem", color: "#ffffff", marginBottom: "8px" }}>
              Ready to Render Short
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "16px" }}>
              Stitches gameplay, voiceover audio, ducked ambient music, and burnt dynamic captions into ready-to-post 1080x1920 MP4.
            </p>

            <button
              onClick={handleRenderShort}
              disabled={!script || renderingVideo}
              className="btn-primary"
              style={{ width: "100%", padding: "14px" }}
            >
              <Film size={18} />
              <span>{renderingVideo ? "Rendering Short..." : "Render 9:16 Short Now"}</span>
            </button>

            {/* Live Progress Bar if rendering */}
            {renderingVideo && (
              <div style={{ marginTop: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "6px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>{renderStep}</span>
                  <span style={{ color: "#10b981", fontWeight: "700" }}>{renderProgress}%</span>
                </div>
                <div style={{ width: "100%", height: "8px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{
                    width: `${renderProgress}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #facc15 0%, #10b981 100%)",
                    transition: "width 0.3s ease"
                  }} />
                </div>
              </div>
            )}

            {/* If Finished Rendering, show trigger preview */}
            {createdJob && createdJob.status === "READY" && (
              <div style={{ marginTop: "16px", padding: "12px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "8px", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.85rem", color: "#34d399", fontWeight: "600" }}>Render Complete!</span>
                  <button
                    onClick={() => setCreatedJob(createdJob)}
                    className="btn-primary"
                    style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                  >
                    <Play size={14} />
                    <span>Watch Preview</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Preview */}
      <ShortPlayerModal
        video={createdJob && createdJob.status === "READY" ? createdJob : null}
        onClose={() => setCreatedJob(null)}
      />
    </div>
  );
}
