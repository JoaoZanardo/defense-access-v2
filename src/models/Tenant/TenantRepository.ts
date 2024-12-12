/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ClientSession, Types } from 'mongoose'

import { IFindModelByIdProps } from '../../core/interfaces/Model'
import { IUpdateProps } from '../../core/interfaces/Repository'
import { Repository } from '../../core/Repository'
import { ITenant, TenantModel } from './TenantModel'
import { ITenantMongoDB } from './TenantSchema'

export class TenantRepository extends Repository<ITenantMongoDB, TenantModel> {
  async findById ({
    id
  }: IFindModelByIdProps): Promise<TenantModel | null> {
    const document = await this.mongoDB.findById(id)
    if (!document) return null

    return new TenantModel(document)
  }

  async findTenantsOlderThan7Days (): Promise<Array<ITenant>> {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const documents = await this.mongoDB.find({
      createdAt: { $lt: sevenDaysAgo },
      freeTrial: true,
      active: true
    }, ['_id'])

    return documents
  }

  async findOneById (id: Types.ObjectId): Promise<TenantModel | null> {
    const document = await this.mongoDB.findById(id)
    if (!document) return null

    return new TenantModel(document)
  }

  async findAll (): Promise<Array<TenantModel>> {
    const documents = await this.mongoDB.find()

    const models = documents.map(document => new TenantModel(document))

    return models
  }

  async create (tenant: TenantModel, session: ClientSession): Promise<TenantModel> {
    const document = await this.mongoDB.create([tenant.object], {
      session
    })

    return new TenantModel(document[0])
  }

  async update (update: IUpdateProps): Promise<boolean> {
    throw new Error('Not Implemented!')
  }

  async updateById ({
    id,
    data
  }: {
    id: Types.ObjectId
    data: Partial<ITenant>
  }): Promise<boolean> {
    const updated = await this.mongoDB.updateOne({
      _id: id
    }, {
      $set: data
    })

    return !!updated.modifiedCount
  }
}
