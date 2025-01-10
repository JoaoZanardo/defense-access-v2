import { IFindAllModelsProps, IFindModelByIdProps, IFindModelByNameProps, ModelAction } from '../../core/interfaces/Model'
import { IAggregatePaginate } from '../../core/interfaces/Repository'
import { EquipmentModel, IDeleteEquipmentProps, IEquipment, IFindEquipmentByIpProps, IListEquipmentsFilters, IUpdateEquipmentProps } from '../../models/Equipment/EquipmentModel'
import { EquipmentRepositoryImp } from '../../models/Equipment/EquipmentMongoDB'
import CustomResponse from '../../utils/CustomResponse'
import { DateUtils } from '../../utils/Date'

export class EquipmentService {
  constructor (
    private equipmentRepositoryImp: typeof EquipmentRepositoryImp
  ) {
    this.equipmentRepositoryImp = equipmentRepositoryImp
  }

  async list (filters: IListEquipmentsFilters): Promise<IAggregatePaginate<IEquipment>> {
    return await this.equipmentRepositoryImp.list(filters)
  }

  async findAll ({
    tenantId,
    select
  }: IFindAllModelsProps): Promise<Array<Partial<EquipmentModel>>> {
    return await this.equipmentRepositoryImp.findAll({
      tenantId,
      select
    })
  }

  async findById ({
    id,
    tenantId
  }: IFindModelByIdProps): Promise<EquipmentModel> {
    const equipment = await this.equipmentRepositoryImp.findById({
      id,
      tenantId
    })
    if (!equipment) throw CustomResponse.NOT_FOUND('Equipamento não cadastrado!')

    return equipment
  }

  async create (equipment: EquipmentModel): Promise<EquipmentModel> {
    await this.validateDuplicatedIp(equipment)

    await Promise.all([
      this.validateDuplicatedIp(equipment),
      this.validateDuplicatedName(equipment)
    ])

    const createdEquipment = await this.equipmentRepositoryImp.create(equipment)

    return createdEquipment
  }

  async update ({
    id,
    tenantId,
    responsibleId,
    data
  }: IUpdateEquipmentProps): Promise<void> {
    const equipment = await this.findById({
      id,
      tenantId
    })

    const { ip, name } = data

    if (ip && ip !== equipment.ip) {
      await this.validateDuplicatedIp({
        ip,
        tenantId
      })
    }

    if (name && name !== equipment.name) {
      await this.validateDuplicatedName({
        name,
        tenantId
      })
    }

    const updated = await this.equipmentRepositoryImp.update({
      id,
      tenantId,
      data: {
        ...data,
        actions: [
          ...equipment.actions!,
          (
            data.deletionDate ? {
              action: ModelAction.delete,
              date: DateUtils.getCurrent(),
              userId: responsibleId
            } : {
              action: ModelAction.update,
              date: DateUtils.getCurrent(),
              userId: responsibleId
            }
          )
        ]
      }
    })

    if (!updated) {
      throw CustomResponse.INTERNAL_SERVER_ERROR('Ocorreu um erro ao tentar atualizar equipamento!', {
        equipmentId: id
      })
    }
  }

  async delete ({
    id,
    tenantId,
    responsibleId
  }: IDeleteEquipmentProps) {
    const equipment = await this.findById({
      id,
      tenantId
    })

    // await this.validateDeletion(equipment)

    if (equipment.object.deletionDate) {
      throw CustomResponse.CONFLICT('Equipamento já removido!', {
        equipmentId: id
      })
    }

    return await this.update({
      id,
      tenantId,
      data: {
        active: false,
        deletionDate: DateUtils.getCurrent()
      },
      responsibleId
    })
  }

  private async validateDuplicatedIp ({
    ip,
    tenantId
  }: IFindEquipmentByIpProps): Promise<void> {
    const equipment = await this.equipmentRepositoryImp.findByIp({
      ip,
      tenantId
    })

    if (equipment) throw CustomResponse.CONFLICT('Ip de equipamento já cadastrado!')
  }

  private async validateDuplicatedName ({
    name,
    tenantId
  }: IFindModelByNameProps): Promise<void> {
    const exists = await this.equipmentRepositoryImp.findByName({
      name,
      tenantId
    })

    if (exists) throw CustomResponse.CONFLICT('Nome de equipamento já cadastrado!')
  }
}
