import { Service, Inject } from 'typedi'
import { verify, hash } from 'argon2'
import jwt from 'jsonwebtoken'
import uuidv4 from 'uuid/v4'
import { IUser, IUserInputDTO } from '../interfaces/IUser'
import { User } from '../entity/user'
import { getRepository } from 'typeorm'

@Service()
export default class AuthService {
  generateToken (user) {
    const data = {
      id: user.userId,
      name: user.name,
      email: user.email
    }
    const signature = 'SHH'
    const expiration = '6h'

    return jwt.sign({ data }, signature, { expiresIn: expiration })
  }

  public async SignIn (
    email: string,
    password: string
  ): Promise<{ user: User; token: string }> {
    const userRecord = await getRepository(User).findOne({ email: email })
    if (!userRecord) {
      throw new Error('User not found')
    }

    const correctPassword = await verify(userRecord.password, password)

    if (correctPassword) {
      const token = this.generateToken(userRecord)
      const user = userRecord
      /*
      Reflect.deleteProperty(user, 'password')
      Reflect.deleteProperty(user, 'salt')
      */
      return { user, token }
    } else {
      throw new Error('Invalid password')
    }
  }

  public async SignUp (email: string, password: string, name: string) {
    const passwordHashed = await hash(password)
    const userRecord = await getRepository(User).create({
      password: passwordHashed,
      email,
      name
    })

    getRepository(User).save(userRecord)

    return {
      user: {
        email: userRecord.email,
        name: userRecord.name
      }
    }
  }
}
