// app/confirm-email/page.tsx
// Handles email confirmation redirects from Netlify Identity

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ConfirmEmail() {
  const router = useRouter();
  const [status, setStatus] = useState<"confirming" | "success" | "error">("confirming");
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const netlifyIdentity = await import("netlify-identity-widget");
        const identity = netlifyIdentity.default;
        identity.init({ logo: false });

        // Handle confirmation
        identity.on("login", async (u: any) => {
          try {
            // Create DB user record
            await fetch("/.netlify/functions/users-create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                netlify_id: u.id,
                email: u.email,
                full_name: u.user_metadata?.full_name || "",
                phone: u.user_metadata?.phone || "",
                role: u.user_metadata?.role || "customer",
              }),
            });

            setStatus("success");
            setMessage("Email confirmed! Redirecting to login...");
            
            setTimeout(() => {
              router.push("/login");
            }, 2000);
          } catch (e) {
            console.error("Failed to create user record:", e);
            setStatus("error");
            setMessage("Email confirmed but there was an error. Please contact support.");
          }
        });

        identity.on("error", (err: any) => {
          console.error("Confirmation error:", err);
          setStatus("error");
          setMessage("Confirmation failed. Please try again or request a new confirmation email.");
        });

      } catch (e) {
        console.error("Identity widget error:", e);
        setStatus("error");
        setMessage("An error occurred. Please try again.");
      }
    })();
  }, [router]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #f5f0e8;
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .card {
          background: #fff;
          border-radius: 20px;
          padding: 40px;
          max-width: 500px;
          text-align: center;
          box-shadow: 0 4px 24px rgba(45,74,45,0.1);
        }
        .logo {
          font-family: 'Fraunces', serif;
          font-size: 2rem;
          font-weight: 700;
          color: #2d4a2d;
          margin-bottom: 20px;
        }
        .logo span { color: #7ab87a; }
        .status {
          font-size: 3rem;
          margin-bottom: 20px;
        }
        .message {
          font-size: 1.1rem;
          color: #666;
          line-height: 1.6;
        }
        .spinner {
          display: inline-block;
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #7ab87a;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .error { color: #dc3545; }
        .success { color: #7ab87a; }
      `}</style>

      <div className="card">
        <div className="logo">errand<span>s</span></div>
        
        {status === "confirming" && (
          <>
            <div className="spinner"></div>
            <div className="message">Confirming your email...</div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="status success">✅</div>
            <div className="message success">{message}</div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="status error">❌</div>
            <div className="message error">{message}</div>
            <div style={{marginTop: 20}}>
              <a href="/login" style={{color: '#7ab87a'}}>Go to Login</a>
            </div>
          </>
        )}
      </div>
    </>
  );
}
