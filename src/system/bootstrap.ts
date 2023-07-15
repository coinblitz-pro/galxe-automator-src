import { load2captchaSync, loadLicenseSync, loadProxiesSync, loadWalletsSync } from './persist'
import { existsSync, mkdirSync } from 'fs'
import { checkAccess } from './license'
import chalk from 'chalk'
import { printBanner } from './banner'
import { getSpinner, sleep } from './utils'


export async function bootstrap() {
  console.clear()
  printBanner()

  loadWalletsSync()
  loadProxiesSync()
  load2captchaSync()
  loadLicenseSync()

  if (existsSync('output') === false) {
    mkdirSync('output')
  }

  const spinner = getSpinner()
  spinner.start('  Проверка лицензии...')
  const [ access ] = await Promise.all([ checkAccess(), sleep(2) ])
  spinner.stop()

  if (access.status === true) {
    console.log(chalk.green(`\n  Лицензия активна\n`))
  } else {
    console.log(chalk.red(`\n  Лицензия не активна: ${access.message?.toLowerCase()}\n`))
  }
}
