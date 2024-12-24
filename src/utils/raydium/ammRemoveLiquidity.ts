import assert from 'assert';

import {
  jsonInfo2PoolKeys,
  Liquidity,
  LiquidityPoolKeys,
  TokenAmount,
  Token
} from '@raydium-io/raydium-sdk';
import { Keypair } from '@solana/web3.js';

import {
  connection,
  DEFAULT_TOKEN,
  makeTxVersion,
  wallet
} from '../config';
import { formatAmmKeysById } from './formatAmmKeysById';
import {
  buildAndSendTx,
  getWalletTokenAccount,
} from './util';
import { PublicKey } from '@metaplex-foundation/js';
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";


type WalletTokenAccounts = Awaited<ReturnType<typeof getWalletTokenAccount>>
type TestTxInputInfo = {
  removeAmount: number | bigint
  targetPool: string
  walletTokenAccounts: WalletTokenAccounts
  publicKey: PublicKey
}

export async function ammRemoveLiquidity(input: TestTxInputInfo) {
  // -------- pre-action: fetch basic info --------
  const targetPoolInfo = await formatAmmKeysById(input.targetPool)
  assert(targetPoolInfo, 'cannot find the target pool');
  console.log("target: ", targetPoolInfo);
  //这里重新构造一下函数
  const lpToken = new Token(TOKEN_PROGRAM_ID, new PublicKey(targetPoolInfo.lpMint), targetPoolInfo.lpDecimals, "TO", "TO"); // LP   //池子ID?
  const removeLpTokenAmount = new TokenAmount(lpToken, input.removeAmount);
  console.log("amount: ",removeLpTokenAmount);

  // -------- step 1: make instructions --------
  const poolKeys = jsonInfo2PoolKeys(targetPoolInfo) as LiquidityPoolKeys
  const removeLiquidityInstructionResponse = await Liquidity.makeRemoveLiquidityInstructionSimple({
    connection,
    poolKeys,
    userKeys: {
      owner: input.publicKey,
      payer: input.publicKey,
      tokenAccounts: input.walletTokenAccounts,
    },
    amountIn: removeLpTokenAmount,
    makeTxVersion,
  })

  return buildAndSendTx(removeLiquidityInstructionResponse.innerTransactions);//{ txids: await buildAndSendTx(removeLiquidityInstructionResponse.innerTransactions) }
}

// OLD参数
// type TestTxInputInfo = {
//   removeLpTokenAmount: TokenAmount
//   targetPool: string
//   walletTokenAccounts: WalletTokenAccounts
//   publicKey: PublicKey
// }
// OLD
// export async function ammRemoveLiquidity(input: TestTxInputInfo) {
//   // -------- pre-action: fetch basic info --------
//   const targetPoolInfo = await formatAmmKeysById(input.targetPool)
//   assert(targetPoolInfo, 'cannot find the target pool');

//   console.log("target pool:", targetPoolInfo);
//   // -------- step 1: make instructions --------
//   const poolKeys = jsonInfo2PoolKeys(targetPoolInfo) as LiquidityPoolKeys
//   const removeLiquidityInstructionResponse = await Liquidity.makeRemoveLiquidityInstructionSimple({
//     connection,
//     poolKeys,
//     userKeys: {
//       owner: input.publicKey,
//       payer: input.publicKey,
//       tokenAccounts: input.walletTokenAccounts,
//     },
//     amountIn: input.removeLpTokenAmount,
//     makeTxVersion,
//   })

//   return buildAndSendTx(removeLiquidityInstructionResponse.innerTransactions);//{ txids: await buildAndSendTx(removeLiquidityInstructionResponse.innerTransactions) }
// }

{/*SOL_USDC 
    pool info: 
    pool total base 25000 //总base
    pool total quote 0.909264576 //总base
    base vault balance 25000   //余额
    quote vault balance 0.909264576 //余额
    base tokens in openorders 0 
    quote tokens in openorders  0 
    base token decimals 9 
    quote token decimals 9 
    total lp 150 
    addedLpAmount 0*/}

async function howToUse() {
  const lpToken = DEFAULT_TOKEN['RAY_USDC-LP'] // LP   //池子ID?
  const removeLpTokenAmount = new TokenAmount(lpToken, 100)  //移除数量
  const targetPool = 'pool id' // RAY-USDC pool
  const walletTokenAccounts = await getWalletTokenAccount(connection, wallet.publicKey)

  // ammRemoveLiquidity({
  //   removeLpTokenAmount,   
  //   targetPool,
  //   walletTokenAccounts,
  //   wallet: wallet,
  // }).then(({ txids }) => {
  //   /** continue with txids */
  //   console.log('txids', txids)
  // })
}


