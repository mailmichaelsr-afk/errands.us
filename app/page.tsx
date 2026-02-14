"use client";
import { useEffect, useState } from "react";

type Request = {
  id: number;
  title: string;
  pickup: string;
  dropoff: string;
};

export default function Home() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [title, setTitle] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [loading, setLoading] = useState(false);

  const loadRequests = () => {
    fetch("/.netlify/functions/requests-get")
      .then((res) => res.json())
      .then((data) => setRequests(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const createRequest = async () => {
    if (!title || !pickup || !dropoff) return;

    setLoading(true);

    try {
      await fetch("/.netlify/functions/requests-create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          pickup,
          dropoff,
        }),
      });

      setTitle("");
      setPickup("");
      setDropoff("");

      loadRequests();
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>Errands.us</h1>

      <h2>Create Errand</h2>
      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <br />
        <input
          placeholder="Pickup location"
          value={pickup}
          onChange={(e) => setPickup(e.target.value)}
        />
        <br />
        <input
          placeholder="Dropoff location"
          value={dropoff}
          onChange={(e) => setDropoff(e.target.value)}
        />
        <br />
        <button onClick={createRequest} disabled={loading}>
          {loading ? "Posting..." : "Post Errand"}
        </button>
      </div>

      <h2>Runner Request Board</h2>

      {requests.length === 0 && <p>No errands yet.</p>}

      {requests.map((r) => (
        <div
          key={r.id}
          style={{
            border: "1px solid #ccc",
            padding: 10,
            marginBottom: 10,
            borderRadius: 6,
          }}
        >
          <b>{r.title}</b>
          <p>Pickup: {r.pickup}</p>
          <p>Dropoff: {r.dropoff}</p>

          <button>Message</button>
          <button style={{ marginLeft: 10 }}>Accept</button>
        </div>
      ))}
    </div>
  );
}
