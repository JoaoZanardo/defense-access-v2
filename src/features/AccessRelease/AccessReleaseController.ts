import { NextFunction, Request, Response, Router } from 'express'

import database from '../../config/database'
import { Controller } from '../../core/Controller'
import { ModelAction } from '../../core/interfaces/Model'
import Rules from '../../core/Rules'
import { permissionAuthMiddleware } from '../../middlewares/permissionAuth'
import { Permission } from '../../models/AccessGroup/AccessGroupModel'
import { AccessReleaseModel } from '../../models/AccessRelease/AccessReleaseModel'
import { AccessReleaseRepositoryImp } from '../../models/AccessRelease/AccessReleaseMongoDB'
import { DateUtils } from '../../utils/Date'
import ObjectId from '../../utils/ObjectId'
import { AccessReleaseRules } from './AccessReleaseRules'
import { AccessReleaseService } from './AccessReleaseService'

export const AccessReleaseServiceImp = new AccessReleaseService(AccessReleaseRepositoryImp)

class AccessReleaseController extends Controller {
  protected rules: Rules = new AccessReleaseRules()

  handle (): Router {
    this.router.get(
      '/',
      permissionAuthMiddleware(Permission.read),
      async (request: Request, response: Response, next: NextFunction) => {
        try {
          const { tenantId } = request

          const filters = AccessReleaseModel.listFilters({
            tenantId,
            ...request.query
          })

          const accessReleases = await AccessReleaseServiceImp.list(filters)

          response.OK('Liberações de acessos encontrados com sucesso!', {
            accessReleases
          })
        } catch (error) {
          next(error)
        }
      })

    this.router.get(
      '/person/:personId/last',
      permissionAuthMiddleware(Permission.read),
      async (request: Request, response: Response, next: NextFunction) => {
        try {
          const { tenantId } = request

          const { personId } = request.params

          const accessRelease = await AccessReleaseServiceImp.findLastByPersonId({
            personId: ObjectId(personId),
            tenantId
          })

          response.OK('Liberação de acesso encontrado com sucesso!', {
            accessRelease
          })
        } catch (error) {
          next(error)
        }
      })

    this.router.post(
      '/',
      permissionAuthMiddleware(Permission.create),
      async (request: Request, response: Response, next: NextFunction) => {
        const session = await database.startSession()
        session.startTransaction()

        try {
          const { tenantId, userId } = request

          const {
            personId,
            personTypeId,
            type,
            observation,
            responsibleId,
            accessPointId,
            areasIds,
            picture,
            expiringTime,
            singleAccess,
            personTypeCategoryId
          } = request.body

          this.rules.validate(
            { responsibleId, isRequiredField: false },
            { observation, isRequiredField: false },
            { accessPointId, isRequiredField: false },
            { areasIds, isRequiredField: false },
            { picture, isRequiredField: false },
            { expiringTime, isRequiredField: false },
            { singleAccess, isRequiredField: false },
            { personTypeCategoryId, isRequiredField: false },
            { personId },
            { personTypeId },
            { type }
          )

          const accessReleaseModel = new AccessReleaseModel({
            expiringTime,
            singleAccess,
            accessPointId,
            areasIds,
            responsibleId,
            observation,
            tenantId,
            picture,
            personTypeCategoryId,
            actions: [{
              action: ModelAction.create,
              date: DateUtils.getCurrent(),
              userId
            }],
            personId,
            personTypeId,
            type
          })

          const accessRelease = await AccessReleaseServiceImp.create(accessReleaseModel)

          await session.commitTransaction()
          session.endSession()

          response.CREATED('Liberação de acesso cadastrado com sucesso!', {
            accessRelease: accessRelease.show
          })
        } catch (error) {
          session.endSession()

          next(error)
        }
      })

    this.router.get(
      '/:accessReleaseId/disable',
      permissionAuthMiddleware(Permission.delete),
      async (request: Request, response: Response, next: NextFunction) => {
        try {
          const { tenantId, userId } = request

          const { accessReleaseId } = request.params

          this.rules.validate(
            { accessReleaseId }
          )

          await AccessReleaseServiceImp.disable({
            id: ObjectId(accessReleaseId),
            tenantId,
            responsibleId: userId
          })

          response.OK('Liberação de acesso desativado com sucesso!')
        } catch (error) {
          next(error)
        }
      })

    return this.router
  }
}

const accessReleaseController = new AccessReleaseController()
export default accessReleaseController.handle()
