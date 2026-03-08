// app/admin/users/page.tsx - Admin user management with password reset

"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

type User = {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  status: string;
  created_at: string;
};

export default function AdminUsers() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace("/login");
    }
  }, [user, isAdmin, loading, router]);

  const loadUsers = async () => {
    setLoadingData(true);
    try {
      const res = await fetch("/.netlify/functions/users-get-all");
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (e) {
      console.error("Failed to load users:", e);
    }
    setLoadingData(false);
  };

  useEffect(() => {
    if (isAdmin) loadUsers();
  }, [isAdmin]);

  const sendPasswordReset = async (email: string, name: string) => {
    if (!confirm(`Send password reset email to ${name} (${email})?`)) return;

    try {
      const res = await fetch("/.netlify/identity/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        alert(`✅ Password reset email sent to ${email}`);
      } else {
        throw new Error("Failed");
      }
    } catch (e) {
      alert("❌ Failed to send reset email. Try again.");
    }
  };

  const updateStatus = async (userId: number, newStatus: string, userName: string) => {
    if (!confirm(`${newStatus === 'active' ? 'Activate' : 'Suspend'} ${userName}?`)) return;

    try {
      await fetch("/.netlify/functions/users-update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, status: newStatus }),
      });
      loadUsers();
    } catch (e) {
      alert("Failed to update user status");
    }
  };

  const deleteUser = async (userId: number, email: string) => {
    if (!confirm(`⚠️ PERMANENTLY DELETE ${email}? This cannot be undone!`)) return;
    if (!confirm(`Are you absolutely sure? This will delete all their data.`)) return;

    try {
      await fetch("/.netlify/functions/users-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      loadUsers();
      alert("✅ User deleted");
    } catch (e) {
      alert("❌ Failed to delete user");
    }
  };

  if (loading || !isAdmin) return null;

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f0e8; min-height: 100vh; font-family: 'DM Sans', sans-serif; }
        .page { max-width: 1200px; margin: 0 auto; padding: 32px 20px; }
        
        .header { margin-bottom: 32px; }
        .logo { font-family: 'Fraunces', serif; font-size: 1.8rem; font-weight: 700; color: #2d4a2d; }
        .logo span { color: #7ab87a; }
        .subtitle { color: #888; font-size: 0.9rem; margin-top: 4px; }

        .back-link {
          display: inline-block;
          color: #7ab87a;
          text-decoration: none;
          font-size: 0.9rem;
          margin-bottom: 16px;
        }
        .back-link:hover { text-decoration: underline; }

        .filters {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .input, .select {
          padding: 10px 14px;
          border: 1.5px solid #e0d8cc;
          border-radius: 10px;
          font-size: 0.9rem;
          background: #fff;
          outline: none;
        }
        .input { flex: 1; min-width: 200px; }
        .select { min-width: 150px; }
        .input:focus, .select:focus { border-color: #7ab87a; }

        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: #fff;
          padding: 16px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(45,74,45,0.06);
        }
        .stat-label { font-size: 0.75rem; color: #999; margin-bottom: 4px; }
        .stat-value { font-family: 'Fraunces', serif; font-size: 1.5rem; color: #2d4a2d; font-weight: 700; }

        .user-card {
          background: #fff;
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 12px;
          box-shadow: 0 2px 10px rgba(45,74,45,0.06);
        }
        .user-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          gap: 12px;
        }
        .user-name { font-weight: 600; font-size: 1rem; color: #1a1a1a; }
        .user-email { font-size: 0.85rem; color: #666; margin-bottom: 4px; }
        .user-meta { font-size: 0.8rem; color: #999; }
        
        .badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .badge-admin { background: #2d4a2d; color: #f5f0e8; }
        .badge-owner { background: #fdf3cc; color: #7a5c00; }
        .badge-customer { background: #e6f0ff; color: #0056b3; }
        .badge-driver { background: #e8f5e9; color: #2e7d32; }
        .badge-active { background: #d4f0d4; color: #2d6a2d; }
        .badge-pending { background: #fff0e6; color: #c67700; }
        .badge-suspended { background: #ffe0e0; color: #c00; }

        .actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 12px;
        }
        .btn {
          padding: 6px 12px;
          border-radius: 8px;
          border: none;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary { background: #2d4a2d; color: #f5f0e8; }
        .btn-primary:hover { background: #3d6b3d; }
        .btn-secondary { background: #f5f0e8; color: #2d4a2d; }
        .btn-secondary:hover { background: #e8e0d4; }
        .btn-danger { background: #dc3545; color: #fff; }
        .btn-danger:hover { background: #c82333; }
        .btn-warning { background: #ff9800; color: #fff; }
        .btn-warning:hover { background: #f57c00; }

        .empty { text-align: center; padding: 60px 20px; color: #bbb; }
        .empty-icon { font-size: 3rem; margin-bottom: 12px; }
      `}</style>

      <div className="page">
        <a href="/admin" className="back-link">← Back to Admin Dashboard</a>
        
        <div className="header">
          <div className="logo">errand<span>s</span></div>
          <div className="subtitle">User Management</div>
        </div>

        <div className="stats">
          <div className="stat-card">
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{users.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active</div>
            <div className="stat-value">{users.filter(u => u.status === 'active').length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending</div>
            <div className="stat-value">{users.filter(u => u.status === 'pending').length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Drivers</div>
            <div className="stat-value">{users.filter(u => u.role === 'independent_driver').length}</div>
          </div>
        </div>

        <div className="filters">
          <input
            className="input"
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <select
            className="select"
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="territory_owner">Territory Owner</option>
            <option value="independent_driver">Driver</option>
            <option value="customer">Customer</option>
          </select>
        </div>

        {loadingData ? (
          <div className="empty">Loading...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">👥</div>
            No users found
          </div>
        ) : (
          filteredUsers.map(u => (
            <div key={u.id} className="user-card">
              <div className="user-header">
                <div>
                  <div className="user-name">
                    {u.full_name}
                    <span className={`badge badge-${u.role === 'independent_driver' ? 'driver' : u.role}`} style={{marginLeft: 8}}>
                      {u.role === 'independent_driver' ? 'Driver' : u.role}
                    </span>
                    <span className={`badge badge-${u.status}`} style={{marginLeft: 4}}>
                      {u.status}
                    </span>
                  </div>
                  <div className="user-email">{u.email}</div>
                  <div className="user-meta">
                    {u.phone && `${u.phone} • `}
                    Joined {new Date(u.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="actions">
                <button
                  className="btn btn-primary"
                  onClick={() => sendPasswordReset(u.email, u.full_name)}
                >
                  🔑 Reset Password
                </button>
                
                {u.status === 'pending' && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => updateStatus(u.id, 'active', u.full_name)}
                  >
                    ✅ Activate
                  </button>
                )}
                
                {u.status === 'active' && (
                  <button
                    className="btn btn-warning"
                    onClick={() => updateStatus(u.id, 'suspended', u.full_name)}
                  >
                    ⚠️ Suspend
                  </button>
                )}
                
                {u.status === 'suspended' && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => updateStatus(u.id, 'active', u.full_name)}
                  >
                    ✅ Reactivate
                  </button>
                )}
                
                <button
                  className="btn btn-danger"
                  onClick={() => deleteUser(u.id, u.email)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
