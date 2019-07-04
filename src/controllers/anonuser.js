models = require('../models')

module.exports = {
  getAnonUsers: async function(req, res) {
    return res.send(models.models.AnonUser.findAll())
  }
}