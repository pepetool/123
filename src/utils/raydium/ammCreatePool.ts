import { BN } from 'bn.js';

import {
  Liquidity,
  MAINNET_PROGRAM_ID,
  Token,
} from '@raydium-io/raydium-sdk';
import {
  Keypair,
  PublicKey,
} from '@solana/web3.js';

import {
  connection,
  DEFAULT_TOKEN,
  makeTxVersion,
  PROGRAMIDS,
  wallet,
} from '../config';
import {
  buildAndSendTx,
  getWalletTokenAccount,
} from './util';

const ZERO = new BN(0)
type BN = typeof ZERO

type CalcStartPrice = {
  addBaseAmount: BN
  addQuoteAmount: BN
}

export function getWallet()
{
  console.log(wallet);
}

export function getConnection()
{
  console.log(connection);
}

export function calcMarketStartPrice(input: CalcStartPrice) {
  return input.addBaseAmount.toNumber() / 10 ** 6 / (input.addQuoteAmount.toNumber() / 10 ** 6)
}

type LiquidityPairTargetInfo = {
  baseToken: Token
  quoteToken: Token
  targetMarketId: PublicKey
}

export function getMarketAssociatedPoolKeys(input: LiquidityPairTargetInfo) {
  return Liquidity.getAssociatedPoolKeys({
    version: 4,
    marketVersion: 3,
    baseMint: input.baseToken.mint,
    quoteMint: input.quoteToken.mint,
    baseDecimals: input.baseToken.decimals,
    quoteDecimals: input.quoteToken.decimals,
    marketId: input.targetMarketId,
    programId: PROGRAMIDS.AmmV4,
    marketProgramId: MAINNET_PROGRAM_ID.OPENBOOK_MARKET,
  })
}

type WalletTokenAccounts = Awaited<ReturnType<typeof getWalletTokenAccount>>
type TestTxInputInfo = LiquidityPairTargetInfo &
  CalcStartPrice & {
    startTime: number // seconds
    walletTokenAccounts: WalletTokenAccounts
    publicKey: PublicKey   //这里本来是Keypair
  }

// async function ammCreatePool(input: TestTxInputInfo): Promise<{ txids: string[] }> {
//   // -------- step 1: make instructions --------
//   const initPoolInstructionResponse = await Liquidity.makeCreatePoolV4InstructionV2Simple({
//     connection,
//     programId: PROGRAMIDS.AmmV4,
//     marketInfo: {
//       marketId: input.targetMarketId,
//       programId: PROGRAMIDS.OPENBOOK_MARKET,
//     },
//     baseMintInfo: input.baseToken,
//     quoteMintInfo: input.quoteToken,
//     baseAmount: input.addBaseAmount,
//     quoteAmount: input.addQuoteAmount,
//     startTime: new BN(Math.floor(input.startTime)),
//     ownerInfo: {
//       feePayer: input.wallet.publicKey,
//       wallet: input.wallet.publicKey,
//       tokenAccounts: input.walletTokenAccounts,
//       useSOLBalance: true,
//     },
//     associatedOnly: false,
//     checkCreateATAOwner: true,
//     makeTxVersion,
//     feeDestinationId: new PublicKey('7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5'), // only mainnet use this
//   })

//   return { txids: await buildAndSendTx(initPoolInstructionResponse.innerTransactions) }

// }

export async function ammCreatePool(input: TestTxInputInfo) {
  const feeDes = process.env.NEXT_PUBLIC_DEBUG==="true" ? "3XMrhbv989VxAMi3DErLV9eJht1pHppW5LbKxe9fkEFR" : "7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5";
  // -------- step 1: make instructions --------
  const initPoolInstructionResponse = await Liquidity.makeCreatePoolV4InstructionV2Simple({
    connection,
    programId: PROGRAMIDS.AmmV4,
    marketInfo: {
      marketId: input.targetMarketId,
      programId: PROGRAMIDS.OPENBOOK_MARKET,
    },
    baseMintInfo: input.baseToken,
    quoteMintInfo: input.quoteToken,
    baseAmount: input.addBaseAmount,
    quoteAmount: input.addQuoteAmount,
    startTime: new BN(Math.floor(input.startTime)),
    ownerInfo: {
      feePayer: input.publicKey,
      wallet: input.publicKey,
      tokenAccounts: input.walletTokenAccounts,
      useSOLBalance: true,
    },
    associatedOnly: false,
    checkCreateATAOwner: true,
    makeTxVersion,                                                                        //dev 3XMrhbv989VxAMi3DErLV9eJht1pHppW5LbKxe9fkEFR
    feeDestinationId: new PublicKey(feeDes), // mainnet 7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5
  })

  return await buildAndSendTx(initPoolInstructionResponse.innerTransactions);
}

async function howToUse() {
  const baseToken = DEFAULT_TOKEN.USDC // USDC  需要构造Token?
  const quoteToken = DEFAULT_TOKEN.RAY // RAY
  const targetMarketId = Keypair.generate().publicKey
  const addBaseAmount = new BN(10000) // 10000 / 10 ** 6,
  const addQuoteAmount = new BN(10000) // 10000 / 10 ** 6,
  const startTime = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // start from 7 days later
  const walletTokenAccounts = await getWalletTokenAccount(connection, wallet.publicKey)

  /* do something with start price if needed */
  const startPrice = calcMarketStartPrice({ addBaseAmount, addQuoteAmount })

  /* do something with market associated pool keys if needed */
  const associatedPoolKeys = getMarketAssociatedPoolKeys({
    baseToken,
    quoteToken,
    targetMarketId,
  })

  //associatedPoolKeys.id

  // ammCreatePool({
  //   startTime,
  //   addBaseAmount,
  //   addQuoteAmount,
  //   baseToken,
  //   quoteToken,
  //   targetMarketId,
  //   wallet,
  //   walletTokenAccounts,
  // }).then(({ txids }) => {
  //   /** continue with txids */
  //   console.log('txids', txids)
  // })
}
