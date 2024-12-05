import { NextFunction, Request, Response } from 'express'

import { UserServiceImp } from '../features/User/UserController'
import Jwt from '../libraries/Jwt'
import CustomResponse from '../utils/CustomResponse'

export const userAuthMiddleware = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const { tenantId } = request

    const authorization = request.headers.authorization
    if (!authorization) throw CustomResponse.UNAUTHORIZED('Acesso negado!')

    const [schema, token] = authorization.split(' ')
    if (!token || schema.toUpperCase() !== 'BEARER') throw CustomResponse.UNAUTHORIZED('Acesso negado!')

    const { userId } = Jwt.decode(token)

    const user = await UserServiceImp.findById({
      id: userId,
      tenantId
    })

    if (!user.active) throw CustomResponse.FORBIDDEN('Acesso negado!')

    request.user = user.show

    next()
  } catch (error) {
    next(error)
  }
}
