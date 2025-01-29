import { Types } from 'mongoose'

import { IDeleteModelProps, IListModelsFilters, IModel, IUpdateModelProps } from '../../core/interfaces/Model'
import Model from '../../core/Model'
import { IAccessRelease } from '../../models/AccessRelease/AccessReleaseModel'
import { IEquipment } from '../../models/Equipment/EquipmentModel'
import ObjectId from '../../utils/ObjectId'

export interface IListAccessSynchronizationsFilters extends IListModelsFilters {}

export interface IUpdateAccessSynchronizationProps extends IUpdateModelProps<IAccessSynchronization> { }

export interface IDeleteAccessSynchronizationProps extends IDeleteModelProps { }

export interface IUpdateAccessSynchronizationSyncErrorsProps {
  id: Types.ObjectId
  tenantId: Types.ObjectId
  syncError: ISyncError
}

export interface IUpdateAccessSynchronizationSyncExecutedNumberProps {
  id: Types.ObjectId
  tenantId: Types.ObjectId
  number: number
}

export interface ISynchronizeProps {
  accessSynchronizationId: Types.ObjectId
  accessReleases: Array<Partial<IAccessRelease>>
  tenantId: Types.ObjectId
  equipment: IEquipment
}

export interface ISyncError {
  equipmentId: Types.ObjectId
  equipmentIp: string
  message: string
}

export interface IAccessSynchronization extends IModel {
  finished?: boolean
  endDate?: Date
  syncErrors?: Array<ISyncError>
  executedsNumber?: number
  totalDocs?: number

  personTypesIds: Array<Types.ObjectId>
  equipmentId: Types.ObjectId
}

export class AccessSynchronizationModel extends Model<IAccessSynchronization> {
  private _executedsNumber: IAccessSynchronization['executedsNumber']
  private _finished?: IAccessSynchronization['finished']
  private _endDate?: IAccessSynchronization['endDate']
  private _syncErrors?: IAccessSynchronization['syncErrors']
  private _totalDocs?: IAccessSynchronization['totalDocs']

  private _personTypesIds: IAccessSynchronization['personTypesIds']
  private _equipmentId: IAccessSynchronization['equipmentId']

  constructor (accessSynchronization: IAccessSynchronization) {
    super(accessSynchronization)

    this._finished = accessSynchronization.finished
    this._endDate = accessSynchronization.endDate
    this._syncErrors = accessSynchronization.syncErrors
    this._executedsNumber = accessSynchronization.executedsNumber
    this._totalDocs = accessSynchronization.totalDocs

    this._personTypesIds = accessSynchronization.personTypesIds
    this._equipmentId = accessSynchronization.equipmentId
  }

  get personTypesIds (): IAccessSynchronization['personTypesIds'] {
    return this._personTypesIds
  }

  get syncErrors (): IAccessSynchronization['syncErrors'] {
    return this._syncErrors
  }

  get totalDocs (): IAccessSynchronization['totalDocs'] {
    return this._totalDocs
  }

  get executedsNumber (): IAccessSynchronization['executedsNumber'] {
    return this._executedsNumber
  }

  get object (): IAccessSynchronization {
    return {
      _id: this._id,
      tenantId: this.tenantId,
      actions: this.actions,
      active: this.active,
      createdAt: this.createdAt,
      deletionDate: this.deletionDate,
      finished: this._finished,
      endDate: this._endDate,
      syncErrors: this._syncErrors,
      totalDocs: this._totalDocs,
      executedsNumber: this._executedsNumber,
      personTypesIds: this._personTypesIds,
      equipmentId: this._equipmentId
    }
  }

  get show (): IAccessSynchronization {
    return this.object
  }

  static listFilters (
    {
      search,
      limit,
      page,
      tenantId
    }: Partial<IListAccessSynchronizationsFilters>
  ): IListAccessSynchronizationsFilters {
    const filters = {
      deletionDate: undefined
    } as IListAccessSynchronizationsFilters

    if (tenantId) Object.assign(filters, { tenantId: ObjectId(tenantId) })
    if (search) {
      Object.assign(filters, {
        $or: [
          { observation: { $regex: search, $options: 'i' } }
        ]
      })
    }
    if (limit) Object.assign(filters, { limit: Number(limit) })
    if (page) Object.assign(filters, { page: Number(page) })

    return filters
  }
}
