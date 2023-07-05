import crypto from 'crypto'
import { PUBLIC_KEY } from './constants'
import si from 'systeminformation'
import { LICENSE } from './persist'


export const sign = (input, privateKey) => {
  const signer = crypto.createSign('RSA-SHA256')
  signer.update(input, 'utf-8')
  return signer.sign(privateKey, 'hex')
}

export function verify(signature, data) {
  const verify = crypto.createVerify('RSA-SHA256')
  verify.update(data, 'utf-8')
  return verify.verify(PUBLIC_KEY, signature, 'hex')
}

export async function checkLicense() {
  const { uuid } = await si.system()
  return verify(LICENSE, uuid)
}
