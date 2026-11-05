/* Saucy Bitez preview: the tray builder, menu boards, dish links with Back support, the large-order planner, reveals. */
(() => {
  const de = document.documentElement; de.classList.remove('no-js'); de.classList.add('js');
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const money = v => '$' + v.toFixed(2);
  const FLAME = '<svg class="flame" viewBox="0 0 12 16" aria-hidden="true"><path d="M6 0c1 3 5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3 0-6 1-8z"/></svg>';

  /* ---------- menu boards (ARIA tabs on wide screens, a native select on phones) ---------- */
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

  /* ---------- dish links: open the item's board, highlight it, Back returns ---------- */
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

  /* ---------- build your tray: three taps pick real items at real prices ---------- */
  const DATA = JSON.parse($('#tray-data').textContent);
  const byName = n => DATA.find(d => d.n === n);
  const SWEET = ['Milkshakes & Sweet Bitez', 'Crepes & Cake'];
  // crew kits: [item, people per unit]. Quantities are ceil(headcount / per), labelled as an estimate on the page.
  const KITS = {
    chicken: [['Saucy Wings (20 pcs)', 6], ['Chicken (20 pcs)', 10], ['Jerk Chicken Platter', 4], ['Loaded Jerk Chicken Fries', 5], ['Macaroni and Cheese', 6], ['Fresh Made Coleslaw', 6], ['Can soda', 1]],
    beef: [['Double Smashburger', 1], ['Loaded Chopped Cheese Fries', 4], ['Onion Rings', 4], ['Can soda', 1]],
    lamb: [['Lamb Platter', 2], ['Lamb Saucy Gyro', 2], ['French Fries', 4], ['Can soda', 1]],
    seafood: [['Seafood Platter', 3], ['Jumbo Shrimp (9 pcs)', 3], ['Seafood Whiting Fish (3 pcs)', 3], ['French Fries', 4], ['Can soda', 1]],
    mix: [['Saucy Wings (20 pcs)', 6], ['Jerk Chicken Platter', 4], ['Double Smashburger', 3], ['Lamb Saucy Gyro', 4], ['Loaded Crispy Chicken Fries', 5], ['Can soda', 1]],
    sweet: [['Oreo Crunch Milkshake', 3], ['Fruity Pebble Milkshake', 3], ['Cinnamon Crunch Milkshake', 3], ['Fried Oreos', 3], ['Butter Cookie Loaded Nachos', 4]],
  };
  const HOT_KITS = { 1: { chicken: ['Nashville Hot Tenders (5 pcs)', 4], mix: ['Nashville Hot Tenders (5 pcs)', 5], beef: ['Loaded Hot Cheeto Steak Fries', 5] }, 2: { chicken: ['Reaper Nashville Hot Chicken Sandwich', 3], mix: ['Reaper Nashville Hot Chicken Sandwich', 4], beef: ['Reaper Nashville Hot Chicken Sandwich', 4] } };
  const state = { who: 'me', n: 10, what: 'chicken', kick: 0, shuffle: 0 };
  const rot = (arr, k) => arr.length ? arr.slice(k % arr.length).concat(arr.slice(0, k % arr.length)) : arr;
  function mains(what, kick) {
    let pool = DATA.filter(d => d.r === 'main' && (what === 'sweet' ? SWEET.includes(d.c) : !SWEET.includes(d.c) && (what === 'mix' || d.g.includes(what))));
    if (what === 'mix') pool = pool.filter(d => d.f || d.g.includes('mix'));
    pool.sort((a, b) => (b.f - a.f));          // featured first, then the heat rule decides what leads
    let hot = false;
    if (kick === 0) { const mild = pool.filter(d => d.h === 0); if (mild.length >= 2) pool = mild; }
    else { const h = pool.filter(d => d.h >= (kick === 2 ? 2 : 1)); const h1 = kick === 2 && !h.length ? pool.filter(d => d.h >= 1) : h; if (h1.length) { pool = h1.concat(pool.filter(d => !h1.includes(d))); hot = true; } }
    return { pool, hot };
  }
  function build() {
    const { who, what, kick, shuffle } = state, n = Math.max(3, Math.min(60, state.n | 0)), lines = [], notes = [];
    if (who === 'crew') {
      const kit = KITS[what].map(([name, per]) => [byName(name), Math.ceil(n / per)]);
      const hk = HOT_KITS[kick] && HOT_KITS[kick][what];
      if (hk) { kit.splice(1, 0, [byName(hk[0]), Math.ceil(n / hk[1])]); notes.push(kick === 2 ? 'Reaper sandwiches in the mix for the brave.' : 'Nashville Hot in the mix for the brave.'); }
      else if (kick) notes.push(`Nothing on the ${what} board says Hot by name. Ask for ${kick === 2 ? 'Heat Up!' : 'Hot!'} at the counter.`);
      kit.forEach(([it, q]) => lines.push([it, q]));
      notes.unshift(`For ${n} people, as an estimate.`);
    } else {
      const { pool, hot } = mains(what, kick); const m = rot(pool, shuffle);
      if (!m.length) return { lines: [], notes: ['Nothing matched. Try another board.'] };
      lines.push([m[0], 1]);
      if (who === 'two') {
        const second = m.find(d => d.n !== m[0].n) || m[0]; lines.push([second, 1]);
        const share = what === 'chicken' || what === 'mix' ? rot(DATA.filter(d => d.c === 'Saucy Wings' && d.s <= 2), shuffle)[0]
          : what === 'sweet' ? byName('Fried Oreos') : rot(DATA.filter(d => d.r === 'share' && (d.g.includes(what) || what === 'lamb' || what === 'seafood')), shuffle)[0] || byName('French Fries');
        if (share) lines.push([share, 1]);
      } else if (what !== 'sweet') {
        const sides = rot(DATA.filter(d => d.r === 'side' && d.s >= 2), shuffle); lines.push([sides[0], 1]);
      }
      const drinks = what === 'sweet' ? rot(DATA.filter(d => d.r === 'drink' && SWEET.includes(d.c)), shuffle) : rot(DATA.filter(d => d.c === 'Drinks'), shuffle);
      if (!(what === 'sweet' && lines.some(([d]) => d.r === 'drink'))) lines.push([drinks[0], who === 'two' ? 2 : 1]);
      if (kick && hot) notes.push(kick === 2 ? 'Reaper on the tray. You asked.' : 'Hot by name. Say Hot! at the counter for the rest.');
      else if (kick) notes.push(`Nothing on the ${what} board says Hot by name. Ask for ${kick === 2 ? 'Heat Up!' : 'Hot!'} at the counter.`);
    }
    return { lines, notes };
  }
  const trayList = $('#tray-items'), trayNote = $('#tray-note'), trayTotal = $('#tray-total'), toPlanner = $('#tray-to-planner'), crewN = $('#crew-n'), crewInput = crewN && crewN.querySelector('input');
  let last = { lines: [] };
  function drawTray() {
    last = build();
    trayList.replaceChildren(...last.lines.map(([it, q], i) => {
      const li = document.createElement('li'); li.style.setProperty('--i', i);
      const qs = document.createElement('span'); qs.className = 'q'; qs.textContent = q > 1 ? `${q} ×` : '';
      const nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = it.n;
      if (it.h) { const h = document.createElement('span'); h.className = 'hl hl-' + it.h; h.innerHTML = FLAME.repeat(it.h) + `<span class="sr-only"> ${it.h === 2 ? 'heat up' : 'hot'}</span>`; nm.append(h); }
      const pr = document.createElement('span'); pr.className = 'pr'; pr.textContent = money(it.p * q);
      li.append(qs, nm, pr); return li;
    }));
    trayNote.textContent = last.notes.join(' ');
    trayTotal.textContent = money(last.lines.reduce((s, [it, q]) => s + it.p * q, 0));
    toPlanner.hidden = state.who !== 'crew';
  }
  function setRadio(group, btn) { $$('[role=radio]', group).forEach(b => b.setAttribute('aria-checked', b === btn)); }
  $$('.tray-tool .chips').forEach(group => {
    const radios = $$('[role=radio]', group);
    radios.forEach((b, i) => {
      b.addEventListener('click', () => { setRadio(group, b); pickChip(b); });
      b.addEventListener('keydown', e => {
        const k = e.key; let j = null;
        if (k === 'ArrowRight' || k === 'ArrowDown') j = (i + 1) % radios.length; else if (k === 'ArrowLeft' || k === 'ArrowUp') j = (i - 1 + radios.length) % radios.length;
        if (j !== null) { e.preventDefault(); setRadio(group, radios[j]); radios[j].focus(); pickChip(radios[j]); }
      });
    });
  });
  function pickChip(b) {
    if (b.dataset.who) { state.who = b.dataset.who; crewN.hidden = state.who !== 'crew'; if (state.who === 'crew') crewInput.focus(); }
    if (b.dataset.what) state.what = b.dataset.what;
    if (b.dataset.kick) { state.kick = +b.dataset.kick; $('#step-kick').dataset.kick = state.kick; }
    state.shuffle = 0; drawTray();
  }
  crewInput && crewInput.addEventListener('input', () => { state.n = +crewInput.value || 10; drawTray(); });
  $('#shuffle').addEventListener('click', () => { state.shuffle++; drawTray(); });
  toPlanner.addEventListener('click', () => {
    last.lines.forEach(([it]) => { if (!picked.includes(it.n)) picked.push(it.n); }); render();
    form.elements.people.value = Math.max(3, Math.min(60, state.n | 0));
    const line = 'Crew tray (estimate): ' + last.lines.map(([it, q]) => `${q} × ${it.n}`).join(', ');
    const nt = form.elements.notes; nt.value = nt.value.includes('Crew tray') ? nt.value.replace(/Crew tray \(estimate\):[^\n]*/, line) : (nt.value ? nt.value + '\n' : '') + line;
    const sec = $('#large-order'); sec.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); setTimeout(() => form.elements.name.focus({ preventScroll: true }), reduce ? 0 : 600);
  });
  $('#step-kick').dataset.kick = '0';
  drawTray();

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
