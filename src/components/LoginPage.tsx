import React from "react";
import { 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Loader2, 
  Lock, 
  LogIn, 
  Settings2, 
  User,
  ArrowRight
} from "lucide-react";
import { SyncConfig } from "../types";

interface LoginPageProps {
  syncConfig: SyncConfig;
  onLogin: (username: string, password: string) => Promise<void>;
  onUpdateConfig: (config: SyncConfig) => void;
}

export default function LoginPage({ syncConfig, onLogin, onUpdateConfig }: LoginPageProps) {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [scriptUrl, setScriptUrl] = React.useState(syncConfig.appsScriptUrl || "");
  const [isFocused, setIsFocused] = React.useState({ username: false, password: false });

  const isReady = syncConfig.mode === "live" && !!syncConfig.appsScriptUrl.trim();

  const handleUrlChange = (url: string) => {
    setScriptUrl(url);
    const trimmed = url.trim();
    onUpdateConfig({
      ...syncConfig,
      appsScriptUrl: trimmed,
      mode: trimmed ? "live" : "local",
    });
  };

  const submit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onLogin(username, password);
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  const getInputClass = (field: 'username' | 'password') => {
    const base = "w-full h-11 pl-11 pr-4 text-sm rounded-xl border transition-all duration-200 bg-white text-gray-900";
    const focus = isFocused[field]
      ? "border-gray-900 ring-2 ring-gray-900/10 shadow-sm"
      : "border-gray-200 hover:border-gray-300";
    const errorState = error && field === 'password' ? "border-red-400 ring-2 ring-red-100" : "";
    return `${base} ${focus} ${errorState} placeholder:text-gray-400 focus:outline-none`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="w-full max-w-sm space-y-5 animate-fade-in">
        
        {/* Logo + title */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-900 shadow-lg shadow-gray-900/20 transition-transform hover:scale-105 duration-300">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Welcome Back
            </h1>
            <p className="text-sm mt-2 text-gray-500 font-medium">
              Sign in to access your dashboard
            </p>
          </div>
        </div>

        {/* Apps Script URL setup card */}
        {!isReady && (
          <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-6 space-y-4 transition-all hover:border-amber-400">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Settings2 className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Connect Google Sheet</p>
                <p className="text-xs text-amber-700 mt-0.5">Configuration required before login</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                Apps Script Web App URL
              </label>
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/…/exec"
                value={scriptUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="w-full h-11 px-4 text-sm rounded-xl border-2 border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
              <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
                <span>📋</span>
                Google Sheet → Extensions → Apps Script → Deploy as Web App
              </p>
            </div>

            <a
              href="https://developers.google.com/apps-script/guides/web"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 hover:underline transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Learn how to deploy Apps Script
            </a>
          </div>
        )}

        {/* Login form */}
        <form
          onSubmit={submit}
          className="rounded-2xl border border-gray-200 p-6 space-y-5 shadow-sm bg-white transition-shadow hover:shadow-md"
        >
          {/* Username Field */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
              Username
            </label>
            <div className="relative">
              <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                isFocused.username ? 'text-gray-900' : 'text-gray-400'
              }`} />
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                onFocus={() => setIsFocused(prev => ({ ...prev, username: true }))}
                onBlur={() => setIsFocused(prev => ({ ...prev, username: false }))}
                className={getInputClass('username')}
                autoComplete="username"
                required
                placeholder="Enter your username"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                Password
              </label>
              <button
                type="button"
                className="text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                isFocused.password ? 'text-gray-900' : 'text-gray-400'
              }`} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onFocus={() => setIsFocused(prev => ({ ...prev, password: true }))}
                onBlur={() => setIsFocused(prev => ({ ...prev, password: false }))}
                className={getInputClass('password')}
                autoComplete="current-password"
                required
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Configuration Required Message */}
          {!isReady && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-800">
              <Settings2 className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="font-medium">Please configure the Apps Script URL above to enable login</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !isReady}
            className="w-full h-12 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2.5 shadow-lg shadow-gray-900/10 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4 opacity-70" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}