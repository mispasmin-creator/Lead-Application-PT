import React from "react";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, LogIn, User } from "lucide-react";
import { SyncConfig } from "../types";

interface LoginPageProps {
  syncConfig: SyncConfig;
  onLogin: (username: string, password: string) => Promise<void>;
}

export default function LoginPage({ syncConfig, onLogin }: LoginPageProps) {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onLogin(username, password);
    } catch (err: any) {
      setError(err.message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full h-11 pl-11 pr-4 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 focus:border-emerald-400 transition-all";

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8 font-sans"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <div className="w-full max-w-md space-y-5 animate-fade-in">
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
              LeadFlow Login
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Sign in with your User sheet credentials
            </p>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="rounded-2xl border p-5 space-y-4 shadow-sm"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
              Username
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-subtle)" }} />
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className={inputCls}
                style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text)" }}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-subtle)" }} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={`${inputCls} pr-11`}
                style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text)" }}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                style={{ color: "var(--text-subtle)" }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {syncConfig.mode !== "live" && (
            <div className="text-xs rounded-xl border px-3 py-2.5 bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700">
              Live Apps Script URL is needed because login reads the User sheet.
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || syncConfig.mode !== "live"}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
          >
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : <><LogIn className="w-4 h-4" /> Login</>}
          </button>
        </form>
      </div>
    </div>
  );
}
