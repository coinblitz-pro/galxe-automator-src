import readline from 'readline'
import { saveLicenseSync } from '../system/persist'
import chalk from 'chalk'
import si from 'systeminformation'
import { verify } from '../system/license'

export async function addLicense() {
  const { uuid } = await si.system()
  console.log(`\nВаш UUID для получения лицензионного ключа\n\n${chalk.bold(uuid)}\n`)

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const answer = await new Promise<string>(resolve => rl.question(
    `\nВведите лицензионный ключ (текущий файл license.txt будет перезаписан)\n\n`,
    (answer) => {
      rl.close()
      resolve(answer)
    }))

  if (verify(answer.trim(), uuid)) {
    saveLicenseSync(answer.trim())
    console.log(chalk.green(`\nКлюч сохранен\n`))
  } else {
    console.log(chalk.red(`\nКлюч не верный\n`))
  }
}
