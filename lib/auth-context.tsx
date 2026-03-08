// lib/auth-context.tsx - COMPLETE VERSION with isDriver

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
      const res = await fetch("/.netlify/identity/user");
      if (res.ok) {
        const netlifyUser = await res.json();
        setUser(netlifyUser);

        // Get DB user info
        const dbRes = await fetch(`/.netlify/functions/users-get-by-email?email=${netlifyUser.email}`);
        if (dbRes.ok) {
          const dbUser = await dbRes.json();
          setDbUserId(dbUser.id);
          setUserRole(dbUser.role);
        }
      }
    } catch (e) {
      console.error("Auth check failed:", e);
    }
    setLoading(false);
  };

  const logout = async () => {
    await fetch("/.netlify/identity/logout", { method: "POST" });
    setUser(null);
    setDbUserId(null);
    setUserRole(null);
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
