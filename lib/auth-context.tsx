// lib/auth-context.tsx - FIXED to work with Netlify Identity

"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type User = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
};

type AuthContextType = {
  user: User | null;
  dbUserId: number | null;
  userRole: string | null;
  isAdmin: boolean;
  isTerritoryOwner: boolean;
  isCustomer: boolean;
  isDriver: boolean;
  loading: boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUserId, setDbUserId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const netlifyIdentity = await import("netlify-identity-widget");
      const identity = netlifyIdentity.default;
      identity.init({ logo: false });

      // Get current user from Netlify Identity widget
      const netlifyUser = identity.currentUser();
      
      if (netlifyUser) {
        setUser(netlifyUser);

        // Get DB user info
        const dbRes = await fetch(`/.netlify/functions/users-get-by-email?email=${netlifyUser.email}`);
        if (dbRes.ok) {
          const dbUser = await dbRes.json();
          setDbUserId(dbUser.id);
          setUserRole(dbUser.role);
        }
      }

      // Listen for login/logout events
      identity.on("login", async (u: any) => {
        setUser(u);
        const dbRes = await fetch(`/.netlify/functions/users-get-by-email?email=${u.email}`);
        if (dbRes.ok) {
          const dbUser = await dbRes.json();
          setDbUserId(dbUser.id);
          setUserRole(dbUser.role);
        }
      });

      identity.on("logout", () => {
        setUser(null);
        setDbUserId(null);
        setUserRole(null);
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

  const isAdmin = userRole === "admin";
  const isTerritoryOwner = userRole === "territory_owner";
  const isCustomer = userRole === "customer";
  const isDriver = userRole === "independent_driver";

  return (
    <AuthContext.Provider
      value={{
        user,
        dbUserId,
        userRole,
        isAdmin,
        isTerritoryOwner,
        isCustomer,
        isDriver,
        loading,
        logout,
      }}
    >
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
