/* Navigation previews lesson screens without recording completed work. */
(() => {
  'use strict';
  const screens = [
    ['', 'أهداف الدرس'], ['warmup', 'التهيئة'], ['explore', 'الاستكشاف'],
    ['explain', 'الشرح'], ['experiment', 'التجربة'], ['drawing', 'تدريب الرسم'],
    ['application', 'التطبيق'], ['naming', 'تسمية الشعاع'],
    ['naming-segment', 'تسمية القطعة المستقيمة'], ['naming-line', 'تسمية المستقيم'],
    ['formative', 'التقويم: التمييز'], ['assessment-drawing', 'التقويم: رسم الشعاع'],
    ['assessment-drawing-line', 'التقويم: رسم المستقيم'],
    ['assessment-ray', 'التقويم: تسمية الشعاع'],
    ['assessment-segment', 'التقويم: تسمية القطعة'], ['assessment-line', 'التقويم: تسمية المستقيم'],
    ['review', 'خريطة إنجازي'], ['review-answers', 'مراجعة الإجابات'], ['summary', 'الملخّص']
  ];
  const target = stage => '#lesson/geometry/0' + (stage ? '/' + stage : '');
  function addNavigation() {
    const [route, world, lesson, rawStage = ''] = location.hash.slice(1).split('/');
    if (route !== 'lesson' || world !== 'geometry' || lesson !== '0') return;
    const stage = rawStage === 'assessment-drawing-ray' ? 'assessment-drawing' : rawStage;
    const current = screens.findIndex(([key]) => key === stage);
    if (current < 0) return;
    const region = document.createElement('section');
    region.className = 'lesson-screen-nav';
    region.setAttribute('aria-label', 'التنقل بين شاشات الدرس');
    region.innerHTML = `<strong>التنقّل السريع بين شاشات الدرس</strong>
      <p>يمكنك استعراض الشاشات بحرية. التنقّل وحده لا يمنح نجوم الإنجاز.</p>
      <div class="lesson-screen-controls">
        <button type="button" data-screen-previous ${current === 0 ? 'disabled' : ''}>→ السابقة</button>
        <label>انتقل إلى الشاشة
          <select aria-label="اختر شاشة الدرس">${screens.map(([key, label], i) =>
            `<option value="${key}" ${i === current ? 'selected' : ''}>${i + 1}. ${label}</option>`).join('')}</select>
        </label>
        <button type="button" data-screen-next ${current === screens.length - 1 ? 'disabled' : ''}>التالية ←</button>
      </div>
      <small>الشاشة ${current + 1} من ${screens.length}</small>`;
    region.querySelector('select').addEventListener('change', e => { location.hash = target(e.target.value); });
    region.querySelector('[data-screen-previous]').addEventListener('click', () => {
      if (current > 0) location.hash = target(screens[current - 1][0]);
    });
    region.querySelector('[data-screen-next]').addEventListener('click', () => {
      if (current < screens.length - 1) location.hash = target(screens[current + 1][0]);
    });
    document.querySelector('#content').prepend(region);
  }
  const originalRender = window.render;
  window.render = function (...args) { originalRender.apply(this, args); addNavigation(); };
  addNavigation();
})();
