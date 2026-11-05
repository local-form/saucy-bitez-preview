/* Saucy Bitez preview: menu categories, dish links with Back support, the large-order planner, the seam cup, reveals. */
(() => {
  const de = document.documentElement; de.classList.remove('no-js'); de.classList.add('js');
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- menu categories ---------- */
  const tabs = $$('.cat-index [role=tab]'), panels = $$('.menu-panel'), pick = $('#cat-select');
  const idOf = t => t.getAttribute('aria-controls').slice(4);
  let current = tabs.length ? idOf(tabs[0]) : '';
  function selectCat(cid, focusTab) {
    const tab = tabs.find(t => idOf(t) === cid); if (!tab) return;
    current = cid;
    tabs.forEach(t => { const on = t === tab; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
    panels.forEach(p => p.toggleAttribute('data-off', p.id !== 'cat-' + cid));
    if (pick && pick.value !== cid) pick.value = cid;
    if (focusTab) tab.focus();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectCat(idOf(t)));
    t.addEventListener('keydown', e => {
      const k = e.key, n = tabs.length; let j = null;
      if (k === 'ArrowDown' || k === 'ArrowRight') j = (i + 1) % n; else if (k === 'ArrowUp' || k === 'ArrowLeft') j = (i - 1 + n) % n;
      else if (k === 'Home') j = 0; else if (k === 'End') j = n - 1;
      if (j !== null) { e.preventDefault(); selectCat(idOf(tabs[j]), true); }
    });
  });
  pick && pick.addEventListener('change', () => selectCat(pick.value));

  /* ---------- dish links: open the item's category, highlight it, Back returns ---------- */
  function revealItem(id, smooth) {
    const li = document.getElementById(id); if (!li) return false;
    const panel = li.closest('.menu-panel'); selectCat(panel.id.slice(4));
    li.tabIndex = -1; li.classList.add('hit');
    requestAnimationFrame(() => { li.scrollIntoView({ block: 'center', behavior: smooth && !reduce ? 'smooth' : 'auto' }); li.focus({ preventScroll: true }); });
    clearTimeout(li._t); li._t = setTimeout(() => li.classList.remove('hit'), 2600);
    return true;
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#m-"]'); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const id = a.getAttribute('href').slice(1); if (!document.getElementById(id)) return;
    e.preventDefault();
    history.replaceState({ ...(history.state || {}), y: scrollY, cat: current, back: a.id || null }, '');
    history.pushState({ item: id }, '', '#' + id);
    revealItem(id, true);
  });
  addEventListener('popstate', e => {
    const s = e.state || {};
    if (s.item) { revealItem(s.item, false); return; }
    if (s.cat) selectCat(s.cat);
    if (typeof s.y === 'number') requestAnimationFrame(() => scrollTo({ top: s.y, behavior: 'instant' }));
    else if (location.hash.startsWith('#m-')) revealItem(location.hash.slice(1), false);
  });
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (location.hash.startsWith('#m-')) revealItem(location.hash.slice(1), false);

  /* ---------- large-order planner ---------- */
  const form = $('#planner'), dishSel = $('#dish-select'), chosen = $('#chosen'), empty = $('#chosen-empty'), note = $('#added-note'), result = $('#result');
  const KEY = 'sb-order-idea';
  let picked = []; try { picked = JSON.parse(sessionStorage.getItem(KEY) || '[]').filter(x => typeof x === 'string'); } catch (_) {}
  const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(picked)); } catch (_) {} };
  function render() {
    chosen.replaceChildren(...picked.map(name => {
      const li = document.createElement('li'), t = document.createElement('span'), b = document.createElement('button');
      t.textContent = name; b.type = 'button'; b.textContent = '×'; b.setAttribute('aria-label', `Remove ${name}`);
      b.addEventListener('click', () => { remove(name); (chosen.querySelector('button') || dishSel).focus(); });
      li.append(t, b); return li;
    }));
    empty.hidden = picked.length > 0;
    $$('[data-add]').forEach(b => { const on = picked.includes(b.dataset.add); b.setAttribute('aria-pressed', on); b.textContent = on ? 'Added to large order' : 'Add to large order'; });
    save();
  }
  function add(name) { if (name && !picked.includes(name)) picked.push(name); render(); }
  function remove(name) { picked = picked.filter(x => x !== name); render(); }
  $('#add-item').addEventListener('click', () => { if (!dishSel.value) { dishSel.focus(); return; } add(dishSel.value); dishSel.value = ''; });
  $$('[data-add]').forEach(b => b.addEventListener('click', () => {
    const name = b.dataset.add, had = picked.includes(name);
    had ? remove(name) : add(name);
    note.replaceChildren(document.createTextNode(had ? `${name} removed. ` : `${name} added. `));
    if (picked.length) { const l = document.createElement('a'); l.href = '#large-order'; l.textContent = `Your order idea (${picked.length})`; note.append(l); }
  }));
  const d = new Date(); form.elements.date.min = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  function setErr(input, msg) {
    const label = input.closest('label'); let e = label.querySelector('.err');
    if (!msg) { input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); e && e.remove(); return; }
    if (!e) { e = document.createElement('span'); e.className = 'err'; e.id = 'err-' + input.name; label.append(e); }
    e.textContent = msg; input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', e.id);
  }
  ['name', 'phone'].forEach(n => form.elements[n].addEventListener('input', e => e.target.getAttribute('aria-invalid') && setErr(e.target, '')));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const f = form.elements, name = f.name.value.trim(), phone = f.phone.value.trim();
    setErr(f.name, name ? '' : 'Add your name so the shop knows who’s calling.');
    setErr(f.phone, phone.replace(/\D/g, '').length >= 10 ? '' : 'Add a phone number with area code.');
    const bad = form.querySelector('[aria-invalid=true]'); if (bad) { bad.focus(); return; }
    if (dishSel.value) { add(dishSel.value); dishSel.value = ''; }
    const people = f.people.value, date = f.date.value, ful = f.fulfillment.value, notes = f.notes.value.trim();
    const when = date ? new Date(date + 'T12:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : '';
    const lines = [`Large-order idea for ${name} (${phone})`, [people && `${people} people`, when, ful].filter(Boolean).join(' · '),
      picked.length ? 'Dishes: ' + picked.join(', ') : 'Dishes: to talk through on the phone', notes && 'Notes: ' + notes].filter(Boolean);
    result.replaceChildren();
    const h = document.createElement('strong'); h.textContent = 'Your order idea';
    result.append(h, ...lines.map(t => { const p = document.createElement('p'); p.textContent = t; return p; }));
    const fine = document.createElement('p'); fine.className = 'fine'; fine.style.color = '#CFC5B5';
    fine.textContent = 'Preview only: nothing was sent. Call the shop to confirm the order, the price and the pickup time.';
    const row = document.createElement('div'); row.className = 'row';
    const call = document.createElement('a'); call.className = 'btn'; call.href = 'tel:+19733378632'; call.textContent = 'Call (973) 337-8632';
    const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'btn btn-line'; copy.textContent = 'Copy order idea';
    copy.addEventListener('click', async () => {
      const text = lines.join('\n');
      try { await navigator.clipboard.writeText(text); copy.textContent = 'Copied'; }
      catch (_) { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.append(ta); ta.select(); try { document.execCommand('copy'); copy.textContent = 'Copied'; } catch (_) { copy.textContent = 'Select and copy above'; } ta.remove(); }
    });
    row.append(call, copy); result.append(fine, row); result.hidden = false; result.focus();
  });
  render();

  /* ---------- the pour: scroll tips the cup (36 frames from the front); a straight stream and a gooey pool are drawn in SVG ---------- */
  const pour = $('#pour'), cup = $('.cup'), sauce = $('.sauce');
  const conn = navigator.connection || {}, slow = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
  const afterLoad = f => document.readyState === 'complete' ? f() : addEventListener('load', f, { once: true });   // never compete with the hero photo
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ss = (v, a, b) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  let drawPour = () => {};
  if (pour && cup && sauce) {
    const N = +cup.dataset.n, url = i => cup.dataset.frames + String(i).padStart(2, '0') + '.webp', LIPS = JSON.parse(cup.dataset.lips);
    const stage = pour.querySelector('.pour-stage'), stream = $('.stream', sauce), blobs = $('.blobs', sauce), gloss = $('.gloss', sauce), shadow = $('.pool-shadow', sauce), splash = $('.splash', sauce);
    const ready = [true]; let cur = 0, L = null;
    let seed = 3; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const show = i => { let j = i; while (j > 0 && !ready[j]) j--; if (j !== cur) { cur = j; cup.src = url(j); } };
    const layout = () => {           // everything in stage pixels
      const st = stage.getBoundingClientRect(), cr = cup.getBoundingClientRect();
      const W = st.width, H = st.height, cx = cr.left - st.left, cy = cr.top - st.top, cw = cr.width, ch = cr.height;
      sauce.setAttribute('viewBox', `0 0 ${W.toFixed(0)} ${H.toFixed(0)}`);
      const py = Math.min(H - 36, cy + ch + Math.max(90, H * 0.2)), w = clamp(cw * 0.075, 12, 38), left = Math.max(W * 0.1, 16);
      seed = 3; const bl = [];
      const span = (cx + cw * 0.96) - left;
      for (let i = 0; i < 26; i++) { const u = i / 25, x = cx + cw * 0.96 - span * Math.pow(u, 1.15); bl.push({ x, r: w * (2.2 + 1.4 * rnd()) * (1 - 0.45 * u), t: 0.02 + 0.86 * u, dy: (rnd() - 0.5) * w * 1.1 }); }
      bl.push({ x: cx + cw * 0.96 - w * 0.6, r: w * 3.4, t: 0, dy: -w * 0.5, tall: 1 });
      for (let i = 0; i < 6; i++) bl.push({ x: cx + cw * 0.96 + w * (1.5 + 3 * rnd()), r: w * (0.9 + 0.8 * rnd()), t: 0.04 + 0.25 * rnd(), dy: (rnd() - 0.5) * w * 0.6 });
      L = { W, H, cx, cy, cw, ch, py, w, left, bl, span };
      blobs.replaceChildren(); gloss.replaceChildren();
      bl.forEach(() => { blobs.append(document.createElementNS('http://www.w3.org/2000/svg', 'ellipse')); gloss.append(document.createElementNS('http://www.w3.org/2000/svg', 'ellipse')); });
    };
    const render = p => {
      if (!L) layout();
      const { W, H, cx, cy, cw, ch, py, w, bl } = L, f = Math.round(clamp(p / 0.4) * (N - 1)); show(f);
      const lip = LIPS[Math.min(cur, LIPS.length - 1)], lx = cx + lip[0] * cw, ly = cy + lip[1] * ch;
      const fall = ss(p, 0.3, 0.42), landed = p > 0.4, flow = ss(p, 0.3, 0.5);
      // stream: straight down from the rim, thick at the top, narrowing, a slow wobble in the width
      const y1 = ly + (py - ly) * fall; let d = '';
      if (fall > 0.01) {
        const n = 18, l = [], r = [];
        for (let i = 0; i <= n; i++) { const k = i / n, y = ly - 4 + (y1 - ly + 4) * k, hw = w * 0.5 * (1.1 - 0.4 * k) * (0.92 + 0.08 * Math.sin(k * 11 + p * 6)) * (0.35 + 0.65 * flow), wob = Math.sin(k * 7 + 2) * w * 0.05; l.push([lx + wob - hw, y]); r.push([lx + wob + hw, y]); }
        d = 'M' + l.map(q => q.join(',')).join(' L') + ' L' + r.reverse().map(q => q.join(',')).join(' L') + 'Z';
      }
      stream.setAttribute('d', d);
      // pool: blobs born over time, growing, squashed flat on the counter
      const g = clamp((p - 0.42) / 0.58);
      [...blobs.children].forEach((e, i) => { const b = bl[i], k = ss(g, b.t, b.t + 0.22), rx = b.r * k * (1 + 0.08 * Math.sin(i)), ry = rx * (b.tall ? 0.5 : 0.4);
        e.setAttribute('cx', b.x.toFixed(1)); e.setAttribute('cy', (py + b.dy * 0.3).toFixed(1)); e.setAttribute('rx', rx.toFixed(1)); e.setAttribute('ry', ry.toFixed(1));
        const h = gloss.children[i]; h.setAttribute('cx', (b.x - rx * 0.18).toFixed(1)); h.setAttribute('cy', (py + b.dy * 0.3 - ry * 0.42).toFixed(1)); h.setAttribute('rx', (rx * 0.55).toFixed(1)); h.setAttribute('ry', (ry * 0.35).toFixed(1)); });
      // the pool's shadow on the counter
      const sw = (L.span * Math.pow(g, 0.9) + w * 3), sx = cx + cw * 0.96 - sw * 0.5 + w * 2;
      shadow.setAttribute('cx', sx.toFixed(1)); shadow.setAttribute('cy', (py + w * 0.35).toFixed(1)); shadow.setAttribute('rx', (sw * 0.55).toFixed(1)); shadow.setAttribute('ry', (w * 1.2 + sw * 0.03).toFixed(1)); shadow.style.opacity = landed ? '' : '0';
      // splash: three drops kick up when the stream first lands
      const sp = clamp((p - 0.4) / 0.14), up = Math.sin(sp * Math.PI);
      [...splash.children].forEach((e, i) => { const dx = (i - 1) * w * 1.6 * sp, r = w * 0.22 * (1 - 0.5 * sp); e.setAttribute('cx', (lx + dx).toFixed(1)); e.setAttribute('cy', (py - up * w * (2 + i * 0.6)).toFixed(1)); e.setAttribute('r', r.toFixed(1)); e.style.opacity = sp > 0 && sp < 1 ? '' : '0'; });
    };
    if (reduce || slow || !('IntersectionObserver' in window)) {
      for (let i = 0; i < N; i++) ready[i] = true;
      cup.src = url(N - 1); cur = N - 1;
      const done = () => { layout(); render(1); };
      cup.complete ? done() : cup.addEventListener('load', done, { once: true });
      addEventListener('resize', () => { L = null; done(); });
    } else {
      pour.classList.add('scrub');
      cup.src = url(0);
      const near = new IntersectionObserver(es => {
        if (!es.some(e => e.isIntersecting)) return; near.disconnect();
        for (let i = 1; i < N; i++) { const im = new Image(); im.src = url(i); (im.decode ? im.decode() : Promise.resolve()).then(() => { ready[i] = true; drawPour(); }, () => {}); }
      }, { rootMargin: '900px 0px' });
      afterLoad(() => near.observe(pour));
      drawPour = () => {
        const r = pour.getBoundingClientRect(), vh = innerHeight, run = r.height - (vh - 60) + vh * 0.35;
        render(clamp((vh * 0.35 - r.top) / run));
      };
      addEventListener('resize', () => { L = null; drawPour(); });
      cup.complete ? drawPour() : cup.addEventListener('load', drawPour, { once: true });
    }
  }

  /* ---------- scroll motion: hero parallax, photos drifting inside their tiles ---------- */
  const heroPhoto = $('.hero-photo'), heroSign = $('.hero-sign'), tiles = $$('.dish figure');
  let ticking = false;
  const onScroll = () => {
    ticking = false; const y = scrollY, vh = innerHeight;
    if (!reduce) {
      if (y < vh * 1.2) { if (heroPhoto) heroPhoto.style.transform = `translate3d(0,${(y * 0.22).toFixed(1)}px,0)`; if (heroSign) heroSign.style.transform = `translate3d(0,${(y * 0.07).toFixed(1)}px,0)`; }
      tiles.forEach(f => { const r = f.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return; const k = (r.top + r.height / 2 - vh / 2) / vh; f.style.setProperty('--py', (clamp(k, -1, 1) * -30).toFixed(1) + 'px'); });
    }
    drawPour();
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- the storefront sign flickers on once ---------- */
  const store = $('.store');
  if (store && !reduce && 'IntersectionObserver' in window) {
    const so = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { so.disconnect(); store.classList.add('lit'); } }, { threshold: 0.35 });
    so.observe(store);
  }

  /* ---------- reveals (house standard) ---------- */
  const els = $$('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) els.forEach(e => e.classList.add('is-visible'));
  else {
    const n = new Map();
    els.forEach(e => { const p = e.parentElement, i = n.get(p) || 0; e.style.setProperty('--d', i * .08 + 's'); n.set(p, i + 1); });
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } }), { threshold: .01, rootMargin: '0px 0px -8% 0px' });
    els.forEach(e => io.observe(e));
    setTimeout(() => els.forEach(e => { if (e.getBoundingClientRect().top < innerHeight) e.classList.add('is-visible'); }), 1500);
  }
})();
