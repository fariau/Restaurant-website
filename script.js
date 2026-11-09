/* Chaupal assistant: plain conversation, no buttons or option lists. */
const MEALS = {
  dinner: { n: 'dinner', a: 2900, k: 1399, t: 'every day, 7 to 9 PM and again from 9:30 PM to midnight' },
  brunch: { n: 'weekend brunch', a: 1899, k: 1099, t: 'Saturday and Sunday, 10 AM to 12 PM and 12 to 2 PM' },
  hitea: { n: 'Hi-Tea', a: 1638, k: 999, t: 'Friday to Sunday, 4 to 6 PM' }
};
const NUMW = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const rs = n => 'Rs ' + n.toLocaleString('en-US');
const cap = s => s.replace(/\b\w/g, c => c.toUpperCase());
const join = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : (a[0] || '');
let sel = {}, bk = null;

/* ---------- selection of buffets typed in plain text ---------- */
const mealOf = t => /dinner/.test(t) ? 'dinner' : /brunch/.test(t) ? 'brunch' : /hi-?\s?tea|high tea/.test(t) ? 'hitea' : null;
function parseSel(t) {
  if (!/\d|\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/.test(t)) return null;
  const out = {}; let last = null, any = false;
  t.replace(/[,&]|\band\b|\bplus\b/g, '|').split('|').forEach(seg => {
    const own = mealOf(seg), m = own || last; if (!m) return;
    if (!own && !/kid|child|adult|person|people|guest/.test(seg)) return;
    const dm = seg.match(/\d+/), wm = seg.split(/\s+/).find(w => NUMW[w]);
    const q = dm ? +dm[0] : (wm ? NUMW[wm] : 0); if (!q) return;
    const k = /kid|child|little/.test(seg) ? 'k' : 'a';
    out[m] = out[m] || { a: 0, k: 0 }; out[m][k] += Math.min(q, 30); last = m; any = true
  });
  return any ? out : null
}
const desc = s => join(Object.entries(s).flatMap(([m, v]) => [v.a && `${v.a} adult ${MEALS[m].n}${v.a > 1 ? 's' : ''}`, v.k && `${v.k} child ${MEALS[m].n}${v.k > 1 ? 's' : ''}`].filter(Boolean)));
const total = s => Object.entries(s).reduce((x, [m, v]) => x + v.a * MEALS[m].a + v.k * MEALS[m].k, 0);
const heads = s => Object.values(s).reduce((x, v) => x + v.a + v.k, 0);
function merge(s) { for (const [m, v] of Object.entries(s)) { sel[m] = sel[m] || { a: 0, k: 0 }; sel[m].a += v.a; sel[m].k += v.k } }

/* ---------- reading day, time, guests from free text ---------- */
const SERVICE = [[10, 14, 'brunch'], [16, 18, 'hi-tea'], [19, 24, 'dinner']];
const mealAt = h => (SERVICE.find(([a, b]) => h >= a && h < b) || [])[2];
const fmt = (h, m) => (h % 12 || 12) + ':' + String(m).padStart(2, '0') + ' ' + (h >= 12 && h < 24 ? 'PM' : 'AM');
const onDay = d => d === 'Today' ? 'today' : d === 'Tomorrow' ? 'tomorrow' : 'on ' + d;
function getDate(t) {
  if (/\b(today|tonight)\b/.test(t)) return 'Today';
  if (/\btomorrow\b/.test(t)) return 'Tomorrow';
  let m = t.match(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tues?|wed|thu|thurs?|fri|sat)\b/);
  if (m) return cap(DAYS.find(d => d.startsWith(m[1].slice(0, 3))));
  m = t.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s*(?:of\s*)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/);
  if (m) return (+m[1]) + ' ' + cap(m[2]);
  m = t.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{1,2})\b/);
  return m ? (+m[2]) + ' ' + cap(m[1]) : null
}
function getTime(t) {
  let m = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)/i);
  if (m) { let h = (+m[1]) % 12; if (/p/i.test(m[3])) h += 12; return { h, m: +(m[2] || 0) } }
  if (/\bnoon\b/.test(t)) return { h: 12, m: 0 };
  m = t.match(/\bat\s*(\d{1,2})(?::(\d{2}))?\b/i) || (bk && bk.ask === 'time' && t.match(/^\s*(\d{1,2})(?::(\d{2}))?\s*$/));
  if (m) { const h = +m[1], mi = +(m[2] || 0); if (h >= 1 && h <= 9) return { h: h + 12, m: mi }; if (h === 12) return { h: 12, m: mi }; if (h === 10 || h === 11) return { amb: h, m: mi } }
  return null
}
function getGuests(t) {
  const w = 'one|two|three|four|five|six|seven|eight|nine|ten';
  let m = t.match(/(?:for|party of|group of|table of|total of)\s*(\d{1,2})\b(?!\s*(?::\d|a\.?m|p\.?m|o'clock))/i) || t.match(/\b(\d{1,2})\s*(?:people|persons|person|guests|pax|of us|adults)/i) || t.match(new RegExp('(?:for|party of)\\s*(' + w + ')\\b', 'i'));
  if (!m && bk && bk.ask === 'guests') m = t.match(/^\s*(\d{1,2})\s*$/) || t.match(new RegExp('^\\s*(' + w + ')\\s*$', 'i'));
  if (!m) return null; const n = NUMW[m[1].toLowerCase()] || +m[1]; return n > 12 ? -1 : n
}

/* ---------- table booking, filled from whatever the guest says ---------- */
function fill(t) {
  const d = bk.d, got = [];
  const dt = getDate(t); if (dt && dt !== d.date) { d.date = dt; got.push(dt.toLowerCase() === 'today' || dt === 'Tomorrow' ? dt.toLowerCase() : dt) }
  const tm = getTime(t);
  if (tm) { if (tm.amb) { bk.amb = { h: tm.amb, m: tm.m }; bk.ask = 'time' } else { const meal = mealAt(tm.h); if (!meal) bk.bad = true; else { d.time = fmt(tm.h, tm.m); d.meal = meal; got.push(d.time) } } }
  const g = getGuests(t);
  if (g === -1) bk.big = true; else if (g && g !== d.guests) { d.guests = g; got.push(g + (g > 1 ? ' guests' : ' guest')) }
  const pm = t.match(/\+?\d[\d\s-]{8,}\d/);
  if (pm && pm[0].replace(/\D/g, '').length >= 10) { d.phone = pm[0].trim(); got.push('your number') }
  return got
}
function summary() {
  const d = bk.d;
  return `Here is your booking: a table for ${d.guests} ${onDay(d.date)} at ${d.time} (${d.meal}), under the name ${d.name}, phone ${d.phone}.` +
    (Object.keys(sel).length ? ` Your buffet selection is ${desc(sel)}, about ${rs(total(sel))} plus tax, paid at the restaurant.` : '') +
    ' Shall I confirm it? Reply yes to confirm, or tell me what to change.'
}
function next(got) {
  const d = bk.d, pre = got && got.length ? 'Got it, ' + join(got) + '. ' : '';
  if (bk.bad) { bk.bad = false; return pre + 'We seat guests during our meal times: brunch from 10 AM to 2 PM on weekends, Hi-Tea from 4 to 6 PM Friday to Sunday, and dinner from 7 PM to midnight. What time works for you?' }
  if (bk.big) { bk.big = false; return pre + 'For parties above 12, please call the branch so they can arrange seating. If you are 12 or fewer, how many guests will there be?' }
  if (bk.amb) { bk.ask = 'time'; return pre + `Is that ${bk.amb.h} AM or ${bk.amb.h} PM?` }
  if (!d.date) { bk.ask = 'date'; return pre + 'Which day would you like to come in?' }
  if (!d.time) { bk.ask = 'time'; return pre + 'What time suits you? Dinner starts at 7 PM, brunch is 10 AM to 2 PM on weekends, and Hi-Tea is 4 to 6 PM Friday to Sunday.' }
  if (!d.guests) { bk.ask = 'guests'; return pre + 'How many guests will there be?' }
  if (!d.name) { bk.ask = 'name'; return pre + 'Lovely. What name should I put the booking under?' }
  if (!d.phone) { bk.ask = 'phone'; return pre + 'And a phone number we can reach you on?' }
  bk.ask = 'confirm'; return pre + summary()
}
function finish() {
  const d = bk.d, id = 'TBL-' + (1000 + Math.floor(Math.random() * 9000));
  const msg = `You are all set, ${d.name.split(' ')[0]}. Your reference is ${id}: a table for ${d.guests} ${onDay(d.date)} at ${d.time}. We hold tables for 15 minutes after the booking time, and your buffet is paid for at the restaurant. See you soon!`;
  bk = null; sel = {}; return msg
}
function step(t) {
  if (/^(cancel|stop|never ?mind|forget it|exit)\b/.test(t)) { bk = null; return 'No problem, I have cancelled that. Is there anything else I can help with?' }
  if (bk.ask === 'confirm') {
    if (/^(y|yes|yeah|yep|confirm|ok|okay|sure|correct|go ahead)\b/.test(t)) return finish();
    const got = fill(t); if (got.length || bk.bad || bk.big) return next(got);
    if (/^no\b/.test(t)) { bk = null; return 'Okay, I have not booked anything. Tell me whenever you are ready and we will start again.' }
    return faq(t) || 'I was not sure what to change. Reply yes to confirm, or tell me the new day, time or number of guests.'
  }
  if (bk.amb) {
    const a = bk.amb, am = /\b(am|morning)\b/.test(t), pm = /\b(pm|night|evening|dinner)\b/.test(t);
    if (am || pm) {
      const h = a.h + (pm ? 12 : 0), meal = mealAt(h); bk.amb = null;
      if (!meal) { bk.bad = true; return next([]) }
      bk.d.time = fmt(h, a.m); bk.d.meal = meal; return next([bk.d.time])
    }
  }
  const got = fill(t);
  if (!got.length && !bk.amb && !bk.bad && !bk.big && bk.ask === 'name') {
    const n = t.replace(/^(my name is|i am|i'm|this is|it's|its|name is|call me)\s+/i, '').trim();
    if (/^[a-z][a-z .'-]{1,40}$/i.test(n)) { bk.d.name = cap(n); got.push('the name ' + bk.d.name) }
  }
  if (got.length || bk.amb || bk.bad || bk.big) return next(got);
  const f = faq(t); return (f ? f + '\n\n' : 'I did not quite catch that. ') + next([])
}

/* ---------- answers to common questions, in plain sentences ---------- */
function faq(t) {
  if (/price|cost|how much|rate|fee|per head|charge|worth/.test(t)) {
    const s = parseSel(t);
    if (s) return `For ${desc(s)}, it comes to about ${rs(total(s))} plus tax, paid at the restaurant.`;
    const m = mealOf(t);
    if (m) { const x = MEALS[m]; return `${cap(x.n)} is ${rs(x.a)} per adult and ${rs(x.k)} for kids aged 4 to 7, plus tax. It is served ${x.t}.` }
    return 'Prices are per person, plus tax. Dinner is Rs 2,900 for adults and Rs 1,399 for kids aged 4 to 7. Weekend brunch is Rs 1,899 and Rs 1,099. Hi-Tea is Rs 1,638 and Rs 999. Tell me how many of each you would like and I will work out the total.'
  }
  if (/hour|open|close|timing|time|when|slot|late/.test(t)) return 'Dinner runs every day from 7 to 9 PM and again from 9:30 PM until midnight. Weekend brunch is Saturday and Sunday, 10 AM to 12 PM and 12 to 2 PM. Hi-Tea is Friday to Sunday, 4 to 6 PM.';
  if (/veg|no meat|salad/.test(t)) return 'Yes, there are vegetarian dishes such as chana and aloo tarkari, plus salads and desserts. The line-up rotates, so it is worth calling the branch if you need something specific.';
  if (/spread|menu|food|dish|serve|bbq|what.*(have|eat|on)|offer|kabab|nihari|dessert/.test(t)) return 'Expect charcoal BBQ like chicken tikka, beef bihari kabab and malai boti, desi dishes such as nihari, paya and jalfrezi, Chinese like chicken manchurian, prawns and fried fish, vegetarian dishes, and a dessert counter with kheer, kulfi, ice cream and jelly. The spread changes through the week.';
  if (/kid|child|toddler|age/.test(t)) return 'Kids’ prices apply to children aged 4 to 7: Rs 1,399 for dinner, Rs 1,099 for brunch and Rs 999 for Hi-Tea, plus tax. For children outside that range, please check with the branch.';
  if (/pay|cash|card|tax|gst|bill/.test(t)) return 'Buffet prices are per person plus tax, and you settle the bill at the restaurant after your meal.';
  if (/contact|phone|call|number|address|location|where|branch|direction|karsaz|seaview/.test(t)) return 'You can call Seaview on 0304-1110024 or Karsaz on 0300 3716888. Both branches are in Karachi.';
  if (/takeaway|take away|deliver|parcel|order online|catering/.test(t)) return 'Chaupal is a dine-in buffet. For takeaway or catering, please call the branch directly.';
  if (/thank|shukr/.test(t)) return 'You are very welcome! Anything else I can help with?';
  if (/who are you|are you (a )?(bot|human|real)|your name/.test(t)) return 'I am Chaupal’s virtual assistant. I can answer questions about prices, timings and the spread, and take a table booking.';
  if (/\bhelp\b|what can you/.test(t)) return 'I can tell you our buffet prices and timings, what is on the spread, and book you a table. You can also say something like “2 dinner and 1 child dinner” and I will work out the cost.';
  return null
}
function reply(raw) {
  const t = raw.toLowerCase().trim();
  if (bk) return step(t);
  if (/^(hi|hello|hey|salam|assalam|aoa|good (morning|afternoon|evening))\b/.test(t)) return 'Hello, welcome to Chaupal! I can tell you about our buffet prices, timings and what is on the spread, or book you a table. What would you like to know?';
  if (/\b(table|reserv|booking|book)\b/.test(t)) {
    bk = { d: {}, ask: null }; const g = heads(sel); if (g) bk.d.guests = g;
    const m = mealOf(t); const got = fill(t); const r = next(got);
    return (got.length ? '' : m ? `Happy to book you in for ${MEALS[m].n}. ` : 'Happy to help with that. ') + r
  }
  const s = parseSel(t);
  if (s && !/\b(when|what time|timing|hours|open|close)\b/.test(t)) {
    if (/price|cost|how much|total|worth/.test(t)) return `For ${desc(s)}, it comes to about ${rs(total(s))} plus tax, paid at the restaurant.`;
    merge(s); return `Noted, ${desc(sel)}. That comes to about ${rs(total(sel))} plus tax, paid at the restaurant. Would you like me to reserve a table for that? Just tell me the day and time, for example “tomorrow at 8 PM”.`
  }
  return faq(t) || 'I am not sure about that one, but I can help with buffet prices, timings, what is on the spread, or booking a table. For anything else, please call Seaview on 0304-1110024 or Karsaz on 0300 3716888.'
}

/* ---------- chat window ---------- */
const log = document.getElementById('log'), inp = document.getElementById('in'), chat = document.getElementById('chat'), launch = document.getElementById('launch');
const down = () => { log.scrollTop = log.scrollHeight };
function add(cls, text) { const d = document.createElement('div'); d.className = 'msg ' + cls; d.textContent = text; log.appendChild(d); down(); return d }
function botSay(text) {
  const d = add('bot', ''); d.innerHTML = '<span class="dots"><i></i><i></i><i></i></span>'; down();
  setTimeout(() => { d.textContent = text; down() }, Math.min(450 + text.length * 6, 1400))
}
function send(t) { add('usr', t); botSay(reply(t)) }
function openChat(msg) { chat.classList.add('open'); launch.classList.add('hide'); if (msg) send(msg); else inp.focus() }
function closeChat() { chat.classList.remove('open'); launch.classList.remove('hide') }
document.getElementById('f').onsubmit = e => { e.preventDefault(); const v = inp.value.trim(); if (!v) return; inp.value = ''; send(v) };
launch.onclick = () => openChat();
document.getElementById('closebtn').onclick = closeChat;
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeChat() });
document.querySelectorAll('[data-chat]').forEach(b => b.onclick = () => openChat(b.dataset.chat));
botSay('Hi there, and welcome to Chaupal! Ask me about buffet prices, timings or what is on the spread, or tell me when you would like a table and I will book it.');

/* ---------- motion: reveal on scroll, kinetic headings, 3D tilt, ticker speed, price count-up, progress bar ---------- */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.sec h2,.band h2').forEach(h => {
    const label = h.textContent.trim(); h.classList.add('kh'); h.setAttribute('aria-label', label);
    h.innerHTML = label.split(/\s+/).map((w, i) => `<span class="kw" aria-hidden="true"><i style="--i:${i}">${w}</i></span>`).join(' ')
  });
  function count(card) {
    card.querySelectorAll('.pr b').forEach(b => {
      const n = +b.textContent.replace(/\D/g, ''); if (!n) return; const t0 = performance.now();
      (function f(t) { const k = Math.min((t - t0) / 900, 1), e = 1 - Math.pow(1 - k, 3); b.textContent = 'Rs ' + Math.round(n * e).toLocaleString('en-US'); if (k < 1) requestAnimationFrame(f) })(t0)
    })
  }
  const show = el => { el.classList.add('in'); if (el.matches('.card')) count(el) };
  const targets = document.querySelectorAll('.kh,.eyebrow,.sub,.card,.tile,.how>div,.box,.faq details,.note');
  if (!('IntersectionObserver' in window)) { targets.forEach(show); }
  else {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target) } }), { threshold: .12, rootMargin: '0px 0px -5% 0px' });
    targets.forEach(el => { if (!el.classList.contains('kh')) { el.classList.add('rv'); el.style.setProperty('--d', ([...el.parentNode.children].indexOf(el) % 4) * 90 + 'ms') } io.observe(el) })
  }
  const pic = document.querySelector('.pic'), hero = document.querySelector('.hero');
  hero.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const r = pic.getBoundingClientRect(), cl = v => Math.max(-1, Math.min(1, v));
    pic.style.setProperty('--px', cl((e.clientX - (r.left + r.width / 2)) / (innerWidth / 2)).toFixed(3));
    pic.style.setProperty('--py', cl((e.clientY - (r.top + r.height / 2)) / (innerHeight / 2)).toFixed(3))
  });
  hero.addEventListener('pointerleave', () => { pic.style.setProperty('--px', 0); pic.style.setProperty('--py', 0) });
  const tk = document.querySelector('.tick div'), anim = tk && tk.getAnimations && tk.getAnimations()[0]; let lastY = scrollY, boost = 0;
  (function loop() { boost = boost * .92 + Math.abs(scrollY - lastY) * .35; lastY = scrollY; if (anim) anim.playbackRate = 1 + Math.min(boost, 12); requestAnimationFrame(loop) })();
  const bar = document.createElement('div'); bar.className = 'prog'; document.body.appendChild(bar);
  addEventListener('scroll', () => { const m = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleX(${m > 0 ? scrollY / m : 0})` }, { passive: true });
})();