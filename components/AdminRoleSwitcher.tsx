"use client";
// components/AdminRoleSwitcher.tsx
// Preview roles without touching the database ever.
// Uses sessionStorage so preview survives page reloads.
// DB role stays 'admin' permanently.

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

export const PREVIEW_ROLE_KEY = 'errands_preview_role';

export default function AdminRoleSwitcher() {
  const { user, userRole, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [previewRole, setPreviewRole] = useState<string | null>(null);

  // Load preview role from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(PREVIEW_ROLE_KEY);
    if (stored) setPreviewRole(stored);
  }, []);

  // Only show for admins
  if (!isAdmin) return null;

  const activeRole = previewRole || userRole || 'admin';

  const switchRole = (newRole: string) => {
    if (newRole === 'admin') {
      sessionStorage.removeItem(PREVIEW_ROLE_KEY);
      setPreviewRole(null);
    } else {
      sessionStorage.setItem(PREVIEW_ROLE_KEY, newRole);
      setPreviewRole(newRole);
    }
    setIsOpen(false);
    window.location.reload();
  };

  const roleLabel = (role: string) => {
    if (role === 'admin') return '👑 Admin';
    if (role === 'territory_owner') return '📊 Owner';
    if (role === 'runner') return '🏃 Runner';
    if (role === 'customer') return '🛒 Customer';
    return role;
  };

  return (
    <>
      <style>{`
        .role-switcher {
          position: fixed; bottom: 20px; right: 20px; z-index: 9999;
        }
        .role-button {
          background: linear-gradient(135deg, #2d4a2d 0%, #3d6b3d 100%);
          color: #f5f0e8; border: none; padding: 12px 18px;
          border-radius: 100px; font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem; font-weight: 600; cursor: pointer;
          box-shadow: 0 4px 20px rgba(45,74,45,0.3); transition: all 0.2s;
          display: flex; align-items: center; gap: 8px;
        }
        .role-button:hover { transform: translateY(-2px); }
        .preview-badge {
          background: #ff9800; color: #fff; font-size: 0.65rem;
          padding: 2px 6px; border-radius: 10px; margin-left: 4px;
        }
        .role-menu {
          position: absolute; bottom: 100%; right: 0; margin-bottom: 12px;
          background: #fff; border-radius: 16px;
          box-shadow: 0 8px 32px rgba(45,74,45,0.2);
          border: 2px solid #2d4a2d; min-width: 220px; overflow: hidden;
        }
        .role-menu-header {
          background: #2d4a2d; color: #f5f0e8;
          padding: 12px 16px; font-weight: 600; font-size: 0.85rem;
        }
        .role-option {
          padding: 12px 16px; border: none; background: none;
          width: 100%; text-align: left; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 0.9rem;
          color: #1a1a1a; transition: background 0.2s;
          border-bottom: 1px solid #f5f0e8;
          display: flex; align-items: center; gap: 10px;
        }
        .role-option:last-child { border-bottom: none; }
        .role-option:hover { background: #f0f7f0; }
        .role-option.active { background: #e6f0e6; font-weight: 600; color: #2d4a2d; }
        .role-option:disabled { opacity: 0.5; cursor: default; }
        .warning {
          padding: 10px 16px; background: #f0f7f0;
          color: #2d4a2d; font-size: 0.75rem;
          border-top: 1px solid #c8e6c8; line-height: 1.4;
        }
      `}</style>

      <div className="role-switcher">
        {isOpen && (
          <div className="role-menu">
            <div className="role-menu-header">👁️ Preview As Role</div>
            {[
              { role: 'admin', label: '👑 Admin' },
              { role: 'territory_owner', label: '📊 Territory Owner' },
              { role: 'runner', label: '🏃 Runner' },
              { role: 'customer', label: '🛒 Customer' },
            ].map(({ role, label }) => (
              <button
                key={role}
                className={`role-option ${activeRole === role ? 'active' : ''}`}
                onClick={() => switchRole(role)}
                disabled={activeRole === role}
              >
                {label}
                {activeRole === role && <span style={{marginLeft: 'auto'}}>✓</span>}
              </button>
            ))}
            <div className="warning">
              ✅ Your DB role stays Admin forever. This is preview only.
            </div>
          </div>
        )}

        <button className="role-button" onClick={() => setIsOpen(!isOpen)}>
          {roleLabel(activeRole)}
          {previewRole && <span className="preview-badge">PREVIEW</span>}
          <span style={{fontSize: '0.7rem'}}>{isOpen ? '▼' : '▲'}</span>
        </button>
      </div>
    </>
  );
}
