import bcrypt from 'bcryptjs';
import db from '../dbStorage.js';

class UserModel {
  constructor(data) {
    Object.assign(this, data);
  }

  async save() {
    if (this._id) {
      const updated = await db.updateUser(this._id, this);
      Object.assign(this, updated);
      return this;
    }
    const created = await db.createUser(this);
    Object.assign(this, created);
    return this;
  }

  toObject() {
    const obj = { ...this };
    delete obj.password;
    return obj;
  }

  async comparePassword(candidate) {
    return bcrypt.compare(candidate, this.password);
  }

  static findOne(q) {
    const promise = db.findUserByEmail(q.email).then(u => u ? new UserModel(u) : null);
    return {
      maxTimeMS() { return promise; },
      then: (onFulfill, onReject) => promise.then(onFulfill, onReject),
      catch: (onReject) => promise.catch(onReject)
    };
  }

  static async findById(id) {
    const u = await db.findUserById(id);
    return u ? new UserModel(u) : null;
  }

  static async find() {
    const arr = await db.listUsers();
    const models = arr.map(u => new UserModel(u));
    models.select = function (sel) {
      let arr = models;
      if (sel === '-password') arr = models.map(m => { const o = m.toObject(); return o; });
      arr.sort = function (sortObj) {
        const key = Object.keys(sortObj || {})[0];
        if (!key) return arr;
        const dir = sortObj[key] === -1 ? -1 : 1;
        arr.sort((a, b) => (a[key] > b[key] ? dir : a[key] < b[key] ? -dir : 0));
        return arr;
      };
      arr.limit = function (n) { return arr.slice(0, n); };
      return arr;
    };
    models.sort = function (sortObj) { const key = Object.keys(sortObj || {})[0]; if (!key) return models; const dir = sortObj[key] === -1 ? -1 : 1; models.sort((a,b)=> (a[key]>b[key]?dir:a[key]<b[key]?-dir:0)); return models; };
    return models;
  }

  static async findByIdAndDelete(id) {
    const u = await db.deleteUser(id);
    return u ? new UserModel(u) : null;
  }

  static findByIdAndUpdate(id, update, options) {
    const promise = db.updateUser(id, update).then(u => u ? new UserModel(u) : null);
    return {
      select: async (sel) => {
        const res = await promise;
        if (!res) return null;
        if (sel === '-password') return res.toObject();
        return res;
      }
    };
  }

  static async create(obj) {
    const u = await db.createUser(obj);
    return new UserModel(u);
  }
}

export default UserModel;

