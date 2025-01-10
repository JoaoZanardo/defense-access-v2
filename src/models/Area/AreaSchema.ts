import mongoose, { AggregatePaginateModel, Document, Types } from 'mongoose'

import Schema, { coreSchema } from '../../core/Schema'
import { IArea } from './AreaModel'

export interface IAreaDocument extends Document, Omit<IArea, '_id'> { }

export interface IAreaMongoDB extends AggregatePaginateModel<IArea> { }

class AreaSchema extends Schema<IAreaDocument> {
  constructor () {
    const area = new mongoose.Schema({
      ...coreSchema,
      accessAreasIds: Array<Types.ObjectId>,
      subAreasIds: Array<Types.ObjectId>,
      analysis: {
        type: Boolean,
        default: false
      },
      description: String,

      name: {
        type: String,
        required: true
      },
      type: {
        type: String,
        required: true
      }
    })

    super(area)
  }
}

export default new AreaSchema()
