import React from 'react';
import {
  FileSpreadsheet, Copy, Check, Globe,
  ShieldCheck, Info, ExternalLink
} from 'lucide-react';
import { SyncConfig } from '../types';
import { googleAppsScriptCode } from '../utils/appsScriptCode';

interface SheetsConnectProps {
  syncConfig: SyncConfig;
  onUpdateConfig: (config: SyncConfig) => void;
  onTestConnection: () => Promise<boolean>;
}

export default function SheetsConnect({ syncConfig, onUpdateConfig, onTestConnection }: SheetsConnectProps) {
  const [copied,         setCopied]         = React.useState(false);
  const [scriptUrlInput, setScriptUrlInput] = React.useState(syncConfig.appsScriptUrl);
  const [isTesting,      setIsTesting]      = React.useState(false);
  const [testResult,     setTestResult]     = React.useState<{ status: 'success' | 'error'; message: string } | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveConfig = (newMode: 'local' | 'live', url = scriptUrlInput) => {
    onUpdateConfig({ ...syncConfig, mode: newMode, appsScriptUrl: url });
    setTestResult(null);
  };

  const triggerTest = async () => {
    if (!scriptUrlInput.trim()) {
      setTestResult({ status: 'error', message: 'Please paste your Apps Script URL first.' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const ok = await onTestConnection();
      setTestResult(ok
        ? { status: 'success', message: 'Connection successful! Live sync is active.' }
        : { status: 'error',   message: 'Connected but could not verify schema. Check your script deployment.' }
      );
    } catch (err: any) {
      setTestResult({ status: 'error', message: err.message || 'Connection failed. Check your Apps Script URL.' });
    } finally {
      setIsTesting(false);
    }
  };

  const inputCls = 'w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-colors';

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure Google Sheets sync and connection</p>
      </div>

      {/* Mode Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Globe className="w-4 h-4 text-green-600" />
          Sync Mode
        </h2>

        <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => saveConfig('local')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors cursor-pointer ${
              syncConfig.mode === 'local'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sandbox (Demo)
          </button>
          <button
            onClick={() => saveConfig('live')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors cursor-pointer ${
              syncConfig.mode === 'live'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Live Sheet
          </button>
        </div>

        <p className="text-xs text-gray-400">
          {syncConfig.mode === 'local'
            ? 'Data is stored locally in your browser. Changes are not saved to Google Sheets.'
            : 'Data syncs in real-time with your Google Sheet via Apps Script.'}
        </p>

        {/* Live mode URL input */}
        {syncConfig.mode === 'live' && (
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Google Apps Script Web App URL
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/…/exec"
                  value={scriptUrlInput}
                  onChange={e => { setScriptUrlInput(e.target.value); saveConfig('live', e.target.value); }}
                  className={`${inputCls} flex-1`}
                />
                <button
                  onClick={triggerTest} disabled={isTesting}
                  className="h-9 px-4 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {isTesting ? 'Testing…' : 'Test Connection'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Script must be deployed as <strong>Execute as: Me</strong> and <strong>Who has access: Anyone</strong>.
              </p>
            </div>

            {testResult && (
              <div className={`flex items-start gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium ${
                testResult.status === 'success'
                  ? 'bg-green-50 text-green-800 border-green-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}>
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{testResult.message}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sheet Configuration */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-green-600" />
          Sheet Configuration
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Target Sheet',     value: syncConfig.sheetName },
            { label: 'Heading Row',      value: 'Row 6' },
            { label: 'Drive Folder',     value: `${syncConfig.driveUrl.substring(0, 12)}…` },
            { label: 'Data Starts',      value: 'Row 7' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-lg px-3 py-3 border border-gray-200">
              <p className="text-xs text-gray-400 font-medium">{label}</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate" title={value}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Apps Script Setup */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              Deploy Apps Script
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Copy and paste this script into your Google Sheet's Apps Script editor.</p>
          </div>
          <button
            onClick={handleCopy}
            className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            {copied ? <><Check className="w-3.5 h-3.5" />Copied!</> : <><Copy className="w-3.5 h-3.5" />Copy Script</>}
          </button>
        </div>

        {/* Setup steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { step: '1', title: 'Open Script Editor', body: 'In your Google Sheet, go to Extensions → Apps Script.' },
            { step: '2', title: 'Paste & Save',        body: 'Clear any existing code, paste the copied script, and save (Ctrl+S).' },
            { step: '3', title: 'Deploy Web App',      body: 'Click Deploy → New Deployment → Web App. Set access to Anyone. Copy the URL above.' },
          ].map(({ step, title, body }) => (
            <div key={step} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold shrink-0">{step}</span>
                <p className="text-sm font-semibold text-gray-800">{title}</p>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        {/* Help link */}
        <div className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800">
          <ExternalLink className="w-3.5 h-3.5" />
          <a href="https://developers.google.com/apps-script/guides/web" target="_blank" rel="noreferrer" className="font-medium hover:underline">
            Google Apps Script documentation
          </a>
        </div>

        {/* Code preview */}
        <div className="bg-gray-900 rounded-lg p-4 text-gray-300 font-mono text-xs leading-relaxed overflow-x-auto max-h-44 select-all border border-gray-800">
          <pre>{googleAppsScriptCode}</pre>
        </div>
      </div>

    </div>
  );
}
