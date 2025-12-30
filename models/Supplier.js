import db from '../dbStorage.js';

class SupplierModel {
  constructor(data) { Object.assign(this, data); }

  async save() {
    if (this._id) {
      const updated = await db.updateSupplier(this._id, this);
      Object.assign(this, updated);
      return this;
    }
    const created = await db.createSupplier(this);
    Object.assign(this, created);
    return this;
  }

  static async find() { return db.listSuppliers(); }
  static async findById(id) { return db.findSupplierById(id); }
  static async create(obj) { return db.createSupplier(obj); }
  static async findByIdAndUpdate(id, changes) { return db.updateSupplier(id, changes); }
  static async findByIdAndDelete(id) { return db.deleteSupplier(id); }
}

export default SupplierModel;

