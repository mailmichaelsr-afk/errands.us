// app/page.tsx

"use client";
import { useEffect, useState } from "react";

type Req = {
  id: number;
  title: string;
  pickup: string;
  dropoff: string;
  status: string;
};

export default function Home() {
  const [requests, setRequests] = useState<Req[]>([]);
  const [title, setTitle] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");

  const load = async () => {
    const res = await fetch("/.netlify/functions/requests-get");
    setRequests(await res.json());
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    await fetch("/.netlify/functions/requests-create", {
      method: "POST",
      body: JSON.stringify({ title, pickup, dropoff }),
    });
    setTitle("");
    setPickup("");
    setDropoff("");
    load();
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1>Errands</h1>
        <a href="/runner">Runner Mode</a>
      </header>

      <div style={styles.card}>
        <h3>Request an Errand</h3>

        <input
          style={styles.input}
          placeholder="What do you need?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          style={styles.input}
          placeholder="Pickup location"
          value={pickup}
          onChange={(e) => setPickup(e.target.value)}
        />

        <input
          style={styles.input}
          placeholder="Dropoff location"
          value={dropoff}
          onChange={(e) => setDropoff(e.target.value)}
        />

        <button style={styles.primaryBtn} onClick={create}>
          Post Request
        </button>
      </div>

      <h2>Open Requests</h2>

      {requests.map((r) => (
        <div key={r.id} style={styles.request}>
          <div>
            <b>{r.title}</b>
            <p>{r.pickup} → {r.dropoff}</p>
          </div>

          <div>
            <span style={styles.status}>{r.status}</span>
            <button
              style={styles.linkBtn}
              onClick={() => (location.href = `/request/${r.id}`)}
            >
              Open
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

const styles:any = {
  page:{maxWidth:700,margin:"40px auto",fontFamily:"Arial"},
  header:{display:"flex",justifyContent:"space-between",marginBottom:20},
  card:{background:"#fff",padding:20,borderRadius:10,boxShadow:"0 2px 8px rgba(0,0,0,.1)"},
  input:{display:"block",width:"100%",marginBottom:10,padding:10,borderRadius:6,border:"1px solid #ccc"},
  primaryBtn:{background:"#111",color:"#fff",padding:"10px 14px",borderRadius:6,border:"none",cursor:"pointer"},
  request:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:14,background:"#fff",marginTop:12,borderRadius:8,boxShadow:"0 1px 4px rgba(0,0,0,.08)"},
  status:{marginRight:10,fontSize:12,color:"#666"},
  linkBtn:{background:"transparent",border:"none",color:"#0070f3",cursor:"pointer"}
};
