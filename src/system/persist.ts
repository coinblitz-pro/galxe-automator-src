import { existsSync, readFileSync, writeFileSync } from 'fs'
import { Config, LinkData, PassportData } from './types'
import { CSV_LINKS_HEADER, CSV_PASSPORTS_HEADER } from './constants'
import dayjs from 'dayjs'
import { ethers } from 'ethers'
import JSON5 from 'json5'
import deepmerge from 'deepmerge'
import { PartialDeep } from 'type-fest'

export let WALLETS: ethers.Wallet[] = []
export let PROXIES: string[] = []

export let CONFIG: Config = {
  license: '',
  twoCaptcha: '',
  banner: true,
  bsc: {
    rpc: 'https://bsc-dataseed.binance.org/',
    gasPrice: 3,
    waitTx: true,
  },
  sleep: {
    betweenGalxeRequest: [ 5, 10 ],
    betweenWallet: [ 20, 40 ],
    beforeThread: [ 30, 60 ],
  },
}

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

export function saveProxiesSync(rows: string[]) {
  PROXIES = rows
  writeFileSync(`proxies.txt`, rows.join('\n'))
}

export function saveKeysSync(rows: string[]) {
  WALLETS = rows.map(key => new ethers.Wallet(key))
  writeFileSync(`keys.txt`, rows.join('\n'))
}

export function loadConfigSync() {
  CONFIG = existsSync('config.json5')
    ? JSON5.parse<Config>(readFileSync('config.json5').toString())
    : CONFIG
}

export function saveConfigSync(update: PartialDeep<Config>) {
  writeFileSync('config.json5', JSON5.stringify(deepmerge(CONFIG, update), null, 2))
}

export function saveLinksSync(links: LinkData[]) {
  const rows = [ CSV_LINKS_HEADER.join(','), ...links.map(w => [ w.address, w.link ].join(',')) ]
  writeFileSync(`output/links_[${now}].csv`, rows.join('\n'))
}

export function savePassportsSync(passports: PassportData[]) {
  const rows = [ CSV_PASSPORTS_HEADER.join(','), ...passports.map(w => [ w.address, w.status, w.password ].join(',')) ]
  writeFileSync(`output/passports_[${now}].csv`, rows.join('\n'))
}
