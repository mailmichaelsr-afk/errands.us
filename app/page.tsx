// app/page.tsx

"use client";
import { useEffect, useState } from "react";

type Req = {
  id: number;
  title: string;
  description?: string | null;
  pickup: string;
  dropoff: string;
  status: string;
  scheduled_time?: string | null;
  preferred_runner_id?: number | null;
  territory_key?: string | null;
};

type Availability = {
  runner_id: number;
  is_available: boolean;
  note?: string | null;
  updated_at?: string;
};

export default function Home() {
  const [requests, setRequests] = useState<Req[]>([]);
  const [available, setAvailable] = useState<Availability[]>([]);
  const [title, setTitle] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [preferredRunnerId, setPreferredRunnerId] = useState<number | "">("");
  const [territoryKey, setTerritoryKey] = useState("");

  const load = async () => {
    const r = await fetch("/.netlify/functions/requests-get");
    const a = await fetch("/.netlify/functions/availability-get");
    setRequests(await r.json());
    setAvailable(await a.json());
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    await fetch("/.netlify/functions/requests-create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        pickup,
        dropoff,
        description,
        scheduled_time: scheduledTime || null,
        preferred_runner_id: preferredRunnerId === "" ? null : preferredRunnerId,
        territory_key: territoryKey || null,
      }),
    });
    setTitle("");
    setPickup("");
    setDropoff("");
    setDescription("");
    setScheduledTime("");
    setPreferredRunnerId("");
    setTerritoryKey("");
    load();
  };

  const accept = async (id: number) => {
    const runner_id = Number(prompt("Runner ID accepting this job? (temporary)") || "0");
    if (!runner_id) return;
    await fetch("/.netlify/functions/requests-accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, runner_id }),
    });
    load();
  };

  const complete = async (id: number) => {
    await fetch("/.netlify/functions/requests-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  const schedule = async (id: number) => {
    const when = prompt("New scheduled time (ISO or YYYY-MM-DD HH:mm):");
    if (!when) return;
    await fetch("/.netlify/functions/requests-schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, scheduled_time: when }),
    });
    load();
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>Errands.us</h1>

      <div style={{ marginBottom: 12 }}>
        <a href="/">Board</a> | <a href="/runner">Runner</a>
      </div>

      <h3>Available Runners</h3>
      {available.length === 0 && <p>No runners currently available.</p>}
      {available.map((r) => (
        <div key={r.runner_id}>
          Runner #{r.runner_id} {r.note ? `(${r.note})` : ""}
        </div>
      ))}

      <hr />

      <h3>Create Errand</h3>
      <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <br />
      <input placeholder="Pickup" value={pickup} onChange={(e) => setPickup(e.target.value)} />
      <br />
      <input placeholder="Dropoff" value={dropoff} onChange={(e) => setDropoff(e.target.value)} />
      <br />
      <textarea
        placeholder="Description / Notes"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <br />
      <input
        type="datetime-local"
        value={scheduledTime}
        onChange={(e) => setScheduledTime(e.target.value)}
      />
      <br />
      <input
        type="number"
        placeholder="Preferred Runner ID"
        value={preferredRunnerId}
        onChange={(e) => setPreferredRunnerId(e.target.value === "" ? "" : Number(e.target.value))}
      />
      <br />
      <input
        placeholder="Territory Key (optional)"
        value={territoryKey}
        onChange={(e) => setTerritoryKey(e.target.value)}
      />
      <br />
      <button onClick={create}>Post</button>

      <hr />

      <h2>Board</h2>
      {requests.map((r) => (
        <div key={r.id} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
          <b>{r.title}</b>
          <p>{r.pickup} → {r.dropoff}</p>
          {r.description && <p>{r.description}</p>}
          <p>Status: {r.status}</p>
          {r.scheduled_time && <p>Scheduled: {new Date(r.scheduled_time).toLocaleString()}</p>}
          {r.preferred_runner_id && <p>Preferred Runner: #{r.preferred_runner_id}</p>}
          {r.territory_key && <p>Territory: {r.territory_key}</p>}

          <button onClick={() => (location.href = `/request/${r.id}`)}>Open Chat</button>
          {r.status === "open" && <button onClick={() => accept(r.id)}>Accept</button>}
          {r.status === "accepted" && <button onClick={() => complete(r.id)}>Complete</button>}
          <button onClick={() => schedule(r.id)}>Schedule</button>
        </div>
      ))}
    </div>
  );
      }
