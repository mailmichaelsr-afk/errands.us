"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetch("/.netlify/functions/requests-get")
      .then(res => res.json())
      .then(data => setRequests(data));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Errands.us</h1>
      <h2>Runner Request Board</h2>

      {requests.length === 0 && <p>No errands yet.</p>}

      {requests.map((r) => (
        <div key={r.id} style={{border:"1px solid #ccc",padding:10,marginBottom:10}}>
          <b>{r.title}</b>
          <p>Pickup: {r.pickup}</p>
          <p>Dropoff: {r.dropoff}</p>
          <button>Message</button>
          <button style={{marginLeft:10}}>Accept</button>
        </div>
      ))}
    </div>
  );
}
