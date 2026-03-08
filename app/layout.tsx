// app/layout.tsx - With AdminRoleSwitcher

import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth-context";
import AdminRoleSwitcher from "@/components/AdminRoleSwitcher";
import "./globals.css";

export const metadata: Metadata = {
  title: "errands",
  description: "Your neighborhood helping hands",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <AdminRoleSwitcher />
        </AuthProvider>
      </body>
    </html>
  );
}
