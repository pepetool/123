// Next, React
import { FC, useEffect, useRef, useState } from 'react';
// Wallet
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import Select from 'react-select';
import { notify } from 'utils/notifications';
import { burntokensAndcloseacc, burntokens, setMintTokenProc, disableAccount } from '../../utils/web3';
import { getTokenAccounts, getMetadata, getImageUri, truncateString, getTokenListByShyft, getImageJson, queryLpPair, queryLpMintInfo } from '../../utils/gettoken';
import Loading from 'components/Loading';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from '@solana/web3.js'
import { useTranslation } from 'next-i18next'
import {
  ExtensionType, TOKEN_PROGRAM_ID, TokenAccountNotFoundError, TokenInvalidAccountOwnerError, getAccount,
  getAssociatedTokenAddress, getExtensionData, getExtraAccountMetaAddress, getExtraAccountMetas, getMetadataPointerState,
  getMint, getMintCloseAuthority, getTokenMetadata, resolveExtraAccountMeta
} from '@solana/spl-token';

import { getTokenMetadataProc } from 'utils/getTokenMetadataA';
import LogoImage from 'utils/imageParam';
import { Avatar, Button, Card, Checkbox, Col, Divider, Flex, Input, Popconfirm, PopconfirmProps, Radio, RadioChangeEvent, Rate, Row, Space, Statistic, StatisticProps, Switch, Tooltip, Typography, message } from 'antd';
import { Metadata, usesBeet } from '@metaplex-foundation/mpl-token-metadata';
import { Tag } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  MinusCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import React from 'react';
//import Link from 'next/link';
const { Text, Link } = Typography;
const { TextArea } = Input;
import { SettingOutlined, RocketOutlined, RobotOutlined, RadarChartOutlined } from '@ant-design/icons';
import { setConnection, setWallet, sleep } from 'utils/config';
import { autoCloseAccount, getAllAccByMint, getKeys, getSOLPrice, getTokenAccount, setRayPubGas, swapOut_Buy, swapOut_Sale, swapOut_Sale_wallet, swap_Buy, swap_Sale, swap_Sale_wallet } from 'utils/raydium/rayFunction';
import { GetparsePoolInfo, GetparsePoolInfo_NotLPVal } from 'utils/raydium/ammV4MockPoolInfo';
import BN from "bn.js";
import bs58 from 'bs58';
import CountUp from 'react-countup';
import * as BL from "@solana/buffer-layout"
import { u8, struct, NearUInt64 } from "@solana/buffer-layout"
import { u64, publicKey } from "@solana/buffer-layout-utils"
//import 'antd/dist/antd.css';
//import '../../styles/globals.css';

import {
  RedoOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { Layout } from '@raydium-io/raydium-sdk';
import { tokenAmount } from '@metaplex-foundation/umi';
import { getJitoSetFee, getRandomTipAccount } from 'utils/jito/config';
import { sendBundle } from 'utils/jito/jito';


let tokenlist = [];
let userWallet;
let m_NowKey;
let userconnect;
let autoRun: boolean = false;
let canInit: boolean = false;
let autoBuyAmt;
let interId;
//let m_Tick;
let m_AutoSaleSleep;
let keyList = [];
//let SolPrice = 175.1;
const botAddr = new PublicKey("7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5");
const SOLMint = "So11111111111111111111111111111111111111112";

const pbkey = publicKey as any;

// 定义解码后的对象类型
interface InitLog {
  logType: number;
  openTime: BN; // 使用 BN 表示大数字
  quoteDecimals: number;
  baseDecimals: number;
  quoteLotSize: BN;
  baseLotSize: BN;
  quoteAmount: BN;
  baseAmount: BN;
  market: PublicKey;
}

// 定义 initLog 结构
const initLog = struct<InitLog>([
  u8('logType'),
  u64('openTime'),
  u8('quoteDecimals'),
  u8('baseDecimals'),
  u64('quoteLotSize'),
  u64('baseLotSize'),
  u64('quoteAmount'),
  u64('baseAmount'),
  publicKey('market')
]);

let autoAutoSaleRef = true;
let emvModeRef = false;
let autoNotFreeAccRef = true;
let autoAutoCloseRef = true;
//let jitofeeRef = 0.0000

export const TradeBotView: FC = ({ }) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signMessage, signTransaction, signAllTransactions } = useWallet();
  const { t } = useTranslation('common');
  const { Text } = Typography;
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const [checkTokenStatus, setcheckTokenStatus] = useState(-1);  //-1初始 0查询中
  const [checkTokenStatus1, setcheckTokenStatus1] = useState(-1);  //-1初始 0查询中
  const [disTokenAddr, setdisTokenAddr] = useState("5LNruZKwDvQex4aJA8JgYLw5ZYFGpodXBxZErkEbp6Co");
  const [checkTokenErrorMsg, setcheckTokenErrorMsg] = useState(""); //查询错误信息
  const [tokenFreeAuth, settokenFreeAuth] = useState(false);  //冻结权限
  const [tokenMintAuth, settokenMintAuth] = useState(false);  //增发权限
  const [tokenBurn, settokenBurn] = useState(true); //燃烧
  const [tokenBurnPer, settokenBurnPer] = useState(100); //燃烧比例
  const [tokenTop10Per, settokenTop10Per] = useState(12.5);
  const [tokenListString, settokenListString] = useState('');
  const [buyGas, setbuyGas] = useState("0.00001");  //Gas费
  const [tokenSafe, settokenSafe] = useState(2.5);
  const [tokenSymbol, settokenSymbol] = useState("Demo");
  const [tokenUri, settokenUri] = useState("https://api.dicebear.com/7.x/miniavs/svg?seed=0");
  const [tokenweb, settokenweb] = useState("https://www.pepetool.cc");
  const [tokenxLink, settokenxLink] = useState("https://twitter.com/pepetoolcc");
  const [tokentgLink, settokentgLink] = useState("https://t.me/pepetoolcc");
  const [tokenIsOpen, settokenIsOpen] = useState(true);
  const [tokenOpenTime, settokenOpenTime] = useState("");
  const [tokenPoolSol, settokenPoolSol] = useState(200);
  const [buySetting, setbuySetting] = useState(false);
  const [solPrice, setsolPrice] = useState(176.79);
  const [initWallet, setinitWallet] = useState(false);
  const [walletAddr, setwalletAddr] = useState("");
  const [userSolBalance, setuserSolBalance] = useState(0);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [refing, setRefIng] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [runMode, setrunMode] = useState(0);  //0手动  1自动
  const [autoNotFreeAcc, setautoNotFreeAcc] = useState(true);
  const [autoAutoSale, setautoAutoSale] = useState(true);
  //const autoAutoSaleRef = useRef(autoAutoSale);
  const [autoAutoClose, setautoAutoClose] = useState(true);
  const [logStrList, setLogStrList] = useState("");
  const [emvMode, setemvMode] = useState(true);
  const [jitoLevel, setjitoLevel] = useState(1);  //1
  const [jitofee, setJitoFee] = useState(0.00003);
  const jitofeeRef = useRef(jitofee);  //实时数值
  const [tokenReady, settokenReady] = useState(false);
  const [holdCount, setholdCount] = useState(0);
  //const [autoRun, setautoRun] = useState(false);

  useEffect(() => {
    autoAutoSaleRef = autoAutoSale;
    emvModeRef = emvMode;
    autoNotFreeAccRef = autoNotFreeAcc;
    autoAutoCloseRef = autoAutoClose;
    jitofeeRef.current = jitofee;
  }, [autoAutoSale, emvMode, autoNotFreeAcc, autoAutoClose, jitofee]);

  const handleautoSaleChange = () => {
    const newVal = !autoAutoSale;
    setautoAutoSale(newVal);
  };

  async function ping(url) {
    const startTime = Date.now();
    try {
      const response = await fetch(url);
      const endTime = Date.now();
      const latency = endTime - startTime;
      return latency;
    } catch (error) {
      console.error("Ping failed:", error);
      return -1; // Return -1 if ping fails
    }
  }



  const handleTest = async () => {
    //
    const BLOCK_ENGINE_URLS = [
      "amsterdam.mainnet.block-engine.jito.wtf",
      "frankfurt.mainnet.block-engine.jito.wtf",
      "ny.mainnet.block-engine.jito.wtf",
      "tokyo.mainnet.block-engine.jito.wtf"
    ];
    for (let i = 0; i < BLOCK_ENGINE_URLS.length; i++) {
      const engurl = BLOCK_ENGINE_URLS[i];
      const url = `https://${engurl}/api/v1/bundles`;
      const pin = await ping(url);
      console.log(`${BLOCK_ENGINE_URLS[i]}  ping:${pin}`);
    }
  }

  const onChangeBuyGas = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;//parseInt(event.target.value, 10);
    setbuyGas(value);
  }

  const handleChangeJito = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);//parseInt(event.target.value, 10);
    //setbuyGas(value);
    setJitoFee(value);
    jitofeeRef.current = value;
  }


  // function mySaleFunctionA() {
  //   console.log(autoNotFreeAccRef);
  // }

  // async function handeletest() {
  //   //
  //   //await new Promise(resolve => setTimeout(resolve, 100));
  //   const interId = setInterval(mySaleFunctionA, 1000);
  //   setTimeout(() => {
  //     clearInterval(interId);
  //   }, 20000);
  // }

  const addSoftLog = (log: String) => {
    const time = new Date().toLocaleTimeString();
    const logTime = `[${time}] -> `;
    setLogStrList(prevLogStrList => prevLogStrList + logTime + log + "\n");
  }

  function getTickCount() {
    return new Date().getTime();
  }

  function formatTimeDifferenceFromNow(timestamp1: number): string {
    const timestamp2 = Math.floor(Date.now() / 1000); // 当前时间戳（秒）
    if (timestamp2 >= timestamp1) {
      const diffInSeconds = Math.abs(timestamp2 - timestamp1);
      if (diffInSeconds < 60) {
        return `${diffInSeconds} s 前`;
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} m 前`;
      } else {
        const hours = Math.floor(diffInSeconds / 3600);
        const minutes = Math.floor((diffInSeconds % 3600) / 60);
        return `${hours} h ${minutes} m 前`;
      }
    } else {
      const diffInSeconds = Math.abs(timestamp1 - timestamp2);
      if (diffInSeconds < 60) {
        return `${diffInSeconds} s 后开始`;
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} m 后开始`;
      } else {
        const hours = Math.floor(diffInSeconds / 3600);
        const minutes = Math.floor((diffInSeconds % 3600) / 60);
        return `${hours} h ${minutes} m 后开始`;
      }
    }
  }

  function getBurnPercentage(lpReserve: number, actualSupply: number): number {
    const maxLpSupply = Math.max(actualSupply, (lpReserve - 1));
    const burnAmt = (maxLpSupply - actualSupply)
    console.log(`burn amt: ${burnAmt}`)
    return (burnAmt / maxLpSupply) * 100;
  }

  function compareByTokenAmount(a, b) {
    // console.log(a);
    // console.log(b);
    const amountA = parseFloat(a.account.data.parsed.info.tokenAmount.uiAmount);
    const amountB = parseFloat(b.account.data.parsed.info.tokenAmount.uiAmount);

    if (amountA > amountB) {
      return -1;
    }
    if (amountA < amountB) {
      return 1;
    }
    return 0;
  }

  const handleTokenChange1 = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value !== "") {
      if (!userWallet) {
        notify({ type: "error", message: "错误", description: "请连设置钱包" })
        return;
      }
      settokenReady(false);
      setcheckTokenStatus1(0);
      try {
        const corTokenKey = new PublicKey(value.trim());
        const thepoolInfo: any = await queryLpPair(corTokenKey.toString(), "So11111111111111111111111111111111111111112");
        let MaxPool;
        console.log("thepoolId:", thepoolInfo);
        if (!thepoolInfo) {
          notify({ type: "error", message: "错误", description: "未查询到对应的池子信息" });
          return;
        } else {
          if (thepoolInfo.Raydium_LiquidityPoolv4.length > 0) {
            if (thepoolInfo.Raydium_LiquidityPoolv4.length <= 1) {
              console.log("只有1个池子");
              MaxPool = thepoolInfo.Raydium_LiquidityPoolv4[0];

              //await setPoolInfo(getPoolID);
            } else {
              console.log("大于1个池子,找到最大的池子");
              // 找到 lpReserve 最高的池子信息对象
              const highestLpReservePool = thepoolInfo.Raydium_LiquidityPoolv4.reduce((highest, current) => {
                // 如果当前池子的 lpReserve 大于最高值，则更新最高值
                if (current.lpReserve > highest.lpReserve) {
                  return current;
                } else {
                  return highest;
                }
              }, thepoolInfo.Raydium_LiquidityPoolv4[0]); // 初始最高值为数组的第一个对象
              console.log("最高的lpReserve池子信息：", highestLpReservePool);
              MaxPool = highestLpReservePool;
              //await setPoolInfo(getPoolID);
            }
          }
        }
        const marketID = MaxPool.marketId;
        let quoteDec, mintDec;
        if (MaxPool.quoteMint === SOLMint) {
          quoteDec = MaxPool.quoteDecimal;
          mintDec = MaxPool.baseDecimal;
        } else {
          quoteDec = MaxPool.baseDecimal;
          mintDec = MaxPool.quoteDecimal;
        }
        // const quoteMint = MaxPool.quoteMint;
        // const OpenTime = MaxPool.poolOpenTime;
        // const nowTime = Math.floor(Date.now() / 1000);
        // if (nowTime >= OpenTime) {
        //   settokenIsOpen(true);
        // } else {
        //   settokenIsOpen(false);
        // }
        // const diffTime = formatTimeDifferenceFromNow(OpenTime);
        // console.log(diffTime);
        // settokenOpenTime(diffTime);

        console.log(marketID);
        console.log(quoteDec);


        let poolKey;
        if (MaxPool.quoteMint === SOLMint) {
          poolKey = await getKeys(new PublicKey(marketID), mintDec, quoteDec);
        } else {
          poolKey = await getKeys(new PublicKey(marketID), quoteDec, mintDec);
        }
        console.log("poolKey:", poolKey);
        m_NowKey = poolKey;
        settokenReady(true);
        setcheckTokenStatus1(-1);
        setdisTokenAddr(value);

        const tokenMetaData = await getTokenMetadataProc(userconnect, corTokenKey);
        console.log("Meta:", tokenMetaData);
        const cortokenSym = tokenMetaData.data.symbol;
        const cortokenuri = tokenMetaData.data.uri;
        const uri = cortokenuri.replace(/\u0000/g, '');
        const tokenJson = await getImageJson(uri);
        settokenSymbol(cortokenSym.replace(/\u0000/g, ''));
        if (tokenJson.image) {
          settokenUri(tokenJson.image);
        } else {
          settokenUri(uri);
        }
      } catch (err) {
        console.log(err);
        msg_error("代币地址错误");
        setcheckTokenStatus1(-1);

      }
    } else {
      settokenReady(false);
      setcheckTokenStatus1(-1);
    }
  }

  const handleTokenChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;//parseInt(event.target.value, 10);
    if (value !== "") {
      // if (!userWallet) {
      //   notify({ type: "error", message: "错误", description: "请连设置钱包" })
      //   return;
      // }
      const doc = document.getElementById("checktop") as HTMLInputElement | null;
      const checktop = doc?.checked;
      // console.log(checktop);
      // return;
      if (!userconnect) {
        userconnect = connection
      }
      setConnection(connection);
      if (userWallet) {
        setWallet(userWallet);
      }
      settokenReady(false);
      setcheckTokenStatus(0);  //查询中
      let nowtokenSafe = 0;
      try {
        const corTokenKey = new PublicKey(value);
        setdisTokenAddr(value);
        // const tokenAccount1 = await getAllAccByMint_Count(connection, corTokenKey, 20);
        // console.log(tokenAccount1);
        // console.log("持币人数: ",tokenAccount1.length);
        // return;
        const Mint = await getMint(userconnect, corTokenKey);
        //Mint.decimals //dec
        //Mint.supply  //总量
        console.log("Mint:", Mint);
        if (Mint.freezeAuthority) {
          settokenFreeAuth(true);
        } else {
          settokenFreeAuth(false);
          nowtokenSafe += 1;
        }
        if (Mint.mintAuthority) {
          settokenMintAuth(true);
        } else {
          settokenMintAuth(false);
          nowtokenSafe += 1;
        }
        const tokenMetaData = await getTokenMetadataProc(userconnect, corTokenKey);
        // 创建一个 TextDecoder 对象
        //const decoder = new TextDecoder('utf-8'); // 指定字符编码为 UTF-8

        // 使用 TextDecoder 解码 Uint8Array 数组并转换为字符串
        // const base64 = Buffer.from(a.data, 'base64');
        // //const base64 = atob(a.data);
        console.log("Meta:", tokenMetaData);
        const cortokenSym = tokenMetaData.data.symbol;
        const cortokenuri = tokenMetaData.data.uri;
        const uri = cortokenuri.replace(/\u0000/g, '');
        const tokenJson = await getImageJson(uri);
        settokenSymbol(cortokenSym.replace(/\u0000/g, ''));
        if (tokenJson.image) {
          settokenUri(tokenJson.image);
        } else {
          settokenUri(uri);
        }
        const exten = tokenJson.extensions;
        if (exten) {
          if (exten.website) {
            settokenweb(exten.website);
          } else {
            settokenweb("");
          }

          if (exten.twitter) {
            settokenxLink(exten.twitter);
          } else {
            settokenxLink("");
          }

          if (exten.telegram) {
            settokentgLink(exten.telegram);
          } else {
            settokentgLink("");
          }
        } else {
          settokenweb("");
          settokenxLink("");
          settokentgLink("");
        }
        // const solPoolInfo:any = await queryLpPair("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "So11111111111111111111111111111111111111112");
        // console.log("solPoolInfo:",solPoolInfo);


        const thepoolInfo: any = await queryLpPair(corTokenKey.toString(), "So11111111111111111111111111111111111111112");
        let MaxPool;
        console.log("thepoolId:", thepoolInfo);
        if (!thepoolInfo) {
          notify({ type: "error", message: "错误", description: "未查询到对应的池子信息" });
          return;
        } else {
          if (thepoolInfo.Raydium_LiquidityPoolv4.length > 0) {
            if (thepoolInfo.Raydium_LiquidityPoolv4.length <= 1) {
              console.log("只有1个池子");
              MaxPool = thepoolInfo.Raydium_LiquidityPoolv4[0];

              //await setPoolInfo(getPoolID);
            } else {
              console.log("大于1个池子,找到最大的池子");
              // 找到 lpReserve 最高的池子信息对象
              const highestLpReservePool = thepoolInfo.Raydium_LiquidityPoolv4.reduce((highest, current) => {
                // 如果当前池子的 lpReserve 大于最高值，则更新最高值
                if (current.lpReserve > highest.lpReserve) {
                  return current;
                } else {
                  return highest;
                }
              }, thepoolInfo.Raydium_LiquidityPoolv4[0]); // 初始最高值为数组的第一个对象
              console.log("最高的lpReserve池子信息：", highestLpReservePool);
              MaxPool = highestLpReservePool;
              //await setPoolInfo(getPoolID);
            }
          }
        }
        const marketID = MaxPool.marketId;
        let quoteDec;
        if (MaxPool.quoteMint === SOLMint) {
          quoteDec = MaxPool.quoteDecimal;
        } else {
          quoteDec = MaxPool.baseDecimal;
        }
        const quoteMint = MaxPool.quoteMint;
        const OpenTime = MaxPool.poolOpenTime;
        const nowTime = Math.floor(Date.now() / 1000);
        if (nowTime >= OpenTime) {
          settokenIsOpen(true);
        } else {
          settokenIsOpen(false);
        }
        const diffTime = formatTimeDifferenceFromNow(OpenTime);
        console.log(diffTime);
        settokenOpenTime(diffTime);

        console.log(marketID);
        console.log(quoteDec);

        let poolKey;
        if (userWallet) {
          if (MaxPool.quoteMint === SOLMint) {
            poolKey = await getKeys(new PublicKey(marketID), Mint.decimals, quoteDec);
          } else {
            poolKey = await getKeys(new PublicKey(marketID), quoteDec, Mint.decimals);
          }
          console.log("poolKey:", poolKey);
          m_NowKey = poolKey;
        }


        //获取池子资金信息
        const poolInfo = await GetparsePoolInfo_NotLPVal(userconnect, new PublicKey(MaxPool.pubkey));
        console.log("poolInfo:", poolInfo);
        //------
        settokenPoolSol(poolInfo.quoteBalance);
        //获取燃烧信息
        const info: any = await queryLpMintInfo(MaxPool.pubkey);
        const lpMint = info.Raydium_LiquidityPoolv4[0].lpMint
        //Once we have the lpMint address, we need to fetch the current token supply and decimals
        const parsedAccInfo: any = await userconnect.getParsedAccountInfo(new PublicKey(lpMint));
        const mintInfo = parsedAccInfo?.value?.data?.parsed?.info
        //We divide the values based on the mint decimals
        const lpReserve = info.Raydium_LiquidityPoolv4[0].lpReserve / Math.pow(10, mintInfo?.decimals)
        const actualSupply = mintInfo?.supply / Math.pow(10, mintInfo?.decimals)
        console.log(`lpMint: ${lpMint}, Reserve: ${lpReserve}, Actual Supply: ${actualSupply}`);

        //Calculate burn percentage
        const burnPct = parseFloat(getBurnPercentage(lpReserve, actualSupply).toFixed(2));
        console.log(`${burnPct} LP burned`);
        settokenBurnPer(burnPct);
        if (burnPct >= 100) {
          nowtokenSafe += 1;
          settokenBurn(true);
        } else {
          settokenBurn(false);
        }


        let top10Per = 12.5;
        //获取持币地址
        if (checktop) {
          const tokenAccount = await getAllAccByMint(userconnect, corTokenKey);
          //console.log(tokenAccount);
          console.log("持币人数: ", tokenAccount.length);
          setholdCount(tokenAccount.length);
          //排序
          tokenAccount.sort(compareByTokenAmount);
          let PoolAuth;
          if (userWallet) {
            PoolAuth = poolKey.authority.toString();
          } else {
            PoolAuth = "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1"
          }
          console.log("PoolAuth", PoolAuth);
          console.log(MaxPool);
          let tokenList: string[] = [];
          let Count = 0;
          let top10Count = 0;
          const TokenSupply = new BN(Mint.supply).div(new BN(Math.pow(10, Mint.decimals)));//Mint.supply / Math.pow(10, Mint.decimals);
          settokenListString("");
          for (let j = 0; j < tokenAccount.length; j++) {
            const Tokeninfo = tokenAccount[j].account.data.parsed.info;
            if (Tokeninfo.owner === PoolAuth) {
              tokenList.push(truncateString(Tokeninfo.owner, 16, 8, 8) + "(RaydiumPool)/" + Tokeninfo.tokenAmount.uiAmount);
            } else {
              tokenList.push(Tokeninfo.owner + "/" + Tokeninfo.tokenAmount.uiAmount);
              top10Count += Number(Tokeninfo.tokenAmount.uiAmount);
              Count += 1;
              if (Count >= 10) {
                break;
              }
            }
          }
          //=======================
          console.log("top10Count", top10Count);
          console.log("TokenSupply", TokenSupply);
          const topPer = (top10Count / TokenSupply * 100).toFixed(2);
          top10Per = parseFloat(topPer);
          settokenTop10Per(top10Per);
          const tokenListString = tokenList.join('\n');
          settokenListString(tokenListString);
        }


        console.log(top10Per);
        if (top10Per <= 20) {
          nowtokenSafe += 2;
        } else if (top10Per <= 30) {
          nowtokenSafe += 1.5;
        } else if (top10Per <= 50) {
          nowtokenSafe += 1;
        } else {
          nowtokenSafe += 0.5;
        }


        console.log(nowtokenSafe);
        settokenSafe(nowtokenSafe);
        if (userWallet) {
          setTimeout(async () => {
            await handleRefTokenAmount();
          }, 1000);
        }

        if (userWallet) {
          settokenReady(true);
        }
        setcheckTokenStatus(-1);
      } catch (err) {
        console.log(err);
        setcheckTokenErrorMsg("输入的代币地址错误")
        setcheckTokenStatus(1); //代币地址错误
      }

    } else {
      setcheckTokenStatus(-1);  //初始状态
      settokenReady(false);
    }
  }

  const getUpdatedBalance = async (ata, vaultType) => {
    console.log("getUpdatedBalance listening...");
    userconnect.onAccountChange(ata, (info, context) => {
      console.log("info:", info);
      console.log("info.data length:", info.data.length);
      //info.lamports 监听帐号sol变化
      console.log("context:", context);
      const sol = info.lamports / LAMPORTS_PER_SOL;
      setuserSolBalance(sol);

      if (runMode === 0) {
        setTimeout(async () => {
          await handleRefTokenAmount();
        }, 1000);
      }

      // 仅在数据长度足够时读取和解码
      if (info.data.length >= 72) {
        try {
          const balance = new BL.NearUInt64().decode(new Uint8Array(info.data.subarray(64, 72)));
          const slot = context.slot;
          console.log("Decoded balance:", balance);
          console.log("Slot:", slot);
          // balEmit.emit('balanceUpdated', { balance, slot, vaultType });
        } catch (err) {
          console.error("Error decoding balance:", err);
        }
      } else {
        console.warn("Data length is insufficient:", info.data.length);
      }
    }, { dataSlice: { offset: 64, length: 8 } });
  }

  const handleSetWallet = async () => {
    // msg_success('hi~~~~~~');
    // return;
    const doc = document.getElementById("userwallet") as HTMLInputElement | null;
    const userWalletStr = doc?.value;
    try {
      userWallet = Keypair.fromSecretKey(bs58.decode(userWalletStr));
      setWallet(userWallet);
      const lastSolPrice = await getSOLPrice();
      console.log(lastSolPrice);
      //solPrice = lastSolPrice;
      setsolPrice(lastSolPrice);
      if (!userconnect) {
        userconnect = connection;
        setConnection(userconnect);
      }
      //userconnect = new Connection("https://late-bold-frog.solana-mainnet.quiknode.pro/f1f4d357a1d3468a05726f12051b10fa57790c3b");
      //const sol = await userconnect.ge
      let balance;
      balance = await userconnect.getBalance(
        userWallet.publicKey,
        'confirmed'
      );
      balance = balance / LAMPORTS_PER_SOL;
      setuserSolBalance(balance);

      getUpdatedBalance(userWallet.publicKey, 'base')
      setwalletAddr(userWallet.publicKey.toString());
      console.log("钱包设置完成");

      setinitWallet(true);
    } catch (err) {
      notify({ type: "error", message: "错误", description: "钱包设置错误!" })
      return
    }
  }

  const msg_success = (msg) => {
    messageApi.open({
      type: 'success',
      content: msg,
    });
  };

  const msg_error = (msg) => {
    messageApi.open({
      type: 'error',
      content: msg,
    });
  };

  async function buyFunction(keys, amount, minAmount) {
    setRayPubGas(parseFloat(buyGas));
    console.log(buyGas);
    if (keys.quoteMint.toString() === SOLMint) {
      const tx = await swap_Buy(keys, amount * LAMPORTS_PER_SOL, minAmount);
      if (!emvModeRef) {
        const sent = await userconnect.sendTransaction(tx, [userWallet], { skipPreflight: true })
        console.log("swapped in tx id:", sent);
        return sent;
      } else {
        //--------------
        const JitoTip = getRandomTipAccount();
        const JitoFee = Number(jitofeeRef.current);//getJitoSetFee(jitoRef.current);
        tx.add(
          SystemProgram.transfer({
            fromPubkey: userWallet.publicKey,
            toPubkey: JitoTip,
            lamports: JitoFee * LAMPORTS_PER_SOL,
          }));
        const latestBlockhash = await connection.getLatestBlockhash();
        tx.feePayer = userWallet.publicKey;
        tx.recentBlockhash = latestBlockhash.blockhash;
        tx.sign(userWallet);
        const jitoTx = bs58.encode(tx.serialize());
        let bundle = [];
        bundle.push(jitoTx);
        const sent = await sendBundle(bundle);
        console.log("swapped in tx id:", sent);
        return sent;
      }
    } else {
      const tx = await swapOut_Buy(keys, amount * LAMPORTS_PER_SOL, minAmount);
      if (!emvModeRef) {
        const sent = await userconnect.sendTransaction(tx, [userWallet], { skipPreflight: true })
        console.log("swapped in tx id:", sent);
        //msg_success('交易已提交');
        return sent;
      } else {
        const JitoTip = getRandomTipAccount();
        const JitoFee = Number(jitofeeRef.current);//getJitoSetFee(jitoRef.current);
        tx.add(
          SystemProgram.transfer({
            fromPubkey: userWallet.publicKey,
            toPubkey: JitoTip,
            lamports: JitoFee * LAMPORTS_PER_SOL,
          })
        );
        const latestBlockhash = await connection.getLatestBlockhash();
        tx.feePayer = userWallet.publicKey;
        tx.recentBlockhash = latestBlockhash.blockhash;
        tx.sign(userWallet);
        const jitoTx = bs58.encode(tx.serialize());
        let bundle = [];
        bundle.push(jitoTx);
        const sent = await sendBundle(bundle);
        console.log("swapped in tx id:", sent);
        return sent;
      }
    }
  }


  const handleBuy = async () => {
    if (!initWallet) {
      notify({ type: "error", message: "错误", description: "钱包未设置!" })
      return
    }
    if (!m_NowKey) {
      notify({ type: "error", message: "错误", description: "请先填写代币" })
      return;
    }



    const doc = document.getElementById("buyamt") as HTMLInputElement | null;
    const buyamtStr = doc?.value;
    if (buyamtStr !== "") {
      try {
        const buyAmount = Number(buyamtStr);
        if (buyAmount < (userSolBalance - 0.002)) {
          await buyFunction(m_NowKey, buyAmount, 0);
          msg_success('交易已提交');
        } else {
          msg_error('SOL余额不足');
        }
      } catch (err) {
        console.log(err);
        msg_error('交易失败');
      }
    }
  }

  const handleBuyFromAmt = async (amt: number) => {
    if (!initWallet) {
      notify({ type: "error", message: "错误", description: "钱包未设置!" })
      return
    }
    if (!m_NowKey) {
      notify({ type: "error", message: "错误", description: "请先填写代币" })
      return;
    }

    try {
      //const buyAmt = amt * LAMPORTS_PER_SOL;
      if (amt < (userSolBalance - 0.002)) {
        // const tx = await swap_Buy(m_NowKey, buyAmt, 0);
        // const sent = await userconnect.sendTransaction(tx, [userWallet], { skipPreflight: true })
        // console.log("swapped in tx id:", sent)
        // msg_success('交易已提交');
        await buyFunction(m_NowKey, amt, 0);
        msg_success('交易已提交');
      } else {
        msg_error('SOL余额不足');
      }
    } catch (err) {
      console.log(err);
      msg_error('交易失败');
    }
  }

  function getDecByKeys(keys) {
    if (keys.quoteMint.toString() === SOLMint) {
      return keys.baseDecimals;
    } else {
      return keys.quoteDecimals;
    }
  }

  const SaleTokenByPer = async (per) => {
    if (!initWallet) {
      notify({ type: "error", message: "错误", description: "钱包未设置!" })
      return;
    }
    if (!m_NowKey) {
      notify({ type: "error", message: "错误", description: "请先填写代币" })
      return;
    }
    if (tokenBalance === 0) {
      notify({ type: "error", message: "错误", description: "当前代币没有余额" })
      return;
    }

    try {
      const dec = getDecByKeys(m_NowKey);
      console.log(dec);
      const tokenCount = Math.floor(tokenBalance * Math.pow(10, dec));
      //const saleAmount = 0;//Number(saleamtStr);
      const saleamtV = Math.floor(tokenCount / 100 * per);
      //console.log("saleAmount", saleAmount);
      console.log("saleamtV", saleamtV);
      await saleFunction(m_NowKey, saleamtV);
      msg_success('卖出交易已提交');
      // const tx = await swap_Sale(m_NowKey, saleamtV, 0);
      // const sent = await userconnect.sendTransaction(tx, [userWallet], { skipPreflight: true })
      // console.log("swapped in tx id:", sent)
      // msg_success('卖出交易已提交');
    } catch (err) {
      msg_error('卖出交易失败,请尝试减少数量');
      console.log(err);
    }

  }

  async function saleFunction(keys, amount) {
    setRayPubGas(parseFloat(buyGas));
    console.log(buyGas);
    if (keys.quoteMint.toString() === SOLMint) {
      //console.log(amount)
      const tx = await swap_Sale_wallet(keys, BigInt(amount), BigInt(0), userWallet);
      
      if (!emvModeRef) {
        const sent = await userconnect.sendTransaction(tx, [userWallet], { skipPreflight: true })
        console.log("swapped in tx id:", sent);
        return sent;
      } else {
        const JitoTip = getRandomTipAccount();
        const JitoFee = Number(jitofeeRef.current);//getJitoSetFee(jitofeeRef.current);
        tx.add(
          SystemProgram.transfer({
            fromPubkey: userWallet.publicKey,
            toPubkey: JitoTip,
            lamports: JitoFee * LAMPORTS_PER_SOL,
          })
        );
        const latestBlockhash = await connection.getLatestBlockhash();
        tx.feePayer = userWallet.publicKey;
        tx.recentBlockhash = latestBlockhash.blockhash;
        tx.sign(userWallet);
        const jitoTx = bs58.encode(tx.serialize());
        let bundle = [];
        bundle.push(jitoTx);
        const sent = await sendBundle(bundle);
        console.log("swapped in tx id:", sent);
        return sent;
      }
    } else {
      //console.log(amount)
      const tx = await swapOut_Sale_wallet(keys, BigInt(amount), BigInt(0), userWallet);
      if (!emvModeRef) {
        const sent = await userconnect.sendTransaction(tx, [userWallet], { skipPreflight: true })
        console.log("swapped in tx id:", sent)
        //console.log(amount) 
        return sent;
      } else {
        const JitoTip = getRandomTipAccount();
        const JitoFee = Number(jitofeeRef.current);//getJitoSetFee(jitofeeRef.current);
        tx.add(
          SystemProgram.transfer({
            fromPubkey: userWallet.publicKey,
            toPubkey: JitoTip,
            lamports: JitoFee * LAMPORTS_PER_SOL,
          })
        );
        const latestBlockhash = await connection.getLatestBlockhash();
        tx.feePayer = userWallet.publicKey;
        tx.recentBlockhash = latestBlockhash.blockhash;
        tx.sign(userWallet);
        const jitoTx = bs58.encode(tx.serialize());
        let bundle = [];
        bundle.push(jitoTx);
        const sent = await sendBundle(bundle);
        console.log("swapped in tx id:", sent);
        return sent;
      }
    }
  }

  const handleSale = async () => {
    if (!initWallet) {
      notify({ type: "error", message: "错误", description: "钱包未设置!" })
      return;
    }
    if (!m_NowKey) {
      notify({ type: "error", message: "错误", description: "请先填写代币" })
      return;
    }

    const doc = document.getElementById("saleamt") as HTMLInputElement | null;
    const saleamtStr = doc?.value;
    if (saleamtStr !== "") {
      try {
        const saleAmount = Number(saleamtStr);
        const dec = getDecByKeys(m_NowKey);
        //console.log(dec);
        const saleamtV = Math.floor(saleAmount * Math.pow(10, dec));
        console.log("saleAmount", saleAmount);
        console.log("saleamtV", saleamtV);
        await saleFunction(m_NowKey, saleamtV);
        // const tx = await swap_Sale(m_NowKey, saleamtV, 0);
        // // tx.recentBlockhash = bh.blockhash
        // // tx.feePayer = keypairs[each].publicKey
        // const sent = await userconnect.sendTransaction(tx, [userWallet], { skipPreflight: true })
        // console.log("swapped in tx id:", sent)
        // msg_success('卖出交易已提交');
        msg_success('卖出交易已提交');
      } catch (err) {
        msg_error('卖出交易失败');
      }
    }
  }

  const formatter: StatisticProps['formatter'] = (value) => (
    <CountUp end={value as number} separator="," />
  );

  const refTokenAccount = () => {
    //
  }

  const handleRefTokenAmount = async () => {
    if (m_NowKey) {
      setRefIng(true);
      setTokenBalance(0);
      try {
        const tokenAccount = await getTokenAccount(userconnect, userWallet.publicKey);
        for (let j = 0; j < tokenAccount.length; j++) {
          const Tokeninfo = tokenAccount[j].account.data.parsed.info;
          if (m_NowKey.quoteMint.toString() === SOLMint) {
            if (Tokeninfo.mint === m_NowKey.baseMint.toString()) {
              const tokenAmt = Tokeninfo.tokenAmount.uiAmount;
              setTokenBalance(Number(tokenAmt));
              setRefIng(false);
            }
          } else {
            if (Tokeninfo.mint === m_NowKey.quoteMint.toString()) {
              const tokenAmt = Tokeninfo.tokenAmount.uiAmount;
              setTokenBalance(Number(tokenAmt));
              setRefIng(false);
            }
          }
        }
      } catch (err) {
        console.log('getTokenAccount Error~!', err);
        setRefIng(false);
      } finally {
        setRefIng(false);
      }
    }
  }

  function getKeysMintStr(keys) {
    if (keys.quoteMint.toString() === SOLMint) {
      return keys.baseMint.toString();
    } else {
      return keys.quoteMint.toString();
    }
  }

  const initLogs = async () => {
    console.log("listening for new raydium pools...");
    userconnect.onLogs(botAddr, async (logs) => {
      for (const log of logs.logs) {
        //console.log(log);
        if (log.includes("ray_log")) {
          //console.log(log);
          if (autoRun) {
            const rayLog = log.split(" ").pop()?.replace("'", "");
            if (rayLog) {
              const { market, baseDecimals, quoteDecimals, openTime } = initLog.decode(Buffer.from(rayLog, "base64")) as InitLog;
              const openTme = Number(openTime.toString());
              const now = new Date().getTime() / 1000;
              //console.log(now);              
              const keys = await getKeys(market, baseDecimals, quoteDecimals);

              if (keys.quoteMint.toString() === SOLMint) {
                //console.log("id:", keys.id.toBase58());
                //console.log("mint:", keys.baseMint.toBase58());

                const baseMintStr = keys.baseMint.toBase58();
                addSoftLog(`检测到新代币: ${baseMintStr}`);
                try {
                  if (autoNotFreeAccRef) {
                    const Mint = await getMint(userconnect, keys.baseMint);
                    console.log("Mint:", Mint);
                    if (Mint.freezeAuthority) {
                      //settokenFreeAuth(true);  //冻结
                      addSoftLog(`代币: ${truncateString(baseMintStr, 8, 4, 4)}未放弃冻结权限  跳过`);
                      return
                    } else {
                      if (openTme > now) {
                        console.log(openTme);
                        console.log(now);
                        const newKeys = { ...keys, Tick: 0, SaleCount: 0, openTime: openTme, isBuy: false };
                        keyList.push(newKeys);
                        addSoftLog(`尚未开盘 ${getKeysMintStr(keys)} `);
                        return;
                      }

                      // const tx = await swap_Buy(keys, autoBuyAmt * LAMPORTS_PER_SOL, 0);
                      // const sent = await userconnect.sendTransaction(tx, [userWallet], { skipPreflight: true });
                      // console.log("swapped in tx id:", sent);
                      const sent = await buyFunction(keys, autoBuyAmt, 0);
                      const newKeys = { ...keys, Tick: getTickCount(), SaleCount: 0, openTime: openTme, isBuy: true };
                      keyList.push(newKeys);
                      addSoftLog(`买入: ${truncateString(baseMintStr, 8, 4, 4)} , ${autoBuyAmt} SOL 成功 哈希: ${sent}`);
                    }
                  } else {
                    //不检测冻结
                    if (openTme > now) {
                      console.log(openTme);
                      console.log(now);
                      const newKeys = { ...keys, Tick: 0, SaleCount: 0, openTime: openTme, isBuy: false };
                      keyList.push(newKeys);
                      addSoftLog(`尚未开盘 ${getKeysMintStr(keys)} `);
                      return;
                    }

                    // const tx = await swap_Buy(keys, autoBuyAmt * LAMPORTS_PER_SOL, 0);
                    // const sent = await userconnect.sendTransaction(tx, [userWallet], { skipPreflight: true });
                    // console.log("swapped in tx id:", sent);
                    const sent = await buyFunction(keys, autoBuyAmt, 0);
                    const newKeys = { ...keys, Tick: getTickCount(), SaleCount: 0, openTime: openTme, isBuy: true };
                    keyList.push(newKeys);
                    addSoftLog(`买入: ${truncateString(baseMintStr, 8, 4, 4)} , ${autoBuyAmt} SOL 成功 哈希: ${sent}`);
                  }
                } catch (E) {
                  console.log("pool probably wasn't open yet:", openTime.toString(), Date.now());
                }
              } else if (keys.baseMint.toString() === SOLMint) {
                //addSoftLog(`代币: ${truncateString(keys.quoteMint.toString(), 8, 4, 4)} , 代币类型暂不支持跳过`);
                const quoteMintStr = keys.quoteMint.toBase58();
                addSoftLog(`检测到新代币#: ${quoteMintStr}`);
                try {
                  if (autoNotFreeAccRef) {
                    const Mint = await getMint(userconnect, keys.quoteMint);
                    console.log("Mint:", Mint);
                    if (Mint.freezeAuthority) {
                      //settokenFreeAuth(true);  //冻结
                      addSoftLog(`代币: ${truncateString(quoteMintStr, 8, 4, 4)}未放弃冻结权限  跳过`);
                      return
                    } else {
                      const tx = await swapOut_Buy(keys, autoBuyAmt * LAMPORTS_PER_SOL, 0);
                      const sent = await userconnect.sendTransaction(tx, [userWallet], { skipPreflight: true });
                      console.log("swapped in tx id:", sent);
                      const newKeys = { ...keys, Tick: getTickCount(), SaleCount: 0, openTime: openTme, isBuy: true };
                      keyList.push(newKeys);
                      addSoftLog(`买入#: ${truncateString(quoteMintStr, 8, 4, 4)} , ${autoBuyAmt} SOL 成功 哈希: ${sent}`);
                    }
                  } else {
                    //不检测冻结
                    const tx = await swapOut_Buy(keys, autoBuyAmt * LAMPORTS_PER_SOL, 0);
                    const sent = await userconnect.sendTransaction(tx, [userWallet], { skipPreflight: true });
                    console.log("swapped in tx id:", sent);
                    const newKeys = { ...keys, Tick: getTickCount(), SaleCount: 0, openTime: openTme, isBuy: true };
                    keyList.push(newKeys);
                    addSoftLog(`买入#: ${truncateString(quoteMintStr, 8, 4, 4)} , ${autoBuyAmt} SOL 成功 哈希: ${sent}`);
                  }
                } catch (E) {
                  console.log("pool probably wasn't open yet:", openTime.toString(), Date.now());
                }
              }
            }
          }
        }
      }
    });
  }

  async function getTokenAmountByMint(mint: string) {
    try {
      const tokenAccount = await getTokenAccount(userconnect, userWallet.publicKey);
      for (let j = 0; j < tokenAccount.length; j++) {
        const Tokeninfo = tokenAccount[j].account.data.parsed.info;
        if (Tokeninfo.mint === mint) {
          const tokenAmt = Tokeninfo.tokenAmount.uiAmount;
          //setTokenBalance(Number(tokenAmt));
          //setRefIng(false);
          return ({
            AtaKey: tokenAccount[j].pubkey,
            Amount: Number(tokenAmt)
          });
        }
      }
    } catch (err) {
      console.log('getTokenAccount Error~!', err);
      //setRefIng(false);
      return ({
        AtaKey: -1,
        Amount: -1
      });
    }

    //未找到返回~~~
    return ({
      AtaKey: -1,
      Amount: -1
    });
  }

  async function mySaleFunction() {
    if (!autoRun) { return }
    if (!autoAutoSaleRef) { return }
    //console.log("程序正在运行...", new Date().toLocaleTimeString());
    //addSoftLog('开始卖出检测');
    const nowTick = getTickCount();
    for (let i = 0; i < keyList.length; i++) {
      const keys = keyList[i];
      if (keys.isBuy) {
        if ((nowTick - keys.Tick) >= m_AutoSaleSleep) {
          //------------判断卖出
          //console.log(nowTick);
          //console.log(keys.Tick);
          //console.log(keys.baseMint.toString());
          //console.log(m_AutoSaleSleep);
          keys.Tick += 15000; //getTickCount();  //直接修改可以~~~
          //---------          
          const tokenInfo = await getTokenAmountByMint(getKeysMintStr(keys));
          if (tokenInfo.Amount !== -1) {
            if (tokenInfo.Amount === 0) {
              //判断是否关闭账户  
              //--------
              if (autoAutoCloseRef) {
                const tx = await autoCloseAccount(tokenInfo.AtaKey, userWallet.publicKey);
                // tx.recentBlockhash = bh.blockhash
                // tx.feePayer = keypairs[each].publicKey
                console.log('关闭账户~');
                const sent = await userconnect.sendTransaction(tx, [userWallet], { skipPreflight: true })
                console.log("swapped in tx id:", sent)
                addSoftLog(`自动关闭账户成功`);
              }
              keyList.splice(i, 1);
              break;
            } else {
              //#####################这里有空可以优化一下???       
              if (keys.quoteMint.toString() === SOLMint) {
                try {
                  //const saleAmount = Number(saleamtStr);
                  keys.SaleCount += 1;
                  if (keys.SaleCount >= 5) {
                    addSoftLog(`${truncateString(keys.baseMint.toBase58(), 8, 4, 4)} 卖出失败,跳过`);
                    keyList.splice(i, 1);
                    break;
                  }
                  const saleamtV = Math.floor(tokenInfo.Amount * Math.pow(10, keys.baseDecimals));
                  console.log("saleamtV", saleamtV);
                  // const tx = await swap_Sale(keys, saleamtV, 0);
                  // // tx.recentBlockhash = bh.blockhash
                  // // tx.feePayer = keypairs[each].publicKey
                  // const sent = await userconnect.sendTransaction(tx, [userWallet], { skipPreflight: true })
                  // console.log("swapped in tx id:", sent)
                  const sent = await saleFunction(keys, saleamtV);

                  addSoftLog(`卖出 ${truncateString(keys.baseMint.toBase58(), 8, 4, 4)} 数量:${tokenInfo.Amount} 完成 哈希: ${sent}`);
                  // msg_success('卖出交易已提交');
                } catch (err) {
                  //msg_error('卖出交易失败');
                  console.log(err);
                  addSoftLog(`卖出 ${truncateString(keys.baseMint.toBase58(), 8, 4, 4)} 失败`);
                }
              } else if (keys.baseMint.toString() === SOLMint) {
                try {
                  //const saleAmount = Number(saleamtStr);
                  keys.SaleCount += 1;
                  if (keys.SaleCount >= 5) {
                    addSoftLog(`${truncateString(keys.quoteMint.toBase58(), 8, 4, 4)} 卖出失败,跳过`);
                    keyList.splice(i, 1);
                    break;
                  }
                  const saleamtV = Math.floor(tokenInfo.Amount * Math.pow(10, keys.quoteDecimals));
                  console.log("saleamtV", saleamtV);
                  // const tx = await swapOut_Sale(keys, saleamtV, 0);
                  // //------
                  // //saleFunction();//
                  // // tx.recentBlockhash = bh.blockhash
                  // // tx.feePayer = keypairs[each].publicKey
                  // const sent = await userconnect.sendTransaction(tx, [userWallet], { skipPreflight: true })
                  // console.log("swapped in tx id:", sent)
                  const sent = await saleFunction(keys, saleamtV);

                  addSoftLog(`卖出# ${truncateString(keys.quoteMint.toBase58(), 8, 4, 4)} 数量:${tokenInfo.Amount} 完成 哈希: ${sent}`);
                  // msg_success('卖出交易已提交');
                } catch (err) {
                  //msg_error('卖出交易失败');
                  console.log(err);
                  addSoftLog(`卖出# ${truncateString(keys.quoteMint.toBase58(), 8, 4, 4)} 失败`);
                }
              }
            }
          } else {
            //-------没有代币??
            addSoftLog(`#没有代币 ${truncateString(keys.baseMint.toBase58(), 8, 4, 4)}`);
            keyList.splice(i, 1);
            break;
          }
        }
      } else {
        const now = new Date().getTime() / 1000;
        //console.log(`开盘检测${now} - ${keys.openTime}`);
        if (now >= keys.openTime) {
          //###############这里也可以优化?
          if (keys.quoteMint.toString() === SOLMint) {
            const baseMintStr = keys.baseMint.toBase58();
            addSoftLog(`代币开盘: ${baseMintStr}`);
            keys.Tick = getTickCount();
            keys.isBuy = true;
            try {
              //不检测冻结
              const buyAmtV = Math.floor(autoBuyAmt * LAMPORTS_PER_SOL);
              // const tx = await swap_Buy(keys, buyAmtV, 0);
              // const sent = await userconnect.sendTransaction(tx, [userWallet], { skipPreflight: true });
              // console.log("swapped in tx id:", sent);
              const sent = await buyFunction(keys, autoBuyAmt, 0);
              addSoftLog(`买入: ${truncateString(baseMintStr, 8, 4, 4)} , ${autoBuyAmt} SOL 成功 哈希: ${sent}`);
            } catch (E) {
              console.log(E);
              //console.log("pool probably wasn't open yet:", openTime.toString(), Date.now());
            }
          } else if (keys.baseMint.toString() === SOLMint) {
            //addSoftLog(`代币: ${truncateString(keys.quoteMint.toString(), 8, 4, 4)} , 代币类型暂不支持跳过`);
            const quoteMintStr = keys.quoteMint.toBase58();
            addSoftLog(`检测到新代币#: ${quoteMintStr}`);
            try {
              const baseMintStr = keys.baseMint.toBase58();
              addSoftLog(`代币开盘#: ${baseMintStr}`);
              keys.Tick = getTickCount();
              keys.isBuy = true;
              try {
                //不检测冻结
                // const buyAmtV = Math.floor(autoBuyAmt * LAMPORTS_PER_SOL);
                // const tx = await swapOut_Buy(keys, buyAmtV, 0);
                // const sent = await userconnect.sendTransaction(tx, [userWallet], { skipPreflight: true });
                const sent = await buyFunction(keys, autoBuyAmt, 0);
                console.log("swapped in tx id:", sent);
                addSoftLog(`买入#: ${truncateString(baseMintStr, 8, 4, 4)} , ${autoBuyAmt} SOL 成功 哈希: ${sent}`);
              } catch (E) {
                console.log(E);
                //console.log("pool probably wasn't open yet:", openTime.toString(), Date.now());
              }
            } catch (E) {
              console.log(E);
              //console.log("pool probably wasn't open yet:", openTime.toString(), Date.now());
            }
          }
        }
      }
    }
  }

  const handleAutoRun = (checked) => {
    if (checked) {
      // console.log(new Date().getTime());
      // return
      // interId = setInterval(myFunction, 5000);
      // return;
      if (!userWallet) {
        notify({ type: "error", message: "错误", description: "请先设置钱包" })
        return;
      }
      //-------autobuyamt  autoBuyAmt
      const doc = document.getElementById("autobuyamt") as HTMLInputElement | null;
      const buyamtStr = doc?.value;
      if (buyamtStr === "") {
        notify({ type: "error", message: "错误", description: "自动买入数量不能为空" })
        return;
      }
      autoBuyAmt = Number(buyamtStr);

      if (autoAutoSaleRef) {
        const timedoc = document.getElementById("salesleep") as HTMLInputElement | null;
        const timeStr = timedoc?.value;
        if (timeStr === "") {
          notify({ type: "error", message: "错误", description: "自动卖出时间不能为空" })
          return;
        }
        const TimeSleep = Number(timeStr);
        m_AutoSaleSleep = TimeSleep * 1000;
        interId = setInterval(mySaleFunction, 1000);
      }

      if (!canInit) {
        initLogs();
        canInit = true;
      }
      //keyList=[];
      autoRun = true;
      addSoftLog(`开始运行 SOL余额: ${userSolBalance}`);
    } else {
      autoRun = false;
      if (interId) {
        clearInterval(interId);
      }
    }
  }

  function findKeysByMint(Mint: PublicKey) {
    for (let i = 0; i < keyList.length; i++) {
      const keys = keyList[i];
      if (keys.baseMint === Mint || keys.quoteMint) {
        return keys
      }
    }
    return null;
  }

  //confirmSaleAll
  const confirmSaleAll: PopconfirmProps['onConfirm'] = async (e) => {
    console.log(e);
    addSoftLog('正在执行一键清仓');
    try {
      const tokenAccount = await getTokenAccount(userconnect, userWallet.publicKey);
      for (let j = 0; j < tokenAccount.length; j++) {
        const Tokeninfo = tokenAccount[j].account.data.parsed.info;
        const tokenAmt = Tokeninfo.tokenAmount.uiAmount;
        if (tokenAmt > 0) {
          console.log(`正在查询: ${Tokeninfo.mint}`);
          addSoftLog(`正在查询: ${Tokeninfo.mint}`);
          let keys = findKeysByMint(new PublicKey(Tokeninfo.mint));
          if (keys !== null) {
            if (keys.quoteMint.toString() === SOLMint) {
              const saleamtV = Math.floor(tokenAmt * Math.pow(10, keys.baseDecimals));
              console.log("saleamtV", saleamtV);
              // const tx = await swap_Sale(keys, saleamtV, 0);
              // const sent = await userconnect.sendTransaction(tx, [userWallet], { skipPreflight: true })
              // console.log("swapped in tx id:", sent);
              const sent = await saleFunction(keys, saleamtV);
              addSoftLog(`卖出 ${keys.baseMint.toBase58()} 数量:${tokenAmt} 完成 哈希: ${sent}`);
            } else if (keys.baseMint.toString() === SOLMint) {
              const saleamtV = Math.floor(tokenAmt * Math.pow(10, keys.quoteDecimals));
              console.log("saleamtV", saleamtV);
              // const tx = await swapOut_Sale(keys, saleamtV, 0);
              // const sent = await userconnect.sendTransaction(tx, [userWallet], { skipPreflight: true })
              // console.log("swapped in tx id:", sent)
              const sent = await saleFunction(keys, saleamtV);
              addSoftLog(`卖出# ${keys.baseMint.toBase58()} 数量:${tokenAmt} 完成 哈希: ${sent}`);
            }
          } else {
            //keys = getKeys()
            const thepoolInfo: any = await queryLpPair(Tokeninfo.mint, SOLMint);

            let MaxPool = null;
            console.log("thepoolId:", thepoolInfo);
            if (!thepoolInfo) {
              notify({ type: "error", message: "错误", description: "未查询到对应的池子信息" });
              await sleep(3333);
              continue;
            } else {
              if (thepoolInfo.Raydium_LiquidityPoolv4.length > 0) {
                if (thepoolInfo.Raydium_LiquidityPoolv4.length <= 1) {
                  console.log("只有1个池子");
                  MaxPool = thepoolInfo.Raydium_LiquidityPoolv4[0];
                } else {
                  console.log("大于1个池子,找到最大的池子");
                  const highestLpReservePool = thepoolInfo.Raydium_LiquidityPoolv4.reduce((highest, current) => {
                    if (current.lpReserve > highest.lpReserve) {
                      return current;
                    } else {
                      return highest;
                    }
                  }, thepoolInfo.Raydium_LiquidityPoolv4[0]); // 初始最高值为数组的第一个对象
                  console.log("最高的lpReserve池子信息：", highestLpReservePool);
                  MaxPool = highestLpReservePool;
                }
              }
            }
            if (!MaxPool) { await sleep(3333); continue; }
            const marketID = new PublicKey(MaxPool.marketId);
            const baseDec = Tokeninfo.tokenAmount.decimals;
            if (MaxPool.quoteMint === SOLMint) {
              const quoteDec = MaxPool.quoteDecimal;
              keys = await getKeys(marketID, baseDec, quoteDec);
            } else {
              const quoteDec = MaxPool.baseDecimal;
              keys = await getKeys(marketID, quoteDec, baseDec);
            }
            console.log(keys);
            if (keys.quoteMint.toString() === SOLMint) {
              const saleamtV = Math.floor(tokenAmt * Math.pow(10, Tokeninfo.tokenAmount.decimals));
              console.log("saleamtV", saleamtV);
              // const tx = await swap_Sale(keys, saleamtV, 0);
              // const sent = await userconnect.sendTransaction(tx, [userWallet], { skipPreflight: true })
              // console.log("swapped in tx id:", sent)
              const sent = await saleFunction(keys, saleamtV);
              addSoftLog(`卖出 ${keys.baseMint.toBase58()} 数量:${tokenAmt} 完成 哈希: ${sent}`);
              await sleep(3333);
            } else if (keys.baseMint.toString() === SOLMint) {
              const saleamtV = Math.floor(tokenAmt * Math.pow(10, Tokeninfo.tokenAmount.decimals));
              console.log("saleamtV", saleamtV);
              // const tx = await swapOut_Sale(keys, saleamtV, 0);
              // const sent = await userconnect.sendTransaction(tx, [userWallet], { skipPreflight: true })
              // console.log("swapped in tx id:", sent)
              const sent = await saleFunction(keys, saleamtV);
              addSoftLog(`卖出# ${keys.quoteMint.toBase58()} 数量:${tokenAmt} 完成 哈希: ${sent}`);
              await sleep(3333);
            }
          }
        }
      }
    } catch (err) {
      console.log('getTokenAccount Error~!', err);
    }
    addSoftLog('一键清仓完成');
  };

  const handleViewHold = async () => {
    addSoftLog('持仓列表: ');
    try {
      const tokenAccount = await getTokenAccount(userconnect, userWallet.publicKey);
      console.log(tokenAccount);
      for (let j = 0; j < tokenAccount.length; j++) {
        const Tokeninfo = tokenAccount[j].account.data.parsed.info;
        const tokenAmt = Tokeninfo.tokenAmount.uiAmount;
        if (tokenAmt > 0) {
          console.log(`${Tokeninfo.mint} 数量:${tokenAmt}`)
          addSoftLog(`${Tokeninfo.mint} 数量:${tokenAmt}`);
        }
      }
    } catch (err) {
      console.log('getTokenAccount Error~!', err);
    }
  }

  const confirmCloseAll: PopconfirmProps['onConfirm'] = async (e) => {
    console.log(e);
    addSoftLog('正在执行一键关闭账户');
    try {
      const tokenAccount = await getTokenAccount(userconnect, userWallet.publicKey);
      for (let j = 0; j < tokenAccount.length; j++) {
        const Tokeninfo = tokenAccount[j].account.data.parsed.info;
        const tokenAmt = Tokeninfo.tokenAmount.uiAmount;
        if (tokenAmt === 0) {
          const tx = await autoCloseAccount(tokenAccount[j].pubkey, userWallet.publicKey);
          // tx.recentBlockhash = bh.blockhash
          // tx.feePayer = keypairs[each].publicKey
          console.log('关闭账户~');
          const sent = await userconnect.sendTransaction(tx, [userWallet], { skipPreflight: true })
          console.log("swapped in tx id:", sent)
          addSoftLog(`自动关闭账户成功,关联的代币:${Tokeninfo.mint}`);
        }
      }
    } catch (err) {
      console.log('getTokenAccount Error~!', err);
    }
    addSoftLog('执行一键关闭账户完成');
  };

  const setEmvModeProc = (can) => {
    if (can) {
      if (autoRun) {
        addSoftLog("打开MEV模式");
      }
      setemvMode(can);
    } else {
      if (autoRun) { addSoftLog("关闭MEV模式"); }
      setemvMode(can);
    }
  }

  const onChangeJitoLevel = (e: RadioChangeEvent) => {
    //setSize(e.target.value);    
    const newValue = e.target.value;
    setjitoLevel(newValue);
    //jitoRef.current = newValue;
    if (newValue === 1) {
      setJitoFee(0.00003);
      jitofeeRef.current = 0.00003;
    } else if (newValue === 2) {
      setJitoFee(0.001);
      jitofeeRef.current = 0.001;
    } else if (newValue === 3) {
      setJitoFee(0.01);
      jitofeeRef.current = 0.01;
    }
  };


  return (

    <div>
      {contextHolder}
      <Flex vertical={true} gap={"middle"} >
        <Flex gap={"middle"} justify={"flex-start"} align={"flex-start"}>
          {
            !initWallet ?
              <Card style={{ width: 400 }} title="帐号信息">
                <Flex gap={10} justify={"flex-start"} align={"center"}>
                  <Space direction="horizontal">
                    <Input.Password
                      placeholder="钱包私钥填写"
                      id='userwallet'
                      visibilityToggle={{ visible: passwordVisible, onVisibleChange: setPasswordVisible }}
                    />
                    <Button style={{ width: 80 }} onClick={handleSetWallet}>
                      设置
                    </Button>
                  </Space>
                </Flex>
              </Card>
              : ""
          }


          {/* 代币管理 */}
          <Card style={{ width: 500 }} title="代币管理">
            <Flex gap={10} justify={"flex-start"} align={"center"}>
              <Input
                placeholder="代币地址"
                onChange={handleTokenChange}
              />
            </Flex>

            {checkTokenStatus === 0
              ? <Tag icon={<SyncOutlined spin />} color="processing" style={{ fontSize: '12px' }}>查询中</Tag>
              : checkTokenStatus === 1
                ? <Tag icon={<CloseCircleOutlined />} color="error" style={{ fontSize: '12px' }}>{checkTokenErrorMsg}</Tag>
                : ""
            }

            <Divider>代币信息</Divider>
            <Flex style={{ marginTop: 10 }} justify={"flex-start"} align={"center"}>
              <Row align="middle">
                <Col>
                  <Avatar src={`${tokenUri}`} />
                </Col>
                <Col flex="auto" style={{ marginLeft: 16 }}>
                  <div>
                    <strong>{tokenSymbol}</strong>
                  </div>
                  <div>
                    <Text type="secondary">{disTokenAddr}</Text>
                  </div>
                </Col>
              </Row>
            </Flex>

            <Flex style={{ marginTop: 5 }} >
              <Text>安全指数: </Text>
              <div style={{ marginLeft: 10 }}>
                <Tooltip title="安全指数(根据代币权限,流动性池,持币数据等判断因素) 此数据仅供参考,非投资建议!">
                  <Rate disabled allowHalf value={tokenSafe} />
                </Tooltip>
              </div>
            </Flex>

            <Flex style={{ marginTop: 5 }} >
              <Text>价格: </Text>
              <div style={{ marginLeft: 10 }}>
                <Text>Nan</Text>
              </div>
            </Flex>

            <Flex style={{ marginTop: 5 }} >
              <Text>市值: </Text>
              <div style={{ marginLeft: 10 }}>
                <Text>Nan</Text>
              </div>
            </Flex>

            <Flex style={{ marginTop: 5 }} >
              <Text>安全: </Text>
              <div style={{ marginLeft: 10 }}>
                {tokenMintAuth ? <Tooltip title="此代币增发权限未丢弃,可随时增发代币"><Tag color="red">Mint权限丢弃❌</Tag></Tooltip> : <Tooltip title="此代币增发权限已丢弃,不能增发代币"><Tag color="green">Mint权限丢弃✅</Tag> </Tooltip>}
                {tokenFreeAuth ? <Tooltip title="此代币冻结权限未丢弃,Dev可以冻结账户"><Tag color="red">冻结权限丢弃❌</Tag></Tooltip> : <Tooltip title="此代币冻结权限已丢弃"><Tag color="green">冻结权限丢弃✅</Tag> </Tooltip>}
                {tokenBurn ? <Tooltip title="此代币流动性池子已全部燃烧"><Tag color="green">燃烧池子✅ ({tokenBurnPer})</Tag></Tooltip> : <Tooltip title="此代币流动性池未全部燃烧,未燃烧部分Dev可以撤池"><Tag color="red">燃烧池子❌ ({tokenBurnPer})</Tag> </Tooltip>}
              </div>
            </Flex>

            <Flex style={{ marginTop: 5 }} >
              <Text>Top10持仓: </Text>
              <div style={{ marginLeft: 10 }}>
                {tokenTop10Per <= 30
                  ? <Tag icon={<CheckCircleOutlined />} color="green">{tokenTop10Per}%</Tag>
                  : tokenTop10Per > 30 && tokenTop10Per <= 50
                    ? <Tag icon={<ExclamationCircleOutlined />} color="warning">{tokenTop10Per}%</Tag>
                    : <Tag icon={<CloseCircleOutlined />} color="red">{tokenTop10Per}%</Tag>}
              </div>
              <div style={{ marginLeft: 10 }}>
                <Tooltip title="如持币地址过多导致查询过慢，可【刷新页面】后关闭此选项">
                  <Checkbox defaultChecked={true} id='checktop'>检查持仓信息</Checkbox>
                </Tooltip>
              </div>
            </Flex>

            <Flex style={{ marginTop: 5 }} >
              <Text>池子: </Text>
              <div style={{ marginLeft: 10 }}>
                {tokenIsOpen
                  ? <Tag color="green">已开放交易✅</Tag>
                  : <Tag color="red">未开始交易❌</Tag>
                }

              </div>
            </Flex>

            <Flex style={{ marginTop: 5 }} >
              <Text>创建时间: </Text>
              <div style={{ marginLeft: 10 }}>
                <Text>{tokenOpenTime}</Text>
              </div>
            </Flex>

            <Flex style={{ marginTop: 5 }} >
              <Text>SOL余额: </Text>
              <div style={{ marginLeft: 10 }}>
                <Text>{tokenPoolSol} SOL</Text>
              </div>
            </Flex>

            <Flex style={{ marginTop: 5 }} >
              <Text>代币链接: </Text>

              <div style={{ marginLeft: 10 }}>
                {tokenweb === ""
                  ? <Link href="" target="_blank">❌官网</Link>
                  : <Link href={tokenweb} target="_blank">✅官网</Link>
                }

              </div>

              <div style={{ marginLeft: 10 }}>
                {tokenxLink === ""
                  ? <Link href="" target="_blank">❌Twitter</Link>
                  : <Link href={tokenxLink} target="_blank">✅Twitter</Link>
                }
              </div>

              <div style={{ marginLeft: 10 }}>
                {tokentgLink === ""
                  ? <Link href="" target="_blank">❌Telegram</Link>
                  : <Link href={tokentgLink} target="_blank">✅Telegram</Link>
                }
              </div>
            </Flex>

            <Flex style={{ marginTop: 5 }} >
              <Text>相关链接: </Text>
              <div style={{ marginLeft: 10 }}>
                <Link href={`https://gmgn.ai/sol/token/${disTokenAddr}`} target="_blank">
                  Gmgn
                </Link>
              </div>

              <div style={{ marginLeft: 10 }}>
                <Link href={`https://birdeye.so/token/${disTokenAddr}?chain=solana`} target="_blank">
                  Birdeye
                </Link>
              </div>

              <div style={{ marginLeft: 10 }}>
                <Link href={`https://dexscreener.com/solana/${disTokenAddr}`} target="_blank">
                  Dexscreener
                </Link>
              </div>
            </Flex>

            {/* <Flex gap={10} justify={"flex-start"} align={"center"}>
              <Text type="success">SOL总余额 ({"accSolCount"})</Text>
              <Text type="warning">代币总余额 ({"accMintCount"})</Text>
              <Text type="danger">代币总价值 ({"accMintSolCount"})</Text>
            </Flex> */}

            {/* <div style={{ marginBottom: 10, marginTop: 10 }}>
              <Flex gap={30} justify={"flex-start"} align={"center"} >
                //
              </Flex>
            </div> */}

            <Divider>Top10持仓列表 总持币数:({holdCount})</Divider>

            <div style={{ marginBottom: 10, marginTop: 10 }}>
              <TextArea rows={8} wrap="off" value={tokenListString} />
            </div>
          </Card>


          <Card style={{ width: 450 }} title={
            <div>
              <span>交易控制台</span>
              {initWallet ? <span style={{ fontSize: '12px', color: '#888', marginLeft: '8px' }}>{walletAddr}</span> : ""}
            </div>
          }>


            <Flex style={{ marginBottom: 5 }} justify={"flex-start"} align={"center"}>
              <Button style={runMode === 0 ? { borderColor: 'blue' } : {}} icon={<RocketOutlined />} onClick={() => setrunMode(0)}>手动</Button>
              <Button style={runMode === 1 ? { borderColor: 'blue' } : {}} icon={<RobotOutlined />} onClick={() => setrunMode(1)}>自动</Button>
              <Button style={runMode === 2 ? { borderColor: 'blue' } : {}} icon={<RadarChartOutlined />} onClick={() => setrunMode(2)}>跟投</Button>
            </Flex>





            {runMode === 0 ?
              <div>
                <Tooltip title="在此处输入代币地址可以更快速的Ready买入 卖出  (不查询代币池子等信息)">
                  <Input
                    placeholder="快速查找代币地址"
                    onChange={handleTokenChange1}
                  />
                </Tooltip>
                {checkTokenStatus1 === 0
                  ? <Tag icon={<SyncOutlined spin />} color="processing" style={{ fontSize: '12px' }}>查询中</Tag>
                  : ""
                }
                {initWallet ?
                  <div>
                    <Flex style={{ marginTop: 0 }} justify={"flex-start"} align={"center"}>
                      <Row align="middle">
                        <Col>
                          <Avatar src={`${tokenUri}`} />
                        </Col>
                        <Col flex="auto" style={{ marginLeft: 16 }}>
                          <div>
                            <strong>{tokenSymbol}</strong>
                          </div>
                          <div>
                            <Text type="secondary">{truncateString(disTokenAddr, 16, 8, 8)}</Text>
                          </div>
                        </Col>
                      </Row>
                    </Flex>
                    <Flex >
                      <Tag bordered={false} color="processing">
                        余额: {tokenBalance} {tokenSymbol}
                      </Tag>
                      {!refing ? <RedoOutlined onClick={handleRefTokenAmount} /> : <LoadingOutlined />}
                    </Flex>

                    <Flex style={{ marginTop: 5, marginBottom: 5 }}>
                      <Tag bordered={false} color="processing">
                        SOL余额: {userSolBalance} SOL
                      </Tag>
                    </Flex>
                  </div>
                  : ""
                }




                <Flex style={{ marginTop: 10, marginBottom: 10 }}>
                  <Text type="success">买入:</Text> {tokenReady ? <Tag style={{ marginLeft: 5 }} icon={<CheckCircleOutlined />} color="success">Ready</Tag> : ""}
                </Flex>

                <Flex style={{ display: 'flex', gap: '6px' }}>
                  <Button style={{ borderColor: 'green' }} onClick={() => handleBuyFromAmt(0.01)}>0.01</Button>
                  <Button style={{ borderColor: 'green' }} onClick={() => handleBuyFromAmt(0.1)}>0.1</Button>
                  <Button style={{ borderColor: 'green' }} onClick={() => handleBuyFromAmt(0.5)}>0.5</Button>
                  <Button
                    style={{ borderColor: 'green' }}
                    icon={<SettingOutlined />}
                    disabled
                  // onClick={() => enterLoading(2)}
                  />
                </Flex>

                <Flex style={{ display: 'flex', marginTop: '6px' }}>
                  <Space.Compact style={{ width: '60%' }}>
                    <Input id='buyamt' style={{ borderColor: 'green' }} placeholder='自定义金额' />
                    <Button style={{ borderColor: 'green' }} onClick={handleBuy}>Buy</Button>
                  </Space.Compact>
                </Flex>

                <Flex style={{ display: 'flex', marginTop: '6px' }}>
                  <Text>高级选项:</Text>
                  <div style={{ marginLeft: 10 }}>
                    <Switch onChange={() => { setbuySetting(!buySetting) }} />
                  </div>
                </Flex>

                {buySetting ?
                  <div>
                    <Flex style={{ display: 'flex', marginTop: '6px' }}>
                      <div style={{ marginLeft: 10 }}>
                        <Checkbox disabled>自动卖出</Checkbox>
                      </div>
                    </Flex>

                    <Flex style={{ display: 'flex', marginTop: '6px' }}>
                      <Radio.Group >
                        <Radio value={1} disabled>按时间</Radio>
                        <Radio value={2} disabled>按价格</Radio>
                        <Radio value={3} disabled>按盈利</Radio>
                      </Radio.Group>
                    </Flex>

                    <Flex style={{ display: 'flex', marginTop: '6px' }}>
                      <Space.Compact style={{ width: '60%' }}>
                        <Input placeholder='买入(秒)后' disabled />
                        <Input placeholder='卖出%' disabled />
                      </Space.Compact>
                    </Flex>
                  </div>
                  : ""}

                <Flex style={{ marginTop: 10, marginBottom: 10 }}>
                  <Text type="danger">卖出:</Text> {tokenReady ? <Tag style={{ marginLeft: 5 }} icon={<CheckCircleOutlined />} color="success">Ready</Tag> : ""}
                </Flex>

                <Flex style={{ display: 'flex', gap: '6px' }}>
                  <Button style={{ borderColor: 'red' }} onClick={() => SaleTokenByPer(20)}>20%</Button>
                  <Button style={{ borderColor: 'red' }} onClick={() => SaleTokenByPer(50)}>50%</Button>
                  <Button style={{ borderColor: 'red' }} onClick={() => SaleTokenByPer(100)}>100%</Button>
                  <Button
                    style={{ borderColor: 'red' }}
                    icon={<SettingOutlined />}
                    disabled
                  // onClick={() => enterLoading(2)}
                  />
                </Flex>

                <Flex style={{ display: 'flex', marginTop: '6px' }}>
                  <Space.Compact style={{ width: '60%' }}>
                    <Input id='saleamt' style={{ borderColor: 'red' }} placeholder='自定义数量' />
                    <Button style={{ borderColor: 'red' }} onClick={handleSale}>Sale</Button>
                  </Space.Compact>
                </Flex>

                <Flex style={{ display: 'flex', marginTop: '6px', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <Text>MEV模式</Text>
                  <Switch value={emvMode} onChange={() => { setEmvModeProc(!emvMode) }} />
                </Flex>
                {
                  emvMode ?
                    <Flex style={{ display: 'flex', marginTop: '6px', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <Radio.Group value={jitoLevel} onChange={onChangeJitoLevel} >
                        <Radio.Button value={1}>默认</Radio.Button>
                        <Radio.Button value={2}>高速</Radio.Button>
                        <Radio.Button value={3}>极速</Radio.Button>
                      </Radio.Group>
                      <Input type='number' step={0.00001} style={{ width: 100 }} value={jitofee} onChange={handleChangeJito}></Input>
                    </Flex>
                    : ""
                }

                <Flex justify={"flex-start"} align={"center"} style={{ marginTop: 10 }}>
                  <span>交易Gas费(SOL): <Tooltip title="设置 0 时使用最低Gas费"><Input placeholder="买入Gas费" value={buyGas} style={{ width: '50%' }} onChange={onChangeBuyGas} /> </Tooltip></span>
                  {/* <span>设置"0"时使用最低Gas费</span> */}
                </Flex>
                <Divider>当前持仓</Divider>
              </div>
              : runMode === 1 ?//自动模式
                <div>
                  <Flex style={{ marginTop: 5, marginBottom: 5 }}>
                    <Tag bordered={false} color="processing">
                      SOL余额: {userSolBalance} SOL
                    </Tag>
                  </Flex>

                  <Flex style={{ display: 'flex', marginTop: '6px' }}>
                    <Text>自动买入新池子:</Text>
                    <div style={{ marginLeft: 10 }}>
                      <Switch onChange={handleAutoRun} />
                    </div>
                  </Flex>

                  <Flex style={{ display: 'flex', marginTop: '6px', alignItems: 'center', }}>
                    <Text>买入数量</Text>
                    <Input id='autobuyamt' style={{ width: '30%' }} placeholder='SOL' />
                  </Flex>

                  <Flex style={{ display: 'flex', marginTop: '6px', alignItems: 'center', }}>
                    <Text>买入后</Text>
                    <Input id='salesleep' style={{ width: '20%' }} defaultValue={60} />
                    <Text>(秒)自动卖出</Text>
                    <Switch value={autoAutoSale} onChange={handleautoSaleChange} />
                  </Flex>

                  <Flex style={{ display: 'flex', marginTop: '6px' }}>
                    <Text>过滤未丢弃冻结权限的池子:</Text>
                    <div style={{ marginLeft: 10 }}>
                      <Switch value={autoNotFreeAcc} onChange={() => { setautoNotFreeAcc(!autoNotFreeAcc) }} />
                    </div>
                  </Flex>

                  <Flex style={{ display: 'flex', marginTop: '6px', alignItems: 'center', }}>
                    <Text>卖出后,自动关闭账户</Text>
                    <Switch value={autoAutoClose} onChange={() => { setautoAutoClose(!autoAutoClose) }} />
                  </Flex>

                  {/* <Button onClick={handeletest}>####</Button> */}
                  <Flex style={{ display: 'flex', marginTop: '6px', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Text>MEV模式</Text>
                    <Switch value={emvMode} onChange={() => { setEmvModeProc(!emvMode) }} />
                  </Flex>
                  {
                    emvMode ?
                      <Flex style={{ display: 'flex', marginTop: '6px', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <Radio.Group value={jitoLevel} onChange={onChangeJitoLevel} >
                          <Radio.Button value={1}>默认</Radio.Button>
                          <Radio.Button value={2}>高速</Radio.Button>
                          <Radio.Button value={3}>极速</Radio.Button>
                        </Radio.Group>
                        <Input type='number' step={0.00001} style={{ width: 100 }} value={jitofee} onChange={handleChangeJito}></Input>
                      </Flex>
                      : ""
                  }
                  <Flex justify={"flex-start"} align={"center"} style={{ marginTop: 10 }}>
                    <span>交易Gas费(SOL): <Tooltip title="设置 0 时使用最低Gas费"><Input placeholder="买入Gas费" value={buyGas} style={{ width: '50%' }} onChange={onChangeBuyGas} /> </Tooltip></span>
                    {/* <span>设置"0"时使用最低Gas费</span> */}
                  </Flex>
                  <Flex style={{ display: 'flex', marginTop: '6px', alignItems: 'center', }} gap={6}>
                    <Button onClick={handleViewHold}>查看持仓</Button>
                    <Popconfirm
                      title="一键清仓确认"
                      description="执行此操作将出售钱包中的所有代币"
                      onConfirm={confirmSaleAll}
                      onCancel={() => { console.log('cancel') }}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button >一键清仓</Button>
                    </Popconfirm>
                    <Popconfirm
                      title="一键关闭账户"
                      description="关闭所有余额为0的代币账户,可退回少量租金"
                      onConfirm={confirmCloseAll}
                      onCancel={() => { console.log('cancel') }}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button >一键关闭账户</Button>
                    </Popconfirm>
                    <Button onClick={() => { setLogStrList("") }}>清空日志</Button>
                  </Flex>


                  <Divider>运行日志</Divider>

                  <div style={{ marginBottom: 10, marginTop: 10 }}>
                    <TextArea rows={13} wrap="off" value={logStrList} />
                  </div>
                </div>
                :
                <div>
                  {/* <Button onClick={handleTest}>111</Button> */}
                </div>
            }

          </Card>
        </Flex>


      </Flex>
    </div>
  );
};


