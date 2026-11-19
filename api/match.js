// Vercel serverless fn: (1) Claude matches + scores + answers objection in the user's language
// (2) forwards lead to n8n webhook (Sheets + WhatsApp sequence). Falls back to rules if no API key.
const CAMPUSES = [ // INDICATIVE only (from public aggregators) - verify against niatindia.com before launch
 {campus:"Hyderabad",state:"Telangana",fee:"₹3.0-3.5L/yr",lo:3},{campus:"Bengaluru",state:"Karnataka",fee:"₹3-4L/yr",lo:3},
 {campus:"Rajampet (Annamacharya Univ.)",state:"Andhra Pradesh",fee:"₹2.0-2.25L/yr",lo:2},{campus:"Vijayawada",state:"Andhra Pradesh",fee:"~₹2.5L/yr",lo:2.5},
 {campus:"Pune",state:"Maharashtra",fee:"see site",lo:3},{campus:"Jaipur (Vivekananda Global Univ.)",state:"Rajasthan",fee:"see site",lo:3},
 {campus:"Delhi NCR",state:"Delhi NCR",fee:"~₹4.5L/yr",lo:4.5},{campus:"Tamil Nadu",state:"Tamil Nadu",fee:"see site",lo:3}];
const LANG={en:"English",hi:"Hindi",ta:"Tamil",te:"Telugu",kn:"Kannada",ml:"Malayalam"};
export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).end();
 const b=req.body||{}; let out, mode="rules";
 const budget=+b.budget; const ranked=[...CAMPUSES].sort((x,y)=>(y.state===b.state)-(x.state===b.state)||Math.abs(x.lo-budget)-Math.abs(y.lo-budget)).slice(0,2);
 out={matches:ranked.map(c=>({campus:c.campus,fee:c.fee,why:c.state===b.state?"In your state":"Closest to your budget"})),
  objection_answer:"NIAT students earn a B.Tech from a UGC-recognised partner university; ask our counsellor for the university's approval letter.",
  next_step:"Book a free counsellor call and the NxtWave Admission Test (NAT) slot.",score:Math.min(100,40+((b.stream||"").startsWith("PCM")?20:0)+(+b.pct>=60?20:0)+(b.who==="parent"?10:0)+(b.q?10:0))};
 if(process.env.ANTHROPIC_API_KEY){try{
  const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"x-api-key":process.env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","content-type":"application/json"},
   body:JSON.stringify({model:process.env.ANTHROPIC_MODEL||"claude-sonnet-5-5",max_tokens:800,
    system:`You are NIAT's admissions guide. Reply ONLY with JSON {matches:[{campus,fee,why}] (max 2, choose ONLY from the campus list), objection_answer, next_step, score(0-100 purchase intent)}. Write all text in ${LANG[b.lang]||"English"}. Be honest: never promise placements or guaranteed outcomes; if unsure say a counsellor will confirm. Keep fee strings from the list.`,
    messages:[{role:"user",content:JSON.stringify({lead:b,campuses:CAMPUSES})}]})});
  const t=(await r.json()).content.map(c=>c.text||"").join("").replace(/```json|```/g,"").trim();
  out=JSON.parse(t); mode="claude";}catch(e){}}
 if(process.env.N8N_WEBHOOK_URL){try{await fetch(process.env.N8N_WEBHOOK_URL,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...b,...out,mode,ts:new Date().toISOString()})});}catch(e){}}
 res.json({...out,mode});
}
