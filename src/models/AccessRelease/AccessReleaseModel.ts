import { Types } from 'mongoose'

import { IDeleteModelProps, IListModelsFilters, IModel, IUpdateModelProps, ModelAction } from '../../core/interfaces/Model'
import Model from '../../core/Model'
import { IPerson, PersonModel } from '../../models/Person/PersonModel'
import { addExpiringTime } from '../../utils/addExpiringTime'
import { DateUtils } from '../../utils/Date'
import ObjectId from '../../utils/ObjectId'
import { IAccessPoint } from '../AccessPoint/AccessPointModel'
import { ExpiringTime, IPersonType } from '../PersonType/PersonTypeModel'
import { IPersonTypeCategory } from '../PersonTypeCategory/PersonTypeCategoryModel'

export interface IListAccessReleasesFilters extends IListModelsFilters {
  personId?: Types.ObjectId
  personTypeId?: Types.ObjectId
}

export interface IUpdateAccessReleaseProps extends IUpdateModelProps<IAccessRelease> { }

export interface IDeleteAccessReleaseProps extends IDeleteModelProps { }

export interface IDisableAccessReleaseProps {
  responsibleId?: Types.ObjectId

  id: Types.ObjectId
  tenantId: Types.ObjectId
  status: AccessReleaseStatus
}

export interface IFindAllAccessReleaseByPersonTypeId {
  personTypeId: Types.ObjectId
  tenantId: Types.ObjectId
}

export interface IFindLastAccessReleaseByPersonId {
  personId: Types.ObjectId
  tenantId: Types.ObjectId
}

export interface IProcessAreaAccessPointsProps {
  accessPoints: Array<Partial<IAccessPoint>>
  person: PersonModel
  tenantId: Types.ObjectId
  accessRelease: IAccessRelease
  endDate: Date
}

export interface IProcessEquipments {
  equipmentsIds: Array<Types.ObjectId>
  person: PersonModel
  tenantId: Types.ObjectId
  accessRelease: IAccessRelease
  endDate: Date
}

export interface IScheduleDisableProps {
  endDate: Date
  accessReleaseId: Types.ObjectId
  tenantId: Types.ObjectId
  status: AccessReleaseStatus
}

export enum AccessReleaseType {
  manually = 'manually',
  invite = 'invite'
}

export const AccessReleaseTypeValues = Object.values(AccessReleaseType)

export enum AccessReleaseStatus {
  active = 'active',
  disabled = 'disabled',
  expired = 'expired',
  scheduled = 'scheduled',
  conflict = 'conflict'
}

export interface IAccessReleaseSynchronization {
  error?: boolean
  errorMessage?: string

  equipmentId: Types.ObjectId
  equipmentIp: string
}

export interface IAccessRelease extends IModel {
  responsibleId?: Types.ObjectId
  observation?: string
  picture?: string
  type?: AccessReleaseType
  expiringTime?: ExpiringTime
  singleAccess?: boolean
  personTypeCategoryId?: Types.ObjectId
  status?: AccessReleaseStatus
  initDate?: Date
  endDate?: Date
  synchronizations?: Array<IAccessReleaseSynchronization>

  person?: IPerson
  personType?: IPersonType
  personTypeCategory?: IPersonTypeCategory
  responsible?: IPerson
  accessPoint?: IAccessPoint

  personId: Types.ObjectId
  personTypeId: Types.ObjectId
  areasIds: Array<Types.ObjectId>
  accessPointId: Types.ObjectId
}

export class AccessReleaseModel extends Model<IAccessRelease> {
  private _responsibleId?: IAccessRelease['responsibleId']
  private _observation?: IAccessRelease['observation']
  private _picture?: IAccessRelease['picture']
  private _type?: IAccessRelease['type']
  private _expiringTime?: IAccessRelease['expiringTime']
  private _singleAccess?: IAccessRelease['singleAccess']
  private _personTypeCategoryId?: IAccessRelease['personTypeCategoryId']
  private _status?: IAccessRelease['status']
  private _initDate?: IAccessRelease['initDate']
  private _endDate?: IAccessRelease['endDate']
  private _synchronizations?: IAccessRelease['synchronizations']

  private _person?: IAccessRelease['person']
  private _responsible?: IAccessRelease['responsible']
  private _personType?: IAccessRelease['personType']
  private _personTypeCategory?: IAccessRelease['personTypeCategory']
  private _accessPoint?: IAccessRelease['accessPoint']

  private _personId: IAccessRelease['personId']
  private _personTypeId: IAccessRelease['personTypeId']
  private _areasIds: IAccessRelease['areasIds']
  private _accessPointId: IAccessRelease['accessPointId']

  constructor (accessRelease: IAccessRelease) {
    super(accessRelease)

    this._responsibleId = accessRelease.responsibleId ? ObjectId(accessRelease.responsibleId) : undefined
    this._observation = accessRelease.observation
    this._picture = accessRelease.picture
    this._expiringTime = accessRelease.expiringTime
    this._singleAccess = accessRelease.singleAccess
    this._personTypeCategoryId = accessRelease.personTypeCategoryId ? ObjectId(accessRelease.personTypeCategoryId) : undefined
    this._initDate = accessRelease.initDate ?? DateUtils.getCurrent()
    this._endDate = this._expiringTime ? addExpiringTime(this._expiringTime) : accessRelease.endDate
    this._status = accessRelease.status ?? (DateUtils.isToday(this._initDate) ? AccessReleaseStatus.active : AccessReleaseStatus.scheduled)
    this._synchronizations = accessRelease.synchronizations ?? []

    this._person = accessRelease.person
    this._responsible = accessRelease.responsible
    this._personType = accessRelease.personType
    this._personTypeCategory = accessRelease.personTypeCategory
    this._accessPoint = accessRelease.accessPoint

    this._accessPointId = ObjectId(accessRelease.accessPointId)
    this._type = accessRelease.type
    this._personId = ObjectId(accessRelease.personId)
    this._personTypeId = ObjectId(accessRelease.personTypeId)
    this._areasIds = accessRelease.areasIds.map(areaId => ObjectId(areaId))
    this._observation = accessRelease.observation
    this.actions = accessRelease.actions || [{
      action: ModelAction.create,
      date: DateUtils.getCurrent()
    }]
  }

  get status (): IAccessRelease['status'] {
    return this._status
  }

  get expiringTime (): IAccessRelease['expiringTime'] {
    return this._expiringTime
  }

  get endDate (): IAccessRelease['endDate'] {
    return this._endDate
  }

  set endDate (endDate: IAccessRelease['endDate']) {
    this._endDate = endDate
  }

  get personId (): IAccessRelease['personId'] {
    return this._personId
  }

  get accessPointId (): IAccessRelease['accessPointId'] {
    return this._accessPointId
  }

  get areasIds (): IAccessRelease['areasIds'] {
    return this._areasIds
  }

  get object (): IAccessRelease {
    return {
      _id: this._id,
      tenantId: this.tenantId,
      actions: this.actions,
      active: this.active,
      createdAt: this.createdAt,
      deletionDate: this.deletionDate,
      responsibleId: this._responsibleId,
      observation: this._observation,
      areasIds: this._areasIds,
      accessPointId: this._accessPointId,
      picture: this._picture,
      expiringTime: this._expiringTime,
      singleAccess: this._singleAccess,
      personTypeCategoryId: this._personTypeCategoryId,
      status: this._status,
      initDate: this._initDate,
      endDate: this._endDate,
      synchronizations: this._synchronizations,

      type: this._type,
      personId: this._personId,
      personTypeId: this._personTypeId
    }
  }

  get show () {
    return {
      ...this.object,
      person: this._person,
      personType: this._personType,
      personTypeCategory: this._personTypeCategory,
      responsible: this._responsible,
      accessPoint: this._accessPoint
    }
  }

  static listFilters (
    {
      search,
      limit,
      page,
      tenantId,
      personTypeId,
      personId
    }: Partial<IListAccessReleasesFilters>
  ): IListAccessReleasesFilters {
    const filters = {
      deletionDate: undefined
    } as IListAccessReleasesFilters

    if (personId) Object.assign(filters, { personId: ObjectId(personId) })
    if (personTypeId) Object.assign(filters, { personTypeId: ObjectId(personTypeId) })
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
