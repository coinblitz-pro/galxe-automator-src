import { prompt } from 'inquirer'
import { bootstrap } from './system/bootstrap'
import { getLinks } from './actions/get-links'
import { mint } from './actions/mint'
import { addProxy } from './actions/add-proxy'
import { addKeys } from './actions/add-wallets'
import { add2captcha } from './actions/add-2captcha'
import { makeFirewallScript } from './actions/make-firewall-script'

export async function main() {
  bootstrap()

  const { action } = await prompt([ {
    type: 'list', name: 'action', message: 'Что делаем?', choices: [
      'Получить ссылки на KYC',
      'Mint паспорта',
      'Добавить прокси',
      'Добавить кошельки',
      'Добавить 2captcha',
      'Настроить фаервол',
      'Выход'
    ]
  } ])


  if (action === 'Получить ссылки на KYC') {
    await getLinks(await getQuantity())
  }

  if (action === 'Mint паспорта') {
    await mint(await getQuantity())
  }

  if (action === 'Добавить прокси') {
    await addProxy()
  }

  if (action === 'Добавить кошельки') {
    await addKeys()
  }

  if (action === 'Добавить 2captcha') {
    await add2captcha()
  }

  if (action === 'Настроить фаервол') {
    await makeFirewallScript()
  }

  if (action === 'Выход') {
    process.exit()
  }

  await main()
}

async function getQuantity() {
  const { quantity } = await prompt([ { type: 'input', name: 'quantity', message: 'Сколько потоков запустить?', default: 1 } ])
  return quantity
}
