// components/AdminRoleSwitcher.tsx - Floating role switcher for admins

"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function AdminRoleSwitcher() {
  const { user, dbUserId, userRole, isAdmin } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);

  // Only show for admins
  if (!isAdmin) return null;

  const switchRole = async (newRole: string) => {
    setSwitchingRole(true);
    
    try {
      await fetch("/.netlify/functions/admin-switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          user_id: dbUserId,
          new_role: newRole 
        }),
      });
      
      // Reload to refresh auth context
      window.location.reload();
    } catch (e) {
      console.error("Failed to switch role:", e);
      alert("Failed to switch role");
    }
    
    setSwitchingRole(false);
  };

  const currentRoleLabel = () => {
    if (userRole === 'admin') return '👑 Admin';
    if (userRole === 'territory_owner') return '📊 Owner';
    if (userRole === 'independent_driver') return '🚗 Driver';
    if (userRole === 'customer') return '🛒 Customer';
    return userRole;
  };

  return (
    <>
      <style>{`
        .role-switcher {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9999;
        }
        .role-button {
          background: linear-gradient(135deg, #2d4a2d 0%, #3d6b3d 100%);
          color: #f5f0e8;
          border: none;
          padding: 12px 18px;
          border-radius: 100px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(45,74,45,0.3);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .role-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(45,74,45,0.4);
        }
        .role-menu {
          position: absolute;
          bottom: 100%;
          right: 0;
          margin-bottom: 12px;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(45,74,45,0.2);
          border: 2px solid #2d4a2d;
          min-width: 220px;
          overflow: hidden;
        }
        .role-menu-header {
          background: #2d4a2d;
          color: #f5f0e8;
          padding: 12px 16px;
          font-weight: 600;
          font-size: 0.85rem;
          border-bottom: 1px solid #3d6b3d;
        }
        .role-option {
          padding: 12px 16px;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          color: #1a1a1a;
          transition: background 0.2s;
          border-bottom: 1px solid #f5f0e8;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .role-option:last-child { border-bottom: none; }
        .role-option:hover { background: #f0f7f0; }
        .role-option.active {
          background: #e6f0e6;
          font-weight: 600;
          color: #2d4a2d;
        }
        .role-option:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .warning {
          padding: 12px 16px;
          background: #fff0e6;
          color: #c67700;
          font-size: 0.75rem;
          border-top: 1px solid #ffd699;
          line-height: 1.4;
        }
      `}</style>

      <div className="role-switcher">
        {isOpen && (
          <div className="role-menu">
            <div className="role-menu-header">
              🔄 Switch Test Role
            </div>
            
            <button 
              className={`role-option ${userRole === 'admin' ? 'active' : ''}`}
              onClick={() => switchRole('admin')}
              disabled={switchingRole || userRole === 'admin'}
            >
              👑 Admin
              {userRole === 'admin' && <span style={{marginLeft: 'auto', fontSize: '0.8rem'}}>✓</span>}
            </button>
            
            <button 
              className={`role-option ${userRole === 'territory_owner' ? 'active' : ''}`}
              onClick={() => switchRole('territory_owner')}
              disabled={switchingRole || userRole === 'territory_owner'}
            >
              📊 Territory Owner
              {userRole === 'territory_owner' && <span style={{marginLeft: 'auto', fontSize: '0.8rem'}}>✓</span>}
            </button>
            
            <button 
              className={`role-option ${userRole === 'independent_driver' ? 'active' : ''}`}
              onClick={() => switchRole('independent_driver')}
              disabled={switchingRole || userRole === 'independent_driver'}
            >
              🚗 Independent Driver
              {userRole === 'independent_driver' && <span style={{marginLeft: 'auto', fontSize: '0.8rem'}}>✓</span>}
            </button>
            
            <button 
              className={`role-option ${userRole === 'customer' ? 'active' : ''}`}
              onClick={() => switchRole('customer')}
              disabled={switchingRole || userRole === 'customer'}
            >
              🛒 Customer
              {userRole === 'customer' && <span style={{marginLeft: 'auto', fontSize: '0.8rem'}}>✓</span>}
            </button>

            <div className="warning">
              ⚠️ Role switching is for testing only. You can always switch back to Admin.
            </div>
          </div>
        )}

        <button 
          className="role-button"
          onClick={() => setIsOpen(!isOpen)}
        >
          {switchingRole ? '⏳ Switching...' : currentRoleLabel()}
          <span style={{fontSize: '0.7rem'}}>{isOpen ? '▼' : '▲'}</span>
        </button>
      </div>
    </>
  );
}
