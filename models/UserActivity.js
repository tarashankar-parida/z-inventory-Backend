import db from '../dbStorage.js';

class UserActivityModel {
  constructor(data) { Object.assign(this, data); }
  static async create(obj) { return db.createActivity(obj); }
  static async find() { return db.listActivities(); }
  static async deleteMany() { return db.clearActivities(); }
}

export default UserActivityModel;

