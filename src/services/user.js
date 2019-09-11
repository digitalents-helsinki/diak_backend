import UserModel from '../models';

export default class UserService {
  async SignUp(user) {
    const userRecord = await UserModel.create(user)
    return { user: userRecord }
  }
}