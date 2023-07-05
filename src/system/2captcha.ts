import axios from 'axios'
import { sleep } from './utils'
import { Geetest4Captcha, Geetest4CaptchaResponse, TwoCaptchaResponse } from './types'
import { TWO_CAPTCHA_TOKEN } from './persist'

export async function solveGeetestCaptcha(gt: string, websiteURL: string) {
  const questionResponse = await axios.get<TwoCaptchaResponse>('https://2captcha.com/in.php', {
    params: { key: TWO_CAPTCHA_TOKEN, method: 'geetest_v4', captcha_id: gt, pageurl: websiteURL, json: 1, }
  })

  if (questionResponse.data.status === 0) {
    throw new Error(`2captcha error: ${questionResponse.data.error_text}`)
  }

  for (let i = 0; i < 20; i++) {
    await sleep(5)

    const answerResponse = await axios.get<Geetest4CaptchaResponse>('https://2captcha.com/res.php', {
      params: { key: TWO_CAPTCHA_TOKEN, action: 'get', id: questionResponse.data.request, json: 1, }
    })

    if (answerResponse.data.status === 0) {
      if (answerResponse.data.request === 'CAPCHA_NOT_READY') {
        continue
      } else {
        throw new Error(`2captcha error: ${answerResponse.data.request}`)
      }
    }

    return answerResponse.data.request as Geetest4Captcha
  }

  throw new Error('2captcha error: timeout')
}
