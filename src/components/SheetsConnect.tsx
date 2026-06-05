import React from "react";
import {
  FileSpreadsheet,
  Copy,
  Check,
  Globe,
  ShieldCheck,
  Info,
  ExternalLink,
  Zap,
  Database,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { SyncConfig } from "../types";
import { googleAppsScriptCode } from "../utils/appsScriptCode";

interface SheetsConnectProps {
  syncConfig: SyncConfig;
  onUpdateConfig: (config: SyncConfig) => void;
  onTestConnection: () => Promise<boolean>;
}

export default function SheetsConnect({
  syncConfig,
  onUpdateConfig,
  onTestConnection,
}: SheetsConnectProps) {
  const [copied, setCopied] = React.useState(false);
  const [scriptUrlInput, setScriptUrlInput] = React.useState(
    syncConfig.appsScriptUrl,
  );
  const [isTesting, setIsTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{
    status: "success" | "error";
    message: string;
  } | null>(null);

  React.useEffect(() => {
    setScriptUrlInput(syncConfig.appsScriptUrl);
  }, [syncConfig.appsScriptUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveConfig = (newMode: "local" | "live", url = scriptUrlInput) => {
    onUpdateConfig({ ...syncConfig, mode: newMode, appsScriptUrl: url });
    setTestResult(null);
  };

  const triggerTest = async () => {
    if (!scriptUrlInput.trim()) {
      setTestResult({
        status: "error",
        message: "Please paste your Apps Script URL first.",
      });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const ok = await onTestConnection();
      setTestResult(
        ok
          ? {
              status: "success",
              message:
                "Connection successful! Live sync is active and working.",
            }
          : {
              status: "error",
              message:
                "Connected but could not verify schema. Check your script deployment.",
            },
      );
    } catch (err: any) {
      setTestResult({
        status: "error",
        message:
          err.message || "Connection failed. Check your Apps Script URL.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const isLive = syncConfig.mode === "live";

  const inputCls =
    "w-full h-10 px-3 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 focus:border-emerald-400 transition-all";

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in pb-8">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--text)" }}
        >
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Configure Google Sheets sync and data connection
        </p>
      </div>

      {/* Mode selector */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <div
          className="px-5 py-4 border-b flex items-center gap-2"
          style={{
            borderColor: "var(--border)",
            background: "var(--bg-elevated)",
          }}
        >
          <Globe className="w-4 h-4 text-emerald-500" />
          <h2
            className="text-sm font-semibold"
            style={{ color: "var(--text)" }}
          >
            Sync Mode
          </h2>
        </div>

        <div className="p-5 space-y-4">
          {/* Toggle */}
          <div className="flex gap-3">
            <button
              onClick={() => saveConfig("local")}
              className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${
                !isLive
                  ? "border-amber-400 bg-amber-50/50 dark:bg-amber-900/10"
                  : "border-transparent hover:border-gray-200 dark:hover:border-gray-600"
              }`}
              style={
                !isLive
                  ? {}
                  : {
                      borderColor: "var(--border)",
                      background: "var(--bg-elevated)",
                    }
              }
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${!isLive ? "bg-amber-100 dark:bg-amber-900/30" : ""}`}
                style={isLive ? { background: "var(--bg-elevated)" } : {}}
              >
                <Database
                  className={`w-4 h-4 ${!isLive ? "text-amber-600 dark:text-amber-400" : ""}`}
                  style={isLive ? { color: "var(--text-subtle)" } : {}}
                />
              </div>
              <div>
                <p
                  className={`text-sm font-semibold ${!isLive ? "text-amber-700 dark:text-amber-400" : ""}`}
                  style={isLive ? { color: "var(--text)" } : {}}
                >
                  Sandbox
                </p>
                <p className="text-xs" style={{ color: "var(--text-subtle)" }}>
                  Local browser storage
                </p>
              </div>
              {!isLive && <Check className="w-4 h-4 text-amber-500 ml-auto" />}
            </button>

            <button
              onClick={() => saveConfig("live")}
              className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${
                isLive
                  ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10"
                  : "border-transparent hover:border-gray-200 dark:hover:border-gray-600"
              }`}
              style={
                isLive
                  ? {}
                  : {
                      borderColor: "var(--border)",
                      background: "var(--bg-elevated)",
                    }
              }
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${isLive ? "bg-emerald-100 dark:bg-emerald-900/30" : ""}`}
                style={!isLive ? { background: "var(--bg-elevated)" } : {}}
              >
                <Zap
                  className={`w-4 h-4 ${isLive ? "text-emerald-600 dark:text-emerald-400" : ""}`}
                  style={!isLive ? { color: "var(--text-subtle)" } : {}}
                />
              </div>
              <div>
                <p
                  className={`text-sm font-semibold ${isLive ? "text-emerald-700 dark:text-emerald-400" : ""}`}
                  style={!isLive ? { color: "var(--text)" } : {}}
                >
                  Live Sheet
                </p>
                <p className="text-xs" style={{ color: "var(--text-subtle)" }}>
                  Real-time Google Sheets sync
                </p>
              </div>
              {isLive && <Check className="w-4 h-4 text-emerald-500 ml-auto" />}
            </button>
          </div>

          {/* Live mode URL */}
          {isLive && (
            <div
              className="pt-4 border-t space-y-3"
              style={{ borderColor: "var(--border)" }}
            >
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  Google Apps Script Web App URL
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/…/exec"
                    value={scriptUrlInput}
                    onChange={(e) => {
                      setScriptUrlInput(e.target.value);
                      saveConfig("live", e.target.value);
                    }}
                    className={`${inputCls} flex-1`}
                    style={{
                      background: "var(--bg-elevated)",
                      borderColor: "var(--border)",
                      color: "var(--text)",
                    }}
                  />
                  <button
                    onClick={triggerTest}
                    disabled={isTesting}
                    className="h-10 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2 shrink-0 shadow-sm"
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />{" "}
                        Testing…
                      </>
                    ) : (
                      "Test Connection"
                    )}
                  </button>
                </div>
                <p
                  className="text-xs mt-1.5"
                  style={{ color: "var(--text-subtle)" }}
                >
                  Script must be deployed as <strong>Execute as: Me</strong> and{" "}
                  <strong>Who has access: Anyone</strong>.
                </p>
              </div>

              {testResult && (
                <div
                  className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
                    testResult.status === "success"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700"
                      : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-700"
                  }`}
                >
                  {testResult.status === "success" ? (
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <p>{testResult.message}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sheet config */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <div
          className="px-5 py-4 border-b flex items-center gap-2"
          style={{
            borderColor: "var(--border)",
            background: "var(--bg-elevated)",
          }}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <h2
            className="text-sm font-semibold"
            style={{ color: "var(--text)" }}
          >
            Sheet Configuration
          </h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Target Sheet", value: syncConfig.sheetName },
              { label: "Heading Row", value: "Row 6" },
              {
                label: "Drive Folder",
                value: `${syncConfig.driveUrl.substring(0, 12)}…`,
              },
              { label: "Data Starts", value: "Row 7" },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl px-4 py-3 border"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border)",
                }}
              >
                <p
                  className="text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: "var(--text-subtle)" }}
                >
                  {label}
                </p>
                <p
                  className="text-sm font-semibold mt-1 truncate"
                  style={{ color: "var(--text)" }}
                  title={value}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Apps Script setup */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <div
          className="px-5 py-4 border-b flex items-center justify-between"
          style={{
            borderColor: "var(--border)",
            background: "var(--bg-elevated)",
          }}
        >
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--text)" }}
            >
              Deploy Apps Script
            </h2>
          </div>
          <button
            onClick={handleCopy}
            className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              copied
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copy Script
              </>
            )}
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Copy and paste this script into your Google Sheet's Apps Script
            editor.
          </p>

          {/* Setup steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                step: "1",
                title: "Open Script Editor",
                body: "In your Google Sheet, go to Extensions → Apps Script.",
              },
              {
                step: "2",
                title: "Paste & Save",
                body: "Clear any existing code, paste the copied script, and save (Ctrl+S).",
              },
              {
                step: "3",
                title: "Deploy Web App",
                body: "Click Deploy → New Deployment → Web App. Set access to Anyone. Copy the URL.",
              },
            ].map(({ step, title, body }) => (
              <div
                key={step}
                className="rounded-xl p-4 border"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                    {step}
                  </span>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--text)" }}
                  >
                    {title}
                  </p>
                </div>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "var(--text-muted)" }}
                >
                  {body}
                </p>
              </div>
            ))}
          </div>

          {/* Help link */}
          <div className="flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <a
              href="https://developers.google.com/apps-script/guides/web"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline transition-colors"
            >
              Google Apps Script documentation
            </a>
          </div>

          {/* Code preview */}
          <div className="rounded-xl overflow-hidden border border-gray-700 bg-gray-900">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-700 bg-gray-800">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <span className="text-xs text-gray-400 ml-1">Code.gs</span>
            </div>
            <div className="p-4 text-gray-300 font-mono text-xs leading-relaxed overflow-x-auto max-h-48 select-all">
              <pre>{googleAppsScriptCode}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
