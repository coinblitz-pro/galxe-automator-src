import { bypass } from '../system/bypass'
import { ethers } from 'ethers'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import { CONFIG, savePassportsSync, WALLETS } from '../system/persist'
import axios from 'axios'
import { getProxyAgent, lg, random, randomString, saveError, sleep } from '../system/utils'
import chalk from 'chalk'
import { PassportData } from '../system/types'
import crypto from 'crypto'
import { keccak256, toUtf8Bytes } from 'ethers/lib/utils'
import { solveGeetestCaptcha } from '../system/2captcha'

export async function mintPassport(threads: number) {
  if (!CONFIG.twoCaptcha) {
    lg(chalk.red(`\n  Для работы необходимо указать API ключ 2captcha в настройках\n`))
    return
  }

  lg(`\n  Минт для ${WALLETS.length} кошельков...\n`)

  const passports: PassportData[] = []
  const bsc = new ethers.providers.JsonRpcProvider(CONFIG.bsc.rpc)
  const contract = new ethers.Contract('0x2d18f2d27d50c9b4013deba3d54f60996bd8847e', JSON.parse('[{"inputs":[{"internalType":"uint256","name":"_cid","type":"uint256"},{"internalType":"contract IStarNFT","name":"_starNFT","type":"address"},{"internalType":"uint256","name":"_dummyId","type":"uint256"},{"internalType":"uint256","name":"_powah","type":"uint256"},{"internalType":"bytes","name":"_signature","type":"bytes"}],"name":"claim","outputs":[],"stateMutability":"payable","type":"function"}]'))

  await bypass(threads, async (wallet: ethers.Wallet, index: number) => {
    const address = wallet.address.toLowerCase()
    const password = randomString(14) + randomString(2, '~!@#$%^&*.=')
    const galaxy = axios.create({ baseURL: 'https://graphigo.prd.galaxy.eco/query', httpsAgent: getProxyAgent(index), method: 'POST' })

    async function mint() {
      const prepareParticipateResponse = await galaxy<GalxePrepareParticipateResponse>({
        data: {
          operationName: 'PrepareParticipate',
          variables: {
            input: {
              signature: '',
              campaignID: 'GCfBiUt5ye',
              address,
              mintCount: 1,
              chain: 'BSC',
              captcha: await getCaptcha(),
            },
          },
          query: 'mutation PrepareParticipate($input: PrepareParticipateInput!) {\n  prepareParticipate(input: $input) {\n    allow\n    disallowReason\n    signature\n    nonce\n    mintFuncInfo {\n      funcName\n      nftCoreAddress\n      verifyIDs\n      powahs\n      cap\n      __typename\n    }\n    extLinkResp {\n      success\n      data\n      error\n      __typename\n    }\n    metaTxResp {\n      metaSig2\n      autoTaskUrl\n      metaSpaceAddr\n      forwarderAddr\n      metaTxHash\n      reqQueueing\n      __typename\n    }\n    solanaTxResp {\n      mint\n      updateAuthority\n      explorerUrl\n      signedTx\n      verifyID\n      __typename\n    }\n    aptosTxResp {\n      signatureExpiredAt\n      tokenName\n      __typename\n    }\n    tokenRewardCampaignTxResp {\n      signatureExpiredAt\n      verifyID\n      __typename\n    }\n    loyaltyPointsTxResp {\n      TotalClaimedPoints\n      __typename\n    }\n    __typename\n  }\n}\n',
        },
      })

      const powah = prepareParticipateResponse.data.data.prepareParticipate.mintFuncInfo.powahs[0]
      const dummyId = prepareParticipateResponse.data.data.prepareParticipate.mintFuncInfo.verifyIDs[0]
      const nftCoreAddress = prepareParticipateResponse.data.data.prepareParticipate.mintFuncInfo.nftCoreAddress
      const signature = prepareParticipateResponse.data.data.prepareParticipate.signature

      const tx: TransactionResponse = await contract
        .connect(wallet.connect(bsc))
        .claim(
          powah, nftCoreAddress, dummyId, powah, signature,
          { value: ethers.utils.parseEther('0.025'), gasPrice: CONFIG.bsc.gasPrice },
        )

      if (CONFIG.bsc.waitTx) {
        await tx.wait()
      }

      return tx
    }

    try {
      const basicUserInfoResponse = await galaxy<GalxeBasicUserInfoResponse>({
        data: {
          operationName: 'BasicUserInfo',
          variables: { address, listSpaceInput: { first: 30 } },
          query: 'query BasicUserInfo($address: String!, $listSpaceInput: ListSpaceInput!) {\n  addressInfo(address: $address) {\n    id\n    username\n    address\n    hasEmail\n    avatar\n    solanaAddress\n    aptosAddress\n    seiAddress\n    hasEvmAddress\n    hasSolanaAddress\n    hasAptosAddress\n    hasTwitter\n    hasGithub\n    hasDiscord\n    hasTelegram\n    displayEmail\n    displayTwitter\n    displayGithub\n    displayDiscord\n    displayTelegram\n    email\n    twitterUserID\n    twitterUserName\n    githubUserID\n    githubUserName\n    passport {\n      status\n      pendingRedactAt\n      id\n      __typename\n    }\n    isVerifiedTwitterOauth2\n    isVerifiedDiscordOauth2\n    displayNamePref\n    discordUserID\n    discordUserName\n    telegramUserID\n    telegramUserName\n    subscriptions\n    isWhitelisted\n    isInvited\n    isAdmin\n    passportPendingRedactAt\n    spaces(input: $listSpaceInput) {\n      list {\n        ...SpaceBasicFrag\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment SpaceBasicFrag on Space {\n  id\n  name\n  info\n  thumbnail\n  alias\n  links\n  isVerified\n  status\n  followersCount\n  __typename\n}\n',
        },
      })

      const { status } = basicUserInfoResponse.data.data.addressInfo.passport

      if (status === 'MINTED') {
        passports.push({ address, status: 'Already Minted' })
        lg(`${chalk.bold(address)} Паспорт уже сминчен`, true)
        return
      } else if (status === 'ISSUED_NOT_MINTED') {
        const receipt = await mint()
        passports.push({ address, password, status: 'Minted (without password)' })
        lg(`${chalk.bold(address)} Паспорт успешно сминчен https://bscscan.com/tx/${receipt.hash}`, true)
        return
      } else if (status === 'NOT_ISSUED') {
        passports.push({ address, status: 'Not issued' })
        lg(`${chalk.bold(address)} KYC не пройден (или не запрашивался)`, true)
        return
      }

      const balance = await bsc.getBalance(address)
      if (balance.lt('26000000000000000')) {
        passports.push({ address, status: 'Insufficient Balance' })
        lg(`${chalk.bold(address)} 'Недостаточный баланс, минимум 0.026BNB'`, true)
        return
      }

      const preparePassportResponse = await galaxy<GalxePreparePassportResponse>({
        data: {
          operationName: 'PreparePassport',
          variables: {
            input: {
              address,
              signature: await wallet.signMessage(`prepare_address_passport:${address}`),
            },
          },
          query: 'mutation PreparePassport($input: PreparePassportInput!) {\n  preparePassport(input: $input) {\n    data\n    __typename\n  }\n}\n',
        },
      })
      await sleep(random(...CONFIG.sleep.betweenGalxeRequest))

      const key = Buffer.from(keccak256(toUtf8Bytes(password)).slice(2), 'hex')
      const iv = crypto.randomBytes(12)
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
      const encrypted = cipher.update(preparePassportResponse.data.data.preparePassport.data)
      cipher.final('base64')
      await galaxy<GalxeSavePassportResponse>({
        data: {
          operationName: 'SavePassport',
          variables: {
            input: {
              address,
              signature: await wallet.signMessage(`save_address_passport:${address}`),
              cipher: '0x' + Buffer.concat([ iv, encrypted, cipher.getAuthTag() ]).toString('hex'),
            },
          },
          query: 'mutation SavePassport($input: SavePassportInput!) {\n  savePassport(input: $input) {\n    id\n    encrytionAlgorithm\n    cipher\n    __typename\n  }\n}\n',
        },
      })
      await sleep(random(...CONFIG.sleep.betweenGalxeRequest))

      const receipt = await mint()
      passports.push({ address, password, status: 'Minted' })
      lg(`${chalk.bold(address)} Паспорт успешно сминчен https://bscscan.com/tx/${receipt.hash}`, true)
    } catch (e) {
      lg(`${chalk.bold(address)} ERROR: ${e.message}`, true)
      passports.push({ address, password, status: 'ERR' })
      saveError(e)
    } finally {
      savePassportsSync(passports)
    }
  })
}

async function getCaptcha() {
  const solvation = await solveGeetestCaptcha('244bcb8b9846215df5af4c624a750db4', `https://galxe.com/passport?step=toMint`)
  return {
    lotNumber: solvation.lot_number,
    captchaOutput: solvation.captcha_output,
    passToken: solvation.pass_token,
    genTime: solvation.gen_time,
  }
}

export type GalxeBasicUserInfoResponse = {
  data: {
    addressInfo: {
      id: string
      passport: {
        status: 'MINTED' | 'PENDING_PREPARE' | 'ISSUED_NOT_MINTED' | 'NOT_ISSUED'
        pendingRedactAt: null
        id: string
      }
    }
  }
}

export type GalxePreparePassportResponse = {
  data: {
    preparePassport: {
      data: string
    }
  }
}

export type GalxeSavePassportResponse = {
  data: {
    savePassport: {
      id: string
      encrytionAlgorithm: string
      cipher: string
    }
  }
}

export type GalxePrepareParticipateResponse = {
  data: {
    prepareParticipate: {
      allow: true
      disallowReason: string
      signature: string
      nonce: string
      mintFuncInfo: {
        funcName: string
        nftCoreAddress: string
        verifyIDs: [ number ]
        powahs: [ number ]
        cap: number
      }
    }
  }
}
