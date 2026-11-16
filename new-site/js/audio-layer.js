(()=>{"use strict";
const CLIPS=window.CLIPS;
const VOICE={"رنا":["المعلمة رنا","#174cc4"],"الطفل":["الطفل","#c97a00"],"الطفلة":["الطفلة","#b3338a"],"العصفور":["العصفور","#0b8f78"]};
const LET=[["ألف","أ"],["باء","ب"],["جيم","ج"],["دال","د"],["ميم","م"]];
const tx=k=>CLIPS[k]?LET.reduce((s,[w,l])=>s.replace(new RegExp("(?<![\\u0621-\\u064A])((?:[وبلكف]|ال)?)"+w+"(?![\\u0621-\\u064A])","g"),"$1"+l),CLIPS[k].t):"";
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const chip=(k,t="استمع")=>`<button type="button" class="chip" data-clip="${k}">${ICON}<span>${t}</span></button>`;
const L="l01-",G=window;
/* ---------- محرّك الصوت ---------- */
const el=new Audio();el.preload="auto";let queue=[],token=0,last=[];
const dock=document.createElement("div");dock.className="dock";dock.dataset.state="idle";
dock.innerHTML=`<button id="dk-listen" type="button">${ICON}<span>استمع إلى هذه الشاشة</span></button><div class="now" role="status"><span class="bars" aria-hidden="true"><i></i><i></i><i></i></span><b class="who"></b><span class="cap"></span></div><button id="dk-replay" class="plain" type="button" hidden>↻ أعد</button><button id="dk-stop" class="plain" type="button" aria-label="أوقف الصوت">■</button>`;
document.body.append(dock);
const setDock=k=>{dock.dataset.state=k?"play":"idle";if(!k)return;const[n,c]=VOICE[CLIPS[k].v]||VOICE["رنا"];dock.style.setProperty("--who",c);$(".who",dock).textContent=n;$(".cap",dock).textContent=tx(k);};
function stop(){token++;queue=[];el.pause();setDock(null);}
function next(t){if(t!==token)return;const k=queue.shift();if(!k){setDock(null);return;}setDock(k);el.src="audio/"+k+".mp3";
 el.play().catch(e=>{if(e.name==="NotAllowedError"){stop();return;}setTimeout(()=>next(t),2800);});}
function play(keys){keys=[].concat(keys).filter(k=>CLIPS[k]);if(!keys.length)return;stop();last=keys;$("#dk-replay").hidden=false;queue=[...keys];next(token);}
el.addEventListener("ended",()=>next(token));el.addEventListener("error",()=>setTimeout(()=>next(token),2800));
const auto=keys=>{if(audioEnabled)play(keys);};
G.stopAudio=()=>{stop();};
G.readArabic=(text,un)=>{if(text===greeting)return play("ui-01-welcome");const i=handInstructions.findIndex(h=>h.text===text);if(i>=0)return play(L+"04-explain-0"+(i+1)+"-"+["segment","ray","line"][i]);un&&un();};
/* ---------- الشاشة الحالية ---------- */
function screen(){const[r="home",id,l,st]=location.hash.slice(1).split("/");const q=s=>$(s,content);
 if(r===""||r==="home")return["ui-01-welcome"];if(r==="worlds")return["ui-03-worlds","ui-16-world-choice"];
 if(r==="world")return[id==="geometry"?"ui-04-geometry":"ui-05-data"];
 const pg={lab:["ui-06-lab","ui-19-lab-help"],challenges:["ui-07-challenges","ui-20-challenges-help"],progress:["ui-08-progress","ui-21-progress-review"],about:["ui-09-about"]}[r];if(pg)return pg;
 if(r!=="lesson")return[];
 if(id==="geometry"&&l==="0"){const mode=q(".drawing-panel")?.dataset.mode||"ray";
  if(!st)return[L+"01-goals-intro",...["distinguish","draw","name"].map(x=>L+"01-goals-"+x)];
  if(st==="warmup")return[L+"02-warmup-prompt"];if(st==="explore")return[L+"03-explore-prompt"];
  if(st==="explain"){const i=+(q(".hand-guide")?.dataset.handInstruction||0);return[...(i?[]:[L+"04-explain-intro"]),L+"04-explain-0"+(i+1)+"-"+["segment","ray","line"][i]];}
  if(st==="experiment")return[L+"05-clock-prompt"];if(st==="drawing")return[L+"05-draw-"+mode+"-prompt"];
  if(st==="application"){const i=+(q(".application-panel")?.dataset.example||0);return[...(i?[]:[L+"06-apply-intro"]),L+"06-apply-"+["ray","segment","line"][i]+"-question"];}
  if(st==="naming"||st==="assessment-ray")return[L+"07-name-ray-prompt"];
  if(st==="naming-segment"||st==="assessment-segment")return[L+"07-name-segment-prompt"];
  if(st==="naming-line"||st==="assessment-line")return[L+"07-name-line-prompt"];
  if(st==="formative"){const i=+(q(".formative-panel")?.dataset.question||0);return[...(i?[]:[L+"08-quiz-intro"]),L+"08-quiz-q0"+(i+1)];}
  if(st.startsWith("assessment-drawing"))return[L+"08-quiz-draw-"+mode];
  if(st==="review")return[L+"09-review-intro"];if(st==="review-answers")return[L+"09-review-how"];if(st==="summary")return[L+"10-summary-intro"];return[];}
 const n=+l,st2=id==="geometry"?["station-geometry-02-angles","station-geometry-03-quadrilaterals","station-geometry-04-triangle","station-geometry-05-review"][n-1]:["station-data-01-pictures","station-data-02-tables","station-data-03-review"][n];
 return[st2,"ui-22-station-preview"];}
/* ---------- رسالة تغذية راجعة: نص + صوت + احتفال ---------- */
function say(f,keys,o={}){keys=[].concat(keys);if(f){f.textContent=keys.map(tx).join(" ");
  if(f.dataset.result==="success"&&!matchMedia("(prefers-reduced-motion:reduce)").matches){const c=f.closest(".apply-feedback-card");for(let i=0;i<9;i++){const s=document.createElement("span");s.className="spark";s.textContent="★";s.style.setProperty("--dx",(Math.random()*160-80)+"px");s.style.setProperty("--dy",(-30-Math.random()*60)+"px");c?.append(s);setTimeout(()=>s.remove(),1000);}}}
 if(o.silent!==true)auto(keys);}
const fbOf=p=>$(".apply-feedback",p);
const wrap=(name,fn)=>{const o=G[name];G[name]=function(...a){const r=o.apply(this,a);fn(r,...a);return r;};};
/* التطبيق */
wrap("handleApplication",(_,c)=>{const a=c.dataset.action;const p=c.closest(".application-panel");if(a==="apply-next"){decorate();auto(screen());return;}
 if(a!=="apply-check"&&a!=="apply-hint")return;const i=+p.dataset.example,sh=applicationExamples[i].shape,f=fbOf(p),t=f.textContent,P=L+"06-apply-";let k;
 if(a==="apply-hint")k=P+sh+"-hint";else if(f.dataset.result==="success")k=P+sh+"-correct";else if(t.startsWith("اختر اسم الشكل أولًا"))k=P+"missing-shape";
 else if(t.startsWith("اسم الشكل صحيح"))k=P+"fix-points";else if(t.startsWith("اختيار النقاط صحيح"))k=P+"fix-shape";else if(t.startsWith("حاول مرة"))k=P+"retry";else k=P+"missing-points";
 say(f,i===2&&f.dataset.result==="success"?[k,P+"done"]:k);});
/* أسئلة التمييز */
wrap("handleFormative",(_,c)=>{const a=c.dataset.action;const p=c.closest(".formative-panel");if(a==="quiz-next"){decorate();auto(screen());return;}
 if(a!=="quiz-check"&&a!=="quiz-hint")return;const i=+p.dataset.question,f=fbOf(p),Q=L+"08-quiz-q0"+(i+1);let k;
 if(a==="quiz-hint")k=Q+"-hint";else if(f.dataset.result==="success")k=i===2?[Q+"-correct",L+"08-quiz-next-drawing"]:Q+"-correct";else k=f.textContent.startsWith("اختر إجابة")?L+"08-quiz-missing":L+"08-quiz-retry";say(f,k);});
/* التسمية */
wrap("handleNaming",(_,c)=>{const a=c.dataset.action;if(a!=="naming-check"&&a!=="naming-hint")return;const p=c.closest(".naming-panel"),f=fbOf(p),m=p.dataset.mode||"ray",as=p.dataset.assessment!==undefined,s=(p.dataset.selection||"").split("").filter(Boolean),P=L+"07-name-";let k;
 if(a==="naming-hint")k=P+m+"-hint";else if(f.dataset.result==="success"){k=m==="ray"?P+"ray-"+({"ب":"ab","ج":"ac","د":"ad"}[s[1]])+"-correct":P+m+"-correct";
  if(m==="line"&&!as)k=[k,P+"application-done"];if(m==="ray"&&as)k=[k,P+"assessment-done"];}
 else k=s.length<2?P+"missing-point":m==="ray"?P+"ray-retry":L+"08-quiz-retry";say(f,k);});
/* الرسم */
wrap("handleDrawing",(_,c)=>{const a=c.dataset.action,p=c.closest(".drawing-panel"),f=$(".drawing-feedback",p),t=f.textContent,m=p.dataset.mode,as=p.dataset.assessment!==undefined;
 if(a==="drawing-mode"){auto(screen());return;}
 if(t==="اختر نقطة ثانية مختلفة.")return say(f,L+"05-draw-second-point");
 if(a!=="drawing-arrow"&&a!=="drawing-check")return;let k;
 if(t.startsWith("ارسم الخط أولًا"))k=as?L+"08-quiz-draw-empty":null;
 else if(t.startsWith("أحسنت")){k=as?[L+"08-quiz-draw-"+m+"-correct",L+"08-quiz-draw-done"]:[L+"05-draw-"+m+"-correct"];
  if(!as&&!$('[data-action="application"]',p.parentElement).disabled)k.push(L+"05-draw-done");}
 else if(t.startsWith("اترك نقطة"))k=L+"05-draw-ray-arrows";else if(t.startsWith("ضع سهمًا"))k=L+"05-draw-line-arrows";
 if(k)say(f,k);});
const _fd=G.finishDrawing;G.finishDrawing=function(p,o,tip){const ok=validDrawing(o,tip,drawingMarks(p));_fd(p,o,tip);if(ok)return;const as=p.dataset.assessment!==undefined,m=p.dataset.mode;
 say($(".drawing-feedback",p),as?L+"08-quiz-draw-"+m+"-retry":Math.hypot(tip[0]-o[0],tip[1]-o[1])<65?L+"05-draw-short-stroke":L+"05-draw-miss-points");};
const _bd=G.beginDrawing;G.beginDrawing=function(b,s,id){const r=_bd(b,s,id);if(!r){const p=b.closest(".drawing-panel");if(p.dataset.drawn)return r;
 if(p.dataset.mode==="ray")say($(".drawing-feedback",p),L+"05-draw-wrong-origin");else if(drawingMarks(p).length<2)say($(".drawing-feedback",p),L+"05-draw-second-point");}return r;};
/* الاستكشاف والتجريب والشرح */
wrap("updatePoints",(_,p,pt)=>{const f=$(".explore-feedback",p),b=$$(".explore-point",p),s=b.find(x=>x.dataset.endpoint==="start"),e=b.find(x=>x.dataset.endpoint==="end"),n=["a","b","c"];
 if(!pt)return say(f,L+"03-explore-reset");say(f,e?L+"03-explore-"+n[s.dataset.point]+"-"+n[e.dataset.point]:L+"03-explore-choose-second");});
wrap("rotateRay",(_,p,ann)=>{if(!ann||+$("#ray-angle",p).value===-30)return;const f=$(".ray-observation",p);f.textContent=tx(L+"05-clock-observation")+" "+tx(L+"05-clock-next");
 if(!p.dataset.heard){p.dataset.heard="1";auto([L+"05-clock-observation",L+"05-clock-next"]);}});
wrap("completeHandStep",(_,g)=>{const l=g.closest(".warmup");if(!$('[data-action="experiment"]',l).disabled){$(".hand-progress",g).textContent=tx(L+"04-explain-done");auto(L+"04-explain-done");}
 else auto(screen().slice(-1));});
const FIX={"اقبض اليدين على الشاشة.":"fix-segment","افتح اليد على يسار الشاشة واترك اليد اليمنى مقبوضة.":"fix-ray","افتح اليدين على الشاشة.":"fix-line"};
const _msg=G.message;G.message=t=>{const k=FIX[t];if(k){_msg(tx(L+"04-explain-"+k));auto(L+"04-explain-"+k);}else _msg(t);};
/* ---------- أزرار الاستماع والمساعدة ---------- */
const help=document.createElement("div");help.className="helpbox";help.hidden=true;help.setAttribute("role","dialog");help.setAttribute("aria-label","مركز المساعدة");
help.innerHTML="<h2>كيف أستخدم المنصّة؟</h2><ul>"+[["ui-02-help","الخطوات"],["ui-12-help-lesson-steps","رحلة التعلّم"],["ui-13-help-audio","التحكم بالصوت"],["ui-14-help-hints","التلميحات"],["ui-15-help-feedback","التحقّق والتغذية الراجعة"]].map(([k,t])=>`<li><span>${t}</span>${chip(k)}</li>`).join("")+"</ul>";
document.body.append(help);
const hb=document.createElement("button");hb.className="hbtn";hb.type="button";hb.textContent="مساعدة";hb.setAttribute("aria-expanded","false");$(".bar").insertBefore(hb,$("#audio"));
hb.onclick=()=>{help.hidden=!help.hidden;hb.setAttribute("aria-expanded",String(!help.hidden));};
function add(sel,k,label,pos="append"){$$(sel,content).forEach((n,i)=>{const key=typeof k==="function"?k(n,i):k;if(!key||$(`.chip[data-clip="${key}"]`,pos==="append"?n:n.parentElement)&&pos==="append"||(pos!=="append"&&n.nextElementSibling?.matches(".chip")))return;n.insertAdjacentHTML(pos==="append"?"beforeend":"afterend",chip(key,label));});}
function decorate(){const[r,id,l,st]=location.hash.slice(1).split("/");
 $$("#welcome-text p",content).forEach(p=>{if(p.textContent.trim()===greeting)p.textContent=tx("ui-01-welcome");});
 if(!r||r==="home"){add(".hero .intro p","ui-10-cover-title","اقرأ العنوان","after");add(".hero .actions","ui-11-cover-start","العصفور يدعوك");add("main .cards details:first-child summary","ui-02-help");}
 if(r==="worlds"){add(".map-card.geometry h3,.map-card:first-child .station-heading","ui-17-geometry-stations");add(".map-card.data .station-heading,.map-card:nth-child(2) .station-heading","ui-18-data-stations");}
 if(r==="world")add(".world-detail .hero h1",id==="geometry"?"ui-17-geometry-stations":"ui-18-data-stations","استمع إلى المحطات");
 if(r!=="lesson"||id!=="geometry"||l!=="0")return;
 if(!st)add(".objectives-list li",(n,i)=>L+"01-goals-"+["distinguish","draw","name"][i]);
 if(st==="warmup"&&!$(".warm-hint",content)){$(".warmup-panel>a.button",content).insertAdjacentHTML("beforebegin",'<button type="button" class="button secondary warm-hint">أعطني تلميحًا</button> ');}
 if(st==="review"){add(".achievement-legend p",(n,i)=>[L+"09-review-first-try",L+"09-review-after-retry"][i]);add(".review-actions",L+"09-review-pending-star","ماذا تعني النجمة الرمادية؟");add(".review-actions",L+"09-review-keep-practicing","ماذا أفعل بعد ذلك؟");}
 if(st==="review-answers"){add("details",(n)=>$(".review-drawings",n)?L+"09-review-drawing":null,"كيف أقارن رسمي؟");add("section.warmup-panel > h2",L+"09-review-return-map","وكيف أعود؟");}
 if(st==="summary"){add(".summary-card",(n,i)=>L+"10-summary-"+["segment","ray","line"][i]);add("article.warmup>.actions",L+"10-summary-finish","رسالة العصفور");}}
document.addEventListener("click",e=>{const c=e.target.closest("[data-clip]");if(c){play(c.dataset.clip);return;}
 if(e.target.closest(".warm-hint")){const p=$(".warmup-panel",content);if(!$(".apply-feedback-card",p))p.insertAdjacentHTML("beforeend",characterFeedback());const f=fbOf(p);f.dataset.result="bird";say(f,L+"02-warmup-hint");return;}
 if(!help.hidden&&!e.target.closest(".helpbox,.hbtn"))hb.click();});
$("#dk-listen").onclick=()=>play(screen());$("#dk-replay").onclick=()=>play(last);$("#dk-stop").onclick=stop;
$("#audio").addEventListener("click",()=>{if(audioEnabled&&!["","#home"].includes(location.hash))play(screen());});
const _render=G.render;G.render=function(m){_render(m);decorate();if(m)auto(screen());};
handInstructions.forEach((h,i)=>{h.text=tx(L+"04-explain-0"+(i+1)+"-"+["segment","ray","line"][i]);});
formativeQuestions.forEach((q,i)=>{q.hint=tx(L+"08-quiz-q0"+(i+1)+"-hint");});
decorate();
})();
