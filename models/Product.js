import db from '../dbStorage.js';

class ProductModel {
  constructor(data) { Object.assign(this, data); }
  async save() {
    if (this._id) {
      const updated = await db.updateProduct(this._id, this);
      Object.assign(this, updated);
      return this;
    }
    const created = await db.createProduct(this);
    Object.assign(this, created);
    return this;
  }
  async populate(field) {
    if (field === 'supplierId' && this.supplierId) {
      const s = await db.findSupplierById(this.supplierId);
      this.supplierId = s || this.supplierId;
    }
    return this;
  }
  static async find() { return db.listProducts(); }
  static async findById(id) {
    const p = await db.findProductById(id);
    if (!p) return null;
    p.populate = async function (field) {
      if (field === 'supplierId' && p.supplierId) {
        const s = await db.findSupplierById(p.supplierId);
        p.supplierId = s || p.supplierId;
      }
      return p;
    };
    return p;
  }
  static async findByIdAndUpdate(id, update, options) {
    const u = await db.updateProduct(id, update);
    if (!u) return null;
    u.populate = async function (field) {
      if (field === 'supplierId' && u.supplierId) {
        const s = await db.findSupplierById(u.supplierId);
        u.supplierId = s || u.supplierId;
      }
      return u;
    };
    return u;
  }
  static async findByIdAndDelete(id) { return db.deleteProduct(id); }
  static async create(obj) { return db.createProduct(obj); }
}

export default ProductModel;

