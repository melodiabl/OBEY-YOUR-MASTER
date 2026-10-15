'use strict'
function createMongoStore(model) {
  return {
    get: key => model.findById(key).lean(),
    async insert(key, data) {
      try { return (await model.create({ ...data, _id: key })).toObject() }
      catch (error) { if (error.code === 11000) return null; throw error }
    },
    cas: (key, revision, patch) => model.findOneAndUpdate(
      { _id: key, revision }, { $set: patch, $inc: { revision: 1 } }, { new: true, runValidators: true }
    ).lean(),
  }
}
module.exports = { createMongoStore }
