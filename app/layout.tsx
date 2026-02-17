// app/layout.tsx

import { AuthProvider } from "@/lib/auth-context";

export const metadata = { 
  title: "Errands", 
  description: "Local errand service platform" 
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
