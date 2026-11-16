"use strict";

const worlds = {
  geometry: {
    title: "عالم الهندسة والقياس", icon: "△", unit: "الوحدة الرابعة",
    description: "تأمّل الخطوط والزوايا واكتشف الأشكال من حولك.",
    lessons: ["الشعاع والمستقيم", "الزاوية وأنواعها", "المستطيل والمربع", "المثلث", "المراجعة الشاملة"]
  },
  data: {
    title: "عالم البيانات", icon: "▥", unit: "الوحدة الخامسة",
    description: "نظّم المعلومات واقرأ ما تخبرك به الصور والجداول.",
    lessons: ["البيانات وتمثيلها بالصور", "تمثيل البيانات بالجداول", "المراجعة الشاملة"]
  }
};

const poses = {welcome: "assets/images/img-01.webp", explain: null, think: null, experiment: null, celebrate: null};
const steps = ["التهيئة", "الاستكشاف", "الشرح", "التجريب", "التطبيق", "التقويم التكويني", "الملخص"];
const number = new Intl.NumberFormat("ar-PS");
const content = document.querySelector("#content");
const audio = document.querySelector("#audio");
const notice = document.querySelector("#notice");
const greeting = "أهلًا بك في مغامرات الرياضيات. أنا المعلمة رنا. افتح خريطة العوالم واختر عالمًا لتبدأ رحلتك.";
const audioActions = '<button class="button secondary" data-action="read">استمع إلى الترحيب</button><button class="button secondary" data-action="stop">أوقف القراءة</button>';
const store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem("math-adventure.v1." + key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem("math-adventure.v1." + key, JSON.stringify(value)); return true; }
    catch { return false; }
  }
};
let audioEnabled = store.get("audio", false) === true;
let destinations = store.get("worlds", []);
destinations = Array.isArray(destinations) ? destinations.filter(id => Object.hasOwn(worlds, id)) : [];
const assessmentLog = store.get("geometry-0-varied-assessment", {});
const reviewStages = {distinguish:"formative", draw:"assessment-drawing", name:"assessment-ray"};

function recordAssessment(group, key, title, correct, answer, explanation, drawing = null) {
  const id = group + ":" + key;
  const attempt = {correct, answer, explanation, drawing};
  const previous = assessmentLog[id];
  assessmentLog[id] = {group, title, first: previous?.first || attempt, latest: attempt, solved: Boolean(previous?.solved || correct)};
  store.set("geometry-0-varied-assessment", assessmentLog);
}

let noticeTimer;

function message(text) {
  notice.textContent = text;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { notice.textContent = ""; }, 6500);
}

function stopAudio() {
  window.speechSynthesis?.cancel();
}

function readArabic(text, onUnavailable) {
  stopAudio();
  const voice = window.speechSynthesis?.getVoices().find(item => /^ar(?:[-_]|$)/i.test(item.lang) && item.localService);
  if (!voice || !window.SpeechSynthesisUtterance) {
    onUnavailable();
    return;
  }
  const speech = new SpeechSynthesisUtterance(text);
  speech.voice = voice;
  speech.lang = voice.lang;
  speech.rate = 0.88;
  speech.onerror = event => {
    if (!["canceled", "interrupted"].includes(event.error)) onUnavailable();
  };
  window.speechSynthesis.speak(speech);
}

function readGreeting() {
  readArabic(greeting, () => {
    message("القراءة الصوتية تحتاج إلى صوت عربي مثبّت على جهازك. يمكنك قراءة نص الترحيب أدناه.");
    document.querySelector("#welcome-text")?.setAttribute("open", "");
  });
}

function updateAudio(enabled) {
  audioEnabled = enabled;
  store.set("audio", enabled);
  audio.setAttribute("aria-pressed", String(enabled));
  audio.textContent = enabled ? "الصوت مفعّل" : "الصوت متوقف";
  if (!enabled) stopAudio();
}

function worldCards() {
  return `<div class="cards">${Object.entries(worlds).map(([id, world]) => `
    <a class="card world ${id}" href="#world/${id}">
      <span class="symbol" aria-hidden="true">${world.icon}</span>
      <div><h3>${world.title}</h3><p>${world.description}</p><span class="status">${number.format(world.lessons.length)} محطات · ${destinations.includes(id) ? "زرت هذا العالم" : "جاهز للاستكشاف"}</span></div>
      <span class="arrow" aria-hidden="true">←</span>
    </a>`).join("")}</div>`;
}

const worldScenes = {geometry: "assets/images/img-02.webp", data: "assets/images/img-03.webp"};

function worldsMap() {
  const cards = Object.entries(worlds).map(([id, world]) => `
    <section class="map-card ${id}" aria-labelledby="map-${id}">
      <h2 id="map-${id}">${world.title}</h2>
      <p>${world.description}</p>
      <span class="status">${number.format(world.lessons.length)} محطات${destinations.includes(id) ? " · زرت هذا العالم" : ""}</span>
      <h3 class="station-heading">محطات العالم</h3>
      <div class="station-layout">
        <ol class="station-list">${world.lessons.map((title, i) => `
          <li><a href="#lesson/${id}/${i}"><span class="map-number">${number.format(i + 1)}</span><strong>${title}</strong></a></li>`).join("")}</ol>
        <img class="map-scene" src="${worldScenes[id]}" alt="">
      </div>
      <a class="button" href="#world/${id}">افتح هذا العالم</a>
    </section>`).join("");
  return `<article class="world-map"><div class="map-intro">
    <a href="#home">الرئيسية</a>
    <h1>خريطة العوالم</h1><p>اختر عالمًا، وافتح إحدى محطاته لتبدأ الاستكشاف.</p>
  </div><div class="cards map-cards">${cards}</div></article>`;
}

function page(title, body, lead = "") {
  return `<article class="page"><h1>${title}</h1>${lead ? `<p>${lead}</p>` : ""}${body}</article>`;
}

function home() {
  return `<section class="hero"><div class="intro">
      <span class="tag">من كتاب الرياضيات الفلسطيني · الجزء الأول</span>
      <h1>مغامرات الرياضيات<span>اكتشف، جرّب، وتحدَّ!</span></h1>
      <p>انطلق مع المعلمة رنا وأصدقائها في رحلة بين الأشكال والبيانات. اختر عالمك واكتشف محطاته خطوة بخطوة.</p>
      <div class="actions"><a class="button" href="#worlds">ابدأ المغامرة ←</a><button class="button secondary" data-action="read">استمع إلى الترحيب</button></div>
    </div><img class="hero-art" src="${poses.welcome}" alt="المعلمة رنا بثوب فلسطيني مطرّز تشير إلى أشكال ورسوم بيانية على لوحة، بجوار طفل وطفلة وطائر أزرق"></section>
    <section class="section" aria-labelledby="world-heading"><div class="section-head"><h2 id="world-heading">إلى أي عالم ستذهب؟</h2><p>يمكنك البدء بأيٍّ من العالمين.</p></div>${worldCards()}</section>
    <section class="section cards" aria-label="المساعدة"><details><summary>كيف أستخدم المنصة؟</summary><p>افتح خريطة العوالم، ثم اختر عالمًا ومحطة. يمكنك استخدام اللمس أو مفتاح التنقّل Tab ثم مفتاح الإدخال. ستجد زياراتك في ملف الإنجاز.</p></details>
    <details id="welcome-text"><summary>نص الترحيب والتحكم بالقراءة</summary><p>${greeting}</p><div class="actions">${audioActions}</div></details></section>`;
}

function worldPage(id, world) {
  if (!destinations.includes(id)) {
    destinations.push(id);
    if (!store.set("worlds", destinations)) message("تعذّر حفظ الزيارة على هذا الجهاز. ستظل ظاهرة أثناء هذه الجلسة.");
  }
  const isGeometry = id === "geometry";
  const summaries = isGeometry ? [
    "اكتشف الفرق بين الشعاع والمستقيم.", "تأمّل الزوايا وصنّفها.",
    "قارن بين خصائص الشكلين.", "استكشف أضلاع المثلث ورؤوسه.", "راجع ما تعلّمته في العالم."
  ] : [
    "رتّب البطاقات واقرأ التمثيل بالصور.", "نظّم المعلومات في صفوف وأعمدة.", "راجع ما تعلّمته في العالم."
  ];
  const sceneDescription = isGeometry
    ? "المعلمة رنا تشير إلى زاوية قائمة والطفل يركّب الأشكال"
    : "الطفلة ترتّب بطاقات التفاح والكمثرى والعصفور يحلّق فوق اللوحة";
  const stationHeading = isGeometry ? "محطات عالم الهندسة" : "محطات عالم البيانات";
  return `<article class="world-detail ${id}">
    <section class="hero">
      <div class="intro">
        <a class="tag" href="#worlds">العودة إلى خريطة العوالم</a>
        <h1>${world.title}</h1><p>${world.description}</p>
        <div class="actions"><a class="button" href="#lesson/${id}/0">ابدأ من المحطة الأولى</a></div>
      </div>
      <img class="hero-art" src="${worldScenes[id]}" alt="${sceneDescription}">
    </section>
    <section class="section"><h2>${stationHeading}</h2>
      <ol class="lesson-list world-stations">${world.lessons.map((title, i) => `
        <li><a href="#lesson/${id}/${i}"><span class="station-number">${number.format(i + 1)}</span>
        <strong>${title}</strong><span class="station-summary">${summaries[i]}</span>
        <span aria-hidden="true" class="arrow">‹</span></a></li>`).join("")}</ol>
    </section>
  </article>`;
}

function journeyHeader(world, active) {
  return `    <div class="warmup-heading">
      <a class="tag" href="#world/geometry">العودة إلى ${world.title}</a>
      <h1>${world.lessons[0]}</h1><p>المحطة الأولى من ${world.title}</p>
    </div>
    <h2 class="journey-heading">رحلة التعلّم</h2>
    <ol class="journey-steps">${["الأهداف", ...steps].map((step,i) =>
      `<li${i === active + 1 ? ' aria-current="step"' : ""}>${step}</li>`).join("")}</ol>`;
}

function edgesObjectives(world) {
  const goals = [
    ["أميّز", "القطعة المستقيمة والشعاع والمستقيم من النقاط والأسهم."],
    ["أرسم", "شعاعًا يبدأ من نقطة، ومستقيمًا يمتد في اتجاهين."],
    ["أسمّي", "الأشكال في الرسم باستخدام حروف النقاط."]
  ];
  return `<article class="warmup">
    ${journeyHeader(world, -1)}
    <section class="warmup-panel objectives-panel" aria-labelledby="objectives-title">
      <div><span class="tag">أهداف الدرس</span><h2 id="objectives-title">في نهاية رحلتي سأستطيع أن</h2>
        <ol class="objectives-list">${goals.map(([verb, detail], i) => `<li>
          <span class="objective-number" aria-hidden="true">${number.format(i + 1)}</span>
          <div><strong>${verb}</strong><p>${detail}</p></div></li>`).join("")}</ol>
        <a class="button" href="#lesson/geometry/0/warmup">ابدأ التهيئة</a>
      </div>
      <img src="assets/images/img-04.webp" alt="المعلمة رنا تفتح دفتر الرحلة والطفل يشير إلى إحدى صفحاته">
    </section>
  </article>`;
}

function edgesWarmup(world) {
  const objects = [
    ["المسطرة", "assets/images/img-05.webp"],
    ["الكتاب", "assets/images/img-06.webp"],
    ["السبورة", "assets/images/img-07.webp"]
  ];
  return `<article class="warmup">
    ${journeyHeader(world, 0)}
    <section class="warmup-panel" aria-labelledby="edges-question">
      <div class="warmup-intro">
        <div><span class="tag">التهيئة</span><h2 id="edges-question">أين تجد الحافّة؟</h2>
        <p>أشر إلى حافّة في كل صورة.</p><p>من أين تبدأ الحافّة؟ وأين تنتهي؟</p></div>
        <img class="warmup-characters" src="assets/images/img-08.webp" alt="المعلمة رنا تطرح سؤالًا والطفل يفكّر">
      </div>
      <div class="warmup-objects">${objects.map(([name,src]) =>
        `<figure><img src="${src}" alt=""><figcaption>${name}</figcaption></figure>`).join("")}</div>
      <a class="button" href="#lesson/geometry/0/explore">انتقل إلى الاستكشاف</a>
    </section>
  </article>`;
}

function edgesExplore(world) {
  return `<article class="warmup">
    ${journeyHeader(world, 1)}
    <section class="warmup-panel explore-panel" aria-labelledby="explore-title">
      <div class="explore-content">
        <span class="tag">الاستكشاف</span>
        <h2 id="explore-title">لوّن الجزء بين نقطتين</h2>
        <p>اختر أي نقطتين مختلفتين. الأولى بداية اختيارك، والثانية نهايته.</p>
        <div class="explore-track" role="group" aria-label="النقاط على الخط">
          <div class="explore-rail" aria-hidden="true"></div>
          <div class="explore-highlight" aria-hidden="true" hidden></div>
          ${["أ", "ب", "ج"].map((name, i) => `
            <button type="button" class="explore-point point-${i}" data-action="point"
              data-point="${i}" aria-pressed="false"><span aria-hidden="true"></span>${name}</button>`).join("")}
        </div>
        <div class="explore-legend"><span class="legend-start">البداية</span><span class="legend-end">النهاية</span></div>
        <p class="explore-feedback" role="status"></p>
        <div class="actions">
          <button type="button" class="button secondary" data-action="reset-points">أعد الاختيار</button>
          <button type="button" class="button" data-action="explain" disabled>انتقل إلى الشرح</button>
        </div>
      </div>
      <img class="explore-art" src="assets/images/img-09.webp" alt="الطفل يلوّن الجزء بين نقطتين بإصبعه على شاشة الهاتف">
    </section>
  </article>`;
}

function updatePoints(panel, point) {
  const buttons = Array.from(panel.querySelectorAll(".explore-point"));
  const start = buttons.find(button => button.dataset.endpoint === "start");
  const end = buttons.find(button => button.dataset.endpoint === "end");
  let selection = [start, end].filter(Boolean);
  if (!point) selection = [];
  else if (selection.includes(point)) selection = selection.filter(button => button !== point);
  else if (selection.length === 2) selection = [point];
  else selection.push(point);

  const [first, second] = selection;
  for (const button of buttons) {
    const role = button === first ? "start" : button === second ? "end" : "";
    button.dataset.endpoint = role;
    button.setAttribute("aria-pressed", String(Boolean(role)));
    const label = button.textContent.trim();
    button.setAttribute("aria-label", role === "start" ? `${label}، البداية`
      : role === "end" ? `${label}، النهاية` : label);
  }

  const highlight = panel.querySelector(".explore-highlight");
  const feedback = panel.querySelector(".explore-feedback");
  highlight.hidden = !second;
  if (second) {
    const from = Number(first.dataset.point);
    const to = Number(second.dataset.point);
    highlight.style.setProperty("--from", (16 + 30 * Math.min(from, to)) + "%");
    highlight.style.setProperty("--length", (30 * Math.abs(from - to)) + "%");
    feedback.textContent = `بدأتَ عند النقطة ${first.textContent.trim()}، وانتهيتَ عند النقطة ${second.textContent.trim()}.`;
  } else {
    feedback.textContent = first ? `بدأتَ عند النقطة ${first.textContent.trim()}. اختر نقطة ثانية.` : "";
  }
  panel.querySelector('[data-action="explain"]').disabled = !second;
}

const handPoses = ["assets/images/img-10.webp", "assets/images/img-11.webp", "assets/images/img-12.webp", "assets/images/img-13.webp"];

const extendedArmsPose = "assets/images/img-14.webp";

const handInstructions = [
  {title: "القطعة المستقيمة", pose: 3, prompt: "اقبض اليدين على الشاشة.",
    text: "اضغط على كل يد حتى تقبض اليدين. ظهرت نقطتان، والجزء الواصل بينهما اسمه قطعة مستقيمة."},
  {title: "الشعاع", pose: 2, prompt: "افتح اليد على يسار الشاشة واترك اليد اليمنى مقبوضة.",
    text: "افتح اليد على يسار الشاشة، واترك اليد على يمين الشاشة مقبوضة. يبدأ الشعاع عند القبضة ويمتد باتجاه السهم."},
  {title: "المستقيم", pose: 0, prompt: "افتح اليدين على الشاشة.",
    text: "افتح اليد الثانية أيضًا. شاهد الطفل وهو يمدّ ذراعيه، ولاحظ السهمين. يمتد المستقيم بلا نهاية في الاتجاهين."}
];

function completeHandStep(guide) {
  const index = Number(guide.dataset.handInstruction);
  const steps = [...guide.querySelectorAll("[data-hand-step]")];
  if (steps[index].dataset.done === "true") return;
  steps[index].dataset.done = "true";
  steps[index].textContent += " · تمّ";
  steps[index].removeAttribute("aria-current");
  const status = guide.querySelector(".hand-progress");
  const lesson = guide.closest(".warmup");
  const following = handInstructions[index + 1];
  if (following) {
    guide.dataset.handInstruction = String(index + 1);
    steps[index + 1].setAttribute("aria-current", "step");
    guide.querySelector(".hand-instruction").textContent = following.text;
    status.textContent = `الآن: ${following.title}. استمع أو اقرأ التوجيه وطبّقه.`;
    guide.querySelector('[data-action="hand-listen"]').focus();
  } else {
    const next = lesson.querySelector('[data-action="experiment"]');
    next.disabled = false;
    lesson.querySelector('[data-action="hand-read"]').disabled = true;
    status.textContent = "أكملتَ الشرح. يمكنك الانتقال إلى التجريب.";
    next.focus();
  }
}

function edgesExplain(world) {
  return `<article class="warmup">
    ${journeyHeader(world, 2)}
    <h2>استمع وحرّك يديك</h2><p>استمع أو اقرأ التوجيه، وطبّقه على اليدين، ثم اضغط «أنهيت هذه الخطوة» ليظهر التوجيه التالي.</p>
    <section class="hand-guide" data-hand-instruction="0" aria-label="توجيهات الشرح">
      <ol class="hand-step-choices example-progress" aria-label="خطوات الشرح">
        ${handInstructions.map((step, i) => `<li data-hand-step="${i}" ${i === 0 ? 'aria-current="step"' : ""}>${number.format(i + 1)} · ${step.title}</li>`).join("")}
      </ol>
      <p class="hand-instruction" aria-live="polite">${handInstructions[0].text}</p>
      <div class="actions">
        <button class="button" type="button" data-action="hand-listen">استمع أو أعد الاستماع</button>
        <button class="button secondary" type="button" data-action="hand-stop">أوقف الصوت</button>

      </div>
      <p class="hand-progress" role="status">اضغط «استمع» أو اقرأ التوجيه، ثم طبّقه على اليدين أدناه.</p>
    </section>
    <section class="hands-lab" aria-label="نشاط فتح اليدين وقبضهما">
<div class="figure">
<img id="pose" alt="">
<div class="controls">
<button type="button" id="left" aria-pressed="false">اليد على اليسار</button>
<button type="button" id="right" aria-pressed="false">اليد على اليمين</button>
</div>
</div>
<div id="model" data-shape="line">
<h2 id="name">المستقيم</h2>
<svg viewBox="0 0 330 110" aria-hidden="true">
<path id="shaft" d="M30 55H300" stroke="#6743a0" stroke-width="6" stroke-linecap="round"/>
<path id="arrowL" d="M47 41 30 55 47 69" fill="none" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
<path id="arrowR" d="M283 41 300 55 283 69" fill="none" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
<circle id="dotL" cx="30" cy="55" r="10"/>
<circle id="dotR" cx="300" cy="55" r="10"/>
</svg>
<p id="description" role="status"></p>
</div>
</section>
    <div class="actions"><a class="button secondary" href="#lesson/geometry/0/explore">العودة إلى الاستكشاف</a>
    <button class="button" type="button" data-action="hand-read">أنهيت هذه الخطوة</button>
    <button class="button" data-action="experiment" type="button" disabled>انتقل إلى التجريب</button></div>
  </article>`;
}

function setupHands(panel) {
  const byId = id => panel.querySelector("#" + id);
  const left = byId('left');
  const right = byId('right');
  const handState = button => button.getAttribute('aria-pressed') === 'true';
  function update() {
    const l = handState(left), r = handState(right);
    const state = Number(l) + 2 * Number(r);
    const shape = state === 3 ? 'segment' : state ? 'ray' : 'line';
    const color = {segment:'#174cc4',ray:'#08735c',line:'#6743a0'}[shape];
    const extended = state === 0 && panel.closest?.(".warmup")?.querySelector(".hand-guide").dataset.handInstruction === "2";
    byId('pose').src = extended ? extendedArmsPose : handPoses[state];
    byId('pose').parentElement?.classList.toggle("arms-extended", extended);
    byId('pose').alt = extended ? 'الطفل يمدّ ذراعيه يمينًا ويسارًا بكفّين مفتوحتين' : state === 3 ? 'الطفل يقبض يديه' : state ? 'الطفل يقبض يدًا ويفتح الثانية' : 'الطفل يفتح يديه';
    left.setAttribute('aria-label', 'اليد على اليسار، ' + (l ? 'مقبوضة' : 'مفتوحة'));
    right.setAttribute('aria-label', 'اليد على اليمين، ' + (r ? 'مقبوضة' : 'مفتوحة'));
    byId('model').dataset.shape = shape;
    byId('name').textContent = {segment:'القطعة المستقيمة',ray:'الشعاع',line:'المستقيم'}[shape];
    byId('description').textContent = {
      segment:'قبضتان ونقطتان. الجزء بين النقطتين قطعة مستقيمة.',
      ray:'قبضة واحدة. يبدأ الشعاع عند النقطة ويمتد باتجاه السهم.',
      line:'يدان مفتوحتان. يمتد المستقيم بلا نهاية في الاتجاهين.'
    }[shape];
    for (const id of ['shaft','arrowL','arrowR']) byId(id).setAttribute('stroke',color);
    byId('arrowL').style.display = l ? 'none' : '';
    byId('arrowR').style.display = r ? 'none' : '';
    byId('dotL').style.display = l ? '' : 'none';
    byId('dotR').style.display = r ? '' : 'none';
    byId('dotL').setAttribute('fill','#08735c');
    byId('dotR').setAttribute('fill',l ? '#b94b0a' : '#08735c');
  }
  for (const button of [left,right]) button.addEventListener('click',() => {
    button.setAttribute('aria-pressed',String(!handState(button)));
    update();
  });
  update();
}

function edgesExperiment(world) {
  return `<article class="warmup">
    ${journeyHeader(world, 3)}
    <section class="warmup-panel ray-lab" aria-labelledby="ray-lab-title">
      <div>
        <h2 id="ray-lab-title">غيّر اتجاه الشعاع</h2>
        <p>حرّك المؤشّر بالمنزلق وراقب النقطة الخضراء.</p>
        <p>هل تتحرّك نقطة البداية عندما يتغيّر اتجاه السهم؟</p>
        <label for="ray-angle">اتجاه الشعاع</label>
        <input id="ray-angle" type="range" min="-175" max="180" step="5" value="-30" dir="ltr">
        <p class="ray-observation" role="status"></p>
        <div class="actions">
          <button class="button secondary" type="button" data-action="reset-ray">أعد الاتجاه</button>
          <button class="button" type="button" data-action="drawing" disabled>انتقل إلى الرسم</button>
        </div>
      </div>
      <img class="ray-demo" src="assets/images/img-15.webp" alt="الطفل يشير إلى مؤشر ساعة مثبت عند نقطة خضراء في مركزها">
      <div class="ray-board">
        <svg viewBox="0 0 340 310" role="img" aria-label="شعاع أزرق يدور حول نقطة بدايته الخضراء">
          <circle cx="170" cy="155" r="132" fill="#f7faff" stroke="#b5c9ed" stroke-width="4"/>
          ${Array.from({length:12}, (_, i) => `<path d="M170 35v12" transform="rotate(${i * 30} 170 155)" stroke="#7389ae" stroke-width="3"/>`).join("")}
          <g class="ray-rotation" transform="rotate(-30 170 155)" stroke="#174cc4" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M170 155H275 M259 142L275 155 259 168"/>
          </g>
          <circle cx="170" cy="155" r="8" fill="#08735c"/>
        </svg>
        <p>النقطة الخضراء هي نقطة البداية</p>
      </div>
    </section>
    <div class="actions"><a class="button secondary" href="#lesson/geometry/0/explain">العودة إلى الشرح</a></div>
  </article>`;
}

function rotateRay(panel, announce) {
  const angle = Number(panel.querySelector("#ray-angle").value);
  panel.querySelector(".ray-rotation").setAttribute("transform", `rotate(${angle} 170 155)`);
  const next = panel.querySelector('[data-action="drawing"]');
  if (announce && angle !== -30 && next) next.disabled = false;
  panel.querySelector(".ray-observation").textContent =
    announce ? "نقطة بداية الشعاع ثابتة مهما تغيّر اتجاهه." : "";
}

const drawingOrigin = 17;

function drawingPoint(index) {
  return [50 + (index % 7) * 100, 50 + Math.floor(index / 7) * 100];
}

function validDrawing(origin, tip, marks) {
  const dx = tip[0] - origin[0], dy = tip[1] - origin[1];
  const length = Math.hypot(dx, dy);
  if (length < 65) return false;
  return marks.every(([x, y]) => {
    const px = x - origin[0], py = y - origin[1];
    const along = (px * dx + py * dy) / length;
    return Math.abs(px * dy - py * dx) / length <= 32 && along >= -22 && along <= length + 22;
  });
}

function drawingTaskMarks(mode) {
  return mode === "ray" ? [drawingOrigin, 12] : [8, 26];
}

function edgesDrawing(world, assessment = false, shortMode = "") {
  const mode = shortMode || "ray";
  const fixed = drawingTaskMarks(mode);
  return `<article class="warmup">
    ${journeyHeader(world, assessment ? 5 : 3)}
    <section class="warmup-panel drawing-panel" data-mode="${mode}" ${shortMode ? "data-short" : ""} ${assessment ? "data-assessment" : ""} aria-labelledby="drawing-title">
      <div class="drawing-controls">
        <div class="drawing-heading">
          <img src="assets/images/img-16.webp" alt="الطفل يرسم بقلم على دفتر مربّعات">
          <div><h2 id="drawing-title">${assessment ? "مهمّة الرسم في التقويم" : "ارسم على الشبكة"}</h2><p>اسحب إصبعك أو المؤشر لترسم.</p></div>
        </div>
        <div class="actions drawing-modes" role="group" aria-label="مهمّتا الرسم" ${shortMode ? "hidden" : ""}>
          <button class="button secondary" type="button" data-action="drawing-mode" data-mode="ray" aria-pressed="${mode === "ray"}">١ · ارسم شعاعًا</button>
          <button class="button secondary" type="button" data-action="drawing-mode" data-mode="line" aria-pressed="${mode === "line"}">٢ · ارسم مستقيمًا</button>
        </div>
        <p class="drawing-instruction">${assessment ? (mode === "ray" ? "ارسم شعاعًا يبدأ من أ ويمرّ بب، ثم أضف السهم في مكانه." : "ارسم مستقيمًا يمرّ بأ وب، ثم أضف الأسهم.") : "ابدأ من أ واسحب لترسم، ثم أضف سهمًا عند الطرف الثاني."}</p>
        <p class="drawing-feedback" role="status"></p>
        <div class="actions drawing-arrows" role="group" aria-label="أضف الأسهم">
          <button class="button secondary" type="button" data-action="drawing-arrow" data-arrow="start" aria-pressed="false" disabled>سهم عند الطرف الأول</button>
          <button class="button secondary" type="button" data-action="drawing-arrow" data-arrow="end" aria-pressed="false" disabled>سهم عند الطرف الثاني</button>
        </div>
        <div class="actions">
          <button class="button secondary" type="button" data-action="drawing-clear">امسح الرسم</button>
          ${assessment ? '<button class="button secondary" type="button" data-action="drawing-check">تحقّق من رسمي</button>' : ""}
          <button class="button" type="button" data-action="application" ${assessment ? "data-assessment-next" : ""} disabled>${assessment ? "انتقل إلى مهمّة التسمية" : "انتقل إلى التطبيق"}</button>
        </div>
      </div>
      <div class="drawing-board" dir="ltr" role="group" aria-label="شبكة الرسم" tabindex="0">
        <svg viewBox="0 0 700 500" aria-hidden="true">
          <defs>
            <marker id="drawing-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
              <path d="M1 1L9 5L1 9" fill="none" stroke="#174cc4" stroke-width="2"/>
            </marker>
          </defs>
          <path class="drawing-stroke" fill="none" stroke="#174cc4" stroke-width="5"/>
        </svg>
        ${Array.from({length:35}, (_, index) => {
          const [x, y] = drawingPoint(index);
          const label = assessment ? (["أ","ب"][fixed.indexOf(index)] || "") : index === drawingOrigin ? "أ" : "";
          const position = `الصف ${number.format(Math.floor(index / 7) + 1)}، العمود ${number.format(index % 7 + 1)}`;
          return `<button type="button" class="drawing-point" style="--x:${x/7}%;--y:${y/5}%"
            data-action="drawing-point" data-index="${index}" data-position="${position}"
            aria-label="${label ? label + "، " : ""}${position}" aria-pressed="false" tabindex="-1">
            <span aria-hidden="true">${label}</span></button>`;
        }).join("")}
      </div>
      <p class="drawing-keyboard-help">بلوحة المفاتيح، ركّز على الشبكة واضغط إدخال لتمسك القلم، وحرّكه بمفاتيح الأسهم ثم اضغط إدخال لإنهاء الخط.</p>
    </section>
    <div class="actions"><a class="button secondary" href="#lesson/geometry/0/${assessment ? "formative" : "experiment"}">${assessment ? "العودة إلى أسئلة التمييز" : "العودة إلى تجربة الساعة"}</a></div>
  </article>`;
}

function drawingMarks(panel) {
  if (panel.dataset.assessment !== undefined) return drawingTaskMarks(panel.dataset.mode).map(drawingPoint);
  return panel.dataset.mode === "ray" ? [drawingPoint(drawingOrigin)]
    : [panel.dataset.first, panel.dataset.second].filter(value => value !== undefined).map(value => drawingPoint(Number(value)));
}

function finishDrawing(panel, origin, tip) {
  const marks = drawingMarks(panel);
  const stroke = panel.querySelector(".drawing-stroke");
  const feedback = panel.querySelector(".drawing-feedback");
  if (!validDrawing(origin, tip, marks)) {
    stroke.removeAttribute("d");
    if (panel.dataset.assessment !== undefined) recordDrawing(panel, false, [origin, tip], [], "ارسم خطًا يصل إلى النقطتين أ وب ويمرّ بهما.");
    feedback.textContent = panel.dataset.mode === "ray" ? (panel.dataset.assessment !== undefined ? "ابدأ من أ، واسحب في اتجاه ب حتى يمرّ الرسم بها." : "ابدأ من أ واسحب مسافة أطول.")
      : "أعد المحاولة. ارسم الخط عبر النقطتين حتى يصل إليهما.";
    return;
  }
  panel.dataset.drawn = "true";
  panel.dataset.stroke = JSON.stringify([origin, tip]);
  for (const arrow of panel.querySelectorAll(".drawing-arrows button")) arrow.disabled = false;
  feedback.textContent = panel.dataset.mode === "ray" ? "أضف سهمًا عند الطرف الذي انتهى عنده رسمك."
    : "أضف سهمًا عند كل طرف ليبيّن الامتداد في الاتجاهين.";
}

function recordDrawing(panel, correct, points, arrows, explanation) {
  const mode = panel.dataset.mode;
  const count = arrows.filter(Boolean).length;
  recordAssessment("draw", panel.dataset.short !== undefined ? "short" : mode, mode === "ray" ? "رسم الشعاع" : "رسم المستقيم", correct,
    count === 0 ? "رسمت خطًا بلا أسهم." : count === 1 ? "رسمت خطًا بسهم واحد." : "رسمت خطًا بسهمين.",
    explanation, {points, arrows, mode});
}

function drawStroke(board, origin, tip) {
  board.querySelector(".drawing-stroke").setAttribute("d", `M${origin.join(" ")} L${tip.join(" ")}`);
}

function handleDrawing(control) {
  const panel = control.closest(".drawing-panel");
  const {action} = control.dataset;
  const modes = [...panel.querySelectorAll('[data-action="drawing-mode"]')];
  const feedback = panel.querySelector(".drawing-feedback");
  const stroke = panel.querySelector(".drawing-stroke");
  const arrows = [...panel.querySelectorAll(".drawing-arrows button")];
  if (action === "drawing-arrow" || action === "drawing-check") {
    if (panel.dataset.drawn !== "true") {
      if (action === "drawing-check") feedback.textContent = "ارسم الخط أولًا، ثم أضف الأسهم.";
      return;
    }
    if (action === "drawing-arrow") {
      const checked = control.getAttribute("aria-pressed") !== "true";
      control.setAttribute("aria-pressed", String(checked));
      const marker = "marker-" + control.dataset.arrow;
      if (checked) stroke.setAttribute(marker, "url(#drawing-arrow)");
      else stroke.removeAttribute(marker);
      if (panel.dataset.assessment !== undefined) {
        feedback.textContent = "عندما تنتهي من وضع الأسهم، اضغط «تحقّق من رسمي».";
        return;
      }
    }
    const actual = arrows.map(button => button.getAttribute("aria-pressed") === "true");
    const isRay = panel.dataset.mode === "ray";
    const correct = actual[1] && actual[0] === !isRay;
    if (correct) {
      const mode = modes.find(button => button.dataset.mode === panel.dataset.mode);
      if (!mode.dataset.done) mode.textContent += " · تمّ";
      mode.dataset.done = "true";
      panel.querySelector('[data-action="application"]').disabled = panel.dataset.short === undefined && modes.some(button => !button.dataset.done);
    }
    feedback.textContent = correct ? (isRay ? "أحسنت! يبدأ الشعاع عند أ ويمتدّ باتجاه السهم." : "أحسنت! يمرّ المستقيم بالنقطتين ويمتدّ في الاتجاهين.")
      : isRay ? "اترك نقطة أ من دون سهم وضع السهم عند الطرف الثاني." : "ضع سهمًا عند كل طرف.";
    if (action === "drawing-check") recordDrawing(panel, correct, JSON.parse(panel.dataset.stroke), actual, feedback.textContent);
    return;
  }
  if (action === "drawing-mode" || action === "drawing-clear") {
    if (action === "drawing-mode") panel.dataset.mode = control.dataset.mode;
    delete panel.dataset.first;
    delete panel.dataset.second;
    delete panel.dataset.drawn;
    penGestures.delete(panel.querySelector(".drawing-board"));
    stroke.removeAttribute("d");
    for (const arrow of arrows) {
      arrow.disabled = true;
      arrow.setAttribute("aria-pressed", "false");
      stroke.removeAttribute("marker-" + arrow.dataset.arrow);
    }
    feedback.textContent = "";
  } else {
    if (panel.dataset.assessment !== undefined || panel.dataset.mode === "ray" || panel.dataset.second !== undefined) return;
    const {index} = control.dataset;
    if (panel.dataset.first === index) {
      feedback.textContent = "اختر نقطة ثانية مختلفة.";
      return;
    }
    const point = panel.dataset.first === undefined ? "first" : "second";
    panel.dataset[point] = index;
    feedback.textContent = point === "first" ? "اختر النقطة الثانية." : "اسحب لترسم خطًّا يمرّ بالنقطتين.";
  }
  const isRay = panel.dataset.mode === "ray";
  panel.querySelector(".drawing-instruction").textContent = isRay
    ? "ابدأ من أ واسحب لترسم، ثم أضف سهمًا عند الطرف الثاني."
    : "اختر نقطتين، ثم ارسم خطًّا يمرّ بهما وأضف سهمًا عند كل طرف.";
  const assessment = panel.dataset.assessment !== undefined;
  const fixed = assessment ? drawingTaskMarks(panel.dataset.mode) : [];
  if (assessment) panel.querySelector(".drawing-instruction").textContent = isRay
    ? "ارسم شعاعًا يبدأ من أ ويمرّ بب، ثم أضف السهم في مكانه."
    : "ارسم مستقيمًا يمرّ بأ وب، ثم أضف سهمًا عند كل طرف.";
  for (const button of modes) button.setAttribute("aria-pressed", String(button.dataset.mode === panel.dataset.mode));
  for (const button of panel.querySelectorAll(".drawing-point")) {
    const {index, position} = button.dataset;
    button.tabIndex = isRay || assessment ? -1 : 0;
    const label = assessment ? (["أ", "ب"][fixed.indexOf(Number(index))] || "")
      : index === panel.dataset.first || (isRay && Number(index) === drawingOrigin) ? "أ"
      : index === panel.dataset.second ? "ب" : "";
    button.querySelector("span").textContent = label;
    button.setAttribute("aria-label", label ? `${label}، ${position}` : position);
    button.setAttribute("aria-pressed", String(index === panel.dataset.first || index === panel.dataset.second));
  }
}

const penGestures = new WeakMap();

function penLocation(board, event) {
  const bounds = board.getBoundingClientRect();
  return [Math.min(680, Math.max(20, (event.clientX - bounds.left) * 700 / bounds.width)),
    Math.min(480, Math.max(20, (event.clientY - bounds.top) * 500 / bounds.height))];
}

function beginDrawing(board, start, pointerId) {
  const panel = board.closest(".drawing-panel");
  if (panel.dataset.drawn || (panel.dataset.mode === "line" && drawingMarks(panel).length < 2)) return false;
  const [mark] = drawingMarks(panel);
  const ray = panel.dataset.mode === "ray";
  if (ray && Math.hypot(start[0] - mark[0], start[1] - mark[1]) > 55) {
    panel.querySelector(".drawing-feedback").textContent = "ضع إصبعك عند أ واسحب من هناك.";
    return false;
  }
  const origin = ray ? mark : start;
  penGestures.set(board, {origin, tip: origin, pointerId});
  return true;
}

function characterFeedback() {
  return `<div class="apply-feedback-card">
          <span class="apply-avatar avatar-teacher"><img src="assets/images/img-08.webp" alt="المعلمة رنا"></span>
          <span class="apply-avatar avatar-bird"><img src="${worldScenes.data}" alt="العصفور الأزرق"></span>
          <p class="apply-feedback" role="status" aria-atomic="true"></p>
        </div>`;
}

const applicationExamples = [
  {shape: "ray", name: "الشعاع", ends: ["right"],
    explanation: "النقطة الخضراء هي نقطة بدايته، والسهم يبيّن اتجاه امتداده بلا نهاية.",
    hint: "ابحث عن نقطة واحدة. السهم يدلّ على أن الشعاع يستمر في جهته."},
  {shape: "segment", name: "القطعة المستقيمة", ends: ["right", "left"],
    explanation: "لها نقطتا نهاية: النقطة الخضراء والنقطة البرتقالية. الجزء بينهما هو القطعة المستقيمة.",
    hint: "انظر إلى الطرفين. إذا وجدت نقطة عند كل طرف، اضغط على النقطتين بأي ترتيب."},
  {shape: "line", name: "المستقيم", ends: ["none"],
    explanation: "السهمان يبيّنان أن المستقيم يمتد بلا نهاية في الاتجاهين، لذلك ليس له نقاط نهاية.",
    hint: "انظر إلى السهمين. كل سهم يبيّن أن الخط يستمر؛ فهل ترى أي نقطة نهاية؟"}
];

function applicationActivity(index) {
  const example = applicationExamples[index];
  return `<section class="warmup-panel application-panel" data-example="${index}" aria-labelledby="apply-title">
    <p>حلّ الأمثلة بالترتيب. بعد الإجابة الصحيحة يظهر زر المثال التالي.</p>
    <ol class="example-progress" aria-label="أمثلة التطبيق">
      ${applicationExamples.map((_, i) => `<li ${i === index ? 'aria-current="step"' : ""}>
        المثال ${number.format(i + 1)}${i < index ? " · تمّ" : ""}</li>`).join("")}
    </ol>
    <h2 id="apply-title" tabindex="-1">ما اسم هذا الشكل؟</h2>
    <p>اختر اسم الشكل، واضغط على كل نقطة ملوّنة تلاحظها. إذا رأيت سهمين بلا نقاط، اختر «لا توجد نقاط نهاية».</p>
    <div class="apply-form">
      <fieldset class="apply-choices"><legend>اسم الشكل</legend>
        ${applicationExamples.map(({shape, name}) => `<button type="button" class="button secondary"
          data-action="apply-shape" data-value="${shape}" aria-pressed="false">${name}</button>`).join("")}
      </fieldset>
      <fieldset class="apply-diagram"><legend>النقاط في الرسم</legend>
        <div class="apply-hit-area">
          <svg viewBox="0 0 320 180" role="img" aria-label="${index === 0 ? "خط مائل عليه نقطة يمينًا وسهم يسارًا" : index === 1 ? "خط مائل عليه نقطة عند كل طرف" : "خط مائل عليه سهم عند كل طرف"}">
            <path d="M250 137L70 48 ${index !== 1 ? "M77 66L70 48 89 45" : ""} ${index === 2 ? "M243 119L250 137 231 140" : ""}" fill="none" stroke="#174cc4" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
            ${index !== 2 ? '<circle cx="250" cy="137" r="9" fill="#08735c"/>' : ""}
            ${index === 1 ? '<circle cx="70" cy="48" r="9" fill="#b94b0a"/>' : ""}
          </svg>
          <button class="apply-end arrow-end" type="button" data-action="apply-end" data-value="left" aria-label="الطرف الأيسر" aria-pressed="false"></button>
          <button class="apply-end dot-end" type="button" data-action="apply-end" data-value="right" aria-label="الطرف الأيمن" aria-pressed="false"></button>
        </div>
        <div class="apply-choices">
          ${[["right","الطرف الأيمن"],["left","الطرف الأيسر"],["none","لا توجد نقاط نهاية"]].map(([value,label]) =>
          `<button class="button secondary" type="button" data-action="apply-end" data-value="${value}" aria-pressed="false">${label}</button>`).join("")}
        </div>
      </fieldset>
      <img class="apply-characters" src="assets/images/img-08.webp" alt="">
      <div class="apply-result">
        <div class="actions">
          <button class="button" type="button" data-action="apply-check">تحقّق من إجابتي</button>
          <button class="button secondary" type="button" data-action="apply-hint">أعطني تلميحًا</button>

        </div>
        ${characterFeedback()}
        ${index < applicationExamples.length - 1 ? `<button class="button example-next" type="button"
          data-action="apply-next" hidden>انتقل إلى المثال ${number.format(index + 2)}</button>`
          : '<a class="button example-next" data-naming-link href="#lesson/geometry/0/naming" hidden>انتقل إلى تسمية الأشعة</a>'}
      </div>
    </div>
  </section>`;
}

function edgesApplication(world) {
  return `<article class="warmup">
    ${journeyHeader(world, 4)}
    ${applicationActivity(0)}
    <div class="actions"><a class="button secondary" href="#lesson/geometry/0/experiment">العودة إلى التجريب</a></div>
  </article>`;
}

function handleApplication(control) {
  const panel = control.closest(".application-panel");
  const index = Number(panel.dataset.example);
  const action = control.dataset.action;
  if (action === "apply-next" && index < applicationExamples.length - 1) {
    const parent = panel.parentElement;
    panel.outerHTML = applicationActivity(index + 1);
    parent.querySelector("#apply-title").focus();
    return;
  }

  const feedback = panel.querySelector(".apply-feedback");
  const choices = [...panel.querySelectorAll('[data-action="apply-shape"]')];
  const endpoints = [...panel.querySelectorAll('[data-action="apply-end"]')];
  if (action === "apply-shape" || action === "apply-end") {
    const value = control.dataset.value;
    const pressed = control.getAttribute("aria-pressed") === "true";
    if (action === "apply-shape") {
      choices.forEach(button => button.setAttribute("aria-pressed", String(button === control)));
    } else {
      for (const button of endpoints) {
        if (button.dataset.value === value) button.setAttribute("aria-pressed", String(!pressed));
        else if (value === "none" || button.dataset.value === "none") button.setAttribute("aria-pressed", "false");
      }
    }
    feedback.textContent = "";
    delete feedback.dataset.result;
    return;
  }

  const example = applicationExamples[index];
  const chosen = choices.find(button => button.getAttribute("aria-pressed") === "true");
  const ends = [...new Set(endpoints.filter(button => button.getAttribute("aria-pressed") === "true").map(button => button.dataset.value))];
  const rightShape = chosen?.dataset.value === example.shape;
  const rightEnds = ends.length === example.ends.length && example.ends.every(value => ends.includes(value));
  const hint = example.hint;
  feedback.dataset.result = action === "apply-hint" ? "bird" : "retry";
  if (action === "apply-hint") feedback.textContent = hint;
  else if (!chosen) feedback.textContent = "اختر اسم الشكل أولًا.";
  else if (!ends.length) feedback.textContent = hint;
  else if (rightShape && rightEnds) {
    feedback.dataset.result = "success";
    const next = panel.querySelector('[data-action="apply-next"]');
    const current = panel.querySelector('.example-progress [aria-current="step"]');
    if (current && !current.dataset.done) {
      current.dataset.done = "true";
      current.textContent = `المثال ${number.format(index + 1)} · تمّ`;
    }
    if (next) next.hidden = false;
    const naming = panel.querySelector("[data-naming-link]");
    if (naming) naming.hidden = false;
    feedback.textContent = `إجابتك صحيحة! ${example.name}. ${example.explanation}${index === applicationExamples.length - 1 ? " أكملتَ الأمثلة الثلاثة." : ""}`;
  } else {
    const retry = rightShape ? "اسم الشكل صحيح. راجع اختيار النقاط."
      : rightEnds ? "اختيار النقاط صحيح. جرّب اختيار اسم الشكل مرة أخرى."
      : "حاول مرة أخرى.";
    feedback.textContent = retry + " " + hint;
  }
}

const quizShapeChoices = [["segment","القطعة المستقيمة"],["ray","الشعاع"],["line","المستقيم"]];
const formativeQuestions = [
  {type:"choice", prompt:"ما اسم هذا الشكل؟", answer:"line", shape: "line", drawing: "M65 144L254 70 M76 125L65 144 88 148 M231 66L254 70 242 89", dots: [],
    explanation: "السهمان يبيّنان أن المستقيم يمتد بلا نهاية في الاتجاهين.", hint: "تتبّع الشكل بعينيك إلى الطرفين. ما العلامة التي تراها عند كل طرف؟"},
  {type:"fill", prompt:"ضع الكلمة المناسبة", answer:"ray", shape: "ray", drawing: "M230 146L87 57 M98 77L87 57 110 58", dots: [[230,146]],
    explanation: "يبدأ الشعاع عند النقطة ويمتد باتجاه السهم.", hint: "تأمّل الطرف السفلي ثم الطرف العلوي. هل ترى العلامة نفسها في الطرفين؟"},
  {type:"truth", prompt:"صح أم خطأ؟", answer:"false", shape: "segment", drawing: "M76 70L244 147", dots: [[76,70],[244,147]],
    explanation: "للجزء المرسوم نقطتا نهاية، لذا فهو قطعة مستقيمة.", hint: "انظر إلى طرفَي الرسم. هل يشير أيّ طرف إلى أن الخط يستمر؟"}
];

function formativeActivity(index) {
  const question = formativeQuestions[index];
  const options = question.type === "truth" ? [["true","صح"],["false","خطأ"]] : quizShapeChoices;
  const choices = options.map(([value,label]) => `
    <button type="button" class="button secondary" data-action="quiz-choice"
      data-value="${value}" aria-pressed="false" ${question.type === "fill" ? 'draggable="true"' : ""}>${label}</button>`).join("");
  const drawingMode = assessmentLog["draw:short"]?.latest?.drawing?.mode === "ray" ? "line" : "ray";
  return `<section class="warmup-panel formative-panel" data-question="${index}" aria-labelledby="quiz-title">
    <div class="formative-head">
      <span class="formative-avatar"><img src="${handPoses[0]}" alt=""></span>
      <div><span class="tag">السؤال ${number.format(index + 1)} من ${number.format(5)}</span>
      <h2 id="quiz-title" tabindex="-1">${question.prompt}</h2></div>
    </div>
    <div class="formative-grid">
      <div>
        ${question.type === "fill" ? '<p>اسحب البطاقة إلى الفراغ أو اضغط عليها.</p><p>الشكل الذي له نقطة بداية وسهم واحد هو</p><div class="quiz-drop" aria-live="polite">ضع الكلمة هنا</div>'
          : question.type === "truth" ? "<p>الشكل في الرسم يمتد بلا نهاية في الاتجاهين.</p>" : ""}
        <fieldset class="apply-choices"><legend>${question.type === "truth" ? "اختر صح أو خطأ" : "اختر اسم الشكل"}</legend>${choices}</fieldset>
      </div>
      <svg viewBox="0 0 320 210" role="img" aria-label="${{line:"خط مائل بسهمين",ray:"خط مائل بنقطة وسهم",segment:"خط مائل بنقطتين"}[question.shape]}">
        <path d="${question.drawing}" fill="none" stroke="#174cc4" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        ${question.dots.map(([x,y]) => `<circle cx="${x}" cy="${y}" r="8" fill="#174cc4"/>`).join("")}
      </svg>
    </div>
    <div class="actions">
      <button class="button" type="button" data-action="quiz-check">تحقّق من إجابتي</button>
      <button class="button secondary" type="button" data-action="quiz-hint">أعطني تلميحًا</button>
    </div>
    ${characterFeedback()}
    ${index < formativeQuestions.length - 1 ? '<button class="button example-next" type="button" data-action="quiz-next" hidden>السؤال التالي</button>'
      : `<a class="button example-next" data-summary-link href="#lesson/geometry/0/assessment-drawing-${drawingMode}" hidden>انتقل إلى مهمّة الرسم</a>`}
  </section>`;
}

function edgesFormative(world) {
  return `<article class="warmup">${journeyHeader(world, 5)}${formativeActivity(0)}
    <div class="actions"><a class="button secondary" href="#lesson/geometry/0/application">العودة إلى التطبيق</a></div>
  </article>`;
}

function handleFormative(control) {
  const panel = control.closest(".formative-panel");
  const index = Number(panel.dataset.question);
  const action = control.dataset.action;
  if (action === "quiz-next") {
    if (control.hidden || index >= formativeQuestions.length - 1) return;
    const parent = panel.parentElement;
    panel.outerHTML = formativeActivity(index + 1);
    parent.querySelector("#quiz-title").focus();
    return;
  }
  const feedback = panel.querySelector(".apply-feedback");
  const question = formativeQuestions[index];
  const next = panel.querySelector('[data-action="quiz-next"]');
  const summary = panel.querySelector("[data-summary-link]");
  if (action === "quiz-choice") {
    for (const choice of panel.querySelectorAll('[data-action="quiz-choice"]')) {
      choice.setAttribute("aria-pressed", String(choice === control));
    }
    const drop = panel.querySelector(".quiz-drop");
    if (drop) drop.textContent = control.textContent.trim();
    feedback.textContent = "";
    delete feedback.dataset.result;
    if (next) next.hidden = true;
    if (summary) summary.hidden = true;
    return;
  }
  if (action === "quiz-hint") {
    feedback.dataset.result = "bird";
    feedback.textContent = question.hint;
    return;
  }
  const choice = panel.querySelector('[data-action="quiz-choice"][aria-pressed="true"]');
  const correct = choice?.dataset.value === question.answer;
  feedback.dataset.result = correct ? "success" : "retry";
  feedback.textContent = correct ? "إجابتك صحيحة! " + question.explanation
    : choice ? "حاول مرة أخرى. " + question.hint : "اختر إجابة أولًا.";
  if (choice) recordAssessment("distinguish", index, `التمييز · السؤال ${number.format(index + 1)}`, correct,
    choice.textContent.trim(), question.explanation);
  if (next) next.hidden = !correct;
  if (summary) summary.hidden = !correct;
}

function edgesSummary(world) {
  const cards = [
    {key:"segment", title:"القطعة المستقيمة", text:"نقطتان، واحدة عند كل طرف.", color:"#174cc4", src:"assets/images/img-17.webp", alt:"المعلمة رنا تقبض يديها"},
    {key:"ray", title:"الشعاع", text:"يبدأ عند نقطة ويمتد باتجاه السهم.", color:"#08735c", src:"assets/images/img-18.webp", alt:"المعلمة رنا تقبض يدًا واحدة"},
    {key:"line", title:"المستقيم", text:"سهمان، ويمتد بلا نهاية في الاتجاهين.", color:"#6743a0", src:"assets/images/img-19.webp", alt:"المعلمة رنا تمدّ ذراعيها وتفتح كفّيها"}
  ];
  return `<article class="warmup">
    ${journeyHeader(world, 6)}
    <div class="formative-head"><span class="formative-avatar"><img src="${handPoses[0]}" alt=""></span>
      <div><h2>ماذا تعلّمنا؟</h2><p>تذكّر عدد النقاط والأسهم في كل شكل.</p></div></div>
    <div class="summary-cards">
      ${cards.map(({key,title,text,color,src,alt}) => `
        <section class="summary-card ${key}">
          <h3>${title}</h3><img src="${src}" alt="${alt}">
          <svg viewBox="0 0 270 44" aria-hidden="true">
            <path d="M20 22H250 ${key === "line" ? "M33 12L20 22 33 32" : ""} ${key !== "segment" ? "M237 12L250 22 237 32" : ""}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
            ${key !== "line" ? '<circle cx="20" cy="22" r="7" fill="#08735c"/>' : ""}
            ${key === "segment" ? '<circle cx="250" cy="22" r="7" fill="#b94b0a"/>' : ""}
          </svg>
          <p>${text}</p>
        </section>`).join("")}
    </div>
    <section class="warmup-panel summary-naming">
      <h3>كيف أسمّي الشكل؟</h3>
      <ul><li><strong>الشعاع:</strong> أكتب حرف نقطة البداية أولًا، ثم حرف نقطة يمرّ بها.</li>
      <li><strong>القطعة المستقيمة:</strong> أكتب حرفَي طرفَيها بأي ترتيب.</li>
      <li><strong>المستقيم:</strong> أختار أي نقطتين مختلفتين عليه وأكتب حرفَيهما بأي ترتيب.</li></ul>
    </section>
    <div class="actions"><a class="button" href="#world/geometry">العودة إلى المحطات</a></div>
  </article>`;
}

function edgesNaming(world, assessment = false) {
  const points = [["أ",23,50],["ب",58,29],["ج",61,50],["د",58,71]];
  return `<article class="warmup">
    ${journeyHeader(world, assessment ? 5 : 4)}
    <section class="warmup-panel naming-panel" ${assessment ? "data-assessment" : ""} aria-labelledby="naming-title">
      <div>
        <div class="naming-heading">
          <span class="apply-avatar avatar-teacher"><img src="assets/images/img-08.webp" alt="المعلمة رنا"></span>
          <h2 id="naming-title">سمِّ الشكل بحروف النقاط</h2>
        </div>
        <p>سمِّ أحد الأشعة التي تبدأ من أ.</p>
        <p>اضغط على أ أولًا، ثم اختر ب أو ج أو د.</p>
        <p class="naming-selection" aria-live="polite">اختيارك يظهر هنا</p>
        <div class="actions">
          <button class="button" type="button" data-action="naming-check">تحقّق من إجابتي</button>
          <button class="button secondary" type="button" data-action="naming-clear">أعد الاختيار</button>
          <button class="button secondary" type="button" data-action="naming-hint">أعطني تلميحًا</button>
        </div>
      </div>
      <div class="naming-diagram" role="group" aria-label="ثلاثة أشعة تنطلق من أ">
        <svg viewBox="0 0 500 305" aria-hidden="true">
          <g ${assessment ? 'transform="translate(500 0) scale(-1 1)"' : ""} fill="none" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="#174cc4" d="M115 152.5L422 39 M400 36L422 39 408 57"/>
            <path stroke="#6743a0" d="M115 152.5H442 M423 141L442 152.5 423 164"/>
            <path stroke="#08735c" d="M115 152.5L422 266 M408 248L422 266 400 269"/>
          </g>
        </svg>
        ${points.map(([label,x,y]) => `<button class="naming-point" style="--x:${assessment ? 100-x : x}%;--y:${y}%"
          type="button" data-action="naming-point" data-point="${label}" aria-label="النقطة ${label}" aria-pressed="false"><span>${label}</span></button>`).join("")}
      </div>
      <div class="naming-result">
        ${characterFeedback()}
        <a class="button example-next" data-naming-next href="#lesson/geometry/0/${assessment ? "review" : "naming-segment"}" hidden>${assessment ? "انتقل إلى خريطة إنجازي" : "انتقل إلى تسمية القطعة والمستقيم"}</a>
      </div>
    </section>
    <div class="actions"><a class="button secondary" href="#lesson/geometry/0/${assessment ? "assessment-drawing" : "application"}">${assessment ? "العودة إلى مهمّة الرسم" : "العودة إلى أمثلة التطبيق"}</a></div>
  </article>`;
}

const namingFigures = {
  segment: {
    points: [["أ",25],["ب",75]],
    path: "M125 152.5H375",
    color: "#b94b0a",
    description: "قطعة برتقالية تبدأ عند أ وتنتهي عند ب، بلا أسهم.",
    instruction: "اضغط على نقطتَي طرفَي القطعة. يمكنك اختيارهما بأي ترتيب."
  },
  line: {
    points: [["ج",25],["د",50],["م",75]],
    path: "M50 152.5H450 M70 138L50 152.5 70 167 M430 138L450 152.5 430 167",
    color: "#6743a0",
    description: "مستقيم بنفسجي بسهمين، تمرّ عليه النقاط ج ود وم.",
    instruction: "اختر أيّ نقطتين مختلفتين يمرّ بهما المستقيم. يمكنك اختيارهما بأي ترتيب."
  }
};

function edgesNamingLine(world, mode, assessment = false) {
  const segment = mode === "segment";
  const figure = namingFigures[mode];
  return `<article class="warmup">
    ${journeyHeader(world, assessment ? 5 : 4)}
    <section class="warmup-panel naming-panel" data-mode="${mode}" ${assessment ? "data-assessment" : ""} aria-labelledby="naming-title">
      <div>
        <div class="naming-heading">
          <span class="formative-avatar"><img src="${handPoses[0]}" alt=""></span>
          <h2 id="naming-title">${segment ? "سمِّ القطعة المستقيمة" : "سمِّ المستقيم"}</h2>
        </div>
        <ol class="example-progress" aria-label="مهمّتا التسمية">
          <li ${segment ? 'aria-current="step"' : 'data-done="true"'}>١ · القطعة المستقيمة${segment ? "" : " · تمّ"}</li>
          <li ${segment ? "" : 'aria-current="step"'}>٢ · المستقيم</li>
        </ol>
        <p class="naming-rule">${segment ? "النقطتان هما طرفا القطعة." : "السهمان يعنيان أن المستقيم يستمر في الاتجاهين. النقاط تقع عليه."}</p>
        <p>${figure.instruction}</p>
        <p class="naming-selection" aria-live="polite">اختيارك يظهر هنا</p>
        <div class="actions">
          <button class="button" type="button" data-action="naming-check">تحقّق من إجابتي</button>
          <button class="button secondary" type="button" data-action="naming-clear">أعد الاختيار</button>
          <button class="button secondary" type="button" data-action="naming-hint">أعطني تلميحًا</button>
        </div>
      </div>
      <div class="naming-diagram naming-line-diagram" style="--point-color:${figure.color}" role="group" aria-label="${figure.description}">
        <svg viewBox="0 0 500 305" aria-hidden="true">
          <g ${assessment ? 'transform="translate(500 0) scale(-1 1)"' : ""} fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="${figure.path}" stroke="${figure.color}" stroke-width="7"/>
          </g>
        </svg>
        ${figure.points.map(([label,x]) => `<button class="naming-point" style="--x:${assessment ? 100-x : x}%;--y:50%" type="button"
          data-action="naming-point" data-point="${label}" aria-label="النقطة ${label}" aria-pressed="false"><span>${label}</span></button>`).join("")}
      </div>
      <div class="naming-result">
        ${characterFeedback()}
        <a class="button example-next" data-naming-next
          href="#lesson/geometry/0/${segment ? (assessment ? "assessment-line" : "naming-line") : assessment ? "review" : "formative"}" hidden>${segment ? "انتقل إلى تسمية المستقيم" : assessment ? "انتقل إلى نتيجة التقويم" : "انتقل إلى التقويم"}</a>
      </div>
    </section>
    <div class="actions"><a class="button secondary" href="#lesson/geometry/0/${segment ? (assessment ? "assessment-ray" : "naming") : assessment ? "assessment-segment" : "naming-segment"}">${segment ? "العودة إلى تسمية الأشعة" : "العودة إلى تسمية القطعة"}</a></div>
  </article>`;
}

function handleNaming(control) {
  const panel = control.closest(".naming-panel");
  const {action, point} = control.dataset;
  const feedback = panel.querySelector(".apply-feedback");
  const next = panel.querySelector("[data-naming-next]");
  const mode = panel.dataset.mode || "ray";
  const hint = {
    ray:"ابدأ بحرف النقطة المشتركة أ، ثم اختر حرف نقطة على أحد الأشعة.",
    segment:"تتبّع القطعة البرتقالية. اختر النقطتين اللتين تتوقف عندهما.",
    line:"اتبع الخط بين السهمين واختر نقطتين مختلفتين عليه، مثل ج ثم د."
  }[mode];
  const selection = (panel.dataset.selection || "").split("").filter(Boolean);
  if (action === "naming-point" || action === "naming-clear") {
    const updated = action === "naming-clear" ? [] : selection.includes(point) ? selection.filter(item => item !== point)
      : selection.length === 2 ? [point] : [...selection, point];
    panel.dataset.selection = updated.join("");
    panel.querySelector(".naming-selection").textContent = updated.length ? "اختيارك: " + updated.join(" ثم ") : "اختيارك يظهر هنا";
    for (const button of panel.querySelectorAll(".naming-point")) {
      button.setAttribute("aria-pressed", String(updated.includes(button.dataset.point)));
    }
    feedback.textContent = "";
    delete feedback.dataset.result;
    next.hidden = true;
    return;
  }
  if (action === "naming-hint") {
    feedback.dataset.result = "bird";
    feedback.textContent = hint;
    return;
  }
  const correct = selection.length === 2 && selection[0] !== selection[1] && (
    mode === "ray" ? selection[0] === "أ" && ["ب","ج","د"].includes(selection[1])
      : selection.every(label => namingFigures[mode].points.some(([shown]) => shown === label)));

  const name = selection.join(" ");
  const success = {
    ray:`هذا هو الشعاع ${name}. يبدأ من أ ويمرّ بالنقطة ${selection[1]}.`,
    segment:`هذه هي القطعة المستقيمة ${name}. تتوقف عند أ وب، لذلك نسمّيها بطرفَيها بأي ترتيب.`,
    line:`هذا هو المستقيم ${name}. النقطتان تقعان عليه، والسهمان يبيّنان أنه يمرّ بهما ويستمرّ في الاتجاهين.`
  }[mode];
  feedback.dataset.result = correct ? "success" : "retry";
  feedback.textContent = correct ? "إجابتك صحيحة! " + success
    : selection.length < 2 ? "اختر نقطتين مختلفتين. " + hint : "حاول مرة أخرى. " + hint;
  if (panel.dataset.assessment !== undefined && selection.length === 2) {
    const title = {ray:"تسمية الشعاع", segment:"تسمية القطعة المستقيمة", line:"تسمية المستقيم"}[mode];
    recordAssessment("name", mode, title, correct, selection.join(" ثم "),
      mode === "ray" && !correct ? "حرف نقطة البداية يأتي أولًا. مثلًا: أ ب." : correct ? success : hint);
  }
  next.hidden = !correct;
}

function escapeReview(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
}

function reviewDrawing(drawing, id, model = false) {
  if (!drawing) return "";
  const marks = drawingTaskMarks(drawing.mode).map(drawingPoint);
  const [a,b] = marks;
  const direction = [b[0]-a[0], b[1]-a[1]];
  const start = drawing.mode === "ray" ? a : a.map((v,i)=>v-direction[i]*.2);
  const end = b.map((v,i)=>v+direction[i]*.2);
  const [from,to] = model ? [start,end] : drawing.points;
  const arrows = model ? [drawing.mode === "line", true] : drawing.arrows;
  return `<figure><figcaption>${model ? "رسم صحيح" : "رسمك في أول محاولة"}</figcaption>
    <svg viewBox="0 0 700 500" role="img" aria-label="${model ? "رسم صحيح" : "الرسم الذي قدّمته"}">
      <defs><marker id="review-arrow-${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1 1L9 5L1 9" fill="none" stroke="#174cc4" stroke-width="2"/></marker></defs>
      <path d="M${from.map(Number).join(" ")} L${to.map(Number).join(" ")}" fill="none" stroke="#174cc4" stroke-width="8"
        ${arrows[0] ? `marker-start="url(#review-arrow-${id})"` : ""} ${arrows[1] ? `marker-end="url(#review-arrow-${id})"` : ""}/>
      ${marks.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="11" fill="#08735c"/><text x="${x+16}" y="${y+30}" font-size="29">${i?"ب":"أ"}</text>`).join("")}
    </svg></figure>`;
}

function achievementStar(kind, key) {
  const colors = {first:["#fff6bb","#ffd149","#a85a03"],retry:["#c4ffe0","#4ac686","#076846"],pending:["#f8fbff","#c5d2e6","#7185a5"]}[kind];
  return `<svg class="achievement-star" viewBox="0 0 90 90" aria-hidden="true">
    <defs><linearGradient id="star-${key}" x1="0%" y1="0%" x2="0%" y2="100%"><stop stop-color="${colors[0]}"/><stop offset=".55" stop-color="${colors[1]}"/><stop offset="1" stop-color="${colors[2]}"/></linearGradient></defs>
    <path d="M45 6 56 31 83 34 63 52 69 80 45 66 21 80 27 52 7 34 34 31Z" fill="${colors[2]}" transform="translate(0 5)"/>
    <path d="M45 6 56 31 83 34 63 52 69 80 45 66 21 80 27 52 7 34 34 31Z" fill="url(#star-${key})" stroke="${colors[2]}" stroke-width="2"/>
    <path d="M45 12 36 34 14 37" fill="none" stroke="#fff" stroke-opacity=".65" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}

function edgesReview(world) {
  const groups = [["distinguish","أميّز"],["draw","أرسم"],["name","أسمّي"]];
  const entries = Object.values(assessmentLog);
  return `<article class="warmup">${journeyHeader(world,5)}
    <section class="warmup-panel review-panel">
      <h2>خريطة إنجازي</h2>
      <p>رحلة الشعاع والمستقيم</p>
      <div class="achievement-legend">
        <p><span class="legend-first" aria-hidden="true">★</span> النجمة الصفراء: أنجزت الهدف من أول محاولة.</p>
        <p><span class="legend-retry" aria-hidden="true">★</span> النجمة الخضراء: أنجزت الهدف من المحاولة الثانية أو بعدها.</p>
      </div>
      <div class="achievement-map">
        <ol aria-label="نجوم أهداف الدرس">
          ${groups.map(([key,title]) => {
            const required = {distinguish:3, draw:1, name:1}[key];
            const items = entries.filter(item => item.group === key);
            const complete = items.length >= required && items.every(item => item.solved);
            const status = !complete ? "قيد الإنجاز" : items.every(item=>item.first.correct) ? "من أول محاولة" : "بعد إعادة المحاولة";
            const kind = !complete ? "pending" : items.every(item=>item.first.correct) ? "first" : "retry";
            return `<li data-star="${kind}">${achievementStar(kind, key)}<strong>${title}</strong><span>${status}</span></li>`;
          }).join("")}
        </ol>
        <img src="assets/images/img-20.webp" alt="الطفل يحمل كأس الإنجاز">
      </div>
      <div class="actions review-actions">
        <a class="button review-answers" href="#lesson/geometry/0/review-answers">راجع إجاباتك</a>
        <a class="button review-explain" href="#lesson/geometry/0/explain">ارجع للشرح</a>
        <a class="button review-summary" href="#lesson/geometry/0/summary">انتقل إلى الملخّص</a>
      </div>
    </section>
  </article>`;
}

function edgesReviewAnswers(world) {
  const groups = [["distinguish","أميّز"],["draw","أرسم"],["name","أسمّي"]];
  const entries = Object.entries(assessmentLog);
  return `<article class="warmup">${journeyHeader(world,5)}
    <section class="warmup-panel review-panel">
      <h2>التقويم التكويني · راجع إجاباتك</h2>
      <p>افتح السؤال لتشوف إجابتك الأولى وآخر إجابة والتفسير.</p>
      <div id="review-details">
        ${groups.map(([key,title]) => {
          const items=entries.filter(([,item])=>item.group===key);
          
          return `<section class="review-goal"><h3>${title}</h3>
            ${items.length ? "" : "<p>لا توجد إجابات محفوظة لهذا الهدف بعد.</p>"}
            ${items.map(([id,item],i)=>`<details><summary>${escapeReview(item.title)} · ${item.first.correct ? "أتقنت من أول محاولة" : item.solved ? "أتقنت بعد المحاولة" : "تحتاج إلى مراجعة"}</summary>
              ${key === "distinguish" ? reviewQuizQuestion(formativeQuestions[Number(id.split(":")[1])]) : ""}
              <p><strong>إجابتك الأولى:</strong> ${escapeReview(item.first.answer)}</p>
              ${item.first.drawing ? `<div class="review-drawings">${reviewDrawing(item.first.drawing,key+i)}${reviewDrawing(item.first.drawing,key+i+"model",true)}</div>` : ""}
              <p><strong>التفسير:</strong> ${escapeReview(item.first.explanation)}</p>
              <p><strong>آخر إجابة:</strong> ${escapeReview(item.latest.answer)}</p>
              ${!item.first.correct && item.latest.correct ? `<p><strong>التصحيح:</strong> ${escapeReview(item.latest.explanation)}</p>` : ""}
            </details>`).join("")}
            <a class="button secondary" href="#lesson/geometry/0/${reviewStages[key]}">أعد مهمّات «${title}»</a>
          </section>`;
        }).join("")}
      </div>
    </section>
    <div class="actions"><a class="button secondary" href="#lesson/geometry/0/review">العودة إلى خريطة إنجازي</a></div>
  </article>`;
}

function reviewQuizQuestion(question) {
  if (!question) return "";
  const prompt = question.type === "truth" ? "الشكل في الرسم يمتد بلا نهاية في الاتجاهين. صح أم خطأ؟"
    : question.type === "fill" ? "الشكل الذي له نقطة بداية وسهم واحد هو…" : question.prompt;
  return `<p>${prompt}</p><svg class="review-question-diagram" viewBox="0 0 320 210" role="img" aria-label="رسم السؤال">
    <path d="${question.drawing}" fill="none" stroke="#174cc4" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    ${question.dots.map(([x,y]) => `<circle cx="${x}" cy="${y}" r="8" fill="#174cc4"/>`).join("")}
  </svg>`;
}

function lessonPage(id, world, lesson, stage) {
  if (id === "geometry" && lesson === 0 && stage === "review-answers") return edgesReviewAnswers(world);
  if (id === "geometry" && lesson === 0 && stage === "review") return edgesReview(world);
  if (id === "geometry" && lesson === 0 && ["assessment-drawing","assessment-drawing-ray","assessment-drawing-line"].includes(stage)) {
    return edgesDrawing(world, true, stage.endsWith("-line") ? "line" : "ray");
  }
  if (id === "geometry" && lesson === 0 && stage === "assessment-ray") return edgesNaming(world, true);
  if (id === "geometry" && lesson === 0 && stage === "assessment-segment") return edgesNamingLine(world, "segment", true);
  if (id === "geometry" && lesson === 0 && stage === "assessment-line") return edgesNamingLine(world, "line", true);
  if (id === "geometry" && lesson === 0 && stage === "naming-segment") return edgesNamingLine(world, "segment");
  if (id === "geometry" && lesson === 0 && stage === "naming-line") return edgesNamingLine(world, "line");
  if (id === "geometry" && lesson === 0 && stage === "naming") return edgesNaming(world);
  if (id === "geometry" && lesson === 0 && stage === "drawing") return edgesDrawing(world);
  if (id === "geometry" && lesson === 0 && stage === "summary") return edgesSummary(world);
  if (id === "geometry" && lesson === 0 && stage === "formative") return edgesFormative(world);
  if (id === "geometry" && lesson === 0 && stage === "application") return edgesApplication(world);
  if (id === "geometry" && lesson === 0 && stage === "experiment") return edgesExperiment(world);
  if (id === "geometry" && lesson === 0 && stage === "explain") return edgesExplain(world);
  if (id === "geometry" && lesson === 0 && stage === "explore") return edgesExplore(world);
  if (id === "geometry" && lesson === 0) return stage === "warmup" ? edgesWarmup(world) : edgesObjectives(world);
  return page(world.lessons[lesson], `<section class="panel"><h2>مسار الدرس</h2>
    <p>هذا قالب للمراجعة. ستُضاف الأهداف والأنشطة والتقويم مع تطوير الدرس.</p>
    <ol>${steps.map(step => `<li>${step}</li>`).join("")}</ol>
    <a href="#world/${id}" class="button secondary">العودة إلى ${world.title}</a></section>`, world.title);
}

function progressPage() {
  const total = Object.keys(worlds).length;
  return page("ملف الإنجاز", `<section class="panel"><h2>العوالم التي زرتها</h2>
    <p>${number.format(destinations.length)} من ${number.format(total)}</p>
    <progress aria-label="العوالم التي زرتها" value="${destinations.length}" max="${total}"></progress>
    ${worldCards()}</section><section class="panel"><h2>الدروس والشارات</h2><p>يبدأ تسجيل إكمال الدروس عند إتاحة أنشطتها، وتُضاف الشارات في مرحلة التحديات والإنجازات.</p></section>`, "تُحفظ زياراتك على هذا الجهاز عندما يسمح المتصفح بالتخزين. يمكنك الاستكشاف دون حساب.");
}

function about() {
  return page("عن المشروع", `<section class="panel"><h2>التصميم التعليمي</h2><p>منصة عربية للصف الثالث الأساسي. تستند خطة تطويرها إلى مراحل ADDIE، وتراعي مبادئ ماير للتعلم بالوسائط المتعددة والتصميم الشامل للتعلم (UDL). يربط قالب الدرس بين الأهداف والنشاط والتقويم عند تأليف المحتوى.</p></section>
    <section class="panel"><h2>المراجع ومصادر الوسائط</h2><ul>
    <li>الرياضيات للصف الثالث الأساسي، الجزء الأول، وزارة التربية والتعليم الفلسطينية، الطبعة الرابعة، ٢٠٢٠. استُخدم الكتاب مرجعًا لخريطة الدروس، وتبقى حقوقه لأصحابها.</li>
    <li>صورة الترحيب مستندة إلى مرجع الشخصيات الذي قدّمته المعلمة رنا. عُدّلت بالذكاء الاصطناعي لإزالة الخلفية وعزل الشخصيات واللوحة التعليمية. أُنشئ مشهدا الهندسة والبيانات وشخصيات التهيئة بالاستناد إلى المرجع نفسه. صور أغراض التهيئة مولّدة استلهامًا من نشاط حواف الأغراض في صفحة ٦٧ من الكتاب.</li>
    <li>قراءة الترحيب الاصطناعية تستخدم صوتًا عربيًا محليًا متاحًا على الجهاز. النص مكتوب في الصفحة الرئيسية.</li>
    <li>خطوط الواجهة Noto Kufi Arabic وNoto Naskh Arabic وNoto Sans Arabic. <a class="status" href="assets/fonts/LICENSE.txt">اقرأ ترخيص الخط</a></li></ul></section>`);
}

const views = {
  home, worlds: worldsMap,
  lab: () => page("مختبر الرياضيات", '<section class="panel"><h2>مساحة التجريب</h2><p>ستُضاف أدوات رسم الخطوط وتحريك الزوايا وبناء الأشكال مع تطوير عالم الهندسة، وأدوات بناء التمثيلات مع عالم البيانات.</p><div class="actions"><a class="button secondary" href="#worlds">استكشف خريطة العوالم</a></div></section>'),
  challenges: () => page("ساحة التحديات", '<section class="panel"><h2>ألعاب المغامرة</h2><p>تُضاف هنا ألعاب التصنيف والتوصيل والترتيب وحل المشكلات في مرحلة التحديات.</p><div class="actions"><a class="button secondary" href="#worlds">استكشف خريطة العوالم</a></div></section>'),
  progress: progressPage, about
};

function render(moveFocus = false) {
  const [route = "home", id, lesson, stage] = location.hash.slice(1).split("/");
  const world = Object.hasOwn(worlds, id) ? worlds[id] : null;
  let active = route || "home";
  stopAudio();
  notice.textContent = "";
  if (route === "world" && world) {
    content.innerHTML = worldPage(id, world);
    active = "worlds";
  } else if (route === "lesson" && world && /^\d+$/.test(lesson) && world.lessons[Number(lesson)]) {
    content.innerHTML = lessonPage(id, world, Number(lesson), stage);
    if (stage === "explain" && id === "geometry" && Number(lesson) === 0) setupHands(content.querySelector(".hands-lab"));
    active = "worlds";
  } else if (Object.hasOwn(views, active)) {
    content.innerHTML = views[active]();
  } else {
    content.innerHTML = page("هذه الصفحة غير موجودة", '<a class="button" href="#worlds">افتح خريطة العوالم</a>');
  }
  document.querySelectorAll("nav a").forEach(link => {
    if (link.hash === "#" + active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  if (moveFocus) {
    window.scrollTo(0, 0);
    content.focus({preventScroll: true});
  }
}

audio.addEventListener("click", () => {
  updateAudio(!audioEnabled);
  if (audioEnabled && ["", "#home"].includes(location.hash)) readGreeting();
});
content.addEventListener("click", event => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "read") {
    updateAudio(true);
    readGreeting();
  }
  if (action === "point" || action === "reset-points") {
    const control = event.target.closest("[data-action]");
    updatePoints(control.closest(".explore-panel"), action === "point" ? control : null);
  }
  if (["hand-listen", "hand-stop", "hand-read"].includes(action)) {
    const control = event.target.closest("[data-action]");
    const guide = control.closest(".warmup").querySelector(".hand-guide");
    const index = Number(guide.dataset.handInstruction);
    if (action === "hand-listen") {
      updateAudio(true);
      readArabic(handInstructions[index].text, () =>
        message("يتطلب التشغيل صوتًا عربيًا مثبّتًا. اقرأ التوجيه وطبّقه ثم اضغط «أنهيت هذه الخطوة»."));
    }
    if (action === "hand-read") {
      const lesson = control.closest(".warmup");
      const left = lesson.querySelector("#left").getAttribute("aria-pressed") === "true";
      const right = lesson.querySelector("#right").getAttribute("aria-pressed") === "true";
      if (Number(left) + 2 * Number(right) === handInstructions[index].pose) {
        stopAudio();
        completeHandStep(guide);
      } else {
        message(handInstructions[index].prompt);
      }
    }
    if (action === "hand-stop") stopAudio();
  }
  if (action === "explain") location.hash = "#lesson/geometry/0/explain";
  if (action === "experiment") location.hash = "#lesson/geometry/0/experiment";
  if (action?.startsWith("naming-")) handleNaming(event.target.closest("[data-action]"));
  if (action?.startsWith("quiz-")) handleFormative(event.target.closest("[data-action]"));
  if (action?.startsWith("apply-")) handleApplication(event.target.closest("[data-action]"));
  if (action?.startsWith("drawing-")) handleDrawing(event.target.closest("[data-action]"));
  if (action === "drawing") location.hash = "#lesson/geometry/0/drawing";
  if (action === "application") location.hash = event.target.closest("[data-assessment-next]")
    ? "#lesson/geometry/0/assessment-ray" : "#lesson/geometry/0/application";
  if (action === "reset-ray") {
    const panel = event.target.closest(".ray-lab");
    panel.querySelector("#ray-angle").value = "-30";
    rotateRay(panel, false);
  }
  if (action === "stop") {
    stopAudio();
    message("توقفت قراءة الترحيب.");
  }
});
content.addEventListener("dragstart", event => {
  const card = event.target.closest('[data-action="quiz-choice"][draggable="true"]');
  if (card) event.dataTransfer.setData("text/plain", card.dataset.value);
});
content.addEventListener("dragover", event => {
  if (event.target.closest(".quiz-drop")) event.preventDefault();
});
content.addEventListener("drop", event => {
  const zone = event.target.closest(".quiz-drop");
  if (!zone) return;
  event.preventDefault();
  const value = event.dataTransfer.getData("text/plain");
  const card = [...zone.closest(".formative-panel").querySelectorAll('[data-action="quiz-choice"]')]
    .find(button => button.dataset.value === value);
  if (card) handleFormative(card);
});
content.addEventListener("pointerdown", event => {
  const board = event.target.closest(".drawing-board");
  if (!board || !event.isPrimary || event.button !== 0) return;
  if (beginDrawing(board, penLocation(board, event), event.pointerId)) board.setPointerCapture(event.pointerId);
});
content.addEventListener("pointermove", event => {
  const board = event.target.closest(".drawing-board");
  const pen = board && penGestures.get(board);
  if (pen?.pointerId !== event.pointerId) return;
  pen.tip = penLocation(board, event);
  drawStroke(board, pen.origin, pen.tip);
});
for (const type of ["pointerup", "pointercancel"]) content.addEventListener(type, event => {
  const board = event.target.closest(".drawing-board");
  const pen = board && penGestures.get(board);
  if (pen?.pointerId !== event.pointerId) return;
  penGestures.delete(board);
  if (type === "pointercancel") {
    board.querySelector(".drawing-stroke").removeAttribute("d");
    return;
  }
  pen.tip = penLocation(board, event);
  drawStroke(board, pen.origin, pen.tip);
  finishDrawing(board.closest(".drawing-panel"), pen.origin, pen.tip);
});
content.addEventListener("keydown", event => {
  const board = event.target;
  if (!board.matches(".drawing-board")) return;
  const panel = board.closest(".drawing-panel");
  const pen = penGestures.get(board);
  if (event.key === "Enter" && !event.repeat) {
    event.preventDefault();
    if (pen && pen.pointerId === null) {
      penGestures.delete(board);
      finishDrawing(panel, pen.origin, pen.tip);
    } else if (!pen && drawingMarks(panel).length) {
      beginDrawing(board, drawingMarks(panel)[0], null);
    }
    return;
  }
  const direction = {ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,-10],ArrowDown:[0,10]}[event.key];
  if (!direction || !pen || pen.pointerId !== null) return;
  event.preventDefault();
  pen.tip = pen.tip.map((value, i) => Math.min(i ? 480 : 680, Math.max(20, value + direction[i])));
  drawStroke(board, pen.origin, pen.tip);
});
content.addEventListener("input", event => {
  if (event.target.id === "ray-angle") rotateRay(event.target.closest(".ray-lab"), true);
});
document.querySelector(".skip").addEventListener("click", event => {
  event.preventDefault();
  content.focus();
});
window.addEventListener("hashchange", () => render(true));
audio.setAttribute("aria-pressed", String(audioEnabled));
audio.textContent = audioEnabled ? "الصوت مفعّل" : "الصوت متوقف";
render();
