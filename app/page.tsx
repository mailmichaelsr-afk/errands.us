// app/page.tsx
"use client";

import { useEffect, useState } from "react";

type RequestRow = {
  id: number;
  title: string;
  pickup: string;
  dropoff: string;
  status: string;
};

export default function Home() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [title, setTitle] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const loadRequests = async () => {
    setError("");
    try {
      const res = await fetch("/.netlify/functions/requests-get");
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load requests");
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const createRequest = async () => {
    setError("");
    const t = title.trim();
    const p = pickup.trim();
    const d = dropoff.trim();

    if (!t || !p || !d) {
      setError("Please enter Title, Pickup, and Dropoff.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/.netlify/functions/requests-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t, pickup: p, dropoff: d }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to create request");
      }

      setTitle("");
      setPickup("");
      setDropoff("");

      await loadRequests();
    } catch (e: any) {
      setError(e?.message || "Failed to create request");
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (id: number) => {
    setError("");
    try {
      const res = await fetch("/.netlify/functions/requests-accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to accept request");
      }

      await loadRequests();
    } catch (e: any) {
      setError(e?.message || "Failed to accept request");
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>Errands.us</h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <a href="/" style={{ textDecoration: "underline" }}>
          Board
        </a>
        <a href="/runner" style={{ textDecoration: "underline" }}>
          Runner
        </a>
      </div>

      <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>Create Errand</h2>

        <input
          style={{ width: "100%", marginBottom: 8, padding: 8 }}
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          style={{ width: "100%", marginBottom: 8, padding: 8 }}
          placeholder="Pickup"
          value={pickup}
          onChange={(e) => setPickup(e.target.value)}
        />

        <input
          style={{ width: "100%", marginBottom: 10, padding: 8 }}
          placeholder="Dropoff"
          value={dropoff}
          onChange={(e) => setDropoff(e.target.value)}
        />

        <button onClick={createRequest} disabled={loading}>
          {loading ? "Posting..." : "Post Errand"}
        </button>

        {error && <p style={{ marginTop: 10 }}>{error}</p>}
      </div>

      <h2>Runner Request Board</h2>

      {requests.length === 0 && <p>No errands yet.</p>}

      {requests.map((r) => (
        <div
          key={r.id}
          style={{
            border: "1px solid #ccc",
            padding: 12,
            marginBottom: 10,
            borderRadius: 8,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <b>{r.title}</b>
            <span>Status: {r.status}</span>
          </div>

          <div style={{ marginTop: 6 }}>Pickup: {r.pickup}</div>
          <div>Dropoff: {r.dropoff}</div>

          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a href={`/request/${r.id}`} style={{ textDecoration: "underline" }}>
              Open chat
            </a>

            {r.status !== "accepted" && (
              <button onClick={() => acceptRequest(r.id)}>Accept</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
  }
