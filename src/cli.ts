import { prompt } from 'inquirer'
import { getKycLinks } from './actions/get-kyc-links'
import { mintPassport } from './actions/mint-passport'
import { addProxy } from './actions/add-proxy'
import { addKeys } from './actions/add-wallets'
import { configure2captcha } from './actions/configure-2captcha'
import { configureLicense } from './actions/configure-license'
import { checkAccess } from './system/license'
import { configureBsc } from './actions/configure-bsc'
import { configureSleeps } from './actions/configure-sleeps'

export async function cli() {
  const access = await checkAccess()
  const { action } = await prompt([ {
    type: 'list',
    name: 'action',
    message: 'Что делаем?',
    pageSize: 6,
    choices: access.status === true
      ? [ 'Ссылки на KYC', 'Mint паспорта', 'Прокси', 'Кошельки', 'Настройки', 'Выход' ]
      : [ 'Настройки', 'Выход' ],
  } ])

  if (action === 'Прокси') {
    await addProxy()
  } else if (action === 'Кошельки') {
    await addKeys()
  } else if (action === 'Ссылки на KYC') {
    await getKycLinks(await getQuantity())
  } else if (action === 'Mint паспорта') {
    await mintPassport(await getQuantity())
  }

  if (action === 'Настройки') {
    const { action } = await prompt([ {
      type: 'list',
      name: 'action',
      message: 'Что настраиваем?',
      pageSize: 5,
      choices: [ 'Лицензия', '2captcha', 'Задержки', 'BSC', 'Назад' ],
    } ])

    if (action === 'Лицензия') {
      await configureLicense()
    } else if (action === '2captcha') {
      await configure2captcha()
    } else if (action === 'Задержки') {
      await configureSleeps()
    } else if (action === 'BSC') {
      await configureBsc()
    }
  }

  if (action === 'Выход') {
    return process.exit()
  }

  await cli()
}

async function getQuantity() {
  const { quantity } = await prompt([ { type: 'input', name: 'quantity', message: 'Сколько потоков запустить?', default: 1 } ])
  return quantity
}
