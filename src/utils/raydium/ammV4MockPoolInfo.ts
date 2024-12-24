import { LIQUIDITY_STATE_LAYOUT_V5, Liquidity } from '@raydium-io/raydium-sdk'
import { PublicKey } from '@solana/web3.js'
import { Connection } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  TokenAccount,
  SPL_ACCOUNT_LAYOUT,
  LIQUIDITY_STATE_LAYOUT_V4,
} from "@raydium-io/raydium-sdk";
import { OpenOrders } from "@project-serum/serum";
import BN from "bn.js";

async function generateV4PoolInfo() {
  // RAY-USDC
  const poolInfo = Liquidity.getAssociatedPoolKeys({
    version: 4,
    marketVersion: 3,
    baseMint: new PublicKey('4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R'),
    quoteMint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
    baseDecimals: 6,
    quoteDecimals: 6,
    programId: new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'),

    marketId: new PublicKey('DZjbn4XC8qoHKikZqzmhemykVzmossoayV9ffbsUqxVj'),
    marketProgramId: new PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX'),
  })

  return { poolInfo }
}

export async function getAmmV4PoolInfo(baseMint, quoteMint, baseDec, quoteDec, programId, marketId, marketProgramId) {
  // RAY-USDC
  const poolInfo = Liquidity.getAssociatedPoolKeys({
    version: 4,
    marketVersion: 3,
    baseMint: new PublicKey(baseMint),
    quoteMint: new PublicKey(quoteMint),
    baseDecimals: baseDec,
    quoteDecimals: quoteDec,
    programId: new PublicKey(programId),

    marketId: new PublicKey(marketId),
    marketProgramId: new PublicKey(marketProgramId),
  })

  return { poolInfo }
}

async function howToUse() {
  generateV4PoolInfo().then(({ poolInfo }) => {
    console.log('poolInfo: ', poolInfo)
  })
}



async function getTokenAccounts(connection: Connection, owner: PublicKey) {
  const tokenResp = await connection.getTokenAccountsByOwner(owner, {
    programId: TOKEN_PROGRAM_ID,
  });

  const accounts: TokenAccount[] = [];
  for (const { pubkey, account } of tokenResp.value) {
    accounts.push({
      programId: TOKEN_PROGRAM_ID,
      pubkey,
      accountInfo: SPL_ACCOUNT_LAYOUT.decode(account.data),
    });
  }

  return accounts;
}
// const OPENBOOK_DEX="srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX";
// const OPENBOOK_DEX_Devnet = "EoTcMgcDRTJVZDMZWBoU6rhYHZfkNTVEAfz3uUJRcYGj";
// raydium pool id can get from api: https://api.raydium.io/v2/sdk/liquidity/mainnet.json
const SOL_USDC_POOL_ID = "FUvpwgNN5yXVS5s2fbs7qTst6bfWmqob8DGSB2gNrhWM";
const OPENBOOK_PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_DEBUG==="true"? "EoTcMgcDRTJVZDMZWBoU6rhYHZfkNTVEAfz3uUJRcYGj" : "srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX"
);  //dev EoTcMgcDRTJVZDMZWBoU6rhYHZfkNTVEAfz3uUJRcYGj

//函数已弃用
export async function parsePoolInfo(connection) {
  //const connection = new Connection("{mainnet rpc node}", "confirmed");
  const owner = new PublicKey("C15wuCYePWPJaRTimLxDgS8j7qewtUSnzKbcJiFUYuF3");

  const tokenAccounts = await getTokenAccounts(connection, owner);

  // example to get pool info
  console.log("example to get pool info")
  const info = await connection.getAccountInfo(new PublicKey(SOL_USDC_POOL_ID));   //对应池子ID
  if (!info) return;

  //console.log("222")
  const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(info.data);
  const openOrders = await OpenOrders.load(
    connection,
    poolState.openOrders,
    OPENBOOK_PROGRAM_ID // OPENBOOK_PROGRAM_ID(marketProgramId) of each pool can get from api: https://api.raydium.io/v2/sdk/liquidity/mainnet.json
  );


  const baseDecimal = 10 ** poolState.baseDecimal.toNumber(); // e.g. 10 ^ 6
  const quoteDecimal = 10 ** poolState.quoteDecimal.toNumber();

  const baseTokenAmount = await connection.getTokenAccountBalance(
    poolState.baseVault
  );
  const quoteTokenAmount = await connection.getTokenAccountBalance(
    poolState.quoteVault
  );

  const basePnl = poolState.baseNeedTakePnl.toNumber() / baseDecimal;
  const quotePnl = poolState.quoteNeedTakePnl.toNumber() / quoteDecimal;

  const openOrdersBaseTokenTotal =
    openOrders.baseTokenTotal.toNumber() / baseDecimal;
  const openOrdersQuoteTokenTotal =
    openOrders.quoteTokenTotal.toNumber() / quoteDecimal;

  const base =
    (baseTokenAmount.value?.uiAmount || 0) + openOrdersBaseTokenTotal - basePnl;
  const quote =
    (quoteTokenAmount.value?.uiAmount || 0) +
    openOrdersQuoteTokenTotal -
    quotePnl;

  const denominator = new BN(10).pow(poolState.baseDecimal);
  //console.log(poolState.lpReserve.toString());
  //denominator.
  

  const addedLpAccount = tokenAccounts.find((a) =>
    a.accountInfo.mint.equals(poolState.lpMint)
  );

  {/*SOL_USDC 
    pool info: 
    pool total base 25000 
    pool total quote 0.909264576 
    base vault balance 25000 
    quote vault balance 0.909264576 
    base tokens in openorders 0 
    quote tokens in openorders  0 
    base token decimals 9 
    quote token decimals 9 
    total lp 150 
    addedLpAmount 149.7700713*/}  //LP数量
    // SOL_USDC pool info: pool total base 25000 pool total quote 0.909264576 base vault balance 25000 quote vault balance 0.909264576 base tokens in openorders 0 quote tokens in openorders  0 base token decimals 9 quote token decimals 9 total lp 150 addedLpAmount 149.7700713
  console.log(
    "SOL_USDC pool info:",
    "pool total base " + base,
    "pool total quote " + quote,

    "base vault balance " + baseTokenAmount.value.uiAmount,
    "quote vault balance " + quoteTokenAmount.value.uiAmount,

    "base tokens in openorders " + openOrdersBaseTokenTotal,
    "quote tokens in openorders  " + openOrdersQuoteTokenTotal,

    "base token decimals " + poolState.baseDecimal.toNumber(),
    "quote token decimals " + poolState.quoteDecimal.toNumber(),
    "total lp " + poolState.lpReserve.div(denominator).toString(),

    "addedLpAmount " +
      (addedLpAccount?.accountInfo.amount.toNumber() || 0) / baseDecimal
  );
}


export async function GetparsePoolInfo(connection, perkey, PoolID) {
  //const connection = new Connection("{mainnet rpc node}", "confirmed");
  //const owner = new PublicKey("C15wuCYePWPJaRTimLxDgS8j7qewtUSnzKbcJiFUYuF3");

  console.log("tokenAccounts111");
  const tokenAccounts = await getTokenAccounts(connection, perkey);
  console.log("tokenAccounts",tokenAccounts);

  // example to get pool info
  console.log("example to get pool info")
  const info = await connection.getAccountInfo(new PublicKey(PoolID));   //对应池子ID
  if (!info) return;

  
  const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(info.data);
  console.log("222");
  const openOrders = await OpenOrders.load(
    connection,
    poolState.openOrders,
    OPENBOOK_PROGRAM_ID // OPENBOOK_PROGRAM_ID(marketProgramId) of each pool can get from api: https://api.raydium.io/v2/sdk/liquidity/mainnet.json
  );
  const baseDecimal = 10 ** poolState.baseDecimal.toNumber(); // e.g. 10 ^ 6
  const quoteDecimal = 10 ** poolState.quoteDecimal.toNumber();
  const baseTokenAmount = await connection.getTokenAccountBalance(
    poolState.baseVault
  );
  const quoteTokenAmount = await connection.getTokenAccountBalance(
    poolState.quoteVault
  );

  
  console.log(poolState.baseNeedTakePnl.toNumber());
  console.log(poolState.quoteNeedTakePnl.toNumber());

  const basePnl = poolState.baseNeedTakePnl.toNumber() / baseDecimal;
  const quotePnl = poolState.quoteNeedTakePnl.toNumber() / quoteDecimal;
  

  const openOrdersBaseTokenTotal =
    openOrders.baseTokenTotal.toNumber() / baseDecimal;
  const openOrdersQuoteTokenTotal =
    openOrders.quoteTokenTotal.toNumber() / quoteDecimal;

  const base =
    (baseTokenAmount.value?.uiAmount || 0) + openOrdersBaseTokenTotal - basePnl;
  const quote =
    (quoteTokenAmount.value?.uiAmount || 0) +
    openOrdersQuoteTokenTotal -
    quotePnl;

  const denominator = new BN(10).pow(poolState.baseDecimal);
  const addedLpAccount = tokenAccounts.find((a) =>
    a.accountInfo.mint.equals(poolState.lpMint)
  );
  

  {/*SOL_USDC 
    pool info: 
    pool total base 25000 
    pool total quote 0.909264576 
    base vault balance 25000 
    quote vault balance 0.909264576 
    base tokens in openorders 0 
    quote tokens in openorders  0 
    base token decimals 9 
    quote token decimals 9 
    total lp 150 
    addedLpAmount 149.7700713*/}  //LP数量
    // SOL_USDC pool info: pool total base 25000 pool total quote 0.909264576 base vault balance 25000 quote vault balance 0.909264576 base tokens in openorders 0 quote tokens in openorders  0 base token decimals 9 quote token decimals 9 total lp 150 addedLpAmount 149.7700713
  console.log(
    "SOL_USDC pool info:",
    "pool total base " + base,
    "pool total quote " + quote,

    "base vault balance " + baseTokenAmount.value.uiAmount,
    "quote vault balance " + quoteTokenAmount.value.uiAmount,

    "base tokens in openorders " + openOrdersBaseTokenTotal,
    "quote tokens in openorders  " + openOrdersQuoteTokenTotal,

    "base token decimals " + poolState.baseDecimal.toNumber(),
    "quote token decimals " + poolState.quoteDecimal.toNumber(),
    "total lp " + poolState.lpReserve.div(denominator).toString(),

    "addedLpAmount " +
      (addedLpAccount?.accountInfo.amount.toNumber() || 0) / baseDecimal
  );
  return {
    base: base,   //基础代币
    quote: quote,  //基础报价代币
    baseBalance: baseTokenAmount.value.uiAmount,  //基础代币余额
    quoteBalance: quoteTokenAmount.value.uiAmount,  //报价代余额
    baseOpenOrder: openOrdersBaseTokenTotal,    //基础代币订单
    quoteOpenOrder: openOrdersQuoteTokenTotal,  //报价代币订单
    baseDec: poolState.baseDecimal.toNumber(),
    quoteDec: poolState.quoteDecimal.toNumber(),
    totalLP: poolState.lpReserve.div(denominator).toString(),
    LpAmount: (addedLpAccount?.accountInfo.amount.toNumber() || 0) / baseDecimal
  }
}

export async function GetparsePoolInfo_NotLPVal(connection, PoolID) {
  //const connection = new Connection("{mainnet rpc node}", "confirmed");
  //const owner = new PublicKey("C15wuCYePWPJaRTimLxDgS8j7qewtUSnzKbcJiFUYuF3");



  // example to get pool info
  console.log("example to get pool info")
  const info = await connection.getAccountInfo(new PublicKey(PoolID));   //对应池子ID
  if (!info) return;

  
  const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(info.data);
  console.log("222");
  const openOrders = await OpenOrders.load(
    connection,
    poolState.openOrders,
    OPENBOOK_PROGRAM_ID // OPENBOOK_PROGRAM_ID(marketProgramId) of each pool can get from api: https://api.raydium.io/v2/sdk/liquidity/mainnet.json
  );
  const baseDecimal = 10 ** poolState.baseDecimal.toNumber(); // e.g. 10 ^ 6
  const quoteDecimal = 10 ** poolState.quoteDecimal.toNumber();
  const baseTokenAmount = await connection.getTokenAccountBalance(
    poolState.baseVault
  );
  const quoteTokenAmount = await connection.getTokenAccountBalance(
    poolState.quoteVault
  );

  const basePnl = poolState.baseNeedTakePnl.toNumber() / baseDecimal;
  const quotePnl = poolState.quoteNeedTakePnl.toNumber() / quoteDecimal;

  const openOrdersBaseTokenTotal =
    openOrders.baseTokenTotal.toNumber() / baseDecimal;
  const openOrdersQuoteTokenTotal =
    openOrders.quoteTokenTotal.toNumber() / quoteDecimal;

  const base =
    (baseTokenAmount.value?.uiAmount || 0) + openOrdersBaseTokenTotal - basePnl;
  const quote =
    (quoteTokenAmount.value?.uiAmount || 0) +
    openOrdersQuoteTokenTotal -
    quotePnl;

  const denominator = new BN(10).pow(poolState.baseDecimal);

  

  {/*SOL_USDC 
    pool info: 
    pool total base 25000 
    pool total quote 0.909264576 
    base vault balance 25000 
    quote vault balance 0.909264576 
    base tokens in openorders 0 
    quote tokens in openorders  0 
    base token decimals 9 
    quote token decimals 9 
    total lp 150 
    addedLpAmount 149.7700713*/}  //LP数量
    // SOL_USDC pool info: pool total base 25000 pool total quote 0.909264576 base vault balance 25000 quote vault balance 0.909264576 base tokens in openorders 0 quote tokens in openorders  0 base token decimals 9 quote token decimals 9 total lp 150 addedLpAmount 149.7700713
  console.log(
    "SOL_USDC pool info:",
    "pool total base " + base,
    "pool total quote " + quote,

    "base vault balance " + baseTokenAmount.value.uiAmount,
    "quote vault balance " + quoteTokenAmount.value.uiAmount,

    "base tokens in openorders " + openOrdersBaseTokenTotal,
    "quote tokens in openorders  " + openOrdersQuoteTokenTotal,

    "base token decimals " + poolState.baseDecimal.toNumber(),
    "quote token decimals " + poolState.quoteDecimal.toNumber(),
    "total lp " + poolState.lpReserve.div(denominator).toString(),

  );
  return {
    base: base,   //基础代币
    quote: quote,  //基础报价代币
    baseBalance: baseTokenAmount.value.uiAmount,  //基础代币余额
    quoteBalance: quoteTokenAmount.value.uiAmount,  //报价代余额
    baseOpenOrder: openOrdersBaseTokenTotal,    //基础代币订单
    quoteOpenOrder: openOrdersQuoteTokenTotal,  //报价代币订单
    baseDec: poolState.baseDecimal.toNumber(),
    quoteDec: poolState.quoteDecimal.toNumber(),
    totalLP: poolState.lpReserve.div(denominator).toString(),
    //LpAmount: (addedLpAccount?.accountInfo.amount.toNumber() || 0) / baseDecimal
  }
}

