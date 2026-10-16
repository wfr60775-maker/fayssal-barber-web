/* BARBER RESERVE - add-on: worker filter, worker menu, worker days off, dynamic hours.
   Load AFTER the main script. Nothing existing is removed. */
let xInfo = { holidays: [], hours: [] }, xOpen = OPENING_TIME, xClose = CLOSING_TIME, xSel = null;
const xT = { en:{hol:'Day off / Holiday',hrs:'Working hours',shop:'Salon working hours',open:'Opens',close:'Closes',filter:'Filter by Worker',def:'Use salon hours',hint:'Tap the days this worker is off'},
 ar:{hol:'عطلة / إجازة',hrs:'ساعات العمل',shop:'ساعات عمل الصالون',open:'الفتح',close:'الإغلاق',filter:'تصفية حسب العامل',def:'استعمال ساعات الصالون',hint:'اضغط على الأيام التي يغيب فيها العامل'},
 fr:{hol:'Congé',hrs:'Horaires',shop:'Horaires du salon',open:'Ouverture',close:'Fermeture',filter:'Filtrer par coiffeur',def:'Horaires du salon',hint:'Touchez les jours d\'absence'},
 es:{hol:'Vacaciones',hrs:'Horario',shop:'Horario del salón',open:'Apertura',close:'Cierre',filter:'Filtrar por barbero',def:'Usar horario del salón',hint:'Toca los días de ausencia'},
 de:{hol:'Urlaub',hrs:'Arbeitszeit',shop:'Salon-Arbeitszeit',open:'Öffnung',close:'Schluss',filter:'Nach Barbier filtern',def:'Salonzeiten verwenden',hint:'Abwesenheitstage antippen'} };
const xt = () => xT[lang] || xT.en;
const xOff = (w, k) => xInfo.holidays.some(h => String(h.w) === String(w) && h.d === k);
const xHours = w => { const h = xInfo.hours.find(x => String(x.w) === String(w)); return [(h && h.o) || xOpen, (h && h.c) || xClose]; };

/* ---- small fixes ---- */
document.getElementById('langBox').onclick = () => { const m = document.getElementById('langMenu'); m.style.display = m.style.display === 'none' ? 'block' : 'none'; };
const xSS = setScreen;
setScreen = function (s) { xSS(s); document.querySelectorAll('.back').forEach(b => { if (!b.textContent.trim()) b.textContent = t().back; }); };

/* ---- loaders ---- */
const xLS = loadSettings;
loadSettings = async function () { const s = await xLS(); if (s) { xOpen = s.opening_time || OPENING_TIME; xClose = s.closing_time || CLOSING_TIME; } return s; };
const xLB = loadBusy;
loadBusy = async function () {
  const r = await xLB();
  if (viewingBarberId) { const { data } = await sb.rpc('bb_public_worker_info', { p_barber_id: viewingBarberId }); if (data) xInfo = data; }
  return r;
};

/* ---- booking side: dynamic hours + worker day off ---- */
const xIB = isWorkerBusy;
isWorkerBusy = (w, k, tm, s) => (k && xOff(w, k)) || xIB(w, k, tm, s);
const xRB = renderBooking;
renderBooking = async function () {
  await xRB();
  if (!selectedDateKey) return;
  document.querySelectorAll('#workersRow .worker-circle').forEach((c, i) => {
    const w = workers[i];
    if (w && xOff(w.id, selectedDateKey)) { c.classList.add('busy'); c.onclick = () => {}; }
  });
};
generateAvailableTimes = function () {
  if (!selectedDateKey || !selectedService || isHoliday(selectedDateKey)) return [];
  const wid = workers.length ? selectedWorkerId : null;
  if (wid && xOff(wid, selectedDateKey)) return [];
  const [o, c] = xHours(wid);
  const opening = timeToMinutes(o), closing = timeToMinutes(c), dur = Number(selectedService.duration);
  const now = new Date(), isToday = selectedDateKey === dateToKey(now), nowMin = now.getHours() * 60 + now.getMinutes();
  const out = [];
  for (let start = opening; start + dur <= closing; start += 5) {
    if (isToday && start <= nowMin) continue;
    const end = start + dur;
    const overlap = busySlots.some(b => b.dateKey === selectedDateKey
      && (workers.length > 0 ? b.workerId === selectedWorkerId : (b.workerId === null || b.workerId === undefined))
      && start < (b.start + b.duration) && end > b.start);
    if (!overlap) out.push(minutesToTime(start));
  }
  return out;
};

/* ---- barber dashboard ---- */
const xRD = renderBarberDashboard;
renderBarberDashboard = async function () { await xRD(); if (screen === 'barber') xDecorate(); };

function xDecorate() {
  const tr = t();
  document.querySelectorAll('#bdWorkersRow .worker-circle').forEach((c, i) => {
    const w = workers[i]; if (!w) return;
    c.onclick = e => { e.stopPropagation(); xMenu(c, w); };
  });
  const list = document.getElementById('bdBookings');
  let f = document.getElementById('xFilter');
  if (!f) { f = document.createElement('div'); f.id = 'xFilter'; list.before(f); }
  f.innerHTML = '';
  if (workers.length) {
    f.innerHTML = `<div class="section-title-small">${esc(xt().filter)}</div><div class="workers-row"></div>`;
    const row = f.querySelector('.workers-row');
    workers.forEach(w => {
      const d = document.createElement('div');
      d.className = 'worker-circle'; d.dataset.id = String(w.id);
      const photo = w.photo_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(w.name) + '&background=333&color=D4AF37&size=200';
      d.innerHTML = `<img class="worker-photo" src="${esc(photo)}" alt=""><div class="worker-name">${esc(w.name)}</div>`;
      d.onclick = () => { xSel = (xSel === String(w.id)) ? null : String(w.id); xApply(); };
      row.appendChild(d);
    });
  }
  if (xSel && !workers.some(w => String(w.id) === xSel)) xSel = null;
  xApply();
}

function xApply() {
  const w = workers.find(x => String(x.id) === xSel);
  let n = 0;
  document.querySelectorAll('#bdBookings .admin-item').forEach((el, i) => {
    const b = adminBookings[i], ok = !w || (b && b.workerName === w.name);
    el.style.display = ok ? '' : 'none'; if (ok) n++;
  });
  let e = document.getElementById('xEmpty');
  if (!e) { e = document.createElement('div'); e.id = 'xEmpty'; e.className = 'empty'; document.getElementById('bdBookings').after(e); }
  e.textContent = (w && !n) ? t().noBookings : '';
  document.querySelectorAll('#xFilter .worker-circle').forEach(c => c.classList.toggle('active', c.dataset.id === xSel));
}

function xMenu(c, w) {
  const old = document.getElementById('xMenu'); if (old) old.remove();
  const m = document.createElement('div'); m.id = 'xMenu';
  const r = c.getBoundingClientRect();
  m.style.cssText = `position:fixed;z-index:120;background:#252525;border:1px solid var(--gold);border-radius:12px;padding:6px;min-width:180px;top:${Math.max(8, Math.min(r.bottom + 6, innerHeight - 190))}px;left:${Math.max(8, Math.min(r.left, innerWidth - 196))}px`;
  const add = (txt, fn, danger) => {
    const b = document.createElement('button'); b.textContent = txt;
    b.style.cssText = 'display:block;width:100%;text-align:start;background:none;border:none;padding:12px;font-size:15px;cursor:pointer;color:' + (danger ? '#ff4d4d' : '#fff');
    b.onclick = () => { m.remove(); fn(); }; m.appendChild(b);
  };
  const tr = t();
  add('🏖️ ' + xt().hol, () => xHolScreen(w));
  add('⏰ ' + xt().hrs, () => xWorkerHours(w));
  add('🗑️ ' + tr.deleteWorkerTitle, () => showConfirm(tr.deleteWorkerTitle, w.name + ' — ' + tr.deleteWorkerMsg, tr.yesDelete, async () => {
    const { error } = await sb.from('workers').update({ is_active: false }).eq('id', w.id);
    if (error) { alert(error.message); return; }
    await loadWorkers(); renderBarberDashboard();
  }), true);
  document.body.appendChild(m);
  setTimeout(() => document.addEventListener('click', () => m.remove(), { once: true }), 0);
}

function xScreen(id) {
  let s = document.getElementById('screen-' + id);
  if (!s) { s = document.createElement('div'); s.className = 'card screen'; s.id = 'screen-' + id; document.querySelector('.container').appendChild(s); }
  return s;
}

async function xHolScreen(w) {
  const s = xScreen('xwh'), wid = String(w.id);
  const { data } = await sb.from('worker_holidays').select('date_key').eq('barber_id', currentBarberId).eq('worker_id', wid);
  let off = (data || []).map(r => r.date_key);
  s.innerHTML = `<button class="back">${esc(t().back)}</button><div class="admin-title">🏖️ ${esc(w.name)}</div><div class="warning" style="margin-bottom:10px">${esc(xt().hint)}</div><div class="month-box"></div><div class="days-scroll"></div>`;
  s.querySelector('.back').onclick = () => setScreen('barber');
  const days = s.querySelector('.days-scroll'), mb = s.querySelector('.month-box');
  const draw = () => {
    days.innerHTML = '';
    futureDates.forEach(d => {
      const k = dateToKey(d), on = off.includes(k), b = document.createElement('div');
      b.className = 'day-box' + (on ? ' holiday-selected' : '');
      b.innerHTML = `<div class="day-name">${esc(getShortDayName(d))}</div><div class="day-number">${d.getDate()}</div>${on ? '<div class="holiday-mini" style="color:var(--gold)">✓</div>' : ''}`;
      b.onclick = async () => {
        const q = sb.from('worker_holidays');
        const r = on ? await q.delete().eq('barber_id', currentBarberId).eq('worker_id', wid).eq('date_key', k)
                     : await q.insert({ barber_id: currentBarberId, worker_id: wid, date_key: k });
        if (r.error) { alert(r.error.message); return; }
        off = on ? off.filter(x => x !== k) : [...off, k];
        const sl = days.scrollLeft; draw(); days.scrollLeft = sl;
      };
      days.appendChild(b);
    });
    mb.textContent = getMonthLabel(days);
  };
  draw(); days.onscroll = () => { mb.textContent = getMonthLabel(days); };
  setScreen('xwh'); mb.textContent = getMonthLabel(days);
}

function xHoursScreen(title, o, c, back, onSave, onReset) {
  const s = xScreen('xhr'); let O = timeToMinutes(o), C = timeToMinutes(c);
  s.innerHTML = `<button class="back">${esc(t().back)}</button><div class="admin-title">⏰ ${esc(title)}</div><div class="xb"></div><button class="btn">${esc(t().save)}</button>` + (onReset ? `<button class="btn-secondary xr">${esc(xt().def)}</button>` : '');
  s.querySelector('.back').onclick = () => setScreen(back);
  const body = s.querySelector('.xb');
  const stepper = (label, get, step) => {
    const d = document.createElement('div');
    d.style.cssText = 'display:flex;align-items:center;gap:10px;margin:14px 0';
    d.innerHTML = `<div style="flex:1;font-weight:600">${esc(label)}</div><button class="logout" style="padding:12px 18px;font-size:18px">−</button><div style="min-width:70px;text-align:center;color:var(--gold);font-size:22px;font-weight:bold"></div><button class="logout" style="padding:12px 18px;font-size:18px">+</button>`;
    const v = d.children[2], bs = d.querySelectorAll('button'), show = () => { v.textContent = minutesToTime(get()); };
    bs[0].onclick = () => { step(-30); show(); }; bs[1].onclick = () => { step(30); show(); }; show();
    return d;
  };
  body.appendChild(stepper(xt().open, () => O, d => { O = Math.max(0, Math.min(O + d, C - 30)); }));
  body.appendChild(stepper(xt().close, () => C, d => { C = Math.min(1440, Math.max(C + d, O + 30)); }));
  s.querySelector('.btn').onclick = async () => {
    const err = await onSave(minutesToTime(O), minutesToTime(C));
    if (err) { alert(err.message); return; }
    showAlert('✓', t().saved, null, () => setScreen(back));
  };
  if (onReset) s.querySelector('.xr').onclick = async () => {
    const err = await onReset(); if (err) { alert(err.message); return; }
    showAlert('✓', t().saved, null, () => setScreen(back));
  };
  setScreen('xhr');
}

async function xWorkerHours(w) {
  const { data } = await sb.from('workers').select('open_time,close_time').eq('id', w.id).single();
  xHoursScreen(w.name + ' — ' + xt().hrs, (data && data.open_time) || xOpen, (data && data.close_time) || xClose, 'barber',
    async (o, c) => (await sb.from('workers').update({ open_time: o, close_time: c }).eq('id', w.id)).error,
    async () => (await sb.from('workers').update({ open_time: null, close_time: null }).eq('id', w.id)).error);
}

/* ---- Edit Center: salon hours ---- */
const xRE = renderEditCenter;
renderEditCenter = async function () {
  await xRE();
  let b = document.getElementById('xShopHrs');
  if (!b) { b = document.createElement('button'); b.id = 'xShopHrs'; b.className = 'btn-secondary'; document.querySelector('#screen-editcenter .admin-title').after(b); }
  b.textContent = '⏰ ' + xt().shop;
  b.onclick = async () => {
    await loadSettings();
    xHoursScreen(xt().shop, xOpen, xClose, 'editcenter', async (o, c) => {
      const { error } = await sb.from('barber_settings').upsert([{ barber_id: currentBarberId, key: 'opening_time', value: o }, { barber_id: currentBarberId, key: 'closing_time', value: c }]);
      if (!error) { xOpen = o; xClose = c; }
      return error;
    });
  };
};
