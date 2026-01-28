// ---------- TELEGRAM WEBAPP INITIALIZATION ----------
let tg = null;
let isTelegramWebApp = false;

function initTelegram() {
  if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    isTelegramWebApp = true;
    
    // Expand to full height
    tg.expand();
    
    // Enable closing confirmation
    tg.enableClosingConfirmation();
    
    // Set header color
    tg.setHeaderColor('#ff6600');
    
    console.log('✅ Telegram WebApp initialized');
    console.log('User:', tg.initDataUnsafe.user);
  } else {
    console.warn('⚠️ Not running in Telegram WebApp');
    // Show warning to user
    showWarning();
  }
}

function showWarning() {
  const warning = document.createElement('div');
  warning.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #ff6600;
    color: white;
    padding: 12px;
    text-align: center;
    font-size: 14px;
    z-index: 9999;
  `;
  warning.innerHTML = '⚠️ Bu ilova faqat Telegram bot orqali ishlaydi!';
  document.body.prepend(warning);
}

// Initialize on load
initTelegram();

// ---------- 1. MAHSULOTLAR ----------
const menu = [
  { id: 1, name: 'Klyukva-Burger kombo',  price: 64000, img: 'https://i.ibb.co/sJtWCn5M/images-1.jpg' },
  { id: 2, name: 'Klyukva-Lavash kombo',  price: 59000, img: 'https://i.ibb.co/sJtWCn5M/images-1.jpg' },
  { id: 3, name: 'Klyukva-Trindwich kombo', price: 62000, img: 'https://i.ibb.co/sJtWCn5M/images-1.jpg' },
  { id: 4, name: 'Klyukva-Burger',        price: 44000, img: 'https://i.ibb.co/sJtWCn5M/images-1.jpg' },
];

// ---------- 2. INDEXEDDB ----------
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
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_PROFILE, 'readwrite');
    tx.objectStore(STORE_PROFILE).put({ id: 1, name, phone });
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
    console.log('✅ Profile saved to IndexedDB');
  } catch (error) {
    console.error('❌ Error saving profile:', error);
    throw error;
  }
}

async function getProfileDB() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_PROFILE, 'readonly');
    const result = await new Promise((resolve, reject) => {
      const req = tx.objectStore(STORE_PROFILE).get(1);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    console.log('Profile from DB:', result);
    return result;
  } catch (error) {
    console.error('❌ Error getting profile:', error);
    return null;
  }
}

// ---------- 3. LOCALSTORAGE (savat) ----------
const CART_KEY = 'bodrum_cart';

function saveCartLS() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  console.log('💾 Cart saved:', cart.length, 'items');
}

function loadCartLS() {
  const raw = localStorage.getItem(CART_KEY);
  cart = raw ? JSON.parse(raw) : [];
  console.log('📦 Cart loaded:', cart.length, 'items');
}

// ---------- 4. TAB SWITCH ----------
document.querySelectorAll('.tab').forEach(btn =>
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab, .tab-content').forEach(el => el.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  })
);

// ---------- 5. CART ----------
const menuGrid   = document.getElementById('menuGrid');
const cartList   = document.getElementById('cartList');
const cartBadge  = document.getElementById('cartBadge');
const cartTotal  = document.getElementById('cartTotal');
const orderBtn   = document.getElementById('orderBtn');

let cart = [];
loadCartLS();
renderCart();

// --- Render menu ---
menu.forEach(item => {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <img src="${item.img}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/120?text=No+Image'">
    <h3>${item.name}</h3>
    <div class="price">${item.price.toLocaleString()} so'm</div>
    <button class="add-btn-only" data-id="${item.id}">Savatchaga</button>
  `;
  menuGrid.appendChild(card);
});

// --- Add to cart ---
menuGrid.addEventListener('click', e => {
  if (e.target.classList.contains('add-btn-only')) {
    const id = +e.target.dataset.id;
    const product = menu.find(p => p.id === id);
    const exist = cart.find(c => c.id === id);
    
    if (exist) {
      exist.qty++;
    } else {
      cart.push({ ...product, qty: 1 });
    }
    
    saveCartLS();
    renderCart();
    console.log('➕ Added to cart:', product.name);
  }
});

// --- Render cart ---
function renderCart() {
  cartList.innerHTML = '';
  let total = 0;
  
  if (cart.length === 0) {
    cartList.innerHTML = '<div style="padding: 20px; text-align: center; color: #888;">Savat bo\'sh</div>';
    cartBadge.textContent = '0';
    cartTotal.textContent = 'Umumiy: 0 so\'m';
    return;
  }
  
  cart.forEach((item, idx) => {
    total += item.price * item.qty;
    cartList.insertAdjacentHTML('beforeend', `
      <div class="cart-item">
        <img src="${item.img}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/80?text=No+Image'">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${(item.price * item.qty).toLocaleString()} so'm</div>
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
  
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  cartBadge.textContent = totalQty;
  cartTotal.textContent = `Umumiy: ${total.toLocaleString()} so'm`;
}

// --- Quantity control & delete ---
cartList.addEventListener('click', e => {
  const idx = +e.target.dataset.idx;
  if (isNaN(idx)) return;
  
  const act = e.target.dataset.act;
  if (act === '+') {
    cart[idx].qty++;
  } else if (act === '-') {
    if (cart[idx].qty > 1) {
      cart[idx].qty--;
    } else {
      cart.splice(idx, 1);
    }
  }
  
  if (e.target.closest('.cart-item-delete')) {
    cart.splice(idx, 1);
  }
  
  saveCartLS();
  renderCart();
});

// ---------- 6. ORDER ----------
orderBtn.addEventListener('click', async () => {
  if (!cart.length) {
    alert('Savat bo\'sh!');
    return;
  }
  
  if (!isTelegramWebApp) {
    alert('Bu ilova faqat Telegram bot orqali ishlaydi!\n\n1. Telegram botga o\'ting\n2. /start buyrug\'ini bosing\n3. "Buyurtma berish" tugmasini bosing');
    return;
  }
  
  try {
    const profile = await getProfileDB();
    console.log('📋 Checking profile:', profile);
    
    if (!profile || !profile.name || !profile.phone) {
      console.log('⚠️ Profile incomplete, showing modal');
      openProfModal();
      return;
    }
    
    console.log('✅ Profile OK, getting location...');
    getLocationAndFinish();
  } catch (error) {
    console.error('❌ Order button error:', error);
    alert('Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.');
  }
});

// ---------- GET LOCATION & SEND ORDER ----------
function getLocationAndFinish() {
  console.log('📍 Getting location...');
  
  cartList.innerHTML = '<div style="padding: 20px; text-align: center;">⏳ Joylashuv aniqlanmoqda...</div>';
  cartTotal.textContent = 'Iltimos kuting...';
  orderBtn.disabled = true;
  
  // Agar 15 sekund ichida joylashuv olmasa, buyurtmani joylashuvsiz yuborish
  const timeoutId = setTimeout(() => {
    console.warn('⏱️ Joylashuv olish vaqti tugadi');
    finishOrder(null);
  }, 15000);
  
  if (!navigator.geolocation) {
    clearTimeout(timeoutId);
    finishOrder(null);
    return;
  }
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      clearTimeout(timeoutId);
      console.log('✅ Location success:', position.coords);
      finishOrder({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    },
    (error) => {
      clearTimeout(timeoutId);
      console.warn('⚠️ Location error:', error);
      // Joylashuv xatoligida ham buyurtmani yuborish
      finishOrder(null);
    },
    {
      enableHighAccuracy: false, // true o'rniga false qilish tezroq ishlaydi
      timeout: 10000,
      maximumAge: 60000
    }
  );
}

async function finishOrder(location) {
  try {
    console.log('🚀 Finishing order...', location ? 'with location' : 'without location');
    
    const profile = await getProfileDB();
    if (!profile) {
      throw new Error('Profile not found');
    }
    
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    
    const payload = {
      name: profile.name,
      phone: profile.phone,
      items: cart,
      total: total,
      location: location ? `${location.lat},${location.lng}` : null
    };
    
    console.log('📤 Sending data to bot:', payload);
    
    if (!isTelegramWebApp) {
      throw new Error('Not in Telegram WebApp');
    }
    
    // Send data to bot
    tg.sendData(JSON.stringify(payload));
    
    console.log('✅ Data sent successfully');
    
    // Clear cart
    cart = [];
    saveCartLS();
    
    // Bot will close the WebApp automatically after receiving data
    
  } catch (error) {
    console.error('❌ Finish order error:', error);
    alert('Xatolik yuz berdi: ' + error.message);
    
    // Restore UI
    renderCart();
    orderBtn.disabled = false;
  }
}

// ---------- 7. PROFILE MODAL ----------
const profModal  = document.getElementById('profModal');
const modalName  = document.getElementById('modalName');
const modalPhone = document.getElementById('modalPhone');
const modalSave  = document.getElementById('modalSave');

function openProfModal() {
  profModal.classList.add('show');
  modalName.focus();
}

function closeProfModal() {
  profModal.classList.remove('show');
}

modalSave.addEventListener('click', async () => {
  const name  = modalName.value.trim();
  const phone = modalPhone.value.trim();
  
  if (!name) {
    alert('Iltimos, ismingizni kiriting!');
    modalName.focus();
    return;
  }
  
  if (!phone || phone.length !== 9) {
    alert('Iltimos, to\'g\'ri telefon raqam kiriting! (9 ta raqam)');
    modalPhone.focus();
    return;
  }
  
  try {
    console.log('💾 Saving profile:', { name, phone });
    await saveProfileDB({ name, phone });
    closeProfModal();
    console.log('✅ Profile saved, continuing order...');
    getLocationAndFinish();
  } catch (error) {
    console.error('❌ Save profile error:', error);
    alert('Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.');
  }
});

// ---------- 8. PROFILE TAB ----------
const inpName = document.getElementById('inpName');
const inpPhone = document.getElementById('inpPhone');
const saveProf = document.getElementById('saveProf');

// Load profile on tab switch
document.querySelector('[data-tab="profile"]').addEventListener('click', async () => {
  const profile = await getProfileDB();
  if (profile) {
    inpName.value = profile.name || '';
    inpPhone.value = profile.phone || '';
  }
});

saveProf.addEventListener('click', async () => {
  const name  = inpName.value.trim();
  const phone = inpPhone.value.trim();
  
  if (!name || !phone) {
    alert('Iltimos, hammasini to\'ldiring!');
    return;
  }
  
  if (phone.length !== 9) {
    alert('Telefon raqam 9 ta raqamdan iborat bo\'lishi kerak!');
    return;
  }
  
  try {
    await saveProfileDB({ name, phone });
    
    // Send to bot if in Telegram
    if (isTelegramWebApp) {
      tg.sendData(JSON.stringify({
        type: 'profile',
        name: name,
        phone: phone
      }));
    }
    
    alert('✅ Ma\'lumotlar saqlandi!');
  } catch (error) {
    console.error('❌ Profile save error:', error);
    alert('Xatolik yuz berdi!');
  }
});

// Phone input formatting
inpPhone.addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 9);
});

modalPhone.addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 9);
});

console.log('🎉 App initialized');
