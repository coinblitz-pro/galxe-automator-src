import { prompt } from 'inquirer'
import { CONFIG, saveConfigSync } from '../system/persist'

export async function configure2captcha() {
  const { key } = await prompt([ {
    type: 'input',
    name: 'key',
    message: 'Введите API ключ 2captcha.com',
    default: () => CONFIG.twoCaptcha || null,
  } ])

  saveConfigSync({ twoCaptcha: key.trim() })
}
