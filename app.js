const $=id=>document.getElementById(id),months=["januari","februari","mars","april","maj","juni","juli","augusti","september","oktober","november","december"],days=["söndag","måndag","tisdag","onsdag","torsdag","fredag","lördag"];
let selected=new Date(),year=selected.getFullYear(),month=selected.getMonth(),tasks=[],client=null,user=null,signupMode=false,realtimeChannel=null,lastAutoSync=0;
selected=new Date(selected.getFullYear(),selected.getMonth(),selected.getDate());
const configKey="angby-supa-config",localKey="angby-local-tasks";
const categories=["Allmänt","Träning","Möte","Tävling","Privat"];
const categoryClass=value=>({ "Träning":"cat-training","Möte":"cat-meeting","Tävling":"cat-competition","Privat":"cat-private" }[value]||"cat-general");
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const fmt=d=>`${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
const esc=s=>String(s??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function setStatus(t){$("status").textContent=t}
function localLoad(){try{return JSON.parse(localStorage.getItem(localKey)||"[]")}catch{return []}}
function saveLocal(){localStorage.setItem(localKey,JSON.stringify(tasks))}
function forDay(d){return tasks.filter(t=>t.date===iso(d))}
function render(){renderCalendar();renderTasks();$("dateTitle").textContent=fmt(selected);$("date").value=iso(selected);renderDaySummary()} 
function renderDaySummary(){
  const arr=forDay(selected).slice().sort((a,b)=>(a.time||"").localeCompare(b.time||""));
  const done=arr.filter(t=>t.done).length;
  const left=arr.length-done;
  if($("summaryDate"))$("summaryDate").textContent=selected.toLocaleDateString("sv-SE",{day:"numeric",month:"short"});
  if($("summaryTotal"))$("summaryTotal").textContent=arr.length;
  if($("summaryDone"))$("summaryDone").textContent=done;
  if($("summaryLeft"))$("summaryLeft").textContent=left;
  const now=new Date(),today=iso(now),nowMinutes=now.getHours()*60+now.getMinutes();
  const next=arr.find(t=>!t.done&&t.time&&(iso(selected)!==today||t.time.split(":").map(Number).reduce((h,m)=>h*60+m,0)>=nowMinutes));
  if($("summaryNext"))$("summaryNext").textContent=next?(next.time+" · "+next.title):(arr.length?"Inga fler aktiviteter idag":"Inga aktiviteter planerade");
}
function renderCalendar(){
  let grid=$("grid");
  grid.replaceChildren();
  $("monthTitle").textContent=months[month][0].toUpperCase()+months[month].slice(1)+" "+year;
  let offset=(new Date(year,month,1).getDay()+6)%7,count=new Date(year,month+1,0).getDate();
  for(let i=0;i<offset;i++){let s=document.createElement("span");grid.append(s)}
  for(let n=1;n<=count;n++){
    let d=new Date(year,month,n),b=document.createElement("button");
    b.className="day";
    let number=document.createElement("span");
    number.className="day-number";
    number.textContent=n;
    b.append(number);
    const dayTasks=forDay(d);
    if(dayTasks.length)b.classList.add("has");
    if(iso(d)===iso(selected))b.classList.add("sel");
    if(iso(d)===iso(new Date()))b.classList.add("today");
    b.title=dayTasks.map(t=>(t.time?t.time+" ":"")+t.title+" ["+(t.category||"Allmänt")+"]"+(t.done?" ✓":"")).join("\n")||"Inga uppgifter";
    const cats=[...new Set(dayTasks.map(t=>t.category||"Allmänt"))].slice(0,4);
    if(cats.length){
      const dots=document.createElement("span");
      dots.className="day-dots";
      cats.forEach(cat=>{const dot=document.createElement("i");dot.className=categoryClass(cat);dot.setAttribute("aria-label",cat);dots.append(dot)});
      b.append(dots);
    }
    b.onclick=()=>{selected=d;render()};
    grid.append(b);
  }
}
function renderTasks(){let box=$("tasks");box.replaceChildren();let arr=forDay(selected).sort((a,b)=>(a.time||"").localeCompare(b.time||""));if(!arr.length){box.innerHTML='<div class="empty">Inga uppgifter den här dagen.</div>';renderDaySummary();return}arr.forEach(t=>{let el=document.createElement("article");el.className="task"+(t.done?" done":"");let check=document.createElement("input");check.type="checkbox";check.checked=!!t.done;check.setAttribute("aria-label","Markera som klar");check.onchange=()=>update(t.id,{done:check.checked});let body=document.createElement("div");let strong=document.createElement("strong");strong.textContent=(t.time?t.time+" · ":"")+t.title;let badge=document.createElement("span");badge.className="category-badge "+categoryClass(t.category||"Allmänt");badge.textContent=t.category||"Allmänt";let meta=document.createElement("div");meta.className="meta";meta.textContent=`Viktighet: ${t.priority||"Normal"} · Påminnelse: ${t.reminder||"Ingen"}`;body.append(strong,badge,meta);if(t.checklist?.length){let subs=document.createElement("div");subs.className="subtasks";t.checklist.forEach((x,i)=>{let lab=document.createElement("label"),cb=document.createElement("input"),sp=document.createElement("span");cb.type="checkbox";cb.checked=!!x.done;cb.onchange=()=>update(t.id,{checklist:t.checklist.map((z,j)=>j===i?{...z,done:cb.checked}:z)});sp.textContent=x.text;lab.append(cb,sp);subs.append(lab)});body.append(subs)}let actions=document.createElement("div"),edit=document.createElement("button"),del=document.createElement("button");edit.textContent="Ändra";edit.onclick=()=>fill(t);del.textContent="Ta bort";del.onclick=()=>removeTask(t);actions.append(edit,del);el.append(check,body,actions);box.append(el)});renderDaySummary()}
function clearForm(){$("id").value="";$("name").value="";$("time").value="";$("priority").value="Normal";$("reminder").value="Ingen";$("category").value="Allmänt";$("checklist").value="";$("formTitle").textContent="Lägg till uppgift";$("message").textContent=""}
function fill(t){$("id").value=t.id;$("name").value=t.title;$("date").value=t.date;$("time").value=t.time||"";$("priority").value=t.priority||"Normal";$("reminder").value=t.reminder||"Ingen";$("category").value=t.category||"Allmänt";$("checklist").value=(t.checklist||[]).map(x=>x.text).join("\n");$("formTitle").textContent="Ändra uppgift";document.querySelector(".editor").scrollIntoView({behavior:"smooth"})}
function buildTask(){let id=$("id").value||crypto.randomUUID(),old=tasks.find(t=>t.id===id);return {id,user_id:user?.id||null,date:$("date").value,title:$("name").value.trim(),time:$("time").value||null,priority:$("priority").value,reminder:$("reminder").value,category:$("category").value||"Allmänt",done:old?.done||false,checklist:$("checklist").value.split("\n").map(s=>s.trim()).filter(Boolean).map(text=>({text,done:old?.checklist?.find(x=>x.text===text)?.done||false}))}}
async function saveTask(t){if(client&&user){let row={...t,user_id:user.id};let {error}=await client.from("calendar_tasks").upsert(row);if(error){$("message").textContent="Kunde inte spara online: "+error.message;return false}await loadRemote();return true}tasks=tasks.filter(x=>x.id!==t.id).concat(t);saveLocal();render();setStatus("Sparat lokalt – logga in för synk");return true}
async function update(id,changes){let t=tasks.find(x=>x.id===id);if(!t)return;let next={...t,...changes};if(client&&user){await saveTask(next)}else{tasks=tasks.map(x=>x.id===id?next:x);saveLocal();render()}}
async function removeTask(t){
  if(!confirm(`Ta bort "${t.title}"?`)) return;

  if(client && user){
    // Gör själva DELETE-anropet utan .select().
    // .select() kan ge en tom svarlista även när DELETE-anropet inte
    // returnerar rader, vilket tidigare kunde tolkas som att borttagningen misslyckats.
    const { error } = await client
      .from("calendar_tasks")
      .delete()
      .eq("id", t.id)
      .eq("user_id", user.id);

    if(error){
      alert("Kunde inte ta bort uppgiften: " + error.message);
      console.error("Supabase delete error:", error);
      return;
    }

    // Uppdatera direkt på den här enheten och hämta sedan sanningen från databasen.
    tasks = tasks.filter(x => x.id !== t.id);
    saveLocal();
    render();
    setStatus("Borttagen · synkar…");
    await loadRemote();
  } else {
    tasks = tasks.filter(x => x.id !== t.id);
    saveLocal();
    render();
  }
}
async function loadRemote({quiet=false}={}){if(!client||!user)return;if(!quiet)setStatus("Synkroniserar…");let {data,error}=await client.from("calendar_tasks").select("*").order("date").order("time");if(error){if(!quiet)setStatus("Databasfel");console.error(error);$("message").textContent="Kontrollera att du har kört supabase/schema.sql.";return}tasks=data||[];saveLocal();render();setStatus("Synkroniserad")}

function subscribeRealtime() {
  if (!client || !user) return;

  if (realtimeChannel) {
    client.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }

  const subscribedUserId = user.id;
  realtimeChannel = client
    .channel("calendar-tasks-" + subscribedUserId)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "calendar_tasks"
      },
      async () => {
        // Re-fetch rows allowed by Supabase Row Level Security.
        if (user && user.id === subscribedUserId) {
          await loadRemote({ quiet: true });
        }
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        setStatus("Synkroniserad · live");
      } else if (
        status === "CHANNEL_ERROR" ||
        status === "TIMED_OUT" ||
        status === "CLOSED"
      ) {
        setStatus("Live-synk frånkopplad · automatisk kontroll aktiv");
        console.warn("Supabase Realtime-status:", status);
      }
    });
}

function playReminderSound(){try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const ctx=new AC();[880,660,880].forEach((f,i)=>{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.frequency.value=f;osc.type="sine";gain.gain.setValueAtTime(.001,ctx.currentTime+i*.22);gain.gain.exponentialRampToValueAtTime(.18,ctx.currentTime+i*.22+.03);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+i*.22+.17);osc.connect(gain);gain.connect(ctx.destination);osc.start(ctx.currentTime+i*.22);osc.stop(ctx.currentTime+i*.22+.18)});setTimeout(()=>ctx.close(),1200)}catch(e){console.warn("Ljudpåminnelse kunde inte spelas",e)}}
function reminderMinutes(value){return ({"Vid start":0,"5 minuter före":5,"15 minuter före":15,"30 minuter före":30})[value]}
function checkReminders(){if(!tasks.length)return;const now=new Date(),day=iso(now),minute=now.getHours()*60+now.getMinutes(),sentKey="angby-reminders-sent",sent=(()=>{try{return JSON.parse(localStorage.getItem(sentKey)||"{}")}catch{return {}}})();let changed=false;for(const t of tasks){if(!t.date||!t.time||!t.reminder||t.reminder==="Ingen"||t.done)continue;const offset=reminderMinutes(t.reminder);if(offset===undefined)continue;const [h,m]=t.time.split(":").map(Number),target=h*60+m-offset;if(t.date!==day||minute!==target)continue;const key=`${t.id}|${t.date}|${t.time}|${t.reminder}`;if(sent[key])continue;sent[key]=Date.now();changed=true;playReminderSound();const message=`${t.title} · ${t.time}`;if("Notification" in window&&Notification.permission==="granted"){try{new Notification("Påminnelse – Min dagskalender",{body:message,icon:"./icon.svg",tag:key})}catch(e){console.warn(e)}}else{setStatus("Påminnelse: "+message);alert("Påminnelse: "+message)} }if(changed){const cutoff=Date.now()-7*86400000;for(const k of Object.keys(sent))if(sent[k]<cutoff)delete sent[k];localStorage.setItem(sentKey,JSON.stringify(sent))}}
$("enableNotifications").onclick=async()=>{if(!("Notification" in window)){alert("Den här webbläsaren stöder inte systemnotiser. Prova Chrome eller Edge.");return}try{const permission=await Notification.requestPermission();if(permission==="granted"){$("enableNotifications").textContent="Notiser aktiverade";playReminderSound();alert("Notiser aktiverade. Ljud och notiser fungerar medan kalendern är öppen.")}else alert("Notiser tilläts inte. Du kan ändra behörigheten i webbläsarens webbplatsinställningar.")}catch(e){alert("Kunde inte aktivera notiser: "+e.message)}};
async function connect(c){if(!window.supabase){setStatus("Supabase-biblioteket kunde inte laddas");return}try{client=window.supabase.createClient(c.url,c.key);let {data,error}=await client.auth.getSession();if(error)throw error;user=data.session?.user||null;client.auth.onAuthStateChange((_e,s)=>{user=s?.user||null;refreshAuth();if(user){loadRemote();subscribeRealtime()}else{if(realtimeChannel){client.removeChannel(realtimeChannel);realtimeChannel=null}tasks=localLoad();render();setStatus("Utloggad")}});refreshAuth();if(user){await loadRemote();subscribeRealtime()}else{tasks=localLoad();render();setStatus("Ansluten – logga in")}}catch(e){client=null;setStatus("Anslutningsfel");console.error(e)}}
function refreshAuth(){$("auth").textContent=user?"Logga ut":"Logga in";if(user)setStatus("Inloggad")}
$("taskForm").onsubmit=async e=>{e.preventDefault();let t=buildTask();if(!t.title||!t.date)return;if(await saveTask(t)){clearForm();$("message").textContent="Uppgiften är sparad."}};
$("clear").onclick=clearForm;$("new").onclick=()=>{clearForm();$("date").value=iso(selected);$("name").focus()};
$("prev").onclick=()=>{month--;if(month<0){month=11;year--}renderCalendar()};$("next").onclick=()=>{month++;if(month>11){month=0;year++}renderCalendar()};
$("today").onclick=()=>{selected=new Date();selected=new Date(selected.getFullYear(),selected.getMonth(),selected.getDate());year=selected.getFullYear();month=selected.getMonth();render()};
$("settings").onclick=()=>{let c;try{c=JSON.parse(localStorage.getItem(configKey)||"null")}catch{}if(c){$("url").value=c.url;$("key").value=c.key}$("settingsDialog").showModal()};
$("settingsForm").onsubmit=async e=>{e.preventDefault();let url=$("url").value.trim().replace(/\/$/,""),key=$("key").value.trim();if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)){$("settingsMessage").textContent="Kontrollera Project URL.";return}localStorage.setItem(configKey,JSON.stringify({url,key}));await connect({url,key});$("settingsDialog").close()};
$("auth").onclick=async()=>{if(user&&client){await client.auth.signOut();user=null;tasks=localLoad();render();refreshAuth()}else if(!client){$("settingsDialog").showModal()}else{$("loginDialog").showModal()}};
$("signup").onclick=()=>{signupMode=!signupMode;$("loginTitle").textContent=signupMode?"Skapa konto":"Logga in";$("loginSubmit").textContent=signupMode?"Skapa konto":"Logga in";$("signup").textContent=signupMode?"Tillbaka till inloggning":"Skapa nytt konto"};
$("loginForm").onsubmit=async e=>{e.preventDefault();let email=$("email").value,password=$("password").value;let r=signupMode?await client.auth.signUp({email,password}):await client.auth.signInWithPassword({email,password});$("loginMessage").textContent=r.error?r.error.message:(signupMode&&!r.data.session?"Kontot skapades. Kontrollera din e-post om bekräftelse krävs.":"");if(!r.error&&(!signupMode||r.data.session))$("loginDialog").close()};
let installPrompt;$("install").onclick=async()=>{if(installPrompt){installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$("install").hidden=true}};window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;$("install").hidden=false});
tasks=localLoad();render();let saved;try{saved=JSON.parse(localStorage.getItem(configKey)||"null")}catch{}if(saved)connect(saved);setInterval(()=>{let n=new Date();if(iso(n)!==iso(selected)){selected=new Date(n.getFullYear(),n.getMonth(),n.getDate());year=selected.getFullYear();month=selected.getMonth();render()}checkReminders();if(client&&user&&Date.now()-lastAutoSync>=2500){lastAutoSync=Date.now();loadRemote({quiet:true})}},2000);
if("serviceWorker"in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js").catch(console.warn);
