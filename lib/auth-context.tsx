"use client";
// lib/auth-context.tsx

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

const PREVIEW_ROLE_KEY = 'errands_preview_role';

type User = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  } | null;
};

type AuthContextType = {
  user: User | null;
  dbUserId: number | null;
  userRole: string | null;
  isAdmin: boolean;
  isActualAdmin: boolean; // true if DB role is admin, regardless of preview
  isTerritoryOwner: boolean;
  isCustomer: boolean;
  isRunner: boolean;
  isDriver: boolean;
  loading: boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUserId, setDbUserId] = useState<number | null>(null);
  const [dbRole, setDbRole] = useState<string | null>(null); // actual DB role
  const [userRole, setUserRole] = useState<string | null>(null); // effective role (may be preview)
  const [loading, setLoading] = useState(true);

  const applyRole = (role: string) => {
    setDbRole(role);
    // If admin, check for preview role in sessionStorage
    if (role === 'admin' && typeof window !== 'undefined') {
      const preview = sessionStorage.getItem(PREVIEW_ROLE_KEY);
      setUserRole(preview || role);
    } else {
      setUserRole(role);
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const netlifyIdentity = await import("netlify-identity-widget");
      const identity = netlifyIdentity.default;
      identity.init({ logo: false });

      const netlifyUser = identity.currentUser();

      if (netlifyUser) {
        setUser(netlifyUser);
        const dbRes = await fetch(`/.netlify/functions/users-get-by-email?email=${netlifyUser.email}`);
        if (dbRes.ok) {
          const dbUser = await dbRes.json();
          setDbUserId(dbUser.id);
          applyRole(dbUser.role);
        }
      }

      identity.on("login", async (u: any) => {
        setUser(u);
        const dbRes = await fetch(`/.netlify/functions/users-get-by-email?email=${u.email}`);
        if (dbRes.ok) {
          const dbUser = await dbRes.json();
          setDbUserId(dbUser.id);
          applyRole(dbUser.role);
        }
      });

      identity.on("logout", () => {
        setUser(null);
        setDbUserId(null);
        setDbRole(null);
        setUserRole(null);
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(PREVIEW_ROLE_KEY);
        }
      });

    } catch (e) {
      console.error("Auth check failed:", e);
    }
    setLoading(false);
  };

  const logout = async () => {
    try {
      const netlifyIdentity = await import("netlify-identity-widget");
      const identity = netlifyIdentity.default;
      identity.logout();
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  const isActualAdmin = dbRole === 'admin';
  const isAdmin = isActualAdmin; // always based on DB, never preview
  const isTerritoryOwner = userRole === 'territory_owner';
  const isCustomer = userRole === 'customer';
  const isRunner = userRole === 'runner';
  const isDriver = userRole === 'runner' || userRole === 'independent_driver';

  return (
    <AuthContext.Provider value={{
      user, dbUserId, userRole,
      isAdmin, isActualAdmin,
      isTerritoryOwner, isCustomer,
      isRunner, isDriver,
      loading, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
