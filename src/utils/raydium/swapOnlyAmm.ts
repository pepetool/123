import assert from 'assert';

import {
  ApiPoolInfoV4,
  jsonInfo2PoolKeys,
  Liquidity,
  LiquidityPoolInfo,
  LiquidityPoolKeys,
  Percent,
  Token,
  TokenAmount,
} from '@raydium-io/raydium-sdk';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

import {
  connection,
  DEFAULT_TOKEN,
  makeTxVersion,
  wallet
} from '../config';
import { formatAmmKeysById } from './formatAmmKeysById';
import {
  buildAndSendTx,
  buildAndSendTxA,
  getWalletTokenAccount,
} from './util';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';




type WalletTokenAccounts = Awaited<ReturnType<typeof getWalletTokenAccount>>
type TestTxInputInfo = {
  outputToken: Token
  targetPool: string
  inputTokenAmount: TokenAmount
  slippage: Percent
  walletTokenAccounts: WalletTokenAccounts
  wallet: Keypair
}

// let nowPoolInfo: LiquidityPoolInfo;
// let nowTagetPool: ApiPoolInfoV4;

async function swapOnlyAmm(input: TestTxInputInfo) {
  // -------- pre-action: get pool info --------
  //console.log("200");

  const targetPoolInfo = await formatAmmKeysById(input.targetPool)
  assert(targetPoolInfo, 'cannot find the target pool')
  console.log("201");
  const poolKeys = jsonInfo2PoolKeys(targetPoolInfo) as LiquidityPoolKeys

  console.log("002");
  // -------- step 1: coumpute amount out --------
  const { amountOut, minAmountOut } = Liquidity.computeAmountOut({
    poolKeys: poolKeys,
    poolInfo: await Liquidity.fetchInfo({ connection, poolKeys }),
    amountIn: input.inputTokenAmount,
    currencyOut: input.outputToken,
    slippage: input.slippage,
  })


  console.log("003");
  // -------- step 2: create instructions by SDK function --------
  const { innerTransactions } = await Liquidity.makeSwapInstructionSimple({
    connection,
    poolKeys,
    userKeys: {
      tokenAccounts: input.walletTokenAccounts,
      owner: input.wallet.publicKey,
    },
    amountIn: input.inputTokenAmount,
    amountOut: minAmountOut,
    fixedSide: 'in',
    //fixedSide: 'out',
    makeTxVersion,
  })

  console.log('amountOut:', amountOut.toFixed(), '  minAmountOut: ', minAmountOut.toFixed())

  return { txids: await buildAndSendTx(innerTransactions) }
}



function hasDecimal(num) {
  return num % 1 !== 0;
}

export async function swapOnlyAmmA(connect, wallet, nowTagetPool, nowPoolInfo, isBuy, input: TestTxInputInfo, inOut) {
  // -------- pre-action: get pool info --------
  //console.log("200");

  // const targetPoolInfo = await formatAmmKeysById(input.targetPool)
  // assert(targetPoolInfo, 'cannot find the target pool')
  // console.log("201");
  const poolKeys = jsonInfo2PoolKeys(nowTagetPool) as LiquidityPoolKeys
  //FUCK-444:240427: 这个nowTagetPool就不每次获取了,应该每次都是一样的

  // -------- step 1: coumpute amount out --------
  const { amountOut, minAmountOut } = Liquidity.computeAmountOut({
    poolKeys: poolKeys,
    poolInfo: await Liquidity.fetchInfo({ connection: connect, poolKeys }), //nowPoolInfo,  
    amountIn: input.inputTokenAmount,
    currencyOut: input.outputToken,
    slippage: input.slippage,
  })
  //FUCK-444:240427: 这个poolInfo以后想想看有没有更换的办法,因为这里需要等待很久

  // -------- step 2: create instructions by SDK function --------
  const { innerTransactions } = await Liquidity.makeSwapInstructionSimple({
    connection: connect,
    poolKeys,
    userKeys: {
      tokenAccounts: input.walletTokenAccounts,
      owner: input.wallet.publicKey,
    },
    amountIn: input.inputTokenAmount,
    amountOut: minAmountOut,
    fixedSide: inOut,
    //fixedSide: 'out',
    makeTxVersion,
  })

  console.log('amountOut:', amountOut.toFixed(), '  minAmountOut: ', minAmountOut.toFixed());
  let myFees;
  if (isBuy) {
    myFees = Number(input.inputTokenAmount.toFixed()) * 0.01 * LAMPORTS_PER_SOL;
    //处理一下小数问题
    if (hasDecimal(myFees)) {
      if (myFees > 0.0025) {
        myFees = 0.0025
      }
      myFees = Math.floor(myFees);
    }
  } else {
    myFees = Number(amountOut.toFixed()) * 0.01 * LAMPORTS_PER_SOL;
    //处理一下小数问题
    if (hasDecimal(myFees)) {
      if (myFees > 0.0025) {
        myFees = 0.0025
      }
      myFees = Math.floor(myFees);
    }
  }
  //setNowBili(Number(input.inputTokenAmount.toFixed()) / Number(amountOut.toFixed()));

  return { txids: await buildAndSendTxA(connect, wallet, myFees, innerTransactions) }
}

export async function swapOnlyAmmB(connect, wallet, nowTagetPool, nowPoolInfo, input: TestTxInputInfo) {
  // -------- pre-action: get pool info --------
  //console.log("200");

  // const targetPoolInfo = await formatAmmKeysById(input.targetPool)
  // assert(targetPoolInfo, 'cannot find the target pool')
  // console.log("201");
  const poolKeys = jsonInfo2PoolKeys(nowTagetPool) as LiquidityPoolKeys

  // -------- step 1: coumpute amount out --------
  const { amountOut, minAmountOut } = Liquidity.computeAmountOut({
    poolKeys: poolKeys,
    poolInfo: nowPoolInfo,
    amountIn: input.inputTokenAmount,
    currencyOut: input.outputToken,
    slippage: input.slippage,
  })

  // -------- step 2: create instructions by SDK function --------
  // const { innerTransactions } = await Liquidity.makeSwapInstructionSimple({
  //   connection: connect,
  //   poolKeys,
  //   userKeys: {
  //     tokenAccounts: input.walletTokenAccounts,
  //     owner: input.wallet.publicKey,
  //   },
  //   amountIn: input.inputTokenAmount,
  //   amountOut: minAmountOut,
  //   fixedSide: 'in',
  //   //fixedSide: 'out',
  //   makeTxVersion,
  // })

  console.log('amountOut:', amountOut.toFixed(), '  minAmountOut: ', minAmountOut.toFixed());
  console.log(input.inputTokenAmount.toFixed());

  return (Number(input.inputTokenAmount.toFixed()) / Number(amountOut.toFixed()));
  //return { txids: await buildAndSendTxA(connect, wallet, innerTransactions) }
}

// async function initPoolInfo(targetPool:string) {
//   console.log('池子初始化');
//   nowTagetPool = await formatAmmKeysById(targetPool)
//   assert(nowTagetPool, 'cannot find the target pool')
//   console.log(nowTagetPool);
//   const poolKeys = jsonInfo2PoolKeys(nowTagetPool) as LiquidityPoolKeys
//   nowPoolInfo = await Liquidity.fetchInfo({ connection, poolKeys });
//   //https://api.raydium.io/v2/sdk/liquidity/mainnet.json
//   console.log(nowPoolInfo);
//   console.log('池子初始化成功');
// }


async function howToUse() {
  console.log("return~~~~~~~~~");
  return;
  const inputToken = DEFAULT_TOKEN.WSOL // USDC
  const outputToken = new Token(TOKEN_PROGRAM_ID, new PublicKey('ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82'), 6, 'BOME', 'BOME');//DEFAULT_TOKEN.RAY // RAY

  // const outputToken = DEFAULT_TOKEN.WSOL // USDC
  // const inputToken = new Token(TOKEN_PROGRAM_ID, new PublicKey('ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82'), 6, 'BOME', 'BOME');//DEFAULT_TOKEN.RAY // RAY

  const dec = inputToken.decimals;
  const targetPool = 'DSUvc5qf5LJHHV5e2tD184ixotSnCnwj7i4jJa4Xsrmt' // USDC-RAY pool
  const inputTokenAmount = new TokenAmount(inputToken, 82 * Math.pow(10, dec))
  const slippage = new Percent(30, 100)
  console.log("111");
  const walletTokenAccounts = await getWalletTokenAccount(connection, wallet.publicKey)
  //console.log(walletTokenAccounts)
  swapOnlyAmm({
    outputToken,
    targetPool,
    inputTokenAmount,
    slippage,
    walletTokenAccounts,
    wallet: wallet,
  }).then(({ txids }) => {
    /** continue with txids */
    console.log('txids', txids)
  })
}
// howToUse();


async function buyproc(amount: number) {
  const inputToken = DEFAULT_TOKEN.WSOL // USDC
  const outputToken = new Token(TOKEN_PROGRAM_ID, new PublicKey('ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82'), 6, 'BOME', 'BOME');//DEFAULT_TOKEN.RAY // RAY

  // const outputToken = DEFAULT_TOKEN.WSOL // USDC
  // const inputToken = new Token(TOKEN_PROGRAM_ID, new PublicKey('ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82'), 6, 'BOME', 'BOME');//DEFAULT_TOKEN.RAY // RAY

  const dec = inputToken.decimals; //DSUvc5qf5LJHHV5e2tD184ixotSnCnwj7i4jJa4Xsrmt
  const targetPool = '' // USDC-RAY pool DSUvc5qf5LJHHV5e2tD184ixotSnCnwj7i4jJa4Xsrmt
  const inputTokenAmount = new TokenAmount(inputToken, amount * Math.pow(10, dec))
  const slippage = new Percent(30, 100)
  console.log("111");
  const walletTokenAccounts = await getWalletTokenAccount(connection, wallet.publicKey)
  //console.log(walletTokenAccounts)
  // swapOnlyAmmA({
  //   outputToken,
  //   targetPool,
  //   inputTokenAmount,
  //   slippage,
  //   walletTokenAccounts,
  //   wallet: wallet,
  // }).then(({ txids }) => {
  //   /** continue with txids */
  //   console.log('txids', txids)
  // })
}

async function saleproc(amount: number) {
  // const inputToken = DEFAULT_TOKEN.WSOL // USDC
  // const outputToken = new Token(TOKEN_PROGRAM_ID, new PublicKey('ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82'), 6, 'BOME', 'BOME');//DEFAULT_TOKEN.RAY // RAY

  const outputToken = DEFAULT_TOKEN.WSOL // USDC
  const inputToken = new Token(TOKEN_PROGRAM_ID, new PublicKey('ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82'), 6, 'BOME', 'BOME');//DEFAULT_TOKEN.RAY // RAY

  const dec = inputToken.decimals; //DSUvc5qf5LJHHV5e2tD184ixotSnCnwj7i4jJa4Xsrmt
  const targetPool = '' // USDC-RAY pool DSUvc5qf5LJHHV5e2tD184ixotSnCnwj7i4jJa4Xsrmt
  const inputTokenAmount = new TokenAmount(inputToken, amount * Math.pow(10, dec))
  const slippage = new Percent(30, 100)
  console.log("111");
  const walletTokenAccounts = await getWalletTokenAccount(connection, wallet.publicKey)
  //console.log(walletTokenAccounts)
  // swapOnlyAmmA({
  //   outputToken,
  //   targetPool,
  //   inputTokenAmount,
  //   slippage,
  //   walletTokenAccounts,
  //   wallet: wallet,
  // }).then(({ txids }) => {
  //   /** continue with txids */
  //   console.log('txids', txids)
  // })
}


