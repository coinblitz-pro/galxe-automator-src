export type WalletData = {
  private: string
}

export type LinkData = {
  address: string
  link: string
}

export type PassportData = {
  address: string
  status: string
  password?: string
}

export type TwoCaptchaResponse<T = string> = {
  status: 1 | 0
  request: T | 'CAPCHA_NOT_READY' | 'ERROR_CAPTCHA_UNSOLVABLE'
  error_text?: string
} | {
  status: 0
  request: 'ERROR_GT'
  error_text?: string
}

export type Geetest4Captcha = {
  captcha_id: string
  lot_number: string
  pass_token: string
  gen_time: string
  captcha_output: string
}

export type Geetest4CaptchaResponse = TwoCaptchaResponse<Geetest4Captcha>

