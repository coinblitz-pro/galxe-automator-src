import { load2captchaSync, loadProxiesSync, loadWalletsSync, TWO_CAPTCHA_TOKEN, WALLETS } from './persist'
import { existsSync, mkdirSync } from 'fs'


export function bootstrap() {
  loadWalletsSync()
  loadProxiesSync()
  load2captchaSync()

  if (WALLETS.length === 0) {
    console.log('Не найдены приватные ключи кошельков в файле keys.txt')
    process.exit(1)
  }

  if (existsSync('output') === false) {
    mkdirSync('output')
  }
}
