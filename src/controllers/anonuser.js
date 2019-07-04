module.exports = {
  getAnonUsers: async function() {
    const users = await req.context.models.AnonUser.findAll()
    return res.send(users)
  }
}