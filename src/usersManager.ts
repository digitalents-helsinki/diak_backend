import { Request, Response } from 'express'
import { getConnection, Repository } from 'typeorm'
import User from './entity/user'

let repository: Repository<User>

const init = () => {
  const connection = getConnection()
  repository = connection.getRepository(User)
}

export const createUser = async (req: Request, res: Response) => {
  if (repository === undefined) {
    init()
  }
  const user = new User()
  user.name = req.name
  await repository.save(user)
  res.send(user)
}

export const readUsers = async (_: Request, res: Response) => {
  if (repository === undefined) {
    init()
  }
  const users = await repository.find()
  res.send(users)
}
