export default function Home() {
  return (
    <div style={{padding:20,fontFamily:"Arial"}}>
      <h1>Errands.us</h1>
      <h2>Runner Request Board (V1)</h2>

      <div style={{marginTop:20}}>
        <div style={{border:"1px solid #ccc",padding:10,marginBottom:10}}>
          <b>Walgreens Pickup</b>
          <p>Pickup: Main St Walgreens</p>
          <p>Dropoff: 123 Maple Ave</p>
          <button>Message</button>
          <button style={{marginLeft:10}}>Accept</button>
        </div>

        <div style={{border:"1px solid #ccc",padding:10}}>
          <b>Grocery Errand</b>
          <p>Pickup: Local Grocery</p>
          <p>Dropoff: Oak Street</p>
          <button>Message</button>
          <button style={{marginLeft:10}}>Accept</button>
        </div>
      </div>
    </div>
  );
}
