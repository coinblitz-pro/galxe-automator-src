import moize from 'moize'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { PROXIES } from './persist'
import { appendFileSync, existsSync } from 'fs'
import dayjs from 'dayjs'

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

export const getProxy = (i: number) => {
  const credentials = PROXIES[i % PROXIES.length]
  if (credentials) {
    const [ auth, host, reboot ] = credentials.split('@')
    const [ user, password ] = auth.split(':')
    const [ ip, port ] = host.split(':')
    return { user, password, ip, port, reboot }
  }
}

export const getProxyAgent = moize((i: number) => {
  const proxy = getProxy(i)
  if (proxy) {
    return new HttpsProxyAgent(`http://${proxy.user}:${proxy.password}@${proxy.ip}:${proxy.port}`)
  }
}, { maxSize: 200 })

export const sleep = async (time: number, withSpinner = true) => {
  const spinner = withSpinner && time > 5 ? getSpinner() : null
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
  appendFileSync('./errors.txt', `[${dayjs().format('DD.MM.YYYY hh:mm.ss')}]\n${JSON.stringify(error.error ?? error, null, 2)}\n`)
}

export function lg(message: string, withTime = false) {
  console.log(withTime ? `  [${dayjs().format('DD.MM.YYYY hh:mm.ss')}] ${message}` : `  ${message}`)
}

export function isFirstRun() {
  return existsSync('config.json5') === false
}

export async function readMultiline() {
  let result = ''

  await new Promise<void>((resolve) => {
    const listener = (raw: Buffer) => {
      const input = raw.toString().trim()
      if (input) {
        result += input + '\n'
      } else {
        process.stdin.removeListener('data', listener)
        resolve()
      }
    }
    process.stdin.on('data', listener)
  })

  return result
}
