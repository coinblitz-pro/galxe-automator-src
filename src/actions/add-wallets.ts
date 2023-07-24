import readline from 'node:readline/promises'
import { saveKeysSync } from '../system/persist'

export async function addKeys() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const answer = await rl.question(`\n  Введите приватные ключи через запятую (текущий файл keys.txt будет перезаписан)\n`)
  const keys = answer.split(',').map(p => p.trim()).filter(p => p)
  if (keys.length > 0) {
    saveKeysSync(keys)
    console.log(`\n  Сохранено ${keys.length} кошельков\n`)
  }
}
