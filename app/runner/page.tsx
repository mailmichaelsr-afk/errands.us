// app/runner/page.tsx

"use client";
import { useEffect,useState } from "react";

export default function Runner(){
  const [requests,setRequests]=useState<any[]>([]);

  const load=async()=>{
    const res=await fetch("/.netlify/functions/requests-get");
    setRequests(await res.json());
  };

  useEffect(()=>{load();},[]);

  return(
    <div style={{maxWidth:700,margin:"40px auto",fontFamily:"Arial"}}>
      <a href="/">← Back</a>
      <h1>Runner Dashboard</h1>

      {requests.map(r=>(
        <div key={r.id} style={{
          background:"#fff",
          padding:16,
          borderRadius:10,
          marginTop:12,
          boxShadow:"0 1px 4px rgba(0,0,0,.1)"
        }}>
          <b>{r.title}</b>
          <p>{r.pickup} → {r.dropoff}</p>
        </div>
      ))}
    </div>
  );
}
