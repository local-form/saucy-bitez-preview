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

  /* ---------- the seam cup: tips once when it comes into view; still for reduced motion or slow links ---------- */
  const cup = $('.cup');
  if (cup && !reduce && 'IntersectionObserver' in window) {
    const c = navigator.connection || {}, slow = c.saveData || /(^|-)2g$/.test(c.effectiveType || '');
    if (!slow) {
      const still = cup.getAttribute('src');
      cup.src = cup.dataset.start;      // wait on the first frame until it is in view
      let blob = null, started = false, load = null;
      const fetchAnim = () => load || (load = fetch(cup.dataset.anim).then(r => r.ok ? r.blob() : Promise.reject()).then(b => (blob = URL.createObjectURL(b))).catch(() => null));
      const near = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { near.disconnect(); fetchAnim(); } }, { rootMargin: '600px 0px' });
      const afterLoad = f => document.readyState === 'complete' ? f() : addEventListener('load', f, { once: true });   // never compete with the hero photo
      afterLoad(() => near.observe(cup));
      const play = () => { if (started) return; started = true; fetchAnim();
        const timer = setTimeout(() => { if (!blob) cup.src = still; }, 5000);
        load.then(u => { clearTimeout(timer); cup.src = u || still; cup.classList.add('played'); });
      };
      const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); play(); } }, { threshold: 0.6 });
      afterLoad(() => io.observe(cup));
    }
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
