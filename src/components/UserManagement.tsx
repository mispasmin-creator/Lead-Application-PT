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
        background: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        padding: "16px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="modal-content"
        style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "448px",
          maxHeight: "calc(100vh - 48px)",
          overflowY: "auto",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50/50"
        >
          <div className="flex items-center gap-2">
            {mode === "add" ? (
              <UserPlus className="w-4 h-4 text-gray-700" />
            ) : (
              <Pencil className="w-4 h-4 text-gray-700" />
            )}
            <h2 className="text-sm font-semibold text-gray-900">
              {mode === "add" ? "Add New User" : "Edit User"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {saveError && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl border border-red-200 text-sm bg-red-50 text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{saveError}</p>
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-gray-600">
              Username <span className="text-red-400">*</span>
            </label>
            <input
              required
              value={form.username}
              onChange={(e) => handleChange("username", e.target.value)}
              placeholder="e.g. john_doe"
              className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all bg-white text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-gray-600">
              Password {mode === "add" && <span className="text-red-400">*</span>}
            </label>
            <div className="relative">
              <input
                required={mode === "add"}
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder={mode === "edit" ? "Leave blank to keep current" : "Enter password"}
                className="w-full h-9 pl-3 pr-9 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all bg-white text-gray-900 placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-gray-600">
              Role <span className="text-red-400">*</span>
            </label>
            <input
              required
              value={form.role}
              onChange={(e) => handleChange("role", e.target.value)}
              placeholder="e.g. Admin, User"
              className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all bg-white text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Firm Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-gray-600">
              Firm Name
            </label>
            <input
              value={form.firmName}
              onChange={(e) => handleChange("firmName", e.target.value)}
              placeholder="e.g. Passary Designs"
              className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all bg-white text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Page Access */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-gray-600">
              Page Access
            </label>
            <input
              value={form.pageAccess}
              onChange={(e) => handleChange("pageAccess", e.target.value)}
              placeholder="e.g. dashboard,add,steps — or leave blank for All"
              className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all bg-white text-gray-900 placeholder:text-gray-400"
            />
            <p className="text-xs mt-1 text-gray-400">
              Comma-separated page names. Leave blank to allow all pages.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-9 px-4 rounded-xl border border-gray-200 text-sm font-medium transition-all cursor-pointer hover:bg-gray-50 disabled:opacity-50 bg-white text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-9 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2 shadow-sm hover:shadow-md"
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            User Management
          </h1>
          <p className="text-sm mt-1 text-gray-500">
            Users are fetched from the User sheet by matching Username, Password, Role, Firm Name, and Page Access.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={openAdd}
              className="h-10 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              <UserPlus className="w-4 h-4" />
              Add User
            </button>
          )}
          <button
            onClick={loadUsers}
            disabled={loading}
            className="h-10 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium bg-gray-50 text-gray-800">
          <ShieldCheck className="w-4 h-4 shrink-0 text-gray-700" />
          <p>{successMsg}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-gray-200 p-4 bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-700" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Users</p>
              <p className="text-xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 p-4 bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-gray-700" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Your Role</p>
              <p className="text-lg font-bold truncate text-gray-900">{currentUser.role || "User"}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 p-4 bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-gray-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Firm</p>
              <p className="text-lg font-bold truncate text-gray-900">{currentUser.firmName || "-"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
        <div
          className="px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50"
        >
          <div className="flex items-center gap-2">
            <UserCog className="w-4 h-4 text-gray-700" />
            <h2 className="text-sm font-semibold text-gray-900">User Sheet</h2>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users"
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all bg-white text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        {error ? (
          <div className="m-5 flex items-start gap-3 px-4 py-3 rounded-xl border border-red-200 text-sm font-medium bg-red-50 text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: '580px' }}>
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-gray-200 bg-gray-50">
                  {[
                    { label: "Username",    cls: "text-left   w-36" },
                    { label: "Password",    cls: "text-center w-28" },
                    { label: "Role",        cls: "text-center w-28" },
                    { label: "Firm Name",   cls: "text-left   w-40" },
                    { label: "Page Access", cls: "text-left"        },
                    ...(isAdmin ? [{ label: "Actions", cls: "text-center w-24" }] : []),
                  ].map(({ label, cls }) => (
                    <th
                      key={label}
                      className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap ${cls}`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="px-5 py-14 text-center text-sm text-gray-500">
                      Loading users…
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="px-5 py-14 text-center text-sm text-gray-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={`${user.username}-${user.firmName}`}
                      className="border-b border-gray-100 last:border-b-0 transition-colors hover:bg-gray-50/50"
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-gray-900">{user.username}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center text-gray-500 font-mono tracking-widest text-sm">
                        {user.password ? "••••••••" : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold">
                          {user.role || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-900">{user.firmName || "—"}</td>
                      <td className="px-5 py-3.5 max-w-xs truncate text-gray-500" title={user.pageAccess}>
                        {user.pageAccess || "All Pages"}
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() => openEdit(user)}
                            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg border border-gray-200 text-xs font-medium transition-all cursor-pointer hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 bg-white text-gray-600"
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