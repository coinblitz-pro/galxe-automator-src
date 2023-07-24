import readline from 'node:readline/promises'
import { saveProxiesSync } from '../system/persist'

export async function addProxy() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const answer = await rl.question(`\n  Введите прокси через запятую (текущий файл proxies.txt будет перезаписан)\n  Формат прокси: user:password@ip:port\n`)
  const proxies = answer.split(',').map(p => p.trim()).filter(p => p)
  if (proxies.length > 0) {
    saveProxiesSync(proxies)
    console.log(`\n  Сохранено ${proxies.length} прокси\n`)
  }
}
