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
  for (let i = 0; i < 15; i++) {
    const [ access ] = await Promise.all([ checkAccess(), sleep(i === 0 ? 2 : 0) ])
    if (access.status === true) {
      spinner.stop()
      console.log(chalk.green(`\n  Лицензия активна\n`))
      break
    } else if (i === 11) {
      spinner.stop()
      console.log(chalk.red(`\n  Лицензия не активна: ${access.message?.toLowerCase()}\n`))
      break
    } else {
      await sleep(20)
    }
  }
}
