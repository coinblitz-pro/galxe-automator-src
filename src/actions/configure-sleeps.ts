import { prompt } from 'inquirer'
import { CONFIG } from '../system/persist'

export async function configureSleeps() {
  const questions = [
    {
      type: 'number',
      name: 'betweenGalxeRequestFrom',
      message: `От скольки секунд спать между запросами к galxe`,
      default: () => CONFIG.sleep.betweenGalxeRequest[0],
    },
    {
      type: 'number',
      name: 'betweenGalxeRequestTo',
      message: `До скольки секунд спать между запросами к galxe`,
      default: () => CONFIG.sleep.betweenGalxeRequest[1],
    },
    {
      type: 'number',
      name: 'betweenWalletFrom',
      message: `От скольки секунд спать между кошельками`,
      default: () => CONFIG.sleep.betweenWallet[0],
    },
    {
      type: 'number',
      name: 'betweenWalletTo',
      message: `До скольки секунд спать между кошельками`,
      default: () => CONFIG.sleep.betweenWallet[1],
    },
    {
      type: 'number',
      name: 'beforeThreadFrom',
      message: `От скольки секунд спать перед запуском потока`,
      default: () => CONFIG.sleep.beforeThread[0],
    },
    {
      type: 'number',
      name: 'beforeThreadTo',
      message: `До скольки секунд спать перед запуском потока`,
      default: () => CONFIG.sleep.beforeThread[1],
    },
  ]

  //   sleep: {
  //     betweenGalxeRequest: [ number, number ]
  //     betweenWallet: [ number, number ]
  //     beforeThread: [ number, number ]
  //   }

  const answers = await prompt(questions)
  // saveConfigSync({ bsc: { rpc: answers.rpc.trim(), gasPrice: answers.gasPrice, waitTx: answers.waitTx } })
}
