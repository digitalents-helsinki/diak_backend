import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  userId: number

  @Column()
  email: string

  @Column()
  name: string

  @Column()
  password: string
}

export default User
