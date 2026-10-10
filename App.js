<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BARBER RESERVE</title>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
/* ====== إعدادات Supabase — ضع رابط مشروعك هنا ====== */
const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co'; // ← غيّر هذا إلى رابط مشروعك (من Settings → API في Supabase)
const SUPABASE_KEY = 'sb_publishable_uEo18A5zHn6nD0ZuaovDDA_d-GUCa95';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const BUCKET = 'gallery';      // اسم الـ Bucket في Supabase Storage
const TABLE  = 'barber_photos'; // اسم الجدول في قاعدة البيانات

/* ضغط الصورة بجودة جيدة قبل الرفع (حجم أصغر + تحميل أسرع) */
async function compressImage(file, maxSize = 1600, quality = 0.85) {
  const img = await createImageBitmap(file);
  let w = img.width, h = img.height;
  if (w > maxSize || h > maxSize) {
    const r = Math.min(maxSize / w, maxSize / h);
    w = Math.round(w * r); h = Math.round(h * r);
  }
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d').drawImage(img, 0, 0, w, h);
  const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', quality));
  return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
}

/* رفع صورة جديدة من لوحة التحكم إلى Supabase */
async function handlePhotoUpload(fileInput) {
  const file = fileInput.files[0];
  if (!file) return;
  try {
    const compressed = await compressImage(file);
    const fileName = 'barber_' + Date.now() + '.jpg';
    const { error: uploadError } = await supabase.storage
      .from(BUCKET).upload(fileName, compressed, { cacheControl: '3600', upsert: false });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    const { error: dbError } = await supabase.from(TABLE).insert([{ url: publicUrl }]);
    if (dbError) throw dbError;

    alert('تم رفع الصورة بنجاح وستظهر للزبائن فوراً!');
    await loadPhotos();
    if (screen === 'admin_gallery') renderAdminGallery();
  } catch (err) {
    alert('حدث خطأ أثناء الرفع: ' + (err.message || err));
    console.error(err);
  } finally {
    fileInput.value = '';
  }
}

/* تحميل الصور من جدول Supabase — تظهر لجميع الزبائن */
async function loadPhotos() {
  const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: true });
  if (error) { console.error('loadPhotos:', error); return; }
  galleryPhotos = (data || []).map(r => ({ id: String(r.id), url: r.url }));
}
</script>

<style>

  :root { --gold:#D4AF37; --bg:#111111; --card:#1c1c1c; --box:#252525; --line:#333333; --white:#ffffff; --gray:#aaaaaa; }
  * { box-sizing:border-box; margin:0; padding:0; font-family:-apple-system,'Segoe UI',Tahoma,Arial,sans-serif; }
  body { background:var(--bg); color:var(--white); min-height:100vh; padding:40px 16px 60px; }
  .container { max-width:560px; margin:0 auto; }
  [dir="rtl"] { text-align:right; }
  .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
  .logo { color:var(--gold); font-size:26px; font-weight:bold; }
  .subtitle { color:var(--gray); font-size:14px; margin-top:6px; }
  .admin-trigger { background:var(--box); border:1px solid var(--line); border-radius:8px; padding:8px 14px; cursor:pointer; font-size:16px; color:var(--white); }
  .card { background:var(--card); border-radius:20px; padding:22px; margin-bottom:40px; }
  .lang-box { background:var(--box); border:1px solid var(--line); border-radius:12px; padding:14px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; margin-bottom:5px; width:100%; color:var(--white); font-size:15px; }
  .lang-box .gold { color:var(--gold); font-weight:bold; }
  .gray { color:var(--gray); }
  .language-menu { margin-bottom:10px; }
  .language-item { display:block; width:100%; text-align:start; padding:12px; background:var(--box); margin-top:3px; border-radius:8px; color:var(--white); border:none; cursor:pointer; font-size:15px; }
  .hero-image { width:100%; height:220px; object-fit:cover; border-radius:14px; margin-top:15px; }
  .barber-name { color:var(--white); font-size:24px; font-weight:bold; margin-top:15px; }
  .location { color:var(--gray); font-size:14px; margin-top:6px; }
  .line { height:1px; background:var(--line); margin:22px 0; }
  .section-title { color:var(--white); font-size:19px; font-weight:bold; margin-bottom:15px; }
  .section-title-small { color:var(--white); font-size:18px; font-weight:bold; margin:10px 0 12px; }
  .item { background:var(--box); border-radius:12px; padding:16px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; border:1.5px solid transparent; cursor:pointer; width:100%; color:var(--white); text-align:start; }
  .item.active { border-color:var(--gold); background:#2d2d2d; }
  .service-name { font-size:16px; font-weight:600; }
  .service-time { color:#888; font-size:13px; margin-top:4px; }
  .price { color:var(--gold); font-size:18px; font-weight:bold; }
  .working-hours { color:#777; font-size:12px; text-align:center; margin-top:8px; }
  .btn { background:var(--gold); color:#111; border:none; padding:17px; border-radius:12px; width:100%; margin-top:25px; font-size:14px; font-weight:bold; cursor:pointer; }
  .btn.disabled { opacity:.5; }
  .btn-secondary { background:var(--box); border:1.5px solid var(--gold); color:var(--gold); padding:16px; border-radius:12px; width:100%; font-size:15px; font-weight:bold; cursor:pointer; text-align:center; }
  .back { color:var(--gold); font-size:15px; margin-bottom:15px; font-weight:600; background:none; border:none; cursor:pointer; }
  .input { background:var(--box); color:var(--white); border:1px solid var(--line); border-radius:10px; padding:14px; margin-bottom:12px; width:100%; font-size:15px; }
  .input::placeholder { color:#666; }
  .month-box { background:var(--box); border:1px solid var(--line); border-radius:12px; padding:12px 15px; margin-bottom:10px; text-align:center; color:var(--gold); font-size:16px; font-weight:bold; text-transform:capitalize; }
  .days-scroll { display:flex; overflow-x:auto; padding:5px 2px; gap:8px; scrollbar-width:thin; }
  .day-box { min-width:70px; height:78px; background:var(--box); border-radius:14px; display:flex; flex-direction:column; align-items:center; justify-content:center; border:1.5px solid transparent; cursor:pointer; }
  .day-box.active { border-color:var(--gold); background:#2d2d2d; }
  .day-box.holiday { border-color:#7a3333; background:#292020; }
  .day-box.holiday-selected { border-color:var(--gold); background:#302c1d; }
  .day-name { color:var(--gray); font-size:12px; font-weight:600; margin-bottom:5px; }
  .day-number { color:var(--white); font-size:20px; font-weight:bold; }
  .day-box.active .day-name, .day-box.active .day-number, .day-box.holiday-selected .day-name, .day-box.holiday-selected .day-number { color:var(--gold); }
  .holiday-mini { font-size:10px; margin-top:3px; }
  .holiday-message { background:#2b2020; border:1px solid #6b3535; border-radius:12px; padding:14px; margin-top:12px; color:#ffb0b0; font-size:13px; line-height:20px; text-align:center; font-weight:600; }
  .times-scroll { display:flex; overflow-x:auto; padding:5px 0; gap:8px; scrollbar-width:thin; }
  .time-box { background:var(--box); border-radius:12px; padding:13px 18px; border:1.5px solid transparent; color:var(--white); font-size:14px; font-weight:600; cursor:pointer; white-space:nowrap; }
  .time-box.active { border-color:var(--gold); background:#2d2d2d; color:var(--gold); }
  .warning { color:#888; font-size:14px; margin-top:5px; line-height:20px; }
  .holiday-admin-title { color:var(--gold); font-size:18px; font-weight:bold; margin-bottom:8px; }
  .holiday-admin-sub { color:#888; font-size:12px; line-height:18px; margin-bottom:12px; }
  .selected-holiday-row { background:var(--box); border-radius:10px; padding:12px; margin-bottom:8px; display:flex; align-items:center; justify-content:space-between; gap:8px; }
  .selected-holiday-row span { font-size:12px; flex:1; }
  .remove-holiday { border:1px solid var(--gold); background:none; border-radius:7px; padding:6px 9px; color:var(--gold); font-size:10px; font-weight:bold; cursor:pointer; }
  .admin-title { color:var(--gold); font-size:22px; font-weight:bold; margin-bottom:20px; }
  .dashboard-header { display:flex; justify-content:space-between; align-items:center; }
  .logout { background:var(--box); border:1px solid var(--line); color:var(--gold); font-size:12px; font-weight:bold; padding:8px 12px; border-radius:8px; cursor:pointer; }
  .admin-item { background:#222; padding:15px; border-radius:12px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; border:1px solid var(--line); gap:10px; }
  .client-name { color:var(--gold); font-size:17px; font-weight:bold; margin-bottom:8px; }
  .admin-info { color:#ddd; font-size:13px; margin-bottom:4px; }
  .admin-duration { color:#888; font-size:12px; margin-top:3px; }
  .delete-btn { border:1px solid #ff4d4d; background:none; border-radius:8px; padding:10px; font-size:18px; cursor:pointer; }
  .empty { padding:25px; text-align:center; color:#888; font-size:15px; }
  .gallery-full { width:100%; aspect-ratio:3/4; object-fit:cover; border-radius:14px; margin-bottom:14px; display:block; }
  .gallery-row { display:flex; background:#222; padding:12px; border-radius:12px; margin-bottom:12px; border:1px solid var(--line); gap:12px; align-items:center; }
  .gallery-thumb { width:110px; height:140px; object-fit:cover; border-radius:10px; }
  .gallery-actions { flex:1; display:flex; flex-direction:column; gap:10px; }
  .screen { display:none; }
  .screen.active { display:block; }
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.7); display:none; align-items:center; justify-content:center; z-index:100; padding:20px; }
  .modal-overlay.show { display:flex; }
  .modal { background:var(--card); border-radius:16px; padding:24px; max-width:400px; width:100%; }
  .modal h3 { color:var(--gold); margin-bottom:12px; }
  .modal p { color:#ddd; font-size:14px; margin-bottom:20px; line-height:20px; }
  .modal-buttons { display:flex; gap:10px; }
  .modal-buttons button { flex:1; padding:12px; border-radius:10px; border:none; cursor:pointer; font-weight:bold; }
  .modal-cancel { background:var(--box); color:var(--gray); }
  .modal-ok { background:var(--gold); color:#111; }
  .modal-ok.danger { background:#ff4d4d; color:#fff; }
  [dir="rtl"] .modal-buttons { flex-direction:row-reverse; }
</style>
</head>
<body>
<div class="container">

  <div class="header">
    <div>
      <div class="logo" id="logoText">BARBER RESERVE</div>
      <div class="subtitle" id="subText"></div>
    </div>
    <button class="admin-trigger" id="adminTrigger">⚙️</button>
  </div>

  <!-- ================= HOME ================= -->
  <div class="card screen active" id="screen-home">
    <button class="lang-box" id="langBox">
      <span class="gray" id="labelText"></span>
      <span class="gold" id="langName"></span>
    </button>
    <div class="language-menu" id="langMenu" style="display:none"></div>

    <img class="hero-image" src="https://images.unsplash.com/photo-1702865272115-5afdbae975af?fm=jpg&q=60&w=1200&auto=format&fit=crop" alt="barber">

    <div class="barber-name">Fayssal Barber</div>
    <div class="location" id="locText"></div>

    <div class="line"></div>
    <div class="section-title" id="titleText"></div>
    <div id="servicesList"></div>

    <button class="btn-secondary" id="galleryBtn" style="margin-top:6px"></button>

    <div class="line"></div>
    <div class="working-hours" id="workingHours"></div>

    <button class="btn" id="nextBtn"></button>
  </div>

  <!-- ================= BOOKING ================= -->
  <div class="card screen" id="screen-booking">
    <button class="back" data-goto="home"></button>
    <input class="input" id="inpName" type="text">
    <input class="input" id="inpPhone" type="tel">
    <div class="line"></div>
    <div class="section-title-small" id="dLabel"></div>
    <div class="month-box" id="bookingMonth"></div>
    <div class="days-scroll" id="bookingDays"></div>
    <div id="bookingHolidayMsg"></div>
    <div class="section-title-small" id="tLabel"></div>
    <div id="timesArea"></div>
    <button class="btn" id="confirmBtn"></button>
  </div>

  <!-- ================= GALLERY (customers) ================= -->
  <div class="card screen" id="screen-gallery">
    <button class="back" data-goto="home"></button>
    <div class="admin-title" id="galleryTitle"></div>
    <div id="galleryList"></div>
  </div>

  <!-- ================= ADMIN LOGIN ================= -->
  <div class="card screen" id="screen-admin_login">
    <button class="back" data-goto="home"></button>
    <div class="admin-title" id="loginTitle"></div>
    <input class="input" id="inpPassword" type="password">
    <button class="btn" id="loginBtn"></button>
  </div>

  <!-- ================= ADMIN DASHBOARD ================= -->
  <div class="card screen" id="screen-admin_dashboard">
    <div class="dashboard-header">
      <div class="admin-title" id="dashboardTitle" style="margin-bottom:0"></div>
      <button class="logout" id="logoutBtn"></button>
    </div>
    <div class="line"></div>

    <div class="holiday-admin-title" id="holidayAdminTitle"></div>
    <div class="holiday-admin-sub" id="holidayAdminSub"></div>
    <div class="month-box" id="adminMonth"></div>
    <div class="days-scroll" id="adminDays"></div>
    <div id="selectedHolidays" style="margin-top:15px"></div>

    <div class="line"></div>
    <button class="btn-secondary" id="adminGalleryBtn"></button>

    <div class="line"></div>
    <div id="bookingsList"></div>
  </div>

  <!-- ================= ADMIN GALLERY ================= -->
  <div class="card screen" id="screen-admin_gallery">
    <button class="back" data-goto="admin_dashboard"></button>
    <div class="admin-title" id="adminGalleryTitle"></div>
    <input type="file" id="photoInput" accept="image/*" style="display:none">
    <button class="btn" id="addPhotoBtn" style="margin-top:0"></button>
    <div class="line"></div>
    <div id="adminGalleryList"></div>
  </div>
</div>

<!-- modal -->
<div class="modal-overlay" id="modalOverlay">
  <div class="modal">
    <h3 id="modalTitle"></h3>
    <p id="modalMsg"></p>
    <div class="modal-buttons">
      <button class="modal-cancel" id="modalCancel"></button>
      <button class="modal-ok" id="modalOk"></button>
    </div>
  </div>
</div>

<script>
/* ================= SETTINGS ================= */
const OPENING_TIME = '10:00';
const CLOSING_TIME = '20:00';
const BOOKING_DAYS_AHEAD = 30;
const CORRECT_PASSWORD = '1234';

const langNames = { en:'English', ar:'العربية', fr:'Français', es:'Español', de:'Deutsch' };
const locales = { en:'en-US', ar:'ar', fr:'fr-FR', es:'es-ES', de:'de-DE' };

const translations = {
  en: { logo:'BARBER RESERVE', sub:'Book easily', label:'Language / اللغة', loc:'📍 Mallorca, Spain',
    title:'Choose service', btn1:'NEXT', btn2:'CONFIRM BOOKING', back:'‹ Back',
    dLabel:'Select Day', tLabel:'Available Times', pName:'Full Name', pPhone:'Phone Number',
    selectHoliday:'Select days for holiday / vacation',
    holidayHint:'Select one or several days. Customers will see them but cannot book.',
    remove:'Remove', selectDayFirst:'Please select a day first.',
    noTimes:'No available time for this service on this day.',
    holidayNoBooking:'This day is a holiday / vacation. No bookings are available.',
    alertTitle:'Confirmed',
    alertSuccess:(n,s,d,t)=>`Thank you ${n}! ${s} booked on ${d} at ${t}.`,
    errS:'Please select a service.', errF:'Please enter your name, phone, day and time.',
    timeTaken:'This time has just been booked. Please choose another time.',
    loginTitle:'Admin Access', passwordPlaceholder:'Enter admin password', login:'LOGIN',
    wrongPassword:'Incorrect password.', dashboard:'Admin Dashboard', noBookings:'No bookings yet.',
    phone:'Phone', service:'Service', day:'Day', time:'Time', duration:'Duration',
    deleteTitle:'Delete', deleteMessage:'Are you sure you want to delete this?',
    deleteBookingTitle:'Delete booking',
    deleteBookingMessage:'Are you sure you want to cancel this booking and free the time?',
    cancel:'Cancel', yesDelete:'Yes, delete', logout:'Logout', btnOk:'OK',
    workingHours:`Working hours: ${OPENING_TIME} - ${CLOSING_TIME}`,
    gTitle:'Hair + Beard', gBtn:'My Haircut Photos', gManage:'My Work Photos',
    gOpen:'Open my work photos', gAdd:'+ Add photo', gChange:'Change', gEmpty:'No photos yet.',
    s:[ {id:'1',name:'Haircut',time:'30 min',duration:30,price:'15'},
        {id:'2',name:'Beard',time:'20 min',duration:20,price:'10'},
        {id:'3',name:'Haircut + Beard',time:'45 min',duration:45,price:'22'} ] },

  ar: { logo:'حجوزات الصالون', sub:'احجز بكل سهولة', label:'اللغة / Language', loc:'📍 مايوركا، إسبانيا',
    title:'اختر الخدمة', btn1:'التالي', btn2:'تأكيد الحجز', back:'‹ العودة',
    dLabel:'اختر اليوم', tLabel:'الأوقات المتاحة', pName:'الاسم الكامل', pPhone:'رقم الهاتف',
    selectHoliday:'اختر أيام العطلة / الإجازة',
    holidayHint:'اختر يوماً أو عدة أيام. ستبقى الأيام ظاهرة للزبائن ولكن لن يمكنهم الحجز.',
    remove:'إلغاء', selectDayFirst:'اختر اليوم أولاً.',
    noTimes:'لا يوجد وقت متاح لهذه الخدمة في هذا اليوم.',
    holidayNoBooking:'هذا اليوم عطلة / إجازة. لا يمكن الحجز في هذا اليوم.',
    alertTitle:'تم التأكيد',
    alertSuccess:(n,s,d,t)=>`شكراً يا ${n}! تم حجز ${s} يوم ${d} الساعة ${t}.`,
    errS:'اختر الخدمة أولاً.', errF:'الرجاء كتابة الاسم والهاتف واختيار اليوم والوقت.',
    timeTaken:'تم حجز هذا الوقت للتو. اختر وقتاً آخر.',
    loginTitle:'دخول الإدارة', passwordPlaceholder:'أدخل كلمة مرور الإدارة', login:'دخول',
    wrongPassword:'كلمة المرور غير صحيحة.', dashboard:'لوحة تحكم الإدارة', noBookings:'لا توجد حجوزات حالياً.',
    phone:'الهاتف', service:'الخدمة', day:'اليوم', time:'الوقت', duration:'المدة',
    deleteTitle:'حذف', deleteMessage:'هل أنت متأكد من الحذف؟',
    deleteBookingTitle:'حذف الحجز',
    deleteBookingMessage:'هل أنت متأكد من إلغاء هذا الحجز وتفريغ الوقت؟',
    cancel:'تراجع', yesDelete:'نعم، احذف', logout:'خروج', btnOk:'حسناً',
    workingHours:`ساعات العمل: ${OPENING_TIME} - ${CLOSING_TIME}`,
    gTitle:'شعر + لحية', gBtn:'صور حلاقتي', gManage:'صور عملي',
    gOpen:'دخول إلى صور عملي', gAdd:'+ إضافة صورة', gChange:'تغيير', gEmpty:'لا توجد صور بعد.',
    s:[ {id:'1',name:'قص شعر',time:'30 دقيقة',duration:30,price:'15'},
        {id:'2',name:'حلاقة لحية',time:'20 دقيقة',duration:20,price:'10'},
        {id:'3',name:'شعر + لحية',time:'45 دقيقة',duration:45,price:'22'} ] },

  fr: { logo:'BARBER RESERVE', sub:'Réservez facilement', label:'Langue', loc:'📍 Majorque, Espagne',
    title:'Choisissez un service', btn1:'SUIVANT', btn2:'CONFIRMER', back:'‹ Retour',
    dLabel:'Choisir le jour', tLabel:'Heures disponibles', pName:'Nom complet', pPhone:'Numéro de téléphone',
    selectHoliday:'Choisir les jours de congé',
    holidayHint:'Sélectionnez un ou plusieurs jours. Les clients les verront mais ne pourront pas réserver.',
    remove:'Retirer', selectDayFirst:'Veuillez choisir un jour.',
    noTimes:'Aucune heure disponible.',
    holidayNoBooking:'Ce jour est fermé / en congé. Aucune réservation.',
    alertTitle:'Confirmé',
    alertSuccess:(n,s,d,t)=>`Merci ${n}! ${s} réservé le ${d} à ${t}.`,
    errS:'Veuillez choisir un service.', errF:'Veuillez remplir toutes les informations.',
    timeTaken:'Cette heure vient d’être réservée. Choisissez une autre heure.',
    loginTitle:'Accès administrateur', passwordPlaceholder:'Mot de passe', login:'CONNEXION',
    wrongPassword:'Mot de passe incorrect.', dashboard:'Tableau de bord', noBookings:'Aucune réservation.',
    phone:'Téléphone', service:'Service', day:'Jour', time:'Heure', duration:'Durée',
    deleteTitle:'Supprimer', deleteMessage:'Voulez-vous vraiment supprimer ?',
    deleteBookingTitle:'Supprimer la réservation',
    deleteBookingMessage:'Voulez-vous supprimer cette réservation ?',
    cancel:'Annuler', yesDelete:'Oui, supprimer', logout:'Déconnexion', btnOk:'OK',
    workingHours:`Horaires: ${OPENING_TIME} - ${CLOSING_TIME}`,
    gTitle:'Coupe + Barbe', gBtn:'Photos de mes coupes', gManage:'Photos de mon travail',
    gOpen:'Accéder à mes photos', gAdd:'+ Ajouter une photo', gChange:'Changer', gEmpty:'Aucune photo.',
    s:[ {id:'1',name:'Coupe',time:'30 min',duration:30,price:'15'},
        {id:'2',name:'Barbe',time:'20 min',duration:20,price:'10'},
        {id:'3',name:'Coupe + Barbe',time:'45 min',duration:45,price:'22'} ] },

  es: { logo:'BARBER RESERVE', sub:'Reserva fácilmente', label:'Idioma', loc:'📍 Mallorca, España',
    title:'Elige un servicio', btn1:'SIGUIENTE', btn2:'CONFIRMAR', back:'‹ Volver',
    dLabel:'Selecciona el día', tLabel:'Horarios disponibles', pName:'Nombre completo', pPhone:'Número de teléfono',
    selectHoliday:'Selecciona días de vacaciones',
    holidayHint:'Puedes seleccionar uno o varios días. Los clientes los verán pero no podrán reservar.',
    remove:'Quitar', selectDayFirst:'Selecciona primero el día.',
    noTimes:'No hay horarios disponibles.',
    holidayNoBooking:'Este día está cerrado / de vacaciones. No se puede reservar.',
    alertTitle:'Confirmado',
    alertSuccess:(n,s,d,t)=>`Gracias ${n}! ${s} reservado el ${d} a las ${t}.`,
    errS:'Selecciona un servicio.', errF:'Completa todos los datos.',
    timeTaken:'Esta hora acaba de ser reservada. Elige otra.',
    loginTitle:'Acceso administrador', passwordPlaceholder:'Contraseña', login:'ENTRAR',
    wrongPassword:'Contraseña incorrecta.', dashboard:'Panel de administración', noBookings:'No hay reservas.',
    phone:'Teléfono', service:'Servicio', day:'Día', time:'Hora', duration:'Duración',
    deleteTitle:'Eliminar', deleteMessage:'¿Seguro que quieres eliminar?',
    deleteBookingTitle:'Eliminar reserva', deleteBookingMessage:'¿Quieres eliminar esta reserva?',
    cancel:'Cancelar', yesDelete:'Sí, eliminar', logout:'Salir', btnOk:'OK',
    workingHours:`Horario: ${OPENING_TIME} - ${CLOSING_TIME}`,
    gTitle:'Corte + Barba', gBtn:'Fotos de mis cortes', gManage:'Fotos de mi trabajo',
    gOpen:'Entrar a mis fotos', gAdd:'+ Añadir foto', gChange:'Cambiar', gEmpty:'Sin fotos.',
    s:[ {id:'1',name:'Corte de pelo',time:'30 min',duration:30,price:'15'},
        {id:'2',name:'Barba',time:'20 min',duration:20,price:'10'},
        {id:'3',name:'Corte + Barba',time:'45 min',duration:45,price:'22'} ] },

  de: { logo:'BARBER RESERVE', sub:'Einfach buchen', label:'Sprache', loc:'📍 Mallorca, Spanien',
    title:'Service auswählen', btn1:'WEITER', btn2:'BESTÄTIGEN', back:'‹ Zurück',
    dLabel:'Tag auswählen', tLabel:'Verfügbare Zeiten', pName:'Vollständiger Name', pPhone:'Telefonnummer',
    selectHoliday:'Urlaubstage auswählen',
    holidayHint:'Wähle einen oder mehrere Tage. Kunden sehen sie, können aber nicht buchen.',
    remove:'Entfernen', selectDayFirst:'Bitte zuerst einen Tag auswählen.',
    noTimes:'Keine verfügbaren Zeiten.',
    holidayNoBooking:'Dieser Tag ist geschlossen / Urlaub. Keine Buchung möglich.',
    alertTitle:'Bestätigt',
    alertSuccess:(n,s,d,t)=>`Danke ${n}! ${s} am ${d} um ${t} gebucht.`,
    errS:'Bitte Service auswählen.', errF:'Bitte alle Daten eingeben.',
    timeTaken:'Diese Zeit wurde gerade gebucht. Bitte wähle eine andere.',
    loginTitle:'Admin-Zugang', passwordPlaceholder:'Passwort', login:'ANMELDEN',
    wrongPassword:'Falsches Passwort.', dashboard:'Admin-Dashboard', noBookings:'Noch keine Buchungen.',
    phone:'Telefon', service:'Service', day:'Tag', time:'Zeit', duration:'Dauer',
    deleteTitle:'Löschen', deleteMessage:'Möchtest du das wirklich löschen?',
    deleteBookingTitle:'Buchung löschen', deleteBookingMessage:'Möchtest du diese Buchung löschen?',
    cancel:'Abbrechen', yesDelete:'Ja, löschen', logout:'Abmelden', btnOk:'OK',
    workingHours:`Arbeitszeit: ${OPENING_TIME} - ${CLOSING_TIME}`,
    gTitle:'Haarschnitt + Bart', gBtn:'Fotos meiner Haarschnitte', gManage:'Meine Arbeitsfotos',
    gOpen:'Zu meinen Fotos', gAdd:'+ Foto hinzufügen', gChange:'Ändern', gEmpty:'Keine Fotos.',
    s:[ {id:'1',name:'Haarschnitt',time:'30 Min.',duration:30,price:'15'},
        {id:'2',name:'Bart',time:'20 Min.',duration:20,price:'10'},
        {id:'3',name:'Haarschnitt + Bart',time:'45 Min.',duration:45,price:'22'} ] },
};

/* ================= Date & time helpers ================= */
const pad = n => String(n).padStart(2,'0');
const dateToKey = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const keyToDate = key => { const [y,m,dd] = key.split('-').map(Number); return new Date(y, m-1, dd); };
const getFutureDates = () => {
  const out = []; const today = new Date(); today.setHours(0,0,0,0);
  for (let i=0;i<BOOKING_DAYS_AHEAD;i++){ const d=new Date(today); d.setDate(today.getDate()+i); out.push(d); }
  return out;
};
const timeToMinutes = v => { const [h,m] = v.split(':').map(Number); return h*60+m; };
const minutesToTime = m => `${pad(Math.floor(m/60))}:${pad(m%60)}`;

/* ================= State ================= */
let lang = localStorage.getItem('barber_lang') || 'en';
let selectedService = null;
let screen = 'home';
let selectedDateKey = null;
let time = null;
let name = '';
let phone = '';
let bookedSlots = [];
let holidayDates = [];
let galleryPhotos = [];
let adminPassword = '';

const futureDates = getFutureDates();
const t = () => translations[lang];
const locale = () => locales[lang];

/* ================= Storage ================= */
const store = {
  get(k, fallback){ try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch(e){ return fallback; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
};


/* ================= Modal (replaces Alert) ================= */
function showAlert(title, msg, okText, onOk){
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalMsg').textContent = msg;
  const cancelBtn = document.getElementById('modalCancel');
  const okBtn = document.getElementById('modalOk');
  okBtn.textContent = okText || t().btnOk;
  okBtn.className = 'modal-ok';
  cancelBtn.style.display = 'none';
  document.getElementById('modalOverlay').classList.add('show');
  okBtn.onclick = () => { document.getElementById('modalOverlay').classList.remove('show'); onOk && onOk(); };
}
function showConfirm(title, msg, okText, onOk){
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalMsg').textContent = msg;
  const cancelBtn = document.getElementById('modalCancel');
  const okBtn = document.getElementById('modalOk');
  cancelBtn.textContent = t().cancel;
  okBtn.textContent = okText;
  okBtn.className = 'modal-ok danger';
  cancelBtn.style.display = '';
  document.getElementById('modalOverlay').classList.add('show');
  cancelBtn.onclick = () => document.getElementById('modalOverlay').classList.remove('show');
  okBtn.onclick = () => { document.getElementById('modalOverlay').classList.remove('show'); onOk && onOk(); };
}
document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target.id === 'modalOverlay') e.target.classList.remove('show');
});

/* ================= Months label based on visible days ================= */
function getMonthLabel(container, scrollEl){
  const scrollW = scrollEl ? scrollEl.clientWidth : container.clientWidth;
  const itemW = 78;
  const s = Math.max(0, Math.min(futureDates.length-1, Math.floor((scrollEl?scrollEl.scrollLeft:0) / itemW)));
  const e = Math.max(s, Math.min(futureDates.length-1, Math.floor(((scrollEl?scrollEl.scrollLeft:0)+scrollW-1) / itemW)));
  const seen = [];
  for (let i=s;i<=e;i++){
    const d = futureDates[i]; const k = `${d.getFullYear()}-${d.getMonth()}`;
    if (!seen.some(x=>x.k===k)) seen.push({k,d});
  }
  if (!seen.length) return '';
  if (seen.length===1) return seen[0].d.toLocaleDateString(locale(), {month:'long', year:'numeric'});
  const sameYear = seen[0].d.getFullYear() === seen[seen.length-1].d.getFullYear();
  return seen.map((x,i)=> x.d.toLocaleDateString(locale(), sameYear && i<seen.length-1 ? {month:'long'} : {month:'long', year:'numeric'})).join(' / ');
}
const weekdayName = idx => new Date(2024,0,7+Number(idx||0)).toLocaleDateString(locale(), {weekday:'long'});
const getShortDayName = d => d.toLocaleDateString(locale(), {weekday:'short'});

/* ================= Core logic ================= */
const isHoliday = key => holidayDates.includes(key);

function toggleHoliday(key){
  holidayDates = holidayDates.includes(key) ? holidayDates.filter(k=>k!==key) : [...holidayDates, key];
  store.set('barber_holidays', holidayDates);
  renderAdminDashboard();
}

function doesBookingOverlap(startTime, duration, selectedDate, bookings){
  bookings = bookings || bookedSlots;
  const newStart = timeToMinutes(startTime);
  const newEnd = newStart + Number(duration);
  return bookings.some(b => {
    if (b.dateKey && b.dateKey !== selectedDate) return false;
    if (!b.dateKey && b.day !== keyToDate(selectedDate).getDay()) return false;
    const es = timeToMinutes(b.startTime);
    return newStart < es + Number(b.duration) && newEnd > es;
  });
}

function generateAvailableTimes(){
  if (!selectedDateKey || !selectedService) return [];
  if (isHoliday(selectedDateKey)) return [];
  const opening = timeToMinutes(OPENING_TIME), closing = timeToMinutes(CLOSING_TIME);
  const dur = Number(selectedService.duration);
  const out = [];
  for (let start=opening; start+dur<=closing; start+=5){
    const cand = minutesToTime(start);
    if (!doesBookingOverlap(cand, dur, selectedDateKey)) out.push(cand);
  }
  return out.sort((a,b)=>timeToMinutes(a)-timeToMinutes(b));
}

function handleFinalBooking(){
  if (!name.trim() || !phone.trim() || !selectedDateKey || !time || !selectedService){
    showAlert('!', t().errF); return;
  }
  if (isHoliday(selectedDateKey)){ showAlert('!', t().holidayNoBooking); time=null; renderBooking(); return; }
  if (doesBookingOverlap(time, selectedService.duration, selectedDateKey)){
    showAlert('!', t().timeTaken); time=null; renderBooking(); return;
  }
  const selectedDate = keyToDate(selectedDateKey);
  const newBooking = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    clientName: name.trim(), clientPhone: phone.trim(),
    serviceName: selectedService.name, serviceId: selectedService.id,
    dateKey: selectedDateKey, day: selectedDate.getDay(),
    startTime: time, duration: selectedService.duration,
    createdAt: new Date().toISOString()
  };
  bookedSlots.push(newBooking);
  store.set('barber_bookings', bookedSlots);
  const displayed = selectedDate.toLocaleDateString(locale(), {weekday:'long', day:'numeric', month:'long'});
  showAlert(t().alertTitle, t().alertSuccess(name.trim(), selectedService.name, displayed, time), t().btnOk, () => {
    name=''; phone=''; selectedDateKey=null; time=null; selectedService=null;
    document.getElementById('inpName').value='';
    document.getElementById('inpPhone').value='';
    setScreen('home');
  });
}

function deleteBooking(id){
  showConfirm(t().deleteBookingTitle, t().deleteBookingMessage, t().yesDelete, () => {
    bookedSlots = bookedSlots.filter(b=>b.id!==id);
    store.set('barber_bookings', bookedSlots);
    renderAdminDashboard();
  });
}

/* ================= Gallery (Supabase) ================= */
async function replacePhoto(id, file){
  try {
    const compressed = await compressImage(file);
    const fileName = 'barber_' + Date.now() + '.jpg';
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(fileName, compressed, { cacheControl: '3600', upsert: false });
    if (upErr) throw upErr;
    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    const { error: dbErr } = await supabase.from(TABLE).update({ url: publicUrl }).eq('id', id);
    if (dbErr) throw dbErr;
    await loadPhotos();
    renderAdminGallery();
  } catch (err) { alert('حدث خطأ: ' + (err.message || err)); console.error(err); }
}
async function deletePhoto(id){
  const photo = galleryPhotos.find(p => p.id === id);
  showConfirm(t().deleteTitle, t().deleteMessage, t().yesDelete, async () => {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) { alert('خطأ في الحذف: ' + error.message); return; }
    if (photo && photo.url){
      const path = photo.url.split('/').pop();
      await supabase.storage.from(BUCKET).remove([path]);
    }
    await loadPhotos();
    renderAdminGallery();
  });
}

/* ================= Rendering ================= */
function setScreen(s){
  screen = s;
  document.querySelectorAll('.screen').forEach(el=>el.classList.remove('active'));
  document.getElementById('screen-'+s).classList.add('active');
  window.scrollTo(0,0);
  if (s==='home') renderHome();
  if (s==='booking') renderBooking();
  if (s==='gallery') renderGallery();
  if (s==='admin_login') renderAdminLogin();
  if (s==='admin_dashboard') renderAdminDashboard();
  if (s==='admin_gallery') renderAdminGallery();
}

function applyLang(){
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.getElementById('langName').textContent = langNames[lang] + ' ▾';
}

function renderHome(){
  const tr = t();
  document.getElementById('logoText').textContent = tr.logo;
  document.getElementById('subText').textContent = tr.sub;
  document.getElementById('labelText').textContent = tr.label;
  document.getElementById('locText').textContent = tr.loc;
  document.getElementById('titleText').textContent = tr.title;
  document.getElementById('galleryBtn').textContent = '🖼️ ' + tr.gBtn;
  document.getElementById('workingHours').textContent = tr.workingHours;
  document.getElementById('nextBtn').textContent = tr.btn1;

  const menu = document.getElementById('langMenu');
  menu.innerHTML = '';
  Object.keys(langNames).forEach(k=>{
    const b = document.createElement('button');
    b.className = 'language-item';
    b.textContent = langNames[k];
    b.onclick = () => { lang = k; localStorage.setItem('barber_lang', lang); menu.style.display='none'; applyLang(); renderHome(); };
    menu.appendChild(b);
  });

  const list = document.getElementById('servicesList');
  list.innerHTML = '';
  tr.s.forEach(sv=>{
    const b = document.createElement('button');
    b.className = 'item' + (selectedService && selectedService.id===sv.id ? ' active' : '');
    b.innerHTML = `<div style="flex:1"><div class="service-name">${sv.name}</div><div class="service-time">${sv.time}</div></div><div class="price">€${sv.price}</div>`;
    b.onclick = () => { selectedService = sv; time = null; renderHome(); };
    list.appendChild(b);
  });
}

function renderBooking(){
  const tr = t();
  document.querySelector('#screen-booking .back').textContent = tr.back;
  document.getElementById('inpName').placeholder = tr.pName;
  document.getElementById('inpPhone').placeholder = tr.pPhone;
  document.getElementById('dLabel').textContent = tr.dLabel;
  document.getElementById('tLabel').textContent = tr.tLabel;
  document.getElementById('confirmBtn').textContent = tr.btn2;

  const daysEl = document.getElementById('bookingDays');
  daysEl.innerHTML = '';
  futureDates.forEach(d=>{
    const key = dateToKey(d);
    const box = document.createElement('div');
    box.className = 'day-box' + (selectedDateKey===key ? ' active' : '') + (isHoliday(key) ? ' holiday' : '');
    box.innerHTML = `<div class="day-name">${getShortDayName(d)}</div><div class="day-number">${d.getDate()}</div>${isHoliday(key)?'<div class="holiday-mini">🚫</div>':''}`;
    box.onclick = () => { selectedDateKey = key; time = null; renderBooking(); };
    daysEl.appendChild(box);
  });
  document.getElementById('bookingMonth').textContent = getMonthLabel(document.getElementById('bookingMonth'), daysEl);

  const msgEl = document.getElementById('bookingHolidayMsg');
  if (selectedDateKey && isHoliday(selectedDateKey)){
    msgEl.innerHTML = `<div class="holiday-message">🚫 ${tr.holidayNoBooking}</div>`;
  } else msgEl.innerHTML = '';

  const area = document.getElementById('timesArea');
  const times = generateAvailableTimes();
  if (!selectedDateKey){
    area.innerHTML = `<div class="warning">${tr.selectDayFirst}</div>`;
  } else if (isHoliday(selectedDateKey)){
    area.innerHTML = `<div class="warning">${tr.holidayNoBooking}</div>`;
  } else if (times.length === 0){
    area.innerHTML = `<div class="warning">${tr.noTimes}</div>`;
  } else {
    let html = '<div class="times-scroll">';
    times.forEach(tm=>{
      html += `<button class="time-box${time===tm?' active':''}" data-time="${tm}">${tm}</button>`;
    });
    html += '</div>';
    area.innerHTML = html;
    area.querySelectorAll('.time-box').forEach(b=>{
      b.onclick = () => { time = b.dataset.time; renderBooking(); };
    });
  }

  const disabled = !name.trim() || !phone.trim() || !selectedDateKey || !time || isHoliday(selectedDateKey);
  document.getElementById('confirmBtn').classList.toggle('disabled', disabled);
}

function renderGallery(){
  document.querySelector('#screen-gallery .back').textContent = t().back;
  document.getElementById('galleryTitle').textContent = t().gBtn;
  const list = document.getElementById('galleryList');
  if (!galleryPhotos.length){ list.innerHTML = `<div class="warning">${t().gEmpty}</div>`; return; }
  list.innerHTML = galleryPhotos.map(p=>`<img class="gallery-full" src="${p.url}" alt="" loading="lazy">`).join('');
}

function renderAdminLogin(){
  document.querySelector('#screen-admin_login .back').textContent = t().back;
  document.getElementById('loginTitle').textContent = t().loginTitle;
  document.getElementById('inpPassword').placeholder = t().passwordPlaceholder;
  document.getElementById('loginBtn').textContent = t().login;
  document.getElementById('inpPassword').value = adminPassword;
}

function formatAdminDate(key){
  return keyToDate(key).toLocaleDateString(locale(), {weekday:'long', day:'numeric', month:'long', year:'numeric'});
}

function renderAdminDashboard(){
  const tr = t();
  document.getElementById('dashboardTitle').textContent = tr.dashboard;
  document.getElementById('logoutBtn').textContent = tr.logout;
  document.getElementById('holidayAdminTitle').textContent = '📅 ' + tr.selectHoliday;
  document.getElementById('holidayAdminSub').textContent = tr.holidayHint;
  document.getElementById('adminGalleryBtn').textContent = '🖼️ ' + tr.gOpen;

  const daysEl = document.getElementById('adminDays');
  daysEl.innerHTML = '';
  futureDates.forEach(d=>{
    const key = dateToKey(d);
    const sel = isHoliday(key);
    const box = document.createElement('div');
    box.className = 'day-box' + (sel ? ' holiday-selected' : '');
    box.innerHTML = `<div class="day-name">${getShortDayName(d)}</div><div class="day-number">${d.getDate()}</div>${sel?'<div class="holiday-mini" style="color:var(--gold)">✓</div>':''}`;
    box.onclick = () => toggleHoliday(key);
    daysEl.appendChild(box);
  });
  document.getElementById('adminMonth').textContent = getMonthLabel(document.getElementById('adminMonth'), daysEl);

  const selEl = document.getElementById('selectedHolidays');
  const futureKeys = futureDates.map(dateToKey);
  const shown = holidayDates.filter(k=>futureKeys.includes(k)).sort();
  selEl.innerHTML = shown.map(k=>`
    <div class="selected-holiday-row">
      <span>🚫 ${formatAdminDate(k)}</span>
      <button class="remove-holiday" data-key="${k}">${tr.remove}</button>
    </div>`).join('');
  selEl.querySelectorAll('.remove-holiday').forEach(b=>{
    b.onclick = () => toggleHoliday(b.dataset.key);
  });

  const list = document.getElementById('bookingsList');
  if (!bookedSlots.length){
    list.innerHTML = `<div class="empty">${tr.noBookings}</div>`;
  } else {
    const sorted = [...bookedSlots].sort((a,b)=>{
      if (a.dateKey && b.dateKey) return a.dateKey.localeCompare(b.dateKey) || timeToMinutes(a.startTime)-timeToMinutes(b.startTime);
      return (a.day||0)-(b.day||0) || timeToMinutes(a.startTime)-timeToMinutes(b.startTime);
    });
    list.innerHTML = '';
    sorted.forEach(item=>{
      const div = document.createElement('div');
      div.className = 'admin-item';
      div.innerHTML = `
        <div style="flex:1">
          <div class="client-name">${item.clientName}</div>
          <div class="admin-info">${tr.phone}: ${item.clientPhone}</div>
          <div class="admin-info">${tr.service}: ${item.serviceName}</div>
          <div class="admin-info">${tr.day}: ${item.dateKey ? formatAdminDate(item.dateKey) : weekdayName(item.day)}</div>
          <div class="admin-info">${tr.time}: ${item.startTime}</div>
          <div class="admin-duration">${tr.duration}: ${item.duration} min</div>
        </div>
        <button class="delete-btn" data-id="${item.id}">🗑️</button>`;
      div.querySelector('.delete-btn').onclick = () => deleteBooking(item.id);
      list.appendChild(div);
    });
  }
}

let replaceTargetId = null;
function renderAdminGallery(){
  const tr = t();
  document.querySelector('#screen-admin_gallery .back').textContent = tr.back;
  document.getElementById('adminGalleryTitle').textContent = tr.gManage;
  document.getElementById('addPhotoBtn').textContent = tr.gAdd;
  const list = document.getElementById('adminGalleryList');
  if (!galleryPhotos.length){ list.innerHTML = `<div class="warning">${tr.gEmpty}</div>`; return; }
  list.innerHTML = '';
  galleryPhotos.forEach(p=>{
    const row = document.createElement('div');
    row.className = 'gallery-row';
    row.innerHTML = `
      <img class="gallery-thumb" src="${p.url}" alt="" loading="lazy">
      <div class="gallery-actions">
        <button class="logout change-btn">${tr.gChange}</button>
        <button class="delete-btn del-btn" style="margin-left:0">🗑️</button>
      </div>`;
    row.querySelector('.change-btn').onclick = () => { replaceTargetId = p.id; document.getElementById('photoInput').click(); };
    row.querySelector('.del-btn').onclick = () => deletePhoto(p.id);
    list.appendChild(row);
  });
}

/* ================= Events ================= */
document.getElementById('langBox').onclick = () => {
  const m = document.getElementById('langMenu');
  m.style.display = m.style.display === 'none' ? 'block' : 'none';
};
document.getElementById('adminTrigger').onclick = () => setScreen('admin_login');
document.getElementById('nextBtn').onclick = () => {
  if (!selectedService){ showAlert('!', t().errS); return; }
  setScreen('booking');
};
document.getElementById('galleryBtn').onclick = () => setScreen('gallery');
document.getElementById('adminGalleryBtn').onclick = () => setScreen('admin_gallery');
document.getElementById('logoutBtn').onclick = () => setScreen('home');
document.getElementById('confirmBtn').onclick = handleFinalBooking;
document.getElementById('inpName').addEventListener('input', e => { name = e.target.value; renderBooking(); });
document.getElementById('inpPhone').addEventListener('input', e => { phone = e.target.value; renderBooking(); });
document.getElementById('inpPassword').addEventListener('input', e => { adminPassword = e.target.value; });
document.getElementById('inpPassword').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
document.getElementById('loginBtn').onclick = doLogin;
document.getElementById('addPhotoBtn').onclick = () => { replaceTargetId = null; document.getElementById('photoInput').click(); };
document.getElementById('photoInput').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  if (replaceTargetId) { const id = replaceTargetId; replaceTargetId = null; e.target.value = ''; replacePhoto(id, file); }
  else handlePhotoUpload(e.target);
});
document.querySelectorAll('.back').forEach(b=>{
  b.onclick = () => {
    const go = b.dataset.goto;
    if (go === 'home' && screen === 'booking'){ name=''; phone=''; selectedDateKey=null; time=null; selectedService=null;
      document.getElementById('inpName').value=''; document.getElementById('inpPhone').value=''; }
    setScreen(go);
  };
});
const bookingDaysEl = document.getElementById('bookingDays');
const adminDaysEl = document.getElementById('adminDays');
bookingDaysEl.addEventListener('scroll', () => { document.getElementById('bookingMonth').textContent = getMonthLabel(document.getElementById('bookingMonth'), bookingDaysEl); });
adminDaysEl.addEventListener('scroll', () => { document.getElementById('adminMonth').textContent = getMonthLabel(document.getElementById('adminMonth'), adminDaysEl); });
window.addEventListener('resize', () => {
  if (screen==='booking') document.getElementById('bookingMonth').textContent = getMonthLabel(document.getElementById('bookingMonth'), bookingDaysEl);
  if (screen==='admin_dashboard') document.getElementById('adminMonth').textContent = getMonthLabel(document.getElementById('adminMonth'), adminDaysEl);
});

function doLogin(){
  if (adminPassword === CORRECT_PASSWORD){ adminPassword=''; document.getElementById('inpPassword').value=''; setScreen('admin_dashboard'); }
  else showAlert('!', t().wrongPassword);
}

/* ================= Init ================= */
function loadData(){
  const b = store.get('barber_bookings', []);
  if (Array.isArray(b)) bookedSlots = b;
  const h = store.get('barber_holidays', []);
  if (Array.isArray(h)) holidayDates = h;
  galleryPhotos = []; // الصور تُحمّل من Supabase وليس من localStorage
}

loadData();
applyLang();
renderHome();
loadPhotos().then(() => {
  if (screen === 'gallery') renderGallery();
  if (screen === 'admin_gallery') renderAdminGallery();
});
</script>
</body>
</html>
