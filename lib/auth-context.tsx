// lib/auth-context.tsx (simplified - looks up by email only)

"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type User = any; // Netlify Identity user
type DbUser = {
  id: number;
  email: string;
  full_name: string;
  role: string;
  status: string;
};

type AuthContextType = {
  user: User | null;
  dbUser: DbUser | null;
  dbUserId: number | null;
  role: string | null;
  loading: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  isTerritoryOwner: boolean;
  login: () => void;
  logout: () => void;
  signup: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  dbUser: null,
  dbUserId: null,
  role: null,
  loading: true,
  isAdmin: false,
  isCustomer: false,
  isTerritoryOwner: false,
  login: () => {},
  logout: () => {},
  signup: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [identity, setIdentity] = useState<any>(null);

  // Load Netlify Identity
  useEffect(() => {
    if (typeof window === "undefined") return;

    import("netlify-identity-widget").then((mod) => {
      const ni = mod.default;
      ni.init({ logo: false });
      setIdentity(ni);

      // Get current user
      const currentUser = ni.currentUser();
      setUser(currentUser);

      // Listen for auth changes
      ni.on("login", (user: any) => {
        setUser(user);
        ni.close();
      });

      ni.on("logout", () => {
        setUser(null);
        setDbUser(null);
      });

      setLoading(false);
    });
  }, []);

  // Load database user when Netlify user changes
  useEffect(() => {
    if (!user?.email) {
      setDbUser(null);
      return;
    }

    // Fetch database user by email
    fetch(`/.netlify/functions/users-get-by-email?email=${encodeURIComponent(user.email)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setDbUser(data);
          console.log("Loaded DB user:", data);
        } else {
          console.warn("No database user found for email:", user.email);
        }
      })
      .catch(err => {
        console.error("Failed to load database user:", err);
      });
  }, [user?.email]);

  const login = () => identity?.open("login");
  const logout = () => identity?.logout();
  const signup = () => identity?.open("signup");

  const dbUserId = dbUser?.id || null;
  const role = dbUser?.role || null;
  const isAdmin = role === "admin";
  const isCustomer = role === "customer";
  const isTerritoryOwner = role === "territory_owner";

  return (
    <AuthContext.Provider
      value={{
        user,
        dbUser,
        dbUserId,
        role,
        loading,
        isAdmin,
        isCustomer,
        isTerritoryOwner,
        login,
        logout,
        signup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
