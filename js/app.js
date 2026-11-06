/* ===========================================================
   OPERACIÓN METABOLIA · motor de la simulación
   Modo: proyectada por la docente; un navegador gestiona
   todos los Laboratorios. Guardado en localStorage.
   =========================================================== */
"use strict";

const STORE_KEY = 'operacion_metabolia_v1';
const MBY = Object.fromEntries(MISSIONS.map(m => [m.id, m]));
const BBY = Object.fromEntries(BADGES.map(b => [b.id, b]));
const MAXES = {
  recruit:{total:20},
  mission:{prep:20, team:50, indiv:30, retos:20},
  final:{prep:20, team:90, indiv:25, retos:15}
};

/* ---------------- utilidades ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/gi, '').toUpperCase();
const num = s => { const v = parseFloat(String(s).replace(',', '.').replace('−', '-').trim()); return isNaN(v) ? null : v; };
const fmt = n => (Math.round(n * 100) / 100).toString().replace('.', ',');
const uid = () => Math.random().toString(36).slice(2, 9);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------------- estado ---------------- */
function freshState(){
  return {
    version:1, teams:[], xp:{}, badges:{}, flags:{},
    unlocked:{m0:true}, restored:{}, seen:{},
    answers:{}, notes:{}, hints:{}, audit:{}, reports:{},
    escape:{locks:[null,null,null,null], done:false},
    reactor:{cells:{}, on:false},
    log:[], settings:{sound:true}
  };
}
let S = load();
function load(){
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) return Object.assign(freshState(), JSON.parse(raw)); } catch(e){}
  return freshState();
}
let saveT = null;
function save(){ clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch(e){ toast('No se pudo guardar en este navegador', 'bad'); } }, 150); }

/* vista actual (no persistente salvo la última misión) */
const V = { name:'splash', mid:null, screen:0 };

/* ---------------- sonido ---------------- */
let actx = null;
function beep(seq){
  if (!S.settings.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    let t = actx.currentTime;
    seq.forEach(([f, d, type]) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type || 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.18, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + d + .02); t += d * .85;
    });
  } catch(e){}
}
const SND = {
  ok:() => beep([[660,.12],[880,.18]]),
  bad:() => beep([[220,.18,'square'],[180,.22,'square']]),
  unlock:() => beep([[523,.12],[659,.12],[784,.12],[1046,.3]]),
  coin:() => beep([[988,.08],[1319,.18]]),
  alarm:() => beep([[880,.25,'sawtooth'],[660,.25,'sawtooth'],[880,.25,'sawtooth'],[660,.25,'sawtooth']]),
  level:() => beep([[523,.1],[659,.1],[784,.1],[1046,.1],[1318,.35]]),
  click:() => beep([[440,.05]])
};

/* ---------------- confeti ---------------- */
function confetti(n = 140){
  const c = $('#fx'), ctx = c.getContext('2d');
  c.width = innerWidth; c.height = innerHeight;
  const cols = ['#22d3ee','#a3e635','#f59e0b','#f472b6','#facc15','#8b5cf6'];
  const P = Array.from({length:n}, () => ({x:innerWidth/2 + (Math.random()-.5)*300, y:innerHeight/2, vx:(Math.random()-.5)*16, vy:-Math.random()*16-4, r:Math.random()*7+4, c:cols[Math.random()*cols.length|0], a:Math.random()*6, life:0}));
  let f = 0;
  (function tick(){
    ctx.clearRect(0,0,c.width,c.height);
    P.forEach(p => { p.vy += .45; p.x += p.vx; p.y += p.vy; p.a += .2; ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.r/2,-p.r/4,p.r,p.r/2); ctx.restore(); });
    if (++f < 150) requestAnimationFrame(tick); else ctx.clearRect(0,0,c.width,c.height);
  })();
}

/* ---------------- toasts ---------------- */
function toast(msg, kind = ''){
  const t = document.createElement('div'); t.className = 'toast ' + kind; t.innerHTML = msg;
  $('#toasts').appendChild(t); setTimeout(() => { t.style.opacity = '0'; t.style.transition = '.4s'; setTimeout(() => t.remove(), 400); }, 3800);
}

/* ---------------- equipos, XP, niveles ---------------- */
const teamById = id => S.teams.find(t => t.id === id);
function xpRec(tid, mid){ S.xp[tid] = S.xp[tid] || {}; S.xp[tid][mid] = S.xp[tid][mid] || {prep:0, team:0, indiv:0, retos:0, rubric:[], check:{}, roles:false}; return S.xp[tid][mid]; }
function missionXP(tid, mid){
  const m = MBY[mid], r = (S.xp[tid] || {})[mid]; if (!r) return 0;
  if (m.type === 'recruit') return m.checklist.reduce((a, c) => a + (r.check && r.check[c.id] ? c.xp : 0), 0);
  const mx = MAXES[m.type]; if (!mx) return 0;
  return clamp(+r.prep||0,0,mx.prep) + clamp(+r.team||0,0,mx.team) + clamp(+r.indiv||0,0,mx.indiv) + clamp(+r.retos||0,0,mx.retos);
}
const totalXP = tid => MISSIONS.reduce((a, m) => a + missionXP(tid, m.id), 0);
function levelOf(xp){ let L = LEVELS[0], i = 0; LEVELS.forEach((l, k) => { if (xp >= l.min){ L = l; i = k; } }); return {...L, idx:i, next:LEVELS[i+1]}; }
function hasBadge(tid, bid){ return !!(S.badges[tid] || {})[bid]; }
function setBadge(tid, bid, v, silent){
  S.badges[tid] = S.badges[tid] || {};
  const was = !!S.badges[tid][bid]; S.badges[tid][bid] = !!v;
  if (v && !was && !silent){ const t = teamById(tid), b = BBY[bid]; toast(`${b.icon} <b>${esc(t.name)}</b> obtiene la insignia <b>${b.name}</b>`, 'gold'); SND.level(); confetti(80); logEv(tid, `Insignia ${b.name}`); }
}
function logEv(tid, msg, atp = 0, xp = 0){ S.log.unshift({t:Date.now(), tid, msg, atp, xp}); if (S.log.length > 600) S.log.length = 600; }

/* evalúa insignias automáticas y ascensos */
function evaluate(tid, prevXP){
  MISSIONS.filter(m => m.type === 'mission').forEach(m => {
    const r = (S.xp[tid] || {})[m.id]; if (!r) return;
    if ((+r.team||0) >= 37.5 && (+r.indiv||0) > 0) setBadge(tid, m.badge, true);
  });
  const fr = (S.xp[tid] || {}).reactor;
  if (fr && (fr.rubric || []).filter(x => x === 0).length >= 3) setBadge(tid, 'maestria', true);
  const roles = MISSIONS.filter(m => (S.xp[tid] || {})[m.id] && S.xp[tid][m.id].roles).length;
  if (roles >= 3) setBadge(tid, 'sinergia', true);
  if (prevXP != null){
    const a = levelOf(prevXP), b = levelOf(totalXP(tid));
    if (b.idx > a.idx){ const t = teamById(tid); toast(`🎉 <b>${esc(t.name)}</b> asciende a <b>${b.name}</b>`, 'ok'); SND.level(); confetti(); logEv(tid, `Ascenso a ${b.name}`); }
  }
}
function changeATP(tid, d, why){
  const t = teamById(tid); if (!t) return false;
  if (d < 0 && t.atp + d < 0){ toast(`⚠️ ${esc(t.name)} no tiene ATP suficiente (saldo: ${t.atp})`, 'bad'); SND.bad(); return false; }
  t.atp += d; logEv(tid, why, d); if (d > 0) SND.coin(); save(); return true;
}
function addRetos(tid, mid, xp){
  const prev = totalXP(tid), r = xpRec(tid, mid); r.retos = (+r.retos||0) + xp; evaluate(tid, prev); logEv(tid, `+${xp} XP retos (${MBY[mid].code})`, 0, xp);
}

/* ---------------- avatares ---------------- */
function mitoSVG(size = 150){
  return `<svg class="avatar" style="width:${size}px;height:${size}px" viewBox="0 0 160 160" role="img" aria-label="Dra. Mito">
  <defs><radialGradient id="mbg" cx="50%" cy="40%"><stop offset="0" stop-color="#16406b"/><stop offset="1" stop-color="#0a1a2e"/></radialGradient></defs>
  <circle cx="80" cy="80" r="76" fill="url(#mbg)" stroke="#22d3ee" stroke-width="4"/>
  <path d="M30 150 Q80 112 130 150" fill="#e8f4ff"/><path d="M68 128 L80 150 L92 128" fill="#22d3ee"/>
  <g transform="rotate(-12 80 80)">
   <ellipse cx="80" cy="78" rx="56" ry="40" fill="#14b8a6" stroke="#5eead4" stroke-width="4"/>
   <path d="M36 96 q8 -16 16 0 t16 0 t16 0 t16 0 t16 0" stroke="#0f766e" stroke-width="5" fill="none" stroke-linecap="round"/>
   <circle cx="64" cy="68" r="12" fill="#fff"/><circle cx="96" cy="68" r="12" fill="#fff"/>
   <circle cx="66" cy="70" r="5" fill="#0b1626"/><circle cx="98" cy="70" r="5" fill="#0b1626"/>
   <circle cx="64" cy="68" r="15" fill="none" stroke="#a3e635" stroke-width="3"/><circle cx="96" cy="68" r="15" fill="none" stroke="#a3e635" stroke-width="3"/>
   <path d="M79 68 h2" stroke="#a3e635" stroke-width="3"/>
   <path d="M70 84 q10 8 20 0" stroke="#0b1626" stroke-width="3" fill="none" stroke-linecap="round"/>
  </g></svg>`;
}
function entropiaSVG(size = 150){
  return `<svg class="avatar" style="width:${size}px;height:${size}px" viewBox="0 0 160 160" role="img" aria-label="Entropía (silueta)">
  <circle cx="80" cy="80" r="76" fill="#120a20" stroke="#a855f7" stroke-width="4"/>
  <path d="M30 150 Q34 60 80 30 Q126 60 130 150 Z" fill="#05030a"/>
  <path d="M52 150 Q56 84 80 66 Q104 84 108 150 Z" fill="#000"/>
  <circle cx="70" cy="96" r="5" fill="#c084fc"><animate attributeName="opacity" values="1;.2;1" dur="2.2s" repeatCount="indefinite"/></circle>
  <circle cx="90" cy="96" r="5" fill="#c084fc"><animate attributeName="opacity" values="1;.2;1" dur="2.2s" repeatCount="indefinite"/></circle>
  <rect x="20" y="70" width="120" height="3" fill="#a855f7" opacity=".5"><animate attributeName="y" values="40;120;40" dur="3s" repeatCount="indefinite"/></rect>
  </svg>`;
}
function shieldHTML(t, big){
  return `<div class="shield" style="background:linear-gradient(135deg,${esc(t.c1)},${esc(t.c2)});${big?'width:110px;height:124px;font-size:3.2em':''}">${esc(t.emoji)}</div>`;
}

/* ---------------- diálogo con efecto máquina de escribir ---------------- */
function dialogHTML(text, who = 'mito', id = 'dlg'){
  const ent = who === 'entropia';
  return `<div class="dialog">${ent ? entropiaSVG() : mitoSVG()}
   <div class="bubble ${ent ? 'entropia' : ''}"><div class="who">${ent ? 'ENTROPÍA' : 'DRA. MITO · Directora del Instituto'}</div>
   <div class="tw" id="${id}" data-text="${esc(text)}"></div>
   <div class="row" style="margin-top:.6em"><button class="btn ghost sm" data-act="tw-skip" data-id="${id}">Mostrar todo ⏭</button></div></div></div>`;
}
const TW = {};
function startTypewriters(){
  $$('.tw').forEach(el => {
    const full = el.dataset.text, id = el.id; let i = 0;
    clearInterval(TW[id]);
    TW[id] = setInterval(() => { i += 2; el.innerHTML = esc(full.slice(0, i)) + '<span class="caret"></span>'; if (i >= full.length){ clearInterval(TW[id]); el.textContent = full; } }, 22);
  });
}

/* ===========================================================
   RENDER PRINCIPAL
   =========================================================== */
function render(){
  const app = $('#app');
  app.innerHTML = topbar() + `<main class="view" id="view"></main>`;
  const v = $('#view');
  if (V.name === 'splash') v.innerHTML = splash();
  else if (V.name === 'map') { v.innerHTML = mapView(); }
  else if (V.name === 'board') v.innerHTML = boardView();
  else if (V.name === 'mission') { v.innerHTML = capsuleView(); afterScreen(); }
  renderTimer();
}
function topbar(){
  const b = (view, ico, label) => `<button class="tbtn ${V.name===view?'active':''}" data-act="go" data-view="${view}"><span class="ico">${ico}</span>${label}</button>`;
  return `<header class="topbar">
    <div class="brand" data-act="go" data-view="map"><img src="img/logo.jpg" alt="Logo Operación Metabolia"><div><div class="t1">OPERACIÓN <span class="grad-text">METABOLIA</span></div><div class="t2">Instituto Nutri-Metabólico · Taller de Bioquímica</div></div></div>
    ${b('map','🗺️','Mapa')}${b('board','🏆','Tablero')}
    <button class="tbtn" data-act="mito"><span class="ico">🧬</span>Dra. Mito</button>
    <button class="tbtn" data-act="briefing"><span class="ico">📡</span>Briefing</button>
    <button class="tbtn" data-act="rules"><span class="ico">📜</span>Reglas</button>
    <button class="tbtn" data-act="panel"><span class="ico">⚙️</span>Instituto</button>
    <button class="tbtn" data-act="sound" title="Sonido">${S.settings.sound ? '🔊' : '🔇'}</button>
    <button class="tbtn" data-act="fullscreen" title="Pantalla completa">⛶</button>
  </header>`;
}

/* ---------------- SPLASH ---------------- */
function splash(){
  return `<div class="splash">
    <img src="img/logo.jpg" alt="Operación Metabolia: el juego de bioquímica para explorar, aprender y superar">
    <div class="kicker">Detectives del metabolismo · Taller de Bioquímica · 1.er año de Nutrición</div>
    <p class="sub">Metabolia es una ciudad que funciona día y noche gracias a sus distritos. Pero las luces parpadean: alguien, o algo, la está saboteando. Necesitamos reclutas con mente de científicos y corazón de nutricionistas.</p>
    <div class="row" style="justify-content:center">
      <button class="btn big" data-act="go" data-view="map">▶ Entrar al mapa de Metabolia</button>
      <button class="btn ghost big" data-act="briefing">📡 Briefing inicial</button>
    </div>
    ${S.teams.length ? `<p class="small muted">${S.teams.length} Laboratorio(s) registrados · progreso guardado en este navegador</p>` : `<p class="small muted">Primera vez: entren a la Misión 0 · Reclutamiento para registrar los Laboratorios.</p>`}
  </div>`;
}

/* ---------------- MAPA ---------------- */
function mstatus(id){ return S.restored[id] ? 'restored' : (S.unlocked[id] ? 'open' : 'locked'); }
function mapView(){
  const P = MAP_POS;
  const restoredCount = ['m1','m2','m3','m4','m5','m6'].filter(id => S.restored[id]).length;
  const glow = S.reactor.on ? 1 : .15 + restoredCount * .12;
  let path = '';
  for (let i = 0; i < MAP_PATH.length - 1; i++){
    const a = P[MAP_PATH[i]], b = P[MAP_PATH[i+1]], lit = S.restored[MAP_PATH[i]];
    const mx = (a[0]+b[0])/2 + (i%2?40:-40), my = (a[1]+b[1])/2 + (i%2?-30:30);
    path += `<path d="M${a[0]} ${a[1]} Q${mx} ${my} ${b[0]} ${b[1]}" stroke="${lit ? '#a3e635' : '#24456b'}" stroke-width="${lit?8:6}" fill="none" stroke-linecap="round" ${lit ? 'class="pipe"' : 'stroke-dasharray="4 14"'} opacity="${lit?.9:.8}"/>`;
  }
  // tuberías al reactor
  let pipes = '';
  ['m1','m2','m3','m4','m5','m6'].forEach(id => {
    const a = P[id], r = P.reactor, lit = S.restored[id];
    pipes += `<line x1="${a[0]}" y1="${a[1]}" x2="${r[0]}" y2="${r[1]}" stroke="${lit ? MBY[id].color : '#1b3352'}" stroke-width="${lit?4:3}" ${lit?'class="pipe"':''} opacity="${lit?.7:.5}"/>`;
  });
  const resc = P.rescate, re = P.reactor;
  pipes += `<path d="M${re[0]} ${re[1]} Q${(re[0]+resc[0])/2+120} ${re[1]+60} ${resc[0]} ${resc[1]}" stroke="#8b5cf6" stroke-width="4" fill="none" stroke-dasharray="6 12" opacity=".55"/>`;
  // edificios decorativos
  let deco = '';
  for (let i = 0; i < 46; i++){
    const x = (i * 137) % 1600, h = 30 + (i * 53) % 90, w = 26 + (i * 17) % 40;
    deco += `<rect x="${x}" y="${900-h}" width="${w}" height="${h}" fill="#0c1d33" opacity=".85"/>`;
    for (let k = 0; k < 3; k++) deco += `<rect x="${x+6+k*8}" y="${900-h+10}" width="4" height="6" fill="${(i+k)%3 ? '#1e3a5f' : '#facc15'}" class="${(i+k)%5===0 ? 'flick' : ''}" opacity=".6"/>`;
  }
  const nodes = MISSIONS.map(m => {
    const [x, y] = P[m.id], st = mstatus(m.id), isR = m.id === 'reactor', r = isR ? 92 : 62;
    const col = st === 'locked' ? '#4b5d75' : m.color;
    let extra = '';
    if (isR){
      extra = `<g opacity="${glow}"><circle cx="${x}" cy="${y}" r="${r+40}" fill="none" stroke="#ef5a35" stroke-width="3" stroke-dasharray="20 14" class="reactor-spin"/>
      <circle cx="${x}" cy="${y}" r="${r+22}" fill="none" stroke="#f59e0b" stroke-width="4" stroke-dasharray="40 20" class="reactor-spin r2"/></g>
      <circle cx="${x}" cy="${y}" r="${r+70}" fill="url(#rglow)" opacity="${glow}"/>`;
    }
    return `<g class="node ${st}" data-act="node" data-id="${m.id}" tabindex="0" role="button" aria-label="${esc(m.code + ' ' + m.name + ' · ' + ({locked:'bloqueado',open:'disponible',restored:'restaurado'})[st])}">
      ${extra}
      <circle class="ring" cx="${x}" cy="${y}" r="${r+8}" fill="none" stroke="${col}" stroke-width="5" stroke-opacity=".8"/>
      <g class="disc"><circle cx="${x}" cy="${y}" r="${r}" fill="${st==='restored' ? col : '#0f2440'}" fill-opacity="${st==='restored'?.35:1}" stroke="${col}" stroke-width="4"/>
      <text x="${x}" y="${y + (isR?22:17)}" text-anchor="middle" font-size="${isR?64:48}" class="${st==='locked'?'flick':''}">${m.icon}</text></g>
      ${st === 'locked' ? `<circle cx="${x+r*.72}" cy="${y-r*.72}" r="20" fill="#0b1626" stroke="#4b5d75" stroke-width="3"/><text x="${x+r*.72}" y="${y-r*.72+8}" text-anchor="middle" font-size="22">🔒</text>` : ''}
      ${st === 'restored' ? `<circle cx="${x+r*.72}" cy="${y-r*.72}" r="20" fill="#a3e635"/><text x="${x+r*.72}" y="${y-r*.72+9}" text-anchor="middle" font-size="24" fill="#05202a" font-weight="900">✔</text>` : ''}
      <text class="label" x="${x}" y="${y + r + 34}">${m.code === 'FINAL' ? 'FINAL' : m.code} · ${esc(m.name)}</text>
      <text class="sublabel" x="${x}" y="${y + r + 56}">${esc(m.weeks)}</text>
    </g>`;
  }).join('');
  return `<div class="map-wrap">
    <div class="map-head"><div><div class="kicker">Ruta de misiones · Semanas 3 a 17</div><h2>Mapa de Metabolia</h2></div>
     <div class="map-legend"><span><i class="dot" style="background:#4b5d75"></i>Distrito saboteado</span><span><i class="dot" style="background:var(--teal);box-shadow:0 0 8px var(--teal)"></i>Disponible</span><span><i class="dot" style="background:var(--lime)"></i>Restaurado</span><span>⚛️ Reactor: ${restoredCount}/6 distritos conectados</span></div></div>
    <svg class="map-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet">
      <defs><radialGradient id="rglow"><stop offset="0" stop-color="#f59e0b" stop-opacity=".55"/><stop offset="1" stop-color="#ef5a35" stop-opacity="0"/></radialGradient></defs>
      ${deco}${pipes}${path}${nodes}
    </svg></div>`;
}

/* ===========================================================
   CÁPSULAS (pantallas por tipo de misión)
   =========================================================== */
function screensFor(m){
  const S1 = [];
  const add = (id, title, icon, html, after) => S1.push({id, title, icon, html, after});
  if (m.type === 'recruit'){
    add('cover','Portada','🎖️',() => coverHTML(m,'Se buscan reclutas','Aceptar la misión'));
    add('brief','Briefing','📡',() => `<div class="kicker">Mensaje del Instituto</div><h2>Briefing de la Dra. Mito</h2>${dialogHTML(m.briefing)}<div class="card" style="margin-top:1em"><h3>📡 Briefing inicial de Metabolia</h3><p>${esc(BRIEFING_INICIAL)}</p></div>`);
    add('enemy','El enemigo','🌀',() => `<div class="kicker">Informe de inteligencia</div><h2>El enemigo: Entropía</h2>${dialogHTML(m.enemy,'entropia')}<div class="cards" style="margin-top:1em">${['Inhibe enzimas','Bloquea rutas','Difunde mitos alimentarios','Filtra respuestas de IA con errores'].map(x=>`<div class="card"><h4>🌀 ${x}</h4></div>`).join('')}</div>`);
    add('agenda','Agenda','⏱️',() => agendaHTML(m));
    add('labs','Tu Laboratorio','🧪',() => labsHTML());
    add('roles','Roles','🔄',() => rolesHTML());
    add('pact','El Pacto','📜',() => pactHTML());
    add('mito','Conoce a la Dra. Mito','🧬',() => mitoDemoHTML(m));
    add('check','Checklist de salida','✅',() => checklistHTML(m));
    add('riddle','Acertijo','🔐',() => riddleHTML(m));
    add('close','Cierre','🌟',() => closingHTML(m));
  } else if (m.type === 'mission'){
    add('cover','Portada','🏁',() => coverHTML(m, m.taller + ' · ' + m.weeks, 'Iniciar misión'));
    add('alert','Alerta','🚨',() => alertHTML(m.falla), () => SND.alarm());
    add('brief','Briefing','📡',() => `<div class="kicker">Mensaje del Instituto</div><h2>Briefing de la Dra. Mito</h2>${dialogHTML(m.briefing)}`);
    add('obj','Objetivos','🎯',() => objectivesHTML(m));
    add('route','Ruta y roles','🧭',() => routeHTML(m));
    add('case','Expediente','📁',() => casesHTML(m));
    m.parts.forEach((p, i) => add('p'+i, p.title.split('·')[0].trim(), '🧪', () => partHTML(m, i)));
    add('audit','Auditoría IA','🔍',() => auditHTML(m));
    add('debrief','Debriefing','🗣️',() => debriefHTML(m));
    add('exp','Expediciones','🗺️',() => expeditionsHTML(m));
    add('reg','Registro del Instituto','📋',() => registryHTML(m));
    add('riddle','Acertijo final','🔐',() => riddleHTML(m));
    add('close','Cierre','🌟',() => closingHTML(m));
  } else if (m.type === 'camp'){
    add('cover','Portada','⛺',() => coverHTML(m,'Pausa estratégica · Semana 11','Entrar al Campamento'));
    add('brief','Briefing','📡',() => `<div class="kicker">Mensaje del Instituto</div><h2>Briefing de la Dra. Mito</h2>${dialogHTML(m.briefing)}`);
    add('agenda','Agenda','⏱️',() => agendaHTML(m));
    add('escape','Escape room','🔐',() => escapeHTML(m));
    add('market','Mercado de ATP','🪙',() => marketHTML());
    add('repair','Reparación de misiones','🛠️',() => repairHTML());
    add('conn','Conexión entre distritos','🔗',() => notesListHTML(m,'conn','Conexión entre distritos', m.connections));
    add('bita','Bitácora','📓',() => notesListHTML(m,'bita','Bitácora del Campamento (individual)', m.bitacora, 'Cada recluta responde en su bitácora. Pueden usar este espacio para recoger ideas del curso.'));
  } else if (m.type === 'final'){
    add('alert','Alarma roja','🚨',() => alertHTML(m.alert, true), () => SND.alarm());
    add('brief','Briefing','📡',() => `<div class="kicker">Alerta máxima</div><h2>Briefing de la Dra. Mito</h2>${dialogHTML(m.briefing)}`);
    add('obj','Misión en breve','🎯',() => objectivesHTML(m, true));
    add('elena','El día de Elena','🕐',() => elenaHTML(m));
    add('grid','Cuadro del reactor','⚛️',() => reactorGridHTML(m));
    add('conn','Las conexiones','🔗',() => finalQuestionsHTML(m));
    add('prod','El producto','🎨',() => productHTML(m));
    add('reg','Pauta y registro','📋',() => registryHTML(m));
    add('on','Reactivación','🔆',() => reactivationHTML(m));
  } else if (m.type === 'rescue'){
    add('cover','Portada','🛟',() => coverHTML(m,'Epílogo · Semana 17','Iniciar rescate'));
    add('brief','Briefing','📡',() => `<div class="kicker">Mensaje del Instituto</div><h2>Briefing de la Dra. Mito</h2>${dialogHTML(m.briefing)}<div class="card" style="margin-top:1em"><h3>¿Cómo funciona?</h3><ul>${m.how.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`);
    add('pend','Distritos pendientes','📊',() => pendingHTML(m));
    m.challenges.forEach((c, i) => add('r'+i, 'Rescate ' + MBY[c.m].code, MBY[c.m].icon, () => rescueChallengeHTML(m, i)));
    add('bita','Bitácora de rescate','📓',() => notesListHTML(m,'bita','Bitácora de rescate', m.bitacora));
    add('close','Cierre','🌟',() => closingHTML(m));
  }
  return S1;
}

function capsuleView(){
  const m = MBY[V.mid], scr = screensFor(m), cur = clamp(V.screen, 0, scr.length - 1);
  V.screen = cur; S.seen[m.id + ':' + scr[cur].id] = 1; save();
  const nav = scr.map((s, i) => `<button class="${i===cur?'cur':''} ${S.seen[m.id+':'+s.id]?'seen':''}" data-act="screen" data-i="${i}"><span class="n">${i+1}</span>${s.icon} ${esc(s.title)}</button>`).join('');
  return `<div class="capsule" style="--mc:${m.color}">
    <aside class="cap-nav"><div class="mtitle">${m.icon} ${m.code === 'FINAL' ? 'Misión final' : (m.code==='CB'||m.code==='R') ? '' : 'Misión ' + m.code.slice(1)}${m.code==='M0'?'':''}<br>${esc(m.name)}<small>${esc(m.weeks)} · ${esc(m.taller)}</small></div>${nav}
      <div style="padding:.6em"><button class="btn ghost sm" data-act="go" data-view="map">← Volver al mapa</button></div></aside>
    <section class="cap-main">
      <div class="cap-body" id="capbody"><div class="screen">${scr[cur].html()}</div></div>
      <div class="cap-foot">
        <button class="btn ghost sm" data-act="screen" data-i="${cur-1}" ${cur===0?'disabled':''}>◀ Anterior</button>
        <div class="progress"><i style="width:${(cur+1)/scr.length*100}%"></i></div>
        <span class="small muted">${cur+1} / ${scr.length}</span>
        <button class="btn sm" data-act="screen" data-i="${cur+1}" ${cur===scr.length-1?'disabled':''}>Siguiente ▶</button>
      </div>
    </section></div>`;
}
function afterScreen(){
  const m = MBY[V.mid], s = screensFor(m)[V.screen];
  startTypewriters(); drawKinetics();
  if (s && s.after) s.after();
}
function rerenderScreen(){
  const body = $('#capbody'); if (!body) return render();
  const top = body.scrollTop, m = MBY[V.mid], s = screensFor(m)[V.screen];
  body.innerHTML = `<div class="screen" style="animation:none">${s.html()}</div>`;
  body.scrollTop = top; drawKinetics();
  $$('.tw', body).forEach(el => { el.textContent = el.dataset.text; });
}

/* ---------- bloques reutilizables ---------- */
function coverHTML(m, meta, cta){
  return `<div class="cover"><div class="big-ico">${m.icon}</div>
   <div class="kicker">${m.code === 'M0' ? 'Operación Metabolia · Instituto Nutri-Metabólico' : m.code === 'CB' ? 'Pausa estratégica' : m.code === 'R' ? 'Epílogo' : 'Misión ' + m.code.slice(1)}</div>
   <h1>${esc(m.name.toUpperCase())}</h1><div class="meta">${esc(meta)}</div><div class="meta">${esc(m.unit)}</div>
   <button class="btn big" style="margin-top:1em" data-act="screen" data-i="1">${esc(cta)} ▶</button></div>`;
}
function alertHTML(text, red){
  return `<div class="alert-screen"><div class="siren">🚨</div><div class="kicker" style="color:var(--red)">${red ? 'ALERTA MÁXIMA' : '¡Alerta en Metabolia!'}</div>
   <p class="flicker-text">${esc(text)}</p><button class="btn red" data-act="alarm">🔊 Repetir alarma</button></div>`;
}
function objectivesHTML(m, final){
  return `<div class="kicker">Tu misión en breve</div><h2>Al terminar esta misión podrás…</h2>
   <ol class="objectives">${m.objectives.map((o,i)=>`<li style="animation-delay:${i*.45}s;font-size:1.15em">${esc(o)}</li>`).join('')}</ol>
   <div class="cards" style="margin-top:1em">
    <div class="card accent"><h3>📦 Producto del equipo</h3><p>${esc(m.product)}</p></div>
    ${m.badge ? `<div class="card"><h3>${BBY[m.badge].icon} Insignia ${BBY[m.badge].name}</h3><p class="small">${esc(BBY[m.badge].crit)}</p></div>` : ''}
    <div class="card"><h3>⭐ XP disponibles</h3><p>${final ? '150 XP: preparación (20) · producto del equipo (90) · reflexión individual (25) · retos y logros (15).' : '120 XP: preparación (20) · misión de equipo (50) · reto individual (30) · retos y logros (20).'}</p>${final ? '<p class="small muted">Actividad formativa: no reemplaza ninguna nota del calendario.</p>' : '<p class="small muted">Los XP de la misión de equipo se calculan desde el taller evaluado; la nota oficial no cambia.</p>'}</div>
   </div>`;
}
function routeHTML(m){
  const k = MISSIONS.filter(x => x.type === 'mission').indexOf(m);
  return `<div class="kicker">Ruta de la misión</div><h2>El ciclo de cada misión</h2>
   <div class="phases">${PHASES.map(p=>`<div class="phase"><div class="pi">${p.i}</div><b>${p.n}</b><div class="w">${p.w}</div><p>${p.d}</p></div>`).join('')}</div>
   <h3 style="margin-top:1.2em">🔄 Roles en esta misión</h3>
   <p class="small muted">Los roles rotan: nadie repite el rol de la misión anterior. Rotación sugerida para ${m.code}:</p>
   <div class="cards">${ROLES.map((r,i)=>`<div class="card"><h4>${r.icon} ${r.name}</h4><p class="small">${r.d}</p>${k>=0?`<span class="pill teal">Integrante ${ROTATION.findIndex(row=>row[k]===r.id)+1}</span>`:''}</div>`).join('')}</div>
   ${timerBtns([['Briefing',10],['Exploración guiada',20],['Operación en equipo',60],['Debriefing',20]])}`;
}
function casesHTML(m){
  return `<div class="kicker">Expediente del caso</div><h2>Habitantes de Metabolia</h2><p class="fict">Todos los casos y personas son ficticios.</p>
   ${m.cases.map(c => `<div class="case-card" ${c.entropia?'style="border-left-color:#a855f7"':''}><div class="tag">${esc(c.tag)}</div><h3>${c.icon} ${esc(c.title)}</h3><p>${esc(c.text)}</p>
     ${c.table ? `<table class="t"><tr><th>Dato</th><th>Valor</th></tr>${c.table.map(r=>`<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('')}</table>` : ''}
     ${c.rows ? `<table class="t"><tr>${c.head.map(h=>`<th>${esc(h)}</th>`).join('')}</tr>${c.rows.map(r=>`<tr>${r.map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</table>` : ''}
     ${c.foot ? `<p class="small muted" style="margin-top:.6em">📐 ${esc(c.foot)}</p>` : ''}</div>`).join('')}`;
}
function timerBtns(list){
  return `<div class="row" style="margin-top:1em"><span class="small muted">⏱ Cronómetro:</span>${list.map(([l,mn])=>`<button class="btn ghost sm" data-act="timer-start" data-l="${esc(l)}" data-m="${mn}">${esc(l)} · ${mn} min</button>`).join('')}</div>`;
}
function agendaHTML(m){
  return `<div class="kicker">Agenda de la sesión</div><h2>Agenda</h2>
   <table class="t"><tr><th>Actividad</th><th class="c">Tiempo</th><th>Qué hacen</th>${m.agenda[0].xp?'<th class="c">XP</th>':''}<th class="c">Cronómetro</th></tr>
   ${m.agenda.map(a=>`<tr><td><b>${esc(a.a)}</b></td><td class="c">${a.min} min</td><td>${esc(a.d)}</td>${a.xp?`<td class="c">${a.xp}</td>`:''}<td class="c"><button class="btn sm" data-act="timer-start" data-l="${esc(a.a)}" data-m="${a.min}">⏱ Iniciar</button></td></tr>`).join('')}
   </table>${m.type==='camp'?'<p class="card" style="margin-top:1em">🎁 <b>Recompensa:</b> escapar del Campamento entrega 10 ATP a cada Laboratorio. Esta pausa no entrega XP: es para consolidar.</p>':''}`;
}
function noteBox(key, label = 'Puesta en común · ideas del curso (se guarda automáticamente)'){
  return `<div class="notes"><label>${esc(label)}</label><textarea data-note="${esc(key)}" placeholder="Escriban aquí las ideas clave que surgen en la puesta en común…">${esc(S.notes[key] || '')}</textarea></div>`;
}
function notesListHTML(m, k, title, items, sub){
  return `<div class="kicker">${esc(m.name)}</div><h2>${esc(title)}</h2>${sub?`<p class="muted">${esc(sub)}</p>`:''}
   ${items.map((q,i)=>`<div class="q"><div class="q-head"><div class="q-num">${i+1}</div><div class="q-text">${esc(q)}</div></div>${noteBox(m.id+':'+k+':'+i)}</div>`).join('')}`;
}

/* ---------- preguntas ---------- */
function partHTML(m, pi){
  const p = m.parts[pi];
  return `<div class="kicker">Operación · preguntas del caso</div><h2>${esc(p.title)}</h2>
   <p class="small muted">Respondan en equipo. Fundamenten cada respuesta con el mecanismo bioquímico y conéctenlo con el caso. Si usan pistas o IA, decláranlo.</p>
   ${p.qs.map(q => questionHTML(m, q)).join('')}
   ${pi === 0 ? timerBtns([['Operación en equipo',60]]) : ''}`;
}
function questionHTML(m, q){
  const key = m.id + ':q' + q.n;
  const hintQ = q.hintKey ? findHintQ(m, q.hintKey) : null;
  return `<div class="q" id="q-${q.n}"><div class="q-head"><div class="q-num">${q.n}</div><div class="q-text">${esc(q.text)}
     <div>${q.widget ? '<span class="tag-auto">● Incluye verificación interactiva</span>' : '<span class="tag-open">● Respuesta abierta · se evalúa con la pauta</span>'}</div></div></div>
   ${q.widget ? widgetHTML(key, q.widget) : ''}
   <div class="q-tools">${hintQ ? `<button class="btn orange sm" data-act="hints" data-mid="${m.id}" data-hk="${esc(q.hintKey)}">💡 Pistas de la Dra. Mito · 5 ATP c/u</button>` : ''}</div>
   ${noteBox(key)}</div>`;
}
function allHintQs(m){ const out = []; (m.parts||[]).forEach(p => p.qs.forEach(q => { if (q.hints) out.push({key:q.hintKey, hints:q.hints}); })); return out; }
function findHintQ(m, k){ return allHintQs(m).find(h => h.key === k); }

/* ---------- widgets ---------- */
function W(key){ S.answers[key] = S.answers[key] || {v:{}, checked:false, shown:false}; return S.answers[key]; }
function widgetHTML(key, w){
  const st = W(key);
  const tools = `<div class="row" style="margin-top:.7em"><button class="btn lime sm" data-act="w-check" data-k="${esc(key)}">✔ Comprobar</button><button class="btn ghost sm" data-act="w-show" data-k="${esc(key)}">👁 Ver solución</button><button class="btn ghost sm" data-act="w-reset" data-k="${esc(key)}">↺ Reiniciar</button></div>`;
  const fb = (st.checked || st.shown) && w.explain ? `<div class="feedback ${st.shown && !allOk(key,w) ? 'warn' : ''}">💡 ${esc(w.explain)}</div>` : '';
  let body = '';
  if (w.type === 'numeric' || w.type === 'kinetics'){
    body = w.fields.map((f, i) => {
      const val = st.shown ? fmt(f.answer) : (st.v[i] ?? '');
      const ok = fieldOk(f, st.v[i]);
      return `<div class="wfield"><label>${esc(f.label)}</label><input inputmode="decimal" data-w="${esc(key)}" data-i="${i}" value="${esc(val)}" aria-label="${esc(f.label)}">${st.checked ? `<span class="mark ${ok?'ok':'bad'}">${ok?'✔':'✘'}</span>` : ''}</div>`;
    }).join('');
    if (w.type === 'kinetics'){
      body = `<div class="kin"><div><div class="row" style="margin-bottom:.5em">
        <button class="btn ${st.v.mode!=='lb'?'':'ghost'} sm" data-act="kin-mode" data-k="${esc(key)}" data-mode="mm">Michaelis-Menten</button>
        <button class="btn ${st.v.mode==='lb'?'':'ghost'} sm" data-act="kin-mode" data-k="${esc(key)}" data-mode="lb">Lineweaver-Burk</button>
        <button class="btn ghost sm" data-act="kin-fit" data-k="${esc(key)}">${st.v.fit?'Ocultar':'Trazar'} ajuste</button></div>
        <svg id="kin-svg" data-k="${esc(key)}" viewBox="0 0 640 420"></svg>
        <div class="small muted"><span style="color:#22d3ee">●</span> sin inhibidor · <span style="color:#f59e0b">●</span> con molécula X</div></div>
        <div><b>Estimen los parámetros:</b>${body}</div></div>`;
    }
  } else if (w.type === 'choice'){
    const sel = st.v.sel || [];
    body = `<div class="choices">${w.options.map((o, i) => {
      let cls = sel.includes(i) ? 'sel' : '';
      if (st.checked || st.shown){ if (w.correct.includes(i)) cls = (sel.includes(i) || st.shown) ? 'ok' : cls; else if (sel.includes(i)) cls = 'bad'; }
      return `<button class="choice ${cls}" data-act="w-choice" data-k="${esc(key)}" data-i="${i}" data-multi="${w.multi?1:0}">${String.fromCharCode(65+i)}. ${esc(o)}</button>`;
    }).join('')}</div>`;
  } else if (w.type === 'grid'){
    body = `<table class="t grid-w"><tr><th></th>${w.cols.map(c=>`<th>${esc(c.name)}</th>`).join('')}</tr>
     ${w.rows.map((r, ri) => `<tr><td><b>${esc(r)}</b></td>${w.cols.map((c, ci) => {
        const k = ri + '_' + ci, val = st.shown ? w.answers[ri][ci] : (st.v[k] || '');
        const cls = st.checked ? (val === w.answers[ri][ci] ? 'ok' : 'bad') : '';
        return `<td class="${cls}"><select data-w="${esc(key)}" data-i="${k}" aria-label="${esc(r + ' · ' + c.name)}"><option value="">—</option>${c.options.map(o=>`<option ${o===val?'selected':''}>${esc(o)}</option>`).join('')}</select></td>`;
     }).join('')}</tr>`).join('')}</table>`;
  } else if (w.type === 'order'){
    if (!st.v.order){ st.v.order = shuffleIdx(w.items.length, key); }
    const ord = st.shown ? w.items.map((_, i) => i) : st.v.order;
    body = `<ol class="order-list">${ord.map((ix, pos) => `<li class="${st.checked ? (ix===pos?'ok':'bad') : ''}"><span class="sp">${esc(w.items[ix])}</span>
      <button data-act="w-move" data-k="${esc(key)}" data-p="${pos}" data-d="-1" aria-label="Subir">▲</button><button data-act="w-move" data-k="${esc(key)}" data-p="${pos}" data-d="1" aria-label="Bajar">▼</button></li>`).join('')}</ol>`;
  }
  return `<div class="widget">${w.prompt ? `<div style="margin-bottom:.5em"><b>${esc(w.prompt)}</b></div>` : ''}${body}${tools}${fb}</div>`;
}
function shuffleIdx(n, seed){ const a = [...Array(n).keys()]; let s = [...seed].reduce((x, c) => x + c.charCodeAt(0), 7); for (let i = n - 1; i > 0; i--){ s = (s * 9301 + 49297) % 233280; const j = Math.floor(s / 233280 * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } if (a.every((x,i)=>x===i)) a.reverse(); return a; }
function fieldOk(f, v){ const x = num(v); return x !== null && Math.abs(x - f.answer) <= (f.tol || 0) + 1e-9; }
function allOk(key, w){
  const st = W(key);
  if (w.type === 'numeric' || w.type === 'kinetics') return w.fields.every((f, i) => fieldOk(f, st.v[i]));
  if (w.type === 'choice'){ const sel = (st.v.sel || []).slice().sort().join(); return sel === w.correct.slice().sort().join(); }
  if (w.type === 'grid') return w.rows.every((r, ri) => w.cols.every((c, ci) => st.v[ri+'_'+ci] === w.answers[ri][ci]));
  if (w.type === 'order') return (st.v.order || []).every((x, i) => x === i);
  return false;
}
function findWidget(key){
  const [mid, q] = key.split(':'); const m = MBY[mid];
  if (q.startsWith('q')){ const n = +q.slice(1); for (const p of m.parts) for (const qq of p.qs) if (qq.n === n) return qq.widget; }
  if (q.startsWith('r')) return m.challenges[+q.slice(1)].widget;
  return null;
}

/* ---------- cinética (M1) ---------- */
function drawKinetics(){
  const svg = $('#kin-svg'); if (!svg) return;
  const st = W(svg.dataset.k), lb = st.v.mode === 'lb', fit = st.v.fit;
  const S0 = [.5,1,2,4,8,16], V0 = [20,33.3,50,66.7,80,88.9], VX = [7.7,14.3,25,40,57.1,72.7];
  const W_ = 640, H = 420, L = 70, R = 20, T = 20, B = 50;
  let xr, yr, pts0, ptsX, xl, yl;
  if (!lb){ xr = [0,17]; yr = [0,110]; pts0 = S0.map((s,i)=>[s,V0[i]]); ptsX = S0.map((s,i)=>[s,VX[i]]); xl = '[S] lactosa (mM)'; yl = 'V₀ (µmol/min)'; }
  else { xr = [-.6,2.1]; yr = [-.01,.14]; pts0 = S0.map((s,i)=>[1/s,1/V0[i]]); ptsX = S0.map((s,i)=>[1/s,1/VX[i]]); xl = '1/[S] (mM⁻¹)'; yl = '1/V₀ (min/µmol)'; }
  const X = x => L + (x - xr[0]) / (xr[1] - xr[0]) * (W_ - L - R), Y = y => H - B - (y - yr[0]) / (yr[1] - yr[0]) * (H - T - B);
  let g = '';
  const xt = lb ? [-.5,0,.5,1,1.5,2] : [0,2,4,6,8,10,12,14,16], yt = lb ? [0,.02,.04,.06,.08,.1,.12] : [0,20,40,60,80,100];
  xt.forEach(v => g += `<line x1="${X(v)}" y1="${T}" x2="${X(v)}" y2="${H-B}" stroke="#16304f"/><text x="${X(v)}" y="${H-B+18}" text-anchor="middle">${String(v).replace('.',',')}</text>`);
  yt.forEach(v => g += `<line x1="${L}" y1="${Y(v)}" x2="${W_-R}" y2="${Y(v)}" stroke="#16304f"/><text x="${L-8}" y="${Y(v)+4}" text-anchor="end">${String(v).replace('.',',')}</text>`);
  g += `<line x1="${X(0)}" y1="${T}" x2="${X(0)}" y2="${H-B}" stroke="#9fb7d1" stroke-width="1.5"/><line x1="${L}" y1="${Y(0)}" x2="${W_-R}" y2="${Y(0)}" stroke="#9fb7d1" stroke-width="1.5"/>`;
  g += `<text x="${(W_+L)/2}" y="${H-8}" text-anchor="middle">${xl}</text><text x="16" y="${(H-B)/2}" text-anchor="middle" transform="rotate(-90 16 ${(H-B)/2})">${yl}</text>`;
  if (fit){
    g += `<defs><clipPath id="kclip"><rect x="${L}" y="${T}" width="${W_-L-R}" height="${H-T-B}"/></clipPath></defs><g clip-path="url(#kclip)">`;
    if (!lb){
      const curve = (Km) => { let d = ''; for (let s = 0; s <= 17; s += .25) d += (s ? 'L' : 'M') + X(s) + ' ' + Y(100*s/(Km+s)); return d; };
      g += `<path d="${curve(2)}" stroke="#22d3ee" stroke-width="2.5" fill="none"/><path d="${curve(6)}" stroke="#f59e0b" stroke-width="2.5" fill="none"/>`;
      g += `<line x1="${L}" y1="${Y(100)}" x2="${W_-R}" y2="${Y(100)}" stroke="#a3e635" stroke-dasharray="6 6"/><text x="${W_-R-4}" y="${Y(100)-6}" text-anchor="end" style="fill:#a3e635">Vmax</text>`;
      g += `<line x1="${L}" y1="${Y(50)}" x2="${W_-R}" y2="${Y(50)}" stroke="#9fb7d1" stroke-dasharray="3 6"/><text x="${W_-R-4}" y="${Y(50)-6}" text-anchor="end">Vmax/2</text>`;
    } else {
      const line = (m_, c) => `M${X(xr[0])} ${Y(m_*xr[0]+.01)} L${X(xr[1])} ${Y(m_*xr[1]+.01)}`;
      g += `<path d="${line(.02)}" stroke="#22d3ee" stroke-width="2.5"/><path d="${line(.06)}" stroke="#f59e0b" stroke-width="2.5"/>`;
      g += `<circle cx="${X(0)}" cy="${Y(.01)}" r="6" fill="none" stroke="#a3e635" stroke-width="3"/><text x="${X(0)+10}" y="${Y(.01)-8}" style="fill:#a3e635">1/Vmax</text>`;
      g += `<circle cx="${X(-.5)}" cy="${Y(0)}" r="5" fill="#22d3ee"/><circle cx="${X(-1/6)}" cy="${Y(0)}" r="5" fill="#f59e0b"/><text x="${X(-.5)}" y="${Y(0)-10}" text-anchor="middle" style="fill:#22d3ee">−1/Km</text>`;
    }
    g += '</g>';
  }
  pts0.forEach(p => g += `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="6" fill="#22d3ee"/>`);
  ptsX.forEach(p => g += `<rect x="${X(p[0])-6}" y="${Y(p[1])-6}" width="12" height="12" fill="#f59e0b"/>`);
  svg.innerHTML = g;
}

/* ---------- auditoría IA ---------- */
function auditHTML(m){
  const A = S.audit[m.id] = S.audit[m.id] || {votes:{}, rev:{}};
  return `<div class="kicker">Auditoría IA</div><h2>El informe filtrado de Entropía</h2>
   <p>Entropía interceptó una consulta a una IA y filtró esta respuesta. Algunas afirmaciones son correctas y otras contienen <b>errores plantados</b>. No confíen ni desconfíen de todo el texto: revisen cada afirmación por separado y contrástenla con el texto guía.</p>
   <div class="leak"><span class="stamp">FILTRADO</span>${esc(m.audit.text)}</div>
   <h3 style="margin-top:1em">Afirmación por afirmación</h3>
   ${m.audit.items.map((it, i) => {
     const v = A.votes[i], rv = A.rev[i];
     return `<div class="claim ${rv ? (it.ok ? 'ok-reveal' : 'bad-reveal') : ''}"><div class="s">${i+1}. «${esc(it.s)}»</div>
       <div class="vote"><button class="vbtn ${v===true?'sel':''}" data-act="aud-vote" data-mid="${m.id}" data-i="${i}" data-v="1">✔ Correcta</button><button class="vbtn ${v===false?'sel':''}" data-act="aud-vote" data-mid="${m.id}" data-i="${i}" data-v="0">✘ Con error</button><button class="vbtn" data-act="aud-rev" data-mid="${m.id}" data-i="${i}">👁 Revelar</button></div>
       ${rv ? `<div class="fix"><b>${it.ok ? '✔ Correcta.' : '✘ Error plantado.'}</b> ${esc(it.fix)} ${v!==undefined ? (v===it.ok ? ' <b style="color:var(--ok)">· ¡El curso acertó!</b>' : ' <b style="color:var(--bad)">· Entropía los engañó en esta.</b>') : ''}</div>` : ''}</div>`;
   }).join('')}
   <div class="row" style="margin-top:.6em"><button class="btn sm" data-act="aud-revall" data-mid="${m.id}">👁 Revelar todas</button>${timerBtns([['Auditoría IA',15]]).replace('<div class="row" style="margin-top:1em">','').replace(/<\/div>$/,'')}</div>
   <div class="card" style="margin-top:1em"><h3>🔍 Insignia Cazaerrores IA</h3><p class="small">Se obtiene al detectar y corregir <b>todos</b> los errores, citando la fuente (texto guía, página). Marquen los Laboratorios que la lograron:</p>
    ${teamsToggleHTML('cazaerrores')}</div>
   ${noteBox(m.id+':audit','Correcciones y fuentes citadas por los Laboratorios')}`;
}
function teamsToggleHTML(bid){
  if (!S.teams.length) return '<p class="muted small">Aún no hay Laboratorios registrados (Misión 0 o Panel del Instituto).</p>';
  return `<div class="row">${S.teams.map(t => `<button class="vbtn ${hasBadge(t.id,bid)?'sel':''}" data-act="badge-toggle" data-t="${t.id}" data-b="${bid}">${esc(t.emoji)} ${esc(t.name)} ${hasBadge(t.id,bid)?BBY[bid].icon:''}</button>`).join('')}</div>`;
}

/* ---------- debriefing ---------- */
function debriefHTML(m){
  return `<div class="kicker">Debriefing</div><h2>Puesta en común</h2>
   <div class="cards"><div class="card accent"><h3>⚠️ Errores frecuentes a revisar</h3><ul>${m.errors.map(e=>`<li>${esc(e)}</li>`).join('')}</ul></div>
   <div class="card"><h3>🎟️ Reto individual de cierre (30 XP)</h3><p class="small muted">Ticket de salida individual (Google Forms o papel).</p><p>${esc(m.ticket)}</p></div></div>
   ${timerBtns([['Debriefing',20],['Reto individual',15]])}
   ${noteBox(m.id+':debrief','Conclusiones del debriefing')}
   <div class="row" style="margin-top:1em"><button class="btn ghost" data-act="export-mission" data-mid="${m.id}">⬇ Exportar informe de la misión (respuestas y notas)</button></div>`;
}

/* ---------- expediciones ---------- */
function expeditionsHTML(m){
  return `<div class="kicker">Retos opcionales</div><h2>Expediciones</h2>
   <p class="muted">Retos voluntarios para quienes quieran profundizar. Formato libre: audio, esquema, video corto o texto. Se habilitan desde el nivel <b>Residente</b>.</p>
   <div class="cards">${m.expeditions.map((e, i) => `<div class="card"><h3>${e.icon} ${esc(e.name)}</h3><p>${esc(e.text)}</p><p><span class="pill lime">+${e.xp} XP</span> <span class="pill orange">+${e.atp} ATP</span></p>
     <button class="btn sm" data-act="exp-award" data-mid="${m.id}" data-i="${i}">🎖 Otorgar a Laboratorios…</button></div>`).join('')}</div>`;
}

/* ---------- registro del Instituto ---------- */
function registryHTML(m){
  const final = m.type === 'final', mx = MAXES[final ? 'final' : 'mission'], RUB = final ? FINAL_RUBRIC : TEAM_RUBRIC;
  if (!S.teams.length) return `<h2>Registro del Instituto</h2><p class="muted">Registren primero los Laboratorios (Misión 0 o Panel del Instituto).</p>`;
  return `<div class="kicker">Informe del Instituto · uso docente</div><h2>Registro de XP${final ? ' · Pauta de la misión final' : ''}</h2>
   <p class="small muted">Los XP de la ${final ? 'pauta del producto' : 'misión de equipo'} se calculan con la pauta (Destacado 100 %, Competente 75 %, Básico 50 %, Insatisfactorio 25 %). Los XP nunca disminuyen por errores; aquí solo se corrigen registros.</p>
   <div style="overflow:auto"><table class="t"><tr><th>Laboratorio</th><th class="c">Preparación<br><span class="tiny">/${mx.prep}</span></th><th class="c">${final?'Producto':'Misión de equipo'}<br><span class="tiny">/${mx.team}</span></th><th class="c">${final?'Reflexión individual':'Reto individual'}<br><span class="tiny">/${mx.indiv}</span></th><th class="c">Retos y logros<br><span class="tiny">/${mx.retos}</span></th><th class="c">Total<br><span class="tiny">/${final?150:120}</span></th>${final?'':'<th class="c">Roles y plazos<br><span class="tiny">(Sinergia)</span></th>'}<th class="c">Insignia</th><th class="c">Informe</th></tr>
   ${S.teams.map(t => { const r = xpRec(t.id, m.id); const b = BBY[m.badge];
     return `<tr><td><b>${esc(t.emoji)} ${esc(t.name)}</b></td>
      <td class="c"><input type="number" min="0" max="${mx.prep}" value="${+r.prep||0}" data-xp="${t.id}" data-mid="${m.id}" data-f="prep"></td>
      <td class="c"><button class="btn ghost sm" data-act="rubric" data-t="${t.id}" data-mid="${m.id}">📝 ${fmt(+r.team||0)}</button></td>
      <td class="c"><input type="number" min="0" max="${mx.indiv}" value="${+r.indiv||0}" data-xp="${t.id}" data-mid="${m.id}" data-f="indiv"></td>
      <td class="c"><input type="number" min="0" max="${mx.retos}" value="${+r.retos||0}" data-xp="${t.id}" data-mid="${m.id}" data-f="retos"></td>
      <td class="c"><b>${fmt(missionXP(t.id, m.id))}</b></td>
      ${final?'':`<td class="c"><input type="checkbox" ${r.roles?'checked':''} data-roles="${t.id}" data-mid="${m.id}" style="width:1.4em;height:1.4em"></td>`}
      <td class="c"><button class="badge ${hasBadge(t.id,b.id)?'on':'off'}" style="--bc:${b.color};margin:auto" data-act="badge-toggle" data-t="${t.id}" data-b="${b.id}" title="${esc(b.name)}">${b.icon}</button></td>
      <td class="c"><button class="btn ghost sm" data-act="report" data-t="${t.id}" data-mid="${m.id}">✍️</button></td></tr>`; }).join('')}
   </table></div>
   <p class="small muted">La insignia ${BBY[m.badge].icon} ${BBY[m.badge].name} se otorga automáticamente con nivel Competente o superior ${final ? '(Destacado en ≥ 3 criterios)' : 'en la misión de equipo (≥ 37,5 XP) y reto individual registrado'}; también puede otorgarse a mano.</p>
   <div class="row"><button class="btn sm" data-act="quick-atp" data-mid="${m.id}">🪙 Registrar ATP de preparación…</button><button class="btn ghost sm" data-act="export-mission" data-mid="${m.id}">⬇ Exportar informe de la misión</button></div>`;
}

/* ---------- acertijo ---------- */
function riddleHTML(m){
  const nx = MBY[m.riddle.opens], done = S.unlocked[nx.id];
  return `<div class="riddle"><div class="lockbig">${done ? '🔓' : '🔐'}</div><div class="kicker">Acertijo final</div>
   <h2>La contraseña de ${esc(nx.code === 'CB' ? 'el Campamento Base' : nx.code === 'FINAL' ? 'la Misión final' : 'la Misión ' + nx.code.slice(1))}</h2>
   <div class="card"><p style="font-size:1.35em;margin:.3em 0">${esc(m.riddle.q)}</p></div>
   <div class="pwd"><input id="pwd" placeholder="Contraseña" autocomplete="off" aria-label="Contraseña"><button class="btn lime" data-act="riddle" data-mid="${m.id}">Abrir 🔓</button></div>
   ${done ? `<p class="feedback">✔ ${esc(nx.name)} ya está desbloqueada en el mapa.</p>` : '<p class="small muted">Sin tildes ni espacios. Al acertar, se desbloquea la siguiente misión en el mapa.</p>'}</div>`;
}
function closingHTML(m){
  const st = S.restored[m.id];
  return `<div class="kicker">Cierre de la misión</div><h2>${st ? '✔ Distrito restaurado' : 'Restaurar el distrito'}</h2>${dialogHTML(m.closing)}
   <div class="row" style="margin-top:1em">${st ? `<span class="pill lime">✔ ${esc(m.name)} restaurado en el mapa</span><button class="btn ghost sm" data-act="unrestore" data-mid="${m.id}">Deshacer</button>` : `<button class="btn lime big" data-act="restore" data-mid="${m.id}">🌟 Declarar distrito restaurado</button>`}
   <button class="btn ghost" data-act="go" data-view="map">🗺️ Ver el mapa</button><button class="btn ghost" data-act="go" data-view="board">🏆 Ver el tablero</button></div>
   <p class="small muted">Se recomienda declararlo restaurado tras el debriefing, cuando se cierra la misión.</p>`;
}

/* ---------- M0 ---------- */
const EMOJIS = ['🧬','⚗️','🔬','🧪','⚡','🔥','🌿','💧','🧠','🫀','🦠','🍃','🌀','⭐','🛡️','⚛️','🧫','🍋','🥑','🐝'];
function labsHTML(){
  return `<div class="kicker">Ficha del Laboratorio</div><h2>Tu Laboratorio</h2>
   <p>Formen equipos de 4. Elijan un nombre relacionado con la bioquímica, un lema (máx. 8 palabras), un símbolo y dos colores. Diseñen el escudo completo en Canva; aquí registramos su identidad para el tablero (sin nombres de estudiantes).</p>
   <div class="cards">
    <div class="card accent"><h3>➕ Registrar Laboratorio</h3>${teamFormHTML()}</div>
    <div class="card"><h3>Laboratorios registrados (${S.teams.length})</h3>${S.teams.length ? S.teams.map(t => `<div class="row" style="margin:.4em 0">${shieldHTML(t)}<div style="flex:1"><div class="team-name" style="font-size:1em">${esc(t.name)}</div><div class="team-motto">${esc(t.motto||'')}</div><div class="tiny muted">${esc(t.concept||'')}</div></div><button class="btn ghost sm" data-act="team-edit" data-t="${t.id}">✏️</button></div>`).join('') : '<p class="muted">Aún no hay Laboratorios.</p>'}</div>
   </div>${timerBtns([['Formar el Laboratorio',15],['Escudo del Laboratorio',20]])}`;
}
function teamFormHTML(t = {}){
  return `<div class="tform" data-tid="${t.id||''}">
   <div class="wfield"><label>Nombre del Laboratorio</label><input name="name" value="${esc(t.name||'')}" maxlength="40" style="width:16em;text-align:left"></div>
   <div class="wfield"><label>Concepto bioquímico (1 frase)</label><input name="concept" value="${esc(t.concept||'')}" maxlength="120" style="width:16em;text-align:left"></div>
   <div class="wfield"><label>Lema (máx. 8 palabras)</label><input name="motto" value="${esc(t.motto||'')}" maxlength="80" style="width:16em;text-align:left"></div>
   <div class="wfield"><label>Símbolo</label><select name="emoji">${EMOJIS.map(e=>`<option ${e===(t.emoji||'🧬')?'selected':''}>${e}</option>`).join('')}</select></div>
   <div class="wfield"><label>Colores del escudo</label><input type="color" name="c1" value="${t.c1||'#22d3ee'}" style="width:4em;padding:0"><input type="color" name="c2" value="${t.c2||'#a3e635'}" style="width:4em;padding:0"></div>
   <div class="row" style="margin-top:.6em"><button class="btn lime sm" data-act="team-save">💾 ${t.id ? 'Guardar cambios' : 'Registrar'}</button>${t.id ? `<button class="btn red sm" data-act="team-del" data-t="${t.id}">🗑 Eliminar</button>` : ''}</div></div>`;
}
function rolesHTML(){
  return `<div class="kicker">Tu Laboratorio y los roles</div><h2>Roles rotativos</h2>
   <div class="cards">${ROLES.map(r=>`<div class="card"><h3>${r.icon} ${r.name}</h3><p>${r.d}</p></div>`).join('')}</div>
   <h3 style="margin-top:1em">Plan de rotación sugerido</h3>
   <table class="t"><tr><th>Integrante</th>${['M1','M2','M3','M4','M5','M6'].map(x=>`<th class="c">${x}</th>`).join('')}</tr>
   ${ROTATION.map((row,i)=>`<tr><td>Integrante ${i+1}</td>${row.map(c=>`<td class="c">${ROLES.find(r=>r.id===c).icon} ${c}</td>`).join('')}</tr>`).join('')}</table>
   <p class="small muted">C: Coordinación · A: Análisis de datos · IA: Especialista en IA · Co: Comunicación. Cada persona ejerce cada rol al menos una vez.</p>`;
}
function pactHTML(){
  const rv = S.answers['m0:pact'] = S.answers['m0:pact'] || {v:{}};
  return `<div class="kicker">Uso ético y crítico de la IA</div><h2>El Pacto del Instituto</h2><p class="muted">Hagan clic en cada compromiso para revelarlo y discútanlo: ¿qué significa en la práctica?</p>
   <div class="cards">${PACT.map((p,i)=>`<div class="card ${rv.v[i]?'accent':''}" data-act="pact-rev" data-i="${i}" style="cursor:pointer;min-height:8em"><h3>${p.i} ${p.k}</h3>${rv.v[i]?`<p>${p.t}</p>`:'<p class="muted">🔒 Clic para revelar</p>'}</div>`).join('')}</div>
   ${noteBox('m0:pact','En la práctica, nosotros…')}
   <div class="card" style="margin-top:1em"><h3>✍️ Firma del Pacto (+5 XP)</h3>${S.teams.length ? `<div class="row">${S.teams.map(t=>{const on=(xpRec(t.id,'m0').check||{}).pacto;return `<button class="vbtn ${on?'sel':''}" data-act="m0-check" data-t="${t.id}" data-c="pacto">${esc(t.emoji)} ${esc(t.name)} ${on?'✍️':''}</button>`;}).join('')}</div>` : '<p class="muted small">Registren primero los Laboratorios.</p>'}</div>
   ${timerBtns([['Pacto del Instituto',10]])}`;
}
function mitoDemoHTML(m){
  const st = S.answers['m0:mitodemo'] = S.answers['m0:mitodemo'] || {v:{n:1}};
  const shown = m.mitoDemo.slice(0, st.v.n);
  return `<div class="kicker">Primer contacto</div><h2>Conoce a la Dra. Mito</h2>
   <p class="muted">La Dra. Mito pregunta antes de explicar y da pistas en tres niveles, sin entregar la respuesta final. Ejemplo de conversación:</p>
   <div class="card">${shown.map(x => x.who==='mito' ? `<div class="dialog" style="margin:.4em 0">${mitoSVG(70)}<div class="bubble" style="font-size:.95em"><div class="who">DRA. MITO</div>${esc(x.t)}</div></div>` : `<div style="text-align:right;margin:.6em 0"><span class="pill teal" style="font-size:.9em;padding:.5em 1em">🧑‍🎓 ${esc(x.t)}</span></div>`).join('')}
   ${st.v.n < m.mitoDemo.length ? `<button class="btn sm" data-act="mito-next">Continuar conversación ▶</button>` : '<p class="small lime">✔ Fin del ejemplo.</p>'}</div>
   <div class="card" style="margin-top:1em"><h3>Registro de la primera conversación</h3><p class="small">El/la especialista en IA hace una pregunta sobre cualquier biomolécula y el equipo verifica la respuesta en el texto guía.</p>
   ${noteBox('m0:mito','Pregunta que hicimos · qué nos preguntó antes de explicar · qué verificamos y dónde')}</div>
   ${timerBtns([['Primer contacto con la Dra. Mito',15]])}`;
}
function checklistHTML(m){
  if (!S.teams.length) return `<h2>Checklist de salida</h2><p class="muted">Registren primero los Laboratorios.</p>`;
  return `<div class="kicker">Checklist de salida · 20 XP</div><h2>¿Listos para la primera misión?</h2>
   <table class="t"><tr><th>Laboratorio</th>${m.checklist.map(c=>`<th class="c">${esc(c.t)}<br><span class="tiny">+${c.xp} XP</span></th>`).join('')}<th class="c">XP</th></tr>
   ${S.teams.map(t=>{const r=xpRec(t.id,'m0');return `<tr><td><b>${esc(t.emoji)} ${esc(t.name)}</b></td>${m.checklist.map(c=>`<td class="c"><input type="checkbox" ${r.check&&r.check[c.id]?'checked':''} data-m0="${t.id}" data-c="${c.id}" style="width:1.5em;height:1.5em"></td>`).join('')}<td class="c"><b>${missionXP(t.id,'m0')}</b></td></tr>`;}).join('')}</table>`;
}

/* ---------- Campamento ---------- */
function escapeHTML(m){
  const E = S.escape;
  return `<div class="kicker">Escape room</div><h2>Los cuatro candados</h2>
   <p>Resuelvan cada sala y anoten el número. La combinación de los cuatro números, en orden, es la contraseña para salir. Muestren el desarrollo: el equipo docente puede pedirles que expliquen cualquier candado.</p>
   <div class="locks">${m.locks.map((L, i) => { const open = E.locks[i] !== null && E.locks[i] !== undefined;
     return `<div class="lockcard ${open?'open':''}"><div class="li">${open?'🔓':'🔒'}</div><h4>${L.icon} ${esc(L.room)}</h4><p>${esc(L.q)}</p>
      ${open ? `<div class="feedback">✔ ${L.a} · ${esc(L.explain)}</div>` : `<div class="row"><input id="lock${i}" inputmode="decimal" style="width:6em;text-align:center" aria-label="Número del candado ${i+1}"><button class="btn sm lime" data-act="lock" data-i="${i}">Abrir</button></div>
      <button class="btn orange sm" data-act="camp-hint" data-i="${i}">💡 Pista · 5 ATP</button>`}</div>`; }).join('')}</div>
   <div class="card" style="margin-top:1em;text-align:center"><h3>🚪 Puerta de salida</h3>
    <div class="dials">${m.locks.map((L,i)=>`<div class="dial">${E.locks[i]!=null?E.locks[i]:'?'}</div>`).join('')}</div>
    ${E.done ? `<div class="dialog" style="text-align:left">${entropiaSVG(110)}<div class="bubble entropia"><div class="who">NOTA ENCONTRADA AL SALIR</div>${esc(m.note)}</div></div><p class="feedback">✔ ¡Lo lograron! Cada Laboratorio recibió 10 ATP y la Misión 5 quedó desbloqueada.</p>`
      : `<div class="pwd"><input id="combo" placeholder="Combinación" inputmode="numeric" aria-label="Combinación"><button class="btn lime" data-act="combo">Abrir la puerta</button></div>`}
   </div>${timerBtns([['Escape room',45]])}`;
}
function marketHTML(){
  if (!S.teams.length) return `<h2>Mercado de ATP</h2><p class="muted">Registren primero los Laboratorios.</p>`;
  return `<div class="kicker">Mercado del Campamento</div><h2>🪙 Mercado de ATP</h2><p>El mercado está abierto: canjeen sus ATP por pistas para reparar misiones o por un comodín de plazo. Gastar ATP nunca resta XP.</p>
   <table class="t"><tr><th>Laboratorio</th><th class="c">Saldo</th><th class="c">Pista (5)</th><th class="c">Segunda mirada (10)</th><th class="c">Comodín de plazo 24 h (15)</th></tr>
   ${S.teams.map(t=>`<tr><td><b>${esc(t.emoji)} ${esc(t.name)}</b></td><td class="c"><b style="color:var(--orange)">${t.atp}</b></td>
     <td class="c"><button class="btn orange sm" data-act="buy" data-t="${t.id}" data-c="5" data-w="Pista (mercado)">−5</button></td>
     <td class="c"><button class="btn orange sm" data-act="buy" data-t="${t.id}" data-c="10" data-w="Segunda mirada">−10</button></td>
     <td class="c"><button class="btn orange sm" data-act="buy" data-t="${t.id}" data-c="15" data-w="Comodín de plazo 24 h">−15</button></td></tr>`).join('')}</table>
   ${timerBtns([['Mercado de ATP',10]])}`;
}
function repairHTML(){
  const ms = ['m1','m2','m3','m4'];
  return `<div class="kicker">Reparación de misiones</div><h2>🛠️ ¿Qué insignia les falta?</h2><p>Revisen su Informe del Instituto y el tablero. Para cada misión, identifiquen la brecha principal y elijan un recurso, pista o expedición para reforzar.</p>
   ${S.teams.length ? `<table class="t"><tr><th>Laboratorio</th>${ms.map(id=>`<th class="c">${MBY[id].code} ${BBY[MBY[id].badge].icon}</th>`).join('')}</tr>
   ${S.teams.map(t=>`<tr><td><b>${esc(t.emoji)} ${esc(t.name)}</b></td>${ms.map(id=>{const b=MBY[id].badge;return `<td class="c">${hasBadge(t.id,b)?'<span class="pill lime">✔ Obtenida</span>':'<span class="pill orange">Por reparar</span>'}</td>`;}).join('')}</tr>`).join('')}</table>` : '<p class="muted">Sin Laboratorios registrados.</p>'}
   ${noteBox('camp:repair','Brechas principales y plan de refuerzo')}${timerBtns([['Reparación de misiones',30]])}`;
}

/* ---------- Misión final ---------- */
function elenaHTML(m){
  const st = S.answers['reactor:elena'] = S.answers['reactor:elena'] || {v:{i:0}};
  const e = m.elena[st.v.i], col = {fed:'var(--teal)', post:'var(--aqua)', ex:'var(--orange)', fast:'var(--violet)'};
  return `<div class="kicker">Expediente</div><h2>Un día en la vida de Elena</h2>
   <p>Elena tiene 21 años, estudia y vive en Metabolia. Es sana, pesa 60 kg y no usa medicamentos. Toquen cada momento del día.</p>
   <div class="timeline">${m.elena.map((x,i)=>`<div class="tl ${i===st.v.i?'sel':''}" data-act="elena" data-i="${i}" style="border-bottom:6px solid ${col[x.s]}"><div class="i">${x.i}</div><div class="h">${x.h}</div><div class="small">${x.m}</div></div>`).join('')}</div>
   <div class="card accent"><h3>${e.i} ${e.h} · ${e.m}</h3><p style="font-size:1.2em">${esc(e.d)}</p>
    <p class="small muted">¿Qué órganos trabajan más en este momento? ¿Qué hormona da las órdenes? ¿Qué rutas están encendidas?</p></div>
   <p class="small muted" style="margin-top:.8em">Colores: <span style="color:var(--teal)">■</span> alimentado · <span style="color:var(--aqua)">■</span> posabsortivo · <span style="color:var(--orange)">■</span> ejercicio · <span style="color:var(--violet)">■</span> ayuno</p>`;
}
const RKEYS = m => [...m.organs, 'Hormona predominante'];
function reactorGridHTML(m){
  const C = S.reactor.cells, chk = S.reactor.checked;
  return `<div class="kicker">Parte A · El cuadro del reactor</div><h2>⚛️ ¿Qué rutas están activas?</h2>
   <p class="small muted">Toquen una celda para elegir las rutas principales activas en cada órgano y estado. En la última fila, la hormona que predomina.</p>
   <table class="t"><tr><th>Órgano</th>${m.states.map(s=>`<th>${esc(s)}</th>`).join('')}</tr>
   ${RKEYS(m).map(o=>`<tr><td><b>${esc(o)}</b></td>${m.states.map((s,si)=>{const k=o+'|'+si, sel=C[k]||[], ref=m.ref[o][si];
     let chips='';
     if (chk){ sel.forEach(x=>chips+=`<span class="chip ${ref.core.includes(x)||ref.ok.includes(x)?'ok':'extra'}">${esc(x)}</span>`); ref.core.filter(x=>!sel.includes(x)).forEach(x=>chips+=`<span class="chip miss">+ ${esc(x)}</span>`); }
     else chips = sel.map(x=>`<span class="chip">${esc(x)}</span>`).join('') || '<span class="tiny muted">＋ tocar para completar</span>';
     return `<td class="reactor-cell" data-act="rcell" data-k="${esc(k)}">${chips}</td>`;}).join('')}</tr>`).join('')}</table>
   <div class="row" style="margin-top:.8em"><button class="btn lime" data-act="rcheck">${chk?'Ocultar comparación':'⚖️ Comparar con la referencia'}</button><button class="btn ghost sm" data-act="rreset">↺ Reiniciar cuadro</button></div>
   ${chk ? `<div class="feedback"><span class="chip ok">verde</span> coincide con la referencia · <span class="chip miss">+ naranjo</span> ruta principal que faltó · <span class="chip extra">amarillo</span> discutible: pidan que lo justifiquen.<br><br>${esc(m.refNotes)}</div>` : ''}`;
}
function finalQuestionsHTML(m){
  return `<div class="kicker">Parte B · Las conexiones</div><h2>🔗 Preguntas de integración</h2>
   ${m.questions.map(q=>`<div class="q"><div class="q-head"><div class="q-num">${q.n}</div><div class="q-text">${esc(q.text)}<div><span class="tag-open">● Respuesta abierta · producto del equipo</span></div></div></div>${noteBox('reactor:q'+q.n)}</div>`).join('')}`;
}
function productHTML(m){
  return `<div class="kicker">El producto</div><h2>🎨 Mapa metabólico integrado</h2>
   <div class="cards"><div class="card accent"><h3>Instrucciones</h3><ul>${m.productSteps.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>
   <div class="card"><h3>📐 Plantilla</h3><p>Cuadrícula de 4 órganos (hígado, músculo, tejido adiposo, cerebro) × 3 estados (alimentado, ayuno nocturno, ejercicio). En el centro, el «Reactor ATP».</p><p class="small muted">La pauta pondera la precisión bioquímica por sobre la estética.</p></div></div>
   <h3 style="margin-top:1em">📓 Reflexión individual (25 XP)</h3><ul>${m.reflection.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
}
function reactivationHTML(m){
  const on = S.reactor.on;
  return `<div class="kicker">Reactivación</div><h2>${on ? '🔆 ¡El reactor está encendido!' : 'Cuando todos los Laboratorios entreguen, el reactor vuelve a encenderse'}</h2>
   <div style="display:grid;place-items:center;margin:1em 0">
    <svg viewBox="0 0 300 300" style="width:min(48vh,380px)"><defs><radialGradient id="rg2"><stop offset="0" stop-color="${on?'#fde68a':'#334155'}"/><stop offset="1" stop-color="${on?'#ef5a35':'#0f172a'}" stop-opacity="${on?.2:1}"/></radialGradient></defs>
     <circle cx="150" cy="150" r="140" fill="url(#rg2)"/>
     <circle cx="150" cy="150" r="110" fill="none" stroke="${on?'#f59e0b':'#475569'}" stroke-width="6" stroke-dasharray="40 20" class="${on?'reactor-spin':''}"/>
     <circle cx="150" cy="150" r="80" fill="none" stroke="${on?'#a3e635':'#475569'}" stroke-width="6" stroke-dasharray="30 16" class="${on?'reactor-spin r2':''}"/>
     <text x="150" y="172" text-anchor="middle" font-size="70">⚛️</text></svg></div>
   ${on ? dialogHTML(m.closing) : `<div class="row" style="justify-content:center"><button class="btn red big" data-act="reactor-on">⚡ Todos los Laboratorios entregaron: ¡encender el reactor!</button></div>`}
   ${on ? `<div class="row" style="justify-content:center;margin-top:1em"><button class="btn" data-act="go" data-view="map">🗺️ Ver Metabolia iluminada</button><button class="btn ghost" data-act="go" data-view="board">🏆 Tablero final</button><button class="btn ghost sm" data-act="reactor-off">Deshacer</button></div>` : ''}`;
}

/* ---------- Rescate ---------- */
function pendingHTML(m){
  const ds = m.challenges;
  return `<div class="kicker">Ruta de refuerzo</div><h2>📊 Distritos pendientes por Laboratorio</h2>
   ${S.teams.length ? `<table class="t"><tr><th>Laboratorio</th>${ds.map(c=>`<th class="c">${MBY[c.m].code} ${BBY[c.badge].icon}</th>`).join('')}</tr>
   ${S.teams.map(t=>`<tr><td><b>${esc(t.emoji)} ${esc(t.name)}</b></td>${ds.map(c=>`<td class="c">${hasBadge(t.id,c.badge)?'<span class="pill lime">✔</span>':'<span class="pill violet">Pendiente</span>'}</td>`).join('')}</tr>`).join('')}</table>` : '<p class="muted">Sin Laboratorios registrados.</p>'}
   <p class="small muted">Cada reto superado con nivel «Competente» o superior desbloquea la insignia pendiente (se otorga en la pantalla de cada reto).</p>`;
}
function rescueChallengeHTML(m, i){
  const c = m.challenges[i], d = MBY[c.m], b = BBY[c.badge];
  return `<div class="kicker">Rescate ${d.code} · ${esc(d.name)}</div><h2>${d.icon} Caso de rescate</h2>
   <div class="case-card" style="--mc:${d.color}"><p style="font-size:1.15em">${esc(c.caso)}</p></div>
   ${c.qs.map((q,k)=>`<div class="q"><div class="q-head"><div class="q-num">${k+1}</div><div class="q-text">${esc(q)}</div></div>${k===0 && c.widget ? widgetHTML('rescate:r'+i, c.widget) : ''}${noteBox('rescate:r'+i+':'+k)}</div>`).join('')}
   <div class="card"><h3>${b.icon} Desbloquear insignia ${b.name}</h3><p class="small">Marquen los Laboratorios que superaron este reto con nivel «Competente» o superior:</p>${teamsToggleHTML(b.id)}</div>`;
}

/* ===========================================================
   MODALES
   =========================================================== */
function modal(html, cls = ''){
  closeModal();
  const b = document.createElement('div'); b.className = 'modal-back'; b.id = 'modal';
  b.innerHTML = `<div class="modal ${cls}" role="dialog" aria-modal="true"><button class="x" data-act="close" aria-label="Cerrar">✕</button>${html}</div>`;
  b.addEventListener('mousedown', e => { if (e.target === b) closeModal(); });
  document.body.appendChild(b); startTypewriters();
}
function closeModal(){ const m = $('#modal'); if (m) m.remove(); }

function teamSelect(id = 'tsel', withNone = true){
  return `<select id="${id}">${withNone ? '<option value="">Demostración (sin cobro)</option>' : ''}${S.teams.map(t=>`<option value="${t.id}">${esc(t.emoji)} ${esc(t.name)} · ${t.atp} ATP</option>`).join('')}</select>`;
}

function hintsModal(mid, hk){
  const m = MBY[mid], H = findHintQ(m, hk), key = mid + '|' + hk, lvl = S.hints[key] || 0;
  const names = ['Nivel 1 · Pregunta orientadora','Nivel 2 · Concepto clave o analogía','Nivel 3 · Esquema del razonamiento'];
  modal(`<div class="dialog">${mitoSVG(90)}<div><div class="kicker">Pistas de la Dra. Mito · ${esc(m.code)}</div><h2 style="margin:.1em 0">${esc(hk)}</h2>
    <p class="small muted">Pacto del Instituto: razonar primero. Pidan el nivel siguiente solo después de intentar con el anterior. Cada pista cuesta 5 ATP. Ninguna contiene la respuesta final.</p></div></div>
    ${H.hints.map((h, i) => `<div class="hint-level ${i < lvl ? 'rev' : ''}"><div class="lv">${names[i]}</div>${i < lvl ? `<p style="font-size:1.1em;margin:.3em 0">${esc(h)}</p>` : (i === lvl ? `<div class="row" style="margin-top:.4em"><span class="small">Laboratorio que canjea:</span>${teamSelect()}<button class="btn orange sm" data-act="hint-rev" data-mid="${mid}" data-hk="${esc(hk)}">🔓 Revelar · 5 ATP</button></div>` : '<p class="muted small">🔒 Disponible después del nivel anterior</p>')}</div>`).join('')}
    ${lvl ? `<div class="row"><button class="btn ghost sm" data-act="hint-hide" data-mid="${mid}" data-hk="${esc(hk)}">Ocultar pistas reveladas (para otra sección)</button></div>` : ''}`);
}
function mitoModal(){
  const avail = MISSIONS.filter(m => S.unlocked[m.id] && (m.parts || m.locks));
  modal(`<div class="dialog">${mitoSVG(110)}<div class="bubble"><div class="who">DRA. MITO</div>Reclutas, ¿en qué parte del caso están trabajando? Antes de pedir una pista, cuéntenme qué intentaron. Recuerden: les daré preguntas y esquemas, nunca la respuesta final.</div></div>
   ${avail.length ? avail.map(m => `<div class="card" style="margin:.6em 0;--mc:${m.color}"><h3>${m.icon} ${m.code} · ${esc(m.name)}</h3><div class="row">
     ${m.locks ? m.locks.map((L,i)=>`<button class="btn orange sm" data-act="camp-hint" data-i="${i}">💡 ${esc(L.room)}</button>`).join('') : allHintQs(m).map(h=>`<button class="btn orange sm" data-act="hints" data-mid="${m.id}" data-hk="${esc(h.key)}">💡 ${esc(h.key)}</button>`).join('')}</div></div>`).join('') : '<p class="muted">Aún no hay misiones con pistas desbloqueadas.</p>'}
   <p class="small muted">Para conversar con la Dra. Mito fuera de clase, usen el asistente de IA institucional configurado por el equipo docente (Pacto del Instituto: declarar y verificar).</p>`);
}
function rulesModal(){
  modal(`<h2>📜 Reglas del Instituto</h2>
   <div class="tabs"><span class="pill teal">XP</span><span class="pill orange">ATP</span><span class="pill lime">Niveles</span><span class="pill violet">Insignias</span></div>
   <div class="cards">
    <div class="card"><h3>⭐ Puntos de experiencia (XP)</h3><p class="small">Muestran el avance. <b>Nunca disminuyen</b>: equivocarse no resta puntos. Cada misión temática entrega hasta 120 XP; el reclutamiento, 20 XP; la misión final, 150 XP. Máximo del semestre: 890 XP.</p>
     <table class="t"><tr><th>Componente</th><th class="c">XP</th></tr><tr><td>Preparación (calentamiento y bitácora)</td><td class="c">20</td></tr><tr><td>Misión de equipo (desde el taller evaluado)</td><td class="c">50</td></tr><tr><td>Reto individual de cierre</td><td class="c">30</td></tr><tr><td>Retos y logros</td><td class="c">20</td></tr></table></div>
    <div class="card"><h3>🪙 Moneda ATP</h3><p class="small">Se gana con calentamientos, bitácoras a tiempo y expediciones. Gastar ATP <b>nunca resta XP</b>.</p>
     <table class="t"><tr><th>Ayuda</th><th class="c">Costo</th></tr><tr><td>Pista (nivel 1, 2 o 3)</td><td class="c">5</td></tr><tr><td>Segunda mirada a una respuesta</td><td class="c">10</td></tr><tr><td>Comodín de plazo 24 h (no aplica al taller presencial)</td><td class="c">15</td></tr></table></div>
    <div class="card"><h3>📈 Niveles</h3><table class="t">${LEVELS.map((l,i)=>`<tr><td><b>${l.name}</b><br><span class="tiny muted">${l.unlock}</span></td><td class="c">${l.min}${LEVELS[i+1]?'–'+(LEVELS[i+1].min-1):'+'}</td></tr>`).join('')}</table><p class="tiny muted">Los niveles no dan ventajas en la nota: reconocen el progreso.</p></div>
   </div>
   <h3 style="margin-top:1em">🏅 Insignias</h3><div class="cards">${BADGES.map(b=>`<div class="card" style="display:flex;gap:.7em;align-items:center"><div class="badge on" style="--bc:${b.color};flex:0 0 auto">${b.icon}</div><div><b>${b.name}</b> <span class="tiny muted">${b.type}</span><div class="small">${b.crit}</div></div></div>`).join('')}</div>
   <h3 style="margin-top:1em">🤝 Pacto del Instituto</h3><ul>${PACT.map(p=>`<li><b>${p.k}:</b> ${p.t}</li>`).join('')}</ul>
   <p class="small muted">Sin castigos · competencia solo entre equipos · alternativa impresa para toda actividad · casos ficticios, sin datos personales.</p>`);
}
function rubricModal(tid, mid){
  const m = MBY[mid], final = m.type === 'final', RUB = final ? FINAL_RUBRIC : TEAM_RUBRIC, r = xpRec(tid, mid), t = teamById(tid);
  const sel = r.rubric || [];
  modal(`<div class="kicker">${esc(m.code)} · ${esc(m.name)}</div><h2>${esc(t.emoji)} ${esc(t.name)} · Pauta ${final?'del producto (90 XP)':'de la misión de equipo (50 XP)'}</h2>
   <table class="t"><tr><th>Criterio</th>${RUBRIC_LEVELS.map(l=>`<th class="c">${l.name}<br><span class="tiny">${l.f*100} %</span></th>`).join('')}</tr>
   ${RUB.map((c,ci)=>`<tr><td><b>${esc(c.name)}</b><br><span class="tiny muted">${c.pts} XP</span></td>${RUBRIC_LEVELS.map((l,li)=>`<td><button class="choice ${sel[ci]===li?'sel':''}" style="width:100%;font-size:.75em;font-weight:600" data-act="rub-set" data-t="${tid}" data-mid="${mid}" data-c="${ci}" data-l="${li}">${esc(c.d[li])}</button></td>`).join('')}</tr>`).join('')}</table>
   <div class="row" style="margin-top:.8em"><b style="font-size:1.3em">Total: ${fmt(+r.team||0)} / ${final?90:50} XP</b><span class="spacer"></span>
   <span class="small muted">o ingresar XP directo (desde la nota del taller):</span><input type="number" id="rubdirect" style="width:6em" min="0" max="${final?90:50}" value="${+r.team||0}"><button class="btn sm" data-act="rub-direct" data-t="${tid}" data-mid="${mid}">Usar</button></div>`);
}
function reportModal(tid, mid){
  const t = teamById(tid), m = MBY[mid]; S.reports[tid] = S.reports[tid] || {}; const R = S.reports[tid][mid] || {};
  modal(`<div class="kicker">Informe del Instituto · ${esc(m.code)} ${esc(m.name)}</div><h2>${esc(t.emoji)} ${esc(t.name)}</h2>
   <p class="small muted">XP de la misión: ${fmt(missionXP(tid, mid))} · ATP actuales: ${t.atp}</p>
   ${[['logro','🏆 Un logro','Qué hizo especialmente bien el equipo (con un ejemplo concreto del producto).'],['brecha','🧩 Una brecha','Concepto o habilidad que aún necesita reforzarse, con el error más frecuente observado.'],['paso','👣 Un siguiente paso','Acción concreta para la próxima misión (recurso, pista o expedición recomendada).']].map(([k,l,p])=>`<div class="notes"><label>${l}</label><textarea data-report="${tid}|${mid}|${k}" placeholder="${p}">${esc(R[k]||'')}</textarea></div>`).join('')}
   <div class="row" style="margin-top:.8em"><button class="btn" data-act="close">💾 Listo (guardado)</button><button class="btn ghost" data-act="export-team" data-t="${tid}">⬇ Descargar informe completo del Laboratorio</button></div>`, 'narrow');
}
function awardModal(preset = {}){
  if (!S.teams.length){ toast('Registren primero los Laboratorios', 'bad'); return; }
  const ms = MISSIONS.filter(m => MAXES[m.type === 'final' ? 'final' : m.type] && m.type !== 'recruit');
  modal(`<h2>🎖 Otorgar XP / ATP</h2><p class="small muted">${esc(preset.why || 'Seleccionen los Laboratorios y la recompensa.')}</p>
   <div class="row">${S.teams.map(t=>`<label class="vbtn" style="display:inline-flex;gap:.4em;align-items:center"><input type="checkbox" class="aw-t" value="${t.id}"> ${esc(t.emoji)} ${esc(t.name)}</label>`).join('')}</div>
   <div class="wfield" style="margin-top:.8em"><label>Misión</label><select id="aw-m">${ms.map(m=>`<option value="${m.id}" ${preset.mid===m.id?'selected':''}>${m.code} · ${esc(m.name)}</option>`).join('')}</select></div>
   <div class="wfield"><label>XP en «Retos y logros»</label><input type="number" id="aw-xp" value="${preset.xp ?? 0}" min="0"></div>
   <div class="wfield"><label>ATP</label><input type="number" id="aw-atp" value="${preset.atp ?? 0}"></div>
   <div class="wfield"><label>Motivo</label><input id="aw-why" value="${esc(preset.why || '')}" style="width:20em;text-align:left"></div>
   <div class="row" style="margin-top:.6em"><span class="small muted">Atajos ATP:</span>${[['Calentamiento',5],['Bitácora a tiempo',5],['Expedición',5],['Caza de mitos',10]].map(([l,a])=>`<button class="btn ghost sm" data-act="aw-preset" data-l="${l}" data-a="${a}">${l} +${a}</button>`).join('')}</div>
   <div class="row" style="margin-top:1em"><button class="btn lime" data-act="aw-go">✔ Otorgar</button></div>`, 'narrow');
}
function teamDetailModal(tid){
  const t = teamById(tid), xp = totalXP(tid), L = levelOf(xp);
  modal(`<div class="team-head">${shieldHTML(t, true)}<div><div class="team-name" style="font-size:1.8em">${esc(t.name)}</div><div class="team-motto">${esc(t.motto||'')}</div><div class="small muted">${esc(t.concept||'')}</div>
    <div class="row" style="margin-top:.4em"><span class="level">${L.name}</span><b>${fmt(xp)} XP</b><span class="pill orange">🪙 ${t.atp} ATP</span></div></div></div>
   <h3 style="margin-top:1em">⭐ XP por misión</h3>
   <table class="t"><tr><th>Misión</th><th class="c">Prep.</th><th class="c">Equipo</th><th class="c">Individual</th><th class="c">Retos</th><th class="c">Total</th></tr>
   ${MISSIONS.filter(m=>m.type!=='camp'&&m.type!=='rescue').map(m=>{const r=(S.xp[tid]||{})[m.id]||{};return m.type==='recruit'?`<tr><td>${m.code} · ${esc(m.name)}</td><td class="c" colspan="4">Checklist de ingreso</td><td class="c"><b>${missionXP(tid,m.id)}</b>/20</td></tr>`:`<tr><td>${m.code} · ${esc(m.name)}</td><td class="c">${+r.prep||0}</td><td class="c">${fmt(+r.team||0)}</td><td class="c">${+r.indiv||0}</td><td class="c">${+r.retos||0}</td><td class="c"><b>${fmt(missionXP(tid,m.id))}</b>/${m.type==='final'?150:120}</td></tr>`;}).join('')}</table>
   <h3 style="margin-top:1em">🏅 Insignias <span class="small muted">(clic para otorgar o retirar)</span></h3>
   <div class="badges">${BADGES.map(b=>`<button class="badge badge-big ${hasBadge(tid,b.id)?'on':'off'}" style="--bc:${b.color}" data-act="badge-toggle" data-t="${tid}" data-b="${b.id}" title="${esc(b.name+': '+b.crit)}">${b.icon}</button>`).join('')}</div>
   <h3 style="margin-top:1em">🪙 Movimientos recientes</h3>
   <div style="max-height:12em;overflow:auto">${S.log.filter(e=>e.tid===tid).slice(0,40).map(e=>`<div class="small">${new Date(e.t).toLocaleDateString('es-CL')} · ${esc(e.msg)} ${e.atp?`<b style="color:${e.atp>0?'var(--lime)':'var(--orange)'}">${e.atp>0?'+':''}${e.atp} ATP</b>`:''}</div>`).join('') || '<p class="muted small">Sin movimientos.</p>'}</div>
   <div class="row" style="margin-top:1em"><button class="btn sm" data-act="atp-adj" data-t="${tid}" data-d="5">+5 ATP</button><button class="btn ghost sm" data-act="atp-adj" data-t="${tid}" data-d="-5">−5 ATP</button><button class="btn ghost sm" data-act="team-edit" data-t="${tid}">✏️ Editar Laboratorio</button><button class="btn ghost sm" data-act="export-team" data-t="${tid}">⬇ Informe del Instituto</button></div>`);
}
function panelModal(tab = 'labs'){
  const tabs = [['labs','🧪 Laboratorios'],['award','🎖 Otorgar'],['missions','🗺️ Misiones'],['data','💾 Datos']];
  let body = '';
  if (tab === 'labs') body = `<div class="cards"><div class="card accent"><h3>➕ Nuevo Laboratorio</h3>${teamFormHTML()}</div><div class="card"><h3>Registrados (${S.teams.length})</h3>${S.teams.map(t=>`<div class="row" style="margin:.3em 0">${shieldHTML(t)}<b style="flex:1">${esc(t.name)}</b><span class="pill orange">${t.atp} ATP</span><button class="btn ghost sm" data-act="team-edit" data-t="${t.id}">✏️</button></div>`).join('') || '<p class="muted">Ninguno.</p>'}</div></div>`;
  if (tab === 'award') body = `<p>Otorgue XP de «Retos y logros» y ATP a uno o varios Laboratorios (expediciones, tutorías, bitácoras, calentamientos).</p><button class="btn lime" data-act="award-open">🎖 Abrir formulario de recompensas</button>
    <h3 style="margin-top:1em">Insignias manuales</h3><p class="small muted">Explicador y Equipo Sinergia (además de cualquier otra) se otorgan desde aquí:</p>${['explicador','sinergia','cazaerrores'].map(b=>`<div class="card" style="margin:.5em 0"><h4>${BBY[b].icon} ${BBY[b].name}</h4>${teamsToggleHTML(b)}</div>`).join('')}`;
  if (tab === 'missions') body = `<div class="card accent" style="margin-bottom:1em"><h3>👁 Modo revisión</h3><p class="small">Desbloquea todas las misiones para revisarlas sin jugarlas (no las marca como restauradas ni cambia XP, ATP o insignias).</p>
    <div class="row">${S.reviewBackup ? `<span class="pill lime">✔ Modo revisión activo</span><button class="btn ghost sm" data-act="review-off">↩ Volver a bloquear como estaban</button>` : `<button class="btn lime sm" data-act="review-on">🔓 Desbloquear todas las misiones</button>`}<button class="btn ghost sm" data-act="lock-all">🔒 Bloquear todas (dejar solo M0)</button></div></div>
    <p class="small muted">Normalmente las misiones se abren con la contraseña del acertijo. Aquí pueden abrirlas, cerrarlas o restaurarlas manualmente.</p>
    <table class="t"><tr><th>Misión</th><th class="c">Desbloqueada</th><th class="c">Restaurada</th><th>Contraseña</th></tr>${MISSIONS.map(m=>`<tr><td>${m.icon} ${m.code} · ${esc(m.name)}</td><td class="c"><input type="checkbox" ${S.unlocked[m.id]?'checked':''} data-unl="${m.id}" style="width:1.4em;height:1.4em"></td><td class="c"><input type="checkbox" ${S.restored[m.id]?'checked':''} data-rest="${m.id}" style="width:1.4em;height:1.4em"></td><td class="small muted">${esc(pwdFor(m.id) || '—')}</td></tr>`).join('')}</table>`;
  if (tab === 'data') body = `<div class="cards"><div class="card"><h3>⬇ Exportar respaldo</h3><p class="small">Descarga un archivo .json con todo el progreso (Laboratorios, XP, ATP, insignias, notas). Úselo como respaldo o para continuar en otro computador.</p><button class="btn" data-act="export">⬇ Descargar respaldo</button></div>
    <div class="card"><h3>⬆ Importar respaldo</h3><p class="small">Reemplaza el progreso actual por el del archivo.</p><input type="file" id="imp" accept=".json,application/json"><button class="btn ghost sm" data-act="import" style="margin-top:.5em">⬆ Importar</button></div>
    <div class="card"><h3>📄 Informes</h3><p class="small">Informe del Instituto de todos los Laboratorios (HTML imprimible).</p><button class="btn ghost" data-act="export-all">⬇ Informe general</button></div>
    <div class="card"><h3>🧹 Reiniciar</h3><p class="small">Borra todo el progreso de este navegador (útil para una nueva cohorte). Descargue antes un respaldo.</p><button class="btn red" data-act="reset">Reiniciar todo</button></div></div>`;
  modal(`<h2>⚙️ Panel del Instituto <span class="small muted">· uso docente</span></h2>
   <div class="tabs">${tabs.map(([k,l])=>`<button class="tbtn ${k===tab?'active':''}" data-act="panel" data-tab="${k}">${l}</button>`).join('')}</div>${body}`);
}
function pwdFor(mid){
  if (mid === 'm5') return MBY.camp.combo;
  const src = MISSIONS.find(m => m.riddle && m.riddle.opens === mid && m.riddle.a);
  return src ? src.riddle.a : null;
}

/* ---------------- TABLERO ---------------- */
function boardView(){
  const T = S.teams.map(t => ({t, xp:totalXP(t.id)})).sort((a, b) => b.xp - a.xp);
  return `<div class="board"><div class="row"><div><div class="kicker">Instituto Nutri-Metabólico</div><h2>🏆 Tablero de Laboratorios</h2></div><span class="spacer"></span>
    <button class="btn sm" data-act="award-open">🎖 Otorgar XP / ATP</button><button class="btn ghost sm" data-act="panel" data-tab="labs">➕ Laboratorio</button></div>
   <p class="small muted">El tablero compara equipos con nombre de fantasía, nunca personas. Toquen un Laboratorio para ver su detalle.</p>
   ${T.length ? `<div class="teams">${T.map(({t, xp}, i) => { const L = levelOf(xp), nx = L.next, pct = nx ? (xp - L.min) / (nx.min - L.min) * 100 : 100;
     return `<div class="team" data-act="team" data-t="${t.id}"><div class="rank">#${i+1}</div><div class="team-head">${shieldHTML(t)}<div><div class="team-name">${esc(t.name)}</div><div class="team-motto">${esc(t.motto||'')}</div><span class="level">${L.name}</span></div></div>
      <div class="xpbar"><i style="width:${pct}%"></i></div><div class="stats"><span><b>${fmt(xp)}</b> XP</span><span class="muted small">${nx ? `${fmt(nx.min - xp)} XP para ${nx.name}` : 'Nivel máximo'}</span><span class="spacer"></span><span style="color:var(--orange)">🪙 <b>${t.atp}</b> ATP</span></div>
      <div class="badges">${BADGES.map(b=>`<div class="badge ${hasBadge(t.id,b.id)?'on':'off'}" style="--bc:${b.color}" title="${esc(b.name)}">${b.icon}</div>`).join('')}</div></div>`; }).join('')}</div>`
   : `<div class="card" style="text-align:center"><p>Aún no hay Laboratorios. Regístrenlos en la Misión 0 · Reclutamiento o desde el Panel del Instituto.</p><button class="btn" data-act="open-m" data-id="m0">🎖️ Ir a la Misión 0</button></div>`}
   <h3 style="margin-top:1.4em">Niveles del Instituto</h3><div class="cards">${LEVELS.map((l,i)=>`<div class="card"><span class="level">${l.name}</span> <b>${l.min}${LEVELS[i+1]?'–'+(LEVELS[i+1].min-1):'+'} XP</b><p class="small muted">${l.unlock}</p></div>`).join('')}</div></div>`;
}

/* ===========================================================
   CRONÓMETRO
   =========================================================== */
const TM = {total:600, left:600, running:false, label:'Cronómetro', last:0, collapsed:true, done:false};
function renderTimer(){
  let el = $('#timer'); if (!el){ el = document.createElement('div'); el.id = 'timer'; document.body.appendChild(el); }
  const mm = String(Math.floor(Math.max(0,TM.left) / 60)).padStart(2,'0'), ss = String(Math.floor(Math.max(0,TM.left)) % 60).padStart(2,'0');
  el.className = (TM.running ? 'run ' : '') + (TM.done ? 'done ' : (TM.running && TM.left <= 60 ? 'low ' : '')) + (TM.collapsed ? 'collapsed' : '');
  el.innerHTML = `<span title="Cronómetro">⏱</span><div class="clock" data-act="timer-big" title="Ampliar">${mm}:${ss}</div>
   <div class="full lbl">${esc(TM.label)}</div>
   <button data-act="timer-toggle" aria-label="${TM.running?'Pausar':'Iniciar'}">${TM.running?'⏸':'▶'}</button>
   <button class="full" data-act="timer-add" data-s="-60">−1</button><button class="full" data-act="timer-add" data-s="60">+1</button>
   <button class="full" data-act="timer-reset" aria-label="Reiniciar">↺</button>
   <select class="full" data-act-change="timer-preset" style="font-size:.8em;padding:.2em;max-width:9em"><option value="">Preset…</option>${TIMER_PRESETS.map((p,i)=>`<option value="${i}">${p.l} · ${p.m}′</option>`).join('')}</select>
   <button data-act="timer-collapse" aria-label="Contraer">${TM.collapsed?'◂':'▸'}</button>`;
  const big = $('#timerbig'); if (big) big.querySelector('.clock').textContent = `${mm}:${ss}`;
}
function timerStart(label, min){ TM.label = label; TM.total = TM.left = min * 60; TM.running = true; TM.done = false; TM.last = Date.now(); TM.collapsed = false; renderTimer(); toast(`⏱ ${esc(label)}: ${min} min`); }
setInterval(() => {
  if (!TM.running) return;
  const now = Date.now(); TM.left -= (now - TM.last) / 1000; TM.last = now;
  if (TM.left <= 0){ TM.left = 0; TM.running = false; TM.done = true; SND.alarm();
    const b = document.createElement('div'); b.className = 'timesup'; b.textContent = `⏰ Tiempo cumplido: ${TM.label} (pueden continuar)`; b.onclick = () => b.remove(); document.body.appendChild(b); setTimeout(() => b.remove(), 12000); }
  renderTimer();
}, 250);

/* ===========================================================
   EXPORTACIONES
   =========================================================== */
function download(name, content, type = 'text/html'){
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], {type})); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
const docWrap = (title, body) => `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font-family:Arial,sans-serif;max-width:900px;margin:2em auto;color:#1E293B;line-height:1.45}h1{color:#0F766E}h2{color:#0F766E;border-bottom:2px solid #0F766E;padding-bottom:.2em;margin-top:1.6em}table{border-collapse:collapse;width:100%;margin:.6em 0}td,th{border:1px solid #cbd5e1;padding:.35em .55em;text-align:left;vertical-align:top}th{background:#e6f4f1}.n{white-space:pre-wrap;background:#f8fafc;border-left:4px solid #F59E0B;padding:.5em .8em}.m{color:#64748b;font-size:.9em}</style></head><body><p class="m">Operación Metabolia · Instituto Nutri-Metabólico · ${new Date().toLocaleString('es-CL')}</p>${body}</body></html>`;
function missionReport(mid){
  const m = MBY[mid]; let h = `<h1>${esc(m.code)} · ${esc(m.name)}</h1><p class="m">${esc(m.taller)} · ${esc(m.weeks)} · ${esc(m.unit)}</p>`;
  (m.parts || []).forEach(p => { h += `<h2>${esc(p.title)}</h2>`; p.qs.forEach(q => { const k = mid+':q'+q.n; h += `<p><b>${q.n}.</b> ${esc(q.text)}</p>`;
    if (q.widget){ const st = S.answers[k]; h += `<p class="m">Verificación interactiva: ${st && (st.checked||st.shown) ? (allOk(k, q.widget) ? '✔ resuelta correctamente' : (st.shown ? 'solución mostrada' : '✘ con errores')) : 'no realizada'}</p>`; }
    if (S.notes[k]) h += `<div class="n">${esc(S.notes[k])}</div>`; }); });
  if (m.audit){ const A = S.audit[mid] || {votes:{}}; h += `<h2>Auditoría IA</h2><table><tr><th>Afirmación</th><th>Voto del curso</th><th>Clave</th><th>Corrección</th></tr>${m.audit.items.map((it,i)=>`<tr><td>${esc(it.s)}</td><td>${A.votes[i]===undefined?'—':(A.votes[i]?'Correcta':'Con error')}</td><td>${it.ok?'Correcta':'Con error'}</td><td>${esc(it.fix)}</td></tr>`).join('')}</table>`; if (S.notes[mid+':audit']) h += `<div class="n">${esc(S.notes[mid+':audit'])}</div>`; }
  if (S.notes[mid+':debrief']) h += `<h2>Debriefing</h2><div class="n">${esc(S.notes[mid+':debrief'])}</div>`;
  if (m.questions){ h += '<h2>Preguntas de integración</h2>'; m.questions.forEach(q => { h += `<p><b>${q.n}.</b> ${esc(q.text)}</p>${S.notes['reactor:q'+q.n]?`<div class="n">${esc(S.notes['reactor:q'+q.n])}</div>`:''}`; }); }
  if (S.teams.length && MAXES[m.type]){ h += `<h2>Registro de XP</h2><table><tr><th>Laboratorio</th><th>Prep.</th><th>Equipo</th><th>Individual</th><th>Retos</th><th>Total</th><th>Insignia</th></tr>${S.teams.map(t=>{const r=(S.xp[t.id]||{})[mid]||{};return `<tr><td>${esc(t.name)}</td><td>${+r.prep||0}</td><td>${fmt(+r.team||0)}</td><td>${+r.indiv||0}</td><td>${+r.retos||0}</td><td>${fmt(missionXP(t.id,mid))}</td><td>${m.badge&&hasBadge(t.id,m.badge)?'✔':''}</td></tr>`;}).join('')}</table>`; }
  download(`Informe_${m.code}_${m.name.replace(/\s+/g,'_')}.html`, docWrap(m.name, h));
}
function teamReportBody(tid){
  const t = teamById(tid), xp = totalXP(tid), L = levelOf(xp);
  let h = `<h1>${esc(t.emoji)} ${esc(t.name)}</h1><p><i>${esc(t.motto||'')}</i></p><p><b>Nivel:</b> ${L.name} · <b>XP:</b> ${fmt(xp)} / 890 · <b>ATP:</b> ${t.atp}</p>
   <p><b>Insignias:</b> ${BADGES.filter(b=>hasBadge(tid,b.id)).map(b=>b.icon+' '+b.name).join(' · ') || '—'}</p>`;
  MISSIONS.forEach(m => { if (!MAXES[m.type]) return; const r = (S.xp[tid]||{})[m.id] || {}, R = (S.reports[tid]||{})[m.id] || {};
    h += `<h2>${esc(m.code)} · ${esc(m.name)}</h2>`;
    h += m.type === 'recruit' ? `<p>Checklist de ingreso: ${missionXP(tid,m.id)} / 20 XP</p>` : `<table><tr><th>Preparación</th><th>Equipo</th><th>Individual</th><th>Retos</th><th>Total</th></tr><tr><td>${+r.prep||0}/${MAXES[m.type].prep}</td><td>${fmt(+r.team||0)}/${MAXES[m.type].team}</td><td>${+r.indiv||0}/${MAXES[m.type].indiv}</td><td>${+r.retos||0}/${MAXES[m.type].retos}</td><td><b>${fmt(missionXP(tid,m.id))}</b></td></tr></table>`;
    if (R.logro||R.brecha||R.paso) h += `<p><b>Un logro:</b> ${esc(R.logro||'—')}</p><p><b>Una brecha:</b> ${esc(R.brecha||'—')}</p><p><b>Un siguiente paso:</b> ${esc(R.paso||'—')}</p>`;
  });
  return h;
}

/* ===========================================================
   EVENTOS
   =========================================================== */
function go(view, mid, screen = 0){ V.name = view; if (mid) V.mid = mid; V.screen = screen; closeModal(); render(); }
function openMission(id){
  const m = MBY[id];
  if (!S.unlocked[id]) return lockedModal(id);
  go('mission', id, 0);
}
function lockedModal(id){
  const m = MBY[id], pw = pwdFor(id);
  modal(`<div class="riddle" style="margin:0 auto"><div class="lockbig">🔒</div><div class="kicker">Distrito saboteado</div><h2>${m.icon} ${m.code} · ${esc(m.name)}</h2>
   <p class="muted">${esc(m.weeks)} · ${esc(m.taller)}</p><div class="card"><p><b>Falla detectada:</b> ${esc(m.falla)}</p></div>
   ${pw ? `<p>Ingresen la contraseña obtenida en ${id==='m5'?'el escape room del Campamento Base':'el acertijo final de la misión anterior'}.</p><div class="pwd"><input id="pwd-lock" placeholder="Contraseña" autocomplete="off" aria-label="Contraseña"><button class="btn lime" data-act="unlock" data-id="${id}">Entrar 🔓</button></div>`
     : `<p class="muted">Se habilita al reactivar el Reactor ATP (o desde el Panel del Instituto).</p>`}</div>`, 'narrow');
  setTimeout(() => { const i = $('#pwd-lock'); if (i) i.focus(); }, 50);
}
function tryUnlock(id, val, inputEl){
  if (norm(val) === norm(pwdFor(id))){
    S.unlocked[id] = true; save(); SND.unlock(); confetti(); toast(`🔓 ¡${esc(MBY[id].name)} desbloqueada!`, 'ok'); return true;
  }
  SND.bad(); if (inputEl){ inputEl.classList.remove('shake'); void inputEl.offsetWidth; inputEl.classList.add('shake'); }
  toast('Contraseña incorrecta. Revisen el acertijo.', 'bad'); return false;
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act, d = el.dataset;
  switch (a){
    case 'go': go(d.view); break;
    case 'open-m': openMission(d.id); break;
    case 'node': {
      const m = MBY[d.id], st = mstatus(d.id);
      if (st === 'locked') return lockedModal(d.id);
      modal(`<div class="dialog">${mitoSVG(100)}<div><div class="kicker" style="color:${m.color}">${m.code} · ${esc(m.weeks)} · ${esc(m.taller)}</div><h2 style="margin:.1em 0">${m.icon} ${esc(m.name)}</h2><p class="muted">${esc(m.unit)}</p>
        <p><b>${st==='restored'?'✔ Distrito restaurado.':'Falla detectada:'}</b> ${esc(m.falla)}</p>
        <button class="btn big" data-act="open-m" data-id="${m.id}">Entrar ▶</button></div></div>`, 'narrow');
      break; }
    case 'unlock': { const i = $('#pwd-lock'); if (tryUnlock(d.id, i.value, i)){ closeModal(); go('mission', d.id, 0); } break; }
    case 'screen': { const i = +d.i, n = screensFor(MBY[V.mid]).length; if (i >= 0 && i < n){ V.screen = i; SND.click(); render(); $('#capbody') && ($('#capbody').scrollTop = 0); } break; }
    case 'close': closeModal(); break;
    case 'tw-skip': { const t = $('#'+d.id); if (t){ clearInterval(TW[d.id]); t.textContent = t.dataset.text; } break; }
    case 'alarm': SND.alarm(); break;
    case 'sound': S.settings.sound = !S.settings.sound; save(); render(); break;
    case 'fullscreen': if (!document.fullscreenElement) document.documentElement.requestFullscreen?.(); else document.exitFullscreen?.(); break;
    case 'briefing': modal(`<div class="kicker">Briefing inicial del Instituto Nutri-Metabólico</div><h2>📡 Metabolia está en peligro</h2>${dialogHTML(BRIEFING_INICIAL,'mito','dlgB')}`); break;
    case 'rules': rulesModal(); break;
    case 'mito': mitoModal(); break;
    case 'panel': panelModal(d.tab); break;

    /* widgets */
    case 'w-check': { const w = findWidget(d.k), st = W(d.k); st.checked = true; st.shown = false; const ok = allOk(d.k, w); save(); ok ? (SND.ok(), confetti(60), toast('✔ ¡Correcto! La Forja de ideas funciona.', 'ok')) : (SND.bad(), toast('Algo no calza todavía. Revisen las marcas en rojo.', 'bad')); rerenderScreen(); break; }
    case 'w-show': { const st = W(d.k); st.shown = true; st.checked = false; save(); rerenderScreen(); break; }
    case 'w-reset': { const st = W(d.k); st.v = {mode:st.v.mode}; st.checked = st.shown = false; save(); rerenderScreen(); break; }
    case 'w-choice': { const st = W(d.k), i = +d.i; let sel = st.v.sel || []; if (d.multi === '1') sel = sel.includes(i) ? sel.filter(x => x !== i) : [...sel, i]; else sel = [i]; st.v.sel = sel; st.checked = st.shown = false; save(); rerenderScreen(); break; }
    case 'w-move': { const st = W(d.k), p = +d.p, q = p + +d.d, o = st.v.order; if (q >= 0 && q < o.length){ [o[p], o[q]] = [o[q], o[p]]; st.checked = false; save(); rerenderScreen(); } break; }
    case 'kin-mode': { W(d.k).v.mode = d.mode; save(); rerenderScreen(); break; }
    case 'kin-fit': { const st = W(d.k); st.v.fit = !st.v.fit; save(); rerenderScreen(); break; }

    /* pistas */
    case 'hints': hintsModal(d.mid, d.hk); break;
    case 'hint-rev': {
      const tid = $('#tsel').value, key = d.mid + '|' + d.hk;
      if (tid && !changeATP(tid, -5, `Pista ${d.hk} (${MBY[d.mid].code})`)) return;
      S.hints[key] = (S.hints[key] || 0) + 1; save(); SND.unlock(); hintsModal(d.mid, d.hk); break; }
    case 'hint-hide': { delete S.hints[d.mid + '|' + d.hk]; save(); hintsModal(d.mid, d.hk); break; }
    case 'camp-hint': {
      const L = MBY.camp.locks[+d.i];
      modal(`<div class="dialog">${mitoSVG(90)}<div><div class="kicker">Pista del Campamento · 5 ATP</div><h2>${esc(L.room)}</h2>
        <div id="chint"><div class="row"><span class="small">Laboratorio que canjea:</span>${teamSelect()}<button class="btn orange sm" data-act="camp-hint-rev" data-i="${d.i}">🔓 Revelar · 5 ATP</button></div></div></div></div>`, 'narrow'); break; }
    case 'camp-hint-rev': { const tid = $('#tsel').value; if (tid && !changeATP(tid, -5, `Pista escape room sala ${+d.i+1}`)) return; $('#chint').innerHTML = `<p style="font-size:1.4em">💡 ${esc(MBY.camp.locks[+d.i].hint)}</p>`; SND.unlock(); break; }

    /* auditoría */
    case 'aud-vote': { const A = S.audit[d.mid]; A.votes[d.i] = d.v === '1'; save(); rerenderScreen(); break; }
    case 'aud-rev': { const A = S.audit[d.mid]; A.rev[d.i] = true; const it = MBY[d.mid].audit.items[d.i]; if (A.votes[d.i] !== undefined) (A.votes[d.i] === it.ok ? SND.ok() : SND.bad()); save(); rerenderScreen(); break; }
    case 'aud-revall': { const A = S.audit[d.mid]; MBY[d.mid].audit.items.forEach((_, i) => A.rev[i] = true); save(); SND.unlock(); rerenderScreen(); break; }
    case 'badge-toggle': { const prev = hasBadge(d.t, d.b); setBadge(d.t, d.b, !prev); save(); if ($('#modal') && $('#modal .team-head')) teamDetailModal(d.t); else if ($('#modal')) { const tab = $('#modal .tbtn.active'); tab ? panelModal(tab.dataset.tab) : closeModal(); } else rerenderScreen(); break; }

    /* acertijo */
    case 'riddle': { const m = MBY[d.mid], i = $('#pwd');
      if (norm(i.value) === norm(m.riddle.a)){ S.unlocked[m.riddle.opens] = true; save(); SND.unlock(); confetti(); toast(`🔓 ¡Correcto! ${esc(MBY[m.riddle.opens].name)} desbloqueada en el mapa`, 'ok'); rerenderScreen(); }
      else { SND.bad(); i.classList.remove('shake'); void i.offsetWidth; i.classList.add('shake'); toast('No es la contraseña. ¡Sigan pensando!', 'bad'); } break; }
    case 'restore': S.restored[d.mid] = true; S.unlocked[d.mid] = true; save(); SND.level(); confetti(200); toast(`🌟 ${esc(MBY[d.mid].name)} restaurado`, 'ok'); rerenderScreen(); break;
    case 'unrestore': delete S.restored[d.mid]; save(); rerenderScreen(); break;

    /* M0 */
    case 'team-save': {
      const f = el.closest('.tform'), g = n => f.querySelector(`[name=${n}]`).value.trim();
      const name = g('name'); if (!name){ toast('El Laboratorio necesita un nombre', 'bad'); return; }
      const motto = g('motto'); if (motto.split(/\s+/).filter(Boolean).length > 8){ toast('El lema debe tener como máximo 8 palabras', 'bad'); return; }
      const data = {name, concept:g('concept'), motto, emoji:g('emoji'), c1:g('c1'), c2:g('c2')};
      if (f.dataset.tid){ Object.assign(teamById(f.dataset.tid), data); toast('Laboratorio actualizado', 'ok'); }
      else { S.teams.push({id:uid(), atp:0, ...data}); SND.unlock(); toast(`🧪 ¡Bienvenido, Laboratorio ${esc(name)}!`, 'ok'); }
      save(); if ($('#modal')){ const tab = $('#modal .tbtn.active'); tab ? panelModal('labs') : closeModal(); } if (V.name === 'mission') rerenderScreen(); else render(); break; }
    case 'team-edit': modal(`<h2>✏️ Editar Laboratorio</h2>${teamFormHTML(teamById(d.t))}`, 'narrow'); break;
    case 'team-del': { const t = teamById(d.t); if (confirm(`¿Eliminar el Laboratorio «${t.name}» y todo su progreso?`)){ S.teams = S.teams.filter(x => x.id !== d.t); delete S.xp[d.t]; delete S.badges[d.t]; save(); closeModal(); render(); } break; }
    case 'pact-rev': { S.answers['m0:pact'].v[d.i] = true; save(); SND.click(); rerenderScreen(); break; }
    case 'm0-check': { const prev = totalXP(d.t), r = xpRec(d.t, 'm0'); r.check = r.check || {}; r.check[d.c] = !r.check[d.c]; evaluate(d.t, prev); save(); rerenderScreen(); break; }
    case 'mito-next': { S.answers['m0:mitodemo'].v.n++; save(); rerenderScreen(); break; }

    /* XP */
    case 'rubric': rubricModal(d.t, d.mid); break;
    case 'rub-set': { const m = MBY[d.mid], RUB = m.type === 'final' ? FINAL_RUBRIC : TEAM_RUBRIC, r = xpRec(d.t, d.mid), prev = totalXP(d.t);
      r.rubric = r.rubric || []; r.rubric[+d.c] = +d.l; r.team = RUB.reduce((a, c, i) => a + (r.rubric[i] != null ? c.pts * RUBRIC_LEVELS[r.rubric[i]].f : 0), 0);
      evaluate(d.t, prev); save(); rubricModal(d.t, d.mid); rerenderScreen(); break; }
    case 'rub-direct': { const m = MBY[d.mid], r = xpRec(d.t, d.mid), prev = totalXP(d.t), mx = MAXES[m.type === 'final' ? 'final' : 'mission'].team;
      r.team = clamp(num($('#rubdirect').value) || 0, 0, mx); r.rubric = []; evaluate(d.t, prev); save(); closeModal(); rerenderScreen(); break; }
    case 'report': reportModal(d.t, d.mid); break;
    case 'exp-award': { const e = MBY[d.mid].expeditions[+d.i]; awardModal({mid:d.mid, xp:e.xp, atp:e.atp, why:`Expedición «${e.name}»`}); break; }
    case 'quick-atp': awardModal({mid:d.mid, xp:0, atp:5, why:'Preparación (calentamiento / bitácora a tiempo)'}); break;
    case 'award-open': awardModal(); break;
    case 'aw-preset': $('#aw-atp').value = d.a; $('#aw-why').value = d.l; break;
    case 'aw-go': {
      const ids = $$('.aw-t:checked').map(x => x.value); if (!ids.length){ toast('Seleccionen al menos un Laboratorio', 'bad'); return; }
      const mid = $('#aw-m').value, xp = num($('#aw-xp').value) || 0, atp = num($('#aw-atp').value) || 0, why = $('#aw-why').value || 'Recompensa';
      ids.forEach(tid => { if (xp > 0) addRetos(tid, mid, xp); if (atp) changeATP(tid, atp, why); });
      save(); closeModal(); toast(`🎖 Recompensa otorgada a ${ids.length} Laboratorio(s)`, 'gold'); if (V.name === 'mission') rerenderScreen(); else render(); break; }
    case 'team': teamDetailModal(d.t); break;
    case 'atp-adj': changeATP(d.t, +d.d, 'Ajuste docente'); save(); teamDetailModal(d.t); if (V.name === 'board') { const m = $('#modal'); render(); document.body.appendChild(m); } break;
    case 'buy': if (changeATP(d.t, -(+d.c), d.w)){ toast(`🪙 ${esc(teamById(d.t).name)}: ${esc(d.w)} (−${d.c} ATP)`, 'gold'); rerenderScreen(); } break;

    /* campamento */
    case 'lock': { const L = MBY.camp.locks[+d.i], inp = $('#lock'+d.i);
      if (num(inp.value) === L.a){ S.escape.locks[+d.i] = L.a; save(); SND.unlock(); toast(`🔓 ${esc(L.room)} abierta`, 'ok'); rerenderScreen(); }
      else { SND.bad(); inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); } break; }
    case 'combo': { const v = $('#combo').value.replace(/\D/g, '');
      if (v === MBY.camp.combo){ S.escape.done = true; S.unlocked.m5 = true; S.escape.locks = MBY.camp.locks.map(L => L.a);
        if (!S.escape.paid){ S.teams.forEach(t => changeATP(t.id, 10, 'Escape del Campamento Base')); S.escape.paid = true; }
        save(); SND.level(); confetti(220); toast('🚪 ¡Escaparon del Campamento! +10 ATP para cada Laboratorio · Misión 5 desbloqueada', 'ok'); rerenderScreen(); }
      else { SND.bad(); const i = $('#combo'); i.classList.remove('shake'); void i.offsetWidth; i.classList.add('shake'); toast('La puerta no se abre…', 'bad'); } break; }

    /* final */
    case 'elena': S.answers['reactor:elena'].v.i = +d.i; save(); rerenderScreen(); break;
    case 'rcell': {
      const m = MBY.reactor, [o] = d.k.split('|'), isH = o === 'Hormona predominante', opts = isH ? m.hormones : m.routes, sel = S.reactor.cells[d.k] || [];
      const [org, si] = d.k.split('|');
      modal(`<div class="kicker">Cuadro del reactor</div><h2>${esc(org)} · ${esc(m.states[+si])}</h2><p class="small muted">Seleccionen ${isH ? 'la(s) hormona(s) predominante(s)' : 'las rutas principales activas'}.</p>
        <div class="chipsel">${opts.map(x=>`<button class="${sel.includes(x)?'sel':''}" data-act="rchip" data-k="${esc(d.k)}" data-x="${esc(x)}">${esc(x)}</button>`).join('')}</div>
        <div class="row" style="margin-top:1em"><button class="btn lime" data-act="close">✔ Listo</button></div>`, 'narrow'); break; }
    case 'rchip': { const C = S.reactor.cells; C[d.k] = C[d.k] || []; C[d.k] = C[d.k].includes(d.x) ? C[d.k].filter(x => x !== d.x) : [...C[d.k], d.x]; el.classList.toggle('sel'); save(); rerenderScreen(); break; }
    case 'rcheck': S.reactor.checked = !S.reactor.checked; save(); rerenderScreen(); break;
    case 'rreset': if (confirm('¿Borrar el cuadro del reactor?')){ S.reactor.cells = {}; S.reactor.checked = false; save(); rerenderScreen(); } break;
    case 'reactor-on': S.reactor.on = true; S.restored.reactor = true; S.unlocked.rescate = true; save(); SND.level(); setTimeout(() => confetti(260), 200); setTimeout(() => confetti(200), 900); rerenderScreen(); startTypewriters(); break;
    case 'reactor-off': S.reactor.on = false; delete S.restored.reactor; save(); rerenderScreen(); break;

    /* cronómetro */
    case 'timer-start': timerStart(d.l, +d.m); break;
    case 'timer-toggle': if (TM.left <= 0) TM.left = TM.total; TM.running = !TM.running; TM.done = false; TM.last = Date.now(); renderTimer(); break;
    case 'timer-add': TM.left = Math.max(0, TM.left + (+d.s)); TM.total = Math.max(TM.total, TM.left); TM.done = false; renderTimer(); break;
    case 'timer-reset': TM.left = TM.total; TM.running = false; TM.done = false; renderTimer(); break;
    case 'timer-collapse': TM.collapsed = !TM.collapsed; renderTimer(); break;
    case 'timer-big': { const b = document.createElement('div'); b.className = 'timer-big'; b.id = 'timerbig'; b.innerHTML = `<div class="clock"></div><div class="lbl">${esc(TM.label)}</div><button class="btn ghost">Cerrar</button>`; b.onclick = () => b.remove(); document.body.appendChild(b); renderTimer(); break; }

    /* datos */
    case 'export': download(`Operacion_Metabolia_respaldo_${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(S, null, 1), 'application/json'); break;
    case 'import': { const f = $('#imp').files[0]; if (!f) return toast('Elijan un archivo .json', 'bad');
      const rd = new FileReader(); rd.onload = () => { try { const o = JSON.parse(rd.result); if (!o.teams) throw 0; S = Object.assign(freshState(), o); save(); closeModal(); render(); toast('Respaldo importado', 'ok'); } catch(err){ toast('Archivo no válido', 'bad'); } }; rd.readAsText(f); break; }
    case 'review-on': S.reviewBackup = {...S.unlocked}; MISSIONS.forEach(m => S.unlocked[m.id] = true); save(); SND.unlock(); toast('🔓 Modo revisión: todas las misiones desbloqueadas', 'ok'); panelModal('missions'); if (V.name === 'map') { const md = $('#modal'); render(); document.body.appendChild(md); } break;
    case 'review-off': S.unlocked = {...S.reviewBackup}; delete S.reviewBackup; save(); toast('🔒 Misiones bloqueadas como estaban antes de la revisión'); panelModal('missions'); if (V.name === 'map') { const md = $('#modal'); render(); document.body.appendChild(md); } break;
    case 'lock-all': if (confirm('¿Bloquear todas las misiones excepto M0? (Las restauradas también quedarán bloqueadas en el mapa; XP, ATP e insignias no cambian.)')){ S.unlocked = {m0:true}; S.restored = {}; S.reactor.on = false; delete S.reviewBackup; save(); panelModal('missions'); if (V.name === 'map') { const md = $('#modal'); render(); document.body.appendChild(md); } } break;
    case 'reset': if (confirm('¿Borrar TODO el progreso de este navegador? Esta acción no se puede deshacer.') && confirm('Confirmen nuevamente: se borrarán Laboratorios, XP, ATP, insignias y notas.')){ S = freshState(); localStorage.removeItem(STORE_KEY); closeModal(); go('splash'); } break;
    case 'export-mission': missionReport(d.mid); break;
    case 'export-team': { const t = teamById(d.t); download(`Informe_del_Instituto_${t.name.replace(/\s+/g,'_')}.html`, docWrap('Informe ' + t.name, teamReportBody(d.t))); break; }
    case 'export-all': download('Informe_general_Operacion_Metabolia.html', docWrap('Informe general', S.teams.map(t => teamReportBody(t.id)).join('<hr style="page-break-after:always">'))); break;
  }
});

/* entradas de texto y casillas */
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.note !== undefined){ S.notes[el.dataset.note] = el.value; save(); }
  else if (el.dataset.report){ const [tid, mid, k] = el.dataset.report.split('|'); S.reports[tid] = S.reports[tid] || {}; S.reports[tid][mid] = S.reports[tid][mid] || {}; S.reports[tid][mid][k] = el.value; save(); }
  else if (el.dataset.w && el.tagName === 'INPUT'){ const st = W(el.dataset.w); st.v[el.dataset.i] = el.value; st.checked = false; save(); }
});
document.addEventListener('change', e => {
  const el = e.target, d = el.dataset;
  if (d.w && el.tagName === 'SELECT'){ const st = W(d.w); st.v[d.i] = el.value; st.checked = false; save(); el.closest('td') && el.closest('td').classList.remove('ok','bad'); }
  else if (d.xp){ const m = MBY[d.mid], mx = MAXES[m.type === 'final' ? 'final' : 'mission'], prev = totalXP(d.xp), r = xpRec(d.xp, d.mid);
    r[d.f] = clamp(num(el.value) || 0, 0, mx[d.f]); evaluate(d.xp, prev); save(); rerenderScreen(); }
  else if (d.roles){ const prev = totalXP(d.roles); xpRec(d.roles, d.mid).roles = el.checked; evaluate(d.roles, prev); save(); }
  else if (d.m0){ const prev = totalXP(d.m0), r = xpRec(d.m0, 'm0'); r.check = r.check || {}; r.check[d.c] = el.checked; evaluate(d.m0, prev); save(); rerenderScreen(); }
  else if (d.unl){ if (el.checked) S.unlocked[d.unl] = true; else delete S.unlocked[d.unl]; save(); }
  else if (d.rest){ if (el.checked){ S.restored[d.rest] = true; S.unlocked[d.rest] = true; } else delete S.restored[d.rest]; if (d.rest === 'reactor') S.reactor.on = el.checked; save(); }
  else if (d.actChange === 'timer-preset' && el.value !== ''){ const p = TIMER_PRESETS[+el.value]; timerStart(p.l, p.m); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape'){ if ($('#timerbig')) $('#timerbig').remove(); else closeModal(); return; }
  if (e.key === 'Enter'){
    if (e.target.id === 'pwd-lock'){ const b = $('[data-act="unlock"]'); b && b.click(); }
    else if (e.target.id === 'pwd'){ const b = $('[data-act="riddle"]'); b && b.click(); }
    else if (e.target.id === 'combo'){ const b = $('[data-act="combo"]'); b && b.click(); }
    else if (/^lock\d$/.test(e.target.id)){ const b = $(`[data-act="lock"][data-i="${e.target.id.slice(4)}"]`); b && b.click(); }
    else if (e.target.closest && e.target.closest('.node')) e.target.closest('.node').dispatchEvent(new MouseEvent('click', {bubbles:true}));
    return;
  }
  const tag = (e.target.tagName || '').toLowerCase(); if (tag === 'input' || tag === 'textarea' || tag === 'select' || $('#modal')) return;
  if (V.name === 'mission' && (e.key === 'ArrowRight' || e.key === 'PageDown')){ const b = $('.cap-foot .btn:not(.ghost)'); b && !b.disabled && b.click(); }
  if (V.name === 'mission' && (e.key === 'ArrowLeft' || e.key === 'PageUp')){ const b = $('.cap-foot .btn.ghost'); b && !b.disabled && b.click(); }
});

render();
