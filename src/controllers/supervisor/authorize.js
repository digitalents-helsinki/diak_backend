module.exports = (req, res) => {
  if (
    req.body.username === process.env.SUPERVISOR_USERNAME && 
    req.body.password === process.env.SUPERVISOR_PASSWORD) {
      res.json({success: true})
  } else {
    res.json({success: false})
  }
}