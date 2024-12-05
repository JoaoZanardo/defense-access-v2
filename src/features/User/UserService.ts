import { IDeleteModelProps, IFindModelByIdProps, ModelAction } from '../../core/interfaces/Model'
import { IFindUserByEmailProps, IListUsersFilters, IUpdateUserProps, UserModel } from '../../models/User/UserModel'
import { UserRepositoryImp } from '../../models/User/UserMongoDB'
import CustomResponse from '../../utils/CustomResponse'
import { DateUtils } from '../../utils/Date'
import ObjectId from '../../utils/ObjectId'

export class UserService {
  constructor (
    private userRepositoryImp: typeof UserRepositoryImp
  ) {
    this.userRepositoryImp = userRepositoryImp
  }

  async list (filters: IListUsersFilters) {
    return await this.userRepositoryImp.list(filters)
  }

  async create (user: UserModel): Promise<UserModel> {
    const {
      email,
      tenantId
    } = user.object

    await this.validateDuplicatedEmail({
      email,
      tenantId
    })

    // const count = await CountServiceImp.findByTenantId(tenantId)

    // if (count.usersCount! >= tenant.usersNumber!) {
    //   throw CustomResponse.CONFLICT('Número máximo de usuários atingido, atualize seu plano para cadastrar mais usuários!')
    // }

    // await CountServiceImp.update({
    //   id: count._id!,
    //   tenantId,
    //   data: {
    //     usersCount: (count.usersCount! + 1)
    //   }
    // })

    const createdUser = await this.userRepositoryImp.create(user)

    return createdUser
  }

  async update ({
    id,
    tenantId,
    responsibleId,
    data
  }: IUpdateUserProps): Promise<void> {
    const user = await this.findById({
      id,
      tenantId
    })

    const updated = await this.userRepositoryImp.update({
      id,
      tenantId,
      data: {
        ...data,
        actions: [
          ...user.actions!,
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
      throw CustomResponse.INTERNAL_SERVER_ERROR('Ocorreu um erro ao tentar atualizar usuário!', {
        recordId: id
      })
    }
  }

  async delete ({
    id,
    tenantId,
    responsibleId
  }: IDeleteModelProps): Promise<void> {
    await this.findById({
      id,
      tenantId
    })

    // const count = await CountServiceImp.findByTenantId(tenantId)

    // await CountServiceImp.update({
    //   id: count._id!,
    //   tenantId,
    //   data: {
    //     usersCount: count.usersCount! > 0 ? (count.usersCount! - 1) : 0
    //   }
    // })

    await this.update({
      id: ObjectId(id),
      tenantId,
      responsibleId,
      data: {
        active: false,
        deletionDate: DateUtils.getCurrent()
      }
    })
  }

  async findById ({
    id,
    tenantId
  }: IFindModelByIdProps): Promise<UserModel> {
    const user = await this.userRepositoryImp.findById({
      id,
      tenantId
    })
    if (!user) {
      throw CustomResponse.NOT_FOUND('Usuário não cadastrado!', {
        userId: id
      })
    }

    // await this.setForeignProperties(user)

    return user
  }

  async findByEmail ({
    email,
    tenantId
  }: IFindUserByEmailProps): Promise<UserModel> {
    const user = await this.userRepositoryImp.findByEmail({
      email,
      tenantId
    })
    if (!user) {
      throw CustomResponse.NOT_FOUND('Usuário não cadastrado!', {
        email
      })
    }

    // await this.setForeignProperties(user)

    return user
  }

  private async validateDuplicatedEmail ({
    email,
    tenantId
  }: IFindUserByEmailProps): Promise<void> {
    if (!email) return

    const exists = await this.userRepositoryImp.findByEmail({
      email,
      tenantId
    })

    if (exists) throw CustomResponse.CONFLICT('Email já cadastrado!')
  }

  // private async setForeignProperties (user: UserModel, includeDeleted?: boolean): Promise<void> {
  //   const accessGroup = await AccessGroupServiceImp.findById({
  //     id: user.accessGroupId,
  //     tenantId: user.tenantId,
  //     includeDeleted
  //   })

  //   user.accessGroup = accessGroup.object
  // }
}
