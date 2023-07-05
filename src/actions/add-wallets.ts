import readline from 'readline'
import { saveKeysSync } from '../system/persist'

export async function addKeys() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  const answer = await new Promise<string>(resolve => rl.question(`\nВведите приватные ключи через запятую и нажмите enter (текущий файл keys.txt будет перезаписан)\n`, (answer) => {
    rl.close()
    resolve(answer)
  }))

  const keys = answer.split(',').map(p => p.trim()).filter(p => p)
  saveKeysSync(keys)

  console.log(`\nСохранено ${keys.length} кошельков\n`)
}
