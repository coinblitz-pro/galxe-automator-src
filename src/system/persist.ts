import { existsSync, readFileSync, writeFileSync } from 'fs'
import { LinkData, PassportData } from './types'
import { CSV_LINKS_HEADER, CSV_PASSPORTS_HEADER } from './constants'
import dayjs from 'dayjs'
import { ethers } from 'ethers'

export let WALLETS: ethers.Wallet[] = []
export let PROXIES: string[] = []
export let TWO_CAPTCHA_TOKEN: string
export let LICENSE: string

const now = dayjs().format('DD.MM.YYYY hh:mm')

export function loadFile(file: string) {
  return existsSync(file) ? readFileSync(file).toString().split('\n').filter(r => r).map(row => row.trim()) : []
}

export function loadWalletsSync() {
  WALLETS = loadFile('keys.txt').map(key => new ethers.Wallet(key))
}

export function loadProxiesSync() {
  PROXIES = loadFile('proxies.txt')
}

export function load2captchaSync() {
  TWO_CAPTCHA_TOKEN = loadFile('2captcha.txt')[0]
}

export function loadLicenseSync() {
  LICENSE = loadFile('license.txt')[0]
}

export function saveProxiesSync(rows: string[]) {
  PROXIES = rows
  writeFileSync(`proxies.txt`, rows.join('\n'))
}

export function save2CaptchaSync(key: string) {
  TWO_CAPTCHA_TOKEN = key
  writeFileSync(`2captcha.txt`, key)
}

export function saveLicenseSync(license: string) {
  LICENSE = license
  writeFileSync(`license.txt`, license)
}

export function saveKeysSync(rows: string[]) {
  WALLETS = rows.map(key => new ethers.Wallet(key))
  writeFileSync(`keys.txt`, rows.join('\n'))
}

export function saveLinksSync(links: LinkData[]) {
  const rows = [ CSV_LINKS_HEADER.join(','), ...links.map(w => [ w.address, w.link ].join(',')) ]
  writeFileSync(`output/links_[${now}].csv`, rows.join('\n'))
}

export function savePassportsSync(passports: PassportData[]) {
  const rows = [ CSV_PASSPORTS_HEADER.join(','), ...passports.map(w => [ w.address, w.status, w.password ].join(',')) ]
  writeFileSync(`output/passports_[${now}].csv`, rows.join('\n'))
}
