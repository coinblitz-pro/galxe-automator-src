import readline from 'readline'
import { LICENSE, saveLicenseSync } from '../system/persist'
import chalk from 'chalk'
import { checkAccess, resetAccess } from '../system/license'
import { getSpinner, sleep } from '../system/utils'

export async function addLicense() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  rl.write(LICENSE)

  const answer = await new Promise<string>(resolve => rl.question(
    `\n  Введите лицензионный ключ (текущий файл license.txt будет перезаписан)\n\n  `,
    (answer) => {
      rl.close()
      resolve(answer)
      console.log()
    }),
  )

  saveLicenseSync(answer.trim())
  resetAccess()

  const spinner = getSpinner()
  spinner.start(`  Проверка лицензии...`)

  for (let i = 1; i <= 15; i++) {
    const pass = await checkAccess(answer.trim())
    if (pass.status) {
      console.log(chalk.green(`\n  Ключ сохранен\n`))
      spinner.stop()
      break
    } else if (i === 15) {
      console.log(chalk.red(`\n  ${pass.message}\n`))
    } else {
      await sleep(20, false)
    }
  }
}
