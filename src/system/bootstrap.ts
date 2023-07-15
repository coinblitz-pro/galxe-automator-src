import { load2captchaSync, loadLicenseSync, loadProxiesSync, loadWalletsSync } from './persist'
import { existsSync, mkdirSync } from 'fs'
import { checkAccess } from './license'
import chalk from 'chalk'
import { getSpinner } from './utils'

let first = true

export async function bootstrap() {
  loadWalletsSync()
  loadProxiesSync()
  load2captchaSync()
  loadLicenseSync()

  if (existsSync('output') === false) {
    mkdirSync('output')
  }

  const spinner = first ? getSpinner() : null
  spinner?.start(`  Проверка лицензии...`)
  const access = await checkAccess()
  spinner?.stop()

  if (access.status === true) {
    console.log(chalk.green(`\n  Лицензия активна\n`))
  } else {
    console.log(chalk.red(`\n  Лицензия не активна: ${access.message?.toLowerCase()}\n`))
  }

  first = false
}
