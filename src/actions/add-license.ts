import readline from 'readline'
import { LICENSE, saveLicenseSync } from '../system/persist'
import chalk from 'chalk'
import { checkAccess } from '../system/license'

export async function addLicense() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  rl.write(LICENSE)

  const answer = await new Promise<string>(resolve => rl.question(
    `\n  Введите лицензионный ключ (текущий файл license.txt будет перезаписан)\n\n  `,
    (answer) => {
      rl.close()
      resolve(answer)
    }),
  )

  const pass = await checkAccess(answer.trim())
  saveLicenseSync(answer.trim())

  if (pass.status) {
    console.log(chalk.green(`\n  Ключ сохранен\n`))
  } else {
    console.log(chalk.red(`\n  ${pass.message}\n`))
  }
}
