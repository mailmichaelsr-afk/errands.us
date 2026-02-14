"use client";
import { useEffect,useState } from "react";

type Req={id:number,title:string,pickup:string,dropoff:string,status:string};

export default function Home(){
const [requests,setRequests]=useState<Req[]>([]);
const [title,setTitle]=useState("");
const [pickup,setPickup]=useState("");
const [dropoff,setDropoff]=useState("");

const load=()=>fetch("/.netlify/functions/requests-get")
.then(r=>r.json()).then(setRequests);

useEffect(()=>{load();},[]);

const create=async()=>{
await fetch("/.netlify/functions/requests-create",{method:"POST",
body:JSON.stringify({title,pickup,dropoff})});
setTitle("");setPickup("");setDropoff("");
load();
};

const accept=async(id:number)=>{
await fetch("/.netlify/functions/requests-accept",{method:"POST",
body:JSON.stringify({id})});
load();
};

return(
<div style={{padding:20}}>
<h1>Errands.us</h1>

<h3>Create Errand</h3>
<input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)}/>
<input placeholder="Pickup" value={pickup} onChange={e=>setPickup(e.target.value)}/>
<input placeholder="Dropoff" value={dropoff} onChange={e=>setDropoff(e.target.value)}/>
<button onClick={create}>Post</button>

<h2>Board</h2>
{requests.map(r=>(
<div key={r.id} style={{border:"1px solid #ccc",margin:10,padding:10}}>
<b>{r.title}</b>
<p>{r.pickup} → {r.dropoff}</p>
<p>Status: {r.status}</p>
<button onClick={()=>location.href=`/request/${r.id}`}>Open</button>
{r.status!=="accepted"&&
<button onClick={()=>accept(r.id)}>Accept</button>}
</div>
))}
</div>
);
}
