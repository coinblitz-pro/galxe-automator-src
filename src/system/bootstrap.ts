import { load2captchaSync, loadLicenseSync, loadProxiesSync, loadWalletsSync } from './persist'
import { existsSync, mkdirSync } from 'fs'


export async function bootstrap() {
  loadWalletsSync()
  loadProxiesSync()
  load2captchaSync()
  loadLicenseSync()

  if (existsSync('output') === false) {
    mkdirSync('output')
  }
}
