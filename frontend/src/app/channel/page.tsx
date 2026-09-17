"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings, 
  Youtube, 
  CheckCircle2, 
  Save, 
  TrendingUp, 
  ShieldCheck,
  Sparkles,
  Layers,
  AlertTriangle,
  RefreshCw,
  Key,
  ExternalLink,
  HelpCircle,
  Eye,
  EyeOff
} from "lucide-react";
import { 
  fetchChannelSettings, 
  updateChannelSettings, 
  fetchYouTubeStatus, 
  testYouTubeCredentials, 
  saveYouTubeCredentials 
} from "@/lib/api";
import { ChannelSettings, YouTubeStatusResponse } from "@/lib/types";

export default function ChannelPage() {
  const [settings, setSettings] = useState<ChannelSettings | null>(null);
  const [ytStatus, setYtStatus] = useState<YouTubeStatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Credentials fields
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [showSecret, setShowSecret] = useState(false);

  // Testing & Saving states
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ connected: boolean; message: string } | null>(null);
  const [savingCreds, setSavingCreds] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // General settings
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchChannelSettings().then((s) => {
      setSettings(s);
      if (s.youtube_client_id) setClientId(s.youtube_client_id);
      if (s.youtube_client_secret) setClientSecret(s.youtube_client_secret);
      if (s.youtube_refresh_token) setRefreshToken(s.youtube_refresh_token);
    });

    fetchYouTubeStatus()
      .then(setYtStatus)
      .finally(() => setLoadingStatus(false));
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testYouTubeCredentials({
        client_id: clientId.trim() || undefined,
        client_secret: clientSecret.trim() || undefined,
        refresh_token: refreshToken.trim() || undefined,
      });

      if (res.connected) {
        setTestResult({
          connected: true,
          message: `Connected successfully to "${res.channel_title}" (${(res.subscriber_count || 0).toLocaleString()} subscribers)!`,
        });
        const fresh = await fetchYouTubeStatus();
        setYtStatus(fresh);
      } else {
        setTestResult({
          connected: false,
          message: res.error || "Connection failed. Please check your credentials.",
        });
      }
    } catch (err: any) {
      setTestResult({
        connected: false,
        message: err.message || "Failed to reach Google OAuth API.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveCredentials = async () => {
    setSavingCreds(true);
    try {
      const updated = await saveYouTubeCredentials({
        client_id: clientId.trim() || undefined,
        client_secret: clientSecret.trim() || undefined,
        refresh_token: refreshToken.trim() || undefined,
      });
      setSettings(updated);
      const fresh = await fetchYouTubeStatus();
      setYtStatus(fresh);

      if (fresh.connected) {
        setTestResult({
          connected: true,
          message: `Credentials saved & active! Ready to publish to "${fresh.channel_title}".`,
        });
      } else {
        setTestResult({
          connected: false,
          message: `Saved, but Google rejected the token: ${fresh.error}`,
        });
      }
    } catch (err: any) {
      alert("Error saving credentials: " + err);
    } finally {
      setSavingCreds(false);
    }
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await updateChannelSettings(settings);
      setSettings(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert("Error saving settings: " + err);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", maxWidth: "900px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.85rem", fontWeight: "800", color: "#ffffff", marginBottom: "6px" }}>
          Channel Setup & Automation Config
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Connect your live YouTube account, verify Google OAuth credentials, and customize video publishing defaults.
        </p>
      </div>

      {/* Real-time YouTube Connection Status Card */}
      <div className="glass-card" style={{ padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            width: "52px",
            height: "52px",
            borderRadius: "14px",
            backgroundColor: ytStatus?.connected ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
            border: ytStatus?.connected ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Youtube size={28} color={ytStatus?.connected ? "#10b981" : "#ef4444"} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 style={{ fontSize: "1.1rem", color: "#ffffff" }}>
                {ytStatus?.connected ? (ytStatus.channel_title || "YouTube Channel") : "YouTube Connection"}
              </h3>
              <span className={`badge ${ytStatus?.connected ? "badge-ready" : "badge-failed"}`}>
                {loadingStatus ? "Checking..." : ytStatus?.connected ? "Live Connected" : "Action Required"}
              </span>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
              {ytStatus?.connected 
                ? "Live YouTube Data API v3 active. Videos will upload directly to this channel."
                : ytStatus?.error || "Your Google OAuth Refresh Token is expired or invalid. Please update credentials below."}
            </p>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "#ffffff" }}>
            {ytStatus?.connected 
              ? (ytStatus.subscriber_count || 0).toLocaleString() + " Subscribers"
              : settings.subscriber_count.toLocaleString() + " Subscribers"}
          </span>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {ytStatus?.connected 
              ? (ytStatus.view_count || 0).toLocaleString() + " Total Views"
              : settings.total_views.toLocaleString() + " Total Views"}
          </p>
        </div>
      </div>

      {/* YouTube Credentials Configuration Card */}
      <div className="glass-card" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Key size={20} color="#ef4444" />
            <div>
              <h3 style={{ fontSize: "1.05rem", color: "#ffffff", fontWeight: "700" }}>YouTube Data API v3 Credentials</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Required to publish Shorts directly into your personal or brand YouTube channel.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              padding: "6px 12px",
              fontSize: "0.78rem",
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <HelpCircle size={14} />
            <span>{showGuide ? "Hide Setup Guide" : "How to get credentials"}</span>
          </button>
        </div>

        {/* Expandable Step-by-Step Setup Guide */}
        {showGuide && (
          <div style={{
            background: "rgba(0, 0, 0, 0.35)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "10px",
            padding: "16px",
            fontSize: "0.82rem",
            color: "var(--text-secondary)",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}>
            <h4 style={{ color: "#ffffff", fontWeight: "700" }}>Quick 3-Minute Setup with Google Cloud:</h4>
            <ol style={{ paddingLeft: "18px", margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
              <li>
                Open <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" style={{ color: "#38bdf8", textDecoration: "underline" }}>Google Cloud Console</a>, create a project, and enable the <strong>YouTube Data API v3</strong> under <em>Enabled APIs & Services</em>.
              </li>
              <li>
                Under <strong>OAuth consent screen</strong>, set User Type to <em>External</em>, add your email to <em>Test users</em>, and add the scope: <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 4px", borderRadius: "4px" }}>https://www.googleapis.com/auth/youtube.upload</code>.
              </li>
              <li>
                Go to <strong>Credentials &gt; Create Credentials &gt; OAuth client ID</strong>. Select <em>Web application</em> (or <em>Desktop App</em>). Copy your <strong>Client ID</strong> and <strong>Client Secret</strong>.
              </li>
              <li>
                Generate your <strong>Refresh Token</strong> in seconds using the <a href="https://developers.google.com/oauthplayground" target="_blank" rel="noreferrer" style={{ color: "#38bdf8", textDecoration: "underline" }}>OAuth 2.0 Playground</a>:
                <ul style={{ paddingLeft: "16px", marginTop: "4px" }}>
                  <li>Click the gear icon (⚙️) on top right, check <em>"Use your own OAuth credentials"</em>, paste your Client ID & Secret.</li>
                  <li>In Step 1 on the left, select <em>YouTube Data API v3 &gt; https://www.googleapis.com/auth/youtube.upload</em> and click <em>Authorize APIs</em>.</li>
                  <li>In Step 2, click <em>"Exchange authorization code for tokens"</em> and copy the <strong>Refresh token</strong>.</li>
                </ul>
              </li>
              <li>Paste all 3 values below and click <strong>"Test Connection"</strong>.</li>
            </ol>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: "600", display: "block", marginBottom: "6px" }}>
              YouTube Client ID
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="e.g. 123456789-xxxx.apps.googleusercontent.com"
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "8px",
                padding: "10px 12px",
                color: "#ffffff",
                fontSize: "0.85rem",
                outline: "none"
              }}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: "600" }}>
                YouTube Client Secret
              </label>
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.72rem" }}
              >
                {showSecret ? <EyeOff size={12} /> : <Eye size={12} />}
                <span>{showSecret ? "Hide" : "Show"}</span>
              </button>
            </div>
            <input
              type={showSecret ? "text" : "password"}
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="e.g. GOCSPX-xxxxxxxxxxxxxxxx"
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "8px",
                padding: "10px 12px",
                color: "#ffffff",
                fontSize: "0.85rem",
                outline: "none"
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: "600", display: "block", marginBottom: "6px" }}>
            YouTube OAuth Refresh Token
          </label>
          <input
            type="text"
            value={refreshToken}
            onChange={(e) => setRefreshToken(e.target.value)}
            placeholder="e.g. 1//04xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            style={{
              width: "100%",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              padding: "10px 12px",
              color: "#ffffff",
              fontSize: "0.85rem",
              fontFamily: "monospace",
              outline: "none"
            }}
          />
        </div>

        {/* Test Result Message Box */}
        {testResult && (
          <div style={{
            background: testResult.connected ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
            border: testResult.connected ? "1px solid rgba(16, 185, 129, 0.35)" : "1px solid rgba(239, 68, 68, 0.35)",
            borderRadius: "8px",
            padding: "12px 16px",
            display: "flex",
            alignItems: "flex-start",
            gap: "10px"
          }}>
            {testResult.connected ? (
              <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: "2px" }} />
            ) : (
              <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
            )}
            <p style={{
              margin: 0,
              fontSize: "0.83rem",
              color: testResult.connected ? "#34d399" : "#f87171",
              lineHeight: 1.4
            }}>
              {testResult.message}
            </p>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || savingCreds}
            className="btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <RefreshCw size={14} style={{ animation: testing ? "spin 1s linear infinite" : "none" }} />
            <span>{testing ? "Testing Connection..." : "Test Connection"}</span>
          </button>
          <button
            type="button"
            onClick={handleSaveCredentials}
            disabled={savingCreds || testing}
            className="btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Save size={14} />
            <span>{savingCreds ? "Saving..." : "Save & Activate YouTube"}</span>
          </button>
        </div>
      </div>

      {/* Main Settings Form (Channel Defaults) */}
      <form onSubmit={handleSaveGeneral} className="glass-card" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "22px" }}>
        <h3 style={{ fontSize: "1.1rem", color: "#ffffff", fontWeight: "700" }}>Publishing & SEO Defaults</h3>

        {/* Channel Name & Niche */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600", display: "block", marginBottom: "6px" }}>
              Channel Brand Name
            </label>
            <input
              type="text"
              value={settings.channel_name}
              onChange={(e) => setSettings({ ...settings, channel_name: e.target.value })}
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "8px",
                padding: "10px 14px",
                color: "#ffffff",
                fontSize: "0.9rem",
                outline: "none"
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600", display: "block", marginBottom: "6px" }}>
              Target Niche Category
            </label>
            <input
              type="text"
              value={settings.niche}
              onChange={(e) => setSettings({ ...settings, niche: e.target.value })}
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "8px",
                padding: "10px 14px",
                color: "#ffffff",
                fontSize: "0.9rem",
                outline: "none"
              }}
            />
          </div>
        </div>

        {/* Daily Target & Privacy */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600", display: "block", marginBottom: "6px" }}>
              Target Videos Per Day (Algorithm Frequency)
            </label>
            <input
              type="number"
              min={1}
              max={25}
              value={settings.target_daily_videos}
              onChange={(e) => setSettings({ ...settings, target_daily_videos: parseInt(e.target.value) || 10 })}
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "8px",
                padding: "10px 14px",
                color: "#ffffff",
                fontSize: "0.9rem",
                outline: "none"
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600", display: "block", marginBottom: "6px" }}>
              Default YouTube Privacy Status
            </label>
            <select
              value={settings.default_privacy}
              onChange={(e) => setSettings({ ...settings, default_privacy: e.target.value })}
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "8px",
                padding: "10px 14px",
                color: "#ffffff",
                fontSize: "0.9rem",
                outline: "none"
              }}
            >
              <option value="public" style={{ background: "#18181b", color: "#fff" }}>Public (Live immediately)</option>
              <option value="unlisted" style={{ background: "#18181b", color: "#fff" }}>Unlisted (Preview before public)</option>
              <option value="private" style={{ background: "#18181b", color: "#fff" }}>Private</option>
            </select>
          </div>
        </div>

        {/* Default Tags */}
        <div>
          <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600", display: "block", marginBottom: "6px" }}>
            Default SEO Video Tags (Comma separated)
          </label>
          <input
            type="text"
            value={settings.default_tags}
            onChange={(e) => setSettings({ ...settings, default_tags: e.target.value })}
            style={{
              width: "100%",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              padding: "10px 14px",
              color: "#ffffff",
              fontSize: "0.9rem",
              outline: "none"
            }}
          />
        </div>

        {/* Default Description Footer */}
        <div>
          <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600", display: "block", marginBottom: "6px" }}>
            Default YouTube Shorts Description Template
          </label>
          <textarea
            rows={3}
            value={settings.default_description_footer}
            onChange={(e) => setSettings({ ...settings, default_description_footer: e.target.value })}
            style={{
              width: "100%",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              padding: "10px 14px",
              color: "#ffffff",
              fontSize: "0.9rem",
              outline: "none",
              resize: "vertical"
            }}
          />
        </div>

        {/* Save button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
          {savedSuccess && (
            <span style={{ color: "#34d399", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle2 size={16} /> Channel configuration updated successfully!
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            style={{ marginLeft: "auto", padding: "12px 24px" }}
          >
            <Save size={16} />
            <span>{saving ? "Saving..." : "Save Channel Setup"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
