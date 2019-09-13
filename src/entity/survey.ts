import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'
import { IsDate } from 'class-validator'

@Entity()
export class Survey {
  @PrimaryGeneratedColumn()
  surveyId: number

  @Column()
  name: string

  @Column()
  @IsDate()
  startDate: Date

  @Column()
  @IsDate()
  endDate: Date
}
