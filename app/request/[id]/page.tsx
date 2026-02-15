// app/request/[id]/page.tsx

"use client";
import { useEffect, useState } from "react";

export default function RequestPage({ params }:any) {
  const [msgs,setMsgs]=useState<any[]>([]);
  const [text,setText]=useState("");

  const load=async()=>{
    const res=await fetch(`/.netlify/functions/messages-get?id=${params.id}`);
    setMsgs(await res.json());
  };

  useEffect(()=>{load();},[]);

  const send=async()=>{
    await fetch("/.netlify/functions/messages-create",{
      method:"POST",
      body:JSON.stringify({request_id:params.id,body:text})
    });
    setText("");
    load();
  };

  return(
    <div style={{maxWidth:600,margin:"40px auto",fontFamily:"Arial"}}>
      <a href="/">← Back</a>
      <h2>Conversation</h2>

      <div style={{background:"#fff",padding:20,borderRadius:10,minHeight:300}}>
        {msgs.map(m=>(
          <div key={m.id} style={{marginBottom:10}}>
            <div style={{background:"#eee",padding:10,borderRadius:6,display:"inline-block"}}>
              {m.body}
            </div>
          </div>
        ))}
      </div>

      <div style={{marginTop:10,display:"flex"}}>
        <input
          style={{flex:1,padding:10}}
          value={text}
          onChange={(e)=>setText(e.target.value)}
          placeholder="Type message..."
        />
        <button onClick={send} style={{marginLeft:8}}>Send</button>
      </div>
    </div>
  );
}
