// ==== CONFIG ====
const scriptURL = "https://script.google.com/macros/s/AKfycbwmCCagAGpaScn7_LgabaBvPTF2CI1gWmn24_oHFI4fKWc5aLefzbiYFnIaTGqtiMy2/exec"; // <-- Google Apps Script Web App URL'ingizni shu yerga qo'ying

// ==== ELEMENTS ====
const profilInput = document.getElementById("profilInput");
const mahsulotInput = document.getElementById("mahsulotInput");
const sapInput = document.getElementById("sapInput");

const profilSug = document.getElementById("profilSuggestions");
const mahsulotSug = document.getElementById("mahsulotSuggestions");
const sapSug = document.getElementById("sapSuggestions");

const results = document.getElementById("results");
const emptyState = document.getElementById("emptyState");
const loader = document.getElementById("loader");
const errorBox = document.getElementById("errorBox");
const countBadge = document.getElementById("countBadge");
const statusEl = document.getElementById("status");
const clearBtn = document.getElementById("clearBtn");
const refreshBtn = document.getElementById("refreshBtn");
const themeToggle = document.getElementById("themeToggle");

// ==== STATE ====
let DATA = [];
let suggestionIndex = { profil: -1, mahsulot: -1, sap: -1 }; // for keyboard nav

// ==== THEME ====
const root = document.documentElement;
const savedTheme = localStorage.getItem('theme');
if (savedTheme) document.documentElement.classList.toggle('dark', savedTheme === 'dark');
themeToggle.addEventListener('click', () => {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// ==== UTILS ====
const debounce = (fn, delay = 180) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
};

const show = el => el.classList.remove('hidden');
const hide = el => el.classList.add('hidden');

const setStatus = (msg = '') => { statusEl.textContent = msg; };

// ==== FETCH DATA ====
async function loadData() {
  hide(errorBox);
  show(loader);
  setStatus('Ma’lumotlar yuklanmoqda...');
  countBadge.classList.add('hidden');

  try {
    const res = await fetch(scriptURL, { cache: 'no-store' });
    if (!res.ok) throw new Error('Tarmoq xatosi: ' + res.status);
    const json = await res.json();
    if (!Array.isArray(json)) throw new Error('Noto‘g‘ri format: JSON massiv emas.');
    DATA = json;
    setStatus(`Jami: ${DATA.length} qator`);
    filterData();
  } catch (e) {
    errorBox.textContent = 'Xatolik: ' + e.message + ' (URL, ruxsatlar yoki CORS-ni tekshiring)';
    show(errorBox);
    results.innerHTML = '';
    show(emptyState);
  } finally {
    hide(loader);
  }
}

// ==== FILTERING ====
function filterData() {
  const profil = profilInput.value.trim().toLowerCase();
  const mahsulot = mahsulotInput.value.trim().toLowerCase();
  const sap = sapInput.value.trim().toLowerCase();

  const filtered = DATA.filter(row => {
    const p = String(row.gruppa ?? "").toLowerCase();
    const m = String(row.nomi ?? "").toLowerCase();
    const s = String(row.sap ?? "").toLowerCase();
    return (!profil || p.includes(profil)) &&
           (!mahsulot || m.includes(mahsulot)) &&
           (!sap || s.includes(sap));
  });

  renderResults(filtered);
  if (filtered.length) {
    countBadge.textContent = `${filtered.length} ta topildi`;
    countBadge.classList.remove('hidden');
  } else {
    countBadge.classList.add('hidden');
  }
}

// ==== RENDER ====
function renderResults(rows) {
  results.innerHTML = '';
  if (!rows.length) {
    show(emptyState);
    return;
  }
  hide(emptyState);

  const frag = document.createDocumentFragment();
  rows.forEach(row => {
    const card = document.createElement('div');
    card.className = "bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-card hover:shadow-lg transition-shadow flex flex-col h-full";
    
    let imgHtml = '';
    let rasmUrl = String(row.rasm ?? '').trim();
    
    if (rasmUrl && !rasmUrl.startsWith('http') && !rasmUrl.startsWith('/')) {
        // Agar rasm faqat nom/ID bo'lsa, URL yasab olamiz
        rasmUrl = `https://akfa-rasmlar.vercel.app/images/${rasmUrl}.png`;
    }

    if (rasmUrl) {
        imgHtml = `
          <div class="mb-4 h-40 w-full rounded-lg bg-gray-50 dark:bg-gray-900 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-800 relative group p-2">
            <img src="${esc(rasmUrl)}" alt="${esc(row.nomi)}" class="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" onerror="this.style.display='none'">
          </div>
        `;
    }

    card.innerHTML = `
      ${imgHtml}
      <div class="space-y-1 text-sm flex-1">
        <div><span class="text-gray-500 dark:text-gray-400">Profil:</span> <span class="font-medium text-primary">${esc(row.gruppa) || "-"}</span></div>
        <div><span class="text-gray-500 dark:text-gray-400">Mahsulot nomi:</span> <span class="font-medium">${esc(row.nomi) || "-"}</span></div>
        <div><span class="text-gray-500 dark:text-gray-400">SAP kod:</span> <span class="font-mono">${esc(row.sap) || "-"}</span></div>
        <div><span class="text-gray-500 dark:text-gray-400">Norma:</span> <span>${esc(row.norma) || "-"}</span></div>
      </div>
    `;
    frag.appendChild(card);
  });
  results.appendChild(frag);
}

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[s]);
}

// ==== SUGGESTIONS ====
function buildSuggestions(input, box, key, which) {
  const q = input.value.trim().toLowerCase();
  box.innerHTML = '';
  suggestionIndex[which] = -1;

  if (!q) { box.classList.add('hidden'); return; }

  const seen = new Set();
  const list = [];
  for (const row of DATA) {
    const val = String(row[key] ?? '');
    if (!val) continue;
    if (val.toLowerCase().includes(q) && !seen.has(val)) {
      seen.add(val);
      list.push(val);
      if (list.length >= 12) break;
    }
  }

  if (!list.length) { box.classList.add('hidden'); return; }

  const frag = document.createDocumentFragment();
  list.forEach((s, idx) => {
    const div = document.createElement('div');
    div.className = 'suggestion-item px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700';
    div.textContent = s;
    div.addEventListener('mousedown', (e) => {
      e.preventDefault(); // prevents input blur before click
      input.value = s;
      box.classList.add('hidden');
      filterData();
    });
    frag.appendChild(div);
  });

  box.appendChild(frag);
  box.classList.remove('hidden');
}

function moveActive(box, which, dir) {
  const items = [...box.querySelectorAll('.suggestion-item')];
  if (!items.length) return;
  suggestionIndex[which] = (suggestionIndex[which] + dir + items.length) % items.length;
  items.forEach(i => i.classList.remove('active'));
  items[suggestionIndex[which]].classList.add('active');
  items[suggestionIndex[which]].scrollIntoView({ block: 'nearest' });
}

function chooseActive(input, box, which) {
  const items = [...box.querySelectorAll('.suggestion-item')];
  if (suggestionIndex[which] >= 0 && items[suggestionIndex[which]]) {
    input.value = items[suggestionIndex[which]].textContent;
    box.classList.add('hidden');
    filterData();
  }
}

// ==== EVENTS ====
const buildProfil = () => buildSuggestions(profilInput, profilSug, "gruppa", "profil");
const buildMahsulot = () => buildSuggestions(mahsulotInput, mahsulotSug, "nomi", "mahsulot");
const buildSap = () => buildSuggestions(sapInput, sapSug, "sap", "sap");

profilInput.addEventListener('input', debounce(() => { buildProfil(); filterData(); }));
mahsulotInput.addEventListener('input', debounce(() => { buildMahsulot(); filterData(); }));
sapInput.addEventListener('input', debounce(() => { buildSap(); filterData(); }));

profilInput.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); moveActive(profilSug, 'profil', +1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); moveActive(profilSug, 'profil', -1); }
  else if (e.key === 'Enter') { chooseActive(profilInput, profilSug, 'profil'); }
  else if (e.key === 'Escape') { profilSug.classList.add('hidden'); }
});

mahsulotInput.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); moveActive(mahsulotSug, 'mahsulot', +1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); moveActive(mahsulotSug, 'mahsulot', -1); }
  else if (e.key === 'Enter') { chooseActive(mahsulotInput, mahsulotSug, 'mahsulot'); }
  else if (e.key === 'Escape') { mahsulotSug.classList.add('hidden'); }
});

sapInput.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); moveActive(sapSug, 'sap', +1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); moveActive(sapSug, 'sap', -1); }
  else if (e.key === 'Enter') { chooseActive(sapInput, sapSug, 'sap'); }
  else if (e.key === 'Escape') { sapSug.classList.add('hidden'); }
});

document.addEventListener('click', (e) => {
  if (!profilInput.contains(e.target) && !profilSug.contains(e.target)) profilSug.classList.add('hidden');
  if (!mahsulotInput.contains(e.target) && !mahsulotSug.contains(e.target)) mahsulotSug.classList.add('hidden');
  if (!sapInput.contains(e.target) && !sapSug.contains(e.target)) sapSug.classList.add('hidden');
});

clearBtn.addEventListener('click', () => {
  profilInput.value = '';
  mahsulotInput.value = '';
  sapInput.value = '';
  profilSug.classList.add('hidden');
  mahsulotSug.classList.add('hidden');
  sapSug.classList.add('hidden');
  filterData();
  profilInput.focus();
});

refreshBtn.addEventListener('click', loadData);

// ==== INIT ====
loadData();