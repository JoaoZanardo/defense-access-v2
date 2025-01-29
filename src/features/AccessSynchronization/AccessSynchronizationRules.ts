/* eslint-disable no-useless-constructor */
import Rules from '../../core/Rules'
import is from '../../utils/is'

export class AccessSynchronizationRules extends Rules {
  constructor () {
    super()

    this.validator.addRule('observation', {
      validator: (value: string) => is.string(value),
      message: 'Observação inválida. Informe uma observação válida!'
    })

    this.validator.addRule('picture', {
      validator: (value: string) => is.string(value),
      message: 'Foto inválida! Informe uma foto válida!'
    })

    this.validator.addRule('expiringTime', {
      validator: (value: string) => is.string(value),
      message: 'Tempo de expiração inválido! Informe um tempo válido!'
    })

    this.validator.addRule('singleAccess', {
      validator: (value: string) => is.boolean(value),
      message: 'Acesso único inválido!'
    })
  }
}
