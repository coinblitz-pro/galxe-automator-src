import { prompt } from 'inquirer'
import { bootstrap } from './system/bootstrap'
import { getLinks } from './actions/get-links'
import { mint } from './actions/mint'
import { addProxy } from './actions/add-proxy'
import { addKeys } from './actions/add-wallets'
import { add2captcha } from './actions/add-2captcha'
import { addLicense } from './actions/add-license'
import { checkAccess } from './system/license'

export async function cli() {
  await bootstrap()

  const access = await checkAccess()
  const { action } = await prompt([ {
    type: 'list',
    name: 'action',
    message: 'Что делаем?',
    pageSize: 8,
    choices: access.status === true
      ? [ 'Ссылки на KYC', 'Mint паспорта', 'Настройки', 'Лицензия', 'Выход' ]
      : [ 'Настройки', 'Лицензия', 'Выход' ],
  } ])

  if (action === 'Ссылки на KYC') {
    await getLinks(await getQuantity())
  }

  if (action === 'Mint паспорта') {
    await mint(await getQuantity())
  }

  if (action === 'Настройки') {
    const { action } = await prompt([ {
      type: 'list',
      name: 'action',
      message: 'Что делаем?',
      pageSize: 8,
      choices: [
        'Прокси',
        'Кошельки',
        '2captcha',
        'Назад',
      ],
    } ])

    if (action === 'Прокси') {
      await addProxy()
    }

    if (action === 'Кошельки') {
      await addKeys()
    }

    if (action === '2captcha') {
      await add2captcha()
    }
  }

  if (action === 'Лицензия') {
    await addLicense()
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
