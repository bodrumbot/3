// ========== 1. MAHSULOTLAR (STATIC) ==========
const menu = [
  { id: 1, name: 'Klyukva-Burger kombo',  price: 64000, img: 'https://i.ibb.co/sJtWCn5M/images-1.jpg' },
  { id: 2, name: 'Klyukva-Lavash kombo',  price: 59000, img: 'https://i.ibb.co/sJtWCn5M/images-1.jpg' },
  { id: 3, name: 'Klyukva-Trindwich kombo', price: 62000, img: 'https://i.ibb.co/sJtWCn5M/images-1.jpg' },
  { id: 4, name: 'Klyukva-Burger',        price: 44000, img: 'https://i.ibb.co/sJtWCn5M/images-1.jpg' },
];

// ========== 2. PROFIL (INDEXEDDB) ==========
const DB_NAME = 'bodrumDB';
const STORE_PROFILE = 'profile';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_PROFILE))
        db.createObjectStore(STORE_PROFILE, { keyPath: 'id' });
    };
  });
}
async function saveProfileDB({ name, phone }) {
  const db = await openDB();
  const tx = db.transaction(STORE_PROFILE, 'readwrite');
  tx.objectStore(STORE_PROFILE).put({ id: 1, name, phone });
  await tx.complete;
}
async function getProfileDB() {
  const db = await openDB();
  const tx = db.transaction(STORE_PROFILE, 'readonly');
  return tx.objectStore(STORE_PROFILE).get(1);
}

// ========== 3. TAB SWITCH ==========
document.querySelectorAll('.tab').forEach(btn =>
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab, .tab-content').forEach(el => el.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  })
);

// ========== 4. CART ==========
const menuGrid = document.getElementById('menuGrid');
const cartList = document.getElementById('cartList');
const cartBadge = document.getElementById('cartBadge');
const cartTotal = document.getElementById('cartTotal');
const orderBtn = document.getElementById('orderBtn');

let cart = [];

// --- render menu ---
menu.forEach(item => {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <img src="${item.img}" alt="${item.name}">
    <h3>${item.name}</h3>
    <div class="price">${item.price.toLocaleString()} so‘m</div>
    <button class="add-btn-only" data-id="${item.id}">Savatchaga</button>
  `;
  menuGrid.appendChild(card);
});

// --- add to cart ---
menuGrid.addEventListener('click', e => {
  if (e.target.classList.contains('add-btn-only')) {
    const id = +e.target.dataset.id;
    const product = menu.find(p => p.id === id);
    const exist = cart.find(c => c.id === id);
    exist ? exist.qty++ : cart.push({ ...product, qty: 1 });
    renderCart();
  }
});

// --- render cart ---
function renderCart() {
  cartList.innerHTML = '';
  let total = 0;
  cart.forEach((item, idx) => {
    total += item.price * item.qty;
    cartList.insertAdjacentHTML('beforeend', `
      <div class="cart-item">
        <img src="${item.img}" alt="">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${(item.price * item.qty).toLocaleString()} so‘m</div>
        </div>
        <div class="cart-item-controls">
          <div class="cart-item-qty">
            <button data-idx="${idx}" data-act="-">−</button>
            <span>${item.qty}</span>
            <button data-idx="${idx}" data-act="+">+</button>
          </div>
          <button class="cart-item-delete" data-idx="${idx}">
            <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
      </div>
    `);
  });
  cartBadge.textContent = cart.reduce((s, i) => s + i.qty, 0);
  cartTotal.textContent = `Umumiy: ${total.toLocaleString()} so‘m`;
}

// --- qty & delete ---
cartList.addEventListener('click', e => {
  const idx = +e.target.dataset.idx;
  if (isNaN(idx)) return;
  const act = e.target.dataset.act;
  if (act === '+') cart[idx].qty++;
  if (act === '-') cart[idx].qty = Math.max(1, cart[idx].qty - 1);
  if (e.target.closest('.cart-item-delete')) cart.splice(idx, 1);
  renderCart();
});

// ========== 5. BUYURTMA (direct to bot via WebApp) ==========
// API manzili kerak emas, chunki buyurtma botga WebApp orqali yuboriladi

orderBtn.addEventListener('click', async () => {
  if (!cart.length) return alert('Savat bo‘sh!');
  const p = await getProfileDB();
  if (!p?.name || !p?.phone) return openProfModal();
  getLocationAndFinish();
});

function getLocationAndFinish() {
  cartList.innerHTML = '<div class="loader"></div>';
  cartTotal.textContent = 'Joylashuv aniqlanmoqda...';
  if (!navigator.geolocation) return finishOrder(null);
  navigator.geolocation.getCurrentPosition(
    pos => finishOrder({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
    () => finishOrder(null)
  );
}

async function finishOrder(location) {
  const p = await getProfileDB();
  const payload = {
    name: p.name,
    phone: p.phone,
    items: cart,
    total: cart.reduce((s, i) => s + i.price * i.qty, 0),
    location: location ? `${location.lat},${location.lng}` : null
  };

  if (window.Telegram.WebApp) {
    window.Telegram.WebApp.sendData(JSON.stringify(payload));
  } else {
    alert('Telegram orqali kirish majburiy!');
  }
}

  // Telegram WebApp orqali botga yuborish
  if (window.Telegram.WebApp) {
    window.Telegram.WebApp.sendData(JSON.stringify(payload));
  } else {
    alert('Telegram orqali kirish majburiy!');
  }

// ========== 6. PROFIL MODAL ==========
const profModal = document.getElementById('profModal');
const modalName = document.getElementById('modalName');
const modalPhone = document.getElementById('modalPhone');
const modalSave = document.getElementById('modalSave');

function openProfModal() {
  profModal.classList.add('show');
}
async function closeProfModal() {
  profModal.classList.remove('show');
}

modalSave.addEventListener('click', async () => {
  const name = modalName.value.trim();
  const phone = modalPhone.value.trim();
  if (!name || !phone) return alert('Iltimos, hammasini to‘ldiring!');
  await saveProfileDB({ name, phone });
  closeProfModal();
  getLocationAndFinish();
});

// ========== 7. PROFIL TAB ==========
document.getElementById('saveProf').addEventListener('click', async () => {
  const name = document.getElementById('inpName').value.trim();
  const phone = document.getElementById('inpPhone').value.trim();
  if (!name || !phone) return alert('Iltimos, hammasini to‘ldiring!');
  await saveProfileDB({ name, phone });
  alert('✅ Saqlangan!');
});

// ========== 8. INIT ==========
renderCart(); // sahifa yuklanganda savatni bo‘sh ko‘rsatadi