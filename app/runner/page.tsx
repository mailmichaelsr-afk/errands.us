// app/runner/page.tsx

"use client";
import { useEffect, useState } from "react";

type Req = {
  id: number;
  title: string;
  pickup: string;
  dropoff: string;
  status: string;
  scheduled_time?: string | null;
};

export default function Runner() {
  const [requests, setRequests] = useState<Req[]>([]);
  const [runnerId, setRunnerId] = useState<number>(1);
  const [isAvailable, setIsAvailable] = useState(false);
  const [note, setNote] = useState("");

  const load = async () => {
    const r = await fetch("/.netlify/functions/requests-get?scheduled=1");
    setRequests(await r.json());
  };

  useEffect(() => {
    load();
  }, []);

  const toggleAvailability = async () => {
    await fetch("/.netlify/functions/availability-set", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runner_id: runnerId, is_available: !isAvailable, note }),
    });
    setIsAvailable(!isAvailable);
  };

  const open = requests.filter((r) => r.status === "open");
  const accepted = requests.filter((r) => r.status === "accepted");

  return (
    <div style={{ padding: 20 }}>
      <a href="/">← Board</a>
      <h1>Runner Planning Dashboard</h1>

      <div>
        <input
          type="number"
          value={runnerId}
          onChange={(e) => setRunnerId(Number(e.target.value))}
          placeholder="Runner ID"
        />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Availability note" />
        <button onClick={toggleAvailability}>
          {isAvailable ? "Go Offline" : "Go Available"}
        </button>
      </div>

      <h2>Open</h2>
      {open.map((r) => (
        <div key={r.id}>
          {r.title} — {r.pickup} → {r.dropoff}
        </div>
      ))}

      <h2>Accepted</h2>
      {accepted.map((r) => (
        <div key={r.id}>
          {r.title} — {r.pickup} → {r.dropoff}
          {r.scheduled_time && ` (Scheduled ${new Date(r.scheduled_time).toLocaleString()})`}
        </div>
      ))}
    </div>
  );
          }
