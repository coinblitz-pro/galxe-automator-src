import moize from 'moize'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { LICENSE, PROXIES } from './persist'
import { appendFileSync } from 'fs'
import dayjs from 'dayjs'
import si from 'systeminformation'
import axios from 'axios'
import chalk from 'chalk'

export const getSpinner = () => {
  const chars = [ '⠙', '⠘', '⠰', '⠴', '⠤', '⠦', '⠆', '⠃', '⠋', '⠉' ]

  let interval: NodeJS.Timeout
  let x = 0
  let m = ''

  const start = (message = '') => {
    if (interval === undefined) {
      interval = setInterval(() => {
        m = message
        process.stdout.write('\r' + message + chars[x++].padStart(3))
        x = x % chars.length
      }, 100)
    }
  }

  const stop = () => {
    if (interval !== undefined) {
      clearInterval(interval)
      process.stdout.write('\r'.padEnd(m.length + 10) + '\r')
    }
  }

  return { start, stop }
}

export const getProxyAgent = moize((i: number) => {
  const credentials = PROXIES[i % PROXIES.length]
  if (credentials) {
    return new HttpsProxyAgent(`http://${PROXIES[i % PROXIES.length]}`)
  }
}, { maxSize: 200 })

export const sleep = async (time: number) => {
  const spinner = time > 5 ? getSpinner() : null
  const timeout = new Promise(resolve => setTimeout(resolve, time * 1000))
  spinner?.start(`sleep for ${time}s`)
  await timeout
  spinner?.stop()
}

export const random = (min: number, max: number) => {
  return Math.round(Math.random() * (max - min)) + min
}

export function randomString(length: number, characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

export function saveError(error: any) {
  appendFileSync('./errors.txt', `[${dayjs().format('DD.MM.YYYY hh:mm.ss.SSS')}]\n${JSON.stringify(error.error ?? error, null, 2)}\n`)
}

export async function checkLicense() {
  const { uuid } = await si.system()
  try {
    const url = 'https://inspector.coinblitz.pro/galxe-automator'
    const { data: { legitimate } } = await axios.post<{ legitimate: boolean }>(url, { uuid, key: LICENSE }, { timeout: 10000 })
    if (legitimate === false) {
      console.log('\nЛицензия не валидна\n')
    }
    return legitimate
  } catch (e) {
    console.log(chalk.red('\nЧто-то пошло не так при проверке лицензии\n'))
    return false
  }
}
