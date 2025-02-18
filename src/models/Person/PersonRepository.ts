import { Aggregate, FilterQuery } from 'mongoose'

import { IFindModelByIdProps, IFindModelByNameProps } from '../../core/interfaces/Model'
import { IAggregatePaginate, IUpdateProps } from '../../core/interfaces/Repository'
import { Repository } from '../../core/Repository'
import { IFindAllByPersonTypeId, IFindPersonByCpfProps, IListPersonsFilters, IPerson, PersonModel } from './PersonModel'
import { IPersonMongoDB } from './PersonSchema'

export class PersonRepository extends Repository<IPersonMongoDB, PersonModel> {
  async findById ({
    id,
    tenantId
  }: IFindModelByIdProps): Promise<PersonModel | null> {
    const aggregationStages: Aggregate<Array<any>> = this.mongoDB.aggregate([
      {
        $match: {
          _id: id,
          tenantId,
          deletionDate: null
        }
      },
      ...this.$lookupAndUnwindStages(),
      { $sort: { _id: -1 } }
    ])

    const people = await this.mongoDB.aggregatePaginate(aggregationStages)

    const person = people.docs[0]

    if (!person) return null

    return new PersonModel(person)
  }

  async findByName ({
    name,
    tenantId
  }: IFindModelByNameProps): Promise<PersonModel | null> {
    const match: FilterQuery<IPerson> = {
      name,
      tenantId,
      deletionDate: null
    }

    const document = await this.mongoDB.findOne(match).lean()
    if (!document) return null

    return new PersonModel(document)
  }

  async findByCpf ({
    cpf,
    tenantId
  }: IFindPersonByCpfProps): Promise<PersonModel | null> {
    const match: FilterQuery<IPerson> = {
      cpf,
      tenantId,
      deletionDate: null
    }

    const doc = await this.mongoDB.findOne(match).lean()
    if (!doc) return null

    return new PersonModel(doc)
  }

  async findAllByPersonTypeId ({
    personTypeId,
    tenantId
  }: IFindAllByPersonTypeId): Promise<Array<Partial<IPerson>>> {
    const documents = await this.mongoDB.find({
      personTypeId,
      tenantId,
      deletionDate: null
    }, ['_id'])

    return documents
  }

  async create (person: PersonModel): Promise<PersonModel> {
    const document = await this.mongoDB.create(person.object)

    return new PersonModel(document)
  }

  async update ({
    id,
    data,
    tenantId
  }: IUpdateProps<IPerson>): Promise<boolean> {
    const updated = await this.mongoDB.updateOne({
      _id: id,
      tenantId
    }, {
      $set: data
    })

    return !!updated.modifiedCount
  }

  async list ({ limit, page, lastAccess, ...filters }: IListPersonsFilters): Promise<IAggregatePaginate<IPerson>> {
    const aggregationStages: Aggregate<Array<any>> = this.mongoDB.aggregate([
      { $match: filters },
      ...(lastAccess ? [{ $limit: 2 }] : []),
      ...this.$lookupAndUnwindStages(lastAccess),
      { $sort: { _id: -1 } }
    ])

    return await this.mongoDB.aggregatePaginate(aggregationStages, { limit, page })
  }

  private $lookupAndUnwindStages (lastAccess?: boolean): Array<any> {
    const lastAccessStages = [
      {
        $lookup: {
          from: 'accessreleases',
          localField: '_id',
          foreignField: 'personId',
          as: 'lastAccessRelease'
        }
      },
      {
        $set: {
          accessReleasesNumber: {
            $size: '$lastAccessRelease'
          }
        }
      },
      {
        $set: {
          lastAccessRelease: {
            $arrayElemAt: [
              {
                $sortArray: { input: '$lastAccessRelease', sortBy: { _id: -1 } }
              },
              0
            ]
          }
        }
      },
      {
        $lookup: {
          from: 'accesscontrols',
          localField: '_id',
          foreignField: 'personId',
          as: 'lastAccessControl'
        }
      },
      {
        $set: {
          lastAccessControl: {
            $arrayElemAt: [
              {
                $sortArray: { input: '$lastAccessControl', sortBy: { _id: -1 } }
              },
              0
            ]
          }
        }
      },
      {
        $lookup: {
          from: 'accesspoints',
          localField: 'lastAccessControl.accessPointId',
          foreignField: '_id',
          as: 'lastAccessPoint'
        }
      },
      {
        $unwind: {
          path: '$lastAccessPoint',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'accessareas',
          localField: 'lastAccessPoint.accessAreaId',
          foreignField: '_id',
          as: 'lastAccessArea'
        }
      },
      {
        $unwind: {
          path: '$lastAccessArea',
          preserveNullAndEmptyArrays: true
        }
      }
    ]

    const baseStages = [
      {
        $lookup: {
          from: 'persontypes',
          localField: 'personTypeId',
          foreignField: '_id',
          as: 'personType'
        }
      },
      { $unwind: '$personType' }
    ]

    return lastAccess ? [...baseStages, ...lastAccessStages] : baseStages
  }
}
