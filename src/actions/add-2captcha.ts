import readline from 'readline'
import { save2CaptchaSync } from '../system/persist'

export async function add2captcha() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  const answer = await new Promise<string>(resolve => rl.question(
    `\nВведите API ключ от https://2captcha.com/ (текущий файл 2captcha.txt будет перезаписан)\n`,
    (answer) => {
      rl.close()
      resolve(answer)
    }))

  save2CaptchaSync(answer.trim())

  console.log(`\nСохранен ключ к 2captcha.com\n`)
}
