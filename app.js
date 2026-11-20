(() => {
  const CART_KEY = 'griya_madu_store_cart_v1';
  const BUYER_KEY = 'griya_madu_buyer_details_v1';
  const ORDERS_KEY = 'griya_madu_store_orders_v1';
  const REQUESTS_KEY = 'griya_madu_product_requests_v1';
  const CHAT_KEY = 'griya_madu_chat_messages_v1';
  const ACCOUNTS_KEY = 'griya_madu_accounts_v1';
  const SESSION_KEY = 'griya_madu_demo_session_v1';
  const WHATSAPP_NUMBER = '6282139071048';
  const categories = ['Madu botol kecil', 'Madu botol besar', 'Madu jerycan 500ml', 'Madu jerycan 1000ml'];
  const honeyVariants = [
    { label: 'Randu', keys: ['randu'] },
    { label: 'Rambutan', keys: ['rambutan'] },
    { label: 'Multiflora', keys: ['multiflora'] },
    { label: 'Riau / Akasia', keys: ['riau', 'akasia'] },
    { label: 'Kaliandra', keys: ['kaliandra'] },
    { label: 'Lainnya', keys: [] }
  ];
  let cart = [];
  let profileAvatarDraft = '';
  let profileAvatarChanged = false;
  let requestPackageImageDraft = '';
  let cropBaseScale = 1;
  let cropZoom = 1;
  let cropOffsetX = 0;
  let cropOffsetY = 0;
  let cropPointer = null;
  let cropObjectUrl = '';
  try { cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch (error) { cart = []; }
  const data = window.GriyaData;
  const $ = id => document.getElementById(id);

  function inferHoneyVariant(name) {
    const value = String(name || '').toLowerCase();
    return honeyVariants.find(variant => variant.keys.length && variant.keys.some(key => value.includes(key)))?.label || '';
  }

  function visual(product, className = 'productImage') {
    if (product.image) return `<img class="${className}" src="${product.image}" alt="${data.escapeHtml(product.name)}">`;
    return `<div class="${className} placeholder">Griya Madu</div>`;
  }

  function renderFilters() {
    const el = $('filterList');
    if (!el) return;
    const allCategories = [...new Set([...categories, ...data.getProducts().map(item => item.category).filter(Boolean)])];
    const selectedVariants = new Set([...document.querySelectorAll('[name="variantFilter"]:checked')].map(input => input.value));
    const selectedPackages = new Set([...document.querySelectorAll('[name="packageFilter"]:checked')].map(input => input.value));
    const variantList = $('variantFilterList');
    if (variantList) variantList.innerHTML = honeyVariants.map(variant => `<label class="filterCheck"><input type="checkbox" name="variantFilter" value="${data.escapeHtml(variant.label)}" ${selectedVariants.has(variant.label) ? 'checked' : ''}><span>${data.escapeHtml(variant.label)}</span></label>`).join('');
    el.innerHTML = allCategories.map(category => `<label class="filterCheck"><input type="checkbox" name="packageFilter" value="${data.escapeHtml(category)}" ${selectedPackages.has(category) ? 'checked' : ''}><span>${data.escapeHtml(category.replace('Madu jerycan', 'Jerycan'))}</span></label>`).join('');
    document.querySelectorAll('[name="variantFilter"], [name="packageFilter"]').forEach(input => input.addEventListener('change', renderCatalog));
  }

  function renderCatalog() {
    const el = $('productList');
    if (!el) return;
    const search = ($('productSearch')?.value || '').trim().toLowerCase();
    const minValue = $('priceMin')?.value.trim() || '';
    const maxValue = $('priceMax')?.value.trim() || '';
    const minPrice = minValue === '' ? null : Number(minValue);
    const maxPrice = maxValue === '' ? null : Number(maxValue);
    const notice = $('filterNotice');
    if (notice) { notice.textContent = ''; notice.classList.add('hidden'); }
    if ((minPrice !== null && minPrice < 0) || (maxPrice !== null && maxPrice < 0) || (minPrice !== null && maxPrice !== null && minPrice > maxPrice)) {
      if (notice) { notice.textContent = 'Periksa rentang harga: minimum tidak boleh lebih besar dari maksimum.'; notice.classList.remove('hidden'); }
      el.innerHTML = '<div class="empty">Sesuaikan rentang harga untuk melihat produk.</div>';
      if ($('filterResultCount')) $('filterResultCount').textContent = '';
      return;
    }
    const selectedVariants = [...document.querySelectorAll('[name="variantFilter"]:checked')].map(input => input.value);
    const selectedPackages = [...document.querySelectorAll('[name="packageFilter"]:checked')].map(input => input.value);
    const products = data.getProducts().filter(product => {
      const name = String(product.name || '').toLowerCase();
      const packageName = String(product.category || '');
      const variantName = product.variant || inferHoneyVariant(product.name) || 'Lainnya';
      const matchesName = name.includes(search);
      const matchesVariant = !selectedVariants.length || selectedVariants.includes(variantName);
      const matchesPackage = !selectedPackages.length || selectedPackages.includes(packageName);
      const price = Number(product.price) || 0;
      return matchesName && matchesVariant && matchesPackage && (minPrice === null || price >= minPrice) && (maxPrice === null || price <= maxPrice);
    });
    const count = $('filterResultCount');
    if (count) count.textContent = `Menampilkan ${products.length} dari ${data.getProducts().length} produk`;
    if (!products.length) { el.innerHTML = '<div class="empty">Produk tidak ditemukan. Coba ubah atau hapus sebagian filter.</div>'; return; }
    el.innerHTML = products.map(product => `<article class="product">${visual(product)}<div class="productBody"><span class="tag">${data.escapeHtml(product.category || 'Produk Griya Madu')}</span><h3>${data.escapeHtml(product.name)}</h3><div class="price">${data.formatRupiah(product.price)}</div><div class="stock">${product.stock > 0 ? `Stok tersedia: ${product.stock}` : 'Stok sedang habis'}</div><a class="btn light" href="detail.html?id=${encodeURIComponent(product.id)}">Lihat detail</a><button class="btn primary" style="margin-top:7px" onclick="GriyaApp.addToCart('${String(product.id).replace(/'/g, '')}')" ${product.stock < 1 ? 'disabled' : ''}>${product.stock > 0 ? 'Tambah ke keranjang' : 'Stok habis'}</button></div></article>`).join('');
  }

  function saveCart() { localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartCount(); }
  function updateCartCount() { const el = $('cartCount'); if (el) el.textContent = cart.reduce((total, line) => total + line.qty, 0); }

  function addToCart(id) {
    const product = data.getProduct(id);
    if (!product || product.stock < 1) return;
    const line = cart.find(item => String(item.id) === String(id));
    if (line) {
      if (line.qty >= product.stock) return notify('Jumlah sudah mencapai stok yang tersedia.');
      line.qty += 1;
    } else cart.push({ id: product.id, qty: 1 });
    saveCart();
    notify(`${product.name} ditambahkan ke keranjang.`);
  }

  function changeQty(id, amount) {
    const line = cart.find(item => String(item.id) === String(id));
    const product = data.getProduct(id);
    if (!line || !product) return;
    line.qty += amount;
    if (line.qty < 1) cart = cart.filter(item => String(item.id) !== String(id));
    else if (line.qty > product.stock) { line.qty = product.stock; notify('Jumlah disesuaikan dengan stok.'); }
    saveCart();
    renderOrder();
  }

  function removeFromCart(id) { cart = cart.filter(item => String(item.id) !== String(id)); saveCart(); renderOrder(); }

  function renderOrder() {
    const el = $('orderLines');
    if (!el) return;
    let total = 0;
    const lines = cart.map(line => {
      const product = data.getProduct(line.id);
      if (!product) return '';
      const subtotal = Number(product.price) * line.qty;
      total += subtotal;
      return `<div class="card row" style="justify-content:space-between;margin-bottom:10px"><div class="row">${visual(product, 'thumb')}<div><b>${data.escapeHtml(product.name)}</b><div class="muted">${data.formatRupiah(product.price)} × ${line.qty}</div><div class="row"><button class="btn light" onclick="GriyaApp.changeQty('${product.id}',-1)">−</button><span>${line.qty}</span><button class="btn light" onclick="GriyaApp.changeQty('${product.id}',1)">+</button></div></div></div><button class="btn light" onclick="GriyaApp.removeFromCart('${product.id}')">Hapus</button></div>`;
    }).join('');
    el.innerHTML = lines || '<div class="empty">Keranjang masih kosong. <a href="index.html#katalog"><b>Lihat katalog</b></a></div>';
    const totalEl = $('orderTotal'); if (totalEl) totalEl.textContent = data.formatRupiah(total);
    updateCartCount();
  }

  function checkoutWhatsApp(event) {
    event?.preventDefault();
    if (!currentSession() || currentSession().role !== 'user') { location.href = 'login.html?next=orderan.html'; return; }
    if (!cart.length) return notify('Keranjang masih kosong.');
    const name = $('buyerName')?.value.trim() || '';
    const phone = $('buyerPhone')?.value.trim() || '';
    const address = $('buyerAddress')?.value.trim() || '';
    const phoneDigits = phone.replace(/\D/g, '');
    if (name.length < 2) { $('buyerName')?.focus(); return notify('Nama wajib diisi minimal 2 karakter.'); }
    if (phoneDigits.length < 10 || phoneDigits.length > 15) { $('buyerPhone')?.focus(); return notify('Nomor HP wajib diisi dengan 10–15 digit.'); }
    if (!address) { $('buyerAddress')?.focus(); return notify('Alamat pengiriman atau tautan Google Maps wajib diisi.'); }
    let total = 0;
    const orderItems = [];
    let message = `Halo Griya Madu, saya ${name} ingin memesan:\n\n`;
    cart.forEach((line, index) => {
      const product = data.getProduct(line.id);
      if (!product) return;
      const subtotal = product.price * line.qty;
      total += subtotal;
      orderItems.push({ id: product.id, name: product.name, category: product.category || '', variant: product.variant || inferHoneyVariant(product.name), price: Number(product.price), qty: line.qty, subtotal });
      message += `${index + 1}. ${product.name} (${line.qty}x) — ${data.formatRupiah(subtotal)}\n`;
    });
    if (!orderItems.length || orderItems.length !== cart.length) return notify('Ada produk di keranjang yang sudah tidak tersedia. Periksa kembali keranjang Anda.');
    message += `\nTotal: ${data.formatRupiah(total)}\nNo. HP: ${phone}\nAlamat: ${address}\nMohon konfirmasi ketersediaan dan pengiriman.`;
    const orderId = `GM-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const order = { id: orderId, username: currentSession().username, date: new Date().toISOString(), name, phone, address, items: orderItems, total, status: 'Menunggu konfirmasi', stockReserved: true, statusHistory: [{ status: 'Menunggu konfirmasi', date: new Date().toISOString() }] };
    let stockReservation;
    try {
      stockReservation = data.reserveStockForOrder(orderId, orderItems);
      if (!stockReservation.ok) return notify(`Pesanan belum dibuat. ${stockReservation.reason}`);
      const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
      orders.unshift(order);
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    } catch (error) {
      try { if (stockReservation?.ok) data.releaseStockForOrder(orderId, orderItems); } catch (rollbackError) {}
      return notify('Pesanan atau penahanan stok gagal disimpan. Periksa ruang penyimpanan browser lalu coba lagi.');
    }
    try { localStorage.setItem(BUYER_KEY, JSON.stringify({ name, phone, address })); } catch (error) {}
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
    cart = [];
    saveCart();
    renderOrder();
    notify('Pesanan tersimpan dan stok ditahan. Keranjang sudah dikosongkan.');
  }

  function restoreBuyerDetails() {
    try {
      const buyer = JSON.parse(localStorage.getItem(BUYER_KEY) || 'null');
      const session = currentSession();
      const account = session?.role === 'user' ? getAccounts().find(item => item.username === session.username) : null;
      const details = {
        name: account?.name || buyer?.name || '',
        phone: account?.phone || buyer?.phone || '',
        address: account?.address || buyer?.address || ''
      };
      if ($('buyerName')) $('buyerName').value = details.name;
      if ($('buyerPhone')) $('buyerPhone').value = details.phone;
      if ($('buyerAddress')) $('buyerAddress').value = details.address;
    } catch (error) {}
  }

  function saveBuyerDetails() {
    try {
      const details = { name: $('buyerName')?.value || '', phone: $('buyerPhone')?.value || '', address: $('buyerAddress')?.value || '' };
      localStorage.setItem(BUYER_KEY, JSON.stringify(details));
      const session = currentSession();
      if (session?.role === 'user') {
        const accounts = getAccounts();
        const account = accounts.find(item => item.username === session.username);
        if (account) {
          account.name = details.name;
          account.phone = details.phone;
          account.address = details.address;
          localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
          localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, name: details.name }));
          if ($('userName')) $('userName').textContent = details.name || account.username;
        }
      }
    } catch (error) { notify('Data alamat tidak dapat disimpan di browser.'); }
  }

  function renderDetail() {
    const el = $('detailProduct');
    if (!el) return;
    const product = data.getProduct(new URLSearchParams(location.search).get('id'));
    if (!product) { el.innerHTML = '<div class="empty">Produk tidak ditemukan. <a href="index.html#katalog">Kembali ke katalog</a></div>'; return; }
    el.innerHTML = `<div class="about"><div>${visual(product, 'detailImage')}</div><div><span class="tag">${data.escapeHtml(product.category || 'Produk Griya Madu')}</span><h1>${data.escapeHtml(product.name)}</h1><div class="price">${data.formatRupiah(product.price)}</div><p class="muted">Produk pilihan Griya Madu Singosari. Silakan hubungi kami melalui WhatsApp untuk menanyakan detail, ketersediaan, dan pengiriman.</p><p><b>${product.stock > 0 ? `Stok tersedia: ${product.stock}` : 'Stok sedang habis'}</b></p><div class="row"><button class="btn primary" onclick="GriyaApp.addToCart('${String(product.id).replace(/'/g, '')}')" ${product.stock < 1 ? 'disabled' : ''}>Tambah ke keranjang</button><a class="btn light" href="orderan.html">Lihat keranjang</a></div></div></div>`;
  }

  function renderDashboard() {
    if (!$('statProducts')) return;
    const products = data.getProducts();
    const transactions = data.getTransactions();
    const today = new Date().toDateString();
    const todayTransactions = transactions.filter(tx => new Date(tx.date).toDateString() === today);
    $('statProducts').textContent = products.length;
    $('statLow').textContent = products.filter(product => product.stock <= 5).length;
    $('statTransactions').textContent = todayTransactions.length;
    $('statSales').textContent = data.formatRupiah(todayTransactions.reduce((sum, tx) => sum + Number(tx.total || 0), 0));
    const recent = $('recentTransactions');
    if (recent) recent.innerHTML = transactions.length ? [...transactions].sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0,8).map(tx => `<tr><td>${data.escapeHtml(tx.id)}</td><td>${new Date(tx.date).toLocaleString('id-ID')}</td><td>${data.escapeHtml(tx.payment || '-')}</td><td>${data.formatRupiah(tx.total)}</td></tr>`).join('') : '<tr><td colspan="4">Belum ada transaksi pada data MPOS di browser ini.</td></tr>';
  }

  function renderAdminProducts() {
    const table = $('adminProducts');
    if (!table) return;
    table.innerHTML = data.getProducts().map(product => `<tr><td>${visual(product, 'thumb')}<b>${data.escapeHtml(product.name)}</b></td><td>${data.escapeHtml(product.variant || inferHoneyVariant(product.name) || 'Lainnya')}</td><td>${data.escapeHtml(product.category)}</td><td>${data.formatRupiah(product.price)}</td><td>${product.stock}</td><td><button class="btn light" onclick="GriyaApp.editProduct('${String(product.id).replace(/'/g, '')}')">Edit</button> <button class="btn light" onclick="GriyaApp.deleteProduct('${String(product.id).replace(/'/g, '')}')">Hapus</button></td></tr>`).join('');
  }

  function editProduct(id) {
    const product = data.getProduct(id);
    if (!product) return;
    $('productId').value = product.id; $('productName').value = product.name;
    const categorySelect = $('productCategory');
    if (product.category && ![...categorySelect.options].some(option => option.value === product.category)) categorySelect.add(new Option(product.category, product.category));
    categorySelect.value = product.category;
    $('productVariant').value = product.variant || inferHoneyVariant(product.name) || '';
    $('productPrice').value = product.price; $('productStock').value = product.stock; $('productImageFile').value = '';
    $('productFormTitle').textContent = 'Edit Produk'; $('productSubmit').textContent = 'Simpan Perubahan';
    $('productForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function saveProduct(event) {
    event.preventDefault();
    const id = $('productId').value;
    const products = data.getProducts();
    const existing = id ? data.getProduct(id) : null;
    const file = $('productImageFile').files[0];
    let image = existing?.image || '';
    if (file) {
      try { image = await compressImage(file); }
      catch (error) { return notify('Pilih file gambar yang dapat dibuka.'); }
    }
    const product = { id: existing ? existing.id : Date.now(), name: $('productName').value.trim(), variant: $('productVariant').value, category: $('productCategory').value, price: Number($('productPrice').value), stock: Number($('productStock').value), image, emoji: '' };
    if (!product.name || product.price <= 0 || product.stock < 0) return notify('Periksa kembali nama, harga, dan stok produk.');
    const updated = existing ? products.map(item => String(item.id) === String(existing.id) ? product : item) : [...products, product];
    try { data.saveProducts(updated); $('productForm').reset(); $('productId').value = ''; $('productFormTitle').textContent = 'Tambah Produk'; $('productSubmit').textContent = 'Simpan Produk'; renderAdminProducts(); renderDashboard(); }
    catch (error) { alert('Produk gagal disimpan. Foto mungkin terlalu besar atau ruang browser penuh.'); }
  }

  function deleteProduct(id) {
    const product = data.getProduct(id);
    let orders = [];
    try { orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); } catch (error) {}
    const activeOrderUsesProduct = orders.some(order => ['Menunggu konfirmasi', 'Dikonfirmasi', 'Diproses'].includes(order.status) && (order.items || []).some(item => String(item.id) === String(id)));
    if (activeOrderUsesProduct) return notify('Produk tidak dapat dihapus karena masih ada di pesanan yang belum selesai.');
    if (!product || !confirm(`Hapus ${product.name}?`)) return;
    data.saveProducts(data.getProducts().filter(item => String(item.id) !== String(id)));
    renderAdminProducts(); renderDashboard();
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) return reject(new Error('File bukan gambar'));
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const image = new Image(); image.onerror = reject;
        image.onload = () => { const scale = Math.min(1, 1000 / Math.max(image.width, image.height)); const canvas = document.createElement('canvas'); canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale); canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL('image/jpeg', .82)); };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function notify(message) { const el = $('notice'); if (!el) return alert(message); el.textContent = message; el.classList.remove('hidden'); setTimeout(() => el.classList.add('hidden'), 2400); }

  function initPasswordToggles() {
    const eye = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
    const eyeOff = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.2A10.7 10.7 0 0112 5c6.4 0 10 7 10 7a16.7 16.7 0 01-3.2 4.1M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7a10 10 0 004-.8"></path></svg>';
    document.querySelectorAll('input[type="password"]').forEach(input => {
      if (input.parentElement?.classList.contains('passwordField')) return;
      const wrapper = document.createElement('span');
      wrapper.className = 'passwordField';
      input.parentNode.insertBefore(wrapper, input);
      wrapper.appendChild(input);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'passwordToggle';
      button.innerHTML = eye;
      button.setAttribute('aria-label', 'Tampilkan kata sandi');
      button.title = 'Tampilkan kata sandi';
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        button.innerHTML = show ? eyeOff : eye;
        button.setAttribute('aria-label', show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
        button.title = show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi';
        button.setAttribute('aria-pressed', String(show));
      });
      wrapper.appendChild(button);
    });
  }

  function currentSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (error) { return null; } }
  function getAccounts() {
    const defaults = [
      { name: 'Admin Griya Madu', username: 'admin', email: 'admin@griyamadu.local', password: 'admin123', role: 'admin' },
      { name: 'User Demo', username: 'user', email: 'user@griyamadu.local', password: 'user123', role: 'user' }
    ];
    try {
      const saved = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || 'null');
      const accounts = Array.isArray(saved) ? saved : [];
      defaults.forEach(account => { if (!accounts.some(item => item.username === account.username)) accounts.push(account); });
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
      return accounts;
    } catch (error) { return defaults; }
  }
  function loginAs() {
    const identity = $('loginUsername')?.value.trim().toLowerCase();
    const password = $('loginPassword')?.value;
    const account = getAccounts().find(item => (item.username.toLowerCase() === identity || item.email.toLowerCase() === identity) && item.password === password);
    if (!account) { $('loginError')?.classList.remove('hidden'); return; }
    try { localStorage.setItem(SESSION_KEY, JSON.stringify({ role: account.role, username: account.username, name: account.name, signedInAt: new Date().toISOString() })); }
    catch (error) { $('loginError').textContent = 'Sesi tidak dapat disimpan. Periksa penyimpanan browser.'; $('loginError')?.classList.remove('hidden'); return; }
    const next = new URLSearchParams(location.search).get('next');
    const adminNext = ['dashboard.html', 'produk.html', 'profile.html'].includes(next);
    const userNext = ['user.html', 'orderan.html', 'profile.html'].includes(next);
    location.href = account.role === 'admin' ? (adminNext ? next : 'dashboard.html') : (userNext ? next : 'user.html');
  }
  function handleLogin(event) {
    event.preventDefault();
    $('loginError')?.classList.add('hidden');
    loginAs();
  }
  function handleRegister(event) {
    event.preventDefault();
    const name = $('registerName').value.trim();
    const username = $('registerUsername').value.trim().toLowerCase();
    const email = $('registerEmail').value.trim().toLowerCase();
    const password = $('registerPassword').value;
    const confirm = $('registerConfirm').value;
    const error = $('registerError');
    error.textContent = '';
    const accounts = getAccounts();
    if (!/^[a-z0-9_]{3,20}$/.test(username)) { error.textContent = 'Username harus 3–20 karakter: huruf kecil, angka, atau garis bawah.'; error.classList.remove('hidden'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { error.textContent = 'Masukkan alamat email yang valid.'; error.classList.remove('hidden'); return; }
    if (accounts.some(item => item.username.toLowerCase() === username || item.email.toLowerCase() === email)) { error.textContent = 'Username atau email sudah digunakan.'; error.classList.remove('hidden'); return; }
    if (password.length < 6) { error.textContent = 'Kata sandi minimal 6 karakter.'; error.classList.remove('hidden'); return; }
    if (password !== confirm) { error.textContent = 'Kata sandi dan ulangannya tidak sama.'; error.classList.remove('hidden'); return; }
    accounts.push({ name, username, email, password, role: 'user', createdAt: new Date().toISOString() });
    try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts)); location.href = 'login.html?registered=1'; }
    catch (storageError) { error.textContent = 'Akun gagal disimpan. Ruang penyimpanan browser mungkin penuh.'; error.classList.remove('hidden'); }
  }
  function handlePasswordReset(event) {
    event.preventDefault();
    const email = $('resetEmail').value.trim().toLowerCase();
    const password = $('resetPassword').value;
    const confirm = $('resetConfirm').value;
    const error = $('resetError');
    error.textContent = '';
    const accounts = getAccounts();
    const account = accounts.find(item => item.email.toLowerCase() === email);
    if (!account) { error.textContent = 'Email tidak ditemukan pada akun di browser ini.'; error.classList.remove('hidden'); return; }
    if (password.length < 6) { error.textContent = 'Kata sandi minimal 6 karakter.'; error.classList.remove('hidden'); return; }
    if (password !== confirm) { error.textContent = 'Kata sandi baru dan ulangannya tidak sama.'; error.classList.remove('hidden'); return; }
    account.password = password;
    try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts)); $('resetForm').classList.add('hidden'); $('resetSuccess').classList.remove('hidden'); }
    catch (storageError) { error.textContent = 'Kata sandi gagal diperbarui di penyimpanan browser.'; error.classList.remove('hidden'); }
  }
  function orderTypeValues(orders) {
    const values = new Set();
    data.getProducts().forEach(product => {
      if (product.category) values.add(String(product.category));
      const variant = product.variant || inferHoneyVariant(product.name);
      if (variant) values.add(String(variant));
    });
    orders.forEach(order => (order.items || []).forEach(item => {
      const product = data.getProduct(item.id);
      const category = item.category || product?.category;
      const variant = item.variant || product?.variant || inferHoneyVariant(item.name);
      if (category) values.add(String(category));
      if (variant) values.add(String(variant));
    }));
    return [...values].sort((a, b) => a.localeCompare(b, 'id'));
  }
  function filteredOrders(orders, prefix) {
    const type = $(`${prefix}OrderType`);
    const selectedType = type?.value || '';
    if (type) {
      const oldValue = type.value;
      type.innerHTML = '<option value="">Semua jenis</option>' + orderTypeValues(orders).map(value => `<option value="${data.escapeHtml(value)}">${data.escapeHtml(value)}</option>`).join('');
      type.value = oldValue;
    }
    const from = $(`${prefix}OrderFrom`)?.value || '';
    const to = $(`${prefix}OrderTo`)?.value || '';
    const min = Number($(`${prefix}OrderMinPrice`)?.value) || 0;
    const maxRaw = $(`${prefix}OrderMaxPrice`)?.value || '';
    const max = maxRaw === '' ? Infinity : Number(maxRaw);
    const result = orders.filter(order => {
      const date = new Date(order.date);
      const dateValue = Number.isNaN(date.getTime()) ? '' : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      if (from && (!dateValue || dateValue < from)) return false;
      if (to && (!dateValue || dateValue > to)) return false;
      const total = Number(order.total) || 0;
      if (total < min || total > max) return false;
      if (selectedType && !(order.items || []).some(item => {
        const product = data.getProduct(item.id);
        const category = item.category || product?.category || '';
        const variant = item.variant || product?.variant || inferHoneyVariant(item.name);
        return category === selectedType || variant === selectedType;
      })) return false;
      return true;
    });
    const counter = $(`${prefix}OrderFilterCount`);
    if (counter) counter.textContent = `Menampilkan ${result.length} dari ${orders.length} pesanan`;
    return result;
  }
  function resetOrderFilters(prefix) {
    [`${prefix}OrderFrom`, `${prefix}OrderTo`, `${prefix}OrderType`, `${prefix}OrderMinPrice`, `${prefix}OrderMaxPrice`].forEach(id => { if ($(id)) $(id).value = ''; });
    if (prefix === 'user') renderUserMenu(); else renderAdminOrders();
  }
  function renderUserMenu() {
    const session = currentSession();
    if (!session || session.role !== 'user') { location.href = `login.html?next=user.html`; return; }
    const account = getAccounts().find(item => item.username === session.username);
    if (!account) { logout(); return; }
    $('userName') && ($('userName').textContent = account.name || account.username);
    updateAvatarPreview('userAvatar', 'userAvatarPlaceholder', account.avatar || '');
    $('profileName') && ($('profileName').value = account.name || '');
    $('profileEmail') && ($('profileEmail').value = account.email || '');
    $('profilePhone') && ($('profilePhone').value = account.phone || '');
    $('profileAddress') && ($('profileAddress').value = account.address || '');
    if ($('requestPhone') && !$('requestPhone').value) $('requestPhone').value = account.phone || '';
    renderUserProductRequests();
    const list = $('userOrders');
    if (!list) return;
    let orders = [];
    try { orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); } catch (error) {}
    const mine = orders.filter(order => order.username === session.username);
    const visibleOrders = filteredOrders(mine, 'user');
    list.innerHTML = visibleOrders.length ? visibleOrders.map(order => `<article class="card userOrder"><div class="row" style="justify-content:space-between"><b>${data.escapeHtml(order.id)}</b><span class="badge">${data.escapeHtml(order.status || 'Menunggu konfirmasi')}</span></div><div class="muted">${new Date(order.date).toLocaleString('id-ID')}</div>${order.trackingNumber ? `<p class="muted">No. resi: <b>${data.escapeHtml(order.trackingNumber)}</b></p>` : ''}<div class="muted">${(order.statusHistory || []).map(step => `${data.escapeHtml(step.status)} · ${new Date(step.date).toLocaleString('id-ID')}`).join('<br>')}</div><ul>${(order.items || []).map(item => `<li>${data.escapeHtml(item.name)} × ${Number(item.qty) || 0}</li>`).join('')}</ul><div class="row" style="justify-content:space-between"><b>${data.formatRupiah(order.total)}</b>${order.status === 'Menunggu konfirmasi' ? `<button class="btn light" type="button" onclick="GriyaApp.cancelUserOrder('${String(order.id).replace(/'/g, '')}')">Batalkan pesanan</button>` : ''}</div></article>`).join('') : mine.length ? '<div class="empty">Tidak ada pesanan yang cocok dengan filter.</div>' : '<div class="empty">Belum ada pesanan. <a href="index.html#katalog"><b>Mulai belanja</b></a></div>';
  }
  function readProductRequests() {
    try { const value = JSON.parse(localStorage.getItem(REQUESTS_KEY) || '[]'); return Array.isArray(value) ? value : []; }
    catch (error) { return []; }
  }
  function submitProductRequest(event) {
    event.preventDefault();
    const session = currentSession();
    if (session?.role !== 'user') return notify('Login sebagai User untuk mengirim permintaan.');
    const requestType = $('requestType').value;
    let variant = $('requestVariant').value;
    let packageType = $('requestPackage').value;
    const customVariant = $('requestVariantOther').value.trim();
    const customPackage = $('requestPackageOther').value.trim();
    const quantity = Number($('requestQuantity').value);
    const phone = $('requestPhone').value.trim();
    const phoneDigits = phone.replace(/\D/g, '');
    const eventName = $('requestEvent').value.trim();
    const eventDate = $('requestDate').value;
    const message = $('requestMessage').value.trim();
    if (!requestType) return notify('Pilih keperluan permintaan produk terlebih dahulu.');
    if (!variant && customVariant) variant = 'Varian lain';
    if (!packageType && customPackage) packageType = 'Kemasan lain';
    if (!variant && !packageType && !customVariant && !customPackage) return notify('Pilih atau tuliskan varian madu maupun ukuran kemasan yang diminta.');
    if (variant === 'Varian lain' && !customVariant) return notify('Tuliskan varian madu yang kamu cari.');
    if (packageType === 'Kemasan lain' && !customPackage) return notify('Tuliskan ukuran atau bentuk kemasan yang kamu inginkan.');
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) return notify('Jumlah permintaan harus 1–100.000.');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) return notify('Masukkan nomor HP yang dapat dihubungi (10–15 digit).');
    const account = getAccounts().find(item => item.username === session.username);
    const timestamp = new Date().toISOString();
    const request = { id: `MR-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`, username: session.username, name: account?.name || session.name || session.username, phone, requestType, variant, customVariant, packageType, customPackage, packageImage: requestPackageImageDraft, quantity, eventName, eventDate, message, status: 'Menunggu respon', reply: '', createdAt: timestamp, updatedAt: timestamp, statusHistory: [{ status: 'Menunggu respon', date: timestamp }] };
    try {
      const requests = readProductRequests();
      requests.unshift(request);
      localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
      $('productRequestForm').reset();
      requestPackageImageDraft = '';
      $('requestQuantity').value = '1';
      $('requestPhone').value = phone;
      toggleRequestForm(false);
      renderUserProductRequests();
      notify('Permintaan produk atau bingkisan terkirim. Admin dapat membalas dari menu Cart.');
    } catch (error) { notify('Permintaan gagal disimpan. Periksa ruang penyimpanan browser.'); }
  }
  function readChatMessages() {
    try { const value = JSON.parse(localStorage.getItem(CHAT_KEY) || '[]'); return Array.isArray(value) ? value : []; }
    catch (error) { return []; }
  }
  function saveChatMessage(message) {
    const messages = readChatMessages();
    messages.push(message);
    localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
  }
  function sendUserChat(event) {
    event.preventDefault();
    const session = currentSession();
    if (session?.role !== 'user') return notify('Login sebagai User untuk mengirim chat.');
    const input = $('userChatInput');
    const text = input?.value.trim() || '';
    if (!text) return notify('Tulis pesan terlebih dahulu.');
    if (text.length > 2000) return notify('Pesan maksimal 2.000 karakter.');
    const account = getAccounts().find(item => item.username === session.username);
    try {
      saveChatMessage({ id: `MC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, username: session.username, name: account?.name || session.name || session.username, role: 'user', text, createdAt: new Date().toISOString() });
      input.value = '';
      renderUserProductRequests();
    } catch (error) { notify('Pesan gagal dikirim. Periksa ruang penyimpanan browser.'); }
  }
  function renderUserProductRequests() {
    const list = $('userProductRequests');
    if (!list) return;
    const session = currentSession();
    if (session?.role !== 'user') { list.innerHTML = ''; return; }
    const requests = readProductRequests().filter(request => request.username === session.username);
    const messages = readChatMessages().filter(message => message.username === session.username);
    const badge = $('chatUnreadBadge');
    const updates = requests.filter(request => request.reply || request.status !== 'Menunggu respon').length;
    if (badge) { badge.textContent = updates > 9 ? '9+' : String(updates); badge.classList.toggle('hidden', updates === 0); }
    const timeline = [
      ...messages.map(message => ({ kind: 'message', date: message.createdAt, message })),
      ...requests.map(request => ({ kind: 'request', date: request.createdAt, request }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date));
    list.innerHTML = timeline.length ? timeline.map(item => {
      if (item.kind === 'message') {
        const mine = item.message.role === 'user';
        return `<div class="chatBubble ${mine ? 'customerBubble' : 'adminBubble'}"><b>${mine ? 'Anda' : 'Griya Madu'}</b><p>${data.escapeHtml(item.message.text)}</p><small>${new Date(item.date).toLocaleString('id-ID')}</small></div>`;
      }
      const request = item.request;
      return `<div class="chatThread"><div class="chatDate">${new Date(request.createdAt).toLocaleString('id-ID')} · ${data.escapeHtml(request.status)}</div><div class="chatBubble customerBubble"><b>${data.escapeHtml(request.requestType || 'Permintaan produk')}</b><p>${request.variant ? `Madu ${data.escapeHtml(request.variant)}${request.customVariant ? ` (${data.escapeHtml(request.customVariant)})` : ''}` : ''}${request.packageType ? `${request.variant ? ' · ' : ''}${data.escapeHtml(request.packageType)}${request.customPackage ? ` (${data.escapeHtml(request.customPackage)})` : ''}` : ''}<br>Jumlah: ${Number(request.quantity) || 0}${request.eventName ? `<br>Acara: ${data.escapeHtml(request.eventName)}${request.eventDate ? ` · ${data.escapeHtml(request.eventDate)}` : ''}` : ''}${request.message ? `<br>${data.escapeHtml(request.message)}` : ''}</p>${String(request.packageImage || '').startsWith('data:image/jpeg') ? `<img class="requestPackagePhoto" src="${data.escapeHtml(request.packageImage)}" alt="Contoh kemasan dari User">` : ''}</div>${request.reply ? `<div class="chatBubble adminBubble"><b>Griya Madu</b><p>${data.escapeHtml(request.reply)}</p></div>` : `<div class="chatPending">Admin akan membalas permintaan khusus ini.</div>`}${request.status === 'Menunggu respon' ? `<button class="chatCancel" type="button" onclick="GriyaApp.cancelProductRequest('${String(request.id).replace(/'/g, '')}')">Batalkan permintaan ini</button>` : ''}</div>`;
    }).join('') : '<div class="chatEmpty">Belum ada percakapan. Kirim chat atau ajukan pesanan khusus kepada Griya Madu.</div>';
    list.scrollTop = list.scrollHeight;
    const conversation = document.querySelector('.chatConversation');
    if (conversation) { const preview = conversation.querySelector('.chatPreview'); if (preview) preview.textContent = timeline.length ? (timeline[timeline.length - 1].message?.text || timeline[timeline.length - 1].request?.message || 'Permintaan khusus') : 'Tanyakan produk atau pesanan khusus'; }
  }  function toggleProductChat(open) {
    const chat = $('productChat');
    if (!chat) return;
    const shouldOpen = typeof open === 'boolean' ? open : chat.classList.contains('hidden');
    chat.classList.toggle('hidden', !shouldOpen);
    try { sessionStorage.setItem('griya_madu_chat_open_v1', shouldOpen ? '1' : '0'); } catch (error) {}
    if (shouldOpen) { renderUserProductRequests(); }
  }
  function toggleRequestForm(open) {
    const form = $('productRequestForm');
    if (!form) return;
    const shouldOpen = typeof open === 'boolean' ? open : form.classList.contains('hidden');
    form.classList.toggle('hidden', !shouldOpen);
    $('userProductRequests')?.classList.toggle('chatMessagesCompact', shouldOpen);
    if (shouldOpen) setTimeout(() => $('requestType')?.focus(), 30);
  }
  function ensureProductChatWidget() {
    if (currentSession()?.role !== 'user') return;
    const page = location.pathname.split('/').pop() || 'index.html';
    if (!['index.html', 'detail.html', 'orderan.html', 'profile.html', 'user.html'].includes(page)) return;
    if (!$('productChat')) {
      document.body.insertAdjacentHTML('beforeend', `<section class="chatWindow hidden" id="productChat" aria-label="Chat Griya Madu"><aside class="chatSidebar"><h2>Chat</h2><button class="chatConversation active" type="button" onclick="GriyaApp.toggleRequestForm(false)"><span class="chatAvatar">GM</span><span><b>Griya Madu</b><small>Pesanan khusus</small><small class="chatPreview">Tanyakan produk atau pesanan khusus</small></span><small>Chat</small></button></aside><div class="chatConversationPanel"><div class="chatHeader"><span class="chatAvatar">GM</span><span><b>Griya Madu</b><small>Permintaan produk & bingkisan</small></span><button type="button" class="chatClose" aria-label="Tutup chat" onclick="GriyaApp.toggleProductChat(false)">×</button></div><div class="chatIntro">Sampaikan kebutuhan khususmu. Kami akan membalas di percakapan ini.</div><div class="localDataWarning hidden" id="fileChatWarning">Aplikasi dibuka sebagai file lokal. Jalankan <b>start-local.bat</b>, lalu gunakan halaman di <b>http://127.0.0.1:8765</b> agar chat User dan Admin berbagi penyimpanan. Chat dari halaman file perlu dikirim ulang setelah berpindah.</div><div id="userProductRequests" class="chatMessages"></div><button class="chatSpecialOrderButton" type="button" onclick="GriyaApp.toggleRequestForm()">＋ Ajukan pesanan khusus</button><form class="chatComposer" id="userChatForm"><textarea id="userChatInput" rows="1" maxlength="2000" placeholder="Tulis pesan..." required></textarea><button type="submit" aria-label="Kirim pesan">➤</button></form><form class="form chatRequestForm hidden" id="productRequestForm"><label>Jenis permintaan<select id="requestType" required><option value="">Pilih keperluan</option><option>Varian madu yang belum tersedia</option><option>Ukuran atau bentuk kemasan khusus</option><option>Pesanan banyak / bingkisan acara</option><option>Permintaan produk lainnya</option></select></label><div class="grid" style="grid-template-columns:repeat(2,minmax(0,1fr))"><label>Jenis madu<select id="requestVariant"><option value="">Pilih jenis madu</option><option>Randu</option><option>Rambutan</option><option>Multiflora</option><option>Riau / Akasia</option><option>Kaliandra</option><option>Varian lain</option></select></label><label>Jenis kemasan<select id="requestPackage"><option value="">Pilih kemasan</option><option>Madu botol kecil</option><option>Madu botol besar</option><option>Madu jerycan 500ml</option><option>Madu jerycan 1000ml</option><option>Kemasan lain</option></select></label></div><div class="grid" style="grid-template-columns:repeat(2,minmax(0,1fr))"><label>Varian lain<input id="requestVariantOther" type="text" placeholder="Contoh: madu kelengkeng"></label><label>Ukuran kemasan lain<input id="requestPackageOther" type="text" placeholder="Contoh: botol 350 ml"></label></div><label>Foto contoh kemasan (opsional)<input id="requestPackageImage" type="file" accept="image/*"><small class="muted">Maksimal 8 MB; foto akan diperkecil otomatis.</small></label><label>Jumlah<input id="requestQuantity" type="number" min="1" max="100000" value="1" required></label><label>Nomor HP<input id="requestPhone" type="tel" inputmode="tel" placeholder="08xxxxxxxxxx" required></label><div class="grid" style="grid-template-columns:repeat(2,minmax(0,1fr))"><label>Nama acara (opsional)<input id="requestEvent" type="text" placeholder="Pernikahan, seminar, dll."></label><label>Tanggal dibutuhkan<input id="requestDate" type="date"></label></div><label>Pesan<textarea id="requestMessage" rows="2" placeholder="Ceritakan kebutuhanmu, misalnya 100 botol kecil untuk souvenir"></textarea></label><button class="btn primary" type="submit">Kirim pesan</button></form></div></section><button class="chatLauncher" id="productChatLauncher" type="button" onclick="GriyaApp.toggleProductChat()"><span class="chatIcon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 5.5h16v12H9l-5 3v-15Z"/><path d="M8 10h8M8 13.5h5"/></svg></span><span>Chat</span><span id="chatUnreadBadge" class="chatUnread hidden"></span></button>`);
    }
    const account = getAccounts().find(item => item.username === currentSession()?.username);
    if ($('requestPhone') && !$('requestPhone').value) $('requestPhone').value = account?.phone || '';
    try { if (sessionStorage.getItem('griya_madu_chat_open_v1') === '1') toggleProductChat(true); } catch (error) {}
  }
  function cancelProductRequest(id) {
    const session = currentSession();
    if (session?.role !== 'user') return notify('Login sebagai User untuk membatalkan permintaan.');
    const requests = readProductRequests();
    const request = requests.find(item => String(item.id) === String(id) && item.username === session.username);
    if (!request || request.status !== 'Menunggu respon') return notify('Permintaan ini sudah diproses dan tidak dapat dibatalkan.');
    if (!confirm('Batalkan permintaan produk ini?')) return;
    const timestamp = new Date().toISOString();
    request.status = 'Dibatalkan oleh User'; request.updatedAt = timestamp;
    request.statusHistory = [...(request.statusHistory || []), { status: request.status, date: timestamp }];
    try { localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests)); renderUserProductRequests(); notify('Permintaan berhasil dibatalkan.'); }
    catch (error) { notify('Pembatalan permintaan gagal disimpan.'); }
  }
  function renderAdminRequests() {
    const list = $('adminProductRequests');
    if (!list) return;
    if (currentSession()?.role !== 'admin') { list.innerHTML = ''; return; }
    const requests = readProductRequests();
    list.innerHTML = requests.length ? requests.map(request => `<article class="card userOrder"><div class="row" style="justify-content:space-between"><b>${data.escapeHtml(request.id)}</b><span class="badge">${data.escapeHtml(request.status)}</span></div><div class="muted">${new Date(request.createdAt).toLocaleString('id-ID')} · ${data.escapeHtml(request.name || request.username)} · ${data.escapeHtml(request.phone || '-')}</div><p><b>Keperluan:</b> ${data.escapeHtml(request.requestType || 'Permintaan produk')}</p><ul>${request.variant ? `<li>Jenis madu: ${data.escapeHtml(request.variant)}${request.customVariant ? ` — ${data.escapeHtml(request.customVariant)}` : ''}</li>` : ''}${request.packageType ? `<li>Kemasan: ${data.escapeHtml(request.packageType)}${request.customPackage ? ` — ${data.escapeHtml(request.customPackage)}` : ''}</li>` : ''}<li>Jumlah: ${Number(request.quantity) || 0}</li></ul>${request.eventName ? `<p class="muted">Acara: ${data.escapeHtml(request.eventName)}${request.eventDate ? ` · Dibutuhkan ${data.escapeHtml(request.eventDate)}` : ''}</p>` : ''}${request.message ? `<p class="muted">Catatan User: ${data.escapeHtml(request.message)}</p>` : ''}${String(request.packageImage || '').startsWith('data:image/jpeg') ? `<img class="requestAdminPhoto" src="${data.escapeHtml(request.packageImage)}" alt="Contoh kemasan dari User">` : ''}${request.reply ? `<div class="requestReply"><b>Balasan terakhir</b><p>${data.escapeHtml(request.reply)}</p></div>` : ''}<div class="muted">${(request.statusHistory || []).map(step => `${data.escapeHtml(step.status)} · ${new Date(step.date).toLocaleString('id-ID')}`).join('<br>')}</div><div class="form"><label>Status permintaan<select id="requestStatus-${data.escapeHtml(request.id)}"><option ${request.status === 'Menunggu respon' ? 'selected' : ''}>Menunggu respon</option><option ${request.status === 'Sedang diupayakan' ? 'selected' : ''}>Sedang diupayakan</option><option ${request.status === 'Tersedia' ? 'selected' : ''}>Tersedia</option><option ${request.status === 'Tidak dapat disediakan' ? 'selected' : ''}>Tidak dapat disediakan</option></select></label><label>Balasan untuk User<textarea id="requestReply-${data.escapeHtml(request.id)}" rows="2" placeholder="Tulis informasi stok, pilihan ukuran, estimasi waktu, atau jawaban untuk User">${data.escapeHtml(request.reply || '')}</textarea></label><button class="btn primary" type="button" onclick="GriyaApp.replyProductRequest('${String(request.id).replace(/'/g, '')}')">Kirim Balasan</button></div></article>`).join('') : '<div class="empty">Belum ada permintaan produk atau bingkisan dari User.</div>';
  }
  function renderAdminChats() {
    const list = $('adminChatMessages');
    if (!list) return;
    if (currentSession()?.role !== 'admin') { list.innerHTML = ''; return; }
    const chats = readChatMessages();
    const requests = readProductRequests();
    const usernames = [...new Set([...chats.map(message => message.username), ...requests.map(request => request.username)])];
    list.innerHTML = usernames.length ? usernames.map((username, index) => {
      const messages = chats.filter(message => message.username === username);
      const userRequests = requests.filter(request => request.username === username);
      const name = messages[0]?.name || userRequests[0]?.name || username;
      const timeline = [...messages.map(message => ({ kind: 'message', date: message.createdAt, message })), ...userRequests.map(request => ({ kind: 'request', date: request.createdAt, request }))].sort((a, b) => new Date(a.date) - new Date(b.date));
      return `<article class="card adminChatCard"><div class="row" style="justify-content:space-between"><b>${data.escapeHtml(name)}</b><span class="muted">${data.escapeHtml(username)}</span></div><div class="adminChatThread">${timeline.map(item => item.kind === 'message' ? `<div class="chatBubble ${item.message.role === 'admin' ? 'adminBubble' : 'customerBubble'}"><b>${item.message.role === 'admin' ? 'Admin' : 'User'}</b><p>${data.escapeHtml(item.message.text)}</p><small>${new Date(item.date).toLocaleString('id-ID')}</small></div>` : `<div class="chatBubble customerBubble"><b>Pesanan khusus · ${data.escapeHtml(item.request.status)}</b><p>${data.escapeHtml(item.request.requestType || 'Permintaan produk')}${item.request.variant ? `<br>Madu: ${data.escapeHtml(item.request.variant)}${item.request.customVariant ? ` — ${data.escapeHtml(item.request.customVariant)}` : ''}` : ''}${item.request.packageType ? `<br>Kemasan: ${data.escapeHtml(item.request.packageType)}${item.request.customPackage ? ` — ${data.escapeHtml(item.request.customPackage)}` : ''}` : ''}<br>Jumlah: ${Number(item.request.quantity) || 0}${item.request.message ? `<br>${data.escapeHtml(item.request.message)}` : ''}</p>${String(item.request.packageImage || '').startsWith('data:image/jpeg') ? `<img class="requestAdminPhoto" src="${data.escapeHtml(item.request.packageImage)}" alt="Contoh kemasan User">` : ''}</div>`).join('')}</div><form class="adminChatComposer" onsubmit="event.preventDefault();GriyaApp.sendAdminChat('${encodeURIComponent(username)}',${index})"><textarea id="adminChatReply-${index}" rows="2" maxlength="2000" placeholder="Balas pesan ${data.escapeHtml(name)}..." required></textarea><button class="btn primary" type="submit">Kirim balasan</button></form></article>`;
    }).join('') : '<div class="empty">Belum ada chat dari pelanggan.</div>';
  }
  function sendAdminChat(encodedUsername, index) {
    if (currentSession()?.role !== 'admin') return notify('Hanya Admin yang dapat membalas chat.');
    const username = decodeURIComponent(encodedUsername);
    const input = $(`adminChatReply-${index}`);
    const text = input?.value.trim() || '';
    if (!text) return notify('Tulis balasan terlebih dahulu.');
    if (text.length > 2000) return notify('Pesan maksimal 2.000 karakter.');
    try {
      saveChatMessage({ id: `MC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, username, name: getAccounts().find(item => item.username === username)?.name || username, role: 'admin', text, createdAt: new Date().toISOString() });
      renderAdminChats();
      notify('Balasan chat terkirim kepada User.');
    } catch (error) { notify('Balasan gagal dikirim. Periksa ruang penyimpanan browser.'); }
  }
  function replyProductRequest(id) {
    if (currentSession()?.role !== 'admin') return notify('Hanya Admin yang dapat membalas request produk.');
    const requests = readProductRequests();
    const request = requests.find(item => String(item.id) === String(id));
    if (!request) return notify('Request produk tidak ditemukan.');
    if (request.status === 'Dibatalkan oleh User') return notify('Permintaan ini sudah dibatalkan oleh User.');
    const status = $(`requestStatus-${id}`)?.value;
    const reply = $(`requestReply-${id}`)?.value.trim() || '';
    const allowedStatuses = ['Menunggu respon', 'Sedang diupayakan', 'Tersedia', 'Tidak dapat disediakan'];
    if (!allowedStatuses.includes(status)) return notify('Pilih status permintaan yang tersedia.');
    if (reply.length < 3) { $(`requestReply-${id}`)?.focus(); return notify('Tuliskan balasan minimal 3 karakter untuk User.'); }
    const timestamp = new Date().toISOString();
    request.status = status; request.reply = reply; request.updatedAt = timestamp;
    request.statusHistory = [...(request.statusHistory || []), { status, date: timestamp }];
    try { localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests)); renderAdminRequests(); notify('Balasan berhasil dikirim kepada User.'); }
    catch (error) { notify('Balasan gagal disimpan. Periksa ruang penyimpanan browser.'); }
  }
  function renderAccountProfile() {
    const session = currentSession();
    if (!session || !['admin', 'user'].includes(session.role)) { location.href = 'login.html?next=profile.html'; return; }
    const account = getAccounts().find(item => item.username === session.username);
    if (!account) { logout(); return; }
    $('profileRole').textContent = session.role === 'admin' ? 'Admin' : 'User';
    $('profileUsername').textContent = account.username;
    $('profileAreaLabel').textContent = session.role === 'admin' ? 'AREA PENGELOLA' : 'AREA PELANGGAN';
    $('profileName').value = account.name || '';
    $('profileEmail').value = account.email || '';
    $('profilePhone').value = account.phone || '';
    $('profileAddress').value = account.address || '';
    profileAvatarDraft = account.avatar || '';
    profileAvatarChanged = false;
    updateAvatarPreview('profileAvatarPreview', 'profileAvatarPlaceholder', profileAvatarDraft);
    const links = $('profileNavLinks');
    if (links) links.innerHTML = session.role === 'admin'
      ? '<a href="dashboard.html">Dashboard</a><a href="produk.html">Produk</a><a href="index.html">Toko online</a><a href="profile.html#adminOrders">Cart</a><a href="profile.html">Profil Admin</a>'
      : '<a href="user.html">Akun Saya</a><a href="index.html#katalog">Belanja</a><a href="orderan.html">Keranjang</a>';
    const orderTab = $('profileTabOrders');
    if (orderTab) orderTab.classList.toggle('hidden', session.role !== 'admin');
    if (session.role === 'admin') { renderAdminOrders(); renderAdminRequests(); renderAdminChats(); }
    showProfileTab(session.role === 'admin' && location.hash === '#adminOrders' ? 'orders' : 'profile', false);
  }
  function showProfileTab(tab, updateHash = true) {
    const session = currentSession();
    const showOrders = tab === 'orders' && session?.role === 'admin';
    $('profilePanel')?.classList.toggle('hidden', showOrders);
    $('adminOrderSection')?.classList.toggle('hidden', !showOrders);
    $('profileTabProfile')?.classList.toggle('active', !showOrders);
    $('profileTabOrders')?.classList.toggle('active', showOrders);
    $('profileTabProfile')?.setAttribute('aria-selected', String(!showOrders));
    $('profileTabOrders')?.setAttribute('aria-selected', String(showOrders));
    if (updateHash && $('profilePage')) location.hash = showOrders ? 'adminOrders' : 'profile';
    if (showOrders) renderAdminOrders();
  }
  function updateAvatarPreview(imageId, placeholderId, source) {
    const image = $(imageId);
    const placeholder = $(placeholderId);
    if (!image || !placeholder) return;
    if (source) { image.src = source; image.classList.remove('hidden'); placeholder.classList.add('hidden'); }
    else { image.removeAttribute('src'); image.classList.add('hidden'); placeholder.classList.remove('hidden'); }
  }
  function updateCropTransform() {
    const frame = $('cropViewport');
    const image = $('cropSource');
    if (!frame || !image?.naturalWidth) return;
    const frameSize = frame.clientWidth;
    const width = image.naturalWidth * cropBaseScale * cropZoom;
    const height = image.naturalHeight * cropBaseScale * cropZoom;
    cropOffsetX = Math.max(-(width - frameSize) / 2, Math.min((width - frameSize) / 2, cropOffsetX));
    cropOffsetY = Math.max(-(height - frameSize) / 2, Math.min((height - frameSize) / 2, cropOffsetY));
    image.style.width = `${width}px`;
    image.style.height = `${height}px`;
    image.style.left = `${(frameSize - width) / 2 + cropOffsetX}px`;
    image.style.top = `${(frameSize - height) / 2 + cropOffsetY}px`;
  }
  function closeCropEditor() {
    $('cropEditor')?.classList.add('hidden');
    const image = $('cropSource');
    if (image) { image.onload = null; image.onerror = null; image.removeAttribute('src'); }
    if (cropObjectUrl) { URL.revokeObjectURL(cropObjectUrl); cropObjectUrl = ''; }
  }
  function openProfileCrop(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { notify('Pilih file gambar yang valid.'); event.target.value = ''; return; }
    closeCropEditor();
    const frame = $('cropViewport');
    const image = $('cropSource');
    const editor = $('cropEditor');
    cropObjectUrl = URL.createObjectURL(file);
    editor.classList.remove('hidden');
    image.onload = () => {
      const frameSize = frame.clientWidth;
      cropBaseScale = Math.max(frameSize / image.naturalWidth, frameSize / image.naturalHeight);
      cropZoom = 1;
      cropOffsetX = 0;
      cropOffsetY = 0;
      $('cropZoom').value = '1';
      updateCropTransform();
    };
    image.onerror = () => { closeCropEditor(); notify('Foto tidak dapat dibuka. Pilih gambar lain.'); };
    image.src = cropObjectUrl;
  }
  function initProfileCropper() {
    const frame = $('cropViewport');
    if (!frame) return;
    $('profileAvatarFile')?.addEventListener('change', openProfileCrop);
    $('cropZoom')?.addEventListener('input', event => { cropZoom = Number(event.target.value) || 1; updateCropTransform(); });
    frame.addEventListener('pointerdown', event => {
      if (!$('cropSource')?.naturalWidth) return;
      cropPointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
      frame.setPointerCapture(event.pointerId);
      frame.classList.add('dragging');
      event.preventDefault();
    });
    frame.addEventListener('pointermove', event => {
      if (!cropPointer || cropPointer.id !== event.pointerId) return;
      cropOffsetX += event.clientX - cropPointer.x;
      cropOffsetY += event.clientY - cropPointer.y;
      cropPointer.x = event.clientX;
      cropPointer.y = event.clientY;
      updateCropTransform();
    });
    const stopDrag = event => { if (cropPointer?.id === event.pointerId) cropPointer = null; frame.classList.remove('dragging'); };
    frame.addEventListener('pointerup', stopDrag);
    frame.addEventListener('pointercancel', stopDrag);
    $('cropCancel')?.addEventListener('click', () => { closeCropEditor(); $('profileAvatarFile').value = ''; });
    $('cropApply')?.addEventListener('click', () => {
      const image = $('cropSource');
      if (!image?.naturalWidth) return;
      const frameSize = frame.clientWidth;
      const width = image.naturalWidth * cropBaseScale * cropZoom;
      const height = image.naturalHeight * cropBaseScale * cropZoom;
      const left = (frameSize - width) / 2 + cropOffsetX;
      const top = (frameSize - height) / 2 + cropOffsetY;
      const sourceX = -left * image.naturalWidth / width;
      const sourceY = -top * image.naturalHeight / height;
      const sourceSizeX = frameSize * image.naturalWidth / width;
      const sourceSizeY = frameSize * image.naturalHeight / height;
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      try {
        canvas.getContext('2d').drawImage(image, sourceX, sourceY, sourceSizeX, sourceSizeY, 0, 0, 512, 512);
        profileAvatarDraft = canvas.toDataURL('image/jpeg', .84);
        profileAvatarChanged = true;
        updateAvatarPreview('profileAvatarPreview', 'profileAvatarPlaceholder', profileAvatarDraft);
        closeCropEditor();
        if ($('profileAvatarFile')) $('profileAvatarFile').value = '';
      } catch (error) { notify('Foto gagal dipotong. Pilih gambar lain.'); }
    });
  }
  function clearProfileAvatar() {
    closeCropEditor();
    profileAvatarDraft = '';
    profileAvatarChanged = true;
    const input = $('profileAvatarFile');
    if (input) input.value = '';
    updateAvatarPreview('profileAvatarPreview', 'profileAvatarPlaceholder', '');
  }
  function saveUserProfile(event) {
    event.preventDefault();
    const session = currentSession();
    const accounts = getAccounts();
    const account = accounts.find(item => item.username === session?.username);
    if (!account) return logout();
    const email = $('profileEmail').value.trim().toLowerCase();
    if (accounts.some(item => item !== account && item.email.toLowerCase() === email)) return notify('Email sudah digunakan akun lain.');
    account.name = $('profileName').value.trim();
    account.email = email;
    account.phone = $('profilePhone').value.trim();
    account.address = $('profileAddress').value.trim();
    if (profileAvatarChanged) account.avatar = profileAvatarDraft;
    try {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
      localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, name: account.name }));
      localStorage.setItem(BUYER_KEY, JSON.stringify({ name: account.name, phone: account.phone || '', address: account.address || '' }));
      notify('Profil berhasil disimpan.');
      if ($('profilePage')) renderAccountProfile();
      if ($('userMenu') && !$('profilePage')) renderUserMenu();
    } catch (error) { notify('Profil gagal disimpan di browser.'); }
  }
  function cancelUserOrder(id) {
    const session = currentSession();
    if (session?.role !== 'user') return notify('Login sebagai User untuk membatalkan pesanan.');
    let orders = [];
    try { orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); } catch (error) {}
    const order = orders.find(item => String(item.id) === String(id) && item.username === session?.username);
    if (!order || order.status !== 'Menunggu konfirmasi') return notify('Pesanan ini tidak dapat dibatalkan.');
    if (!confirm(`Batalkan pesanan ${order.id}?`)) return;
    order.status = 'Dibatalkan oleh pelanggan';
    order.cancelledAt = new Date().toISOString();
    try {
      if (order.stockReserved || data.hasStockReservation(order.id)) {
        const released = data.releaseStockForOrder(order.id, order.items);
        if (!released.ok) return notify(`Pesanan tidak dibatalkan. ${released.reason}`);
      }
      order.stockReserved = false;
      order.statusHistory = [...(order.statusHistory || []), { status: order.status, date: order.cancelledAt }];
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      renderUserMenu(); notify('Pesanan dibatalkan dan stok yang ditahan dikembalikan.');
    } catch (error) { notify('Status pembatalan atau pengembalian stok gagal disimpan.'); }
  }
  function renderAdminOrders() {
    const list = $('adminOrders');
    if (!list) return;
    const session = currentSession();
    if (session?.role !== 'admin') { list.innerHTML = ''; return; }
    let orders = [];
    try { orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); } catch (error) {}
    const sortedOrders = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date));
    const visibleOrders = filteredOrders(sortedOrders, 'admin');
    list.innerHTML = visibleOrders.length ? visibleOrders.map(order => {
      const status = order.status || 'Menunggu konfirmasi';
      const nextStatus = { 'Menunggu konfirmasi': 'Dikonfirmasi', 'Dikonfirmasi': 'Diproses', 'Diproses': 'Dikirim', 'Dikirim': 'Selesai' }[status];
      const nextLabel = { 'Menunggu konfirmasi': 'Konfirmasi Pesanan', 'Dikonfirmasi': 'Tandai Diproses', 'Diproses': 'Tandai Dikirim', 'Dikirim': 'Tandai Selesai' }[status];
      const orderId = String(order.id).replace(/'/g, '');
      const cancelButton = ['Menunggu konfirmasi', 'Dikonfirmasi', 'Diproses'].includes(status) ? `<button class="btn light" type="button" onclick="GriyaApp.updateOrderStatus('${orderId}','Dibatalkan oleh Admin')">Batalkan pesanan</button>` : '';
      return `<article class="card userOrder"><div class="row" style="justify-content:space-between"><b>${data.escapeHtml(order.id)}</b><span class="badge">${data.escapeHtml(status)}</span></div><div class="muted">${new Date(order.date).toLocaleString('id-ID')} · ${data.escapeHtml(order.name || 'Pelanggan')} · ${data.escapeHtml(order.phone || '-')}</div><div class="muted">Alamat: ${data.escapeHtml(order.address || '-')}</div>${order.trackingNumber ? `<p class="muted">No. resi: <b>${data.escapeHtml(order.trackingNumber)}</b></p>` : ''}<ul>${(order.items || []).map(item => `<li>${data.escapeHtml(item.name)} × ${Number(item.qty) || 0} — ${data.formatRupiah(item.subtotal || item.price * item.qty)}</li>`).join('')}</ul><div class="muted">${(order.statusHistory || []).map(step => `${data.escapeHtml(step.status)} · ${new Date(step.date).toLocaleString('id-ID')}`).join('<br>')}</div><div class="row" style="justify-content:space-between"><b>${data.formatRupiah(order.total)}</b><div class="row">${nextStatus ? `<button class="btn primary" type="button" onclick="GriyaApp.updateOrderStatus('${orderId}','${nextStatus}')">${nextLabel}</button>` : ''}${cancelButton}</div></div></article>`;
    }).join('') : orders.length ? '<div class="empty">Tidak ada pesanan yang cocok dengan filter.</div>' : '<div class="empty">Belum ada pesanan masuk.</div>';
  }
  function updateOrderStatus(id, nextStatus) {
    if (currentSession()?.role !== 'admin') return notify('Hanya Admin yang dapat mengelola status pesanan.');
    let orders = [];
    try { orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); } catch (error) {}
    const order = orders.find(item => String(item.id) === String(id));
    if (!order) return notify('Pesanan tidak ditemukan.');
    const transitions = { 'Menunggu konfirmasi': 'Dikonfirmasi', 'Dikonfirmasi': 'Diproses', 'Diproses': 'Dikirim', 'Dikirim': 'Selesai' };
    if (nextStatus === 'Dibatalkan oleh Admin') {
      if (!['Menunggu konfirmasi', 'Dikonfirmasi', 'Diproses'].includes(order.status)) return notify('Pesanan yang sudah dikirim atau selesai tidak dapat dibatalkan.');
      if (!confirm(`Batalkan pesanan ${order.id}? Stok yang ditahan akan dikembalikan.`)) return;
    } else if (transitions[order.status] !== nextStatus) return notify('Perubahan status tidak sesuai tahapan pesanan.');
    let trackingNumber = order.trackingNumber || '';
    if (nextStatus === 'Dikirim') {
      const entered = prompt('Masukkan nomor resi (opsional). Kosongkan jika belum tersedia:', trackingNumber);
      if (entered === null) return;
      trackingNumber = entered.trim();
    }
    try {
      if (nextStatus === 'Dikonfirmasi' && !order.stockReserved) {
        const stockResult = data.reserveStockForOrder(order.id, order.items);
        if (!stockResult.ok) return notify(`Pesanan belum dikonfirmasi. ${stockResult.reason}`);
        order.stockReserved = true;
      }
      if (nextStatus === 'Dibatalkan oleh Admin' && (order.stockReserved || data.hasStockReservation(order.id))) {
        const released = data.releaseStockForOrder(order.id, order.items);
        if (!released.ok) return notify(`Pesanan tidak dibatalkan. ${released.reason}`);
        order.stockReserved = false;
      }
      order.status = nextStatus;
      if (nextStatus === 'Dikirim') order.trackingNumber = trackingNumber;
      if (nextStatus === 'Dikonfirmasi') order.confirmedAt = new Date().toISOString();
      if (nextStatus === 'Dibatalkan oleh Admin') order.cancelledAt = new Date().toISOString();
      order.statusHistory = [...(order.statusHistory || []), { status: nextStatus, date: new Date().toISOString() }];
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      renderAdminOrders();
      if ($('userMenu')) renderUserMenu();
      notify(nextStatus === 'Dibatalkan oleh Admin' ? 'Pesanan dibatalkan dan stok dikembalikan.' : `Status pesanan diperbarui menjadi ${nextStatus}.`);
    } catch (error) { notify('Status pesanan atau stok gagal disimpan. Coba lagi.'); }
  }
  function confirmOrder(id) { updateOrderStatus(id, 'Dikonfirmasi'); }
  function logout() { localStorage.removeItem(SESSION_KEY); location.href = 'index.html'; }
  function updateAuthLink() {
    const link = $('authLink');
    if (!link) return;
    const session = currentSession();
    if (session?.role === 'admin' && ['dashboard.html', 'produk.html', 'profile.html'].some(page => location.pathname?.endsWith(page))) { link.textContent = 'Keluar'; link.href = '#'; link.onclick = event => { event.preventDefault(); logout(); }; }
    else if (session?.role === 'admin') { link.textContent = 'Dashboard'; link.href = 'dashboard.html'; link.onclick = null; }
    else if (session?.role === 'user') { link.textContent = 'Akun Saya'; link.href = 'user.html'; link.onclick = null; }
    else { link.textContent = 'Masuk'; link.href = 'login.html'; link.onclick = null; }
  }
  window.GriyaApp = { addToCart, changeQty, removeFromCart, checkoutWhatsApp, renderDetail, renderOrder, renderDashboard, renderAdminProducts, editProduct, deleteProduct, saveProduct, loginAs, logout, handleLogin, handleRegister, handlePasswordReset, renderUserMenu, renderAccountProfile, showProfileTab, saveUserProfile, cancelUserOrder, confirmOrder, updateOrderStatus, renderAdminOrders, renderAdminRequests, renderAdminChats, sendAdminChat, submitProductRequest, cancelProductRequest, replyProductRequest, toggleProductChat, toggleRequestForm, resetOrderFilters, clearProfileAvatar };
  document.addEventListener('DOMContentLoaded', () => {
    ensureProductChatWidget();
    if (location.protocol === 'file:') ['fileChatWarning', 'fileAdminChatWarning'].forEach(id => $(id)?.classList.remove('hidden'));
    updateAuthLink();
    initPasswordToggles();
    renderFilters(); renderCatalog(); renderDetail(); renderOrder(); renderDashboard(); renderAdminProducts(); updateCartCount();
    restoreBuyerDetails();
    ['buyerName', 'buyerPhone', 'buyerAddress'].forEach(id => $(id)?.addEventListener('input', saveBuyerDetails));
    $('productSearch')?.addEventListener('input', renderCatalog);
    ['priceMin', 'priceMax'].forEach(id => $(id)?.addEventListener('input', renderCatalog));
    $('resetCatalogFilters')?.addEventListener('click', () => {
      if ($('productSearch')) $('productSearch').value = '';
      if ($('priceMin')) $('priceMin').value = '';
      if ($('priceMax')) $('priceMax').value = '';
      document.querySelectorAll('[name="variantFilter"], [name="packageFilter"]').forEach(input => { input.checked = false; });
      renderCatalog();
    });
    $('checkoutForm')?.addEventListener('submit', checkoutWhatsApp);
    $('loginForm')?.addEventListener('submit', handleLogin);
    $('registerForm')?.addEventListener('submit', handleRegister);
    $('productRequestForm')?.addEventListener('submit', submitProductRequest);
    $('userChatForm')?.addEventListener('submit', sendUserChat);
    ['user', 'admin'].forEach(prefix => {
      const render = prefix === 'user' ? renderUserMenu : renderAdminOrders;
      [`${prefix}OrderFrom`, `${prefix}OrderTo`, `${prefix}OrderMinPrice`, `${prefix}OrderMaxPrice`].forEach(id => $(id)?.addEventListener('input', render));
      $(`${prefix}OrderType`)?.addEventListener('change', render);
      $(`${prefix}OrderReset`)?.addEventListener('click', () => resetOrderFilters(prefix));
    });
    $('requestPackageImage')?.addEventListener('change', async event => {
      const file = event.target.files?.[0];
      if (!file) { requestPackageImageDraft = ''; return; }
      if (!file.type.startsWith('image/')) { event.target.value = ''; return notify('Pilih file gambar untuk contoh kemasan.'); }
      if (file.size > 8 * 1024 * 1024) { event.target.value = ''; return notify('Foto maksimal 8 MB.'); }
      try { requestPackageImageDraft = await compressImage(file); notify('Foto contoh kemasan siap dilampirkan.'); }
      catch (error) { requestPackageImageDraft = ''; event.target.value = ''; notify('Foto tidak dapat dibaca. Coba pilih gambar lain.'); }
    });
    $('resetForm')?.addEventListener('submit', handlePasswordReset);
    if (new URLSearchParams(location.search).has('registered') && $('loginSuccess')) $('loginSuccess').classList.remove('hidden');
    $('profileForm')?.addEventListener('submit', saveUserProfile);
    initProfileCropper();
    window.addEventListener('storage', event => {
      if (event.key === CART_KEY) { try { cart = JSON.parse(event.newValue || '[]'); } catch (error) { cart = []; } updateCartCount(); renderOrder(); }
      if ([ACCOUNTS_KEY, BUYER_KEY].includes(event.key)) { restoreBuyerDetails(); if ($('userMenu')) renderUserMenu(); if ($('profilePage')) renderAccountProfile(); }
      if (event.key === ORDERS_KEY) { if ($('userMenu')) renderUserMenu(); if ($('adminOrders')) renderAdminOrders(); }
      if (event.key === REQUESTS_KEY) { if ($('userMenu') || $('productChat')) renderUserProductRequests(); if ($('adminProductRequests')) renderAdminRequests(); if ($('adminChatMessages')) renderAdminChats(); }
      if (event.key === CHAT_KEY) { if ($('productChat')) renderUserProductRequests(); if ($('adminChatMessages')) renderAdminChats(); }
      if (event.key === data.STORE_KEY) { renderCatalog(); renderDetail(); renderDashboard(); renderAdminProducts(); renderOrder(); }
    });
    window.addEventListener('hashchange', () => {
      if ($('profilePage')) showProfileTab(location.hash === '#adminOrders' ? 'orders' : 'profile', false);
    });
    if ($('userMenu')) renderUserMenu();
    if ($('productChat')) renderUserProductRequests();
    if ($('profilePage')) renderAccountProfile();

    $('productForm')?.addEventListener('submit', saveProduct);
  });
})();



