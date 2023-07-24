import { prompt } from 'inquirer'
import { CONFIG, saveConfigSync } from '../system/persist'
import chalk from 'chalk'
import { checkAccess, resetAccess } from '../system/license'
import { getSpinner, sleep } from '../system/utils'

export async function configureLicense() {

  const { key } = await prompt([ {
    type: 'input',
    name: 'key',
    message: 'Лицензионный ключ',
    default: () => CONFIG.license || null,
  } ])

  saveConfigSync({ license: key.trim() })
  resetAccess()

  const spinner = getSpinner()
  spinner.start(`  Проверка лицензии...`)

  for (let i = 1; i <= 15; i++) {
    const pass = await checkAccess(key.trim())
    if (pass.status) {
      process.stdout.write('\r' + chalk.green(`  Ключ сохранен`))
      spinner.stop()
      break
    } else if (i === 15) {
      process.stdout.write('\r' + chalk.red(`  ${pass.message}`))
    } else {
      await sleep(20, false)
    }
  }
}
