import readline from 'readline'
import { saveLicenseSync } from '../system/persist'

export async function addLicense() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  const answer = await new Promise<string>(resolve => rl.question(
    `\nВведите лицензионный ключ (текущий файл license.txt будет перезаписан)\n`,
    (answer) => {
      rl.close()
      resolve(answer)
    }))

  saveLicenseSync(answer.trim())

  console.log(`\nКлюч сохранен\n`)
}
