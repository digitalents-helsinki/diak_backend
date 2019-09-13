import { Router } from 'express'
import { Container } from 'typedi'
import AuthService from '../services/auth'
import { celebrate, Joi } from 'celebrate'

const route = Router()

export default app => {
  app.use('/auth', route)

  route.post(
    '/signup',
    celebrate({
      body: Joi.object({
        name: Joi.string().required(),
        email: Joi.string().required(),
        password: Joi.string().required()
      })
    }),
    async (req, res, next) => {
      try {
        const authServiceInstance = Container.get(AuthService)
        const { user, token } = await authServiceInstance.SignUp(
          req.body.email,
          req.body.password,
          req.body.name
        )
        return res.status(201).json({ user, token })
      } catch (e) {
        throw new Error(e)
      }
    }
  )

  route.post(
    '/signin',
    celebrate({
      body: Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required()
      })
    }),
    async (req, res, next) => {
      try {
        const { email, password } = req.body
        const authServiceInstance = Container.get(AuthService)
        const { user, token } = await authServiceInstance.SignIn(
          email,
          password
        )
        return res.json({ user, token }).status(200)
      } catch (e) {
        throw new Error(e)
      }
    }
  )
}
