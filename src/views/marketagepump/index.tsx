// Next, React
import { FC, useEffect, useRef, useState } from 'react';
// Wallet
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import Select from 'react-select';
import { notify } from 'utils/notifications';
import { burntokensAndcloseacc, burntokens, setPublicGasfee } from '../../utils/web3';
import { getTokenAccounts, getMetadata, getImageUri, truncateString, queryLpPair, getImageJson } from '../../utils/gettoken';
import Loading from 'components/Loading';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, VersionedTransaction } from '@solana/web3.js'
import { useTranslation } from 'next-i18next'
import { ExtensionType, TOKEN_PROGRAM_ID, TokenAccountNotFoundError, TokenInvalidAccountOwnerError, createAssociatedTokenAccountInstruction, createBurnInstruction, createCloseAccountInstruction, createTransferInstruction, getAccount, getAssociatedTokenAddress, getExtensionData, getExtraAccountMetaAddress, getExtraAccountMetas, getMetadataPointerState, getMint, getMintCloseAuthority, getTokenMetadata, resolveExtraAccountMeta } from '@solana/spl-token';
import { getTokenMetadataProc } from 'utils/getTokenMetadataA';
import { Avatar, Button, Card, Checkbox, Col, Descriptions, DescriptionsProps, Divider, Flex, FloatButton, Input, Popconfirm, PopconfirmProps, Radio, RadioChangeEvent, Row, Slider, Space, Switch, Table, TableColumnsType, Typography, message } from 'antd';
import { Header } from 'antd/es/layout/layout';
import { text } from 'stream/consumers';
import bs58 from 'bs58';
import { ApiPoolInfoV4, Liquidity, LiquidityPoolInfo, LiquidityPoolKeys, Percent, Token, TokenAmount, jsonInfo2PoolKeys } from '@raydium-io/raydium-sdk';
import { formatAmmKeysById, formatAmmKeysByIdA } from 'utils/raydium/formatAmmKeysById';
import { GetparsePoolInfo } from 'utils/raydium/ammV4MockPoolInfo';
import { swapOnlyAmmA, swapOnlyAmmB } from 'utils/raydium/swapOnlyAmm';
import { getWalletTokenAccount, sendTxA } from 'utils/raydium/util';
import { sol } from '@metaplex-foundation/js';
import { DEFAULT_TOKEN, GAS_LEVEL, setConnection, setEmvLevel, setGasFree, setWallet, sleep } from 'utils/config';
import Link from 'next/link';
import axios from 'axios';
import { gql, GraphQLClient } from "graphql-request";
import { ammRemoveLiquidity } from 'utils/raydium/ammRemoveLiquidity';
import MsgBoxView, { MessageBoxPam, useMessageBoxPam } from 'views/msgbox';
import { getKeys, getKeys_wallet, getMarketInfoA, setRayPubGas, swapOut_Buy, swapOut_Buy_wallet, swapOut_Sale, swapOut_Sale_wallet, swap_Buy, swap_Buy_Wallet, swap_Sale, swap_Sale_wallet } from 'utils/raydium/rayFunction';
import * as spl from "@solana/spl-token"
import { getJitoSetFee, getRandomTipAccount } from 'utils/jito/config';
import { sendBundle } from 'utils/jito/jito';
import { Swap_Buy_pump, Swap_Sale_pump, calculateWithSlippageBuy, getBondingCurvePDA, getBuyPrice } from 'utils/raydium/pumpFunction';


//let xhList = [];
let baseToken: Token;
let quoteToken: Token;
let nowPoolInfo: LiquidityPoolInfo;
let nowTagetPool: ApiPoolInfoV4;
let nowRpc: string = process.env.NEXT_PUBLIC_DEBUG === "true" ? process.env.NEXT_PUBLIC_RPC_DEV : process.env.NEXT_PUBLIC_RPC;
let markconnection;
let localBackList = [];
const SOLMint = "So11111111111111111111111111111111111111112";
let m_Mint;
let m_CurvePDA;
let m_assBundingCurve;

export const MarketagePumpView: FC = ({ }) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signMessage, signTransaction, signAllTransactions } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation('common');
  const [dataAccList, setDataAccList] = useState<DataType[]>([]);  //帐号列表
  const [tokenListString, settokenListString] = useState('');
  const [siyaoListString, setSiyaoListString] = useState('');
  const [miyaoListString, setmiyaoListString] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]); // 初始状态为空
  const [odval, setodval] = useState(100);
  const [burnval, setburnval] = useState(100);
  const [removeamt, setRemoveamt] = useState(0);
  const [burnAmt, setBurnamt] = useState(0);
  const [isInitPool, setisInitPool] = useState(false);
  const [polTotel, setpolTotel] = useState("");
  const [polBanlace, setpolBanlace] = useState("");
  const [polBanlaceVal, setpolBanlaceVal] = useState(0);
  const [polOrder, setpolOrder] = useState("");
  const [polAmount, setpolAmount] = useState(0);
  const [polGet, setpolGet] = useState(0.01);
  const [buyRadiovalue, setbuyRadiovalue] = useState(1);
  const [saleRadiovalue, setsaleRadiovalue] = useState(2);
  const [autoRefreshAcc, setAutoRefreshAcc] = useState(false);
  const [buyAmtVal, setbuyAmtVal] = useState("0.1");
  const [buySleep, setbuySleep] = useState("1000");
  const [saleSleep, setsaleSleep] = useState("1000");
  const [saleAmtVal, setsaleAmtVal] = useState("100");
  const [logStrList, setLogStrList] = useState("");
  const [huadian, setHuaDian] = useState("49");  //滑点
  const [buyGas, setbuyGas] = useState("0.0001");  //Gas费
  //const [saleGas, setsaleGas] = useState("0.01");
  const [canAccounted, setcanAccounted] = useState(false);
  const [canPoolInited, setcanPoolInited] = useState(false);
  const [accSolCount, setaccSolCount] = useState('');
  const [accMintCount, setaccMintCount] = useState('');
  const [accMintSolCount, setaccMintSolCount] = useState('');
  const [enterBack, setenterBack] = useState(0);
  const [enterBackAddr, setenterBackAddr] = useState("");
  const [checkFromMint, setchekFromMint] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nowSelectAcc, setnowSelectAcc] = useState(0);
  const [tokenUserCount, settokenUserCount] = useState(0);
  const [emvMode, setemvMode] = useState(true);
  const [jitoLevel, setjitoLevel] = useState(1);
  //const jitoRef = useRef(jitoLevel);  //实时数值
  const [jitofee, setJitoFee] = useState(0.00003);
  const jitofeeRef = useRef(jitofee);  //实时数值

  const [tokenSymbol, settokenSymbol] = useState("Demo");
  const [tokenUri, settokenUri] = useState("https://api.dicebear.com/7.x/miniavs/svg?seed=0");
  const [disTokenAddr, setdisTokenAddr] = useState("5LNruZKwDvQex4aJA8JgYLw5ZYFGpodXBxZErkEbp6Co");


  const Defult_RPCList = [
    "https://mainnet.helius-rpc.com/?api-key=1f04ab69-b856-453e-a12f-b59e6ad4dd35",
    // "https://hidden-methodical-bridge.solana-mainnet.quiknode.pro/68a983ec86d3b0c027ca8787ff39d651c838655b",
    // "https://small-intensive-patina.solana-mainnet.quiknode.pro/122f1fa7bdbbe6c101a5727c09a2f27d4a7fb6d7",
    // "https://smart-thrilling-bridge.solana-mainnet.quiknode.pro/74576bd19be8333b4a536392baa4dd9ffc675ec8",
    // "https://lively-muddy-research.solana-mainnet.quiknode.pro/6e686c34bac88aea421d741366d9ed0597b60dd8"
  ];

  const initialPam: MessageBoxPam = {
    addrTag: '',
    addrName: '',
    addr1: '',
    hxName: '',
    hxAddr: ''
  };
  const [messageBoxPam, updateMessageBoxPam] = useMessageBoxPam(initialPam);
  //let nowAccount: DataType[];

  //自动刷新
  useEffect(() => {
    jitofeeRef.current = jitofee;
    if (autoRefreshAcc) {
      const intervalId = setInterval(() => {
        handleRefAccInfo();
      }, 8000);
      return () => clearInterval(intervalId);
    }
  }, [autoRefreshAcc, jitofee]);

  const setEmvModeProc = (can) => {
    if (!can) {
      setEmvLevel(-1);
    } else {
      setEmvLevel(1);
    }
    setemvMode(can);
  }

  function checkLocMode() {
    let ret;
    process.env.NEXT_PUBLIC_LOCMODE === "true" ? ret = true : ret = false;
    return ret;
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


  const handleChangeJito = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);//parseInt(event.target.value, 10);
    //setbuyGas(value);
    setJitoFee(value);
    jitofeeRef.current = value;
  }



  const handleToggleAutoRefresh = () => {
    setAutoRefreshAcc(prevState => !prevState);
  };

  useEffect(() => {
    setRemoveamt(polAmount / 100 * odval);
    setBurnamt(polAmount / 100 * burnval);
    setpolGet(polBanlaceVal / 100 * odval);
  }, [odval, polAmount, polBanlaceVal, burnval]);



  const addSoftLog = (log: String) => {
    setLogStrList(prevLogStrList => prevLogStrList + log + "\n");
  }



  interface DataType {
    key: React.Key;
    checked?: boolean;
    publickey: string;
    sol: number;
    mint: number;
    ata?: Percent;
    dec?: number;
    siyao?: string;
    miyao?: PublicKey;
    wallet?: Keypair;
    connect?: Connection;
    keys?: any;
  }

  const columns: TableColumnsType<DataType> = [
    {
      title: `${t('msg.wal')}  ${t('msg.seld')} : (${nowSelectAcc})`,
      dataIndex: 'publickey',
      render: (text: string) => <a>{text}</a>,
    },
    {
      title: `SOL${t('msg.bal')}`,
      dataIndex: 'sol',
    },
    {
      title: `${t('msg.token')}${t('msg.bal')}`,
      dataIndex: 'mint',
    },
  ];

  // let data: DataType[] = [
  //   {
  //     key: '1',
  //     name: 'John Brown',
  //     age: 32,
  //     address: 'New York No. 1 Lake Park',
  //   },
  //   {
  //     key: '2',
  //     name: 'Jim Green',
  //     age: 42,
  //     address: 'London No. 1 Lake Park',
  //   },
  //   {
  //     key: '3',
  //     name: 'Joe Black',
  //     age: 32,
  //     address: 'Sydney No. 1 Lake Park',
  //   },
  //   {
  //     key: '4',
  //     name: 'Disabled User',
  //     age: 99,
  //     address: 'Sydney No. 1 Lake Park',
  //   },
  // ];
  //const [tabdata setTabdata] = useState(TableColumnsType<DataType>)[];

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys: React.Key[], selectedRows: DataType[]) => {
      setSelectedRowKeys(selectedRowKeys);
      console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
      //nowAccount = selectedRows;
      for (let i = 0; i < dataAccList.length; i++) {
        dataAccList[i].checked = false;
      }
      for (let i = 0; i < selectedRows.length; i++) {
        selectedRows[i].checked = true;
      }
      setnowSelectAcc(selectedRows.length);
    },
  };

  const handleRef = () => {
    console.log("hi");
    notify({ type: "error", message: "错误", description: "此功能暂未开放" });
    return;
    // const newDataItem: DataType = {
    //   key: data.length + 1,
    //   publickey: `New Name ${data.length + 1}`,
    //   sol: 8,
    //   mint: 666,
    // };
    // setData([...data, newDataItem]);
  }

  const updateFirstName = () => {
    if (dataAccList.length > 0) {
      const updatedData = [...dataAccList];
      updatedData[0].publickey = 'Updated Name';
      updatedData[0].dec = 8;
      setDataAccList(updatedData);
    }
  };

  const boxStyle: React.CSSProperties = {
    width: '100%',
    height: 120,
    borderRadius: 6,
    border: '1px solid #40a9ff',
  };
  const { Paragraph, Text } = Typography;
  const { TextArea } = Input;

  async function buyproc(connect, wallet: Keypair, amount: number) {
    setGasFree(parseFloat(buyGas));
    let inputToken, outputToken, inOut;
    if (nowTagetPool.quoteMint === SOLMint) {
      inputToken = quoteToken; // USDC
      outputToken = baseToken;
      inOut = 'in';
    } else {
      inputToken = baseToken; // USDC
      outputToken = quoteToken;
      inOut = 'in';
    }
    console.log(inputToken);

    const dec = inputToken.decimals; //DSUvc5qf5LJHHV5e2tD184ixotSnCnwj7i4jJa4Xsrmt
    const targetPool = '' // USDC-RAY pool DSUvc5qf5LJHHV5e2tD184ixotSnCnwj7i4jJa4Xsrmt
    const buyamtCount = amount * Math.pow(10, dec);
    const buyamtCountDec = Math.floor(buyamtCount);//limitDecimal(buyamtCount, dec);
    const inputTokenAmount = new TokenAmount(inputToken, buyamtCountDec);
    const hd = Number(huadian);
    const slippage = new Percent(hd, 100);
    console.log("111");
    const walletTokenAccounts = await getWalletTokenAccount(connect, wallet.publicKey)
    //console.log(walletTokenAccounts)
    try {
      await swapOnlyAmmA(
        markconnection,
        wallet,
        nowTagetPool,
        nowPoolInfo,
        true,
        {
          outputToken,
          targetPool: "",
          inputTokenAmount,
          slippage,
          walletTokenAccounts,
          wallet: wallet,
        },
        inOut).then(({ txids }) => {
          /** continue with txids */
          console.log('txids', txids);
          addSoftLog(`买入成功, 钱包: ${truncateString(wallet.publicKey.toString(), 16, 8, 8)} 数量:${amount}, 交易哈希: ${txids}`);
        });
    }
    catch (err) {
      addSoftLog(`买入失败: ${err}`);
    }

  }

  function limitDecimal(number, maxDecimal) {
    // 将数字转换为字符串，以便进行处理
    let numString = number.toString();

    // 检查小数点的位置
    let decimalIndex = numString.indexOf('.');
    if (decimalIndex === -1) {
      // 如果没有小数点，直接返回原始数字
      return number;
    } else {
      // 获取小数部分
      let decimalPart = numString.slice(decimalIndex + 1);

      // 如果小数部分长度大于最大小数位数，进行截断
      if (decimalPart.length > maxDecimal) {
        let truncatedDecimal = decimalPart.slice(0, maxDecimal);
        // 返回截断后的数字，保留小数点及之前的部分
        return parseFloat(numString.slice(0, decimalIndex + 1) + truncatedDecimal);
      } else {
        // 如果小数部分长度不大于最大小数位数，直接返回原始数字
        return number;
      }
    }
  }

  async function saleproc(connect, wallet: Keypair, amount: number) {
    setGasFree(parseFloat(buyGas));
    // const inputToken = baseToken; // USDC
    // const outputToken = quoteToken;
    let inputToken, outputToken, inOut;
    if (nowTagetPool.quoteMint === SOLMint) {
      inputToken = baseToken; // USDC
      outputToken = quoteToken;
      inOut = 'in';
    } else {
      inputToken = quoteToken; // USDC
      outputToken = baseToken;
      inOut = 'in';
    }
    const dec = inputToken.decimals; //DSUvc5qf5LJHHV5e2tD184ixotSnCnwj7i4jJa4Xsrmt
    const targetPool = '' // USDC-RAY pool DSUvc5qf5LJHHV5e2tD184ixotSnCnwj7i4jJa4Xsrmt
    //console.log('修改前:', amount);
    //amount = limitDecimal(amount, dec);
    const buyamtCount = amount * Math.pow(10, dec);
    const buyamtCountDec = Math.floor(buyamtCount); //limitDecimal(buyamtCount, dec);
    //console.log(amount);
    const inputTokenAmount = new TokenAmount(inputToken, buyamtCountDec);
    const hd = Number(huadian);
    const slippage = new Percent(hd, 100);  //滑点
    //console.log("111");
    const walletTokenAccounts = await getWalletTokenAccount(connect, wallet.publicKey);
    //console.log(walletTokenAccounts)
    try {
      await swapOnlyAmmA(
        markconnection,
        wallet,
        nowTagetPool,
        nowPoolInfo,
        false,
        {
          outputToken,
          targetPool: "",
          inputTokenAmount,
          slippage,
          walletTokenAccounts,
          wallet: wallet,
        },
        inOut).then(({ txids }) => {
          /** continue with txids */
          console.log('txids', txids);
          addSoftLog(`卖出成功, 钱包: ${truncateString(wallet.publicKey.toString(), 16, 8, 8)} 数量:${amount}, 交易哈希: ${txids}`);
        });
    } catch (err) {
      addSoftLog(`卖出失败: ${err}`);
    }
  }

  function getRandomNumber(min: number, max: number, decimalPlaces: number = 0): number {
    const random = Math.random() * (max - min) + min;
    return parseFloat(random.toFixed(decimalPlaces));
  }

  const handlebuy = async () => {
    // console.log(parseFloat(buyAmtVal));
    // return;
    addSoftLog("执行一键买入");
    console.log("buy");
    //const buyDoc = document.getElementById('buyamount') as HTMLInputElement | null;
    let buyAmount = parseFloat(buyAmtVal);//parseFloat(buyDoc?.value);
    const buySleepVal = Number(buySleep);
    //if (!nowAccount) { return }
    if (dataAccList.length > 0) {
      for (let i = 0; i < dataAccList.length; i++) {
        //if(dataAccList[i])
        const nowDataAcc = dataAccList[i];
        if (nowDataAcc.checked) {
          //console.log(dataAccList[i].publickey + "  buy");
          try {
            if (buyRadiovalue === 1) {
              //固定
              if (nowDataAcc.sol > buyAmount) {
                //足够买入
                //await buyproc(nowDataAcc.connect, nowDataAcc.wallet, buyAmount);
                await buyFunction(buyAmount, nowDataAcc.connect, nowDataAcc.wallet);
                console.log(`${nowDataAcc.publickey}买入: ${buyAmount} SOL`);
                await sleep(buySleepVal);
              }
            } else if (buyRadiovalue === 2) {
              //百分比  保留0.02 Gas费
              if (buyAmount > 100) { buyAmount = 100 }
              const buyAmt = (nowDataAcc.sol - 0.02) / 100 * buyAmount;
              if ((nowDataAcc.sol - 0.02) > buyAmt) {
                //await buyproc(nowDataAcc.connect, nowDataAcc.wallet, buyAmt);
                await buyFunction(buyAmt, nowDataAcc.connect, nowDataAcc.wallet);
                await sleep(buySleepVal);
                console.log(`${nowDataAcc.publickey}买入%: ${buyAmount} SOL`);
              } else {
                addSoftLog(`钱包: ${truncateString(nowDataAcc.wallet.publicKey.toString(), 16, 8, 8)} %SOL小于0.02 跳过`)
              }
            } else {
              //ranamount2
              const ranDoc = document.getElementById('ranamount2') as HTMLInputElement | null;
              const ranMax = Number(ranDoc?.value);
              //buyAmount
              const buyAmt = getRandomNumber(buyAmount, ranMax, 3);
              if (nowDataAcc.sol > buyAmt) {
                //足够买入
                //await buyproc(nowDataAcc.connect, nowDataAcc.wallet, buyAmt);
                await buyFunction(buyAmt, nowDataAcc.connect, nowDataAcc.wallet);
                await sleep(buySleepVal);
                console.log(`${nowDataAcc.publickey}买入随机: ${buyAmt} SOL`);
              }
            }
          } catch (err) {
            addSoftLog(`买入构造失败: ${err}`);
          }
        }
      }
    }
  }

  const handlesale = async () => {
    // console.log(parseFloat(saleAmtVal));
    // return;
    addSoftLog("执行一键卖出");
    console.log("sale")
    //console.log("buy");
    //const buyDoc = document.getElementById('saleamount') as HTMLInputElement | null;
    let saleAmount = parseFloat(saleAmtVal);
    const saleSleepVal = Number(saleSleep);
    //if (!nowAccount) { return }
    if (dataAccList.length > 0) {
      for (let i = 0; i < dataAccList.length; i++) {
        const nowDataAcc = dataAccList[i];
        if (nowDataAcc.checked) {
          try {
            if (saleRadiovalue === 1) {
              //固定
              if (nowDataAcc.mint >= saleAmount) {
                //足够卖出
                //await saleproc(nowDataAcc.connect, nowDataAcc.wallet, saleAmount);
                await saleFunction(nowDataAcc.ata, saleAmount, nowDataAcc.connect, nowDataAcc.wallet);
                await sleep(saleSleepVal);
                console.log(`${nowDataAcc.publickey}卖出: ${saleAmount} `);
              } else {
                addSoftLog(`钱包: ${truncateString(nowDataAcc.wallet.publicKey.toString(), 16, 8, 8)} 代币不足 ${saleAmount}跳过`);
              }
            } else {
              //百分比
              if (saleAmount > 100) { saleAmount = 100 }
              //const buyAmt = nowDataAcc.mint / 100 * saleAmount;        
              const saleAmt = nowDataAcc.mint / 100 * saleAmount;
              if (nowDataAcc.mint >= saleAmt) {
                if (saleAmt > 0) {
                  console.log(saleAmt);
                  //await saleproc(nowDataAcc.connect, nowDataAcc.wallet, buyAmt);
                  await saleFunction(nowDataAcc.ata, saleAmt, nowDataAcc.connect, nowDataAcc.wallet);
                  await sleep(saleSleepVal);
                  console.log(`${nowDataAcc.publickey}卖出%: ${saleAmt} `);
                }
              } else {
                addSoftLog(`钱包: ${truncateString(nowDataAcc.wallet.publicKey.toString(), 16, 8, 8)} %代币不足跳过`);
              }
            }
          } catch (err) {
            addSoftLog(`卖出构造失败: ${err}`);
          }
        }
      }
    }
    addSoftLog(`一键卖出执行完毕`);
  }

  const handlebuyYibu = async () => {
    // console.log(parseFloat(saleAmtVal));
    // return;
    console.log("buy")
    addSoftLog("执行暴力买入");
    //console.log("buy");
    //const buyDoc = document.getElementById('saleamount') as HTMLInputElement | null;
    let buyAmount = parseFloat(buyAmtVal);

    if (dataAccList.length > 0) {
      const promises = [];

      for (let i = 0; i < dataAccList.length; i++) {
        const nowDataAcc = dataAccList[i];
        if (nowDataAcc.checked) {
          const promise = (async () => {
            try {
              if (buyRadiovalue === 1) {
                //固定
                if (nowDataAcc.sol > buyAmount) {
                  //足够买入
                  //await buyproc(nowDataAcc.connect, nowDataAcc.wallet, buyAmount);
                  await buyFunction(buyAmount, nowDataAcc.connect, nowDataAcc.wallet);
                  console.log(`${nowDataAcc.publickey}买入: ${buyAmount} SOL`);
                }
              } else if (buyRadiovalue === 2) {
                //百分比  保留0.02 Gas费
                if (buyAmount > 100) { buyAmount = 100 }
                const buyAmt = (nowDataAcc.sol - 0.02) / 100 * buyAmount;
                if ((nowDataAcc.sol - 0.02) > buyAmt) {
                  //await buyproc(nowDataAcc.connect, nowDataAcc.wallet, buyAmt);
                  await buyFunction(buyAmt, nowDataAcc.connect, nowDataAcc.wallet);
                  console.log(`${nowDataAcc.publickey}买入%: ${buyAmount} SOL`);
                } else {
                  addSoftLog(`钱包: ${truncateString(nowDataAcc.wallet.publicKey.toString(), 16, 8, 8)} %SOL小于0.02 跳过`)
                }
              } else {
                //ranamount2
                const ranDoc = document.getElementById('ranamount2') as HTMLInputElement | null;
                const ranMax = Number(ranDoc?.value);
                //buyAmount
                const buyAmt = getRandomNumber(buyAmount, ranMax, 3);
                if (nowDataAcc.sol > buyAmt) {
                  //足够买入
                  //await buyproc(nowDataAcc.connect, nowDataAcc.wallet, buyAmt);
                  await buyFunction(buyAmt, nowDataAcc.connect, nowDataAcc.wallet);
                  console.log(`${nowDataAcc.publickey}买入随机: ${buyAmt} SOL`);
                }
              }
            } catch (err) {
              addSoftLog(`买入构造失败: ${err}`);
            }
          })();
          promises.push(promise);
        }
      }

      await Promise.all(promises);
    }

  }

  const handlesaleYibu = async () => {
    // console.log(parseFloat(saleAmtVal));
    // return;
    addSoftLog("执行暴力卖出");
    console.log("sale")
    //console.log("buy");
    //const buyDoc = document.getElementById('saleamount') as HTMLInputElement | null;
    async function getSaleiTx(amount, userWallet, ataacc) {
      const saleAmt = Math.floor(amount * Math.pow(10, 6));
      const tx = await Swap_Sale_pump(m_CurvePDA, m_assBundingCurve, m_Mint, userWallet, saleAmt);
      //------------TODO转账
      if (!checkLocMode()) {
        const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
        const Transfer = SystemProgram.transfer({   //SystemProgram代表sol
          fromPubkey: userWallet.publicKey,
          toPubkey: mykey,
          lamports: 0.0015 * Math.pow(10, 9)
        });
        tx.add(Transfer);
      }
      return tx;
    }

    let saleAmount = parseFloat(saleAmtVal);
    let bundle = [];
    let CanJitoFee = true;
    let TokenCount = 0;  //本次
    let latestBlockhash = await connection.getLatestBlockhash();

    if (dataAccList.length > 0) {
      // const promises = [];

      for (let i = 0; i < dataAccList.length; i++) {
        const nowDataAcc = dataAccList[i];
        if (nowDataAcc.checked) {
          //const promise = (async () => {
          try {
            if (saleRadiovalue === 1) {
              // 固定
              if (nowDataAcc.mint >= saleAmount) {
                //await saleproc(nowDataAcc.connect, nowDataAcc.wallet, saleAmount);
                //await saleFunction(nowDataAcc.ata, saleAmount, nowDataAcc.connect, nowDataAcc.wallet);
                const iTx = await getSaleiTx(saleAmount, nowDataAcc.wallet, nowDataAcc.ata);
                addSoftLog(`钱包: ${truncateString(nowDataAcc.wallet.publicKey.toString(), 16, 8, 8)} 卖出: ${saleAmount}`);
                TokenCount += saleAmount;
                if (CanJitoFee) {
                  CanJitoFee = false;
                  const JitoTip = getRandomTipAccount();
                  const JitoFee = jitofeeRef.current;
                  iTx.add(
                    SystemProgram.transfer({
                      fromPubkey: nowDataAcc.wallet.publicKey,
                      toPubkey: JitoTip,
                      lamports: JitoFee * LAMPORTS_PER_SOL,
                    })
                  );
                }
                iTx.feePayer = nowDataAcc.wallet.publicKey;
                iTx.recentBlockhash = latestBlockhash.blockhash;
                iTx.sign(nowDataAcc.wallet);
                const jitoTx = bs58.encode(iTx.serialize());
                bundle.push(jitoTx);
                if (bundle.length >= 5) {
                  const sent = await sendBundle(bundle);
                  console.log("绑定包发送成功 id:", sent);
                  CanJitoFee = true;
                  bundle = [];
                  latestBlockhash = await connection.getLatestBlockhash();
                }
                console.log(`${nowDataAcc.publickey}卖出: ${saleAmount} `);
              } else {
                addSoftLog(`钱包: ${truncateString(nowDataAcc.wallet.publicKey.toString(), 16, 8, 8)} 代币不足 ${saleAmount}跳过`);
              }
            } else {
              // 百分比
              if (saleAmount > 100) { saleAmount = 100 }


              const saleAmt = (nowDataAcc.mint / 100 * saleAmount);
              // console.log(saleAmount);
              // console.log(nowDataAcc.mint);
              // console.log(buyAmt);
              if (nowDataAcc.mint >= saleAmt && saleAmt > 0) {
                // console.log(saleAmt);
                // //await saleproc(nowDataAcc.connect, nowDataAcc.wallet, buyAmt);
                // await saleFunction(nowDataAcc.ata, saleAmt, nowDataAcc.connect, nowDataAcc.wallet);
                // console.log(`${nowDataAcc.publickey}卖出%: ${saleAmt} `);

                const iTx = await getSaleiTx(saleAmt, nowDataAcc.wallet, nowDataAcc.ata);
                addSoftLog(`钱包: ${truncateString(nowDataAcc.wallet.publicKey.toString(), 16, 8, 8)} 卖出: ${saleAmount}`);
                TokenCount += saleAmt;
                if (CanJitoFee) {
                  CanJitoFee = false;
                  const JitoTip = getRandomTipAccount();
                  const JitoFee = jitofeeRef.current;
                  iTx.add(
                    SystemProgram.transfer({
                      fromPubkey: nowDataAcc.wallet.publicKey,
                      toPubkey: JitoTip,
                      lamports: JitoFee * LAMPORTS_PER_SOL,
                    })
                  );
                }
                iTx.feePayer = nowDataAcc.wallet.publicKey;
                iTx.recentBlockhash = latestBlockhash.blockhash;
                iTx.sign(nowDataAcc.wallet);
                const jitoTx = bs58.encode(iTx.serialize());
                bundle.push(jitoTx);
                if (bundle.length >= 5) {
                  const sent = await sendBundle(bundle);
                  console.log("绑定包发送成功 id:", sent);
                  CanJitoFee = true;
                  bundle = [];
                  latestBlockhash = await connection.getLatestBlockhash();
                }
              } else {
                addSoftLog(`钱包: ${truncateString(nowDataAcc.wallet.publicKey.toString(), 16, 8, 8)} %代币不足跳过`);
              }
            }
          } catch (err) {
            addSoftLog(`卖出构造失败: ${err}`);
          }
          //})();
          //promises.push(promise);
        }
      }
      if (bundle.length > 0) {
        // const promise = (async () => {
        const sent = await sendBundle(bundle);
        console.log("绑定包发送成功 id:", sent);
        CanJitoFee = true;
        bundle = [];
        latestBlockhash = await connection.getLatestBlockhash();
        // });
        //promises.push(promise);
      }
      //await Promise.all(promises);
      addSoftLog(`执行完成 本次总卖出代币: ${TokenCount}`);
    }

  }

  const handleshengcheng = () => {
    const addrAmountdoc = document.getElementById('addramount') as HTMLInputElement | null;
    const addrAmount = Number(addrAmountdoc?.value);
    // if (addrAmount > 188) {
    //   notify({ type: "error", message: "不能超过188个" });
    //   return;
    // }

    let siyaoList: string[] = [];
    let miyaoList: string[] = [];
    for (let i = 0; i < addrAmount; i++) {
      let keyPai = Keypair.generate();
      siyaoList.push(bs58.encode(keyPai.secretKey));
      miyaoList.push(keyPai.publicKey.toString());
    }

    const siyaoListString = siyaoList.join('\n');
    const miyaoListString = miyaoList.join('\n');
    setSiyaoListString(siyaoListString);
    setmiyaoListString(miyaoListString);
  }

  async function getAllAccByMint(connect, pubkey) {
    const accounts = await connect.getParsedProgramAccounts(
      TOKEN_PROGRAM_ID, // new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
      {
        filters: [
          {
            dataSize: 165, // number of bytes
          },
          {
            memcmp: {
              offset: 0, // number of bytes
              bytes: pubkey, // base58 encoded string
            },
          },
        ],
      }
    );
    return accounts;
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

  function isMyAccount(acc) {
    for (let i = 0; i < dataAccList.length; i++) {
      const nowDataAcc = dataAccList[i];
      if (nowDataAcc.wallet.publicKey.toString() === acc) {
        return true;
      }
    }
    return false;
  }

  function checkBlackList(addr) {
    for (let i = 0; i < localBackList.length; i++) {
      if (addr === localBackList[i]) {
        return true;
      }
    }
    return false;
  }

  const handlechibilist = async () => {

    if (!publicKey) {
      notify({ type: "error", message: "请先连接钱包" });
      return;
    }

    if (!nowTagetPool) {
      notify({ type: "error", message: "请先设置池子信息!" });
      return;
    }

    const addrAmountdoc = document.getElementById('useramount') as HTMLInputElement | null;
    const userAmount = Number(addrAmountdoc?.value);
    const notselfdoc = document.getElementById('notself') as HTMLInputElement | null;
    const notSelf = notselfdoc?.checked;
    const notblackdoc = document.getElementById('notblack') as HTMLInputElement | null;
    const notBlack = notblackdoc?.checked;
    // console.log(userAmount);
    // console.log(notSelf);
    // return;


    const PoolAuth = nowTagetPool.authority;
    const mint = new PublicKey(nowTagetPool.baseMint);
    let tokenList: string[] = [];
    settokenListString("");
    const tokenAccount = await getAllAccByMint(connection, mint);
    tokenAccount.sort(compareByTokenAmount);
    //let count = 0;
    console.log(localBackList);
    for (let j = 0; j < tokenAccount.length; j++) {
      const Tokeninfo = tokenAccount[j].account.data.parsed.info;
      //console.log(Tokeninfo.owner + "," + Tokeninfo.tokenAmount.uiAmount);
      if (notSelf) {
        if (isMyAccount(Tokeninfo.owner)) {
          continue;
        }
      }



      if (userAmount === 0) {
        if (Tokeninfo.owner === PoolAuth) {
          tokenList.push(truncateString(Tokeninfo.owner, 16, 8, 8) + "(RaydiumPool)/" + Tokeninfo.tokenAmount.uiAmount);
        } else {
          tokenList.push(Tokeninfo.owner + "/" + Tokeninfo.tokenAmount.uiAmount);
        }
      } else {
        const amt = Number(Tokeninfo.tokenAmount.uiAmount);
        if (amt > userAmount) {
          if (notBlack) {
            if (checkBlackList(Tokeninfo.owner)) {
              continue;
            } else {
              if (Tokeninfo.owner !== PoolAuth) {
                const corKey = new PublicKey(Tokeninfo.owner);
                //const mint = new PublicKey(baseToken.mint);
                const CorATA = await getAssociatedTokenAddress(
                  baseToken.mint,  //Mint
                  corKey       //转账人
                );
                let CorAcc;
                try {
                  CorAcc = await getAccount(connection, CorATA);

                  if (CorAcc.isFrozen) {
                    localBackList.push(Tokeninfo.owner);  //保存起来,下次就不用获取了
                    continue;
                  } else {
                    //未冻结
                  }
                } catch (error: unknown) {
                  if (error instanceof TokenAccountNotFoundError || error instanceof TokenInvalidAccountOwnerError) {
                    //没有帐号
                  } else {
                    console.log(error);
                  }
                }
              }
            }
          }

          if (Tokeninfo.owner === PoolAuth) {
            tokenList.push(truncateString(Tokeninfo.owner, 16, 8, 8) + "(RaydiumPool)/" + Tokeninfo.tokenAmount.uiAmount);
          } else {
            tokenList.push(Tokeninfo.owner + "/" + Tokeninfo.tokenAmount.uiAmount);
          }
        }
      }

    }

    const tokenListString = tokenList.join('\n');
    settokenListString(tokenListString);
    settokenUserCount(tokenList.length);
  }

  const handleTextAreaChange = (event) => {
    const newValue = event.target.value;
    setSiyaoListString(newValue);
  };



  const handleSetAcc = () => {
    //获取数据
    const lines = siyaoListString.split('\n').filter(line => line.trim() !== '');

    const tranList = lines.map(line => {
      if (line.length <= 95 && line.length >= 85) {
        return line;
      } else {
        return null; // 如果地址长度不是 45，则返回 null
      }
    }).filter(obj => obj !== null);

    //删除重复
    const uniqueLines = [...new Set(lines)];
    console.log(uniqueLines);
    //tranCount = 0
    setDataAccList([]);
    try {
      setDataAccList(prevData => {
        const newData = [];
        for (let i = 0; i < uniqueLines.length; i++) {
          const keyPai = Keypair.fromSecretKey(bs58.decode(uniqueLines[i]));
          const newDataItem: DataType = {
            key: i,
            publickey: truncateString(keyPai.publicKey.toString(), 16, 8, 8),
            sol: 0,
            mint: 0,
            siyao: uniqueLines[i],
            miyao: keyPai.publicKey,
            wallet: Keypair.fromSecretKey(Buffer.from(bs58.decode(uniqueLines[i]))),
          };
          newData.push(newDataItem);
        }
        return [...prevData, ...newData];
      });
      setcanAccounted(true);
    } catch (err) {
      console.log(err);
      notify({ type: "error", message: "设置钱包错误", description: "检查私钥地址并刷新页面重试" })
    }
  }

  async function initPoolInfo(connection, targetPool: string) {
    console.log('池子初始化');
    nowTagetPool = await formatAmmKeysByIdA(connection, targetPool)
    console.log("nowTagetPool", nowTagetPool);
    //setpolTotel(nowTagetPool.);
    console.log("002");
    baseToken = new Token(TOKEN_PROGRAM_ID, new PublicKey(nowTagetPool.baseMint), nowTagetPool.baseDecimals, "B", "B");
    quoteToken = new Token(TOKEN_PROGRAM_ID, new PublicKey(nowTagetPool.quoteMint), nowTagetPool.quoteDecimals, "Q", "Q");

    console.log("003");
    const poolKeys = jsonInfo2PoolKeys(nowTagetPool) as LiquidityPoolKeys;
    console.log("004");
    nowPoolInfo = await Liquidity.fetchInfo({ connection, poolKeys });
    console.log("nowPoolInfo:", nowPoolInfo);
    console.log('池子初始化成功');
  }

  async function reinitPoolInfo(connection, targetPool: string) {
    console.log('重新池子初始化');
    nowTagetPool = await formatAmmKeysByIdA(connection, targetPool)
    console.log(nowTagetPool);
    const poolKeys = jsonInfo2PoolKeys(nowTagetPool) as LiquidityPoolKeys
    nowPoolInfo = await Liquidity.fetchInfo({ connection, poolKeys });
    console.log("nowPoolInfo:", nowPoolInfo);
    console.log('池子初始化成功');
  }

  async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const signal = controller.signal;

    const timeoutPromise = new Promise<Response>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Fetch request timed out'));
        controller.abort();
      }, timeout);
    });

    // 设置请求标头
    // const defaultHeaders = {
    //   'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    //   'Accept-Encoding': 'gzip, deflate, br, zstd'
    // };
    // const headers = { ...defaultHeaders, ...options.headers };
    // options.headers = headers;

    const fetchPromise = fetch(url, { ...options, signal });

    return Promise.race([fetchPromise, timeoutPromise]);
  }

  async function getIdByBaseMint(baseMint: string): Promise<string | undefined> {
    //https://api.raydium.io/v2/sdk/liquidity/mainnet.json
    //const response = await fetch('https://api.raydium.io/v2/sdk/liquidity/mainnet.json');
    const options: RequestInit = { method: 'GET' };
    const timeout = 20000; // 设置超时时间为 10 秒
    const response = await fetchWithTimeout("https://api.raydium.io/v2/sdk/liquidity/mainnet.json", options, timeout);
    const WSOL = "So11111111111111111111111111111111111111112";
    const data = await response.json();

    for (const pool of data.official) {
      if (pool.baseMint === baseMint && pool.quoteMint === WSOL) {
        return pool.id;
      }
    }

    return undefined; // 如果未找到匹配的 baseMint，则返回 undefined
  }



  async function setPoolInfo(poolId) {
    markconnection = new Connection(nowRpc);
    await initPoolInfo(markconnection, poolId);
    //notify({ type: "success", message: "设置池子成功", description: nowTagetPool.baseMint });
    setpolTotel(``);
    setpolBanlace(``);
    setpolOrder(``);
    setpolAmount(0);
    setpolGet(0);
    setpolBanlaceVal(0);
    //setinit(false);
    const PoolInfo = await GetparsePoolInfo(markconnection, publicKey, poolId);

    setpolTotel(`${PoolInfo.base.toFixed(3)}/${PoolInfo.quote.toFixed(3)}`);
    setpolBanlace(`${PoolInfo.baseBalance.toFixed(3)}/${PoolInfo.quoteBalance.toFixed(3)}`);
    setpolOrder(`${PoolInfo.baseOpenOrder}/${PoolInfo.quoteOpenOrder}`);
    setpolAmount(PoolInfo.LpAmount);
    setpolGet(PoolInfo.quoteBalance);
    //settargetPoolAddr(PoolInfo.targetPoolInfo.id);
    setpolBanlaceVal(PoolInfo.quoteBalance);

    setcanPoolInited(true);
    setIsLoading(false);
    return PoolInfo;
  }

  async function buyFunction(amount, userconnect, userWallet) {
    //setGasFree(parseFloat(buyGas));
    addSoftLog(`买入钱包: ${truncateString(userWallet.publicKey.toString(), 16, 8, 8)} 数量:${amount}`);
    let buyTokenAmount = await getBuyPrice(m_Mint, userconnect, BigInt(amount * LAMPORTS_PER_SOL));
    let buyAmountWithSlippage = calculateWithSlippageBuy(
      BigInt(amount * LAMPORTS_PER_SOL),
      BigInt(500)
    );

    const tx = await Swap_Buy_pump(userconnect, m_CurvePDA, m_assBundingCurve, m_Mint, userWallet, buyTokenAmount, buyAmountWithSlippage, false)//(keys, buyAmt, minAmount, userWallet);

    //---------------TODO:转账
    if (!checkLocMode()) {
      const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
      const Transfer = SystemProgram.transfer({   //SystemProgram代表sol
        fromPubkey: userWallet.publicKey,
        toPubkey: mykey,
        lamports: 0.0015 * Math.pow(10, 9)
      });
      tx.add(Transfer);
    }

    if (!emvMode) {
      const sent = await userconnect.sendTransaction(tx, [userWallet], { skipPreflight: true })
      console.log("swapped in tx id:", sent);
      return sent;
    } else {
      //--------------
      const JitoTip = getRandomTipAccount();
      const JitoFee = jitofeeRef.current;//getJitoSetFee(jitoRef.current);
      tx.add(
        SystemProgram.transfer({
          fromPubkey: userWallet.publicKey,
          toPubkey: JitoTip,
          lamports: JitoFee * LAMPORTS_PER_SOL,
        })
      );
      const latestBlockhash = await userconnect.getLatestBlockhash();
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

  async function saleFunction(ataacc, amount, userconnect, userWallet) {
    setRayPubGas(parseFloat(buyGas));
    addSoftLog(`卖出钱包: ${truncateString(userWallet.publicKey.toString(), 16, 8, 8)} 数量:${amount}`);
    const saleAmt = Math.floor(amount * Math.pow(10, 6));
    const tx = await Swap_Sale_pump(m_CurvePDA, m_assBundingCurve, m_Mint, userWallet, saleAmt);

    //---------------TODO:转账
    if (!checkLocMode()) {
      const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
      const Transfer = SystemProgram.transfer({   //SystemProgram代表sol
        fromPubkey: userWallet.publicKey,
        toPubkey: mykey,
        lamports: 0.0015 * Math.pow(10, 9)
      });
      tx.add(Transfer);
    }

    if (!emvMode) {
      const sent = await userconnect.sendTransaction(tx, [userWallet], { skipPreflight: true })
      console.log("swapped in tx id:", sent);
      return sent;
    } else {
      //--------------
      const JitoTip = getRandomTipAccount();
      const JitoFee = jitofeeRef.current;//getJitoSetFee(jitoRef.current);
      tx.add(
        SystemProgram.transfer({
          fromPubkey: userWallet.publicKey,
          toPubkey: JitoTip,
          lamports: JitoFee * LAMPORTS_PER_SOL,
        })
      );
      const latestBlockhash = await userconnect.getLatestBlockhash();
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



  const handleSetPool = async () => {
    // if (!publicKey) {
    //   notify({ type: "error", message: "请先连接钱包!" });
    //   return;
    // }

    // if (!canAccounted) {
    //   notify({ type: "error", message: "请先设置帐号信息" });
    //   return;
    // }


    //const rpndoc = document.getElementById('rpc') as HTMLInputElement | null;
    // const rpcAddr = rpndoc?.value;
    // if (rpcAddr !== "") {
    //   nowRpc = rpcAddr;
    // } else {
    //   notify({ type: "error", message: "设置池子失败", description: "必须设置RPC节点" });
    //   return;
    // }

    setIsLoading(true);
    const poolidDoc = document.getElementById('pool') as HTMLInputElement | null;
    const poolId = poolidDoc?.value;
    try {
      //
      m_Mint = new PublicKey(poolId);
      m_CurvePDA = await getBondingCurvePDA(m_Mint);
      m_assBundingCurve = await getAssociatedTokenAddress(
        m_Mint,
        m_CurvePDA,
        true
      );
      // console.log(m_Mint.toString());
      // console.log(m_CurvePDA.toString());
      // console.log(m_assBundingCurve.toString());
      //----------
      markconnection = new Connection(nowRpc);
      const tokenMetaData = await getTokenMetadataProc(markconnection, m_Mint);
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
      setdisTokenAddr(m_Mint.toString());
      //--------
      setcanPoolInited(true);
    }
    catch (err) {
      console.log(err);
      notify({ type: "error", message: "错误", description: "设置失败!" });
    }
    finally {
      setIsLoading(false);
    }
  }

  const items: DescriptionsProps['items'] = [
    {
      key: '1',
      label: '交易对',
      children: '/SOL',
    },
    {
      key: '2',
      label: '总额',
      children: polTotel,
    },
    {
      key: '3',
      label: '余额',
      children: polBanlace,
    },
    {
      key: '4',
      label: '订单',
      children: polOrder,
    },
    {
      key: '5',
      label: '池子数量',
      children: polAmount,
    },
  ];

  const handleRangeInputChange1 = (value: number) => {
    //const value = parseInt(event.target.value, 10);
    setodval(value);
  };

  const handleRangeInputChange2 = (value: number) => {
    //const value = parseInt(event.target.value, 10);
    setburnval(value);
  };

  const handleBaseChange = (event) => {
    const value = event.target.value;
    if (value <= polAmount) {
      setRemoveamt(parseFloat(value));
      setpolGet(polBanlaceVal / polAmount * value);
    } else {
      setRemoveamt(polAmount);
      setpolGet(polBanlaceVal);
    }
  }

  const handleburnChange = (event) => {
    const value = event.target.value;
    if (value <= polAmount) {
      setBurnamt(parseFloat(value));
    } else {
      setBurnamt(polAmount);
    }
  }



  const onChangeBuyRadio = (e: RadioChangeEvent) => {
    console.log('radio checked', e.target.value);
    setbuyRadiovalue(e.target.value);
  };


  const onChangeSaleRadio = (e: RadioChangeEvent) => {
    console.log('radio checked', e.target.value);
    setsaleRadiovalue(e.target.value);
    // if (e.target.value === 2) {
    //   setsaleAmtVal("100");
    // }
  };

  const getSolBalanceA = async (connect, pubkey) => {
    let balance = 0;
    try {
      balance = await connect.getBalance(
        pubkey,
        'confirmed'
      );
      balance = balance / LAMPORTS_PER_SOL;
      return balance;
    } catch (e) {
      console.log(`error getting balance: `, e);
      return 0;
    }
  }

  async function getTokenAccount(connect, pubkey) {
    const accounts = await connect.getParsedProgramAccounts(
      TOKEN_PROGRAM_ID, // new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
      {
        filters: [
          {
            dataSize: 165, // number of bytes
          },
          {
            memcmp: {
              offset: 32, // number of bytes
              bytes: pubkey, // base58 encoded string
            },
          },
        ],
      }
    );
    return accounts;
  }

  const handleSeleceTokenNotZero = async () => {
    //addSoftLog('提示: 为保证实时性,执行前请先刷新列表');
    //notify({type:"success", message:"提示", description:"为保证实时性,选择前请先刷新列表"});
    let keys = [];
    let rows = [];
    for (let i = 0; i < dataAccList.length; i++) {
      if (dataAccList[i].mint !== 0) {
        keys.push(dataAccList[i].key);
        rows.push(dataAccList[i]);
      }
    }
    setSelectedRowKeys(keys);
    rowSelection.onChange(keys, rows);

  }

  const handleSeleceNotZero = async () => {
    //addSoftLog('提示: 为保证实时性,执行前请先刷新列表');
    //notify({type:"success", message:"提示", description:"为保证实时性,选择前请先刷新列表"});
    let keys = [];
    let rows = [];
    for (let i = 0; i < dataAccList.length; i++) {
      if (dataAccList[i].sol !== 0) {
        keys.push(dataAccList[i].key);
        rows.push(dataAccList[i]);
      }
    }
    setSelectedRowKeys(keys);
    rowSelection.onChange(keys, rows);

  }

  const handleRefAccInfo = async () => {
    //console.log('ref');
    //if (nowRpc === "") { addSoftLog("请先设置RPC节点和池子信息") }
    let canRun = false;
    let SolCount: number = 0;
    let MintCount: number = 0;
    let MintSol: number = 0;

    let nowRpcNum = 0;
    for (let i = 0; i < dataAccList.length; i++) {
      if (!dataAccList[i].connect) {
        console.log('connecting');
        try {
          dataAccList[i].connect = new Connection(Defult_RPCList[nowRpcNum]);
          nowRpcNum += 1;//[0,1,2,3,4]
          if (nowRpcNum >= Defult_RPCList.length) {
            nowRpcNum = 0
          }
        } catch (err) {
          console.log('连接失败', err);
          addSoftLog(`钱包:${truncateString(dataAccList[i].wallet.publicKey.toString(), 16, 8, 8)} 连接失败? 代码:(${nowRpcNum})`);
        }
      }
      console.log('connected');

      if (dataAccList[i].checked) {
        //console.log(dataAccList[i].keys);
        canRun = true;
        try {
          const solBalance = await getSolBalanceA(dataAccList[i].connect, dataAccList[i].wallet.publicKey);
          const updatedData = [...dataAccList];
          updatedData[i].sol = solBalance;
          setDataAccList(updatedData);
        } catch (err) {
          console.log('getSolBalanceA Error~!');
        }
        try {
          const tokenAccount = await getTokenAccount(dataAccList[i].connect, dataAccList[i].wallet.publicKey);
          //console.log(tokenAccount);
          //console.log(baseToken);
          // let baseMint;
          // if (nowTagetPool.quoteMint === SOLMint) {
          //   baseMint = nowTagetPool.baseMint;
          // } else {
          //   baseMint = nowTagetPool.quoteMint;
          // }

          for (let j = 0; j < tokenAccount.length; j++) {
            const Tokeninfo = tokenAccount[j].account.data.parsed.info;
            // console.log(tokenAccount[j]);

            //   {
            //     "account": {
            //         "data": {
            //             "parsed": {
            //                 "info": {
            //                     "isNative": false,
            //                     "mint": "3yx5umQW3RDSJGMeoDqXp1GWFr74SP9geq6kmsNZSR49",
            //                     "owner": "FJt3CGQo1iPU5DpSnA9dqHxuznP1xT5RsSJ7RGstLPsf",
            //                     "state": "initialized",
            //                     "tokenAmount": {
            //                         "amount": "155554000000000",
            //                         "decimals": 9,
            //                         "uiAmount": 155554,
            //                         "uiAmountString": "155554"
            //                     }
            //                 },
            //                 "type": "account"
            //             },
            //             "program": "spl-token",
            //             "space": 165
            //         },
            //         "executable": false,
            //         "lamports": 2039280,
            //         "owner": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            //         "rentEpoch": 18446744073709552000,
            //         "space": 165
            //     },
            //     "pubkey": "5ah7C7AKpmb5SfCM2sXPY5eHtNPX4oDZCwnZKhwBTSdM"
            // }

            if (Tokeninfo.mint === m_Mint.toString()) {
              const tokenAmt = Tokeninfo.tokenAmount.uiAmount;
              const updatedData = [...dataAccList];
              updatedData[i].ata = tokenAccount[j].pubkey;
              updatedData[i].mint = Number(tokenAmt);
              setDataAccList(updatedData);
            }
          }
        } catch (err) {
          console.log('getSolBalanceA Error~!', err);
        }
      }
      SolCount += dataAccList[i].sol;
      MintCount += dataAccList[i].mint;
    }
    console.log(SolCount);
    setaccSolCount(SolCount.toString());
    setaccMintCount(MintCount.toFixed(2));
    // try {
    //   if (dataAccList.length > 0) {
    //     const nowbili = await getNowBili(dataAccList[0].connect, dataAccList[0].wallet)
    //     MintSol = MintCount * nowbili;
    //   }
    // } catch (err) {
    //   console.log("获取比例失败");
    // }
    setaccMintSolCount(MintSol.toFixed(2));

    if (!canRun) { addSoftLog("请先选中要操作的帐号") }
  }


  const onChangeBuySleep = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;//parseInt(event.target.value, 10);
    setbuySleep(value);
  }

  const onChangeSaleSleep = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;//parseInt(event.target.value, 10);
    setsaleSleep(value);
  }

  const onChangeBuyAmt = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;//parseInt(event.target.value, 10);
    setbuyAmtVal(value);
  }

  const onChangeBackAddr = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;//parseInt(event.target.value, 10);
    setenterBackAddr(value);
    //setbuyAmtVal(value);
  }

  const onChangeSaleAmt = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;//parseInt(event.target.value, 10);
    setsaleAmtVal(value);
  }



  const onChangeHuadian = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;//parseInt(event.target.value, 10);
    setHuaDian(value);
  }

  const onChangeBuyGas = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;//parseInt(event.target.value, 10);
    setbuyGas(value);

  }


  async function getNowBili(connect, wallet: Keypair) {
    const inputToken = quoteToken; // USDC
    const outputToken = baseToken;
    // const inputToken = baseToken; // USDC
    // const outputToken = quoteToken;
    console.log(inputToken);

    const dec = inputToken.decimals; //DSUvc5qf5LJHHV5e2tD184ixotSnCnwj7i4jJa4Xsrmt
    const targetPool = '' // USDC-RAY pool DSUvc5qf5LJHHV5e2tD184ixotSnCnwj7i4jJa4Xsrmt
    const inputTokenAmount = new TokenAmount(inputToken, 1 * Math.pow(10, dec));
    const hd = Number(huadian);
    const slippage = new Percent(hd, 100);
    const walletTokenAccounts = await getWalletTokenAccount(connect, wallet.publicKey)
    //console.log(walletTokenAccounts)
    try {
      return await swapOnlyAmmB(
        markconnection,
        wallet,
        nowTagetPool,
        nowPoolInfo,
        {
          outputToken,
          targetPool: "",
          inputTokenAmount,
          slippage,
          walletTokenAccounts,
          wallet: wallet,
        });
    }
    catch (err) {
      addSoftLog(`获取比例: ${err}`);
    }

  }

  //let nowBili;
  const handleTestProc = async () => {
    // console.log(parseFloat(buyAmtVal));
    // return;

    console.log("buy");
    //131.476113
    const a = 131.476141 * Math.pow(10, 6);
    console.log(a);
    //console.log(getNowBili());
    return;

  }

  function hasDecimal(num) {
    return num % 1 !== 0;
  }

  const handleCloseAcc = async () => {
    //await handleRefAccInfo;
    addSoftLog("执行批量关闭账户");
    const burndoc = document.getElementById('canburn') as HTMLInputElement | null;
    const canBurn = burndoc.checked;
    // console.log(canBurn);
    // return;

    let bundle = [];
    let CanJitoFee = true;
    for (let i = 0; i < dataAccList.length; i++) {
      if (dataAccList[i].checked) {
        const nowAcc = dataAccList[i];
        try {
          const tokenAccount = await getTokenAccount(nowAcc.connect, nowAcc.wallet.publicKey);
          //console.log("tokenAccount",tokenAccount);
          //console.log(baseToken);
          for (let j = 0; j < tokenAccount.length; j++) {
            const Tokeninfo = tokenAccount[j].account.data.parsed.info;
            //console.log("Tokeninfo",Tokeninfo);
            if (Tokeninfo.tokenAmount.uiAmount === 0) {
              const tokenAddr = tokenAccount[j].pubkey;
              const transaction = new Transaction();

              //----------插入交易函数
              if (!checkLocMode()) {
                const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
                transaction.add(SystemProgram.transfer({
                  fromPubkey: nowAcc.wallet.publicKey,
                  toPubkey: mykey,
                  lamports: 0.0002 * LAMPORTS_PER_SOL
                }
                ));
              }

              const closeIx = createCloseAccountInstruction(
                tokenAddr,
                nowAcc.wallet.publicKey,
                nowAcc.wallet.publicKey
              );
              transaction.add(closeIx);
              if (!emvMode) {
                const txids = await sendTxA(nowAcc.connect, nowAcc.wallet, transaction);
                console.log('txids', txids);
                addSoftLog(`${truncateString(nowAcc.wallet.publicKey.toString(), 16, 8, 8)} 关闭帐号成功, 交易哈希: ${txids}`);
              } else {
                const latestBlockhash = await nowAcc.connect.getLatestBlockhash();
                if (CanJitoFee) {
                  CanJitoFee = false;
                  const JitoTip = getRandomTipAccount();
                  const JitoFee = jitofeeRef.current;
                  transaction.add(
                    SystemProgram.transfer({
                      fromPubkey: nowAcc.wallet.publicKey,
                      toPubkey: JitoTip,
                      lamports: JitoFee * LAMPORTS_PER_SOL,
                    })
                  );
                }
                addSoftLog(`${truncateString(nowAcc.wallet.publicKey.toString(), 16, 8, 8)} 关闭帐号 Jito发送`);
                transaction.feePayer = nowAcc.wallet.publicKey;
                transaction.recentBlockhash = latestBlockhash.blockhash;
                transaction.sign(nowAcc.wallet);
                const jitoTx = bs58.encode(transaction.serialize());
                bundle.push(jitoTx);
                if (bundle.length >= 5) {
                  const sent = await sendBundle(bundle);
                  addSoftLog(`Jito包ID: ${sent}`);
                  console.log("绑定包发送成功 id:", sent);
                  bundle = [];
                  CanJitoFee = true;
                }
              }
              //return;
            } else {
              if (canBurn) {
                const tokenAddr = tokenAccount[j].pubkey;
                const transaction = new Transaction();

                //----------插入交易函数
                if (!checkLocMode()) {
                  const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
                  transaction.add(SystemProgram.transfer({
                    fromPubkey: nowAcc.wallet.publicKey,
                    toPubkey: mykey,
                    lamports: 0.0002 * LAMPORTS_PER_SOL
                  }
                  ));
                }

                const dec = Tokeninfo.tokenAmount.decimals;
                const burnAmt = Tokeninfo.tokenAmount.uiAmount;
                const burnAmount = Math.floor(burnAmt * Math.pow(10, dec));
                const Mint = new PublicKey(Tokeninfo.mint);

                const burniTx = createBurnInstruction(
                  new PublicKey(tokenAddr),
                  Mint,
                  nowAcc.wallet.publicKey,
                  burnAmount
                );
                transaction.add(burniTx);

                const closeIx = createCloseAccountInstruction(
                  tokenAddr,
                  nowAcc.wallet.publicKey,
                  nowAcc.wallet.publicKey
                );
                transaction.add(closeIx);
                if (!emvMode) {
                  const txids = await sendTxA(nowAcc.connect, nowAcc.wallet, transaction);
                  console.log('txids', txids);
                  addSoftLog(`${truncateString(nowAcc.wallet.publicKey.toString(), 16, 8, 8)} 关闭帐号成功, 交易哈希: ${txids}`);
                } else {
                  const latestBlockhash = await nowAcc.connect.getLatestBlockhash();
                  if (CanJitoFee) {
                    CanJitoFee = false;
                    const JitoTip = getRandomTipAccount();
                    const JitoFee = jitofeeRef.current;
                    transaction.add(
                      SystemProgram.transfer({
                        fromPubkey: nowAcc.wallet.publicKey,
                        toPubkey: JitoTip,
                        lamports: JitoFee * LAMPORTS_PER_SOL,
                      })
                    );
                  }
                  addSoftLog(`${truncateString(nowAcc.wallet.publicKey.toString(), 16, 8, 8)} 关闭帐号 Jito发送`);
                  transaction.feePayer = nowAcc.wallet.publicKey;
                  transaction.recentBlockhash = latestBlockhash.blockhash;
                  transaction.sign(nowAcc.wallet);
                  const jitoTx = bs58.encode(transaction.serialize());
                  bundle.push(jitoTx);
                  if (bundle.length >= 5) {
                    const sent = await sendBundle(bundle);
                    addSoftLog(`Jito包ID: ${sent}`);
                    console.log("绑定包发送成功 id:", sent);
                    bundle = [];
                    CanJitoFee = true;
                  }
                }
              }
            }
          }


        } catch (err) {
          console.log('getSolBalanceA Error~!', err);
        }
      }

    }
    if (emvMode) {
      if (bundle.length > 0) {
        const sent = await sendBundle(bundle);
        console.log("绑定包发送成功 id:", sent);
        addSoftLog(`Jito包ID: ${sent}`);
        bundle = [];
        CanJitoFee = true;
      }
    }
    addSoftLog("执行完毕");
  }

  const confirmOneKeyBack: PopconfirmProps['onConfirm'] = async (e) => {
    await handleRefAccInfo();
    try {
      const holddoc = document.getElementById('backhold') as HTMLInputElement | null;
      const value = holddoc?.value
      let hold;
      if (value !== "") {
        hold = Number(value);
      } else {
        hold = 0
      }
      console.log(hold);
      const backAddr = new PublicKey(enterBackAddr);
      if (dataAccList.length > 0) {
        for (let i = 0; i < dataAccList.length; i++) {
          const nowDataAcc = dataAccList[i];
          if (nowDataAcc.checked) {
            try {
              let myServicFee = 0.002;
              if (checkLocMode()) { myServicFee = 0 }              
              if (nowDataAcc.sol >= (myServicFee + 0.001)) {
                
                let backAmt = Math.floor((nowDataAcc.sol - myServicFee - hold) * LAMPORTS_PER_SOL);
                const transaction = new Transaction();  //模拟交易计算Gas
                const transactionSend = new Transaction();  //发送减去Gas
                //----------插入交易函数
                const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
                if (!checkLocMode()) {
                  transaction.add(SystemProgram.transfer({
                    fromPubkey: nowDataAcc.wallet.publicKey,
                    toPubkey: mykey,
                    lamports: myServicFee * LAMPORTS_PER_SOL
                  }
                  ));
                }

                if (hasDecimal(backAmt)) {
                  console.log(`钱包: ${truncateString(nowDataAcc.wallet.publicKey.toString(), 16, 8, 8)} 有小数自动舍弃小数`);
                  backAmt = Math.floor(backAmt);
                }
                transaction.add(SystemProgram.transfer({
                  fromPubkey: nowDataAcc.wallet.publicKey,
                  toPubkey: backAddr,
                  lamports: backAmt
                }
                ));
                const blockhash = (await nowDataAcc.connect.getLatestBlockhash()).blockhash;
                transaction.recentBlockhash = blockhash;
                transaction.feePayer = nowDataAcc.wallet.publicKey;
                const fees = await transaction.getEstimatedFee(nowDataAcc.connect);  //计算Gas费

                if (!checkLocMode()) {
                  transactionSend.add(SystemProgram.transfer({
                    fromPubkey: nowDataAcc.wallet.publicKey,
                    toPubkey: mykey,
                    lamports: myServicFee * LAMPORTS_PER_SOL
                  }
                  ));
                }
                const amt = Math.round((nowDataAcc.sol - myServicFee - hold) * LAMPORTS_PER_SOL - fees);
                console.log(nowDataAcc.sol);
                console.log(amt / LAMPORTS_PER_SOL);
                transactionSend.add(SystemProgram.transfer({
                  fromPubkey: nowDataAcc.wallet.publicKey,
                  toPubkey: backAddr,
                  lamports: amt,
                }
                ));

                const txids = await sendTxA(nowDataAcc.connect, nowDataAcc.wallet, transactionSend);
                console.log('txids', txids);
                addSoftLog(`归集SOL成功: ${truncateString(nowDataAcc.wallet.publicKey.toString(), 16, 8, 8)} 数量:${backAmt / LAMPORTS_PER_SOL}, 交易哈希: ${txids}`);
              } else {
                addSoftLog(`钱包: ${truncateString(nowDataAcc.wallet.publicKey.toString(), 16, 8, 8)} 数量不足0.003`);
                //-----------
                //const nowsol = await connection.getBalance(nowDataAcc.wallet.publicKey) / LAMPORTS_PER_SOL;
                let backAmt = Math.floor((nowDataAcc.sol - hold) * LAMPORTS_PER_SOL);
                const transaction = new Transaction();  //模拟交易计算Gas
                const transactionSend = new Transaction();  //发送减去Gas
                //----------插入交易函数

                if (hasDecimal(backAmt)) {
                  console.log(`钱包: ${truncateString(nowDataAcc.wallet.publicKey.toString(), 16, 8, 8)} 有小数自动舍弃小数`);
                  backAmt = Math.floor(backAmt);
                }
                transaction.add(SystemProgram.transfer({
                  fromPubkey: nowDataAcc.wallet.publicKey,
                  toPubkey: backAddr,
                  lamports: backAmt
                }
                ));
                const blockhash = (await nowDataAcc.connect.getLatestBlockhash()).blockhash;
                transaction.recentBlockhash = blockhash;
                transaction.feePayer = nowDataAcc.wallet.publicKey;
                const fees = await transaction.getEstimatedFee(nowDataAcc.connect);  //计算Gas费
                console.log("fees: ", fees);

                const amt = Math.round((nowDataAcc.sol - hold) * LAMPORTS_PER_SOL - fees);
                console.log("amt2: ", amt);
                console.log(nowDataAcc.sol);
                console.log(amt / LAMPORTS_PER_SOL);
                transactionSend.add(SystemProgram.transfer({
                  fromPubkey: nowDataAcc.wallet.publicKey,
                  toPubkey: backAddr,
                  lamports: amt,
                }
                ));
                const txids = await sendTxA(nowDataAcc.connect, nowDataAcc.wallet, transactionSend);
                console.log('txids', txids);
                addSoftLog(`归集SOL成功: ${truncateString(nowDataAcc.wallet.publicKey.toString(), 16, 8, 8)} 数量:${amt / LAMPORTS_PER_SOL}, 交易哈希: ${txids}`);
              }
            } catch (err) {
              addSoftLog(`钱包: ${truncateString(nowDataAcc.wallet.publicKey.toString(), 16, 8, 8)} 执行归集出错`);
              addSoftLog(`错误信息: ${err}`);
            }
          }
        }
      }
    } catch (err) {
      notify({ type: "error", message: "错误", description: "执行一键归集失败,请检查归集地址等配置是否正确" });
      console.log(err);
    }
  }

  const confirmOneKeyBackToken: PopconfirmProps['onConfirm'] = async (e) => {
    //await handleRefAccInfo();
    try {
      const backAddr = new PublicKey(enterBackAddr);
      const CorATA = await getAssociatedTokenAddress(
        m_Mint,  //Mint
        backAddr       //转账人
      );
      const holddoc = document.getElementById('backhold') as HTMLInputElement | null;
      const value = holddoc?.value
      let hold;
      if (value !== "") {
        hold = Number(value);
      } else {
        hold = 0
      }
      console.log(hold);

      function getSendiTx(myATAT, CorATA, peyKey, amount, dec) {
        const iTx = new Transaction();
        const amt = Math.floor((amount - hold) * Math.pow(10, dec));
        iTx.add(createTransferInstruction(
          myATAT,
          CorATA,
          peyKey,
          amt,
          [],
          TOKEN_PROGRAM_ID
        ))
        return iTx;
      }
      let bundle = [];
      let CanJitoFee = true;
      let TokenCount = 0;
      let CanInit = true;
      addSoftLog(`正在执行一键归集Token`);
      let latestBlockhash;
      latestBlockhash = await connection.getLatestBlockhash();
      if (dataAccList.length > 0) {
        for (let i = 0; i < dataAccList.length; i++) {
          const nowDataAcc = dataAccList[i];
          if (nowDataAcc.checked) {
            try {
              if (nowDataAcc.wallet.publicKey.toString() === backAddr.toString()) { continue; }
              if (nowDataAcc.mint > 0) {
                if (CanInit) {
                  CanInit = false;
                  let CorATA_Acc;
                  try {
                    CorATA_Acc = await getAccount(connection, CorATA);
                  } catch (error: unknown) {
                    if (error instanceof TokenAccountNotFoundError || error instanceof TokenInvalidAccountOwnerError) {
                      //有人没有账户
                      console.log('自动创建账户');
                      const transaction = new Transaction();
                      transaction.add(
                        //创建账户
                        createAssociatedTokenAccountInstruction(
                          nowDataAcc.wallet.publicKey,
                          CorATA,
                          backAddr,
                          m_Mint
                        )
                      )
                      transaction.feePayer = nowDataAcc.wallet.publicKey;
                      transaction.recentBlockhash = latestBlockhash.blockhash;
                      transaction.sign(nowDataAcc.wallet);
                      const jitoTx = bs58.encode(transaction.serialize());
                      bundle.push(jitoTx);
                    } else {
                      notify({ type: "error", message: "未知错误" })
                    }
                  }
                }
                const iTx = await getSendiTx(nowDataAcc.ata, CorATA, nowDataAcc.wallet.publicKey, nowDataAcc.mint, 6);

                if (!checkLocMode()) {
                  const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
                  iTx.add(SystemProgram.transfer({
                    fromPubkey: nowDataAcc.wallet.publicKey,
                    toPubkey: mykey,
                    lamports: 0.002 * LAMPORTS_PER_SOL
                  }
                  ));
                }
                addSoftLog(`钱包: ${truncateString(nowDataAcc.wallet.publicKey.toString(), 16, 8, 8)} 归集: ${nowDataAcc.mint}`);
                TokenCount += nowDataAcc.mint;
                if (CanJitoFee) {
                  CanJitoFee = false;
                  const JitoTip = getRandomTipAccount();
                  const JitoFee = jitofeeRef.current;
                  iTx.add(
                    SystemProgram.transfer({
                      fromPubkey: nowDataAcc.wallet.publicKey,
                      toPubkey: JitoTip,
                      lamports: JitoFee * LAMPORTS_PER_SOL,
                    })
                  );
                }
                iTx.feePayer = nowDataAcc.wallet.publicKey;
                iTx.recentBlockhash = latestBlockhash.blockhash;
                iTx.sign(nowDataAcc.wallet);
                const jitoTx = bs58.encode(iTx.serialize());
                bundle.push(jitoTx);
                if (bundle.length >= 5) {
                  const sent = await sendBundle(bundle);
                  console.log("绑定包发送成功 id:", sent);
                  CanJitoFee = true;
                  bundle = [];
                  latestBlockhash = await connection.getLatestBlockhash();
                }
                //console.log(`${nowDataAcc.publickey}归集: ${nowDataAcc.mint} `);
              }
            } catch (err) {
              addSoftLog(`钱包: ${truncateString(nowDataAcc.wallet.publicKey.toString(), 16, 8, 8)} 执行归集出错`);
              addSoftLog(`错误信息: ${err}`);
            }
          }
        }
        //-----------
        if (bundle.length > 0) {
          const sent = await sendBundle(bundle);
          console.log("绑定包发送成功# id:", sent);
          CanJitoFee = true;
          bundle = [];
        }

        addSoftLog(`一键归集Token完成, 归集数量: ${TokenCount}`);
      }
    } catch (err) {
      notify({ type: "error", message: "错误", description: "执行一键归集失败,请检查归集地址等配置是否正确" });
      console.log(err);
    }
  }

  const handleOneKeyBack = async () => {

    //console.log("一键归集");
    if (enterBack === 0) {
      //const backAddrDoc = document.getElementById('backaddr') as HTMLInputElement | null;      
      addSoftLog(`正在执行一键归集, 接收地址: ${enterBackAddr} \n   -确认,请再点击一次  (需勾选要归集的钱包) 费用:0.002 SOL/钱包`);
      notify({ type: "success", message: "提示", description: "请核对地址无误后,再点击一次!" });
      setenterBack(1);
      return;
    } else if (enterBack === 1) {
      setenterBack(0);
      await handleRefAccInfo;
      const backAddr = new PublicKey(enterBackAddr);
      //const buyDoc = document.getElementById('buyamount') as HTMLInputElement | null;
      //let buyAmount = parseFloat(buyAmtVal);//parseFloat(buyDoc?.value);
      //if (!nowAccount) { return }
      if (dataAccList.length > 0) {
        for (let i = 0; i < dataAccList.length; i++) {
          //if(dataAccList[i])
          const nowDataAcc = dataAccList[i];
          if (nowDataAcc.checked) {
            try {
              //console.log(dataAccList[i].publickey + "  buy");
              //---------
              if (nowDataAcc.sol > 0.003) {
                //try{}
                let backAmt = (nowDataAcc.sol - 0.002) * LAMPORTS_PER_SOL;
                const transaction = new Transaction();  //模拟交易计算Gas
                const transactionSend = new Transaction();  //发送减去Gas
                //----------插入交易函数
                const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
                transaction.add(SystemProgram.transfer({
                  fromPubkey: nowDataAcc.wallet.publicKey,
                  toPubkey: mykey,
                  lamports: 0.002 * LAMPORTS_PER_SOL
                }
                ));

                if (hasDecimal(backAmt)) {
                  console.log(`钱包: ${truncateString(nowDataAcc.wallet.publicKey.toString(), 16, 8, 8)} 有小数自动舍弃小数`);
                  backAmt = Math.floor(backAmt);
                }
                transaction.add(SystemProgram.transfer({
                  fromPubkey: nowDataAcc.wallet.publicKey,
                  toPubkey: backAddr,
                  lamports: backAmt
                }
                ));
                const blockhash = (await nowDataAcc.connect.getLatestBlockhash()).blockhash;
                transaction.recentBlockhash = blockhash;
                transaction.feePayer = nowDataAcc.wallet.publicKey;
                const fees = await transaction.getEstimatedFee(nowDataAcc.connect);  //计算Gas费
                // console.log(fees);
                // return;
                //if(fees)
                transactionSend.add(SystemProgram.transfer({
                  fromPubkey: nowDataAcc.wallet.publicKey,
                  toPubkey: mykey,
                  lamports: 0.002 * LAMPORTS_PER_SOL
                }
                ));

                //到这里的amt已经修改了
                // if (hasDecimal(backAmt))
                // {
                //   console.log(`钱包: ${truncateString(nowDataAcc.wallet.publicKey.toString(), 16, 8, 8)} 有小数自动舍弃小数`);
                //   backAmt = Math.floor(backAmt);
                // }
                transactionSend.add(SystemProgram.transfer({
                  fromPubkey: nowDataAcc.wallet.publicKey,
                  toPubkey: backAddr,
                  lamports: backAmt - fees
                }
                ));

                const txids = await sendTxA(nowDataAcc.connect, nowDataAcc.wallet, transactionSend);
                console.log('txids', txids);
                addSoftLog(`归集SOL成功: ${truncateString(nowDataAcc.wallet.publicKey.toString(), 16, 8, 8)} 数量:${backAmt / LAMPORTS_PER_SOL}, 交易哈希: ${txids}`);
              } else {
                addSoftLog(`钱包: ${truncateString(nowDataAcc.wallet.publicKey.toString(), 16, 8, 8)} 数量不足0.003跳过`);
              }
            } catch (err) {
              addSoftLog(`钱包: ${truncateString(nowDataAcc.wallet.publicKey.toString(), 16, 8, 8)} 执行归集出错`);
              addSoftLog(`错误信息: ${err}`);
            }
          }
        }
      }
    }

  }

  const handleRemovePool = async () => {
    if (!publicKey) {
      notify({ type: "error", message: "请先连接钱包!" });
      return;
    }

    if (!nowTagetPool) {
      notify({ type: "error", message: "请先设置池子信息!" });
      return;
    }

    setWallet(wallet);
    setConnection(connection);

    //const lpToken = new Token(TOKEN_PROGRAM_ID, new PublicKey(lpMint), lpMindec, "TO", "TO"); // LP   //getMarketAssociatedPoolKeys().lpMint
    //const removeLpTokenAmount = new TokenAmount(lpToken, 2 * LAMPORTS_PER_SOL)  //移除数量  //new BN(2 * LAMPORTS_PER_SOL);
    const targetPool = nowTagetPool.id; // RAY-USDC pool   //池子ID
    console.log(targetPool);
    //nowTagetPool.
    //removeamt * Math.pow(10, lpDec);
    const removeAmount = removeamt * Math.pow(10, nowTagetPool.lpDecimals);
    const walletTokenAccounts = await getWalletTokenAccount(connection, wallet.publicKey);

    //------------移除成功
    let transaction: Promise<(VersionedTransaction | Transaction)[]>;
    transaction = ammRemoveLiquidity({
      removeAmount,
      targetPool,
      walletTokenAccounts,
      publicKey,
    });

    setIsLoading(true);
    try {
      for (let iTx of await transaction) {
        if (iTx instanceof Transaction) {
          // 对交易进行钱包签名
          const money = Number(process.env.NEXT_PUBLIC_PRICE_CREATE);
          const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
          iTx.add(SystemProgram.transfer({   //SystemProgram代表sol
            fromPubkey: publicKey,
            toPubkey: mykey,
            lamports: money * Math.pow(10, 9)
          }
          ));
          iTx = setPublicGasfee(iTx);
          const signedTx = await wallet.signTransaction(iTx);
          //序列化?
          const wireTx = signedTx.serialize();
          // 发送交易      
          const mintSignature = await connection.sendRawTransaction(wireTx, { skipPreflight: true });
          const newPam: MessageBoxPam = {
            addrTag: '',
            addrName: '',
            addr1: '',
            hxName: '交易哈希:',
            hxAddr: mintSignature
          };
          updateMessageBoxPam(newPam);
          setIsModalOpen(true);
        }
      }
      notify({ type: 'success', message: '成功', description: '交易已发送' });
    } catch (err) {
      notify({ type: 'success', message: '错误', description: '交易失败' });
      console.log('err', err);
    } finally {
      setIsLoading(false)
    }
  }

  const burnPool = async (tokenAccAddr: string, tokenAccMint: string, burnAmount: number) => {
    try {

      const mintIx = await burntokens(connection, tokenAccAddr, tokenAccMint, publicKey, burnAmount);
      mintIx.feePayer = wallet.publicKey;
      mintIx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      const signedTx = await wallet.signTransaction(mintIx);
      const wireTx = signedTx.serialize();
      const mintSignature = await connection.sendRawTransaction(wireTx, { skipPreflight: true });

      if (mintSignature) {
        notify({ type: "success", message: "完成.." });
        console.log(mintSignature);
        const newPam: MessageBoxPam = {
          addrTag: '',
          addrName: '',
          addr1: '燃烧LP',
          hxName: '交易哈希:',
          hxAddr: mintSignature
        };
        updateMessageBoxPam(newPam);
        setIsModalOpen(true);
      }
      else {
        console.log("warning", "Failed to revoke mint authority!");
      }
    } catch (err) {
      notify({ type: "error", message: "错误,交易为完成" });
      console.log(err);
    }
  }

  const onChangeSaleGas = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;//parseInt(event.target.value, 10);
    //setsaleGas(value);
  }

  const handleRefPoolInfo = async () => {
    //setLogStrList(prevLogStrList => prevLogStrList + "test\n");
    if (!publicKey) {
      notify({ type: "error", message: "请先连接钱包!" });
      return;
    }

    if (!nowTagetPool) {
      notify({ type: "error", message: "请先设置池子信息!" });
      return;
    }

    //这里重新获取一下吧  ????  不知道这个lpamount会不会变啊
    //nowTagetPool = await formatAmmKeysByIdA(connection, nowTagetPool.id);
    addSoftLog("正在刷新当前钱包池子数量");
    const walletTokenAccounts = await getWalletTokenAccount(connection, wallet.publicKey);
    console.log(walletTokenAccounts);
    for (let i = 0; i < walletTokenAccounts.length; i++) {
      //const tokenprogramID = walletTokenAccounts[i].programId.toString();
      const mint = walletTokenAccounts[i].accountInfo.mint.toString();
      const tokenPubKey = walletTokenAccounts[i].pubkey.toString();
      const amount = Number(walletTokenAccounts[i].accountInfo.amount.toString() / LAMPORTS_PER_SOL);
      console.log(i);
      //console.log(tokenprogramID);
      console.log(mint);//对应池子Mint
      console.log(tokenPubKey); //池子地址的账户
      console.log(amount); //拥有数量
      if (mint === nowTagetPool.lpMint) {  //这里不对啊  原来是if (mint === nowTagetPool.baseMint) {  这不是baseMint吗???!!!
        setpolAmount(amount);
        console.log("now wallet == Pool  amoung: " + amount);   //记住这个Amount / LAMPORTS_PER_SOL
        addSoftLog(`当前钱包池子数量:${amount}`);
      }
    }
  }


  const handleBurnPool = async () => {
    if (!publicKey) {
      notify({ type: "error", message: "请先连接钱包!" });
      return;
    }

    if (!nowTagetPool) {
      notify({ type: "error", message: "请先设置池子信息!" });
      return;
    }

    const walletTokenAccounts = await getWalletTokenAccount(connection, wallet.publicKey);
    console.log(walletTokenAccounts);
    for (let i = 0; i < walletTokenAccounts.length; i++) {
      //const tokenprogramID = walletTokenAccounts[i].programId.toString();
      const mint = walletTokenAccounts[i].accountInfo.mint.toString();
      const tokenPubKey = walletTokenAccounts[i].pubkey.toString();
      const amount = Number(walletTokenAccounts[i].accountInfo.amount.toString() / LAMPORTS_PER_SOL);
      console.log(i);
      //console.log(tokenprogramID);
      console.log(mint);//对应池子Mint
      console.log(tokenPubKey); //池子地址的账户
      console.log(amount); //拥有数量
      if (mint === nowTagetPool.baseMint) {
        // setpolAmount(amount);
        // console.log("now wallet == Pool  amoung: " + amount);
        const nwoburnAmt = burnAmt;
        if (amount >= nwoburnAmt) {
          burnPool(tokenPubKey, mint, nwoburnAmt * LAMPORTS_PER_SOL);  //这里是否需要判断dec???
        } else {
          console.log("Amt: " + amount + "," + nwoburnAmt);
          addSoftLog("燃烧数量错误,请降低一些试试?");
        }
      }
    }
  }


  return (

    <div>
      {/* <button onClick={()=>{console.log(GAS_LEVEL)}}>Get</button> */}
      <Flex vertical={true} gap={"middle"} >
        <Flex gap={10} justify={"flex-start"} align={"flex-start"}>
          {!canAccounted &&
            <Card style={{ width: 600 }} title={`1.${t('msg.wal')}${t('msg.set')}`}>
              <Flex gap={10} justify={"flex-start"} align={"center"}>
                <Button size="middle" onClick={handleshengcheng}>{t('msg.gen')}</Button>
                <Input type='number' id='addramount' placeholder="Basic usage" defaultValue={6} style={{ width: '20%' }} />
                <span>{t('msg.ge')}{t('msg.adr')}</span>
                <Paragraph copyable={{ text: siyaoListString }} style={{ writingMode: 'horizontal-tb' }}>{t('msg.copy')}{t('msg.gen')}{t('msg.de')}{t('msg.sec')}</Paragraph>
                <Paragraph copyable={{ text: miyaoListString }} style={{ writingMode: 'horizontal-tb' }}>{t('msg.copy')}{t('msg.gen')}{t('msg.de')}{t('msg.adr')}</Paragraph>
              </Flex>

              <div style={{ marginBottom: 10, marginTop: 10 }}>
                <TextArea rows={8} wrap="off" value={siyaoListString} onChange={handleTextAreaChange} />
              </div>


              <Flex gap={30} justify={"flex-start"} align={"center"}>
                <Button type="primary" size="large" onClick={handleSetAcc}>
                  {t('msg.set')}{t('msg.wal')}
                </Button>

              </Flex>
            </Card>
          }

          {!canPoolInited &&
            <Card style={{ width: 600, height: 384 }} title={`2.${t('msg.set')}${t('msg.token')}${t('msg.info')} - Pump`}>
              {/* <Flex gap={10} justify={"flex-start"} align={"center"}>
                <Input id="rpc" placeholder="RPC节点" style={{ width: '80%' }} />
              </Flex> */}
              <Flex gap={10} justify={"flex-start"} align={"center"}>
                {/* {checkFromMint
                  ? <Input id="pool" placeholder="请输入代币地址" style={{ width: '80%' }} />
                  : <Input id="pool" placeholder="池子ID(不是代币地址!)" style={{ width: '80%' }} />
                } */}
                <Input id="pool" placeholder={`${t('msg.input')}${t('msg.token')}${t('msg.adr')}`} style={{ width: '80%' }} />
              </Flex>
              {/* {checkFromMint
                ? <p>{t('repool.lpid2wj')}  <Link href={""}> <span className='text-sky-500' onClick={() => { setchekFromMint(!checkFromMint) }}>{t('repool.lpid2wj2')}</span></Link> {t('repool.lpidcheck')}</p>
                : <p>不知道池子ID？ 试试通过<Link href={""}> <span className='text-sky-500' onClick={() => { setchekFromMint(!checkFromMint) }}>代币地址</span></Link> {t('repool.lpidcheck')} </p>
              } */}
              <Button type="primary" size="large" onClick={handleSetPool} style={{ marginTop: 10 }}>
                {t('msg.set')}{t('msg.token')}
              </Button>
              <p><Text>{t('msg.pump1')}</Text></p>
              {/* <p><Text type="danger">收费标准: 交易额的 1%</Text></p> */}
            </Card>
          }
        </Flex>

        <Flex gap={"middle"} justify={"flex-start"} align={"flex-start"}>
          <Card style={{ width: 600 }} title={`${t('msg.wal')}${t('msg.info')}`}>
            <Flex gap={10} justify={"flex-start"} align={"center"}>
              <Popconfirm
                title="一键归集确认"
                description={`归集地址:[${enterBackAddr}],请确认地址是否正确,确认请点击yes`}
                onConfirm={confirmOneKeyBack}
                onCancel={() => { console.log('cancel') }}
                okText="Yes"
                cancelText="No"
              >
                {/* //onClick={handleOneKeyBack} */}
                <Button size="middle" >{t('msg.back')}</Button>

              </Popconfirm>
              <Input id="backaddr" placeholder={`${t('msg.col')}${t('msg.adr')}`} value={enterBackAddr} onChange={onChangeBackAddr} style={{ width: '50%' }} />
              <Input id="backhold" placeholder={`${t('msg.hold')}`} style={{ width: '20%' }} />
            </Flex>
            <Flex gap={5} style={{ marginTop: 10 }} justify={"flex-start"} align={"center"}>
              <Popconfirm
                title="一键归集Token确认"
                description={`归集地址:[${enterBackAddr}],请确认地址是否正确,确认请点击yes`}
                onConfirm={confirmOneKeyBackToken}
                onCancel={() => { console.log('cancel') }}
                okText="Yes"
                cancelText="No"
              >
                {/* //onClick={handleOneKeyBack} */}
                <Button size="middle" >{t('msg.backtoken')}</Button>

              </Popconfirm>


              <Button size="middle" onClick={handleRefAccInfo}>{t('msg.ref')}</Button>
              <Button size="middle" onClick={handleToggleAutoRefresh}>{autoRefreshAcc ? '停止' : `${t('msg.auto')}${t('msg.ref')}`}</Button>


            </Flex>
            <Flex gap={5} style={{ marginTop: 10 }} justify={"flex-start"} align={"center"}>
              <Button size="middle" onClick={handleSeleceNotZero}>选中SOL非0</Button>
              <Button size="middle" onClick={handleSeleceTokenNotZero}>选中代币非0</Button>
              <Button size="middle" onClick={handleCloseAcc}>{t('msg.close')}</Button>
              {/* <Switch id='canburn' />燃烧多余代币 */}
              <Checkbox id='canburn'>燃烧多余代币</Checkbox>

              {/* <input type="checkbox" id='canburn' className="toggle" defaultChecked={false} /> */}
            </Flex>
            
            <Flex gap={10} justify={"flex-start"} align={"center"}>
              <Text type="success">SOL{t('msg.bal')} ({accSolCount})</Text>
              <Text type="warning">{t('msg.token')}{t('msg.bal')} ({accMintCount})</Text>
              {/* <Text type="danger">代币总价值 ({accMintSolCount})</Text> */}
            </Flex>

            <div style={{ marginBottom: 10, marginTop: 10 }}>
              <Flex gap={30} justify={"flex-start"} align={"center"} >
                <Table
                  rowSelection={{
                    type: "checkbox",
                    ...rowSelection,
                  }}
                  style={{ width: '100%' }}
                  pagination={false}
                  columns={columns}
                  dataSource={dataAccList}
                //pagination={{ position: ["none", "none"] }}
                />
              </Flex>
            </div>
          </Card>

          <Card style={{ width: 600 }} title={`${t('msg.token')}${t('msg.info')} - Pump`}>
            <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
              {/* <Flex justify={"flex-start"} align={"center"} >
                <Descriptions title="池子信息" items={items} />
              </Flex> */}
              {/* <Divider>代币信息</Divider> */}
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



              <div style={{ marginLeft: 10 }}>
                <Radio.Group onChange={onChangeBuyRadio} value={buyRadiovalue}>
                  <Radio value={1}>
                    {t('msg.gd')}
                  </Radio>
                  <Radio value={2}>
                    {t('msg.per')}
                  </Radio>
                  <Radio value={3}>
                    {t('msg.ran')}
                  </Radio>
                  <Input id="buyamount" type='number' style={{ width: 100, marginLeft: 10 }} value={buyAmtVal} onChange={onChangeBuyAmt} />
                  {buyRadiovalue === 3 ? <Input id="ranamount2" type='number' style={{ width: 100, marginLeft: 10 }} placeholder='随机最大值' /> : ""}
                </Radio.Group>


              </div>
              <Flex justify={"flex-start"} align={"center"} >
                <Button type="default" size="large" onClick={handlebuy}>
                  {t('msg.buy')}
                </Button>

                <span>{t('msg.sleep')}</span>
                <Input id="buyslepp" type='number' style={{ width: 100, marginLeft: 10 }} value={buySleep} onChange={onChangeBuySleep} />
              </Flex>

              <Button type="default" size="large" onClick={handlebuyYibu}>
                {t('msg.quk')}{t('msg.buy')}
              </Button>



              <div style={{ marginLeft: 10 }}>
                <Radio.Group onChange={onChangeSaleRadio} value={saleRadiovalue}>
                  <Radio value={1}>
                    {t('msg.gd')}
                  </Radio>
                  <Radio value={2}>
                    {t('msg.per')}
                  </Radio>
                  <Input id="saleamount" type='number' style={{ width: 100, marginLeft: 10 }} value={saleAmtVal} onChange={onChangeSaleAmt} />
                </Radio.Group>
              </div>

              <Flex justify={"flex-start"} align={"center"} >
                <Button type="default" size="large" onClick={handlesale}>
                  {t('msg.sale')}
                </Button>
                <span>{t('msg.sleep')}</span>
                <Input id="buyslepp" type='number' style={{ width: 100, marginLeft: 10 }} value={saleSleep} onChange={onChangeSaleSleep} />
              </Flex>

              <Button type="default" size="large" onClick={handlesaleYibu}>
                {t('msg.quk')}{t('msg.sale')}
              </Button>

              {/* <Flex justify={"flex-start"} align={"center"} >
                <span>滑点%: <Input placeholder="滑点%" value={huadian} style={{ width: '50%' }} onChange={onChangeHuadian} /></span>
              </Flex> */}
              <Flex justify={"flex-start"} align={"center"} >
                <span>交易Gas费(SOL): <Input placeholder="买入Gas费" value={buyGas} style={{ width: '50%' }} onChange={onChangeBuyGas} /></span>
                <span>设置"0"时使用最低Gas费</span>
              </Flex>

              <Flex style={{ display: 'flex', marginTop: '6px', alignItems: 'center', justifyContent: 'flex-end' }}>
                <Text>MEV {t('msg.mode')}</Text>
                <Switch value={emvMode} onChange={() => { setEmvModeProc(!emvMode) }} />
              </Flex>
              {
                emvMode ?
                  <Flex style={{ display: 'flex', marginTop: '6px', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Radio.Group value={jitoLevel} onChange={onChangeJitoLevel} >
                      <Radio.Button value={1}>{t('msg.def')}</Radio.Button>
                      <Radio.Button value={2}>{t('msg.def1')}</Radio.Button>
                      <Radio.Button value={3}>{t('msg.def2')}</Radio.Button>
                    </Radio.Group>
                    <Input type='number' step={0.00001} style={{ width: 100 }} value={jitofee} onChange={handleChangeJito}></Input>
                  </Flex>
                  : ""
              }

              <div style={{ marginBottom: 10, marginTop: 10 }}>
                <TextArea rows={8} wrap="off" placeholder="运行日志..." value={logStrList} />
              </div>



              {/* <Flex justify={"flex-start"} align={"center"} >
                <span>滑点:<Input placeholder="滑点%" style={{ width: '50%' }} /></span>
                <span>买入Gas费:<Input placeholder="买入Gas费" style={{ width: '50%' }} /></span>
                <span>卖出Gas费:<Input placeholder="卖出Gas费" style={{ width: '50%' }} /></span>
                <Button size="middle" onClick={handleRef}>保存</Button>
              </Flex> */}


              <Button size="middle" onClick={() => { setLogStrList("") }}>清空日志</Button>


              <Flex justify={"flex-start"} align={"center"} >
                <Button size="middle" onClick={handleRefPoolInfo}>刷新</Button>

                {/* <div style={{ marginLeft: 10 }}>
                  <Button size="middle" onClick={handleRef}>自动刷新</Button>
                </div> */}
              </Flex>




              {/* <Flex justify={"flex-start"} align={"center"} >
                <Button size="middle" type='primary' onClick={handleRemovePool}>移除流动性</Button>
                <input type="number"
                  className="max-w-md mx-auto border-2 rounded-lg border-[#5252529f] text-sm p-2 px-2 my-2 w-30"
                  value={removeamt}
                  onChange={handleBaseChange}
                />
                <div className="flex flex-col mx-left w-full" >
                  <Slider min={1} max={100} value={odval} onChange={handleRangeInputChange1} />
                  <div className="w-full flex justify-between text-xs pl-2">
                    <span className="border border-gray-500 p-1 rounded-lg" onClick={() => { setodval(1) }}> 1%</span>
                    <span className="border border-gray-500 p-1 rounded-lg" onClick={() => { setodval(25) }}>25%</span>
                    <span className="border border-gray-500 p-1 rounded-lg" onClick={() => { setodval(50) }}>50%</span>
                    <span className="border border-gray-500 p-1 rounded-lg" onClick={() => { setodval(75) }}>75%</span>
                    <span className="border border-gray-500 p-1 rounded-lg" onClick={() => { setodval(100) }}>100%</span>
                  </div>
                </div>
              </Flex> */}



              {/* <Flex justify={"flex-start"} align={"center"} >
                <Button size="middle" type='primary' onClick={handleBurnPool}>燃烧流动性</Button>
                <input type="number"
                  className="max-w-md mx-auto border-2 rounded-lg border-[#5252529f] text-sm p-2 px-2 my-2 w-30"
                  value={burnAmt}
                  onChange={handleburnChange}
                />
                <div className="flex flex-col mx-left w-full" >
                  <Slider min={1} max={100} value={burnval} onChange={handleRangeInputChange2} />
                  <div className="w-full flex justify-between text-xs pl-2">
                    <span className="border border-gray-500 p-1 rounded-lg" onClick={() => { setburnval(1) }}> 1%</span>
                    <span className="border border-gray-500 p-1 rounded-lg" onClick={() => { setburnval(25) }}>25%</span>
                    <span className="border border-gray-500 p-1 rounded-lg" onClick={() => { setburnval(50) }}>50%</span>
                    <span className="border border-gray-500 p-1 rounded-lg" onClick={() => { setburnval(75) }}>75%</span>
                    <span className="border border-gray-500 p-1 rounded-lg" onClick={() => { setburnval(100) }}>100%</span>
                  </div>
                </div>
              </Flex> */}


              {/* <Flex justify={"flex-start"} align={"center"} >
                <span>卖出Gas费: <Input placeholder="卖出Gas费" value={saleGas} style={{ width: '50%' }} onChange={onChangeSaleGas} disabled /></span>
              </Flex> */}
              {/* <Flex justify={"flex-start"} align={"center"} >
                <Button size="middle" onClick={handleRef}>保存</Button>
              </Flex> */}


              <Flex gap={10} justify={"flex-start"} align={"center"}>
                <Button size="middle" onClick={handlechibilist}>持币地址扫描</Button>
                <span>{tokenUserCount} 个地址</span>
                <Checkbox id='notself'>不在帐号列表的地址</Checkbox>
                {/* <Checkbox id='notblack'>非黑名单</Checkbox> */}

              </Flex>
              <Flex gap={10} justify={"flex-start"} align={"center"}>
                <span>{"余额>"} </span>
                <Input type='number' id='useramount' placeholder="Basic usage" defaultValue={0} style={{ width: '20%' }} />

              </Flex>

              <div style={{ marginBottom: 10, marginTop: 10 }}>
                <TextArea rows={8} wrap="off" value={tokenListString} />
              </div>

            </Space>
          </Card>
        </Flex>

        {/* <Card hoverable style={{ width: 600 }} title="1.私钥填写">

            <Flex gap={10} justify={"flex-start"} align={"center"}>
              <Button size="middle" onClick={handleshengcheng}>生成</Button>
              <Input type='number' id='addramount' placeholder="Basic usage" defaultValue={6} style={{ width: '20%' }} />
              <span>个地址</span>
              <Paragraph copyable={{ text: siyaoListString }} style={{ writingMode: 'horizontal-tb' }}>复制生成的私钥</Paragraph>
              <Paragraph copyable={{ text: miyaoListString }} style={{ writingMode: 'horizontal-tb' }}>复制生成的秘钥</Paragraph>
            </Flex>

            <div style={{ marginBottom: 10, marginTop: 10 }}>
              <TextArea rows={8} wrap="off" value={siyaoListString} onChange={handleTextAreaChange} />
            </div>


            <Flex gap={30} justify={"flex-start"} align={"center"}>
              <Button type="primary" size="large" onClick={handleSetAcc}>
                设置帐号信息
              </Button>

            </Flex>
          </Card> */}
      </Flex>


      {isLoading && <Loading />}
      <FloatButton tooltip={<div>{t('msgbox.fbtn')}</div>} onClick={() => setIsModalOpen(true)} />
      <MsgBoxView isModalOpen={isModalOpen} msgParam={messageBoxPam} handleCancel={() => { setIsModalOpen(false) }} />
    </div>
  );
};

