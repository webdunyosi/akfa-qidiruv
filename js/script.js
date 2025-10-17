// ==== CONFIG ====
const scriptURL = "https://script.google.com/macros/s/AKfycbwddNN0w1jTmXRscVYK6F4VQo2KCpsB3wlD8Bt8MRBRp30ADGe8n1gmxz6CrOBcOTuIVQ/exec"; // <-- Google Apps Script Web App URL'ingizni shu yerga qo'ying

// ==== ELEMENTS ====
const sapInput = document.getElementById("sapInput");
const tavsifInput = document.getElementById("tavsifInput");
const seriyaInput = document.getElementById("seriyaInput");
const qoplamaInput = document.getElementById("qoplamaInput");

const sapSug = document.getElementById("sapSuggestions");
const tavsifSug = document.getElementById("tavsifSuggestions");
const seriyaSug = document.getElementById("seriyaSuggestions");
const qoplamaSug = document.getElementById("qoplamaSuggestions");

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
let suggestionIndex = { sap: -1, tavsif: -1, seriya: -1, qoplama: -1 }; // for keyboard nav

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
  const sap = sapInput.value.trim().toLowerCase();
  const tavsif = tavsifInput.value.trim().toLowerCase();
  const seriya = seriyaInput.value.trim().toLowerCase();
  const qoplama = qoplamaInput.value.trim().toLowerCase();

  const filtered = DATA.filter(row => {
    const s = String(row["SAP код"] ?? "").toLowerCase();
    const t = String(row["Краткий текст товара в SAP"] ?? "").toLowerCase();
    const sr = String(row["Название серии/системы продукта"] ?? "").toLowerCase();
    const q = String(row["Покрытие"] ?? "").toLowerCase();
    return (!sap || s.includes(sap)) &&
           (!tavsif || t.includes(tavsif)) &&
           (!seriya || sr.includes(seriya)) &&
           (!qoplama || q.includes(qoplama));
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
    card.className = "bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex cursor-pointer";
    card.onclick = () => openModal(row);
    
    const imageUrl = row["Картина"] || '';
    const imageHTML = imageUrl ? 
      `<div class="relative w-32 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <img src="${esc(imageUrl)}" alt="${esc(row["Краткий текст товара в SAP"])}" 
             class="w-full h-full object-contain p-0" 
             onerror="this.parentElement.innerHTML='<div class=\\'flex items-center justify-center h-full text-gray-400 dark:text-gray-600 text-3xl\\'>🖼️</div>'">
      </div>` : 
      `<div class="w-32 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
        <span class="text-4xl text-gray-300 dark:text-gray-700">📦</span>
      </div>`;
    
    card.innerHTML = `
      ${imageHTML}
      <div class="p-4 flex-1 space-y-2 text-sm">
        <div><span class="text-gray-500 dark:text-gray-400">SAP kod:</span> <span class="font-mono text-xs font-semibold text-primary">${esc(row["SAP код"]) || "-"}</span></div>
        <div><span class="text-gray-500 dark:text-gray-400">Tavsif:</span> <span class="font-medium">${esc(row["Краткий текст товара в SAP"]) || "-"}</span></div>
        <div><span class="text-gray-500 dark:text-gray-400">Seriya:</span> <span>${esc(row["Название серии/системы продукта"]) || "-"}</span></div>
        <div><span class="text-gray-500 dark:text-gray-400">Qoplama:</span> <span class="font-semibold text-green-600 dark:text-green-400">${esc(row["Покрытие"]) || "-"}</span></div>
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
const buildSap = () => buildSuggestions(sapInput, sapSug, "SAP код", "sap");
const buildTavsif = () => buildSuggestions(tavsifInput, tavsifSug, "Краткий текст товара в SAP", "tavsif");
const buildSeriya = () => buildSuggestions(seriyaInput, seriyaSug, "Название серии/системы продукта", "seriya");
const buildQoplama = () => buildSuggestions(qoplamaInput, qoplamaSug, "Покрытие", "qoplama");

sapInput.addEventListener('input', debounce(() => { buildSap(); filterData(); }));
tavsifInput.addEventListener('input', debounce(() => { buildTavsif(); filterData(); }));
seriyaInput.addEventListener('input', debounce(() => { buildSeriya(); filterData(); }));
qoplamaInput.addEventListener('input', debounce(() => { buildQoplama(); filterData(); }));

sapInput.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); moveActive(sapSug, 'sap', +1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); moveActive(sapSug, 'sap', -1); }
  else if (e.key === 'Enter') { chooseActive(sapInput, sapSug, 'sap'); }
  else if (e.key === 'Escape') { sapSug.classList.add('hidden'); }
});

tavsifInput.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); moveActive(tavsifSug, 'tavsif', +1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); moveActive(tavsifSug, 'tavsif', -1); }
  else if (e.key === 'Enter') { chooseActive(tavsifInput, tavsifSug, 'tavsif'); }
  else if (e.key === 'Escape') { tavsifSug.classList.add('hidden'); }
});

seriyaInput.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); moveActive(seriyaSug, 'seriya', +1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); moveActive(seriyaSug, 'seriya', -1); }
  else if (e.key === 'Enter') { chooseActive(seriyaInput, seriyaSug, 'seriya'); }
  else if (e.key === 'Escape') { seriyaSug.classList.add('hidden'); }
});

qoplamaInput.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); moveActive(qoplamaSug, 'qoplama', +1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); moveActive(qoplamaSug, 'qoplama', -1); }
  else if (e.key === 'Enter') { chooseActive(qoplamaInput, qoplamaSug, 'qoplama'); }
  else if (e.key === 'Escape') { qoplamaSug.classList.add('hidden'); }
});

document.addEventListener('click', (e) => {
  if (!sapInput.contains(e.target) && !sapSug.contains(e.target)) sapSug.classList.add('hidden');
  if (!tavsifInput.contains(e.target) && !tavsifSug.contains(e.target)) tavsifSug.classList.add('hidden');
  if (!seriyaInput.contains(e.target) && !seriyaSug.contains(e.target)) seriyaSug.classList.add('hidden');
  if (!qoplamaInput.contains(e.target) && !qoplamaSug.contains(e.target)) qoplamaSug.classList.add('hidden');
});

clearBtn.addEventListener('click', () => {
  sapInput.value = '';
  tavsifInput.value = '';
  seriyaInput.value = '';
  qoplamaInput.value = '';
  sapSug.classList.add('hidden');
  tavsifSug.classList.add('hidden');
  seriyaSug.classList.add('hidden');
  qoplamaSug.classList.add('hidden');
  filterData();
  sapInput.focus();
});

refreshBtn.addEventListener('click', loadData);

// ==== MODAL ====
function openModal(row) {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modalContent');
  
  const imageUrl = row["Картина"] || '';
  const imageHTML = imageUrl ? 
    `<div class="w-80 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl overflow-hidden">
      <img src="${esc(imageUrl)}" alt="${esc(row["Краткий текст товара в SAP"])}" 
           class="w-full h-full object-contain p-0" 
           onerror="this.parentElement.innerHTML='<div class=\\'flex items-center justify-center h-full text-gray-400 dark:text-gray-600 text-6xl\\'>🖼️ Rasm yuklanmadi</div>'">
    </div>` : 
    `<div class="w-80 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl flex items-center justify-center">
      <span class="text-8xl text-gray-300 dark:text-gray-700">📦</span>
    </div>`;
  
  modalContent.innerHTML = `
    <div class="flex flex-col md:flex-row gap-6">
      ${imageHTML}
      <div class="flex-1 space-y-4">
        <div class="border-b border-gray-200 dark:border-gray-800 pb-3">
          <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">SAP kod</div>
          <div class="text-2xl font-mono font-semibold text-primary break-all">${esc(row["SAP код"]) || "-"}</div>
        </div>
        <div class="border-b border-gray-200 dark:border-gray-800 pb-3">
          <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">Mahsulot tavsifi</div>
          <div class="text-xl font-medium">${esc(row["Краткий текст товара в SAP"]) || "-"}</div>
        </div>
        <div class="border-b border-gray-200 dark:border-gray-800 pb-3">
          <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">Seriya / Sistema</div>
          <div class="text-lg">${esc(row["Название серии/системы продукта"]) || "-"}</div>
        </div>
        <div>
          <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">Qoplama</div>
          <div class="text-2xl font-bold text-green-600 dark:text-green-400">${esc(row["Покрытие"]) || "-"}</div>
        </div>
      </div>
    </div>
  `;
  
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal(event) {
  if (!event || event.target.id === 'modal' || event.type === 'click') {
    const modal = document.getElementById('modal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

// ESC tugmasi bilan yopish
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ==== INIT ====
loadData();