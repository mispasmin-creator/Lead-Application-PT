import React from "react";
import ReactDOM from "react-dom";
import {
  AlertCircle,
  Building2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCog,
  Users,
  UserPlus,
  Pencil,
  X,
  Eye,
  EyeOff,
  Save,
} from "lucide-react";
import { SyncConfig, UserAccount } from "../types";
import { getUsers, addUser, updateUser } from "../utils/storage";

interface UserManagementProps {
  syncConfig: SyncConfig;
  currentUser: UserAccount;
}

const EMPTY_USER: UserAccount = {
  username: "",
  password: "",
  role: "",
  firmName: "",
  pageAccess: "",
};

function UserModal({
  mode,
  initial,
  onClose,
  onSave,
  saving,
  saveError,
}: {
  mode: "add" | "edit";
  initial: UserAccount;
  onClose: () => void;
  onSave: (original: string, user: UserAccount) => Promise<void>;
  saving: boolean;
  saveError: string;
}) {
  const [form, setForm] = React.useState<UserAccount>({ ...initial });
  const [showPassword, setShowPassword] = React.useState(false);
  const originalUsername = React.useRef(initial.username);

  const handleChange = (field: keyof UserAccount, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(originalUsername.current, form);
  };

  const modalNode = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        padding: "16px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="modal-content"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "448px",
          maxHeight: "calc(100vh - 48px)",
          overflowY: "auto",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
        >
          <div className="flex items-center gap-2">
            {mode === "add" ? (
              <UserPlus className="w-4 h-4 text-emerald-500" />
            ) : (
              <Pencil className="w-4 h-4 text-indigo-500" />
            )}
            <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              {mode === "add" ? "Add New User" : "Edit User"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            style={{ color: "var(--text-subtle)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {saveError && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl border text-sm bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{saveError}</p>
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-subtle)" }}>
              Username <span className="text-rose-500">*</span>
            </label>
            <input
              required
              value={form.username}
              onChange={(e) => handleChange("username", e.target.value)}
              placeholder="e.g. john_doe"
              className="w-full h-9 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30"
              style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-subtle)" }}>
              Password {mode === "add" && <span className="text-rose-500">*</span>}
            </label>
            <div className="relative">
              <input
                required={mode === "add"}
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder={mode === "edit" ? "Leave blank to keep current" : "Enter password"}
                className="w-full h-9 pl-3 pr-9 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30"
                style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                style={{ color: "var(--text-subtle)" }}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-subtle)" }}>
              Role <span className="text-rose-500">*</span>
            </label>
            <input
              required
              value={form.role}
              onChange={(e) => handleChange("role", e.target.value)}
              placeholder="e.g. Admin, User"
              className="w-full h-9 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30"
              style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            />
          </div>

          {/* Firm Name */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-subtle)" }}>
              Firm Name
            </label>
            <input
              value={form.firmName}
              onChange={(e) => handleChange("firmName", e.target.value)}
              placeholder="e.g. Passary Designs"
              className="w-full h-9 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30"
              style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            />
          </div>

          {/* Page Access */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-subtle)" }}>
              Page Access
            </label>
            <input
              value={form.pageAccess}
              onChange={(e) => handleChange("pageAccess", e.target.value)}
              placeholder="e.g. dashboard,add,steps — or leave blank for All"
              className="w-full h-9 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30"
              style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            />
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Comma-separated page names. Leave blank to allow all pages.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-9 px-4 rounded-xl border text-sm font-medium transition-all cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2 shadow-sm"
            >
              {saving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {saving ? "Saving…" : mode === "add" ? "Add User" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalNode, document.body);
}


export default function UserManagement({ syncConfig, currentUser }: UserManagementProps) {
  const [users, setUsers] = React.useState<UserAccount[]>([]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  // Modal state
  const [modalMode, setModalMode] = React.useState<"add" | "edit" | null>(null);
  const [modalInitial, setModalInitial] = React.useState<UserAccount>(EMPTY_USER);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState("");
  const [successMsg, setSuccessMsg] = React.useState("");

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getUsers(syncConfig);
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadUsers();
  }, [syncConfig.appsScriptUrl]);

  const filteredUsers = users.filter((user) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return [user.username, user.role, user.firmName, user.pageAccess].some((value) =>
      value.toLowerCase().includes(term),
    );
  });

  const openAdd = () => {
    setModalInitial(EMPTY_USER);
    setSaveError("");
    setModalMode("add");
  };

  const openEdit = (user: UserAccount) => {
    setModalInitial({ ...user });
    setSaveError("");
    setModalMode("edit");
  };

  const closeModal = () => {
    if (!saving) setModalMode(null);
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const handleSave = async (originalUsername: string, user: UserAccount) => {
    setSaving(true);
    setSaveError("");
    try {
      if (modalMode === "add") {
        await addUser(user, syncConfig);
        showSuccess(`User "${user.username}" added successfully.`);
      } else {
        await updateUser(originalUsername, user, syncConfig);
        showSuccess(`User "${user.username}" updated successfully.`);
      }
      setModalMode(null);
      await loadUsers();
    } catch (err: any) {
      setSaveError(err.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const isAdmin =
    currentUser.role.trim().toLowerCase() === "admin" ||
    currentUser.role.trim().toLowerCase() === "administrator";

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-fade-in pb-8">
      {/* Modals */}
      {modalMode && (
        <UserModal
          mode={modalMode}
          initial={modalInitial}
          onClose={closeModal}
          onSave={handleSave}
          saving={saving}
          saveError={saveError}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
            User Management
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Users are fetched from the User sheet by matching Username, Password, Role, Firm Name, and Page Access.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={openAdd}
              className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Add User
            </button>
          )}
          <button
            onClick={loadUsers}
            disabled={loading}
            className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <p>{successMsg}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-subtle)" }}>Users</p>
              <p className="text-xl font-bold" style={{ color: "var(--text)" }}>{users.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-subtle)" }}>Your Role</p>
              <p className="text-lg font-bold truncate" style={{ color: "var(--text)" }}>{currentUser.role || "User"}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-subtle)" }}>Firm</p>
              <p className="text-lg font-bold truncate" style={{ color: "var(--text)" }}>{currentUser.firmName || "-"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <div
          className="px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
        >
          <div className="flex items-center gap-2">
            <UserCog className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>User Sheet</h2>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-subtle)" }} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users"
              className="w-full h-9 pl-9 pr-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text)" }}
            />
          </div>
        </div>

        {error ? (
          <div className="m-5 flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                  {["Username", "Password", "Role", "Firm Name", "Page Access", ...(isAdmin ? ["Actions"] : [])].map((header) => (
                    <th
                      key={header}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest"
                      style={{ color: "var(--text-subtle)" }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="px-5 py-12 text-center" style={{ color: "var(--text-muted)" }}>
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="px-5 py-12 text-center" style={{ color: "var(--text-muted)" }}>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={`${user.username}-${user.firmName}`}
                      className="border-b last:border-b-0 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <td className="px-5 py-3 font-semibold" style={{ color: "var(--text)" }}>{user.username}</td>
                      <td className="px-5 py-3" style={{ color: "var(--text-muted)" }}>{user.password ? "••••••••" : "-"}</td>
                      <td className="px-5 py-3" style={{ color: "var(--text)" }}>{user.role || "-"}</td>
                      <td className="px-5 py-3" style={{ color: "var(--text)" }}>{user.firmName || "-"}</td>
                      <td className="px-5 py-3 max-w-xs truncate" style={{ color: "var(--text-muted)" }} title={user.pageAccess}>
                        {user.pageAccess || "All Pages"}
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-3">
                          <button
                            onClick={() => openEdit(user)}
                            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg border text-xs font-medium transition-all cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 dark:hover:bg-indigo-900/20 dark:hover:border-indigo-600 dark:hover:text-indigo-400"
                            style={{ borderColor: "var(--border)", color: "var(--text-subtle)" }}
                          >
                            <Pencil className="w-3 h-3" />
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
