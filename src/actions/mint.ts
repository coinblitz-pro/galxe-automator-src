import { bypass } from '../system/bypass'
import { ethers } from 'ethers'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import { savePassportsSync, TWO_CAPTCHA_TOKEN, WALLETS } from '../system/persist'
import axios from 'axios'
import { getProxyAgent, randomString, saveError, sleep } from '../system/utils'
import chalk from 'chalk'
import { PassportData } from '../system/types'
import crypto from 'crypto'
import { keccak256, toUtf8Bytes } from 'ethers/lib/utils'
import { solveGeetestCaptcha } from '../system/2captcha'
import { checkLicense } from '../system/license'

export async function mint(threads: number) {
  if (await checkLicense() === false) {
    return
  }

  console.log(`\nМинт для ${WALLETS.length} кошельков...\n`)

  const passports: PassportData[] = []
  const bsc = new ethers.providers.JsonRpcProvider('https://bsc-dataseed.binance.org/')
  const contract = new ethers.Contract('0x2d18f2d27d50c9b4013deba3d54f60996bd8847e', JSON.parse('[{"inputs":[{"internalType":"uint256","name":"_cid","type":"uint256"},{"internalType":"contract IStarNFT","name":"_starNFT","type":"address"},{"internalType":"uint256","name":"_dummyId","type":"uint256"},{"internalType":"uint256","name":"_powah","type":"uint256"},{"internalType":"bytes","name":"_signature","type":"bytes"}],"name":"claim","outputs":[],"stateMutability":"payable","type":"function"}]'))

  await bypass(threads, async (wallet: ethers.Wallet, index: number) => {
    const address = wallet.address.toLowerCase()
    const password = randomString(14) + randomString(2, '~!@#$%^&*.=')
    const galaxy = axios.create({ baseURL: 'https://graphigo.prd.galaxy.eco/query', httpsAgent: getProxyAgent(index), method: 'POST' })

    try {
      async function onchainMint() {
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
              }
            },
            query: 'mutation PrepareParticipate($input: PrepareParticipateInput!) {\n  prepareParticipate(input: $input) {\n    allow\n    disallowReason\n    signature\n    nonce\n    mintFuncInfo {\n      funcName\n      nftCoreAddress\n      verifyIDs\n      powahs\n      cap\n      __typename\n    }\n    extLinkResp {\n      success\n      data\n      error\n      __typename\n    }\n    metaTxResp {\n      metaSig2\n      autoTaskUrl\n      metaSpaceAddr\n      forwarderAddr\n      metaTxHash\n      reqQueueing\n      __typename\n    }\n    solanaTxResp {\n      mint\n      updateAuthority\n      explorerUrl\n      signedTx\n      verifyID\n      __typename\n    }\n    aptosTxResp {\n      signatureExpiredAt\n      tokenName\n      __typename\n    }\n    tokenRewardCampaignTxResp {\n      signatureExpiredAt\n      verifyID\n      __typename\n    }\n    loyaltyPointsTxResp {\n      TotalClaimedPoints\n      __typename\n    }\n    __typename\n  }\n}\n'
          }
        })

        const powah = prepareParticipateResponse.data.data.prepareParticipate.mintFuncInfo.powahs[0]
        const dummyId = prepareParticipateResponse.data.data.prepareParticipate.mintFuncInfo.verifyIDs[0]
        const nftCoreAddress = prepareParticipateResponse.data.data.prepareParticipate.mintFuncInfo.nftCoreAddress
        const signature = prepareParticipateResponse.data.data.prepareParticipate.signature

        const tx: TransactionResponse = await contract.connect(wallet.connect(bsc)).claim(powah, nftCoreAddress, dummyId, powah, signature, { value: ethers.utils.parseEther('0.025') })
        await tx.wait()

        return tx
      }

      const balance = await bsc.getBalance(address)
      if (balance.lt('26000000000000000')) {
        passports.push({ address, status: 'Insufficient Balance' })
        savePassportsSync(passports)
        console.log(`${chalk.bold(address)} 'Insufficient Balance'`)
        return
      }

      const basicUserInfoResponse = await galaxy<GalxeBasicUserInfoResponse>({
        data: {
          operationName: 'BasicUserInfo',
          variables: { address, listSpaceInput: { first: 30 } },
          query: 'query BasicUserInfo($address: String!, $listSpaceInput: ListSpaceInput!) {\n  addressInfo(address: $address) {\n    id\n    username\n    address\n    hasEmail\n    avatar\n    solanaAddress\n    aptosAddress\n    seiAddress\n    hasEvmAddress\n    hasSolanaAddress\n    hasAptosAddress\n    hasTwitter\n    hasGithub\n    hasDiscord\n    hasTelegram\n    displayEmail\n    displayTwitter\n    displayGithub\n    displayDiscord\n    displayTelegram\n    email\n    twitterUserID\n    twitterUserName\n    githubUserID\n    githubUserName\n    passport {\n      status\n      pendingRedactAt\n      id\n      __typename\n    }\n    isVerifiedTwitterOauth2\n    isVerifiedDiscordOauth2\n    displayNamePref\n    discordUserID\n    discordUserName\n    telegramUserID\n    telegramUserName\n    subscriptions\n    isWhitelisted\n    isInvited\n    isAdmin\n    passportPendingRedactAt\n    spaces(input: $listSpaceInput) {\n      list {\n        ...SpaceBasicFrag\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment SpaceBasicFrag on Space {\n  id\n  name\n  info\n  thumbnail\n  alias\n  links\n  isVerified\n  status\n  followersCount\n  __typename\n}\n'
        }
      })

      const { status } = basicUserInfoResponse.data.data.addressInfo.passport
      if (status === 'MINTED') {
        console.log(`${chalk.bold(address)} already minted`)
        passports.push({ address, status: 'Already Minted' })
        savePassportsSync(passports)
        return
      } else if (status === 'ISSUED_NOT_MINTED') {
        const receipt = await onchainMint()
        passports.push({ address, password, status: 'Minted (without password)' })
        savePassportsSync(passports)
        console.log(`${chalk.bold(address)} Passport has been successfully minted (without password) by https://bscscan.com/tx/${receipt.hash}`)
        return
      } else {
        await sleep(5)
      }

      const preparePassportResponse = await galaxy<GalxePreparePassportResponse>({
        data: {
          operationName: 'PreparePassport',
          variables: {
            input: {
              address,
              signature: await wallet.signMessage(`prepare_address_passport:${address}`),
            }
          },
          query: 'mutation PreparePassport($input: PreparePassportInput!) {\n  preparePassport(input: $input) {\n    data\n    __typename\n  }\n}\n'
        }
      })
      await sleep(5)

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
              cipher: '0x' + Buffer.concat([ iv, encrypted, cipher.getAuthTag() ]).toString('hex')
            }
          },
          query: 'mutation SavePassport($input: SavePassportInput!) {\n  savePassport(input: $input) {\n    id\n    encrytionAlgorithm\n    cipher\n    __typename\n  }\n}\n'
        }
      })
      await sleep(5)

      const receipt = await onchainMint()
      passports.push({ address, password, status: 'Minted' })
      savePassportsSync(passports)
      console.log(`${chalk.bold(address)} Passport has been successfully minted by https://bscscan.com/tx/${receipt.hash}`)
    } catch (e) {
      console.log(`${chalk.bold(address)} ERROR: ${e.message}`)
      passports.push({ address, password, status: 'ERR' })
      savePassportsSync(passports)
      saveError(e)
    }
  })
}

async function getCaptcha() {
  if (TWO_CAPTCHA_TOKEN) {
    const solvation = await solveGeetestCaptcha('244bcb8b9846215df5af4c624a750db4', `https://galxe.com/passport?step=toMint`)
    return {
      lotNumber: solvation.lot_number,
      captchaOutput: solvation.captcha_output,
      passToken: solvation.pass_token,
      genTime: solvation.gen_time,
    }
  }
}


export type GalxeBasicUserInfoResponse = {
  data: {
    addressInfo: {
      id: string
      passport: {
        status: 'MINTED' | 'PENDING_PREPARE' | 'ISSUED_NOT_MINTED'
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
  data: { savePassport: { id: string, encrytionAlgorithm: string, cipher: string } }
}

export type GalxePrepareParticipateResponse = {
  data: {
    prepareParticipate: {
      allow: true,
      disallowReason: '',
      signature: string,
      nonce: '1688486944',
      mintFuncInfo: {
        funcName: '',
        nftCoreAddress: '0xe84050261cb0a35982ea0f6f3d9dff4b8ed3c012',
        verifyIDs: [
          162795410
        ],
        powahs: [
          6336
        ],
        cap: 0
      },
      extLinkResp: null,
      metaTxResp: null,
      solanaTxResp: null,
      aptosTxResp: null,
      tokenRewardCampaignTxResp: null,
      loyaltyPointsTxResp: null,
    }
  }
}
