import { prompt } from 'inquirer'
import { CONFIG, saveConfigSync } from '../system/persist'

export async function configureBsc() {
  const questions = [
    {
      type: 'input',
      name: 'rpc',
      message: 'RPC',
      default: () => CONFIG.bsc.rpc,
    },
    {
      type: 'number',
      name: 'gasPrice',
      message: 'Gas price',
      default: () => CONFIG.bsc.gasPrice,
    },
    {
      type: 'confirm',
      name: 'waitTx',
      message: 'Ждать транзакцию?',
      default: () => CONFIG.bsc.waitTx,
    },
  ]

  const answers = await prompt(questions)
  saveConfigSync({ bsc: { rpc: answers.rpc.trim(), gasPrice: answers.gasPrice, waitTx: answers.waitTx } })
}
