import mongoose, { AggregatePaginateModel, Document, Types } from 'mongoose'

import Schema, { coreSchema } from '../../core/Schema'
import { IPersonType, TimeUnit } from './PersonTypeModel'

export interface IPersonTypeDocument extends Document, Omit<IPersonType, '_id'> { }

export interface IPersonTypeMongoDB extends AggregatePaginateModel<IPersonType> { }

class PersonTypeSchema extends Schema<IPersonTypeDocument> {
  constructor () {
    const personType = new mongoose.Schema({
      ...coreSchema,
      description: String,
      appAccess: {
        type: Boolean,
        default: false
      },
      expiringTime: {
        value: Number,
        unit: {
          type: String,
          enum: TimeUnit
        }
      },
      workSchedulesIds: {
        type: Array<Types.ObjectId>,
        default: []
      },

      name: {
        type: String,
        required: true
      }
    })

    super(personType)
  }
}

export default new PersonTypeSchema()
