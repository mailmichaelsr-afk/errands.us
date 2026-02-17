// lib/auth-context.tsx
// Wraps the app with authentication state

"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type User = {
  id: string;
  email: string;
  user_metadata: { 
    full_name?: string; 
    role?: string; 
    phone?: string; 
    avatar_url?: string;
    db_user_id?: number;  // reference to users table
  };
  app_metadata: { roles?: string[] };
  token?: { access_token: string };
};

type AuthContextType = {
  user: User | null;
  dbUserId: number | null;
  role: string | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
  signup: () => void;
  getToken: () => string | null;
  isAdmin: boolean;
  isCustomer: boolean;
  isTerritoryOwner: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  dbUserId: null,
  role: null,
  loading: true,
  login: () => {},
  logout: () => {},
  signup: () => {},
  getToken: () => null,
  isAdmin: false,
  isCustomer: false,
  isTerritoryOwner: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [identity, setIdentity] = useState<any>(null);

  useEffect(() => {
    // Dynamically import netlify-identity-widget
    import("netlify-identity-widget").then((mod) => {
      const netlifyIdentity = mod.default;
      setIdentity(netlifyIdentity);
      netlifyIdentity.init({ logo: false });

      const current = netlifyIdentity.currentUser();
      if (current) setUser(current as User);
      setLoading(false);

      netlifyIdentity.on("login", (u: any) => {
        setUser(u);
        netlifyIdentity.close();
      });
      netlifyIdentity.on("logout", () => setUser(null));
      netlifyIdentity.on("error", (err: any) => console.error("Identity error:", err));
    });
  }, []);

  const role = user?.user_metadata?.role 
    ?? user?.app_metadata?.roles?.[0] 
    ?? null;

  const dbUserId = user?.user_metadata?.db_user_id ?? null;

  const login = () => identity?.open("login");
  const logout = () => identity?.logout();
  const signup = () => identity?.open("signup");
  const getToken = () => user?.token?.access_token ?? null;

  const isAdmin = role === "admin";
  const isCustomer = role === "customer";
  const isTerritoryOwner = role === "territory_owner";

  return (
    <AuthContext.Provider value={{ 
      user, 
      dbUserId,
      role, 
      loading, 
      login, 
      logout, 
      signup,
      getToken,
      isAdmin,
      isCustomer,
      isTerritoryOwner,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
