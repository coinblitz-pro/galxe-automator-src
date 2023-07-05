import readline from 'readline'
import { saveProxiesSync } from '../system/persist'

export async function addProxy() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  const answer = await new Promise<string>(resolve => rl.question(`\nВведите прокси через запятую и нажмите enter (текущий файл proxies.txt будет перезаписан)\n`, (answer) => {
    rl.close()
    resolve(answer)
  }))

  const proxies = answer.split(',').map(p => p.trim()).filter(p => p)
  saveProxiesSync(proxies)

  console.log(`\nСохранено ${proxies.length} прокси\n`)
}
