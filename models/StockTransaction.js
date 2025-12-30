import db from '../dbStorage.js';

class StockTransactionModel {
  constructor(data) { Object.assign(this, data); }
  async save() {
    if (this._id) {
      return this;
    }
    const created = await db.createStock(this);
    Object.assign(this, created);
    return this;
  }
  async populate(field) {
    if (field === 'productId' && this.productId) {
      const p = await db.findProductById(this.productId);
      this.productId = p || this.productId;
    }
    return this;
  }
  static async find() { return db.listStock(); }
  static async findById(id) {
    const t = await db.findStockById(id);
    if (!t) return null;
    t.populate = async function (field) {
      if (field === 'productId' && t.productId) {
        const p = await db.findProductById(t.productId);
        t.productId = p || t.productId;
      }
      return t;
    };
    return t;
  }
  static async findByIdAndDelete(id) { return db.deleteStock(id); }
}

export default StockTransactionModel;

