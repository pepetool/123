import {
  ENDPOINT as _ENDPOINT,
  Currency,
  LOOKUP_TABLE_CACHE,
  MAINNET_PROGRAM_ID,
  RAYDIUM_MAINNET,
  DEVNET_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
  TxVersion,
} from '@raydium-io/raydium-sdk';
import {
  Connection,
  Keypair,
  PublicKey,
} from '@solana/web3.js';

//import { useWallet, useConnection } from '@solana/wallet-adapter-react';

//export const rpcUrl: string = 'https://xxx.xxx.xxx/'
export const rpcToken: string | undefined = undefined

//export const wallet = Keypair.fromSecretKey(Buffer.from('<YOUR_WALLET_SECRET_KEY>'))
//export const wallet = useWallet();
//export let wallet;
export let EmvLevel:number = -1;
export let EMVFEE: number = 0.00003;
export function setEmvFee(v){
  EMVFEE = v;
}

export function setEmvLevel(v){
  EmvLevel = v;
}

export let GAS_LEVEL: number = 1;  //0默认 1加速  2加倍

export function setGasLevel(v) {
  GAS_LEVEL = v;
  localStorage.setItem('foxtool.cc-gasfees', GAS_LEVEL.toString());
}

export function getGasLevel() {
  const loc = localStorage.getItem('foxtool.cc-gasfees');
  console.log("gasloc", loc);
  if (loc) {
    GAS_LEVEL = Number(loc);
  }
}

export function getGasLevelStr() {
  getGasLevel();
  switch (GAS_LEVEL) {
    case 0:
      return "0";
    case 1:
      return "1x";
    case 2:
      return "2x";
  }
}

let NowRpc_ID : number = 0;

export let FOX_RpcList = [
  {
    id: 1,
    name: "Quiknode",
    addr: "https://mainnet.helius-rpc.com/?api-key=1f04ab69-b856-453e-a12f-b59e6ad4dd35",
    ping: 0
  },
  {
    id: 2,
    name: "Helius",
    addr: "https://mainnet.helius-rpc.com/?api-key=626ddbc2-6ebc-44bd-8b34-def511ec5856",
    ping: 0
  },
  {
    id: 3,
    name: "Getblock",
    addr: "https://go.getblock.io/5efcf151543949e5b3ba9620ebf5a02a",
    ping: 0
  }
];

function getRpcByID(id){
  // 使用 find 方法找到匹配的 RPC 对象
  const rpc = FOX_RpcList.find(item => item.id === id);
  return rpc || null; // 如果未找到匹配项，则返回 null
}

export function getPublicRpc(){
  const rpc = getRpcByID(NowRpc_ID);
  if(rpc){
    return rpc.addr;
  }else{
    return FOX_RpcList[0].addr;
  }
}

export function setNowRPCId(id){
  NowRpc_ID = id;
}


//export const wallet: { publicKey: PublicKey; };
export let wallet;//: ReturnType<typeof useWallet> | null = null;

export function setWallet(w) {
  wallet = w;
}

//export const connection = new Connection('<YOUR_RPC_URL>');
//export const { connection }= useConnection(); //修改成钱包适配器的connection
export let connection;

export function setConnection(w) {
  connection = w;
}

export let nowGasFree = 0;

export function setGasFree(free) {
  nowGasFree = free;
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


// export let nowBili:number = 0;

// export function getNowBili(){
//   return nowBili;
// }

// export function setNowBili(bili){
//   nowBili = bili;
// }


export const PROGRAMIDS = process.env.NEXT_PUBLIC_DEBUG === "true" ? DEVNET_PROGRAM_ID : MAINNET_PROGRAM_ID;  //MAINNET_PROGRAM_ID; || //DEVNET_PROGRAM_ID      //这里使用的是开发网

export const ENDPOINT = _ENDPOINT;

export const RAYDIUM_MAINNET_API = RAYDIUM_MAINNET;

export const makeTxVersion = TxVersion.LEGACY; //TxVersion.LEGACY;  || //TxVersion.V0;   //这里使用V0信息

export const addLookupTableInfo = LOOKUP_TABLE_CACHE // only mainnet. other = undefined

export const DEFAULT_TOKEN = {
  'SOL': new Currency(9, 'USDC', 'USDC'),
  'WSOL': new Token(TOKEN_PROGRAM_ID, new PublicKey('So11111111111111111111111111111111111111112'), 9, 'WSOL', 'WSOL'),
  'USDC': new Token(TOKEN_PROGRAM_ID, new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), 6, 'USDC', 'USDC'),
  'RAY': new Token(TOKEN_PROGRAM_ID, new PublicKey('4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R'), 6, 'RAY', 'RAY'),
  'RAY_USDC-LP': new Token(TOKEN_PROGRAM_ID, new PublicKey('FGYXP4vBkMEtKhxrmEBcWN8VNmXX8qNgEJpENKDETZ4Y'), 6, 'RAY-USDC', 'RAY-USDC'),
}

