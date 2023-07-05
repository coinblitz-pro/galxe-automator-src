import { sleep } from './utils'
import { WALLETS } from './persist'
import { ethers } from 'ethers'

export async function bypass(threads: number, worker: (wallet: ethers.Wallet, index: number) => Promise<unknown>) {
  const pool = [ ...WALLETS ]

  async function getTask() {
    if (pool.length === 0) {
      return null
    } else {
      const wallet = pool.shift()
      const index = WALLETS.indexOf(wallet)
      return { wallet, index, isLast: pool.length === 0 }
    }
  }

  async function thread() {
    while (true) {
      const task = await getTask()
      if (task !== null) {
        await worker(task.wallet, task.index)
        if (task.isLast === false) {
          await sleep(60)
        }
      } else {
        break
      }
    }
  }

  await Promise.all(new Array(threads).fill(0).map(() => thread()))
}
