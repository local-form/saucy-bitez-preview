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

  /* ---------- the pour: scroll tips the cup (36 pre-rendered frames), the drizzle is uncovered along its own path ---------- */
  const pour = $('#pour'), cup = $('.cup');
  const conn = navigator.connection || {}, slow = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
  const afterLoad = f => document.readyState === 'complete' ? f() : addEventListener('load', f, { once: true });   // never compete with the hero photo
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  let drawPour = () => {};
  if (pour && cup && !reduce && !slow && 'IntersectionObserver' in window) {
    const N = +cup.dataset.n, url = i => cup.dataset.frames + String(i).padStart(2, '0') + '.webp';
    const [mw, mo] = $$('.mk', pour), ready = [true];
    let cur = 0;
    const setDraw = (pth, d) => { pth.style.strokeDasharray = '1 1'; pth.style.strokeDashoffset = (1 - d).toFixed(4); };
    const show = i => { let j = i; while (j > 0 && !ready[j]) j--; if (j !== cur) { cur = j; cup.src = url(j); } };
    pour.classList.add('scrub');
    cup.src = url(0); setDraw(mo, 0); setDraw(mw, 0);
    const near = new IntersectionObserver(es => {
      if (!es.some(e => e.isIntersecting)) return; near.disconnect();
      for (let i = 1; i < N; i++) { const im = new Image(); im.src = url(i); (im.decode ? im.decode() : Promise.resolve()).then(() => { ready[i] = true; drawPour(); }, () => {}); }
    }, { rootMargin: '900px 0px' });
    afterLoad(() => near.observe(pour));
    drawPour = () => {
      const r = pour.getBoundingClientRect(), vh = innerHeight, run = r.height - (vh - 60) + vh * 0.35;
      const p = clamp((vh * 0.35 - r.top) / run);
      show(Math.round(clamp(p / 0.5) * (N - 1)));
      setDraw(mo, clamp((p - 0.26) / 0.52)); setDraw(mw, clamp((p - 0.5) / 0.44));
    };
    addEventListener('resize', drawPour);
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
