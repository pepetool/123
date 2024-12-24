// Next, React
import { FC, useState, useEffect } from 'react';
// Wallet
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
//import Select from 'react-select';
import { notify } from 'utils/notifications';
import {
  burntokensAndcloseacc,
  burntokens,
  setPublicGasfee,
} from '../../utils/web3';
import { getTokenAccounts, getMetadata, truncateString, getImageUri, getTokenListByShyft } from '../../utils/gettoken';
import Loading from 'components/Loading';
import {
  LAMPORTS_PER_SOL, PublicKey, Connection, Keypair, Transaction, SystemProgram, TransactionMessage,
  TransactionInstruction,
  VersionedTransaction
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

import BN from "bn.js";
import Select from 'react-select';

import {
  sendSignedTransaction,
  signTransactions,
  TransactionWithSigners,
} from "../../utils/transaction";

//import { toast } from "react-toastify";
import TransactionToast from "../../utils/TransactionToast";


import { min } from 'date-fns';
import { useTranslation } from 'next-i18next'
import { usesBeet } from '@metaplex-foundation/mpl-token-metadata';
import { DatePicker, FloatButton, Space } from 'antd';
import Link from 'next/link';
import bs58 from "bs58"
import Decimal from "decimal.js";



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
import DLMM, { StrategyType } from '@meteora-ag/dlmm';
import { getTokenMetadataProc } from 'utils/getTokenMetadataA';
//import Input from 'antd/es/input/Input';


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


const METERORA_PROGRAMID = new PublicKey('LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo');

export const MeteoraPoolView: FC = ({ }) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signMessage, signTransaction, signAllTransactions } = useWallet();
  const [isChecked, setisChecked] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedBJOption, setSelectedBJOption] = useState(null);
  const [options, setOptions] = useState([]);
  const [bjoptions, setbjOptions] = useState([]);
  //const [tokentotal, setTokentotal] = useState(0);
  //const [signature, setSignature] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  //const [isnextCheck, setNextCheck] = useState(false);
  //const [tokencount, setTokenCount] = useState(0);
  //const [tokenamount, setTokenAmount] = useState(0);
  const { t } = useTranslation('common')

  const [odval, setodval] = useState(100);
  const [bdval, setbdval] = useState(50);
  const [isdefpz, setIsdefpz] = useState(false);
  const [sjdl, setsjdl] = useState(128);
  const [qqdl, setqqdl] = useState(63);
  const [dddl, setdddl] = useState(201);

  const [selectedTime, setSelectedTime] = useState(null);

  const [baseamt, setbaseamt] = useState(10);
  const [quoteamt, setquoteamt] = useState(5);

  const [baseKeyData, setbaseKeyData] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const initialPam: MessageBoxPam = {
    addrTag: '',
    addrName: '',
    addr1: '',
    hxName: '',
    hxAddr: ''
  };
  const [messageBoxPam, updateMessageBoxPam] = useMessageBoxPam(initialPam);


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


  const onAddrChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    //console.log(event.target.value);
    if (event.target.value !== '') {
      try {
        const baseKey = new PublicKey(event.target.value);
        const tokenMetaData = await getTokenMetadataProc(connection, baseKey);
        console.log(tokenMetaData);
        const cortokenSym = tokenMetaData.data.symbol;
        const tokenSymbol = cortokenSym.replace(/\u0000/g, '');
        // const mint = getMint(connection, baseKey);
        setbaseKeyData(tokenSymbol);
        //set();
      } catch (err) {
        console.log(err);
        notify({ type: 'error', message: '错误', description: '输入错误' });
      }
    }
  }

  //const [isDisMytoken, setDisMytoken] = useState(false);

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

  function derivePresetParameter2(
    binStep: BN,
    baseFactor: BN,
    programId: PublicKey
  ) {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("preset_parameter"),
        new Uint8Array(binStep.toArrayLike(Buffer, "le", 2)),
        new Uint8Array(baseFactor.toArrayLike(Buffer, "le", 2)),
      ],
      programId
    );
  }

  const LBCLMM_PROGRAM_IDS = {
    devnet: "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo",
    localhost: "LbVRzDTvBDEcrthxfZ4RL6yiq3uZw8bS6MwtdY6UhFQ",
    "mainnet-beta": "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo",
  };

  function sortTokenMints(tokenX: PublicKey, tokenY: PublicKey) {
    const [minKey, maxKey] =
      tokenX.toBuffer().compare(tokenY.toBuffer()) == 1
        ? [tokenY, tokenX]
        : [tokenX, tokenY];
    return [minKey, maxKey];
  }

  function deriveLbPair2(
    tokenX: PublicKey,
    tokenY: PublicKey,
    binStep: BN,
    baseFactor: BN,
    programId: PublicKey
  ) {
    const [minKey, maxKey] = sortTokenMints(tokenX, tokenY);
    return PublicKey.findProgramAddressSync(
      [
        minKey.toBuffer(),
        maxKey.toBuffer(),
        new Uint8Array(binStep.toArrayLike(Buffer, "le", 2)),
        new Uint8Array(baseFactor.toArrayLike(Buffer, "le", 2)),
      ],
      programId
    );
  }


  //确定转账
  const handleEnterbtnclick = async () => {
    if (!wallet || !publicKey) {
      console.log("钱包未连接");
      notify({ type: "error", message: "钱包未连接" })
      return;
    }







    const keypai = Keypair.generate();
    //获取现有的池子   --Hao  USDT Pair 6preSdKQ2jzVyPGvQmRstSNuUai4nFgQJxSxNgdbQQtZ
    //                --Hao  USDT D7w9rntedoaxjp8SFRWsxzrx4qZ1G1gg9QcUBhZybarB
    //const dlmmPool = await DLMM.create(connection, new PublicKey('6preSdKQ2jzVyPGvQmRstSNuUai4nFgQJxSxNgdbQQtZ'));
    //5KRCuwvkRYfX7U6njQdcMBeSKYJoecxkeR1JPaJfJiTn

    //dev token AQsh7nFToRSUbGAYJRJmWvGAgGi1neLnPFkkcBW79pLG
    // const basekeydoc = document.getElementById('basekey') as HTMLInputElement | null;
    // const basekey = basekeydoc?.value;
    const basekey = selectedOption.mint;
    // console.log(basekey);
    // return;

    // const quotekeydoc = document.getElementById('quotekey') as HTMLInputElement | null;
    // const quotekey = quotekeydoc?.value;
    const quotekey = selectedBJOption.mint;
    //console.log(selectedOption);
    // console.log([basekey, quotekey]);
    // return;

    const corPriceDoc = document.getElementById('corprice') as HTMLInputElement | null;
    const corPrice = Number(corPriceDoc?.value);

    const binStepDoc = document.getElementById('binstep') as HTMLInputElement | null;
    const binStepVal = Number(binStepDoc?.value);


    //return;

    try {
      const tokenKey = new PublicKey(basekey);  //D7w9rntedoaxjp8SFRWsxzrx4qZ1G1gg9QcUBhZybarB
      const usdtKey = new PublicKey(quotekey);
      const baseMint = await getMint(connection, tokenKey);
      const quoteMint = await getMint(connection, usdtKey);

      const toLamportMultiplier = new Decimal(10 ** (quoteMint.decimals - baseMint.decimals)); //quotedec - basedec
      const minPrice = corPrice;   //最小价格
      const binStepNum = binStepVal;    //步骤1?

      const minBinId = DLMM.getBinIdFromPrice(
        new Decimal(minPrice).mul(toLamportMultiplier),
        binStepNum,
        false
      );
      console.log(minBinId);
      // D7w9rntedoaxjp8SFRWsxzrx4qZ1G1gg9QcUBhZybarB  Dec:6  0           0
      // 9LyY4b2U93giCwsF9vfpWcTab34e47Tp79HoX2XoKCSn  Dec:9  -69082      -69081

      //return;

      const binStep = new BN(binStepNum);
      const factor = new BN(10000);
      const activeID = new BN(minBinId);
      const [presetParamPda] = derivePresetParameter2(binStep, factor, METERORA_PROGRAMID);
      console.log(presetParamPda.toString());
      // return;
      //100000000
      //
      let iTx = await DLMM.createLbPair(
        connection,
        wallet.publicKey,
        tokenKey,
        usdtKey,
        binStep,
        new BN(factor),
        presetParamPda,
        activeID,
        { cluster: "mainnet-beta" }
      )
      iTx = setPublicGasfee(iTx);
      // return;

      const money = 0.1;  //收费1  =  0.1  SOL
      const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
      const Transfer = SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: mykey,
        lamports: money * Math.pow(10, 9)
      }
      );
      iTx.add(Transfer);


      iTx.feePayer = wallet.publicKey;

      // 获取最新的区块哈希值
      const blockhash = (await connection.getLatestBlockhash()).blockhash;
      iTx.recentBlockhash = blockhash;
      //iTx.partialSign(keypai);
      // 对交易进行钱包签名
      const signedTx = await wallet.signTransaction(iTx);
      //序列化?
      const wireTx = signedTx.serialize();
      // 发送交易      
      const mintSignature = await connection.sendRawTransaction(wireTx, { skipPreflight: true });
      console.log(mintSignature);
      const newPam: MessageBoxPam = {
        addrTag: 'account',
        addrName: "",
        addr1: "请留意哈希是否上链",
        hxName: '交易哈希:',
        hxAddr: mintSignature
      };
      updateMessageBoxPam(newPam);
      setIsModalOpen(true);
    } catch (err) {
      console.log(err);
      notify({ type: "error", message: '错误', description: "交易出错,请确认信息是否正确或已创建过池子" });
    }
    //return;
  }

  // const handleFocus = async () => {


  //   if (publicKey) {
  //     if (!isChecked) {
  //       setisChecked(true);
  //       //setIsLoading(true)
  //       setOptions(prevOptions => [...prevOptions, { label: "Loading..." }]);
  //       let reJson = await getTokenAccounts(publicKey.toString());
  //       if (reJson.result) {
  //         setisChecked(true);
  //         //reJson = JSON.stringify(reJson.result, null, 2);
  //         console.log(reJson);
  //         //tokenlist=[];
  //         if (reJson.result.total != 0) {
  //           //setTokentotal(reJson.result.total);

  //           let nftAddr = [];
  //           for (let i = 0; i < reJson.result.token_accounts.length; i++) {
  //             tokenlist.push({
  //               value: i,
  //               label: reJson.result.token_accounts[i].mint,
  //               address: reJson.result.token_accounts[i].address,
  //               amount: reJson.result.token_accounts[i].amount,
  //               owner: reJson.result.token_accounts[i].owner,
  //             });
  //             nftAddr.push(reJson.result.token_accounts[i].mint);  //这里不能自己添加  不然post到metadata的时候会报错的
  //           }
  //           //------
  //           let metaJson = await getMetadata(nftAddr);
  //           //setIsLoading(false);
  //           const mykeystr = publicKey.toString();
  //           let medaList = [];
  //           if (metaJson) {
  //             for (let i = 0; i < metaJson.length; i++) {
  //               let acc = metaJson[i].account;
  //               let metadata = metaJson[i].onChainMetadata.metadata;
  //               let ChainAccountInfo = metaJson[i].onChainAccountInfo.accountInfo.data.parsed.info;   //以后尝试直接把metaJson保存起来
  //               if (metadata) {
  //                 medaList.push({
  //                   account: acc,
  //                   isToken: true,
  //                   symbol: metadata.data.symbol,
  //                   uri: metadata.data.uri,
  //                   updateAuthority: metadata.updateAuthority,
  //                   dec: ChainAccountInfo.decimals, //创建池子要用到
  //                 });
  //               } else {
  //                 medaList.push({
  //                   account: acc,
  //                   isToken: false,
  //                   symbol: "",
  //                   uri: "",
  //                 });
  //               }
  //             }
  //           }
  //           else {
  //             notify({ type: 'error', message: '获取MetaData失败' });
  //           }
  //           for (let i = 0; i < tokenlist.length; i++) {
  //             let label = tokenlist[i].label;
  //             let corrEl = medaList.find(item => item.account === label)
  //             if (corrEl) {
  //               tokenlist[i].isToken = corrEl.isToken;
  //               tokenlist[i].symbol = corrEl.symbol;
  //               tokenlist[i].uri = corrEl.uri;
  //               tokenlist[i].updateAuthority = corrEl.updateAuthority;
  //               tokenlist[i].dec = corrEl.dec;
  //             }
  //           }
  //           //使用tokenlist显示
  //           displaytokentocombox(true);
  //         } else {
  //           //notify({type:"success", message:"查询成功"});
  //           //使用tokenlist显示
  //           displaytokentocombox(true);
  //           //setTokentotal(0);
  //         }
  //       } else {
  //         notify({ type: 'error', message: '获取失败' });
  //       }
  //     }
  //   } else {
  //     notify({ type: 'error', message: '错误', description: "请先连接钱包" });
  //   }
  // }

  async function displaytokenList(isAll, keystr?: string) {
    if (isAll) {
      setOptions([]);
      for (let i = 0; i < tokenlist.length; i++) {
        if (tokenlist[i].isToken) {
          const uri: string = tokenlist[i].uri;
          const newOption = {
            value: i,   //(数量:${tokenlist[i].amount / Math.pow(10, 9)})
            label:
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200">
                    <LogoImage src={uri} alt='LOGO' />
                  </div>
                  <div>
                    <span className="text-rose-600 ml-2">{tokenlist[i].symbol}</span>
                    <span className="text-stone-400 text-xs ml-2">{truncateString(tokenlist[i].label, 16, 8, 8)}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-rose-400 text-xs">余额: {tokenlist[i].amount}</span>
                </div>
              </div>,
            mint: tokenlist[i].label,
            amount: tokenlist[i].amount,
            address: tokenlist[i].address,
            dec: tokenlist[i].dec,
          };
          setOptions(prevOptions => [...prevOptions, newOption]);
        } else {
          const newOption = {
            value: i,     //(数量:${tokenlist[i].amount / Math.pow(10, 9)}) 
            label:
              <div className="flex justify-between">
                <span className="text-stone-400 text-sm ml-2">Token - {truncateString(tokenlist[i].label, 16, 8, 8)}</span>
                <span className="text-gray-400 text-sm">余额:{tokenlist[i].amount / Math.pow(10, 9)}</span>
              </div>,
            //<div style={{display: 'flex', justifyContent: 'space-between'}}>Tokens - {tokenlist[i].label}<span style={{fontSize: '0.8em'}}>余额:{roundUp(tokenlist[i].amount  / Math.pow(10, 9))}</span></div>, 
            mint: tokenlist[i].label,
            amount: tokenlist[i].amount / Math.pow(10, 9),
            address: tokenlist[i].address,
            dec: tokenlist[i].dec,
          };
          setOptions(prevOptions => [...prevOptions, newOption]);
        }
      }
    } else {
      setOptions([]);
      console.log(tokenlist);
      for (let i = 0; i < tokenlist.length; i++) {
        if (tokenlist[i].isToken && tokenlist[i].updateAuthority === keystr) {
          const newOption = {
            value: i,   //(数量:${tokenlist[i].amount / Math.pow(10, 9)})
            label:
              <div className="flex justify-between">
                <span className="text-gray-800">{tokenlist[i].symbol} - {tokenlist[i].label}</span>
                <span className="text-gray-400 text-sm">余额:{tokenlist[i].amount / Math.pow(10, 9)}</span>
              </div>,
            mint: tokenlist[i].label,
            address: tokenlist[i].address,
          };
          setOptions(prevOptions => [...prevOptions, newOption]);
        }
      }
    }
  }

  const handleFocus = async () => {
    if (publicKey) {
      if (!isChecked) {
        setisChecked(true);
        setOptions(prevOptions => [...prevOptions, { label: "Loading..." }]);
        let reJson = await getTokenListByShyft(publicKey.toString());
        if (reJson.result) {
          setisChecked(true);
          tokenlist = [];
          for (let i = 0; i < reJson.result.length; i++) {
            const nowToken = reJson.result[i];
            if (nowToken.info.name === "Unknown Token") {
              tokenlist.push({
                value: i,
                label: nowToken.address,  //代币地址
                address: nowToken.associated_account,
                amount: nowToken.balance,  //余额  已经处理了dec的
                isToken: false,
                name: nowToken.info.name,
                symbol: nowToken.info.symbol,
                uri: nowToken.info.image,
                dec: nowToken.info.decimals
              });
            } else {
              tokenlist.push({
                value: i,
                label: nowToken.address,  //代币地址
                address: nowToken.associated_account,
                amount: nowToken.balance,  //余额  已经处理了dec的
                isToken: true,
                name: nowToken.info.name,
                symbol: nowToken.info.symbol,
                uri: nowToken.info.image,
                dec: nowToken.info.decimals
              });
            }
          }
          displaytokenList(true);
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



  return (

    <div className="flex flex-col md:hero mx-auto p-1 md:w-full">
      <div className="">
        <div className='mt-6'>
          <h1 className="text-center text-4xl md:pl-12 text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-4">
            {t('pool.t2')}
          </h1>
        </div >

        <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 w-[600px]">
          <div className='md:w-1/3 md:text-1xl text-right text-stone-300 text-base mr-2 '>{t('pool.base')}</div>
          <div className='max-w-md mx-auto px-10 my-2 w-full'>
            <Select
              value={selectedOption}
              onChange={handleChange}
              onFocus={handleFocus}
              //onMenuOpen={handleMenuClick}
              options={options}
              //isMulti={false} // 如果想要多选，则设置为true
              className="text-black w-[400px]" // 使用 Tailwind 的 text-black 类来修改字体颜色
            />
            {/* <Input></Input> */}
            {/* <input className="max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] text-sm p-2 px-2 my-2 w-full" id='basekey' defaultValue={""} onChange={onAddrChange} /> */}
            {/* <div>
              {baseKeyData}
            </div> */}
          </div>

        </div>

        <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 w-[600px]">
          <div className='md:w-1/3 md:text-1xl text-right text-stone-300 text-base mr-2'>{t('pool.quote')}</div>
          <div className='max-w-md mx-auto px-10 my-2 w-full'>
            <Select
              value={selectedBJOption}
              onChange={handleBJChange}
              onFocus={handleFocus}
              //onMenuOpen={handleMenuClick}
              options={options}
              //isMulti={false} // 如果想要多选，则设置为true
              className="text-black w-[400px]" // 使用 Tailwind 的 text-black 类来修改字体颜色
            />
            {/* <Select
              value={selectedBJOption}
              onChange={handleBJChange}
              onFocus={handleBJFocus}
              //onMenuOpen={handleMenuClick}
              options={bjoptions}
              isMulti={false} // 如果想要多选，则设置为true
              className="text-black " // 使用 Tailwind 的 text-black 类来修改字体颜色
            /> */}
            {/* <Input defaultValue={'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'}></Input> */}
            {/* <input className="max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] text-sm p-2 px-2 my-2 w-full" id='quotekey' defaultValue={"Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"} /> */}
          </div>
        </div>

        <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 w-[600px]">
          <div className='md:w-1/3 md:text-1xl text-right text-stone-300 text-base mr-2'>目标价格</div>
          <div className='max-w-md mx-auto px-10 my-2 w-full'>
            {/* <Select
              value={selectedBJOption}
              onChange={handleBJChange}
              onFocus={handleBJFocus}
              //onMenuOpen={handleMenuClick}
              options={bjoptions}
              isMulti={false} // 如果想要多选，则设置为true
              className="text-black " // 使用 Tailwind 的 text-black 类来修改字体颜色
            /> */}
            {/* <Input defaultValue={'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'}></Input> */}
            <input className="max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] text-sm p-2 px-2 my-2 w-full" id='corprice' defaultValue={"1"} />
          </div>
        </div>

        <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 w-[600px]">
          <div className='md:w-1/3 md:text-1xl text-right text-stone-300 text-base mr-2'>BinStep:</div>
          <div className='max-w-md mx-auto px-10 my-2 w-full'>
            {/* <Select
              value={selectedBJOption}
              onChange={handleBJChange}
              onFocus={handleBJFocus}
              //onMenuOpen={handleMenuClick}
              options={bjoptions}
              isMulti={false} // 如果想要多选，则设置为true
              className="text-black " // 使用 Tailwind 的 text-black 类来修改字体颜色
            /> */}
            {/* <Input defaultValue={'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'}></Input> */}
            <input className="max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] text-sm p-2 px-2 my-2 w-full" id='binstep' defaultValue={"1"} />
          </div>
        </div>

        {/* <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 w-[600px]">
          <div className='md:w-1/3 md:text-1xl text-right text-stone-300 text-base mr-2 '>{t('pool.open')}</div>
          <div className='max-w-md mx-auto px-10 my-2 w-full'>
            <input className="max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] text-sm p-2 px-2 my-2 w-full" id='openbookid' defaultValue={""} />
            <p className='text-stone-300 text-sm'>{t('pool.notopen')}   <Link href="./market"><span className='no-underline hover:underline decoration-1 text-blue-600'>{t('pool.notopencreate')}</span></Link></p>
          </div>
        </div> */}


        {/* <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 w-[600px] justify-center">
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
          </div>
        </div> */}

        {/* <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 w-[600px] justify-center">
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
          </div>
        </div> */}


        {/* <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 w-[600px]">
          <div className='md:w-1/3 md:text-1xl text-right text-stone-300 text-base mr-2 ml-5'>{t('pool.opentime')}</div>
          <div className='max-w-md mx-auto px-10 my-2 w-full'>
            <input type="checkbox" className="toggle" defaultChecked={false} onChange={handlePzCheck} />
          </div>

        </div> */}



        <div className="flex flex-col md:flex-row items-center space-x-3 w-[600px]">

          <div className='flex flex-col md:w-2/3 max-w-md mx-auto px-10 my-2 items-center'>
            <button className="px-16 m-2 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
              onClick={handleEnterbtnclick}>
                {t('pool.enter')} </button>
            {/* <span className='text-right text-stone-50 text-sm'>{t('market.ent')}</span> */}
            {/* <p className="md:w-full md:text-1xl text-center text-slate-500 my-2 text-xs">{t('free.all')}</p> */}
          </div>
        </div>

        {/* <div className="flex flex-col md:flex-row items-center space-x-3 w-[600px]">

          <div className='flex flex-col md:w-2/3 max-w-md mx-auto px-10 my-2 items-center'>
            <button className="px-16 m-2 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
              onClick={handleEnter2btnclick}>
              添加流动性 </button>
          </div>
        </div> */}

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


