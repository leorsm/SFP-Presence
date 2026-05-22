// ============================================================
// Copyright (c) 2026 Léo Ratsamy
// Licence MIT — voir LICENSE.txt
// Toute revendication de propriete par une institution est interdite
// sans accord ecrit explicite de l'auteur.
// ============================================================

// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: magic;
const FM = FileManager.iCloud()
const BASE = FM.documentsDirectory()
const JSON_PATH = BASE + "/presences.json"
const EN_COURS_PATH = BASE + "/en_cours.txt"

async function loadData() {
  if (!FM.fileExists(JSON_PATH)) {
    return { sessions: [] }
  }
  await FM.downloadFileFromiCloud(JSON_PATH)
  const raw = FM.readString(JSON_PATH)
  try {
    const parsed = JSON.parse(raw)
    if (!parsed.sessions || !Array.isArray(parsed.sessions)) {
      return { sessions: [] }
    }
    return parsed
  } catch(e) {
    return { sessions: [] }
  }
}

function saveData(data) {
  FM.writeString(JSON_PATH, JSON.stringify(data))
}

function getStats(sessions) {
  const now = new Date()
  const todayStr = now.toDateString()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  weekStart.setHours(0, 0, 0, 0)
  let todayMins = 0, weekMins = 0, monthMins = 0
  for (const s of sessions) {
    const d = new Date(s.date)
    const mins = Number(s.duree) || 0
    if (d.toDateString() === todayStr) todayMins += mins
    if (d >= weekStart) weekMins += mins
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) monthMins += mins
  }
  return { todayMins, weekMins, monthMins }
}

function fmt(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (m === 0) return h + "h"
  return h + "h" + String(m).padStart(2, "0")
}

function pct(mins) {
  return Math.min(100, Math.round((mins / (140 * 60)) * 100))
}

function pad(n) { return String(n).padStart(2, "0") }

// Appelé par l'automatisation Départ
async function handleDepart() {
  const now = new Date()

  // Lire heure arrivée
  if (!FM.fileExists(EN_COURS_PATH)) {
    const a = new Alert()
    a.title = "Erreur"
    a.message = "Pas d'arrivee enregistree aujourd'hui !"
    a.addAction("OK")
    await a.present()
    return
  }
  await FM.downloadFileFromiCloud(EN_COURS_PATH)
  const arriveeStr = FM.readString(EN_COURS_PATH).trim()
  const arriveeDate = new Date(arriveeStr)

  if (isNaN(arriveeDate.getTime())) {
    const a = new Alert()
    a.title = "Erreur"
    a.message = "Format d'arrivee invalide : " + arriveeStr
    a.addAction("OK")
    await a.present()
    return
  }

  const duree = Math.round((now - arriveeDate) / 60000)

  if (duree <= 0) {
    const a = new Alert()
    a.title = "Erreur"
    a.message = "Duree negative ou nulle !"
    a.addAction("OK")
    await a.present()
    return
  }

  const hArr = pad(arriveeDate.getHours()) + ":" + pad(arriveeDate.getMinutes())
  const hDep = pad(now.getHours()) + ":" + pad(now.getMinutes())
  const dateISO = arriveeDate.getFullYear() + "-" + pad(arriveeDate.getMonth()+1) + "-" + pad(arriveeDate.getDate()) + "T" + hArr + ":00"

  const session = {
    date: dateISO,
    heure_arrivee: hArr,
    heure_depart: hDep,
    duree: duree
  }

  const data = await loadData()
  data.sessions.push(session)
  saveData(data)

  // Vider en_cours.txt
  FM.writeString(EN_COURS_PATH, "")

  const a = new Alert()
  a.title = "Depart enregistre !"
  a.message = fmt(duree) + " ajoutees — " + hArr + " -> " + hDep
  a.addAction("OK")
  await a.present()
}

function buildHTML(data) {
  const sessionsJSON = JSON.stringify(data.sessions)
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>SFP Presence</title>
<style>
:root {
  --bg: #0a0a0f;
  --surface: #13131a;
  --surface2: #1c1c27;
  --border: #2a2a3a;
  --accent: #7c6dfa;
  --accent2: #fa6d9a;
  --accent3: #6dfabd;
  --text: #e8e8f0;
  --muted: #6a6a8a;
}
* { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
body { background: var(--bg); color: var(--text); font-family: -apple-system, sans-serif; min-height: 100vh; }
.app { max-width: 430px; margin: 0 auto; padding: 0 0 100px; }
.header { padding: 52px 24px 24px; }
.header-label { font-family: ui-monospace, monospace; font-size: 10px; letter-spacing: 0.2em; color: var(--muted); text-transform: uppercase; margin-bottom: 6px; }
.header-title { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; line-height: 1; }
.header-title span { color: var(--accent); }
.ring-section { padding: 8px 24px 24px; display: flex; align-items: center; gap: 24px; }
.ring-wrap { position: relative; width: 120px; height: 120px; flex-shrink: 0; }
.ring-wrap svg { transform: rotate(-90deg); }
.ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.ring-pct { font-size: 22px; font-weight: 800; line-height: 1; }
.ring-label { font-family: ui-monospace, monospace; font-size: 9px; color: var(--muted); margin-top: 2px; }
.ring-info { flex: 1; }
.ring-info-title { font-family: ui-monospace, monospace; font-size: 10px; color: var(--muted); letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 8px; }
.ring-stat-val { font-size: 20px; font-weight: 700; line-height: 1; }
.ring-stat-val .unit { font-size: 12px; font-weight: 400; color: var(--muted); }
.ring-stat-sub { font-family: ui-monospace, monospace; font-size: 10px; color: var(--muted); }
.progress-bar { background: var(--surface2); border-radius: 4px; height: 4px; margin-top: 10px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, var(--accent), var(--accent2)); }
.remaining-badge { display: inline-flex; align-items: center; gap: 5px; margin-top: 10px; background: rgba(124,109,250,0.12); border: 1px solid rgba(124,109,250,0.25); border-radius: 20px; padding: 4px 10px; font-family: ui-monospace, monospace; font-size: 10px; color: var(--accent); }
.tabs { display: flex; gap: 4px; padding: 0 24px; margin-bottom: 20px; }
.tab { flex: 1; padding: 8px; border-radius: 10px; border: 1px solid var(--border); background: transparent; color: var(--muted); font-size: 12px; font-weight: 600; cursor: pointer; text-align: center; }
.tab.active { background: var(--accent); border-color: var(--accent); color: white; }
.panel { display: none; padding: 0 24px; }
.panel.active { display: block; }
.mini-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
.mini-stat { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 14px; }
.mini-stat-label { font-family: ui-monospace, monospace; font-size: 9px; color: var(--muted); letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 6px; }
.mini-stat-val { font-size: 22px; font-weight: 700; line-height: 1; }
.mini-stat-unit { font-size: 11px; font-weight: 400; color: var(--muted); }
.sessions-title { font-family: ui-monospace, monospace; font-size: 10px; color: var(--muted); letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 12px; }
.session-item { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 14px 16px; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; }
.session-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent3); flex-shrink: 0; box-shadow: 0 0 8px var(--accent3); }
.session-dot.old { background: var(--muted); box-shadow: none; }
.session-info { flex: 1; }
.session-date { font-family: ui-monospace, monospace; font-size: 11px; color: var(--text); margin-bottom: 2px; }
.session-time { font-family: ui-monospace, monospace; font-size: 10px; color: var(--muted); }
.session-dur { font-size: 15px; font-weight: 700; flex-shrink: 0; }
.btn-delete { background: none; border: none; color: var(--muted); font-size: 16px; cursor: pointer; padding: 4px; flex-shrink: 0; }
.heatmap { display: grid; grid-template-columns: repeat(7,1fr); gap: 4px; margin-bottom: 20px; }
.heatmap-day { aspect-ratio: 1; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--surface); border: 1px solid var(--border); }
.heatmap-day .day-label { font-size: 8px; color: var(--muted); margin-bottom: 2px; font-family: ui-monospace, monospace; }
.heatmap-day .day-hours { font-size: 11px; font-weight: 500; font-family: ui-monospace, monospace; }
.add-section { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 18px; margin-bottom: 20px; }
.add-title { font-size: 13px; font-weight: 700; margin-bottom: 14px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-label { font-family: ui-monospace, monospace; font-size: 9px; color: var(--muted); letter-spacing: 0.15em; text-transform: uppercase; }
.form-input { background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; color: var(--text); font-family: ui-monospace, monospace; font-size: 13px; width: 100%; outline: none; }
.form-input:focus { border-color: var(--accent); }
.form-input[type="date"], .form-input[type="time"] { color-scheme: dark; }
.btn-add { width: 100%; padding: 12px; background: var(--accent); border: none; border-radius: 12px; color: white; font-size: 14px; font-weight: 700; cursor: pointer; margin-top: 4px; }
.sessions-scroll { max-height: 400px; overflow-y: auto; }
.toast { position: fixed; bottom: 110px; left: 50%; transform: translateX(-50%) translateY(20px); background: var(--accent3); color: #0a0a0f; font-family: ui-monospace, monospace; font-size: 12px; font-weight: 500; padding: 10px 20px; border-radius: 20px; opacity: 0; transition: all 0.3s; z-index: 100; white-space: nowrap; }
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
.empty { text-align: center; padding: 40px; color: var(--muted); font-size: 12px; font-family: ui-monospace, monospace; line-height: 1.6; }
</style>
</head>
<body>
<div class="app">
  <div class="header">
    <div class="header-label">Suivi de presence</div>
    <div class="header-title">Mon temps<br><span>SFP</span></div>
  </div>
  <div class="ring-section">
    <div class="ring-wrap">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="50" fill="none" stroke="#1c1c27" stroke-width="10"/>
        <circle id="ringCircle" cx="60" cy="60" r="50" fill="none" stroke="url(#ringGrad)" stroke-width="10" stroke-linecap="round" stroke-dasharray="314" stroke-dashoffset="314" style="transition:stroke-dashoffset 0.8s"/>
        <defs><linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#7c6dfa"/><stop offset="100%" stop-color="#fa6d9a"/></linearGradient></defs>
      </svg>
      <div class="ring-center">
        <div class="ring-pct" id="ringPct">0%</div>
        <div class="ring-label">du mois</div>
      </div>
    </div>
    <div class="ring-info">
      <div class="ring-info-title">Ce mois</div>
      <div class="ring-stat-val" id="monthTotal">0<span class="unit">h</span></div>
      <div class="ring-stat-sub">sur 140h requises</div>
      <div class="progress-bar"><div class="progress-fill" id="progressFill" style="width:0%"></div></div>
      <div class="remaining-badge" id="remainingBadge">140h restantes</div>
    </div>
  </div>
  <div class="tabs">
    <button class="tab active" onclick="switchTab('overview',this)">Apercu</button>
    <button class="tab" onclick="switchTab('sessions',this)">Sessions</button>
    <button class="tab" onclick="switchTab('add',this)">Ajouter</button>
  </div>
  <div class="panel active" id="panel-overview">
    <div class="mini-stats">
      <div class="mini-stat"><div class="mini-stat-label">Aujourd'hui</div><div class="mini-stat-val" id="todayTotal">0<span class="mini-stat-unit">h</span></div></div>
      <div class="mini-stat"><div class="mini-stat-label">Cette semaine</div><div class="mini-stat-val" id="weekTotal">0<span class="mini-stat-unit">h</span></div></div>
      <div class="mini-stat"><div class="mini-stat-label">Moy. / jour</div><div class="mini-stat-val" id="avgDay">0<span class="mini-stat-unit">h</span></div></div>
      <div class="mini-stat"><div class="mini-stat-label">Sessions</div><div class="mini-stat-val" id="sessionCount">0</div></div>
    </div>
    <div class="sessions-title">Cette semaine</div>
    <div class="heatmap" id="heatmap"></div>
    <div class="sessions-title">Sessions recentes</div>
    <div id="recentSessions"></div>
  </div>
  <div class="panel" id="panel-sessions">
    <div class="sessions-title">Toutes les sessions</div>
    <div class="sessions-scroll" id="allSessions"></div>
  </div>
  <div class="panel" id="panel-add">
    <div class="add-section">
      <div class="add-title">+ Nouvelle session</div>
      <div class="form-row">
        <div class="form-group"><div class="form-label">Date</div><input class="form-input" type="date" id="inputDate"></div>
        <div class="form-group"><div class="form-label">Arrivee</div><input class="form-input" type="time" id="inputArrivee"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><div class="form-label">Depart</div><input class="form-input" type="time" id="inputDepart"></div>
        <div class="form-group"><div class="form-label">Duree</div><input class="form-input" id="inputDureeCalc" readonly placeholder="auto"></div>
      </div>
      <button class="btn-add" onclick="addSession()">Enregistrer</button>
    </div>
  </div>
</div>
<div class="toast" id="toast"></div>
<script>
let sessions = SESSIONS_DATA;

function fmt(mins) {
  const h = Math.floor(mins/60), m = mins%60;
  return m === 0 ? h+"h" : h+"h"+String(m).padStart(2,"0");
}

function save() {
  const payload = JSON.stringify({ sessions: sessions });
  window.location = "scriptable://x-callback-url/save?data=" + encodeURIComponent(payload);
}

function getMonthSessions() {
  const now = new Date();
  return sessions.filter(function(s) { const d = new Date(s.date); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear(); });
}
function getTodaySessions() {
  const t = new Date().toDateString();
  return sessions.filter(function(s) { return new Date(s.date).toDateString()===t; });
}
function getWeekSessions() {
  const now = new Date(), day = now.getDay();
  const mon = new Date(now); mon.setDate(now.getDate()-((day+6)%7)); mon.setHours(0,0,0,0);
  const sun = new Date(mon); sun.setDate(mon.getDate()+7);
  return sessions.filter(function(s) { const d=new Date(s.date); return d>=mon&&d<sun; });
}
function totalMins(arr) { return arr.reduce(function(a,s){return a+Number(s.duree||0);},0); }

function render() {
  const mS=getMonthSessions(), tS=getTodaySessions(), wS=getWeekSessions();
  const mM=totalMins(mS), tM=totalMins(tS), wM=totalMins(wS);
  const TARGET=140*60, p=Math.min(100,Math.round(mM/TARGET*100));
  document.getElementById("ringCircle").style.strokeDashoffset=314-(314*p/100);
  document.getElementById("ringPct").textContent=p+"%";
  document.getElementById("monthTotal").innerHTML=(mM/60).toFixed(1)+'<span class="unit">h</span>';
  document.getElementById("progressFill").style.width=p+"%";
  const rem=Math.max(0,TARGET-mM);
  document.getElementById("remainingBadge").textContent=rem>0?fmt(rem)+" restantes":"Objectif atteint !";
  document.getElementById("todayTotal").innerHTML=(tM/60).toFixed(1)+'<span class="mini-stat-unit">h</span>';
  document.getElementById("weekTotal").innerHTML=(wM/60).toFixed(1)+'<span class="mini-stat-unit">h</span>';
  document.getElementById("sessionCount").textContent=sessions.length;
  const days=new Set(mS.map(function(s){return new Date(s.date).toDateString();})).size;
  document.getElementById("avgDay").innerHTML=(days>0?(mM/60/days).toFixed(1):"0")+'<span class="mini-stat-unit">h</span>';
  renderHeatmap(); renderRecent(); renderAll();
}

function renderHeatmap() {
  const now=new Date(), day=now.getDay();
  const mon=new Date(now); mon.setDate(now.getDate()-((day+6)%7)); mon.setHours(0,0,0,0);
  const c=document.getElementById("heatmap"); c.innerHTML="";
  const jours=["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
  for(var i=0;i<7;i++){
    const d=new Date(mon); d.setDate(mon.getDate()+i);
    const dS=sessions.filter(function(s){return new Date(s.date).toDateString()===d.toDateString();});
    const h=totalMins(dS)/60; const isT=d.toDateString()===now.toDateString();
    var bg="var(--surface)";
    if(h>0) bg=h<3?"rgba(124,109,250,0.2)":h<6?"rgba(124,109,250,0.45)":"rgba(124,109,250,0.75)";
    const el=document.createElement("div"); el.className="heatmap-day";
    el.style.background=bg;
    if(isT) el.style.boxShadow="0 0 0 2px var(--accent)";
    el.innerHTML='<span class="day-label">'+jours[i]+'</span><span class="day-hours">'+(h>0?h.toFixed(1)+"h":"--")+"</span>";
    c.appendChild(el);
  }
}

function sessionHTML(s, idx, showDel) {
  const d=new Date(s.date);
  const label=d.toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"});
  const isT=d.toDateString()===new Date().toDateString();
  const arr=s.heure_arrivee||"--"; const dep=s.heure_depart||"--";
  return '<div class="session-item">'
    +'<div class="session-dot'+(isT?"":" old")+'"></div>'
    +'<div class="session-info"><div class="session-date">'+label+'</div><div class="session-time">'+arr+" -> "+dep+"</div></div>"
    +'<div class="session-dur">'+fmt(Number(s.duree)||0)+"</div>"
    +(showDel?'<button class="btn-delete" onclick="deleteSession('+idx+')">x</button>':"")
    +"</div>";
}

function renderRecent() {
  const sorted=sessions.slice().sort(function(a,b){return new Date(b.date)-new Date(a.date);}).slice(0,5);
  const c=document.getElementById("recentSessions");
  if(!sorted.length){c.innerHTML='<div class="empty">Aucune session enregistree</div>';return;}
  c.innerHTML=sorted.map(function(s,i){return sessionHTML(s,i,false);}).join("");
}

function renderAll() {
  const sorted=sessions.slice().sort(function(a,b){return new Date(b.date)-new Date(a.date);});
  const c=document.getElementById("allSessions");
  if(!sorted.length){c.innerHTML='<div class="empty">Aucune session</div>';return;}
  c.innerHTML=sorted.map(function(s,i){return sessionHTML(s,i,true);}).join("");
}

function switchTab(name,btn) {
  document.querySelectorAll(".panel").forEach(function(p){p.classList.remove("active");});
  document.querySelectorAll(".tab").forEach(function(t){t.classList.remove("active");});
  document.getElementById("panel-"+name).classList.add("active");
  btn.classList.add("active");
}

document.getElementById("inputArrivee").addEventListener("change",calcDuree);
document.getElementById("inputDepart").addEventListener("change",calcDuree);
function calcDuree(){
  const a=document.getElementById("inputArrivee").value, d=document.getElementById("inputDepart").value;
  if(!a||!d)return;
  const am=parseInt(a)*60+parseInt(a.split(":")[1]), dm=parseInt(d)*60+parseInt(d.split(":")[1]);
  var mins=dm-am; if(mins<0)mins+=1440;
  document.getElementById("inputDureeCalc").value=Math.floor(mins/60)+"h"+String(mins%60).padStart(2,"0");
}

function addSession() {
  const date=document.getElementById("inputDate").value;
  const arr=document.getElementById("inputArrivee").value;
  const dep=document.getElementById("inputDepart").value;
  if(!date||!arr||!dep){toast("Remplis tous les champs");return;}
  const ap=arr.split(":"), dp=dep.split(":");
  var mins=(parseInt(dp[0])*60+parseInt(dp[1]))-(parseInt(ap[0])*60+parseInt(ap[1]));
  if(mins<=0){toast("Heure de depart invalide");return;}
  sessions.push({date:date+"T"+arr+":00",heure_arrivee:arr,heure_depart:dep,duree:mins});
  save();
  toast("Session ajoutee !");
  document.getElementById("inputArrivee").value="";
  document.getElementById("inputDepart").value="";
  document.getElementById("inputDureeCalc").value="";
  render();
}

function deleteSession(idx) {
  const sorted=sessions.slice().sort(function(a,b){return new Date(b.date)-new Date(a.date);});
  const toRemove=sorted[idx];
  sessions=sessions.filter(function(s){return s!==toRemove;});
  save();
  toast("Session supprimee");
  render();
}

function toast(msg) {
  const t=document.getElementById("toast"); t.textContent=msg;
  t.classList.add("show"); setTimeout(function(){t.classList.remove("show");},2500);
}

const now=new Date();
document.getElementById("inputDate").value=now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0");
render();
</script>
</body>
</html>`
}

async function runWidget() {
  const data = await loadData()
  const stats = getStats(data.sessions)
  const todayMins = stats.todayMins
  const weekMins = stats.weekMins
  const monthMins = stats.monthMins
  const TARGET = 140 * 60
  const remaining = Math.max(0, TARGET - monthMins)
  const percent = pct(monthMins)

  const widget = new ListWidget()
  const grad = new LinearGradient()
  grad.colors = [new Color("#13131a"), new Color("#0a0a0f")]
  grad.locations = [0, 1]
  widget.backgroundGradient = grad
  widget.setPadding(14, 16, 14, 16)

  const header = widget.addStack()
  header.layoutHorizontally()
  header.centerAlignContent()
  const titleStack = header.addStack()
  titleStack.layoutVertically()
  const label = titleStack.addText("PRESENCE SFP")
  label.font = Font.boldMonospacedSystemFont(9)
  label.textColor = new Color("#6a6a8a")
  titleStack.addSpacer(2)
  const monthLabel = titleStack.addText(fmt(monthMins) + " / 140h")
  monthLabel.font = Font.boldSystemFont(18)
  monthLabel.textColor = new Color("#e8e8f0")
  header.addSpacer()
  let pctColor = new Color("#fa6d9a")
  if (percent >= 100) pctColor = new Color("#6dfabd")
  else if (percent >= 70) pctColor = new Color("#7c6dfa")
  const pctText = header.addText(percent + "%")
  pctText.font = Font.boldSystemFont(22)
  pctText.textColor = pctColor

  widget.addSpacer(10)

  const barBg = widget.addStack()
  barBg.layoutHorizontally()
  barBg.backgroundColor = new Color("#2a2a3a")
  barBg.cornerRadius = 2
  barBg.size = new Size(0, 4)
  const fillW = Math.max(4, Math.round(percent * 2.5))
  const fill = barBg.addStack()
  fill.backgroundColor = new Color("#7c6dfa")
  fill.cornerRadius = 2
  fill.size = new Size(fillW, 4)
  barBg.addSpacer()

  widget.addSpacer(10)

  const statsRow = widget.addStack()
  statsRow.layoutHorizontally()
  const todayStack = statsRow.addStack()
  todayStack.layoutVertically()
  const tl = todayStack.addText("AUJOURD'HUI")
  tl.font = Font.boldMonospacedSystemFont(7)
  tl.textColor = new Color("#6a6a8a")
  todayStack.addSpacer(2)
  const tv = todayStack.addText(fmt(todayMins))
  tv.font = Font.boldSystemFont(14)
  tv.textColor = new Color("#e8e8f0")
  statsRow.addSpacer()
  const weekStack = statsRow.addStack()
  weekStack.layoutVertically()
  const wl = weekStack.addText("SEMAINE")
  wl.font = Font.boldMonospacedSystemFont(7)
  wl.textColor = new Color("#6a6a8a")
  wl.rightAlignText()
  weekStack.addSpacer(2)
  const wv = weekStack.addText(fmt(weekMins))
  wv.font = Font.boldSystemFont(14)
  wv.textColor = new Color("#e8e8f0")
  wv.rightAlignText()

  widget.addSpacer(8)

  const restStack = widget.addStack()
  restStack.layoutHorizontally()
  restStack.centerAlignContent()
  restStack.backgroundColor = new Color("#1c1c27")
  restStack.cornerRadius = 8
  restStack.setPadding(5, 10, 5, 10)
  let restMsg = "Objectif atteint !"
  if (remaining > 0) restMsg = fmt(remaining) + " restantes ce mois"
  const restText = restStack.addText(restMsg)
  restText.font = Font.mediumMonospacedSystemFont(10)
  restText.textColor = remaining > 0 ? new Color("#7c6dfa") : new Color("#6dfabd")
  restText.centerAlignText()

  widget.url = "scriptable:///run/SFP_Presence"

  if (config.runsInWidget) {
    Script.setWidget(widget)
    Script.complete()
    return
  }
  widget.presentMedium()
}

async function runApp() {
  const data = await loadData()
  const html = buildHTML(data).replace("SESSIONS_DATA", JSON.stringify(data.sessions))

  const wv = new WebView()
  await wv.loadHTML(html)

  wv.shouldAllowRequest = function(req) {
    const url = req.url
    if (url.startsWith("scriptable://x-callback-url/save")) {
      try {
        const raw = decodeURIComponent(url.replace("scriptable://x-callback-url/save?data=", ""))
        const newData = JSON.parse(raw)
        if (newData.sessions && Array.isArray(newData.sessions)) {
          saveData(newData)
        }
      } catch(e) {}
      return false
    }
    return true
  }

  await wv.present()
}

// Point d'entree
const scriptArgs = args.plainTexts
if (config.runsInWidget) {
  await runWidget()
} else if (scriptArgs.length > 0 && scriptArgs[0] === "depart") {
  await handleDepart()
} else {
  await runApp()
}
