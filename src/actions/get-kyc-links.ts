import axios from 'axios'
import { CONFIG, saveLinksSync, WALLETS } from '../system/persist'
import { LinkData } from '../system/types'
import { getProxyAgent, lg, random, randomString, saveError, sleep } from '../system/utils'
import qs from 'qs'
import chalk from 'chalk'
import { ethers } from 'ethers'
import { bypass } from '../system/bypass'

export async function getKycLinks(threads: number) {
  if (!CONFIG.twoCaptcha) {
    lg(chalk.red(`\n  Для работы необходимо указать API ключ 2captcha в настройках\n`))
    return
  }

  lg(`\n  Начинаю работу для ${WALLETS.length} кошельков...\n`)

  const links: LinkData[] = []

  await bypass(threads, async (wallet: ethers.Wallet, index: number) => {
    const address = wallet.address.toLowerCase()

    try {
      async function getOrCreateInquiryByAddress() {
        for (let i = 0; i < 2; i++) {
          const response = await axios.post<GalxeGetOrCreateInquiryByAddressResponse>('https://graphigo.prd.galaxy.eco/query', {
            operationName: 'GetOrCreateInquiryByAddress',
            variables: { input: { address, signature: await wallet.signMessage(`get_or_create_address_inquiry:${address}`) } },
            query: 'mutation GetOrCreateInquiryByAddress($input: GetOrCreateInquiryByAddressInput!) {\n  getOrCreateInquiryByAddress(input: $input) {\n    status\n    vendor\n    personaInquiry {\n      inquiryID\n      sessionToken\n      declinedReason\n      __typename\n    }\n    __typename\n  }\n}\n',
          }, {
            httpsAgent: getProxyAgent(index),
          })
          if (response.data.data.getOrCreateInquiryByAddress.status === 'Approved') {
            lg(`${chalk.bold(address)} Уже одобрено`, true)
            return response
          }
          if (response.data.data.getOrCreateInquiryByAddress.personaInquiry.sessionToken) {
            return response
          }
          await sleep(random(...CONFIG.sleep.betweenGalxeRequest))
        }
      }

      const response = await getOrCreateInquiryByAddress()
      if (response === undefined) {
        lg(`${chalk.bold(address)} Ошибка получения токена`, true)
        return
      }

      const inquiry = response.data.data.getOrCreateInquiryByAddress

      const params = qs.stringify({
        'client-version': '4.7.1',
        'container-id': `persona-widget-${randomString(16).toLowerCase()}`,
        'flow-type': 'embedded',
        'environment': 'production',
        'iframe-origin': 'https://galxe.com',
        'inquiry-id': inquiry.personaInquiry.inquiryID,
        'session-token': inquiry.personaInquiry.sessionToken,
      })

      const link = `https://withpersona.com/widget?${params}`
      links.push({ address, link })

      lg(`${chalk.bold(address)} ${chalk.cyan(link)}`, true)
    } catch (e) {
      lg(`${chalk.bold(address)} ERROR: ${e.message}`, true)
      saveError(e)
    } finally {
      saveLinksSync(links)
    }
  })

  console.log(`\n  ${chalk.green('Done!')}\n`)
}


export type GalxeGetOrCreateInquiryByAddressResponse = {
  data: {
    getOrCreateInquiryByAddress: {
      status: 'Pending' | string
      vendor: 'Persona' | string
      personaInquiry: {
        inquiryID: string
        sessionToken: string
        declinedReason: string
      }
    }
  }
}
