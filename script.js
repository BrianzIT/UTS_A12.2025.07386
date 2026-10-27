/* Proyek UTS Pemrograman Web Dasar - Jastie. Semua produk, stok, harga, dan ongkir adalah DATA CONTOH. */
'use strict';

const PRODUCTS = [
  { id: 'original', name: 'Jastie Original', flavor: 'Original', category: 'gurih', price: 15000, stock: 24, tag: 'Rasa klasik', description: 'Gurih renyah untuk teman santai kapan saja.', image: 'assets/images/product-original.svg' },
  { id: 'cokelat', name: 'Jastie Cokelat', flavor: 'Cokelat', category: 'manis', price: 18000, stock: 15, tag: 'Si manis', description: 'Perpaduan rasa manis dan keripik pisang renyah.', image: 'assets/images/product-cokelat.svg' },
  { id: 'keju', name: 'Jastie Keju', flavor: 'Keju', category: 'gurih', price: 18000, stock: 9, tag: 'Pilihan gurih', description: 'Camilan dengan sentuhan rasa keju yang nikmat.', image: 'assets/images/product-keju.svg' },
  { id: 'balado', name: 'Jastie Balado', flavor: 'Balado', category: 'gurih', price: 18000, stock: 0, tag: 'Sedang habis', description: 'Sensasi pedas gurih untuk pecinta rasa kuat.', image: 'assets/images/product-balado.svg' }
];
const SHIPPING = { tegal: 8000, jateng: 15000, luar: 25000 }; // Ongkir SIMULASI, bukan tarif resmi
const CART_KEY = 'jastie_demo_cart_v1';
const HISTORY_KEY = 'jastie_demo_history_v1';
const currency = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
const $ = selector => document.querySelector(selector);
const escapeHTML = str => String(str ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function loadLocal(key, fallback) {
  try { const parsed = JSON.parse(localStorage.getItem(key)); return parsed ?? fallback; }
  catch { return fallback; }
}
function saveLocal(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Browser may restrict local storage */ } }

let cart = loadLocal(CART_KEY, []);
if (!Array.isArray(cart)) cart = [];
cart = cart.filter(item => PRODUCTS.some(p => p.id === item.id && p.stock > 0)).map(item => {
  const product = PRODUCTS.find(p => p.id === item.id);
  return { id: item.id, qty: Math.max(1, Math.min(product.stock, Number(item.qty) || 1)) };
});
let activeFilter = 'semua';
let lastOrder = null;
let toastTimeout;

function cartQuantity() { return cart.reduce((total, item) => total + item.qty, 0); }
function cartSubtotal() { return cart.reduce((sum, item) => sum + PRODUCTS.find(p => p.id === item.id).price * item.qty, 0); }
function setCart(newCart) { cart = newCart; saveLocal(CART_KEY, cart); renderCart(); updateHeaderCount(); }
function updateHeaderCount() {
  const count = cartQuantity();
  $('#cartCount').textContent = count;
  $('#drawerCartCount').textContent = `(${count})`;
}
function showToast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.remove('show'), 2500);
}

function renderProducts() {
  const shown = PRODUCTS.filter(product => activeFilter === 'semua' || product.category === activeFilter);
  $('#productCount').textContent = `${shown.length} produk di kategori ini`;
  $('#productGrid').innerHTML = shown.map(product => `
    <article class="product-card">
      <div class="product-art ${product.id}">
        <span class="product-label ${product.stock === 0 ? 'soldout-label' : ''}">${escapeHTML(product.tag)}</span>
        <img src="${product.image}" alt="Ilustrasi kemasan rasa ${escapeHTML(product.flavor)} (contoh)">
      </div>
      <div class="product-info">
        <div class="product-category">KERIPIK PISANG • DEMO</div>
        <h3>${escapeHTML(product.name)}</h3>
        <p class="product-description">${escapeHTML(product.description)}</p>
        <div class="stock-row ${product.stock ? '' : 'empty'}"><span class="stock-dot"></span>${product.stock ? `Stok demo: ${product.stock} tersedia` : 'Stok demo: habis'}</div>
        <div class="product-bottom"><strong class="price">${currency(product.price)}</strong><button class="add-cart" type="button" data-add="${product.id}" title="Tambahkan ${escapeHTML(product.flavor)} ke keranjang" aria-label="Tambahkan ${escapeHTML(product.flavor)} ke keranjang" ${product.stock === 0 ? 'disabled' : ''}>+</button></div>
      </div>
    </article>
  `).join('');
}

function addToCart(id) {
  const product = PRODUCTS.find(p => p.id === id);
  if (!product || product.stock === 0) return showToast('Maaf, stok contoh sedang habis.');
  const current = cart.find(item => item.id === id);
  if (current && current.qty >= product.stock) return showToast('Jumlah sudah mencapai batas stok demo.');
  const next = [...cart.map(item => ({ ...item }))];
  const existing = next.find(item => item.id === id);
  if (existing) existing.qty += 1; else next.push({ id, qty: 1 });
  setCart(next);
  showToast(`${product.name} masuk ke keranjang!`);
}
function changeQuantity(id, delta) {
  const product = PRODUCTS.find(p => p.id === id);
  const item = cart.find(entry => entry.id === id);
  if (!item || !product) return;
  if (item.qty + delta > product.stock) return showToast('Stok contoh tidak mencukupi.');
  if (item.qty + delta < 1) return setCart(cart.filter(entry => entry.id !== id));
  setCart(cart.map(entry => entry.id === id ? { ...entry, qty: entry.qty + delta } : entry));
}
function renderCart() {
  const el = $('#cartItems');
  if (!cart.length) {
    el.innerHTML = '<div class="empty-cart"><span class="empty-cart-illustration">🛍️</span><strong>Keranjangmu masih kosong.</strong><p>Yuk, temukan rasa Jastie yang ingin kamu coba!</p></div>';
  } else {
    el.innerHTML = cart.map(item => {
      const product = PRODUCTS.find(p => p.id === item.id);
      return `<div class="cart-item"><div class="cart-item-picture"><img src="${product.image}" alt=""></div><div><div class="cart-item-title">${escapeHTML(product.name)}</div><div class="cart-item-price">${currency(product.price * item.qty)}</div><div class="qty-control"><button type="button" data-qty="-1" data-id="${item.id}" aria-label="Kurangi ${escapeHTML(product.flavor)}">−</button><span>${item.qty}</span><button type="button" data-qty="1" data-id="${item.id}" aria-label="Tambah ${escapeHTML(product.flavor)}">+</button><button type="button" data-remove="${item.id}" class="remove-item">Hapus</button></div></div></div>`;
    }).join('');
  }
  $('#cartSubtotal').textContent = currency(cartSubtotal());
  $('#goCheckout').disabled = cart.length === 0;
  $('#goCheckout').style.opacity = cart.length ? '1' : '.5';
}

const dialogs = { cart: $('#cartDrawer'), checkout: $('#checkoutModal'), success: $('#successModal'), history: $('#historyModal') };
function closeDialogs() {
  Object.values(dialogs).forEach(el => { el.classList.remove('is-open'); el.setAttribute('aria-hidden', 'true'); });
  $('#overlay').hidden = true;
  document.body.classList.remove('dialog-open');
}
function openDialog(name) {
  closeDialogs();
  const el = dialogs[name];
  if (!el) return;
  $('#overlay').hidden = false;
  document.body.classList.add('dialog-open');
  el.classList.add('is-open');
  el.setAttribute('aria-hidden', 'false');
  el.querySelector('.icon-close')?.focus({ preventScroll: true });
}

function shippingAmount() { return SHIPPING[$('#shippingArea').value] ?? null; }
function renderCheckoutSummary() {
  $('#checkoutSummaryItems').innerHTML = cart.map(item => {
    const product = PRODUCTS.find(p => p.id === item.id);
    return `<div class="summary-item"><span>${escapeHTML(product.flavor)} × ${item.qty}</span><strong>${currency(product.price * item.qty)}</strong></div>`;
  }).join('');
  const shipping = shippingAmount();
  $('#checkoutSubtotal').textContent = currency(cartSubtotal());
  $('#checkoutShipping').textContent = shipping === null ? 'Pilih wilayah' : currency(shipping);
  $('#checkoutTotal').textContent = currency(cartSubtotal() + (shipping || 0));
}
function openCheckout() {
  if (!cart.length) return showToast('Tambahkan produk dulu ke keranjang.');
  renderCheckoutSummary();
  openDialog('checkout');
}
function submitCheckout(event) {
  event.preventDefault();
  const form = $('#checkoutForm');
  if (!form.reportValidity()) return;
  if (!cart.length) return showToast('Keranjang belanja kosong.');
  const shipping = shippingAmount();
  if (shipping === null) return showToast('Pilih wilayah pengiriman.');
  const method = form.querySelector('input[name="paymentMethod"]:checked')?.value;
  if (!['cod', 'transfer'].includes(method)) return showToast('Pilih metode pembayaran.');
  const name = $('#buyerName').value.trim();
  const phone = $('#buyerPhone').value.trim();
  const address = $('#buyerAddress').value.trim();
  if (name.length < 2 || !/^[+0-9 \-]{9,18}$/.test(phone) || address.length < 10) return showToast('Mohon lengkapi data pengiriman yang valid.');

  const id = 'JST-DEMO-' + Date.now().toString(36).toUpperCase().slice(-7);
  lastOrder = {
    id, date: new Date().toISOString(), name, method, shipping, subtotal: cartSubtotal(), total: cartSubtotal() + shipping,
    items: cart.map(item => ({ ...item })), status: method === 'transfer' ? 'Menunggu pembayaran (demo)' : 'Belum lunas (COD, demo)'
  };
  // Demi privasi, data nama/telepon/alamat tidak disimpan ke riwayat localStorage.
  const persisted = { id, date: lastOrder.date, method, total: lastOrder.total, items: lastOrder.items, status: lastOrder.status };
  const history = loadLocal(HISTORY_KEY, []);
  saveLocal(HISTORY_KEY, [persisted, ...(Array.isArray(history) ? history : [])].slice(0, 30));
  setCart([]);
  renderReceipt();
  form.reset();
  openDialog('success');
}
function renderReceipt() {
  if (!lastOrder) return;
  $('#successMessage').textContent = lastOrder.method === 'transfer'
    ? 'Pesanan contoh dicatat dengan status menunggu pembayaran. Tidak perlu melakukan transfer sungguhan.'
    : 'Pesanan contoh dicatat dengan status COD belum lunas. Tidak ada pengiriman sungguhan.';
  const details = lastOrder.items.map(item => {
    const p = PRODUCTS.find(product => product.id === item.id);
    return `${p.flavor} × ${item.qty}`;
  }).join(', ');
  $('#orderReceipt').innerHTML = `<div><span>No. pesanan</span><strong>${escapeHTML(lastOrder.id)}</strong></div><div><span>Penerima</span><strong>${escapeHTML(lastOrder.name)}</strong></div><div><span>Produk</span><span>${escapeHTML(details)}</span></div><div><span>Pembayaran</span><strong>${lastOrder.method === 'transfer' ? 'Transfer bank' : 'COD'}</strong></div><div><span>Status</span><strong>${escapeHTML(lastOrder.status)}</strong></div><div><span>Ongkir demo</span><strong>${currency(lastOrder.shipping)}</strong></div><div class="receipt-total"><span>Total simulasi</span><strong>${currency(lastOrder.total)}</strong></div><div class="receipt-detail">* Bukti contoh untuk latihan UTS PWD; bukan nota pembelian resmi.</div>`;
}
function renderHistory() {
  const all = loadLocal(HISTORY_KEY, []);
  const container = $('#historyList');
  if (!Array.isArray(all) || !all.length) {
    container.innerHTML = '<div class="empty-cart">Belum ada transaksi demo pada browser ini.</div>';
    return;
  }
  container.innerHTML = all.map(item => `<div class="history-card"><div><strong>${escapeHTML(item.id)}</strong><strong>${currency(Number(item.total) || 0)}</strong></div><div><small>${new Date(item.date).toLocaleString('id-ID')}</small><small>${item.method === 'cod' ? 'COD' : 'Transfer'}</small></div><div class="history-status">${escapeHTML(item.status)}</div></div>`).join('');
}

// Events
$('#productGrid').addEventListener('click', event => {
  const addButton = event.target.closest('[data-add]');
  if (addButton) addToCart(addButton.dataset.add);
});
for (const btn of document.querySelectorAll('.filter-btn')) {
  btn.addEventListener('click', () => {
    activeFilter = btn.dataset.filter;
    document.querySelectorAll('.filter-btn').forEach(item => {
      const selected = item === btn;
      item.classList.toggle('selected', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    renderProducts();
  });
}
document.querySelectorAll('[data-open-cart]').forEach(btn => btn.addEventListener('click', () => openDialog('cart')));
document.querySelectorAll('[data-close-modal]').forEach(btn => btn.addEventListener('click', closeDialogs));
$('#overlay').addEventListener('click', closeDialogs);
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeDialogs(); });
$('#cartItems').addEventListener('click', event => {
  const qtyButton = event.target.closest('[data-qty]');
  const removeButton = event.target.closest('[data-remove]');
  if (qtyButton) changeQuantity(qtyButton.dataset.id, Number(qtyButton.dataset.qty));
  if (removeButton) setCart(cart.filter(item => item.id !== removeButton.dataset.remove));
});
$('#goCheckout').addEventListener('click', openCheckout);
$('#continueShopping').addEventListener('click', () => { closeDialogs(); $('#produk').scrollIntoView({ behavior: 'smooth' }); });
$('#backToCart').addEventListener('click', () => openDialog('cart'));
$('#shippingArea').addEventListener('change', renderCheckoutSummary);
$('#checkoutForm').addEventListener('submit', submitCheckout);
$('#printReceipt').addEventListener('click', () => window.print());
$('#openHistory').addEventListener('click', () => { renderHistory(); openDialog('history'); });
$('#clearHistory').addEventListener('click', () => {
  if (confirm('Hapus semua riwayat transaksi demo pada browser ini?')) {
    saveLocal(HISTORY_KEY, []);
    renderHistory();
    showToast('Riwayat demo berhasil dihapus.');
  }
});
$('#menuToggle').addEventListener('click', () => {
  const open = $('#mobileNav').classList.toggle('is-open');
  $('#menuToggle').setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('.mobile-nav a').forEach(a => a.addEventListener('click', () => {
  $('#mobileNav').classList.remove('is-open');
  $('#menuToggle').setAttribute('aria-expanded', 'false');
}));
$('#year').textContent = new Date().getFullYear();
renderProducts();
renderCart();
updateHeaderCount();


// ================== TAMBAHAN UTS: INTERAKSI FORM PENGUNJUNG ==================
// Memakai event submit dan DOM untuk memeriksa data Bootstrap Form.
const visitorForm = document.querySelector('#visitorForm');
const visitorResult = document.querySelector('#visitorResult');
visitorForm.addEventListener('submit', function (event) {
  event.preventDefault(); // Tidak reload halaman / mengirim data ke server.
  visitorForm.classList.add('was-validated'); // Aktifkan pesan validasi Bootstrap.
  if (!visitorForm.checkValidity()) {
    document.querySelector('#visitorResult').hidden = true;
    visitorForm.querySelector(':invalid')?.focus();
    return;
  }
  const nama = document.querySelector('#visitorName').value.trim();
  const alamat = document.querySelector('#visitorAddress').value.trim();
  const kota = document.querySelector('#visitorCity').value;
  const hobi = Array.from(visitorForm.querySelectorAll('input[name="hobi"]:checked'))
    .map(checkbox => checkbox.value);
  // textContent mencegah teks input diproses sebagai HTML berbahaya.
  document.querySelector('#visitorSummary').textContent =
    `Halo, ${nama}!\nAlamat: ${alamat}\nKota: ${kota}\nHobi: ${hobi.length ? hobi.join(', ') : 'Belum memilih hobi'}.`;
  visitorResult.hidden = false;
  visitorResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});
visitorForm.addEventListener('reset', function () {
  visitorForm.classList.remove('was-validated');
  visitorResult.hidden = true;
});
