const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class MemoryStorage {
  constructor(seed = {}) { this.data = { ...seed }; }
  getItem(key) { return Object.hasOwn(this.data, key) ? this.data[key] : null; }
  setItem(key, value) { this.data[key] = String(value); }
  removeItem(key) { delete this.data[key]; }
}
class Element {
  constructor(value = '') {
    this.value = value; this.textContent = ''; this.innerHTML = ''; this.hidden = false;
    this.classList = { add: name => { this.hidden = name === 'hidden'; }, remove: name => { if (name === 'hidden') this.hidden = false; } };
  }
}
function createApp(seed = {}) {
  const storage = new MemoryStorage(seed);
  const ids = ['registerName','registerUsername','registerEmail','registerPassword','registerConfirm','registerError','loginUsername','loginPassword','loginError','resetEmail','resetPassword','resetConfirm','resetError','resetForm','resetSuccess','profileName','profileEmail','profilePhone','profileAddress','profileForm','profilePage','profileRole','profileUsername','profileNavLinks','profileAreaLabel','adminOrderSection','adminOrders','userMenu','userName','userOrders','notice'];
  const elements = Object.fromEntries(ids.map(id => [id, new Element()]));
  const data = {
    getProducts: () => [], getTransactions: () => [], getProduct: id => ({ id, name: 'Madu', stock: 5, price: 10000 }),
    saveProducts: () => {}, formatRupiah: value => `Rp${value}`, escapeHtml: value => String(value ?? '')
  };
  const location = { search: '', href: '' };
  const opened = [];
  const window = { GriyaData: data, open: (...args) => opened.push(args) };
  const document = { getElementById: id => elements[id] || null, addEventListener: () => {} };
  const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const context = vm.createContext({ window, document, localStorage: storage, location, URLSearchParams, Date, Intl, setTimeout: () => 0, confirm: () => true, alert: () => {} });
  vm.runInContext(source, context, { filename: 'app.js' });
  return { app: window.GriyaApp, storage, elements, location, opened };
}
function fillRegistration(elements, { name = 'Siti Madu', username = 'siti_madu', email = 'siti@example.com', password = 'rahasia123', confirm = password } = {}) {
  Object.assign(elements.registerName, { value: name });
  Object.assign(elements.registerUsername, { value: username });
  Object.assign(elements.registerEmail, { value: email });
  Object.assign(elements.registerPassword, { value: password });
  Object.assign(elements.registerConfirm, { value: confirm });
}

test('register adds a User account and login opens the user menu', () => {
  const { app, storage, elements, location } = createApp();
  fillRegistration(elements);
  app.handleRegister({ preventDefault() {} });
  const accounts = JSON.parse(storage.getItem('griya_madu_accounts_v1'));
  assert.equal(accounts.find(item => item.username === 'siti_madu').role, 'user');
  assert.equal(location.href, 'login.html?registered=1');
  elements.loginUsername.value = 'siti@example.com';
  elements.loginPassword.value = 'rahasia123';
  app.handleLogin({ preventDefault() {} });
  assert.equal(JSON.parse(storage.getItem('griya_madu_demo_session_v1')).username, 'siti_madu');
  assert.equal(location.href, 'user.html');
});

test('register rejects duplicate username or email', () => {
  const { app, elements } = createApp();
  fillRegistration(elements, { username: 'admin', email: 'new@example.com' });
  app.handleRegister({ preventDefault() {} });
  assert.match(elements.registerError.textContent, /sudah digunakan/);
});

test('forgot password updates only the account matching the email', () => {
  const { app, storage, elements } = createApp();
  elements.resetEmail.value = 'user@griyamadu.local';
  elements.resetPassword.value = 'passwordbaru';
  elements.resetConfirm.value = 'passwordbaru';
  app.handlePasswordReset({ preventDefault() {} });
  const accounts = JSON.parse(storage.getItem('griya_madu_accounts_v1'));
  assert.equal(accounts.find(item => item.username === 'user').password, 'passwordbaru');
  assert.equal(elements.resetForm.hidden, true);
  assert.equal(elements.resetSuccess.hidden, false);
});

test('user profile updates persist to the account record', () => {
  const storage = new MemoryStorage({ griya_madu_demo_session_v1: JSON.stringify({ role: 'user', username: 'user' }) });
  const { app, elements, storage: appStorage } = createApp(storage.data);
  elements.profileName.value = 'Nama Baru';
  elements.profileEmail.value = 'baru@example.com';
  elements.profilePhone.value = '081234567890';
  elements.profileAddress.value = 'Singosari';
  app.saveUserProfile({ preventDefault() {} });
  const account = JSON.parse(appStorage.getItem('griya_madu_accounts_v1')).find(item => item.username === 'user');
  assert.equal(account.name, 'Nama Baru');
  assert.equal(account.email, 'baru@example.com');
  assert.equal(account.phone, '081234567890');
});

test('Admin profile loads and saves the Admin account without changing its role', () => {
  const seed = { griya_madu_demo_session_v1: JSON.stringify({ role: 'admin', username: 'admin' }) };
  const { app, storage, elements } = createApp(seed);
  app.renderAccountProfile();
  assert.equal(elements.profileRole.textContent, 'Admin');
  assert.equal(elements.profileUsername.textContent, 'admin');
  assert.match(elements.profileNavLinks.innerHTML, /dashboard\.html/);
  elements.profileName.value = 'Pengelola Griya';
  elements.profileEmail.value = 'pengelola@example.com';
  app.saveUserProfile({ preventDefault() {} });
  const account = JSON.parse(storage.getItem('griya_madu_accounts_v1')).find(item => item.username === 'admin');
  assert.equal(account.name, 'Pengelola Griya');
  assert.equal(account.role, 'admin');
});

test('Admin can confirm a pending customer order from the profile menu', () => {
  const order = { id: 'GM-2', username: 'user', status: 'Menunggu konfirmasi', date: new Date().toISOString(), total: 10000, items: [] };
  const seed = {
    griya_madu_demo_session_v1: JSON.stringify({ role: 'admin', username: 'admin' }),
    griya_madu_store_orders_v1: JSON.stringify([order])
  };
  const { app, storage, elements } = createApp(seed);
  app.renderAccountProfile();
  assert.match(elements.adminOrders.innerHTML, /Konfirmasi Pesanan/);
  app.confirmOrder('GM-2');
  assert.equal(JSON.parse(storage.getItem('griya_madu_store_orders_v1'))[0].status, 'Dikonfirmasi');
});

test('user can cancel an order while it is waiting for confirmation', () => {
  const order = { id: 'GM-1', username: 'user', status: 'Menunggu konfirmasi', date: new Date().toISOString(), total: 10000, items: [] };
  const seed = {
    griya_madu_demo_session_v1: JSON.stringify({ role: 'user', username: 'user' }),
    griya_madu_store_orders_v1: JSON.stringify([order])
  };
  const { app, storage } = createApp(seed);
  app.cancelUserOrder('GM-1');
  assert.equal(JSON.parse(storage.getItem('griya_madu_store_orders_v1'))[0].status, 'Dibatalkan oleh pelanggan');
});

 test('checkout without a User session sends the visitor to login first', () => {
  const { app, location } = createApp();
  app.checkoutWhatsApp();
  assert.equal(location.href, 'login.html?next=orderan.html');
});
