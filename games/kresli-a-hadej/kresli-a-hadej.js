(function (root, factory) {
  const api = factory(root.DrawingWords);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.DrawingGame = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (wordData) {
  "use strict";
  function createState(config) {
    return { config, turn: 0, scores: Array(config.teams.length).fill(0), used: [], strokes: [], currentStroke: null };
  }
  function drawerFor(state) {
    const playerIndex = state.turn % state.config.players.length;
    const player = state.config.players[playerIndex];
    return { ...player, playerIndex, teamIndex: player.team, team: state.config.teams[player.team] };
  }
  function pickWord(state, random = Math.random) {
    let pool = wordData.words.filter(w => state.config.categories.includes(w.category) && (state.config.difficulty === "vše" || w.difficulty === state.config.difficulty));
    const unused = pool.filter(w => !state.used.includes(w.text));
    if (unused.length) pool = unused;
    const word = pool[Math.floor(random() * pool.length)];
    if (word && !state.used.includes(word.text)) state.used.push(word.text);
    return word;
  }
  function finishTurn(state, guessed) {
    const drawer = drawerFor(state);
    if (guessed) state.scores[drawer.teamIndex] += 1;
    state.turn += 1;
    return state.turn >= state.config.rounds;
  }
  const api = { createState, drawerFor, pickWord, finishTurn };
  if (typeof document === "undefined") return api;

  const $ = id => document.getElementById(id);
  const screens = ["setup","handoff","secret","play","roundResult","finish"];
  const colors = ["#202634","#e23c3c","#2878c7","#25915a","#f0a21a","#8b4ac2"];
  const teamDefaults = [{name:"Modří",color:"#2878c7",symbol:"★"},{name:"Červení",color:"#e23c3c",symbol:"♥"},{name:"Zelení",color:"#25915a",symbol:"●"},{name:"Fialoví",color:"#8b4ac2",symbol:"◆"}];
  let state, word, timerId, remaining, drawing=false, color=colors[0], width=4, erasing=false;
  const canvas=$("canvas"), ctx=canvas.getContext("2d");
  function show(id){ screens.forEach(x=>$(x).hidden=x!==id); window.scrollTo({top:0,behavior:"smooth"}); }
  function renderEditors(){
    const pc=+$("playerCount").value, tc=Math.min(+$("teamCount").value,pc);
    $("playersEditor").innerHTML=Array.from({length:pc},(_,i)=>`<div class="editor-row"><input class="player-name" value="Hráč ${i+1}" aria-label="Jméno hráče ${i+1}"><select class="player-team" aria-label="Tým hráče ${i+1}">${Array.from({length:tc},(_,j)=>`<option value="${j}">Tým ${j+1}</option>`).join("")}</select></div>`).join("");
    [...document.querySelectorAll(".player-team")].forEach((el,i)=>el.value=i%tc);
    $("teamsEditor").innerHTML=Array.from({length:tc},(_,i)=>`<div class="team-row"><input class="team-symbol" maxlength="2" value="${teamDefaults[i].symbol}" aria-label="Symbol týmu ${i+1}"><input class="team-name" value="${teamDefaults[i].name}" aria-label="Název týmu ${i+1}"><input class="team-color" type="color" value="${teamDefaults[i].color}" aria-label="Barva týmu ${i+1}"></div>`).join("");
  }
  function setupCategories(){
    $("categories").innerHTML=Object.entries(wordData.categories).map(([key,label])=>`<label><input type="checkbox" value="${key}" checked> ${label}</label>`).join("");
  }
  function readConfig(){
    const teams=[...document.querySelectorAll(".team-row")].map(row=>({symbol:row.querySelector(".team-symbol").value||"●",name:row.querySelector(".team-name").value.trim()||"Tým",color:row.querySelector(".team-color").value}));
    const players=[...document.querySelectorAll(".editor-row")].map(row=>({name:row.querySelector(".player-name").value.trim()||"Hráč",team:+row.querySelector(".player-team").value}));
    const categories=[...$("categories").querySelectorAll(":checked")].map(x=>x.value);
    if(!categories.length){$("setupError").textContent="Vyberte alespoň jednu kategorii.";return null}
    $("setupError").textContent="";
    return {teams,players,categories,difficulty:$("difficulty").value,seconds:+$("roundTime").value,rounds:+$("roundCount").value};
  }
  function prepareTurn(){
    word=pickWord(state);
    const drawer=drawerFor(state);
    $("handoffText").textContent=`Předat zařízení hráči ${drawer.name}`;
    show("handoff");
  }
  function renderScore(){
    const active=drawerFor(state).player.team;
    $("scoreboard").innerHTML=state.config.teams.map((t,i)=>`<div class="score ${i===active?"active":""}" style="--team:${t.color}"><strong>${t.symbol} ${t.name}</strong><br>${state.scores[i]} bodů</div>`).join("");
  }
  function clearDrawing(){state.strokes=[];state.currentStroke=null;redraw()}
  function resizeCanvas(){
    const rect=canvas.getBoundingClientRect(), ratio=Math.max(1,window.devicePixelRatio||1);
    canvas.width=Math.round(rect.width*ratio);canvas.height=Math.round(rect.height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);redraw();
  }
  function redraw(){
    const rect=canvas.getBoundingClientRect();ctx.clearRect(0,0,rect.width,rect.height);ctx.lineCap="round";ctx.lineJoin="round";
    state?.strokes.forEach(s=>{if(s.points.length<1)return;ctx.strokeStyle=s.color;ctx.lineWidth=s.width;ctx.beginPath();ctx.moveTo(s.points[0].x*rect.width,s.points[0].y*rect.height);s.points.slice(1).forEach(p=>ctx.lineTo(p.x*rect.width,p.y*rect.height));if(s.points.length===1)ctx.lineTo(s.points[0].x*rect.width+.01,s.points[0].y*rect.height);ctx.stroke()});
  }
  function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height}}
  function startDraw(e){if(!drawing)return;canvas.setPointerCapture(e.pointerId);state.currentStroke={color:erasing?"#ffffff":color,width:erasing?width*2:width,points:[point(e)]};state.strokes.push(state.currentStroke);redraw()}
  function moveDraw(e){if(!state?.currentStroke)return;state.currentStroke.points.push(point(e));redraw()}
  function endDraw(){state&&(state.currentStroke=null)}
  function startTimer(){
    remaining=state.config.seconds;updateTimer();clearInterval(timerId);timerId=setInterval(()=>{remaining--;updateTimer();if(remaining<=0)endRound(false,"Čas vypršel")},1000);
  }
  function updateTimer(){$("timerStatus").textContent=`${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,"0")}`}
  function endRound(guessed, label){
    if(!drawing)return;drawing=false;clearInterval(timerId);const done=finishTurn(state,guessed);
    $("resultTitle").textContent=label;$("resultWord").textContent=`Slovo bylo: ${word.text}`;
    $("nextRound").textContent=done?"Zobrazit výsledky":"Další kolo";$("nextRound").dataset.done=String(done);show("roundResult");
  }
  function finishGame(){
    const max=Math.max(...state.scores);
    $("finalScores").innerHTML=state.config.teams.map((t,i)=>`<div class="final-row ${state.scores[i]===max?"winner":""}" style="color:${t.color}">${t.symbol} ${t.name}: ${state.scores[i]} bodů${state.scores[i]===max?" 🏆":""}</div>`).join("");show("finish");
  }
  function newGame(settings=true){clearInterval(timerId);if(settings){renderEditors();show("setup")}else{state=createState(state.config);prepareTurn()}}

  setupCategories();renderEditors();
  $("playerCount").onchange=renderEditors;$("teamCount").onchange=renderEditors;
  $("startGame").onclick=()=>{const config=readConfig();if(config){state=createState(config);prepareTurn()}};
  $("confirmHandoff").onclick=()=>{const d=drawerFor(state);$("secretDrawer").textContent=d.name;$("secretWord").textContent=word.text;show("secret")};
  $("beginDrawing").onclick=()=>{const d=drawerFor(state);$("roundStatus").textContent=`${state.turn+1} / ${state.config.rounds}`;$("drawerStatus").textContent=`${d.name} (${d.team.name})`;show("play");renderScore();clearDrawing();requestAnimationFrame(()=>{resizeCanvas();drawing=true;startTimer()})};
  $("guessed").onclick=()=>endRound(true,"Uhodnuto!");$("skip").onclick=()=>endRound(false,"Přeskočeno");
  $("nextRound").onclick=()=>$("nextRound").dataset.done==="true"?finishGame():prepareTurn();
  $("newGameTop").onclick=()=>newGame(true);$("settings").onclick=()=>newGame(true);$("playAgain").onclick=()=>newGame(false);
  $("undo").onclick=()=>{state.strokes.pop();redraw()};$("clearCanvas").onclick=clearDrawing;
  $("eraser").onclick=()=>{erasing=!erasing;$("eraser").classList.toggle("selected",erasing)};
  $("colors").innerHTML=colors.map(c=>`<button type="button" class="tool color ${c===color?"selected":""}" style="--color:${c}" data-color="${c}" aria-label="Barva ${c}"></button>`).join("");
  $("colors").onclick=e=>{if(!e.target.dataset.color)return;color=e.target.dataset.color;erasing=false;$("eraser").classList.remove("selected");document.querySelectorAll(".color").forEach(x=>x.classList.toggle("selected",x===e.target))};
  document.querySelector(".widths").onclick=e=>{if(!e.target.dataset.width)return;width=+e.target.dataset.width;document.querySelectorAll("[data-width]").forEach(x=>x.classList.toggle("selected",x===e.target))};
  canvas.addEventListener("pointerdown",startDraw);canvas.addEventListener("pointermove",moveDraw);canvas.addEventListener("pointerup",endDraw);canvas.addEventListener("pointercancel",endDraw);canvas.addEventListener("lostpointercapture",endDraw);
  window.addEventListener("resize",resizeCanvas);document.addEventListener("visibilitychange",()=>{if(document.hidden&&drawing){clearInterval(timerId);drawing=false;$("resultTitle").textContent="Hra byla pozastavena";$("resultWord").textContent="Kvůli skrytí stránky toto kolo neběží.";$("nextRound").dataset.done="false";show("roundResult")}});
  return api;
});
