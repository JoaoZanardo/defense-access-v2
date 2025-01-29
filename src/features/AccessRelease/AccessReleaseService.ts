import to from 'await-to-js'

import { IFindModelByIdProps, ModelAction } from '../../core/interfaces/Model'
import { IAggregatePaginate } from '../../core/interfaces/Repository'
import { AccessReleaseModel, IAccessRelease, IDisableAccessReleaseProps, IFindAllAccessReleaseByPersonTypeId, IFindLastAccessReleaseByPersonId, IListAccessReleasesFilters, IProcessAreaAccessPointsProps, IProcessEquipments } from '../../models/AccessRelease/AccessReleaseModel'
import { AccessReleaseRepositoryImp } from '../../models/AccessRelease/AccessReleaseMongoDB'
import EquipmentServer from '../../services/EquipmentServer'
import CustomResponse from '../../utils/CustomResponse'
import { DateUtils } from '../../utils/Date'
import { AccessControlServiceImp } from '../AccessControl/AccessControlController'
import { AccessPointServiceImp } from '../AccessPoint/AccessPointController'
import { EquipmentServiceImp } from '../Equipment/EquipmentController'
import { PersonServiceImp } from '../Person/PersonController'

export class AccessReleaseService {
  constructor (
    private accessReleaseRepositoryImp: typeof AccessReleaseRepositoryImp
  ) {
    this.accessReleaseRepositoryImp = accessReleaseRepositoryImp
  }

  async list (filters: IListAccessReleasesFilters): Promise<IAggregatePaginate<IAccessRelease>> {
    return await this.accessReleaseRepositoryImp.list(filters)
  }

  async findById ({
    id,
    tenantId
  }: IFindModelByIdProps): Promise<AccessReleaseModel> {
    const accessRelease = await this.accessReleaseRepositoryImp.findById({
      id,
      tenantId
    })
    if (!accessRelease) throw CustomResponse.NOT_FOUND('Liberação de acesso não cadastrado!')

    return accessRelease
  }

  async findLastByPersonId ({
    personId,
    tenantId
  }: IFindLastAccessReleaseByPersonId): Promise<AccessReleaseModel | null> {
    const accessRelease = await this.accessReleaseRepositoryImp.findLastByPersonId({
      personId,
      tenantId
    })

    return accessRelease
  }

  async findAllExpiringToday (): Promise<Array<Partial<IAccessRelease>>> {
    return await this.accessReleaseRepositoryImp.findAllExpiringToday()
  }

  async findAllByPersonTypeId ({
    personTypeId,
    tenantId
  }: IFindAllAccessReleaseByPersonTypeId): Promise<Array<Partial<IAccessRelease>>> {
    return await this.accessReleaseRepositoryImp.findAllByPersonTypeId({
      personTypeId,
      tenantId
    })
  }

  async create (accessRelease: AccessReleaseModel): Promise<AccessReleaseModel> {
    const { tenantId, accessPointId, personId, areasIds } = accessRelease

    const person = await PersonServiceImp.findById({ id: personId, tenantId })

    const accessPoint = await AccessPointServiceImp.findById({ id: accessPointId, tenantId })

    if (!accessRelease.expiringTime) {
      accessRelease.endDate = DateUtils.getDefaultEndDate()
    }

    const createdAccessRelease = await this.accessReleaseRepositoryImp.create(accessRelease)

    await this.processAreaAccessPoints({
      accessPoints: [accessPoint.object],
      endDate: accessRelease.endDate!,
      person,
      tenantId
    })

    await Promise.all(
      areasIds.map(async areaId => {
        const accessPoints = await AccessPointServiceImp.findAllByAreaId({ areaId, tenantId })

        if (accessPoints.length) {
          await this.processAreaAccessPoints({
            accessPoints,
            endDate: accessRelease.endDate!,
            person,
            tenantId
          })
        }
      })
    )

    return createdAccessRelease
  }

  async disable ({
    id,
    tenantId,
    responsibleId
  }: IDisableAccessReleaseProps): Promise<AccessReleaseModel> {
    const accessRelease = await this.findById({
      id,
      tenantId
    })

    const person = await PersonServiceImp.findById({
      id: accessRelease.object.personId,
      tenantId
    })

    await AccessControlServiceImp.removeAllAccessFromPerson(person, tenantId)

    const updated = await this.accessReleaseRepositoryImp.update({
      id,
      tenantId,
      data: {
        active: false,
        actions: [
          ...accessRelease.actions!,
          {
            action: ModelAction.update,
            date: DateUtils.getCurrent(),
            userId: responsibleId
          }
        ]
      }
    })

    if (!updated) {
      throw CustomResponse.INTERNAL_SERVER_ERROR('Ocorreu um erro ao tentar desativar liberação de acesso!', {
        accessReleaseId: id
      })
    }

    return await this.accessReleaseRepositoryImp.create(accessRelease)
  }

  private async processAreaAccessPoints ({
    accessPoints,
    endDate,
    person,
    tenantId
  }: IProcessAreaAccessPointsProps) {
    const personTypeId = person.personTypeId

    await Promise.all(
      accessPoints.map(async (accessPoint) => {
        const { generalExit, personTypesIds, equipmentsIds } = accessPoint

        const isPersonTypeIncluded = personTypesIds?.some(id => id.equals(personTypeId))

        if (!generalExit && isPersonTypeIncluded && equipmentsIds?.length) {
          await this.processEquipments({
            endDate,
            equipmentsIds,
            person,
            tenantId
          })
        }
      })
    )
  }

  private async processEquipments ({
    endDate,
    equipmentsIds,
    person,
    tenantId
  }: IProcessEquipments) {
    await Promise.all(
      equipmentsIds.map(async (equipmentId) => {
        const equipment = await EquipmentServiceImp.findById({ id: equipmentId, tenantId })
        console.log({ equipment: equipment.show })

        // try to create all access, if one throw errors, do not cancel all the session
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
        const [error, _] = await to(
          EquipmentServer.addAccess({
            equipmentIp: equipment.ip,
            personCode: person._id!,
            personId: person._id!,
            personName: person.name,
            personPictureUrl: person.object.picture!,
            initDate: DateUtils.getCurrent(),
            endDate,
            schedules: []
          })
        )

        if (error) console.log({ error: error.message })
      })
    )
  }
}
