import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const dataDir = path.join(process.cwd(), 'backend', 'data');

function ensureDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function filePath(name) {
  ensureDir();
  return path.join(dataDir, name);
}

function read(name) {
  const p = filePath(name);
  if (!fs.existsSync(p)) return [];
  try {
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}

function write(name, data) {
  const p = filePath(name);
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function createQueryable(array, modelName) {
  array.populate = async function (field) {
    const refs = {
      productId: 'products',
      supplierId: 'suppliers',
      userId: 'users'
    };
    const refFile = refs[field];
    if (!refFile) return array;
    const refData = read(refFile + '.json');
    for (const item of array) {
      const id = item[field];
      if (id) {
        const found = refData.find(r => r._id === id);
        item[field] = found || id;
      }
    }
    return array;
  };
  array.sort = function (sortObj) {
    const key = Object.keys(sortObj || {})[0];
    if (!key) return array;
    const dir = sortObj[key] === -1 ? -1 : 1;
    array.sort((a, b) => (a[key] > b[key] ? dir : a[key] < b[key] ? -dir : 0));
    return array;
  };
  array.limit = function (n) {
    return array.slice(0, n);
  };
  return array;
}

const Storage = {
  usersFile: 'users.json',
  productsFile: 'products.json',
  suppliersFile: 'suppliers.json',
  stockTransactionsFile: 'stockTransactions.json',
  activitiesFile: 'activities.json',

  readUsers() { return read(this.usersFile); },
  writeUsers(data) { write(this.usersFile, data); },
  readProducts() { return read(this.productsFile); },
  writeProducts(d) { write(this.productsFile, d); },
  readSuppliers() { return read(this.suppliersFile); },
  writeSuppliers(d) { write(this.suppliersFile, d); },
  readStock() { return read(this.stockTransactionsFile); },
  writeStock(d) { write(this.stockTransactionsFile, d); },
  readActivities() { return read(this.activitiesFile); },
  writeActivities(d) { write(this.activitiesFile, d); },

  async createUser(obj) {
    const users = this.readUsers();
    if (users.find(u => u.email === obj.email)) throw new Error('User already exists');
    const _id = genId();
    const hashed = await bcrypt.hash(obj.password, 10);
    const user = {
      _id,
      name: obj.name,
      email: obj.email,
      password: hashed,
      role: obj.role || 'STAFF',
      isPremium: !!obj.isPremium,
      status: obj.status || 'OFFLINE',
      lastLogin: obj.lastLogin || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    users.push(user);
    this.writeUsers(users);
    return user;
  },

  async findUserByEmail(email) {
    const users = this.readUsers();
    return users.find(u => u.email === email) || null;
  },

  async findUserById(id) {
    const users = this.readUsers();
    return users.find(u => u._id === id) || null;
  },

  async updateUser(id, changes) {
    const users = this.readUsers();
    const idx = users.findIndex(u => u._id === id);
    if (idx === -1) return null;
    const user = users[idx];
    const updated = { ...user, ...changes, updatedAt: new Date().toISOString() };
    users[idx] = updated;
    this.writeUsers(users);
    return updated;
  },

  async deleteUser(id) {
    let users = this.readUsers();
    const idx = users.findIndex(u => u._id === id);
    if (idx === -1) return null;
    const [removed] = users.splice(idx, 1);
    this.writeUsers(users);
    return removed;
  },

  async listUsers() {
    return createQueryable(this.readUsers().map(u => ({ ...u })), 'users');
  },

  async createActivity(act) {
    const acts = this.readActivities();
    const a = { _id: genId(), ...act, timestamp: act.timestamp || new Date().toISOString(), createdAt: new Date().toISOString() };
    acts.push(a);
    this.writeActivities(acts);
    return a;
  },

  async listActivities() {
    return createQueryable(this.readActivities().map(a => ({ ...a })), 'activities');
  },

  async clearActivities() {
    this.writeActivities([]);
    return true;
  },

  // Products
  async listProducts() { return createQueryable(this.readProducts().map(p => ({ ...p })), 'products'); },
  async findProductById(id) { return this.readProducts().find(p => p._id === id) || null; },
  async createProduct(obj) {
    const products = this.readProducts();
    const p = { _id: genId(), ...obj, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    products.push(p);
    this.writeProducts(products);
    return p;
  },
  async updateProduct(id, changes) {
    const products = this.readProducts();
    const idx = products.findIndex(p => p._id === id);
    if (idx === -1) return null;
    const updated = { ...products[idx], ...changes, updatedAt: new Date().toISOString() };
    products[idx] = updated;
    this.writeProducts(products);
    return updated;
  },
  async deleteProduct(id) {
    const products = this.readProducts();
    const idx = products.findIndex(p => p._id === id);
    if (idx === -1) return null;
    const [removed] = products.splice(idx, 1);
    this.writeProducts(products);
    return removed;
  },

  // Suppliers
  async listSuppliers() { return createQueryable(this.readSuppliers().map(s => ({ ...s })), 'suppliers'); },
  async findSupplierById(id) { return this.readSuppliers().find(s => s._id === id) || null; },
  async createSupplier(obj) { const arr = this.readSuppliers(); const s = { _id: genId(), ...obj, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; arr.push(s); this.writeSuppliers(arr); return s; },
  async updateSupplier(id, changes) { const arr = this.readSuppliers(); const idx = arr.findIndex(s => s._id === id); if (idx===-1) return null; const updated = { ...arr[idx], ...changes, updatedAt: new Date().toISOString() }; arr[idx]=updated; this.writeSuppliers(arr); return updated; },
  async deleteSupplier(id) { const arr = this.readSuppliers(); const idx = arr.findIndex(s=>s._id===id); if (idx===-1) return null; const [r]=arr.splice(idx,1); this.writeSuppliers(arr); return r; },

  // Stock transactions
  async listStock() { return createQueryable(this.readStock().map(s => ({ ...s })), 'stock'); },
  async findStockById(id) { return this.readStock().find(s => s._id === id) || null; },
  async createStock(obj) { const arr = this.readStock(); const s = { _id: genId(), ...obj, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; arr.push(s); this.writeStock(arr); return s; },
  async deleteStock(id) { const arr = this.readStock(); const idx = arr.findIndex(s => s._id === id); if (idx===-1) return null; const [r]=arr.splice(idx,1); this.writeStock(arr); return r; }
};

export default Storage;
