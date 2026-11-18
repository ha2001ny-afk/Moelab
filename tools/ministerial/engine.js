/* MoeLab — محرك الأسئلة الوزارية
   يُحقن تلقائياً داخل كل محاكاة لها أسئلة (لا تعدّل النسخ المحقونة يدوياً — عدّل هذا الملف ثم شغّل build.py).
   مبدأ الأمان: أي خطأ هنا يُخفي زر الوزاريات فقط ولا يؤثر على المحاكاة. */
(function(){try{
var D=window.MOE_MIN_DATA;if(!D||!D.qs||!D.qs.length)return;
var stage=document.getElementById('stage')||document.body;
var AR=function(n){return String(n).replace(/\d/g,function(d){return '٠١٢٣٤٥٦٧٨٩'[d];});};
var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};
var tagK=function(s){return /الفصل|الكتاب|التلفزيون/.test(s)?'book':/خارج|الموصل|المتميزين|النازحين|المحاولات/.test(s)?'out':/تمهيدي|تكميلي/.test(s)?'pre':'min';};
var tagH=function(s){var k=tagK(s);return '<span class="tg '+k+'">'+esc(k==='book'?s:'وزاري '+s)+'</span>';};
var minCount=function(q){var t=(q.tags||[]).slice();(q.items||[]).forEach(function(i){t=t.concat(i.tags||[]);});return t.filter(function(s){return tagK(s)!=='book';}).length;};
var $=function(id){return document.getElementById(id);};

/* ---------- DOM ---------- */
var wrap=document.createElement('div');
wrap.innerHTML='<button id="qbtn" type="button" aria-label="الأسئلة الوزارية">📝 الوزاريات <b id="qcnt"></b></button>'+
 '<div id="hlbar"><span id="hlname"></span><button id="hlback" type="button">↩ رجوع للسؤال</button></div>'+
 '<div id="qp" role="dialog" aria-label="الأسئلة الوزارية">'+
  '<div id="qhd"><div class="t">📝 الأسئلة الوزارية</div><button id="qx" type="button" aria-label="إغلاق">✕</button></div>'+
  '<div id="qchips"></div><div id="qbody"></div>'+
  '<div id="qft"><button id="qprev" type="button">السابق ▶</button><button id="qa" type="button">إظهار الحل 💡</button><button id="qnext" type="button">التالي ◀</button></div>'+
 '</div>';
while(wrap.firstChild)stage.appendChild(wrap.firstChild);
/* place the button just to the right of the sim's zoom buttons (or under them if they are in a row) */
function placeBtn(){try{var b=$('qbtn'),zb=document.querySelector('.zb'),st=stage.getBoundingClientRect();
  if(!zb){b.style.left='10px';b.style.top='10px';return;}
  var r=zb.getBoundingClientRect(),row=getComputedStyle(zb).flexDirection==='row';
  if(!r.width||!r.height){b.style.left='10px';b.style.top='10px';return;}
  var below=function(){b.style.left=Math.round(r.left-st.left)+'px';b.style.top=Math.round(r.bottom-st.top+8)+'px';};
  if(row||placeBtn.down){below();return;}
  b.style.left=Math.round(r.right-st.left+10)+'px';b.style.top=Math.round(r.top-st.top)+'px';
  /* if the sim shows its own caption/banner in that spot, move under the zoom buttons (and stay there) */
  var q=b.getBoundingClientRect(),hit=false;
  [].forEach.call(stage.querySelectorAll('*'),function(e){if(hit||e===b||e.closest('.zb,#qp,#hlbar,#qbtn'))return;
    if(e.parentElement!==stage&&!e.id)return;
    var cs=getComputedStyle(e);if(cs.position==='static'||cs.display==='none'||cs.visibility==='hidden'||!(e.textContent||'').trim())return;
    var x=e.getBoundingClientRect();if(!x.width||x.width>st.width*.9||x.height>120)return;
    if(x.left<q.right&&x.right>q.left&&x.top<q.bottom&&x.bottom>q.top)hit=true;});
  if(hit){placeBtn.down=true;below();}}catch(_){}}
placeBtn();setInterval(placeBtn,700);window.addEventListener('resize',placeBtn);document.addEventListener('fullscreenchange',function(){setTimeout(placeBtn,50);});

var qp=$('qp'),qbody=$('qbody'),qchips=$('qchips'),qa=$('qa'),qprev=$('qprev'),qnext=$('qnext');
var QS=D.qs,SEC=D.sections||{},NAMES=D.names||{};
$('qcnt').textContent=AR(QS.length);
var secKeys=Object.keys(SEC).filter(function(k){return QS.some(function(q){return q.sec===k;});});
if(secKeys.length<2)qchips.style.display='none';
var qsec='all',qi=0,qrev=false,qOpen=false;
var list=function(){return qsec==='all'?QS:QS.filter(function(q){return q.sec===qsec;});};
qchips.innerHTML=[['all','الكل']].concat(secKeys.map(function(k){return [k,SEC[k]];})).map(function(a){return '<button type="button" data-k="'+a[0]+'">'+esc(a[1])+'</button>';}).join('');
qchips.onclick=function(e){var b=e.target.closest('button');if(!b)return;qsec=b.dataset.k;qi=0;qrev=false;render();};

function ansH(a){var h='';if(!a)return h;if(a.p&&!a.tb)h+='<div>'+esc(a.p)+'</div>';
  if(a.ol)h+='<ol>'+a.ol.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ol>';
  if(a.tb)h+='<div class="tbw"><table><tr>'+a.tb.h.map(function(x){return '<th>'+esc(x)+'</th>';}).join('')+'</tr>'+a.tb.r.map(function(r){return '<tr>'+r.map(function(x){return '<td>'+esc(x)+'</td>';}).join('')+'</tr>';}).join('')+'</table></div>';
  if(a.dl)h+='<dl>'+a.dl.map(function(x){return '<dt>'+esc(x[0])+'</dt><dd>'+esc(x[1])+'</dd>';}).join('')+'</dl>';if(a.p&&a.tb)h+='<div class="note">'+esc(a.p)+'</div>';return h;}
var SIM=null;function sim(){return SIM||(SIM=window.MOE_SIM||null);}
function canSee(k){var s=sim();return !!(k&&s&&s.groups&&s.groups[k]);}
function render(){try{render0();}catch(err){qOpen=false;qp.classList.remove('on');$('qbtn').style.display='none';if(window.console)console.warn('MoeLab ministerial:',err);}}
function render0(){
  var L=list(),q=L[qi];
  [].forEach.call(qchips.querySelectorAll('button'),function(b){b.classList.toggle('on',b.dataset.k===qsec);});
  var n=minCount(q);
  var h='<div class="qc'+(qrev?' rev':'')+'"><div class="qtop"><span class="qty">'+esc(q.type)+'</span>'+
    (n>=3?'<span class="qfire">🔥 تكرر وزارياً '+AR(n)+' مرات</span>':'')+'<span class="qnum">'+AR(qi+1)+' / '+AR(L.length)+'</span></div>';
  if(q.tags&&q.tags.length)h+='<div class="tags">'+q.tags.map(tagH).join('')+'</div>';
  h+='<div class="qq">'+esc(q.q).replace(/\{([^}]*)\}/g,'<span class="blank">$1</span>')+'</div>';
  if(q.opts)h+='<div class="opts">'+q.opts.map(function(o,k){return '<button type="button" class="opt'+(qrev&&k===q.ans?' ok':'')+'" data-k="'+k+'">'+'أبجد'[k]+' ) '+esc(o)+'</button>';}).join('')+'</div>';
  if(q.items)h+='<ol class="items">'+q.items.map(function(it){var t=it.tags||[];return '<li>'+esc(it.t)+(t.length?'<div class="tags">'+t.map(tagH).join('')+'</div>':'')+'<div class="ia">'+esc(it.a||q.common||'')+'</div></li>';}).join('')+'</ol>';
  if(q.a)h+='<div class="ans"><div class="h">✔ الجواب</div>'+ansH(q.a)+'</div>';
  if(canSee(q.hl))h+='<div class="see"><button type="button" id="qsee">📍 شوف '+esc(NAMES[q.hl]||'')+' بالمحاكاة</button></div>';
  qbody.innerHTML=h+'</div>';qbody.scrollTop=0;
  qa.textContent=qrev?'إخفاء الحل':'إظهار الحل 💡';qa.classList.toggle('hide',qrev);
  qprev.disabled=qi===0;qnext.disabled=qi>=L.length-1;
  [].forEach.call(qbody.querySelectorAll('.opt'),function(b){b.onclick=function(){if(+b.dataset.k===q.ans){qrev=true;render();}else b.classList.add('no');};});
  var s=$('qsee');if(s)s.onclick=function(){hlStart(q.hl);};
}
qa.onclick=function(){qrev=!qrev;render();};
qprev.onclick=function(){if(qi>0){qi--;qrev=false;render();}};
qnext.onclick=function(){if(qi<list().length-1){qi++;qrev=false;render();}};
function show(on){qOpen=on;qp.classList.toggle('on',on);if(on)render();}
$('qbtn').onclick=function(){hlStop();show(true);};
$('qx').onclick=function(){show(false);};

/* ---------- highlight inside the simulation (only if the sim registered window.MOE_SIM) ---------- */
var HL=null;
function els(keys,map){var a=[];keys.forEach(function(k){(map[k]||[]).forEach(function(e){a.push(e);});});return a;}
function bbox(arr){var x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;arr.forEach(function(e){try{var b=e.getBBox();if(!b.width&&!b.height)return;x0=Math.min(x0,b.x);y0=Math.min(y0,b.y);x1=Math.max(x1,b.x+b.width);y1=Math.max(y1,b.y+b.height);}catch(_){}});return x0<x1?{x0:x0,y0:y0,x1:x1,y1:y1}:null;}
var ease=function(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};
function hlStart(k){
  var s=sim();if(!canSee(k))return;show(false);
  try{s.finish();}catch(_){}
  var parts=s.groups[k],on=els(parts,s.parts),labs=els(parts,s.labels||{});
  var all=els(Object.keys(s.parts),s.parts),allL=els(Object.keys(s.labels||{}),s.labels||{});
  var v=s.view.get(),vb=s.view.box,b=bbox(on.concat(labs)),to=v;
  if(b){var pad=30,cx=(b.x0+b.x1)/2,cy=(b.y0+b.y1)/2,ks=Math.max(1,Math.min(2.6,vb[2]/(b.x1-b.x0+2*pad),vb[3]/(b.y1-b.y0+2*pad)));
    to=[ks,vb[0]+vb[2]/2-cx*ks,vb[1]+vb[3]/2-cy*ks];}
  HL={k:k,s:s,on:new Set(on),labs:new Set(labs),all:all,allL:allL,glows:els(parts,s.glows||{}),t0:performance.now(),from:v,to:to};
  $('hlname').textContent='📍 '+(NAMES[k]||'');
  $('hlbar').classList.add('on');document.body.classList.add('hlmode');
  requestAnimationFrame(tick);
}
function hlStop(){if(!HL)return;var s=HL.s;HL=null;$('hlbar').classList.remove('on');document.body.classList.remove('hlmode');try{s.view.reset();}catch(_){}}
function tick(ms){
  if(!HL)return;
  try{
    var u=(ms-HL.t0)/1000,z=ease(Math.max(0,Math.min(1,u/.8))),L=function(a,b){return a+(b-a)*z;};
    HL.s.view.set(L(HL.from[0],HL.to[0]),L(HL.from[1],HL.to[1]),L(HL.from[2],HL.to[2]));
    var p=.5+.5*Math.sin(u*4.2);
    HL.all.forEach(function(e){if(!HL.on.has(e))e.setAttribute('opacity','0.18');});
    HL.allL.forEach(function(e){e.setAttribute('opacity',HL.labs.has(e)?'1':'0.15');});
    HL.glows.forEach(function(g){g.style.display='';g.setAttribute('opacity',(.35+.45*p).toFixed(2));});
    if(HL.s.pulse)HL.s.pulse(HL.k,p);
  }catch(e){hlStop();return;}
  requestAnimationFrame(tick);
}
$('hlback').onclick=function(){hlStop();show(true);};
/* any simulation button stops the highlight */
['go','prev','zreset'].forEach(function(id){var b=$(id);if(b)b.addEventListener('click',hlStop,true);});

/* keyboard: while the panel is open the arrows move between questions, not the simulation */
window.addEventListener('keydown',function(e){
  if(qOpen){e.stopImmediatePropagation();e.preventDefault();
    if(e.key==='ArrowLeft')qnext.click();else if(e.key==='ArrowRight')qprev.click();else if(e.key==='Escape')show(false);}
  else if(HL&&e.key==='Escape'){hlStop();}
},true);
}catch(err){try{var b=document.getElementById('qbtn');if(b)b.style.display='none';var p=document.getElementById('qp');if(p)p.style.display='none';}catch(_){} if(window.console)console.warn('MoeLab ministerial:',err);}})();
