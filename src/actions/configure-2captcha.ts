import { prompt } from 'inquirer'
import { CONFIG, saveConfigSync } from '../system/persist'
import { lg } from '../system/utils'
import chalk from 'chalk'

export async function configure2captcha() {
  const { key } = await prompt([ {
    type: 'input',
    name: 'key',
    message: 'Введите API ключ 2captcha.com',
    default: () => CONFIG.twoCaptcha || null,
  } ])

  saveConfigSync({ twoCaptcha: key.trim() })
}
