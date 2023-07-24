import { CONFIG, loadConfigSync, loadProxiesSync, loadWalletsSync } from './persist'
import { existsSync, mkdirSync } from 'fs'
import { checkAccess } from './license'
import chalk from 'chalk'
import { getSpinner, isFirstRun } from './utils'
import { printCoinblitzBanner, printSybildersBanner, printTitle } from './banner'
import { configureLicense } from '../actions/configure-license'
import { configure2captcha } from '../actions/configure-2captcha'
import { configureBsc } from '../actions/configure-bsc'

export async function bootstrap() {
  process.stdin.setEncoding('utf-8')

  loadConfigSync()
  loadWalletsSync()
  loadProxiesSync()

  if (existsSync('output') === false) {
    mkdirSync('output')
  }

  if (CONFIG.banner) {
    printCoinblitzBanner()
    printSybildersBanner()
  }

  printTitle()

  if (isFirstRun()) {
    await configureLicense()
    await configure2captcha()
    await configureBsc()
    console.log()
  } else {
    const spinner = getSpinner()
    spinner.start(`  Проверка лицензии...`)
    const access = await checkAccess()
    spinner.stop()
    if (access.status === true) {
      console.log(chalk.green(`\n  Лицензия активна\n`))
    } else {
      console.log(chalk.red(`\n  Лицензия не активна: ${access.message?.toLowerCase()}\n`))
    }
  }
}
