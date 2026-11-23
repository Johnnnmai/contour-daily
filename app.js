(function(){
'use strict';
var SITE='https://contour.valenx.org/';
var EPOCH=new Date(2026,10,23); // day No. 1, local midnight
var MAX=6;
var $=function(id){return document.getElementById(id);};
function dayIndex(d){var t=new Date(d.getFullYear(),d.getMonth(),d.getDate());return Math.max(0,Math.round((t-EPOCH)/864e5));}
var today=new Date(), day=dayIndex(today), A=window.ANSWERS[day%window.ANSWERS.length];
var C=window.COUNTRIES;
function norm(s){return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');}
var lookup={};
C.forEach(function(c){lookup[norm(c.n)]=c;(c.a||[]).forEach(function(a){var k=norm(a);if(!lookup[k])lookup[k]=c;});});
var extra={usa:'United States',us:'United States',america:'United States',uk:'United Kingdom',britain:'United Kingdom',greatbritain:'United Kingdom',england:'United Kingdom',uae:'United Arab Emirates',drc:'DR Congo',czechrepublic:'Czechia',ivorycoast:'Ivory Coast',burma:'Myanmar'};
Object.keys(extra).forEach(function(k){var t=C.filter(function(c){return c.n===extra[k];})[0];if(t&&!lookup[k])lookup[k]=t;});
var dl=$('countryList');dl.innerHTML=C.map(function(c){return '<option value="'+c.n.replace(/"/g,'&quot;')+'">';}).join('');

function hav(a,b){var r=Math.PI/180,dl=(b[1]-a[1])*r,dn=(b[0]-a[0])*r;var x=Math.pow(Math.sin(dl/2),2)+Math.cos(a[1]*r)*Math.cos(b[1]*r)*Math.pow(Math.sin(dn/2),2);return 2*6371*Math.asin(Math.sqrt(x));}
function bearing(a,b){var r=Math.PI/180,y=Math.sin((b[0]-a[0])*r)*Math.cos(b[1]*r),x=Math.cos(a[1]*r)*Math.sin(b[1]*r)-Math.sin(a[1]*r)*Math.cos(b[1]*r)*Math.cos((b[0]-a[0])*r);return (Math.atan2(y,x)/r+360)%360;}
var ARROWS=['⬆️','↗️','➡️','↘️','⬇️','↙️','⬅️','↖️'];
function arrow(a,b){return ARROWS[Math.round(bearing(a,b)/45)%8];}
function prox(d){return Math.max(0,Math.round((1-d/20000)*100));}
function squares(p){var g=Math.floor(p/20),s='';for(var i=0;i<5;i++){s+= i<g?'🟩':(i===g&&p%20>=10?'🟨':'⬜');}return s;}
var useMi=/^en-(US|GB|LR|MM)/.test(navigator.language||'');
function fmtD(km){return useMi?Math.round(km*0.621371).toLocaleString()+' mi':Math.round(km).toLocaleString()+' km';}
function sig3(n){var p=Math.pow(10,Math.max(0,Math.floor(Math.log10(n))-2));return Math.round(n/p)*p;}
function clue(k){
  if(k===1)return 'Region: <b>'+A.region+'</b>';
  if(k===2)return 'Area: about <b>'+sig3(A.area).toLocaleString()+' km²</b>';
  if(k===3)return A.borders===0?'<b>No land borders</b>':'<b>'+A.borders+'</b> bordering countr'+(A.borders>1?'ies':'y')+(A.landlocked?' · <b>landlocked</b>':'');
  if(k===4)return 'Capital starts with <b>'+A.capital.charAt(0)+'</b>';
  if(k===5)return 'Capital: <b>'+A.capital+'</b>';
}
// state
var KEY='contour:'+day, SK='contour:stats';
var st=JSON.parse(localStorage.getItem(KEY)||'{"g":[],"done":false,"won":false}');
var stats=JSON.parse(localStorage.getItem(SK)||'{"played":0,"wins":0,"streak":0,"max":0,"dist":[0,0,0,0,0,0],"last":-9}');
function save(){localStorage.setItem(KEY,JSON.stringify(st));localStorage.setItem(SK,JSON.stringify(stats));}

$('shapePath').setAttribute('d',A.p);
$('puzzleNo').textContent='No. '+(day+1);
$('todayLabel').textContent=today.toLocaleDateString(undefined,{month:'short',day:'numeric'});

function render(){
  var ol=$('guesses');ol.innerHTML='';
  for(var i=0;i<MAX;i++){
    var li=document.createElement('li'),g=st.g[i];
    if(!g){li.className='empty';li.innerHTML='<span class="nm">·</span>';}
    else{var c=lookup[norm(g)],hit=c.n===A.n,d=hit?0:hav(c.c,A.c);
      if(hit)li.className='hit';
      li.innerHTML='<span class="nm"></span><span class="km">'+fmtD(d)+'</span><span class="pc">'+(hit?100:prox(d))+'%</span><span class="dir">'+(hit?'🎉':arrow(c.c,A.c))+'</span>';
      li.firstChild.textContent=c.n;}
    ol.appendChild(li);
  }
  var misses=st.g.filter(function(g){return lookup[norm(g)].n!==A.n;}).length;
  var cl=$('clues');cl.innerHTML='';
  for(var k=1;k<=Math.min(misses,5);k++){var s=document.createElement('span');s.className='clue';s.innerHTML=clue(k);cl.appendChild(s);}
  if(st.done)showResult();
}
function showResult(){
  document.body.classList.toggle('won',st.won);
  $('guessForm').hidden=true;
  $('result').hidden=false;
  $('verdict').textContent=st.won?('Solved in '+st.g.length+'/6'):'Out of guesses';
  $('answerName').textContent=A.n;
  var f=$('facts');f.innerHTML='';
  [['Region',A.region],['Capital',A.capital],['Area','about '+sig3(A.area).toLocaleString()+' km²'],['Bordering countries',A.borders===0?'none':String(A.borders)+(A.landlocked?' (landlocked)':'')]].forEach(function(x){var li=document.createElement('li');li.innerHTML='<b></b> ';li.firstChild.textContent=x[0]+':';li.appendChild(document.createTextNode(x[1]));f.appendChild(li);});
  $('wikiLink').href=A.wiki;
  $('sharePreview').textContent=shareText();
}
function shareText(){
  var lines=['Contour No. '+(day+1)+'  '+(st.won?st.g.length:'X')+'/6'];
  st.g.forEach(function(g){var c=lookup[norm(g)];if(c.n===A.n)lines.push('🟩🟩🟩🟩🟩 🎉');else{var d=hav(c.c,A.c);lines.push(squares(prox(d))+' '+arrow(c.c,A.c));}});
  var used=Math.min(5,st.g.length-(st.won?1:0));
  lines.push('🔎 '+used+' clue'+(used===1?'':'s')+' used');
  lines.push(SITE);
  return lines.join('\n');
}
function msg(t){$('msg').textContent=t;}
$('guessForm').addEventListener('submit',function(e){
  e.preventDefault();if(st.done)return;
  var v=$('guess').value.trim();if(!v)return;
  var c=lookup[norm(v)];
  if(!c){msg('Not in the country list. Try the suggestions.');return;}
  if(st.g.some(function(g){return lookup[norm(g)].n===c.n;})){msg('Already guessed.');return;}
  msg('');st.g.push(c.n);$('guess').value='';
  var hit=c.n===A.n;
  if(hit||st.g.length>=MAX){
    st.done=true;st.won=hit;stats.played++;
    if(hit){stats.wins++;stats.dist[st.g.length-1]++;stats.streak=(stats.last===day-1)?stats.streak+1:1;stats.last=day;stats.max=Math.max(stats.max,stats.streak);}
    else{stats.streak=0;}
  }
  save();render();
  if(st.done)setTimeout(function(){$('result').scrollIntoView({behavior:'smooth',block:'start'});},250);
});
function copy(t){
  if(navigator.clipboard&&window.isSecureContext)return navigator.clipboard.writeText(t);
  return new Promise(function(res,rej){var ta=document.createElement('textarea');ta.value=t;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy')?res():rej();}catch(e){rej(e);}document.body.removeChild(ta);});
}
$('shareBtn').addEventListener('click',function(){
  var b=this;copy(shareText()).then(function(){b.textContent='Copied ✓';setTimeout(function(){b.textContent='Copy result';},2000);},function(){b.textContent='Select the text below';});
});
function tick(){var n=new Date(),m=new Date(n.getFullYear(),n.getMonth(),n.getDate()+1),s=Math.max(0,Math.floor((m-n)/1000));
  var h=Math.floor(s/3600),mi=Math.floor(s%3600/60),se=s%60;$('countdown').textContent=[h,mi,se].map(function(x){return (x<10?'0':'')+x;}).join(':');
  if(dayIndex(n)!==day)location.reload();}
setInterval(tick,1000);tick();
function openStats(){
  $('stPlayed').textContent=stats.played;$('stWin').textContent=stats.played?Math.round(stats.wins/stats.played*100):0;
  $('stStreak').textContent=(stats.last>=day-1)?stats.streak:0;$('stMax').textContent=stats.max;
  var mx=Math.max.apply(null,stats.dist.concat([1]));
  $('dist').innerHTML=stats.dist.map(function(n,i){return '<div>'+(i+1)+'<i style="width:'+(8+n/mx*80)+'%">'+n+'</i></div>';}).join('');
  $('dlgStats').showModal();
}
$('btnStats').onclick=openStats;$('btnHelp').onclick=function(){$('dlgHelp').showModal();};
document.querySelectorAll('[data-close]').forEach(function(b){b.onclick=function(){b.closest('dialog').close();};});
if(!localStorage.getItem('contour:seen')){localStorage.setItem('contour:seen','1');try{$('dlgHelp').showModal();}catch(e){}}
render();
})();
