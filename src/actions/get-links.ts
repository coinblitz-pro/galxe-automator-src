import axios from 'axios'
import { saveLinksSync, WALLETS } from '../system/persist'
import { LinkData } from '../system/types'
import { getProxyAgent, randomString, saveError } from '../system/utils'
import qs from 'qs'
import chalk from 'chalk'
import { ethers } from 'ethers'
import { bypass } from '../system/bypass'
import { checkLicense } from '../system/license'

export async function getLinks(threads: number) {
  if (await checkLicense() === false) {
    return
  }

  console.log(`\nНачинаю работу для ${WALLETS.length} кошельков...\n`)

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
            console.log(`${chalk.bold(address)} Уже одобрено`)
            return response
          }
          if (response.data.data.getOrCreateInquiryByAddress.personaInquiry.sessionToken) {
            return response
          }
        }
      }

      const response = await getOrCreateInquiryByAddress()
      if (response === undefined) {
        console.log(`${chalk.bold(address)} Ошибка получения токена`)
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
      saveLinksSync(links)

      console.log(`${chalk.bold(address)} ${chalk.cyan(link)}`)
    } catch (e) {
      console.log(`${chalk.bold(address)} ERROR: ${e.message}`)
      saveError(e)
    }
  })

  console.log(`\n${chalk.green('Done!')}\n`)
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
