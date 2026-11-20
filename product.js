(() => {
  const STORE_KEY = 'mpos_griya_madu_v1';
  const demoProducts = [
    { id: 1, name: 'Madu Murni 250ml', category: 'Madu botol kecil', price: 45000, stock: 18, image: '' },
    { id: 2, name: 'Madu Murni 500ml', category: 'Madu botol besar', price: 80000, stock: 12, image: '' },
    { id: 3, name: 'Madu Hutan 250ml', category: 'Madu botol kecil', price: 55000, stock: 8, image: '' },
    { id: 4, name: 'Madu Propolis', category: 'Madu botol kecil', price: 65000, stock: 5, image: '' },
    { id: 5, name: 'Sari Madu Lemon', category: 'Madu botol kecil', price: 25000, stock: 20, image: '' },
    { id: 6, name: 'Permen Madu', category: 'Madu botol kecil', price: 15000, stock: 30, image: '' }
  ];

  function readState() {
    try {
      const state = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (state && Array.isArray(state.products)) return state;
    } catch (error) {}
    return { products: demoProducts.map(product => ({ ...product })), transactions: [] };
  }

  function saveProducts(products) {
    const state = readState();
    state.products = products;
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }

  function reserveStockForOrder(orderId, items) {
    const state = readState();
    const applied = Array.isArray(state.stockDeductedOrders) ? state.stockDeductedOrders : [];
    if (applied.includes(String(orderId))) return { ok: true, alreadyApplied: true };
    const quantities = new Map();
    for (const item of items || []) {
      const key = String(item.id);
      const qty = Number(item.qty);
      if (!item.id || !Number.isInteger(qty) || qty < 1) return { ok: false, reason: 'Jumlah item pesanan tidak valid.' };
      quantities.set(key, (quantities.get(key) || 0) + qty);
    }
    const products = state.products.map(product => ({ ...product }));
    for (const [id, qty] of quantities) {
      const product = products.find(item => String(item.id) === id);
      if (!product) return { ok: false, reason: 'Produk dalam pesanan tidak ditemukan.' };
      if (Number(product.stock) < qty) return { ok: false, reason: `Stok ${product.name} tidak mencukupi. Stok tersedia: ${Number(product.stock) || 0}.` };
    }
    for (const [id, qty] of quantities) {
      const product = products.find(item => String(item.id) === id);
      product.stock = Number(product.stock) - qty;
    }
    state.products = products;
    state.stockDeductedOrders = [...applied, String(orderId)];
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    return { ok: true, alreadyApplied: false };
  }

  function releaseStockForOrder(orderId, items) {
    const state = readState();
    const id = String(orderId);
    const applied = Array.isArray(state.stockDeductedOrders) ? state.stockDeductedOrders : [];
    const released = Array.isArray(state.stockReleasedOrders) ? state.stockReleasedOrders : [];
    if (released.includes(id)) return { ok: true, alreadyReleased: true };
    if (!applied.includes(id)) return { ok: false, reason: 'Stok pesanan ini tidak tercatat sebagai stok yang ditahan.' };
    const quantities = new Map();
    for (const item of items || []) {
      const key = String(item.id);
      const qty = Number(item.qty);
      if (!item.id || !Number.isInteger(qty) || qty < 1) return { ok: false, reason: 'Jumlah item pesanan tidak valid.' };
      quantities.set(key, (quantities.get(key) || 0) + qty);
    }
    const products = state.products.map(product => ({ ...product }));
    for (const [productId, qty] of quantities) {
      const product = products.find(item => String(item.id) === productId);
      if (!product) return { ok: false, reason: 'Produk dalam pesanan tidak ditemukan.' };
      product.stock = (Number(product.stock) || 0) + qty;
    }
    state.products = products;
    state.stockReleasedOrders = [...released, id];
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    return { ok: true, alreadyReleased: false };
  }

  function hasStockReservation(orderId) {
    const state = readState();
    const applied = Array.isArray(state.stockDeductedOrders) ? state.stockDeductedOrders : [];
    const released = Array.isArray(state.stockReleasedOrders) ? state.stockReleasedOrders : [];
    return applied.includes(String(orderId)) && !released.includes(String(orderId));
  }

  function getProducts() { return readState().products; }
  function getTransactions() { return readState().transactions || []; }
  function getProduct(id) { return getProducts().find(product => String(product.id) === String(id)); }
  function formatRupiah(value) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value) || 0);
  }
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  window.GriyaData = { STORE_KEY, demoProducts, readState, getProducts, getTransactions, getProduct, saveProducts, reserveStockForOrder, releaseStockForOrder, hasStockReservation, formatRupiah, escapeHtml };
})();
