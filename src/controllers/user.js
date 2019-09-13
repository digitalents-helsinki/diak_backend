import { AuthService } from '../services/auth'

export default (app, db) => {
  app.post('/user/create', async (req, res, next) => {
    const userDTO = req.body
    const { user } = await AuthService.SignUp(userDTO)
    return res.json({ user })
  })
  app.get('/user/:id', (req, res) => {
    db.models.User.findOne({
      where: {
        email: req.params.email
      }
    }).then(result => res.json(result))
  })
}
