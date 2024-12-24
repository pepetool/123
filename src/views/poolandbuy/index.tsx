// Next, React
import { FC, useState, useEffect, useRef } from 'react';
// Wallet
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import Select from 'react-select';
import { notify } from 'utils/notifications';
import {
  burntokensAndcloseacc,
  burntokens,
} from '../../utils/web3';
import { getTokenAccounts, getMetadata, truncateString, getImageUri } from '../../utils/gettoken';
import Loading from 'components/Loading';
import {
  LAMPORTS_PER_SOL, PublicKey, Connection, Keypair, Transaction, SystemProgram, TransactionMessage,
  TransactionInstruction,
  VersionedTransaction,
  BlockhashWithExpiryBlockHeight
} from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  NATIVE_MINT, ACCOUNT_SIZE,
  getAssociatedTokenAddress,
  createAccount,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
  createAssociatedTokenAccountInstruction,

} from "@solana/spl-token";
import {
  getMint,
  createInitializeAccountInstruction
} from "@solana/spl-token"
import { DexInstructions, Market } from "@project-serum/serum";

import {
  getVaultOwnerAndNonce,
} from "../../utils/serum";
//import dynamic from 'next/dynamic';
//const ServerOnlyComponent = dynamic(() => import('../path/to/server-only-component'), { ssr: false });
import BN from "bn.js";

import {
  sendSignedTransaction,
  signTransactions,
  TransactionWithSigners,
} from "../../utils/transaction";

import { toast } from "react-toastify";
import TransactionToast from "../../utils/TransactionToast";


import { min } from 'date-fns';
import { useTranslation } from 'next-i18next'
import { usesBeet } from '@metaplex-foundation/mpl-token-metadata';
import { Collapse, CollapseProps, DatePicker, FloatButton, Radio, RadioChangeEvent, Space } from 'antd';
import Link from 'next/link';
import bs58 from "bs58"


import {
  //ENDPOINT as _ENDPOINT,
  Currency,
  LOOKUP_TABLE_CACHE,
  MAINNET_PROGRAM_ID,
  RAYDIUM_MAINNET,
  Token,
  //TOKEN_PROGRAM_ID,
  TxVersion,
  TokenAmount,
  Percent,
} from '@raydium-io/raydium-sdk';

import {
  //buildAndSendTx,
  getWalletTokenAccount,
} from '../../utils/raydium/util';

import {
  calcMarketStartPrice,
  getMarketAssociatedPoolKeys,
  getWallet,
  getConnection,
  ammCreatePool,
} from '../../utils/raydium/ammCreatePool'

import {
  ammAddLiquidity
} from '../../utils/raydium/ammAddLiquidity'

import {
  setWallet,
  setConnection,
} from '../../utils/config';


import { getAmmV4PoolInfo, parsePoolInfo } from '../../utils/raydium/ammV4MockPoolInfo'
import MsgBoxView, { MessageBoxPam, useMessageBoxPam } from 'views/msgbox';
import LogoImage from 'utils/imageParam';
import useUserSOLBalanceStore from 'stores/useUserSOLBalanceStore';
import axios from 'axios';
import { getRandomTipAccount } from 'utils/jito/config';
import { getKeys, getKeys_wallet, swap_Buy, swap_Buy_Wallet } from 'utils/raydium/rayFunction';
import { sendBundle } from 'utils/jito/jito';
//import { initJitoClient, sendBundle } from 'utils/jito/jito';
//import { initJitoClient, sendBundle } from 'utils/jito/jito';
//import useJitoClient from 'utils/jito/useJitoClient';


//import { connect as configWallet } from '../../utils/config';


export const EVENT_QUEUE_LENGTH = 2978;
export const EVENT_SIZE = 88;
export const EVENT_QUEUE_HEADER_SIZE = 32;

export const REQUEST_QUEUE_LENGTH = 63;
export const REQUEST_SIZE = 80;
export const REQUEST_QUEUE_HEADER_SIZE = 32;

export const ORDERBOOK_LENGTH = 909;
export const ORDERBOOK_NODE_SIZE = 72;
export const ORDERBOOK_HEADER_SIZE = 40;


const TRANSACTION_MESSAGES = [
  {
    sendingMessage: "创建薄荷糖",
    successMessage: "创建薄荷糖成功",
  },
  {
    sendingMessage: "创建交易对",
    successMessage: "创建交易对成功",
  },
  {
    sendingMessage: "创建市场",
    successMessage: "创建市场成功",
  },
];


export function calculateTotalAccountSize(
  individualAccountSize: number,
  accountHeaderSize: number,
  length: number
) {
  const accountPadding = 12;
  const minRequiredSize =
    accountPadding + accountHeaderSize + length * individualAccountSize;

  const modulo = minRequiredSize % 8;

  return modulo <= 4
    ? minRequiredSize + (4 - modulo)
    : minRequiredSize + (8 - modulo + 4);
}

export function calculateAccountLength(
  totalAccountSize: number,
  accountHeaderSize: number,
  individualAccountSize: number
) {
  const accountPadding = 12;
  return Math.floor(
    (totalAccountSize - accountPadding - accountHeaderSize) /
    individualAccountSize
  );
}


let tokenlist = [];
let tranList = [];
let tranCount;

let wallet1, wallet2, wallet3;


let jitoLevelRef;
export const PoolAndBuyView: FC = ({ }) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signMessage, signTransaction, signAllTransactions } = useWallet();
  const [isChecked, setisChecked] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedBJOption, setSelectedBJOption] = useState(null);
  const [selectedJitoOption, setSelectedJitoOption] = useState(null);
  //const { sendBundle } = useJitoClient();


  const [options, setOptions] = useState([]);
  const [bjoptions, setbjOptions] = useState([]);
  const balance = useUserSOLBalanceStore((s) => s.balance);
  const { getUserSOLBalance } = useUserSOLBalanceStore();
  const [buyMode, setBuyMode] = useState(0);  //0钱包买入  1私钥买入
  const [wallet1Key, setWallet1Key] = useState("钱包地址");
  const [wallet1Balance, setWallet1Balance] = useState(0);
  const [wallet1Buy, setWallet1Buy] = useState(0);
  const [wallet2Key, setWallet2Key] = useState("钱包地址");
  const [wallet2Balance, setWallet2Balance] = useState(0);
  const [wallet2Buy, setWallet2Buy] = useState(0);
  const [wallet3Key, setWallet3Key] = useState("钱包地址");
  const [wallet3Balance, setWallet3Balance] = useState(0);
  const [wallet3Buy, setWallet3Buy] = useState(0);
  const [jitoLevel, setjitoLevel] = useState(1);
  //const jitoLevelRef = useRef(jitoLevel);

  useEffect(() => {
    jitoLevelRef = jitoLevel;
    if (wallet.publicKey) {
      console.log(wallet.publicKey.toBase58());
      getUserSOLBalance(wallet.publicKey, connection);
    }
  }, [wallet.publicKey, connection, getUserSOLBalance, jitoLevel])


  const jitoOptions = [
    { value: 'https://amsterdam.mainnet.block-engine.jito.wtf', label: 'https://amsterdam.mainnet.block-engine.jito.wtf' },
    { value: 'https://frankfurt.mainnet.block-engine.jito.wtf', label: 'https://frankfurt.mainnet.block-engine.jito.wtf' },
    { value: 'https://tokyo.mainnet.block-engine.jito.wtf', label: 'https://tokyo.mainnet.block-engine.jito.wtf' },
    { value: 'https://ny.mainnet.block-engine.jito.wtf', label: 'https://ny.mainnet.block-engine.jito.wtf' }
  ];





  //const [tokentotal, setTokentotal] = useState(0);
  //const [signature, setSignature] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  //const [isnextCheck, setNextCheck] = useState(false);
  //const [tokencount, setTokenCount] = useState(0);
  //const [tokenamount, setTokenAmount] = useState(0);
  //const op = ["111","222"];
  const { t } = useTranslation('common')

  const [odval, setodval] = useState(100);
  const [bdval, setbdval] = useState(50);
  const [isdefpz, setIsdefpz] = useState(false);
  const [sjdl, setsjdl] = useState(128);
  const [qqdl, setqqdl] = useState(63);
  const [dddl, setdddl] = useState(201);

  const [selectedTime, setSelectedTime] = useState(null);

  const [baseamt, setbaseamt] = useState(0);
  const [quoteamt, setquoteamt] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const initialPam: MessageBoxPam = {
    addrTag: '',
    addrName: '',
    addr1: '',
    hxName: '',
    hxAddr: ''
  };
  const [messageBoxPam, updateMessageBoxPam] = useMessageBoxPam(initialPam);
  const tempconnect = new Connection(process.env.NEXT_PUBLIC_RPC);

  useEffect(() => {
    // 当 val1 发生变化时，更新 val2
    if (selectedOption) {
      setbaseamt(selectedOption.amount / 100 * odval);
    }

    //setodval(baseamt);
  }, [odval, selectedOption]);

  useEffect(() => {
    // 当 val1 发生变化时，更新 val2
    if (selectedBJOption) {
      setquoteamt(selectedBJOption.amount / 100 * bdval);
    }

    //setodval(baseamt);
  }, [bdval, selectedBJOption]);


  const handleSetWallet1 = async (event: React.ChangeEvent<HTMLInputElement>) => {
    //
    const value = event.target.value;//parseInt(event.target.value, 10);
    //console.log(value);
    if (value !== "") {
      try {
        wallet1 = Keypair.fromSecretKey(bs58.decode(value));
        setWallet1Key(wallet1.publicKey.toString());
        try {
          const sol = await connection.getBalance(wallet1.publicKey, 'confirmed');
          console.log("钱包1SOL:", sol);
          setWallet1Balance(sol / LAMPORTS_PER_SOL);
        } catch (err) {
          console.log(err);
          //setWallet1Key("私钥填写错误");
          notify({ type: "error", message: "错误", description: "获取余额失败,请尝试重新填写私钥或手动确认" })
          setWallet1Balance(0);
        }
      } catch (err) {
        console.log(err);
        setWallet1Key("私钥填写错误");
      }
    } else {
      setWallet1Key("钱包地址");
    }
  }

  const handleSetWallet1Buy = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;//parseInt(event.target.value, 10);
    //console.log(value);
    if (value !== "") {
      const buy = parseFloat(value);
      setWallet1Buy(buy);
    }
  }
  //const [isDisMytoken, setDisMytoken] = useState(false);

  const handleSetWallet2 = async (event: React.ChangeEvent<HTMLInputElement>) => {
    //
    const value = event.target.value;//parseInt(event.target.value, 10);
    //console.log(value);
    if (value !== "") {
      try {
        wallet2 = Keypair.fromSecretKey(bs58.decode(value));
        setWallet2Key(wallet2.publicKey.toString());
        try {
          const sol = await connection.getBalance(wallet2.publicKey, 'confirmed');
          console.log("钱包2SOL:", sol);
          setWallet2Balance(sol / LAMPORTS_PER_SOL);
        } catch (err) {
          console.log(err);
          //setWallet1Key("私钥填写错误");
          notify({ type: "error", message: "错误", description: "获取余额失败,请尝试重新填写私钥或手动确认" })
          setWallet2Balance(0);
        }
      } catch (err) {
        console.log(err);
        setWallet2Key("私钥填写错误");
      }
    } else {
      setWallet2Key("钱包地址");
    }
  }

  const handleSetWallet2Buy = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;//parseInt(event.target.value, 10);
    //console.log(value);
    if (value !== "") {
      const buy = parseFloat(value);
      setWallet2Buy(buy);
    }
  }

  const handleSetWallet3 = async (event: React.ChangeEvent<HTMLInputElement>) => {
    //
    const value = event.target.value;//parseInt(event.target.value, 10);
    //console.log(value);
    if (value !== "") {
      try {
        wallet3 = Keypair.fromSecretKey(bs58.decode(value));
        setWallet3Key(wallet3.publicKey.toString());
        try {
          const sol = await connection.getBalance(wallet3.publicKey, 'confirmed');
          console.log("钱包3SOL:", sol);
          setWallet3Balance(sol / LAMPORTS_PER_SOL);
        } catch (err) {
          console.log(err);
          //setWallet1Key("私钥填写错误");
          notify({ type: "error", message: "错误", description: "获取余额失败,请尝试重新填写私钥或手动确认" })
          setWallet3Balance(0);
        }
      } catch (err) {
        console.log(err);
        setWallet3Key("私钥填写错误");
      }
    } else {
      setWallet3Key("钱包地址");
    }
  }

  const handleSetWallet3Buy = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;//parseInt(event.target.value, 10);
    //console.log(value);
    if (value !== "") {
      const buy = parseFloat(value);
      setWallet3Buy(buy);
    }
  }

  const text = `
  A dog is a type of domesticated animal.
  Known for its loyalty and faithfulness,
  it can be found as a welcome guest in many households across the world.
`;

  const items: CollapseProps['items'] = [
    {
      key: '1',
      label: wallet1Buy === 0 ? "钱包1" : `钱包1 - 买入 ${wallet1Buy}`,
      children:
        <div className='space-y-2'>
          <label className="input input-bordered flex bg-stone-100 border-slate-300 items-center gap-2">
            <input type="text" className="grow bg-stone-100" placeholder="钱包私钥" onChange={handleSetWallet1} />
            <span className="badge badge-info">粘贴</span>
          </label>
          <label className="input input-bordered flex bg-stone-100 border-slate-300 items-center gap-2">
            <input type="text" className="grow bg-stone-100" placeholder="钱包地址" value={wallet1Key} />
            <span className="badge ">余额: {wallet1Balance} SOL</span>
          </label>
          <label className="input input-bordered flex bg-stone-100 border-slate-300 items-center gap-2">
            <input type="text" className="grow bg-stone-100" placeholder="买入数量" onChange={handleSetWallet1Buy} />
            <span className="badge ">SOL</span>
          </label>
        </div>,
    },
    {
      key: '2',
      label: wallet2Buy === 0 ? "钱包2" : `钱包2 - 买入 ${wallet2Buy}`,
      children:
        <div className='space-y-2'>
          <label className="input input-bordered flex bg-stone-100 border-slate-300 items-center gap-2">
            <input type="text" className="grow bg-stone-100" placeholder="钱包私钥" onChange={handleSetWallet2} />
            <span className="badge badge-info">粘贴</span>
          </label>
          <label className="input input-bordered flex bg-stone-100 border-slate-300 items-center gap-2">
            <input type="text" className="grow bg-stone-100" placeholder="钱包地址" value={wallet2Key} />
            <span className="badge ">余额: {wallet2Balance} SOL</span>
          </label>
          <label className="input input-bordered flex bg-stone-100 border-slate-300 items-center gap-2">
            <input type="text" className="grow bg-stone-100" placeholder="买入数量" onChange={handleSetWallet2Buy} />
            <span className="badge ">SOL</span>
          </label>
        </div>,
    },
    {
      key: '3',
      label: wallet3Buy === 0 ? "钱包3" : `钱包3 - 买入 ${wallet3Buy}`,
      children:
        <div className='space-y-2'>
          <label className="input input-bordered flex bg-stone-100 border-slate-300 items-center gap-2">
            <input type="text" className="grow bg-stone-100" placeholder="钱包私钥" onChange={handleSetWallet3} />
            <span className="badge badge-info">粘贴</span>
          </label>
          <label className="input input-bordered flex bg-stone-100 border-slate-300 items-center gap-2">
            <input type="text" className="grow bg-stone-100" placeholder="钱包地址" value={wallet3Key} />
            <span className="badge ">余额: {wallet3Balance} SOL</span>
          </label>
          <label className="input input-bordered flex bg-stone-100 border-slate-300 items-center gap-2">
            <input type="text" className="grow bg-stone-100" placeholder="买入数量" onChange={handleSetWallet3Buy} />
            <span className="badge ">SOL</span>
          </label>
        </div>,
    },
  ];

  function roundUp(num) {
    return Math.ceil(num);
  }

  const getSolBalance = async () => {
    let balance = 0;
    try {
      balance = await connection.getBalance(
        publicKey,
        'confirmed'
      );
      balance = balance / LAMPORTS_PER_SOL;
      return balance;
    } catch (e) {
      console.log(`error getting balance: `, e);
      return 0;
    }
  }

  async function displaytokentocombox(isAll, keystr?: string) {

    if (isAll) {
      setOptions([]);
      for (let i = 0; i < tokenlist.length; i++) {
        if (tokenlist[i].isToken) {
          const newOption = {
            value: i,   //(数量:${tokenlist[i].amount / Math.pow(10, 9)})
            label:
              <div className="flex justify-between">
                <div className="flex items-center">
                  {/* <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200">
                    <LogoImage src={await getImageUri(tokenlist[i].uri)} alt='LOGO' />
                  </div> */}
                  <span className="text-rose-600 text-xs ml-2">{tokenlist[i].symbol}</span>
                  <span className="text-stone-500 text-xs ml-2">{truncateString(tokenlist[i].label, 16, 8, 8)}</span>
                </div>
                <span className="text-rose-400 text-xs">余额: {tokenlist[i].amount / Math.pow(10, 9)}</span>
              </div>,
            mint: tokenlist[i].label,
            address: tokenlist[i].address,
            owner: tokenlist[i].owner,
            amount: tokenlist[i].amount / LAMPORTS_PER_SOL,
            symbol: tokenlist[i].symbol,
            dec: tokenlist[i].dec,
          };
          setOptions(prevOptions => [...prevOptions, newOption]);

        } else {
          const newOption = {
            value: i,     //(数量:${tokenlist[i].amount / Math.pow(10, 9)}) 
            label:
              <div className="flex justify-between">
                <span className="text-gray-800 text-xs">Token - {tokenlist[i].label}</span>
                <span className="text-gray-400 text-xs">余额:{tokenlist[i].amount / LAMPORTS_PER_SOL}</span>
              </div>,
            //<div style={{display: 'flex', justifyContent: 'space-between'}}>Tokens - {tokenlist[i].label}<span style={{fontSize: '0.8em'}}>余额:{roundUp(tokenlist[i].amount  / Math.pow(10, 9))}</span></div>, 
            mint: tokenlist[i].label,
            address: tokenlist[i].address,
            owner: tokenlist[i].owner,
            amount: tokenlist[i].amount / LAMPORTS_PER_SOL,
            dec: tokenlist[i].dec,
          };
          setOptions(prevOptions => [...prevOptions, newOption]);
        }
      }
    } else {
      //获取SOL
      //let newOption;
      const Solbalance = await getSolBalance();
      setbjOptions([]);
      const newOption = {
        value: 0,   //(数量:${tokenlist[i].amount / Math.pow(10, 9)})
        label:
          <div className="flex justify-between">
            <span className="text-gray-800">SOL</span>
            <span className="text-gray-400 text-xs">余额:{Solbalance}</span>
          </div>,
        mint: "SOL",
        address: "SOL",
        symbol: "SOL",
        amount: Solbalance
      };
      setbjOptions(prevOptions => [...prevOptions, newOption]);
      for (let i = 0; i < tokenlist.length; i++) {
        if (tokenlist[i].isToken) {
          const newOption = {
            value: i,   //(数量:${tokenlist[i].amount / Math.pow(10, 9)})
            label:
              <div className="flex justify-between">
                <span className="text-gray-800 text-xs">{tokenlist[i].symbol} - {tokenlist[i].label}</span>
                <span className="text-gray-400 text-xs">余额:{tokenlist[i].amount / LAMPORTS_PER_SOL}</span>
              </div>,
            mint: tokenlist[i].label,
            address: tokenlist[i].address,
            owner: tokenlist[i].owner,
            amount: tokenlist[i].amount / LAMPORTS_PER_SOL,
            symbol: tokenlist[i].symbol,
            dec: tokenlist[i].dec,
          };
          setbjOptions(prevOptions => [...prevOptions, newOption]);
        } else {
          const newOption = {
            value: i,     //(数量:${tokenlist[i].amount / Math.pow(10, 9)}) 
            label:
              <div className="flex justify-between">
                <span className="text-gray-800 text-xs">Token - {tokenlist[i].label}</span>
                <span className="text-gray-400 text-xs">余额:{tokenlist[i].amount / LAMPORTS_PER_SOL}</span>
              </div>,
            //<div style={{display: 'flex', justifyContent: 'space-between'}}>Tokens - {tokenlist[i].label}<span style={{fontSize: '0.8em'}}>余额:{roundUp(tokenlist[i].amount  / Math.pow(10, 9))}</span></div>, 
            mint: tokenlist[i].label,
            address: tokenlist[i].address,
            owner: tokenlist[i].owner,
            amount: tokenlist[i].amount / LAMPORTS_PER_SOL,
            dec: tokenlist[i].dec,
          };
          setbjOptions(prevOptions => [...prevOptions, newOption]);
        }
      }


      // const newOption2 = {
      //   value: 1,   //(数量:${tokenlist[i].amount / Math.pow(10, 9)})
      //   label:
      //     <div className="flex justify-between">
      //       <span className="text-gray-800">USDC</span>
      //       <span className="text-gray-400 text-sm">EPjFWdd5..........ZwyTDt1v</span>
      //     </div>,
      //   mint: "USDC",
      //   address: "USDC",
      //   amount: 0
      // };
      // setbjOptions(prevOptions => [...prevOptions, newOption2]);


      // const newOption3 = {
      //   value: 2,   //(数量:${tokenlist[i].amount / Math.pow(10, 9)})
      //   label:
      //     <div className="flex justify-between">
      //       <span className="text-gray-800">USDT</span>
      //       <span className="text-gray-400 text-sm">Es9vMFrz..........8BenwNYB</span>
      //     </div>,
      //   mint: "USDT",
      //   address: "USDT",
      //   amount: 0
      // };
      // setbjOptions(prevOptions => [...prevOptions, newOption3]);

    }
  }

  const handleChange = selectedOption => {
    //setNextCheck(false);
    setSelectedOption(selectedOption);
  };

  const handleBJChange = selectedOption => {
    //setNextCheck(false);
    setSelectedBJOption(selectedOption);
  };

  const handleJitoChange = selectedOption => {
    //setNextCheck(false);
    setSelectedJitoOption(selectedOption);
  };



  function countDecimalPlaces(num) {
    // 将数字转换为字符串，并提取小数点后的部分
    const decimalPart = String(num).split('.')[1];
    // 如果不存在小数点，或者小数点后部分为空，则返回 0
    if (!decimalPart) {
      return 0;
    }
    // 返回小数点后部分的长度
    return decimalPart.length;
  }

  //确定转账
  const handleEnterbtnclick = async () => {

    // const payWallet = Keypair.fromSecretKey(bs58.decode("2hBAU7N9kxSCsA2DNtqC8qzD4jMuXDWUHVseW1FK6Z1KoAf3Dfixwn1hshHmVA8jei4Ca68GbtE7m36DB3z9xrGF"));
    // const latestBlockhash = await connection.getLatestBlockhash();
    // //编译Jito费用
    // const jitTipTxFeeMessage = new TransactionMessage({
    //     payerKey: payWallet.publicKey,
    //     recentBlockhash: latestBlockhash.blockhash,
    //     instructions: [
    //         SystemProgram.transfer({
    //             fromPubkey: payWallet.publicKey,
    //             //dev
    //             //toPubkey: new PublicKey("B1mrQSpdeMU9gCvkJ6VsXVVoYjRGkNA7TtjMyqxrhecH"),
    //             //mian
    //             toPubkey: new PublicKey("96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5"),
    //             lamports: 0.001 * LAMPORTS_PER_SOL,
    //         }),
    //     ],
    // }).compileToV0Message();
    // const jitoFeeTx = new VersionedTransaction(jitTipTxFeeMessage);
    // jitoFeeTx.sign([payWallet]);
    // //------------

    // const jitTipTxFeeMessage1 = new TransactionMessage({
    //     payerKey: payWallet.publicKey,
    //     recentBlockhash: latestBlockhash.blockhash,
    //     instructions: [
    //         SystemProgram.transfer({
    //             fromPubkey: payWallet.publicKey,
    //             toPubkey: new PublicKey("EdNy4JjhxwcWihg57kMvNDBTsEgqPMetggbySattbxPD"),
    //             lamports: 0.001 * LAMPORTS_PER_SOL,
    //         }),
    //     ],
    // }).compileToV0Message();
    // const jitoFeeTx1 = new VersionedTransaction(jitTipTxFeeMessage1);    
    // jitoFeeTx1.sign([payWallet]);

    // //const res = await bull_dozer(connection, jitoFeeTx, jitoFeeTx1);
    // //console.log("bull dozer response ====>", res);
    // let bundle = []
    // const serializedjitoFeeTx = bs58.encode(jitoFeeTx.serialize());
    // const serializedTransaction = bs58.encode(jitoFeeTx1.serialize());

    // const iTx = new Transaction();
    // const money = Number(process.env.NEXT_PUBLIC_PRICE_CREATE);
    // const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
    // iTx.add(SystemProgram.transfer({   //SystemProgram代表sol
    //   fromPubkey: payWallet.publicKey,
    //   toPubkey: mykey,
    //   lamports: 0.001 * Math.pow(10, 9)
    // }
    // ));
    // iTx.feePayer = payWallet.publicKey;
    // iTx.recentBlockhash = latestBlockhash.blockhash;
    // iTx.sign(payWallet);
    // const serializedjitoFeeTx2 = bs58.encode(iTx.serialize());

    // bundle.push(serializedjitoFeeTx);
    // bundle.push(serializedTransaction);
    // bundle.push(serializedjitoFeeTx2);
    // //let mainBundle = new Bundle(bundle, 2)
    // await sendBundle(bundle)
    // bundle = []
    // bundle.length = 0
    // return;
    //=========================
    //-----------                  So11111111111111111111111111111111111111112
    // setmarkidaddr("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")
    // return;
    if (!wallet || !publicKey) {
      console.log("钱包未连接");
      notify({ type: "error", message: "钱包未连接" })
      return;
    }

    //-------
    let walletModeNum;
    if (buyMode === 0) {
      const walbuydoc = document.getElementById('walletbuynum') as HTMLInputElement | null;
      const walbuystr = walbuydoc?.value;
      if (walbuystr === "") {
        notify({ type: "error", message: "请填写买入数量" })
        return;
      }
      walletModeNum = Number(walbuystr);
    } else {
      if (wallet1Buy === 0 && wallet2Buy === 0 && wallet3Buy === 0) {
        notify({ type: "error", message: "请填写私钥买入数量" })
        return;
      } else {
        if (!wallet1 && !wallet2 && !wallet3) {
          notify({ type: "error", message: "请确认私钥填写是否正确!" })
          return;
        }
      }
    }



    // const mysiyao = "4vZ3FGd9NaGwpBJNDyahMJuiTxCESrbFiETDa1qUCgC5xnbBCrBftfF2r2aV1qZasnnVmKLDrdoKMthkd9V7371W";
    // const userWalleta = Keypair.fromSecretKey(bs58.decode(mysiyao));
    // console.log(userWalleta.publicKey.toString());
    // return;
    //configWallet = wallet;
    //configConnection = connection;
    //console.log('1');
    setWallet(wallet);
    setConnection(connection);
    //console.log('poolwconnection', connection);
    //getConnection();
    //return;

    //---------获取池子信息
    // parsePoolInfo(connection);
    // return;

    const openbookdoc = document.getElementById('openbookid') as HTMLInputElement | null;
    const openbookid = openbookdoc?.value;
    if (openbookid === "") {
      notify({ type: "error", message: "请填写OpenBookID" })
      return;
    }
    // console.log(openbookid)
    // return;

    if (!selectedOption || !selectedBJOption) {
      notify({ type: "error", message: "请选择基础代币和报价代币" })
      return;
    }

    if (baseamt === 0 || quoteamt === 0) {
      notify({ type: "error", message: "请填写基础代币和报价代币的数量" })
      return;
    }

    // const openbookdoc = document.getElementById('openbookid') as HTMLInputElement | null;
    // const openbookid = openbookdoc?.value;
    // if (openbookid==="") {
    //   notify({ type: "error", message: "请填写openbookID" })
    //   return;
    // }
    // console.log(openbookid)
    // return;

    const soladdr = "So11111111111111111111111111111111111111112";
    const usdcaddr = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    const usdtaddr = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
    const baseMintstr = selectedOption.mint.toString();
    let baseMintdec = selectedOption.dec;//############################暂时手动9
    if (!baseMintdec) (baseMintdec = 9);
    console.log("baseMintdec:", baseMintdec);

    const baseMintSymbol = selectedOption.symbol;
    const baseMintAmount = baseamt;//selectedOption.amount;   //这里先定义这个总数

    // const log = `基础代币: ${selectedOption.mint.toString()} 
    // 报价代币: ${selectedBJOption.mint.toString()}
    // 最小订单数: ${odval}
    // 最小价格变动: ${bdval}
    // 事件: ${sjdl}
    // 请求: ${qqdl}
    // 订单: ${dddl}`;
    // console.log(log);
    let quoteMintStr, quoteMintdec, quoteMintName, quoteMintAmount;
    let baojiastr: String = selectedBJOption.mint.toString();
    if (baojiastr === "SOL") {
      quoteMintStr = soladdr;
      quoteMintdec = 9;
      quoteMintName = 'WSOL';
      //quoteMintAmount = selectedBJOption.amount;
    } else {
      quoteMintStr = selectedBJOption.mint.toString();
      quoteMintdec = selectedBJOption.dec;
      quoteMintName = selectedBJOption.symbol;
    }
    quoteMintAmount = quoteamt;

    // notify({ type: 'success', message: '提示', description: '此功能暂未开放!' });
    // return;

    //const 
    //'WSOL': new Token(TOKEN_PROGRAM_ID, new PublicKey('So11111111111111111111111111111111111111112'), 9, 'WSOL', 'WSOL'),
    //后面这个参数应该是tokenName
    const baseToken = new Token(TOKEN_PROGRAM_ID, new PublicKey(baseMintstr), baseMintdec, baseMintSymbol, baseMintSymbol);//DEFAULT_TOKEN.USDC // USDC  需要构造Token?
    const quoteToken = new Token(TOKEN_PROGRAM_ID, new PublicKey(quoteMintStr), quoteMintdec, quoteMintName, quoteMintName);//DEFAULT_TOKEN.RAY // RAY
    //-------------
    //const targetMarketId = Keypair.generate().publicKey;
    const targetMarketId = new PublicKey(openbookid);

    //const addBaseAmount = new BN(10000) // 10000 / 10 ** 6,
    //const addQuoteAmount = new BN(10000) // 10000 / 10 ** 6,
    console.log(baseMintAmount);
    const addBaseAmount = new BN(baseMintAmount).mul(new BN(Math.pow(10, baseMintdec)));//new BN(baseMintAmount * LAMPORTS_PER_SOL); // 10000 / 10 ** 6,
    const addQuoteAmount = new BN(quoteMintAmount * LAMPORTS_PER_SOL); // 10000 / 10 ** 6,
    console.log("bn", addBaseAmount.toString());
    console.log("bn", addQuoteAmount.toString());

    //const startPrice = calcMarketStartPrice({ addBaseAmount, addQuoteAmount });
    console.log(addBaseAmount + "," + addQuoteAmount);
    //console.log(startPrice);
    //const startPrice1 = 1 / startPrice;//calcMarketStartPrice({ addBaseAmount, addQuoteAmount });
    //console.log(addBaseAmount + "," + addQuoteAmount);
    //console.log(startPrice1);
    //return;

    let startTime;
    if (!selectedTime || selectedTime === "") {
      //startTime = Math.floor(Date.now());
      // 获取当前时间的时间戳（毫秒）
      const currentTimeStamp = Date.now();
      // 将当前时间戳减去 8 小时的毫秒数
      const adjustedTimeStamp = currentTimeStamp; //currentTimeStamp - (8 * 60 * 60 * 1000);
      // 创建一个新的 Date 对象，使用调整后的时间戳
      startTime = Math.floor(new Date(adjustedTimeStamp).getTime() / 1000);

    } else {
      //console.log(selectedTime); 
      const seltime = new Date(selectedTime);
      const adjustedTimeStamp = seltime.getTime(); //seltime.getTime() - (8 * 60 * 60 * 1000);
      startTime = Math.floor(new Date(adjustedTimeStamp).getTime() / 1000);
      //console.log(Math.floor(startTime));
    }

    // let startTime;
    // if (!selectedTime || selectedTime === "") {
    //   startTime = Math.floor(Date.now()/1000);
    // } else {
    //   //
    //   //console.log(selectedTime); 
    //   const seltime = new Date(selectedTime);
    //   startTime = Math.floor(seltime.getTime()/1000);
    //   //console.log(Math.floor(startTime));
    // }
    console.log(startTime);
    //return;
    // const logtime = new Date(startTime);
    // console.log(logtime);
    // return;
    const walletTokenAccounts = await getWalletTokenAccount(connection, publicKey);

    console.log(walletTokenAccounts);    //这个函数其实对应那个 NEXT_PUBLIC_HELIUS_TOKEN_MAIN API返回的getaccount差不多  只是没有格式化.
    /* do something with market associated pool keys if needed */
    const associatedPoolKeys = getMarketAssociatedPoolKeys({
      baseToken,
      quoteToken,
      targetMarketId,
    })
    console.log(associatedPoolKeys);
    console.log(associatedPoolKeys.id.toString());  //指向池子ID  可以通过交易对查找
    //return;

    //创建池子
    // let transaction;
    // transaction = ammCreatePool({
    //   startTime,
    //   addBaseAmount,
    //   addQuoteAmount,
    //   baseToken,
    //   quoteToken,
    //   targetMarketId,
    //   publicKey,
    //   walletTokenAccounts,
    // });
    // console.log(transaction);

    //V0------------构造创建池子交易信息----------~~~~~~~~~success
    let transaction: Promise<(VersionedTransaction | Transaction)[]>;
    transaction = ammCreatePool({
      startTime,
      addBaseAmount,
      addQuoteAmount,
      baseToken,
      quoteToken,
      targetMarketId,
      publicKey,
      walletTokenAccounts,
    });
    console.log(transaction);

    //V0----------#################构造添加流动性
    //const baseToken = DEFAULT_TOKEN.USDC // USDC
    //const quoteToken = DEFAULT_TOKEN.RAY // RAY
    // const targetPool = associatedPoolKeys.id.toString();
    // const inputTokenAmount = new TokenAmount(baseToken, baseamt)
    // const slippage = new Percent(1, startPrice)
    //const walletTokenAccounts = await getWalletTokenAccount(connection, wallet.publicKey)
    //let transaction :Promise<(VersionedTransaction | Transaction)[]>;

    //添加流动性
    // transaction = ammAddLiquidity({
    //   baseToken,
    //   quoteToken,
    //   targetPool,
    //   inputTokenAmount,
    //   slippage,
    //   walletTokenAccounts,
    //   publicKey: publicKey,
    // })
    // console.log(transaction);


    //-----------------
    // if (!initJitoClient()){
    //   notify({ type: "error", message: "错误", description: "初始化jito失败请重试" });
    //   return;
    // }
    // console.log("keys:", keys);
    // return;


    setIsLoading(true);
    try {
      for (const iTx of await transaction) {
        if (iTx instanceof Transaction) {
          //Jito转账
          const latestBlockhash = await connection.getLatestBlockhash();
          const JitoFeeWallet = getRandomTipAccount();///new PublicKey(getRandomValidatorKey());
          let jitoFee;
          if (jitoLevel === 1) {
            jitoFee = 0.0005;
          } else if (jitoLevel === 2) {
            jitoFee = 0.001;
          } else if (jitoLevel === 3) {
            jitoFee = 0.01;
          }

          if (balance < (0.4 + quoteMintAmount + jitoFee + 0.1)) {
            notify({ type: "error", message: "错误", description: "余额不足以支付交易费用" });
            throw new Error("balance error");
          }

          console.log(jitoFee);

          const money = Number(process.env.NEXT_PUBLIC_PRICE_CREATE);
          const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
          iTx.add(SystemProgram.transfer({   //SystemProgram代表sol
            fromPubkey: publicKey,
            toPubkey: mykey,
            lamports: money * Math.pow(10, 9)
          }
          ));

          //添加Jito转账
          iTx.add(
            SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: JitoFeeWallet,
              lamports: jitoFee * LAMPORTS_PER_SOL,
            })
          );
          // 对交易进行钱包签名
          iTx.feePayer = publicKey;
          iTx.recentBlockhash = latestBlockhash.blockhash;
          const signedTx = await wallet.signTransaction(iTx);



          //----------构造买入
          //绑定数组
          let bundle = [];
          const serializeTx = bs58.encode(signedTx.serialize());
          bundle.push(serializeTx);
          console.log("createpoolTX ===>", await connection.simulateTransaction(signedTx));
          if (buyMode === 0) {
            //钱包买入
            const keys = await getKeys_wallet(targetMarketId, baseMintdec, quoteMintdec, wallet, connection);
            if (!keys) {
              notify({ type: "error", message: "错误", description: "获取市场参数错误" });
              return;
            }
            if (balance < (0.4 + quoteMintAmount + walletModeNum + jitoFee + 0.1)) {
              notify({ type: "error", message: "错误", description: "余额不足以支付交易费用" });
              throw new Error("balance error");
            }
            const buyAmtV = Math.floor(walletModeNum * LAMPORTS_PER_SOL);
            const btx = await swap_Buy(keys, buyAmtV, 0);
            btx.add(SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: mykey,
              lamports: 0.08 * Math.pow(10, 9)
            }));
            btx.feePayer = publicKey;
            btx.recentBlockhash = latestBlockhash.blockhash;
            const signedbTx1 = await wallet.signTransaction(btx);
            const serializeTx1 = bs58.encode(signedbTx1.serialize());
            bundle.push(serializeTx1);
            //await sendBundle(bundle);
            //const id = await sendBundle(bundle);
            // const sent = await userconnect.sendTransaction(tx, [userWallet], { skipPreflight: true });
          } else {
            //私钥买入
            if (wallet1Buy !== 0) {
              const connect = new Connection(process.env.NEXT_PUBLIC_RPC);
              const keys = await getKeys_wallet(targetMarketId, baseMintdec, quoteMintdec, wallet1, connect);
              if (!keys) {
                notify({ type: "error", message: "错误", description: "获取市场参数错误" });
                return;
              }
              console.log(wallet1.publicKey.toString());
              const latestBlockhash1 = await connection.getLatestBlockhash();
              const buyAmtV = Math.floor(wallet1Buy * LAMPORTS_PER_SOL);
              //console.log(buyAmtV);
              const bTx = await swap_Buy_Wallet(keys, BigInt(buyAmtV), BigInt(0), wallet1);
              bTx.add(SystemProgram.transfer({
                fromPubkey: wallet1.publicKey,
                toPubkey: mykey,
                lamports: 0.08 * Math.pow(10, 9)
              }));
              bTx.feePayer = wallet1.publicKey;
              bTx.recentBlockhash = latestBlockhash1.blockhash;
              console.log("666");
              bTx.sign(wallet1);
              const serializeTx2 = bs58.encode(bTx.serialize());
              bundle.push(serializeTx2);

              //console.log("buy ====>", await connection.simulateTransaction(signedbTx));
            }
            if (wallet2Buy !== 0) {
              const connect = new Connection(process.env.NEXT_PUBLIC_RPC);
              const keys = await getKeys_wallet(targetMarketId, baseMintdec, quoteMintdec, wallet2, connect);
              if (!keys) {
                notify({ type: "error", message: "错误", description: "获取市场参数错误" });
                return;
              }
              const buyAmtV = Math.floor(wallet2Buy * LAMPORTS_PER_SOL);
              const bTx = await swap_Buy_Wallet(keys, BigInt(buyAmtV), BigInt(0), wallet2);
              bTx.add(SystemProgram.transfer({
                fromPubkey: wallet2.publicKey,
                toPubkey: mykey,
                lamports: 0.08 * Math.pow(10, 9)
              }));
              bTx.feePayer = wallet2.publicKey;
              bTx.recentBlockhash = latestBlockhash.blockhash;
              bTx.sign(wallet2);
              const serializeTx3 = bs58.encode(bTx.serialize());
              bundle.push(serializeTx3);
            }
            if (wallet3Buy !== 0) {
              const connect = new Connection(process.env.NEXT_PUBLIC_RPC);
              const keys = await getKeys_wallet(targetMarketId, baseMintdec, quoteMintdec, wallet3, connect);
              if (!keys) {
                notify({ type: "error", message: "错误", description: "获取市场参数错误" });
                return;
              }
              const buyAmtV = Math.floor(wallet3Buy * LAMPORTS_PER_SOL);
              const bTx = await swap_Buy_Wallet(keys, BigInt(buyAmtV), BigInt(0), wallet3);
              bTx.add(SystemProgram.transfer({
                fromPubkey: wallet3.publicKey,
                toPubkey: mykey,
                lamports: 0.08 * Math.pow(10, 9)
              }));
              bTx.feePayer = wallet3.publicKey;
              bTx.recentBlockhash = latestBlockhash.blockhash;
              bTx.sign(wallet3);
              const serializeTx4 = bs58.encode(bTx.serialize());
              bundle.push(serializeTx4);
            }
          }
          await sendBundle(bundle);
          const id = await sendBundle(bundle);
          console.log(id);



          //序列化?          
          //const wireTx = signedTx.serialize();
          //const latestBlockhash = await getLast
          // 发送交易      
          //const mintSignature = await connection.sendRawTransaction(wireTx, { skipPreflight: true });



          // const latestBlockhash = await connection.getLatestBlockhash();
          // //编译Jito费用
          // const jitTipTxFeeMessage = new TransactionMessage({
          //   payerKey: publicKey,
          //   recentBlockhash: latestBlockhash.blockhash,
          //   instructions: [
          //     SystemProgram.transfer({
          //       fromPubkey: publicKey,
          //       toPubkey: JitoFeeWallet,
          //       lamports: jitoFee * LAMPORTS_PER_SOL,
          //     }),
          //   ],
          // }).compileToV0Message();

          // const jitoFeeTx = new VersionedTransaction(jitTipTxFeeMessage);
          // //签名
          // const jitoSendTx = await wallet.signTransaction(jitoFeeTx);
          // const serializedjitoFeeTx = bs58.encode(jitoSendTx.serialize());

          //编译Jito费用
          // const jitTipTxFeeMessage1 = new TransactionMessage({
          //   payerKey: publicKey,
          //   recentBlockhash: latestBlockhash.blockhash,
          //   instructions: [
          //     SystemProgram.transfer({
          //       fromPubkey: publicKey,
          //       toPubkey: new PublicKey("EdNy4JjhxwcWihg57kMvNDBTsEgqPMetggbySattbxPD"),
          //       lamports: jitoFee * LAMPORTS_PER_SOL,
          //     }),
          //   ],
          // }).compileToV0Message();


          // console.log("交易完成: ", signedTx);
          //console.log("交易完成2: ", mintSignature);
          console.log("流动性池ID:", associatedPoolKeys.id.toString());
          const newPam: MessageBoxPam = {
            addrTag: 'account',
            addrName: "池ID:",
            addr1: associatedPoolKeys.id.toString(),
            hxName: '交易哈希:',
            hxAddr: ""
          };
          updateMessageBoxPam(newPam);
          setIsModalOpen(true);
        }
      }



      // for (const iTx of await transaction) {
      //   if (iTx instanceof VersionedTransaction) {
      //   //const versionedTransaction = new VersionedTransaction(iTx);
      //   const { signature } = await  window.solana.signAndSendTransaction(iTx);
      //   await connection.getSignatureStatus(signature);
      //   console.log("交易完成: ", signature);
      //   console.log("池ID:", associatedPoolKeys.id.toString());
      //   }
      // }

      // for (const iTx of await transaction1) {
      //   if (iTx instanceof VersionedTransaction) {
      //   //const versionedTransaction = new VersionedTransaction(iTx);
      //   const { signature } = await  window.solana.signAndSendTransaction(iTx);
      //   await connection.getSignatureStatus(signature);
      //   console.log("添加流动性交易完成: ", signature);
      //   }
      // }


      // 设置交易的 feePayer
      // transaction.feePayer = wallet.publicKey;

      // // 获取最新的区块哈希值
      // const blockhash = (await connection.getLatestBlockhash()).blockhash;
      // transaction.recentBlockhash = blockhash;

      // // 对交易进行钱包签名
      // const signedTx = await wallet.signTransaction(transaction);
      // const wireTx = signedTx.serialize();
      // //connection.sendTransaction(signedTx, []);
      // // 发送交易
      // const mintSignature = await connection.sendRawTransaction(wireTx, { skipPreflight: true });

      // 设置交易签名
      //setSignature(mintSignature);
      notify({ type: 'success', message: '成功', description: '交易已发送' });
      //console.log("交易完成: ", mintSignature);
    } catch (err) {
      notify({ type: 'success', message: '错误', description: '交易失败' });
      console.log('err', err);
    } finally {
      setIsLoading(false)
    }

  }

  const handleFocus = async () => {


    if (publicKey) {
      if (!isChecked) {
        setisChecked(true);
        //setIsLoading(true)
        setOptions(prevOptions => [...prevOptions, { label: "Loading..." }]);
        let reJson = await getTokenAccounts(publicKey.toString());
        if (reJson.result) {
          setisChecked(true);
          //reJson = JSON.stringify(reJson.result, null, 2);
          //console.log(reJson);
          //tokenlist=[];
          if (reJson.result.total != 0) {
            //setTokentotal(reJson.result.total);

            let nftAddr = [];
            for (let i = 0; i < reJson.result.token_accounts.length; i++) {
              tokenlist.push({
                value: i,
                label: reJson.result.token_accounts[i].mint,
                address: reJson.result.token_accounts[i].address,
                amount: reJson.result.token_accounts[i].amount,
                owner: reJson.result.token_accounts[i].owner,
              });
              nftAddr.push(reJson.result.token_accounts[i].mint);  //这里不能自己添加  不然post到metadata的时候会报错的
            }
            //------
            let metaJson = await getMetadata(nftAddr);
            //setIsLoading(false);
            const mykeystr = publicKey.toString();
            let medaList = [];
            if (metaJson) {
              for (let i = 0; i < metaJson.length; i++) {
                let acc = metaJson[i].account;
                let metadata = metaJson[i].onChainMetadata.metadata;
                let ChainAccountInfo = metaJson[i].onChainAccountInfo.accountInfo.data.parsed.info;   //以后尝试直接把metaJson保存起来
                if (metadata) {
                  medaList.push({
                    account: acc,
                    isToken: true,
                    symbol: metadata.data.symbol,
                    uri: metadata.data.uri,
                    updateAuthority: metadata.updateAuthority,
                    dec: ChainAccountInfo.decimals, //创建池子要用到
                  });
                } else {
                  medaList.push({
                    account: acc,
                    isToken: false,
                    symbol: "",
                    uri: "",
                  });
                }
              }
            }
            else {
              notify({ type: 'error', message: '获取MetaData失败' });
            }
            for (let i = 0; i < tokenlist.length; i++) {
              let label = tokenlist[i].label;
              let corrEl = medaList.find(item => item.account === label)
              if (corrEl) {
                tokenlist[i].isToken = corrEl.isToken;
                tokenlist[i].symbol = corrEl.symbol;
                tokenlist[i].uri = corrEl.uri;
                tokenlist[i].updateAuthority = corrEl.updateAuthority;
                tokenlist[i].dec = corrEl.dec;
              }
            }
            //使用tokenlist显示
            displaytokentocombox(true);
          } else {
            //notify({type:"success", message:"查询成功"});
            //使用tokenlist显示
            displaytokentocombox(true);
            //setTokentotal(0);
          }
        } else {
          notify({ type: 'error', message: '获取失败' });
        }
      }
    } else {
      notify({ type: 'error', message: '错误', description: "请先连接钱包" });
    }
  }

  const handleBJFocus = async () => {
    setbjOptions(prevOptions => [...prevOptions, { label: "加载中..." }]);
    displaytokentocombox(false);
  }

  const handleNextlick = () => {

    if (selectedOption === null) {
      notify({ type: "error", message: "错误", description: "请先选择Tokens" })
      return;
    }
    tranList = [];
    const tags = document.getElementById('addrs') as HTMLInputElement | null;
    const userinput = tags?.value;
    if (userinput === "") {
      notify({ type: "error", message: "错误", description: "请输入转入地址" })
      return;
    }
    //const lines = userinput.split('\n');
    //tranList = lines.map(line => line.split(','));
    //获取数据
    const lines = userinput.split('\n').filter(line => line.trim() !== '');

    tranList = lines.map(line => {
      const [addr, amountStr] = line.split(',');
      const amount = parseFloat(amountStr.trim()); // 将数字字符串转换为整数
      console.log(addr.length)
      if (addr.length === 44) {
        return { addr, amount };
      } else {
        return null; // 如果地址长度不是 45，则返回 null
      }
    }).filter(obj => obj !== null);;


    //删除重复
    const unTranList = [...new Set(tranList.map(obj => obj.addr))].map(addr => {
      return tranList.find(obj => obj.addr === addr);
    });
    //console.log(tranList);
    tranCount = 0
    for (let i = 0; i < unTranList.length; i++) {
      tranCount = tranCount + unTranList[i].amount
    }
    //setTokenCount(unTranList.length);
    //setTokenAmount(tranCount);
    console.log(unTranList);
    //setNextCheck(true);
    //console.log("111")
  }

  const handleRangeChange = () => {
    //
    //
    //console.log(e);
  }

  //const rangeInput1 = document.querySelector('#rangeInput1') as HTMLInputElement;
  //const rangeInput2 = document.querySelector('#rangeInput2') as HTMLInputElement;

  // if (rangeInput1 && rangeInput2) {
  //   rangeInput1.addEventListener('input', function() {
  //     // 在这里可以处理输入范围的变化
  //     const value = Number(rangeInput1?.value);
  //     console.log('当前值:', value);
  //     setodval(value);
  //   });



  // rangeInput2.addEventListener('input', function() {
  //   // 在这里可以处理输入范围的变化
  //   const value = Number(rangeInput2?.value);
  //   console.log('当前值:', value);
  //   setbdval(value);
  // });
  // }else{
  //   console.error('未找到指定的元素。');
  // }
  // document.addEventListener('DOMContentLoaded', function() {
  //   const rangeInput1 = document.getElementById('rangeInput1')! as HTMLInputElement;
  //   const rangeInput2 = document.getElementById('rangeInput2')! as HTMLInputElement;


  //     rangeInput1.addEventListener('input', function(event) {
  //       // 处理第一个输入范围的变化
  //       const value = Number(rangeInput1.value);
  //       console.log('第一个输入范围的值:', value);
  //       setodval(value);
  //     });

  //     rangeInput2.addEventListener('input', function(event) {
  //       // 处理第二个输入范围的变化
  //       const value = Number(rangeInput2.value);
  //       console.log('第二个输入范围的值:', value);
  //       setbdval(value);
  //     });

  // });
  const handleRangeInputChange1 = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    //console.log('第一个输入范围的值:', value);
    setodval(value);
    // if(selectedOption)
    // {
    //   setbaseamt(Math.trunc(selectedOption.amount / 100 * value));
    // }
  };

  const handleRangeInputChange2 = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    //console.log('第二个输入范围的值:', value);
    setbdval(value);
    // if(selectedBJOption)
    // {
    //   setquoteamt(selectedBJOption.amount / 100 * value);
    // }
  };

  const handlePzCheck = (event: React.ChangeEvent<HTMLInputElement>) => {
    //console.log('值:', event);
    const value = event.target.checked;
    //console.log('第二的值:', value);
    //setbdval(value);

    setIsdefpz(value);
  };


  const handlesjdlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    //
    setsjdl(value)
  };

  const handleqqdlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    //
    setqqdl(value)
  };


  const handledddlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    //
    setdddl(value)
  };


  const handledpeiCheck = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    if (checked) {
      setsjdl(128);
      setqqdl(63);
      setdddl(201);
      console.log('128');
    }
  };

  const handlezpeiCheck = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    if (checked) {
      setsjdl(1400);
      setqqdl(63);
      setdddl(450);
      console.log('1400');
      //const amount = document.getElementById('burnamount') as HTMLInputElement | null;  
    }
  };

  const handlegpeiCheck = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    if (checked) {
      setsjdl(2978);
      setqqdl(63);
      setdddl(909);
      console.log('2978');
      //const amount = document.getElementById('burnamount') as HTMLInputElement | null;  
    }

  };

  const handleBaseChange = (event) => {
    //
    //console.log(event);
    setbaseamt(parseFloat(event.target.value));
  }

  const handlequoteChange = (event) => {
    setquoteamt(parseFloat(event.target.value));
  }

  const handleChangeBuyMode0 = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    if (checked) {
      setBuyMode(0);
    }
  };

  const handleChangeBuyMode1 = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    if (checked) {
      setBuyMode(1);
    }
  };


  const onChangeMB = (key: string | string[]) => {
    console.log(key);
  };

  const onChangeJitoLevel = (e: RadioChangeEvent) => {
    //setSize(e.target.value);
    const newValue = e.target.value;
    setjitoLevel(newValue);
  };


  return (

    <div className="flex flex-col md:hero mx-auto p-1 md:w-full">
      <div className="">
        <div className='mt-6'>
          <h1 className="text-center text-4xl md:pl-12 text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-4">
            创建流动性并买入
          </h1>
          <h1 className="text-center text-1xl md:p-0 md:pl-12 text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500">
            使用Jito捆绑交易信息 从而实现创建池子的同时以最快速度买入代币
          </h1>
        </div >

        <div className="divider"></div>

        <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 w-[600px]">
          <div className='md:w-1/3 md:text-1xl text-right text-stone-300 text-base mr-2 '>{t('pool.base')}</div>
          <div className='max-w-md mx-auto px-10 my-2 w-full'>
            <Select
              value={selectedOption}
              onChange={handleChange}
              onFocus={handleFocus}
              //onMenuOpen={handleMenuClick}
              options={options}
              isMulti={false} // 如果想要多选，则设置为true
              className="text-black " // 使用 Tailwind 的 text-black 类来修改字体颜色
            />
          </div>
        </div>

        <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 w-[600px]">
          <div className='md:w-1/3 md:text-1xl text-right text-stone-300 text-base mr-2'>{t('pool.quote')}</div>
          <div className='max-w-md mx-auto px-10 my-2 w-full'>
            <Select
              value={selectedBJOption}
              onChange={handleBJChange}
              onFocus={handleBJFocus}
              //onMenuOpen={handleMenuClick}
              options={bjoptions}
              isMulti={false} // 如果想要多选，则设置为true
              className="text-black " // 使用 Tailwind 的 text-black 类来修改字体颜色
            />
          </div>
        </div>

        <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 w-[600px]">
          <div className='md:w-1/3 md:text-1xl text-right text-stone-300 text-base mr-2 '>{t('pool.open')}</div>
          <div className='max-w-md mx-auto px-10 my-2 w-full'>
            <input className="max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] text-sm p-2 px-2 my-2 w-full" id='openbookid' defaultValue={""} />
            <p className='text-stone-300 text-sm'>{t('pool.notopen')}   <Link href="./market"><span className='no-underline hover:underline decoration-1 text-blue-600'>{t('pool.notopencreate')}</span></Link></p>
          </div>
        </div>


        <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 w-[600px] justify-center">
          <div className='md:w-1/3 md:text-1xl text-right text-stone-300 text-base mr-2 '>{t('pool.baseamount')}</div>
          <div className='md:max-w-2x1 mx-auto px-10 my-2 w-full flex items-center'>
            <div className='md:w-1/2'>
              <input type="number"
                className="max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] text-sm p-2 px-2 my-2 w-full"
                value={baseamt}
                onChange={handleBaseChange}
              />
              <span className='text-stone-300 text-sm'>
                {selectedOption && <span>{t('pool.balance')} {selectedOption.amount} {selectedOption.symbol}</span>}
              </span>
            </div>
            <span className="md:w-1/2 tooltip w-full" data-tip={`${odval}%`}>
              <input type="range" min={1} max={100} value={odval} className="range" id="rangeInput1" onChange={handleRangeInputChange1} />
              <div className="w-full flex justify-between text-xs pl-2">
                {/* <span >0</span> */}
                <span className="border border-gray-500 p-1 rounded-lg" onClick={() => { setodval(1) }}> 1</span>
                <span className="border border-gray-500 p-1 rounded-lg" onClick={() => { setodval(25) }}>25</span>
                <span className="border border-gray-500 p-1 rounded-lg" onClick={() => { setodval(50) }}>50</span>
                <span className="border border-gray-500 p-1 rounded-lg" onClick={() => { setodval(75) }}>75</span>
                <span className="border border-gray-500 p-1 rounded-lg" onClick={() => { setodval(100) }}>100</span>
              </div>
            </span>
          </div>
        </div>

        <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 w-[600px] justify-center">
          <div className='md:w-1/3 md:text-1xl text-right text-stone-300 text-base mr-2 '>{t('pool.quoteamount')}</div>
          <div className='md:max-w-2x1 mx-auto px-10 my-2 w-full flex items-center'>
            <div className='md:w-1/2'>
              <input type="number"
                className=" max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] text-sm p-2 px-2 my-2 w-full"
                value={quoteamt}
                onChange={handlequoteChange}
              />
              <span className='text-stone-300 text-sm'>
                {selectedBJOption && <span>{t('pool.balance')} {selectedBJOption.amount}  {selectedBJOption.symbol}</span>}
              </span>
            </div>

            <span className="md:w-1/2 tooltip w-full" data-tip={`${bdval}%`}>
              <input type="range" min={1} max={100} value={bdval} className="range" id="rangeInput2" onChange={handleRangeInputChange2} />
              <div className="w-full flex justify-between text-xs pl-2">
                {/* <span >0</span> */}
                <span className="border border-gray-500 p-1 rounded-lg" onClick={() => { setbdval(1) }}> 1</span>
                <span className="border border-gray-500 p-1 rounded-lg" onClick={() => { setbdval(25) }}>25</span>
                <span className="border border-gray-500 p-1 rounded-lg" onClick={() => { setbdval(50) }}>50</span>
                <span className="border border-gray-500 p-1 rounded-lg" onClick={() => { setbdval(75) }}>75</span>
                <span className="border border-gray-500 p-1 rounded-lg" onClick={() => { setbdval(100) }}>100</span>
              </div>
            </span>
          </div>
        </div>


        <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 w-[600px]">
          <div className='md:w-1/3 md:text-1xl text-right text-stone-300 text-base mr-2 '>买入模式:</div>
          <div className='max-w-md mx-auto px-10 my-2 w-full flex items-center md:text-sm space-x-3'>
            <div className="form-control">
              <div className="tooltip" data-tip="钱包至少保留0.5SOL以上,用于支付手续费等">
                <label className="label cursor-pointer">
                  <input type="radio" name="radio-10" className="radio checked:bg-red-500" onChange={handleChangeBuyMode0} defaultChecked={true} />
                  <span className="label-text text-stone-300">当前钱包买入</span>
                </label>
              </div>
            </div>

            <div className="form-control">
              <div className="tooltip" data-tip="填写的私钥钱包请至少保留0.15以上SOL">
                <label className="label cursor-pointer">
                  <input type="radio" name="radio-10" className="radio checked:bg-blue-500" onChange={handleChangeBuyMode1} />
                  <span className="label-text text-stone-300">导入钱包买入</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {buyMode === 0 ?
          <div>
            <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 w-[600px]">
              <div className='md:w-1/3 md:text-1xl text-right text-stone-300 text-base mr-2 '>钱包地址:</div>
              <div className='max-w-md mx-auto px-10 my-2 w-full flex items-center md:text-sm space-x-3'>
                <input type="text" className="max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] text-sm p-2 px-2 my-2 w-full" value={publicKey ? wallet.publicKey.toString() : "未连接钱包!"} placeholder="Daisy" disabled />
              </div>
            </div>

            <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 w-[600px]">
              <div className='md:w-1/3 md:text-1xl text-right text-stone-300 text-base mr-2 '>买入数量:</div>
              <div className='max-w-md mx-auto px-10 my-2 w-full'>
                {/* <span className="label-text text-stone-300">余额: </span> */}
                <input type="number" id='walletbuynum' className="max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] text-sm p-2 px-2 my-2 w-full" placeholder="买入数量" />
                {/* <p className='text-stone-300 text-sm'>余额:   </p> */}
                <h4 className="md:w-full text-base text-slate-300 my-2">
                  {wallet ?
                    <div className="flex flex-row justify-center">
                      <div>
                        余额: {balance}
                      </div>
                      <div className='text-slate-600 ml-2'>
                        SOL
                      </div>
                    </div>
                    : ""
                  }
                </h4>
              </div>

            </div>
          </div>
          : //max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] text-sm p-2 px-2 my-2 w-full
          <div className='w-[600px]'>
            <Collapse
              bordered={false}
              accordion
              items={items}
              defaultActiveKey={['1']}
              onChange={onChangeMB}
              style={{ background: "rgb(254 242 242)" }}
            />


            {/* <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 w-[600px]">
              <div className='md:w-1/2 md:text-1xl text-right text-stone-300 text-base mr-2 '>
                <label className="input input-bordered flex items-center gap-2">
                  <input type="text" className="grow bg-primary" placeholder="私钥填写" />
                  <span className="badge badge-info">粘贴</span>
                </label>
              </div>
              <div className='md:w-1/2 mx-auto px-10 my-2 w-full flex items-center md:text-sm space-x-3'>

              </div>
            </div> */}
          </div>
        }







        <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 w-[600px]">
          <div className='md:w-1/3 md:text-1xl text-right text-stone-300 text-base mr-2 ml-5'>高级选项:</div>
          <div className='max-w-md mx-auto  my-2 w-full'>
            <input type="checkbox" className="toggle" defaultChecked={false} onChange={handlePzCheck} />
          </div>

        </div>

        {isdefpz ?
          <div>
            {
              <div>
                <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 w-[600px]">
                  <div className='md:w-1/3 md:text-1xl text-right text-stone-300 text-base mr-2 '>Jito MEV小费:</div>
                  {/* <div className='max-w-md mx-auto  my-2 w-full flex items-center md:text-sm space-x-3'>
                    <div className="form-control">
                      <label className="label cursor-pointer">
                        <input type="radio" name="radio-11" className="radio checked:bg-red-500" defaultChecked={true} />
                        <span className="label-text text-stone-300">默认-0.00003SOL</span>

                      </label>
                    </div>

                    <div className="form-control">
                      <label className="label cursor-pointer">
                        <input type="radio" name="radio-11" className="radio checked:bg-blue-500" />
                        <span className="label-text text-stone-300">高速-0.001SOL</span>
                      </label>
                    </div>

                    <div className="form-control">
                      <label className="label cursor-pointer">
                        <input type="radio" name="radio-11" className="radio checked:bg-green-500" />
                        <span className="label-text text-stone-300">极速-0.01SOL</span>
                      </label>
                    </div>
                  </div> */}
                  <div className='max-w-md mx-auto  my-2 w-full flex items-center md:text-sm space-x-3'>
                    <Radio.Group value={jitoLevel} onChange={onChangeJitoLevel} style={{ marginBottom: 16 }}>
                      <Radio.Button value={1}>默认 0.0005SOL</Radio.Button>
                      <Radio.Button value={2}>高速 0.001SOL</Radio.Button>
                      <Radio.Button value={3}>极速 0.01SOL</Radio.Button>
                    </Radio.Group>
                  </div>
                </div>

                {/* <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 w-[600px]">
                  <div className='md:w-1/3 md:text-1xl text-right text-stone-300 text-base mr-2 '>区块链处理引擎:</div>
                  <div className='max-w-md mx-auto my-2 w-full space-x-3'>
                    <Select
                      value={selectedJitoOption}
                      onChange={handleJitoChange}
                      //onFocus={handleBJFocus}
                      //onMenuOpen={handleMenuClick}
                      options={jitoOptions}
                      isMulti={false} // 如果想要多选，则设置为true
                      className="text-black " // 使用 Tailwind 的 text-black 类来修改字体颜色
                    />
                  </div>
                </div> */}
              </div>
            }
          </div>
          : ""
        }

        <div className="flex flex-col md:flex-row items-center space-x-3 w-[600px]">

          <div className='flex flex-col md:w-2/3 max-w-md mx-auto px-10 my-2 items-center'>
            <button className="px-16 m-2 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
              onClick={handleEnterbtnclick}>
              {t('pool.enter')}
            </button>
            {/* <span className='text-right text-stone-50 text-sm'>{t('market.ent')}</span> */}
            {/* <p className="md:w-full md:text-1xl text-center text-slate-500 my-2 text-xs">{t('free.all')}</p> */}
          </div>
        </div>

        {/* <div className="flex flex-col md:flex-row items-center space-x-3 w-[600px]">

          <div className='flex flex-col md:w-2/3 max-w-md mx-auto px-10 my-2 items-center'>
            <button className="px-16 m-2 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
              onClick={()=>{alert(Math.floor(Date.now()))}}>
              getServertime </button>
          </div>
        </div> */}
      </div>


      <FloatButton tooltip={<div>{t('msgbox.fbtn')}</div>} onClick={() => setIsModalOpen(true)} />
      <MsgBoxView isModalOpen={isModalOpen} msgParam={messageBoxPam} handleCancel={() => { setIsModalOpen(false) }} />

      {isLoading && <Loading />}

    </div>
  );
};


