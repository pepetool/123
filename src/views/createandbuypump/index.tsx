// Next, React
import { FC, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

// Wallet
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

// Components
import { CreateParam } from '../../components/CreateParam';

import { useTranslation } from 'next-i18next'

import type { GetStaticProps } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { cn } from 'utils';
import { GAS_LEVEL } from 'utils/config';
import Loading from 'components/Loading';
import { Button, Card, Collapse, CollapseProps, Flex, Input, Radio, RadioChangeEvent, Table, TableColumnsType, Tooltip } from 'antd';
import { notify } from 'utils/notifications';
import bs58 from 'bs58';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { openAsBlob } from "fs";
import { publicKey } from '@raydium-io/raydium-sdk';
import { AnchorProvider } from '@coral-xyz/anchor';
import { Swap_Buy_pump, Swap_Sale_pump, calculateWithSlippageBuy, getBondingCurvePDA, getBuyInstructions, getCreateInstructions, getInitialBuyPrice, getPumpprice, setPumpPirce, setPumpUnit } from 'utils/raydium/pumpFunction';
import { getRandomTipAccount } from 'utils/jito/config';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { sendBundle } from 'utils/jito/jito';
import { getmyTokenUri } from 'utils/web3';
import { truncateString } from 'utils/gettoken';

// Store
//import useUserSOLBalanceStore from '../../stores/useUserSOLBalanceStore';
interface DataType {
  key: React.Key;
  checked?: boolean;
  publickey: string;
  wallet?: Keypair;
  balance?: number;
  buyToken?: number;
  buySol?: number;
}

let wallet1, wallet2, wallet3, wallet4;
let m_CurvePDA: PublicKey;
let m_assBundingCurve: PublicKey;
let m_Mint: PublicKey;



export const CreateAndBuyPumpView: FC = ({ }) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { t } = useTranslation('common');
  const [isShowXT, setisShowXT] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [jitoLevel, setjitoLevel] = useState(1);
  const jitoLevelRef = useRef(jitoLevel);
  const adrstr = `${t('msg.wal')}${t('msg.adr')}`;
  const [wallet1Key, setWallet1Key] = useState(adrstr);
  const [wallet1Balance, setWallet1Balance] = useState(0);
  const [wallet1Buy, setWallet1Buy] = useState(0);
  const [wallet1BuyToken, setWallet1BuyToken] = useState(0);
  const [wallet2Key, setWallet2Key] = useState(adrstr);
  const [wallet2Balance, setWallet2Balance] = useState(0);
  const [wallet2Buy, setWallet2Buy] = useState(0);
  const [wallet2BuyToken, setWallet2BuyToken] = useState(0);
  const [wallet3Key, setWallet3Key] = useState(adrstr);
  const [wallet3Balance, setWallet3Balance] = useState(0);
  const [wallet3Buy, setWallet3Buy] = useState(0);
  const [wallet3BuyToken, setWallet3BuyToken] = useState(0);
  const [wallet4Key, setWallet4Key] = useState(adrstr);
  const [wallet4Balance, setWallet4Balance] = useState(0);
  const [wallet4Buy, setWallet4Buy] = useState(0);
  const [wallet4BuyToken, setWallet4BuyToken] = useState(0);
  const [tokenAddress, setTokenAddress] = useState<string | null>(null);
  const [siyaoListString, setSiyaoListString] = useState('');
  const [dataAccList, setDataAccList] = useState<DataType[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]); // 初始状态为空


  const { TextArea } = Input;

  const handleTextAreaChange = (event) => {
    const newValue = event.target.value;
    setSiyaoListString(newValue);
  };

  function getRandomNumber(min: number, max: number, decimalPlaces: number = 0): number {
    const random = Math.random() * (max - min) + min;
    return parseFloat(random.toFixed(decimalPlaces));
  }

  const handleAutoInputByBalan = () => {
    //
    // const buySolDoc = document.getElementById('ransol') as HTMLInputElement | null;
    // const buyTokenDoc = document.getElementById('rantoken1') as HTMLInputElement | null;
    // const buyToken2Doc = document.getElementById('rantoken2') as HTMLInputElement | null;
    // const ranSol = Number(buySolDoc?.value);
    // const ranToken = Number(buyTokenDoc?.value);
    // const ranToken2 = Number(buyToken2Doc?.value);

    if (dataAccList.length > 0) {
      for (let i = 0; i < dataAccList.length; i++) {
        const nowData = dataAccList[i];
        //nowData.buySol
        //const buySol = ranSol;
        if (nowData.balance > 0) {
          const min = ((nowData.balance - 0.1) * 0.8);
          const max = (nowData.balance - 0.1);
          const buyToken = getRandomNumber(min, max, 2);
          const updatedData = [...dataAccList];
          updatedData[i].buySol = Number(buyToken);
          //updatedData[i].buyToken = Number(buyToken);
          setDataAccList(updatedData);
        }
      }
    }
  }

  const handleAutoInput = () => {
    //
    const buySolDoc = document.getElementById('ransol') as HTMLInputElement | null;
    const buyTokenDoc = document.getElementById('rantoken1') as HTMLInputElement | null;
    const buyToken2Doc = document.getElementById('rantoken2') as HTMLInputElement | null;
    const ranSol = Number(buySolDoc?.value);
    const ranToken = Number(buyTokenDoc?.value);
    const ranToken2 = Number(buyToken2Doc?.value);

    if (dataAccList.length > 0) {
      for (let i = 0; i < dataAccList.length; i++) {
        //const nowData = dataAccList[i];
        //nowData.buySol
        //const buySol = ranSol;
        const buyToken = getRandomNumber(ranToken, ranToken2, ranSol);
        const updatedData = [...dataAccList];
        updatedData[i].buySol = Number(buyToken);
        //updatedData[i].buyToken = Number(buyToken);
        setDataAccList(updatedData);
      }
    }
  }

  const handleGetBalance = async () => {
    console.log(dataAccList.length);
    setIsLoading(true);
    try {
      for (let i = 0; i < dataAccList.length; i++) {
        const nowData = dataAccList[i];
        const balan = await connection.getBalance(nowData.wallet.publicKey) / LAMPORTS_PER_SOL;
        const updatedData = [...dataAccList];
        updatedData[i].balance = balan;
        setDataAccList(updatedData);
      }
    } finally {
      setIsLoading(false);
    }
  }

  const handleChangeInfo = () => {
    const buySolDoc = document.getElementById('buysol') as HTMLInputElement | null;
    // const buyTokenDoc = document.getElementById('buytoken') as HTMLInputElement | null;
    const buySol = buySolDoc?.value;
    // const buyToken = buyTokenDoc?.value;
    if (buySol === "") {//|| buyToken === "") {
      notify({ type: "error", message: "错误", description: "请输入修改的买入SOL" });
      return;
    }
    if (selectedRowKeys.length <= 0) {
      notify({ type: "error", message: "错误", description: "请选中要修改的钱包" });
      return;
    }
    if (dataAccList.length > 0) {
      for (let i = 0; i < dataAccList.length; i++) {
        const nowData = dataAccList[i];
        if (nowData.checked) {
          //nowData.buySol
          const updatedData = [...dataAccList];
          updatedData[i].buySol = Number(buySol);
          //updatedData[i].buyToken = Number(buyToken);
          setDataAccList(updatedData);
        }
      }
    }
  }

  const columns: TableColumnsType<DataType> = [
    {
      title: `${t('msg.wal')}`,
      dataIndex: 'publickey',
      render: (text: string) => <a>{text}</a>,
    },
    {
      title: `SOL${t('msg.bal')}`,
      dataIndex: 'balance',
    },
    {
      title: `${t('msg.buy')}${t('msg.token')}`,
      dataIndex: 'buyToken',
    },
    {
      title: `${t('msg.buy')}Sol`,
      dataIndex: 'buySol',
    },
  ];

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
    },
  };

  const handleSetAcc = async () => {
    //获取数据
    const lines = siyaoListString.split('\n').filter(line => line.trim() !== '');
    const tranList = lines.map(line => {
      if (line.length <= 95 && line.length >= 85) {
        return line;
      } else {
        return null; // 如果地址长度不是 45，则返回 null
      }
    }).filter(obj => obj !== null);

    if (lines.length > 16) {
      notify({ type: "error", message: "错误", description: "最大支持设置16个地址" });
      return;
    }
    setIsLoading(true);
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
            balance: 0,
            buySol: 0,
            buyToken: 0,
            wallet: Keypair.fromSecretKey(Buffer.from(bs58.decode(uniqueLines[i]))),
          };
          newData.push(newDataItem);
        }
        return [...prevData, ...newData];
      });
      notify({ type: "success", message: "提示", description: "设置成功" });

    } catch (err) {
      console.log(err);
      notify({ type: "error", message: "设置钱包错误", description: "检查私钥地址并刷新页面重试" });

    } finally {
      setIsLoading(false);
    }
  }


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

  const handleSetWallet1BuyToken = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;//parseInt(event.target.value, 10);
    //console.log(value);
    if (value !== "") {
      const buy = parseFloat(value);
      setWallet1BuyToken(buy);
    }
  }

  const handleSetWallet2BuyToken = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;//parseInt(event.target.value, 10);
    //console.log(value);
    if (value !== "") {
      const buy = parseFloat(value);
      setWallet2BuyToken(buy);
    }
  }

  const handleSetWallet3BuyToken = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;//parseInt(event.target.value, 10);
    //console.log(value);
    if (value !== "") {
      const buy = parseFloat(value);
      setWallet3BuyToken(buy);
    }
  }

  const handleSetWallet4BuyToken = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;//parseInt(event.target.value, 10);
    //console.log(value);
    if (value !== "") {
      const buy = parseFloat(value);
      setWallet4BuyToken(buy);
    }
  }

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

  const handleSetWallet4 = async (event: React.ChangeEvent<HTMLInputElement>) => {
    //
    const value = event.target.value;//parseInt(event.target.value, 10);
    //console.log(value);
    if (value !== "") {
      try {
        wallet4 = Keypair.fromSecretKey(bs58.decode(value));
        setWallet4Key(wallet4.publicKey.toString());
        try {
          const sol = await connection.getBalance(wallet4.publicKey, 'confirmed');
          console.log("钱包4SOL:", sol);
          setWallet4Balance(sol / LAMPORTS_PER_SOL);
        } catch (err) {
          console.log(err);
          //setWallet1Key("私钥填写错误");
          notify({ type: "error", message: "错误", description: "获取余额失败,请尝试重新填写私钥或手动确认" })
          setWallet4Balance(0);
        }
      } catch (err) {
        console.log(err);
        setWallet4Key("私钥填写错误");
      }
    } else {
      setWallet4Key("钱包地址");
    }
  }

  const handleSetWallet4Buy = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;//parseInt(event.target.value, 10);
    //console.log(value);
    if (value !== "") {
      const buy = parseFloat(value);
      setWallet4Buy(buy);
    }
  }


  const items: CollapseProps['items'] = [
    {
      key: '1',
      label: wallet1Buy === 0 ? `${t('msg.wal')} 1` : `${t('msg.wal')} 1 - ${t('msg.buy')} ${wallet1Buy}`,
      children:
        <div className='space-y-2'>
          <label className="input input-bordered flex bg-stone-100 border-slate-300 items-center gap-2">
            <input type="text" className="grow bg-stone-100" placeholder={`${t('msg.wal')}${t('msg.sec')}`} onChange={handleSetWallet1} />
            <span className="badge badge-info">{t('msg.pas')}</span>
          </label>
          <label className="input input-bordered flex bg-stone-100 border-slate-300 items-center gap-2">
            <input type="text" className="grow bg-stone-100" value={wallet1Key} />
            <span className="badge ">{t('msg.bal')} : {wallet1Balance} SOL</span>
          </label>
          <label className="input input-bordered flex bg-stone-100 border-slate-300 items-center gap-2">
            <input type="text" className="grow bg-stone-100" placeholder={`${t('msg.buy')}${t('msg.amt')}`} onChange={handleSetWallet1BuyToken} />
            <span className="badge ">Token</span>
            <input type="text" className="grow bg-stone-100" placeholder={`${t('msg.buy')}${t('msg.amt')}`} onChange={handleSetWallet1Buy} />
            <span className="badge ">SOL</span>
          </label>
        </div>,
    },
    {
      key: '2',
      label: wallet2Buy === 0 ? `${t('msg.wal')} 2` : `${t('msg.wal')} 2 - ${t('msg.buy')} ${wallet2Buy}`,
      children:
        <div className='space-y-2'>
          <label className="input input-bordered flex bg-stone-100 border-slate-300 items-center gap-2">
            <input type="text" className="grow bg-stone-100" placeholder={`${t('msg.wal')}${t('msg.sec')}`} onChange={handleSetWallet2} />
            <span className="badge badge-info">{t('msg.pas')}</span>
          </label>
          <label className="input input-bordered flex bg-stone-100 border-slate-300 items-center gap-2">
            <input type="text" className="grow bg-stone-100" value={wallet2Key} />
            <span className="badge ">{t('msg.bal')} : {wallet2Balance} SOL</span>
          </label>
          <label className="input input-bordered flex bg-stone-100 border-slate-300 items-center gap-2">
            <input type="text" className="grow bg-stone-100" placeholder={`${t('msg.buy')}${t('msg.amt')}`} onChange={handleSetWallet2BuyToken} />
            <span className="badge ">Token</span>
            <input type="text" className="grow bg-stone-100" placeholder={`${t('msg.buy')}${t('msg.amt')}`} onChange={handleSetWallet2Buy} />
            <span className="badge ">SOL</span>
          </label>
        </div>,
    },
    {
      key: '3',
      label: wallet3Buy === 0 ? `${t('msg.wal')} 3` : `${t('msg.wal')} 3 - ${t('msg.buy')} ${wallet3Buy}`,
      children:
        <div className='space-y-2'>
          <label className="input input-bordered flex bg-stone-100 border-slate-300 items-center gap-2">
            <input type="text" className="grow bg-stone-100" placeholder={`${t('msg.wal')}${t('msg.sec')}`} onChange={handleSetWallet3} />
            <span className="badge badge-info">{t('msg.pas')}</span>
          </label>
          <label className="input input-bordered flex bg-stone-100 border-slate-300 items-center gap-2">
            <input type="text" className="grow bg-stone-100" value={wallet3Key} />
            <span className="badge ">{t('msg.bal')} : {wallet3Balance} SOL</span>
          </label>
          <label className="input input-bordered flex bg-stone-100 border-slate-300 items-center gap-2">
            <input type="text" className="grow bg-stone-100" placeholder={`${t('msg.buy')}${t('msg.amt')}`} onChange={handleSetWallet3BuyToken} />
            <span className="badge ">Token</span>
            <input type="text" className="grow bg-stone-100" placeholder={`${t('msg.buy')}${t('msg.amt')}`} onChange={handleSetWallet3Buy} />
            <span className="badge ">SOL</span>
          </label>
        </div>,
    },
    {
      key: '4',
      label: wallet4Buy === 0 ? `${t('msg.wal')} 4` : `${t('msg.wal')} 4 - ${t('msg.buy')} ${wallet4Buy}`,
      children:
        <div className='space-y-2'>
          <label className="input input-bordered flex bg-stone-100 border-slate-300 items-center gap-2">
            <input type="text" className="grow bg-stone-100" placeholder={`${t('msg.wal')}${t('msg.sec')}`} onChange={handleSetWallet4} />
            <span className="badge badge-info">{t('msg.pas')}</span>
          </label>
          <label className="input input-bordered flex bg-stone-100 border-slate-300 items-center gap-2">
            <input type="text" className="grow bg-stone-100" value={wallet4Key} />
            <span className="badge ">{t('msg.bal')} : {wallet4Balance} SOL</span>
          </label>
          <label className="input input-bordered flex bg-stone-100 border-slate-300 items-center gap-2">
            <input type="text" className="grow bg-stone-100" placeholder={`${t('msg.buy')}${t('msg.amt')}`} onChange={handleSetWallet4BuyToken} />
            <span className="badge ">Token</span>
            <input type="text" className="grow bg-stone-100" placeholder={`${t('msg.buy')}${t('msg.amt')}`} onChange={handleSetWallet4Buy} />
            <span className="badge ">SOL</span>
          </label>
        </div>,
    },
  ];


  const claname1 = "flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 md:w-[600px]"
  const clanametext = "md:w-1/3 md:text-1xl text-right text-stone-200 mr-2"
  const classinput = "max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] p-2 px-2 my-2 w-80"
  const classtextarea = "max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] p-2 px-2 my-2 w-full h-[150px]"
  //const balance = useUserSOLBalanceStore((s) => s.balance)
  //const { getUserSOLBalance } = useUserSOLBalanceStore()

  // useEffect(() => {
  //   if (wallet.publicKey) {
  //     console.log(wallet.publicKey.toBase58())
  //     getUserSOLBalance(wallet.publicKey, connection)
  //   }
  // }, [wallet.publicKey, connection, getUserSOLBalance])

  const [selectedFile, setSelectedFile] = useState<File | null>(null); // 声明selectedFile的类型为File | null
  const [fileContent, setFileContent] = useState<string | ArrayBuffer | null>(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setFileContent(reader.result);
    };
    reader.readAsText(file);
  };

  const onChangeJitoLevel = (e: RadioChangeEvent) => {
    //setSize(e.target.value);
    const newValue = e.target.value;
    setjitoLevel(newValue);
    jitoLevelRef.current = newValue;
  };

  type CreateTokenMetadata = {
    name: string;
    symbol: string;
    description: string;
    filePath?: string;
    file?: File;
    twitter?: string;
    telegram?: string;
    website?: string;
  };

  async function createTokenMetadata(create: CreateTokenMetadata) {
    let file = create.file;//await openAsBlob(create.filePath);
    let formData = new FormData();
    formData.append("file", file),
      formData.append("name", create.name),
      formData.append("symbol", create.symbol),
      formData.append("description", create.description),
      formData.append("twitter", create.twitter || ""),
      formData.append("telegram", create.telegram || ""),
      formData.append("website", create.website || ""),
      formData.append("showName", "true");
    let request = await fetch("https://pump.fun/api/ipfs", {
      method: "POST",
      body: formData,
    });
    return request.json();
  }

  function checkLocMode() {
    let ret;
    process.env.NEXT_PUBLIC_LOCMODE === "true" ? ret = true : ret = false;
    return ret;
  }

  const handleSaleAll = async () => {

    if (!m_Mint) {
      notify({ type: 'error', message: '错误', description: '尚未创建代币' });
      return;
    }
    async function getSaleiTx(amount, userWallet) {
      const saleAmt = Math.floor(amount * Math.pow(10, 6));
      //console.log(`卖出: ${userWallet.publicKey.toString()}`);
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

    let jitoFee;
    if (jitoLevelRef.current === 1) {
      jitoFee = 0.0005;
    } else if (jitoLevelRef.current === 2) {
      jitoFee = 0.001;
    } else if (jitoLevelRef.current === 3) {
      jitoFee = 0.01;
    }
    setPumpUnit(0);
    setPumpPirce(0);
    //let nowData;
    let bundle = [];
    let TokenCount = 0;  //本次

    let canJitofee = true;
    let TrandSend = new Transaction();
    let iTxCount = 0;
    let signWals = [];
    let latestBlockhash = await connection.getLatestBlockhash();

    for (let i = 0; i < dataAccList.length; i++) {
      const nowData = dataAccList[i];
      if (nowData.buySol > 0) {
        const iTx1 = await getSaleiTx(nowData.buyToken, nowData.wallet);
        if (canJitofee) {
          canJitofee = false;
          const JitoTip = getRandomTipAccount();
          iTx1.add(
            SystemProgram.transfer({
              fromPubkey: nowData.wallet.publicKey,
              toPubkey: JitoTip,
              lamports: jitoFee * LAMPORTS_PER_SOL,
            })
          );
        }
        //const latestBlockhash = await connection.getLatestBlockhash();
        iTx1.feePayer = nowData.wallet.publicKey;
        iTx1.recentBlockhash = latestBlockhash.blockhash;
        iTx1.sign(nowData.wallet);
        const jitoTx = bs58.encode(iTx1.serialize());
        bundle.push(jitoTx);
        if (bundle.length >= 5) {
          const sent = await sendBundle(bundle);
          console.log("绑定包发送成功 id:", sent);
          canJitofee = true;
          bundle = [];
          latestBlockhash = await connection.getLatestBlockhash();
        }

        //TrandSend.add(iTx1);
        //signWals.push(nowData.wallet);
        TokenCount += nowData.buyToken;
        //console.log(`添加: ${nowData.wallet.publicKey.toString()}`);
        // iTxCount += 1;
        // if (iTxCount >= 3) {
        //   iTxCount = 0;
        //   const wal1 = signWals[0];
        //   TrandSend.feePayer = wal1.publicKey;
        //   TrandSend.recentBlockhash = latestBlockhash.blockhash;
        //   for (let j = 0; j < signWals.length; j++) {
        //     const wal = signWals[j];
        //     try {
        //       console.log(`签名: ${wal.publicKey.toString()}`);
        //       TrandSend.partialSign(wal); //部分签名
        //     } catch (err) {
        //       //console.log(`签名错误: `, err);
        //     }
        //   }
        //   signWals = [];
        //   const serializeTx2 = bs58.encode(TrandSend.serialize());
        //   bundle.push(serializeTx2);
        //   console.log(`bundle.push`);
        //   TrandSend = new Transaction();
        //   if (bundle.length >= 5) {
        //     const sent = await sendBundle(bundle);
        //     console.log(sent);
        //     console.log('send');
        //     bundle = [];
        //     canJitofee = true;
        //   }
        // }
      }
    }

    // if (signWals.length > 0) {
    //   iTxCount = 0;
    //   const wal1 = signWals[0];
    //   TrandSend.feePayer = wal1.publicKey;
    //   TrandSend.recentBlockhash = latestBlockhash.blockhash;
    //   for (let j = 0; j < signWals.length; j++) {
    //     const wal = signWals[j];
    //     try {
    //       TrandSend.partialSign(wal); //部分签名
    //     } catch (err) {
    //       //console.log(`签名错误: `, err);
    //     }
    //   }
    //   signWals = [];
    //   const serializeTx2 = bs58.encode(TrandSend.serialize());
    //   bundle.push(serializeTx2);
    //   console.log(`bundle.push`);
    //   TrandSend = new Transaction();
    // }
    if (bundle.length > 0) {
      const sent = await sendBundle(bundle);
      console.log(sent);
      console.log('send');
    }
    notify({ type: 'success', message: '成功', description: `卖出成功,本次卖出数量: ${TokenCount} 发币钱包未卖!` });
    //return;
    // const iTx1 = await getSaleiTx(wallet1BuyToken, wallet1);
    // TokenCount += wallet1BuyToken;
    // let jitoFee;
    // if (jitoLevelRef.current === 1) {
    //   jitoFee = 0.0005;
    // } else if (jitoLevelRef.current === 2) {
    //   jitoFee = 0.001;
    // } else if (jitoLevelRef.current === 3) {
    //   jitoFee = 0.01;
    // }
    // const JitoTip = getRandomTipAccount();

    // iTx1.add(
    //   SystemProgram.transfer({
    //     fromPubkey: wallet1.publicKey,
    //     toPubkey: JitoTip,
    //     lamports: jitoFee * LAMPORTS_PER_SOL,
    //   })
    // );
    // iTx1.feePayer = wallet1.publicKey;
    // iTx1.recentBlockhash = latestBlockhash.blockhash;
    // iTx1.sign(wallet1);
    // const jitoTx1 = bs58.encode(iTx1.serialize());
    // bundle.push(jitoTx1);
    // //----
    // const iTx2 = await getSaleiTx(wallet2BuyToken, wallet2);
    // TokenCount += wallet2BuyToken;
    // iTx2.feePayer = wallet2.publicKey;
    // iTx2.recentBlockhash = latestBlockhash.blockhash;
    // iTx2.sign(wallet2);
    // const jitoTx2 = bs58.encode(iTx2.serialize());
    // bundle.push(jitoTx2);
    // //---3
    // const iTx3 = await getSaleiTx(wallet3BuyToken, wallet3);
    // TokenCount += wallet3BuyToken;
    // iTx3.feePayer = wallet3.publicKey;
    // iTx3.recentBlockhash = latestBlockhash.blockhash;
    // iTx3.sign(wallet3);
    // const jitoTx3 = bs58.encode(iTx3.serialize());
    // bundle.push(jitoTx3);
    // //---4
    // const iTx4 = await getSaleiTx(wallet4BuyToken, wallet4);
    // TokenCount += wallet4BuyToken;
    // iTx4.feePayer = wallet4.publicKey;
    // iTx4.recentBlockhash = latestBlockhash.blockhash;
    // iTx4.sign(wallet4);
    // const jitoTx4 = bs58.encode(iTx4.serialize());
    // bundle.push(jitoTx4);
    //============
    // const sent = await sendBundle(bundle);
    // console.log("绑定包发送成功 id:", sent);
    // notify({ type: 'success', message: '成功', description: `卖出成功,本次卖出数量: ${TokenCount} 发币钱包未卖!` });

  }

  const handleCreate = async () => {
    // setTokenAddress(`https://pump.fun/8QGY7bfMZzovkKvMr5tkG7qvtkAG2FjT6jnFTnJmpump`);
    // return
    if (!wallet.publicKey) {
      notify({ type: 'error', message: '错误', description: '请先连接钱包!' });
      return;
    }
    const tokenname = document.getElementById('tokenname') as HTMLInputElement | null;
    //const tokencount = document.getElementById('tokencount') as HTMLInputElement | null;
    //const tokendec = document.getElementById('tokendec') as HTMLInputElement | null;
    const tokenSymbol = document.getElementById('tokenSymbol') as HTMLInputElement | null;
    const userweb = document.getElementById('userweb') as HTMLInputElement | null;
    const tglink = document.getElementById('tglink') as HTMLInputElement | null;
    const xlink = document.getElementById('xlink') as HTMLInputElement | null;
    const dislink = document.getElementById('dislink') as HTMLInputElement | null;
    const des = document.getElementById('des') as HTMLInputElement | null;
    const walbuy = document.getElementById('walbuy') as HTMLInputElement | null;
    //const tags = document.getElementById('tags') as HTMLInputElement | null;

    // const freeys = document.getElementById('freeys') as HTMLInputElement | null;
    // const minttoken = document.getElementById('freemint') as HTMLInputElement | null;
    // const freeAccount = document.getElementById('freeacc') as HTMLInputElement | null;
    //const isselfupload = document.getElementById('isselfupload') as HTMLInputElement | null;


    // console.log(tokenAddr?.value+","+minttoken?.value+","+freeAccount?.value);
    //const isSelfload = isselfupload.checked;
    const isSelfload = false;
    //const value = tokenname?.value;
    if (tokenname?.value == "") {
      notify({ type: 'error', message: '错误', description: '代币名称不能为空' });
      return;
    }
    if (tokenname?.value.length > 15) {
      notify({ type: 'error', message: '错误', description: '代币名称长度不能大于15' });
      return;
    }
    if (tokenSymbol?.value == "") {
      notify({ type: 'error', message: '错误', description: '代币名称不能为空' });
      return;
    }
    if (tokenSymbol?.value.length > 15) {
      notify({ type: 'error', message: '错误', description: '代币简称长度不能大于8' });
      return;
    }
    // if (isNaN(Number(tokendec?.value))) {
    //   notify({ type: 'error', message: '错误', description: '代币精度请输入一个数字1-10' });
    //   return;
    // }
    // if (isNaN(Number(tokencount?.value))) {
    //   notify({ type: 'error', message: '错误', description: '代币总数必须为数字' });
    //   return;
    // }
    let walBuySol;
    if (walbuy?.value === "" || walbuy?.value === "0") {
      walBuySol = 0;
    } else {
      walBuySol = Number(walbuy?.value);
    }

    if (!selectedFile) {
      notify({ type: 'error', message: '错误', description: '请选择logo文件' });
      return;
    }

    //return;
    const userinput = {
      // decimals: tokendec?.value,
      // supply: tokencount?.value,
      tokenName: tokenname?.value,
      symbol: tokenSymbol?.value,
      //image:  ???还不知道怎么弄
      web: userweb?.value,
      tglink: tglink?.value,
      xlink: xlink?.value,
      dislink: dislink?.value,
      description: des?.value,
      //tags: tags?.value,
      image: "",
    };
    //--------

    if (selectedFile) {
      setIsLoading(true);
      try {
        // let createMetadata: CreateTokenMetadata;
        // createMetadata.name = userinput.tokenName;
        // createMetadata.symbol = userinput.symbol;
        // createMetadata.filePath = fileContent.toString();
        // createMetadata.description = userinput.description;
        // createMetadata.telegram = userinput.tglink;
        // createMetadata.twitter = userinput.xlink;
        // createMetadata.website = userinput.web;
        let createMetadata: CreateTokenMetadata = {
          name: userinput.tokenName,
          symbol: userinput.symbol,
          //filePath: fileContent.toString(),
          file: selectedFile,
          description: userinput.description,
          twitter: userinput.xlink,
          telegram: userinput.tglink,
          website: userinput.web
        };
        // console.log(createMetadata);
        // let tokenMetadata = await createTokenMetadata(createMetadata);
        // console.log(tokenMetadata);
        let wordArray = [];
        let tokenuri;
        try {
          const jsonuri = await getmyTokenUri(selectedFile, userinput.tokenName, userinput.symbol, userinput.description, userinput.web,
            userinput.tglink, userinput.xlink, wordArray);
          //const jsonuri = "https://arweave.net/xteQBNlXnf7LdWd7p8ZYXiKaXXajClAk0ZSfP0jc48s";
          //setIsLoading(false);
          if (jsonuri != "error") {
            tokenuri = jsonuri;
            console.log(jsonuri);
          } else {
            notify({ type: "error", message: "上传元数据失败,请尝试勾选自行上传" });
            return;
          }
        } catch (err) {
          setIsLoading(false);
          notify({ type: "error", message: "上传元数据失败,请尝试勾选自行上传#" });
          return;
        }
        console.log("new");

        let mint = Keypair.generate();
        const provider = new AnchorProvider(connection, wallet, {
          commitment: "finalized",
        });

        setPumpUnit(0);
        setPumpPirce(0);

        console.log("mint: " + mint.publicKey.toBase58());

        let createTx = await getCreateInstructions(
          wallet.publicKey,
          createMetadata.name,
          createMetadata.symbol,
          tokenuri,
          mint,
          provider
        );

        let newTx = new Transaction().add(createTx);
        const money = Number(process.env.NEXT_PUBLIC_PRICE_CREATE);
        const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
        const Transfer = SystemProgram.transfer({   //SystemProgram代表sol
          fromPubkey: wallet.publicKey,
          toPubkey: mykey,
          lamports: money * Math.pow(10, 9)
        });
        newTx.add(Transfer);

        const curvePda = await getBondingCurvePDA(mint.publicKey);
        const associatedBondingCurve = await getAssociatedTokenAddress(
          mint.publicKey,
          curvePda,
          true
        );
        m_CurvePDA = curvePda;
        m_assBundingCurve = associatedBondingCurve;
        m_Mint = mint.publicKey;
        let virPoolSol: bigint;
        virPoolSol = BigInt(0);
        let virPoolToken: bigint;
        virPoolToken = BigInt(0);

        if (walBuySol > 0) {

          const walSolVal = BigInt(walBuySol * LAMPORTS_PER_SOL);
          const buyAmount = await getInitialBuyPrice(connection, walSolVal);

          const slippageBasisPoints = 500;
          const buyAmountWithSlippage = calculateWithSlippageBuy(
            walSolVal,
            BigInt(slippageBasisPoints)
          );
          virPoolSol += walSolVal;
          virPoolToken += buyAmount;
          //const associatedUser = await getAssociatedTokenAddress(mint, buyer, false);       
          console.log("buyAmount: ", buyAmount);
          console.log("buyAmountWithSlippage: ", buyAmountWithSlippage);
          //let buyTx = await Swap_Buy_pump(connection, curvePda, associatedBondingCurve, mint.publicKey, wallet, buyAmount, buyAmountWithSlippage, true);
          let buyTx = await getBuyInstructions(wallet.publicKey, mint.publicKey, buyAmount, buyAmountWithSlippage, provider);
          newTx.add(buyTx);
        }


        const latestBlockhash = await connection.getLatestBlockhash();
        const JitoFeeWallet = getRandomTipAccount();///new PublicKey(getRandomValidatorKey());
        let jitoFee;
        if (jitoLevelRef.current === 1) {
          jitoFee = 0.0005;
        } else if (jitoLevelRef.current === 2) {
          jitoFee = 0.001;
        } else if (jitoLevelRef.current === 3) {
          jitoFee = 0.01;
        }

        //添加Jito转账
        newTx.add(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: JitoFeeWallet,
            lamports: jitoFee * LAMPORTS_PER_SOL,
          })
        );
        // 对交易进行钱包签名
        newTx.feePayer = wallet.publicKey;
        newTx.recentBlockhash = latestBlockhash.blockhash;
        //Mint签名
        newTx.partialSign(mint);
        const signedTx = await wallet.signTransaction(newTx);

        let bundle = [];
        const serializeTx = bs58.encode(signedTx.serialize());
        bundle.push(serializeTx);
        //-----------其他钱包买入

        let i = 0;
        let iTxCount = 0;
        let signWals = [];
        let TrandSend = new Transaction();
        let nowData;

        while (true) {
          nowData = dataAccList[i];
          if (nowData.buySol > 0) {
            // const buyTokenAmtV = Math.floor(nowData.buyToken * Math.pow(10, 6));
            const buySOLAmtV = Math.floor(nowData.buySol * LAMPORTS_PER_SOL);
            const BigBuySol = BigInt(buySOLAmtV);

            const slippageBasisPoints = 500;
            const buyAmountWithSlippage = calculateWithSlippageBuy(
              BigBuySol,
              BigInt(slippageBasisPoints)
            );
            const buyTokenAmtV = getPumpprice(virPoolToken, virPoolSol, BigBuySol);
            console.log("buyTokenAmtV: ", buyTokenAmtV);
            console.log("buySOLAmtV: ", buySOLAmtV);
            virPoolSol += BigBuySol;
            virPoolToken += buyTokenAmtV;

            const updatedData = [...dataAccList];
            updatedData[i].buyToken = Number(buyTokenAmtV / BigInt(Math.pow(10, 6)));
            setDataAccList(updatedData);

            const connect = new Connection(process.env.NEXT_PUBLIC_RPC);

            const bTx = await Swap_Buy_pump(connect, curvePda, associatedBondingCurve, mint.publicKey,
              nowData.wallet, Number(buyTokenAmtV), Number(buyAmountWithSlippage), true);
            TrandSend.add(bTx);
            signWals.push(nowData.wallet);
            //TrandSend.partialSign(nowData.wallet);
            iTxCount += 1;
            if (iTxCount >= 4) {
              iTxCount = 0;
              const latestBlockhash1 = await connection.getLatestBlockhash();
              TrandSend.feePayer = nowData.wallet.publicKey;
              TrandSend.recentBlockhash = latestBlockhash1.blockhash;
              for (let j = 0; j < signWals.length; j++) {
                const wal = signWals[j];
                TrandSend.partialSign(wal); //部分签名
              }
              signWals = [];
              const serializeTx2 = bs58.encode(TrandSend.serialize());
              bundle.push(serializeTx2);
              console.log(`bundle.push`);
              TrandSend = new Transaction();
            }
          }
          i += 1;
          if (i >= dataAccList.length) { break }
        }
        if (iTxCount > 0) {
          iTxCount = 0;
          const latestBlockhash1 = await connection.getLatestBlockhash();
          TrandSend.feePayer = nowData.wallet.publicKey;
          TrandSend.recentBlockhash = latestBlockhash1.blockhash;
          for (let j = 0; j < signWals.length; j++) {
            const wal = signWals[j];
            TrandSend.partialSign(wal); //部分签名
          }
          const serializeTx2 = bs58.encode(TrandSend.serialize());
          bundle.push(serializeTx2);
          console.log(`bundle.push`);
        }

        //return;

        // if (wallet1Buy !== 0) {
        //   const connect = new Connection(process.env.NEXT_PUBLIC_RPC);
        //   console.log(wallet1.publicKey.toString());
        //   const buyTokenAmtV = Math.floor(wallet1BuyToken * Math.pow(10, 6));
        //   const buySOLAmtV = Math.floor(wallet1Buy * LAMPORTS_PER_SOL);
        //   console.log("buyTokenAmtV: ", buyTokenAmtV);
        //   console.log("buySOLAmtV: ", buySOLAmtV);
        //   const bTx = await Swap_Buy_pump(connect, curvePda, associatedBondingCurve, mint.publicKey,
        //     wallet1, buyTokenAmtV, buySOLAmtV, true);//swap_Buy_Wallet(keys, buyAmtV, 0, wallet1);
        //   bTx.feePayer = wallet1.publicKey;
        //   bTx.recentBlockhash = latestBlockhash1.blockhash;
        //   //console.log("666");
        //   bTx.sign(wallet1);
        //   const serializeTx2 = bs58.encode(bTx.serialize());
        //   bundle.push(serializeTx2);
        // }

        // if (wallet2Buy !== 0) {
        //   const connect = new Connection(process.env.NEXT_PUBLIC_RPC);
        //   console.log(wallet2.publicKey.toString());
        //   //const latestBlockhash1 = await connection.getLatestBlockhash();
        //   const buyTokenAmtV = Math.floor(wallet2BuyToken * Math.pow(10, 6));
        //   const buySOLAmtV = Math.floor(wallet2Buy * LAMPORTS_PER_SOL);
        //   //console.log(buyAmtV);
        //   const bTx = await Swap_Buy_pump(connect, curvePda, associatedBondingCurve, mint.publicKey,
        //     wallet2, buyTokenAmtV, buySOLAmtV, true);//swap_Buy_Wallet(keys, buyAmtV, 0, wallet1);
        //   bTx.feePayer = wallet2.publicKey;
        //   bTx.recentBlockhash = latestBlockhash1.blockhash;
        //   //console.log("666");
        //   bTx.sign(wallet2);
        //   const serializeTx2 = bs58.encode(bTx.serialize());
        //   bundle.push(serializeTx2);
        //   //console.log("buy ====>", await connection.simulateTransaction(signedbTx));
        // }

        // if (wallet3Buy !== 0) {
        //   const connect = new Connection(process.env.NEXT_PUBLIC_RPC);
        //   console.log(wallet3.publicKey.toString());
        //   const buyTokenAmtV = Math.floor(wallet3BuyToken * Math.pow(10, 6));
        //   const buySOLAmtV = Math.floor(wallet3Buy * LAMPORTS_PER_SOL);
        //   const bTx = await Swap_Buy_pump(connect, curvePda, associatedBondingCurve, mint.publicKey,
        //     wallet3, buyTokenAmtV, buySOLAmtV, true);//swap_Buy_Wallet(keys, buyAmtV, 0, wallet1);
        //   bTx.feePayer = wallet3.publicKey;
        //   bTx.recentBlockhash = latestBlockhash1.blockhash;
        //   //console.log("666");
        //   bTx.sign(wallet3);
        //   const serializeTx2 = bs58.encode(bTx.serialize());
        //   bundle.push(serializeTx2);
        //   //console.log("buy ====>", await connection.simulateTransaction(signedbTx));
        // }

        // if (wallet4Buy !== 0) {
        //   const connect = new Connection(process.env.NEXT_PUBLIC_RPC);
        //   console.log(wallet4.publicKey.toString());
        //   const buyTokenAmtV = Math.floor(wallet4BuyToken * Math.pow(10, 6));
        //   const buySOLAmtV = Math.floor(wallet4Buy * LAMPORTS_PER_SOL);
        //   const bTx = await Swap_Buy_pump(connect, curvePda, associatedBondingCurve, mint.publicKey,
        //     wallet4, buyTokenAmtV, buySOLAmtV, true);//swap_Buy_Wallet(keys, buyAmtV, 0, wallet1);
        //   bTx.feePayer = wallet4.publicKey;
        //   bTx.recentBlockhash = latestBlockhash1.blockhash;
        //   //console.log("666");
        //   bTx.sign(wallet4);
        //   const serializeTx2 = bs58.encode(bTx.serialize());
        //   bundle.push(serializeTx2);
        // }

        //await sendBundle(bundle);
        const id = await sendBundle(bundle);
        console.log(id);
        //----------
        setTokenAddress(`https://pump.fun/${mint.publicKey.toBase58()}`);




        //selectedFile.
        // try {
        //   const jsonuri = await getmyTokenUri(selectedFile, userinput.tokenName, userinput.symbol, userinput.description, userinput.web,
        //     userinput.tglink, userinput.xlink, wordArray);
        //   setIsLoading(false);
        //   if (jsonuri != "error") {
        //     tokenuri = jsonuri;
        //     console.log(jsonuri);
        //   } else {
        //     notify({ type: "error", message: "上传元数据失败,请尝试勾选自行上传" });
        //     return;
        //   }
        // } catch (err) {
        //   setIsLoading(false);
        //   notify({ type: "error", message: "上传元数据失败,请尝试勾选自行上传#" });
        //   return;
        // }
      } finally {
        setIsLoading(false);
      }
    }
    else {
      notify({ type: "error", message: "未选择logo文件" });
      return;
    }
  }

  const onChangeMB = (key: string | string[]) => {
    console.log(key);
  };


  return (

    <div className="md:hero mx-auto p-1 ">
      <div>
        <div className="md:hero-content flex flex-col">
          <div className='mt-1'>
            <h1 className="text-center text-4xl md:pl-12 text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-4 ">
              {t('create.pumpbuy')}
            </h1>
            <h1 className="text-center text-1xl md:p-0 md:pl-12 text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500">
              {t('create.pumpbuy1')}
            </h1>
          </div>
          {/* <button onClick={()=>{console.log(GAS_LEVEL)}}>Get</button> */}

          <div className={claname1}>
            <div className={clanametext}>{t('create.tokenname')}</div>
            <div className="md:w-2/3 m-auto">
              <input id="tokenname" className={classinput} placeholder={t('create.tokennamets')}></input>
            </div>
          </div>

          <div className={claname1}>
            <div className={clanametext}>{t('create.symbol')}</div>
            <div className="md:w-2/3 m-auto">
              <input id="tokenSymbol" className={classinput} placeholder={t('create.symbolts')}></input>
            </div>
          </div>



          {/* <div className={claname1}>
            <div className={clanametext}>{t('create.dec')}</div>
            <div className="md:w-2/3 m-auto">
              <input id="tokendec" className={classinput} placeholder="9" defaultValue="9"></input>
            </div>
          </div> */}

          {/* <div className={claname1}>
            <div className={clanametext}>{t('create.amount')}</div>
            <div className="md:w-2/3 m-auto">
              <input id="tokencount" className={classinput} placeholder="100000000" defaultValue="100000000"></input>
            </div>
          </div> */}

          <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 md:w-[600px]">
            <div className={`${clanametext} pr-1`}>{t('create.logo')}</div>
            <div className="md:w-2/3 m-auto">
              <div className="m-auto w-[350px] px-2 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" >
                </path>
                </svg>
                <label className="cursor-pointer font-medium text-purple-500 hover:text-indigo-500">
                  <span>{t('create.logosel')}</span>
                  <input type="file" id="fileInput" onChange={handleFileChange} className="sr-only" required></input>
                  <p className="text-1x1 md:text-1xl text-center text-slate-100 my-2" id="filename">
                    {selectedFile && (<p>{t('create.logoselts')}{selectedFile.name}</p>)} </p>
                </label>
              </div>
              <p className="text-center text-slate-300 my-2 text-sm">{t('create.logojy')}</p>
            </div>
          </div>

          <div className={claname1}>
            <div className={clanametext}>{t('create.des')}</div>
            <div className="md:w-2/3 m-auto">
              <textarea id="des" className={classtextarea} placeholder={t('create.dests')}></textarea>
            </div>
          </div>

          <div className={claname1}>
            <div className={clanametext}>
              {t('create.openxt')}
            </div>
            <div className="md:w-2/3 m-auto">
              <input type="checkbox" className="toggle" defaultChecked={false} onChange={() => { setisShowXT(!isShowXT) }} />
            </div>
          </div>




          {isShowXT ?
            <div>
              <div className={claname1}>
                <div className={clanametext}>{t('create.web')}</div>
                <div className="md:w-2/3 m-auto">
                  <input id="userweb" className={classinput + " text-sm"} placeholder={t('create.webts')}></input>
                </div>
              </div>

              <div className={claname1}>
                <div className={clanametext}>{t('create.tg')}</div>
                <div className="md:w-2/3 m-auto">
                  <input id="tglink" className={classinput + " text-sm"} placeholder={t('create.tgts')}></input>
                </div>
              </div>

              <div className={claname1}>
                <div className={clanametext}>{t('create.x')}</div>
                <div className="md:w-2/3 m-auto">
                  <input id="xlink" className={classinput + " text-sm"} placeholder={t('create.xts')}></input>
                </div>
              </div>

              <div className={claname1}>
                <div className={clanametext}>{t('create.dis')}</div>
                <div className="md:w-2/3 m-auto">
                  <input id="dislink" className={classinput + " text-sm"} placeholder={t('create.dists')}></input>
                </div>
              </div>



              {/* <div className={claname1}>
                <div className={clanametext}>{t('create.tags')}</div>
                <div className="md:w-2/3 m-auto">
                  <textarea id="tags" className={classtextarea} placeholder="Meme,NFT,DIFI" defaultValue="Meme,NFT,DIFI"></textarea>
                </div>
              </div> */}
            </div>
            : ""
          }

          {/* <div className="flex justify-between md:flex-row items-center space-x-3 md:w-[600px]">
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">{t('auth.freeys')}</span>
                <input type="checkbox" id='freeys' className="toggle" defaultChecked={false} />
              </label>
            </div>

            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">{t('auth.mint')}</span>
                <input type="checkbox" id='freemint' className="toggle" defaultChecked={false} />
              </label>
            </div>

            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">{t('auth.free')}</span>
                <input type="checkbox" id='freeacc' className="toggle" defaultChecked={false} />
              </label>
            </div>
          </div> */}



          {/* <CreateParam selectedFile={selectedFile} /> */}

          {/* <div className="mt-1 flex  items-center  space-x-2 text-left md:w-[600px]">
            <div className="md:w-[300px] md:text-2xl text-center text-slate-300 my-2">{t('create.selfupload')}</div>
            <div className="m-auto  w-[350px]">
              <input type="checkbox" id="isselfupload" className="form-checkbox h-6 w-6 text-indigo-600 rounded-md ml-10 mt-4" />
            </div>
          </div> */}

          <div className={claname1}>
            <div className={clanametext}>{t('create.walbuy')}</div>
            <div className="md:w-2/3 m-auto">
              <input id="walbuy" className={classinput} placeholder="SOL"></input>
            </div>
          </div>

          <Card style={{ width: 600 }} title={`1.${t('msg.wal')}${t('msg.set')}`}>
            <div>同时买入的钱包,最大支持16个钱包</div>
            <div style={{ marginBottom: 10, marginTop: 10 }}>
              <TextArea rows={8} wrap="off" value={siyaoListString} onChange={handleTextAreaChange} />
            </div>

            <Flex gap={30} justify={"flex-start"} align={"center"}>
              <Button type="primary" size="large" onClick={handleSetAcc}>
                {t('msg.set')}{t('msg.wal')}
              </Button>
            </Flex>
          </Card>

          <Card style={{ width: 600 }} title={`${t('msg.buy')}${t('msg.info')}`}>

            <Flex gap={5} justify={"flex-start"} align={"center"} >
              <Tooltip title="随机SOL最小值">
                <Input id='rantoken1' style={{ width: '15%' }} placeholder={`${t('msg.buy')}SOL`} defaultValue={0.6}></Input>
              </Tooltip>
              <Tooltip title="随机SOL最大值">
                <Input id='rantoken2' style={{ width: '15%' }} placeholder={`${t('msg.buy')}SOL`} defaultValue={1}></Input>
              </Tooltip>
              <Tooltip title="随机SOL的小数位">
                <Input id='ransol' style={{ width: '8%' }} placeholder={`${t('msg.buy')}SOL`} defaultValue={2}></Input>
              </Tooltip>
              <Button onClick={handleAutoInput}>一键填写</Button>
            </Flex>
            <Flex gap={5} style={{ marginTop: 10 }} justify={"flex-start"} align={"center"} >
              {/* <Input id='buytoken' style={{ width: '20%' }} placeholder={`${t('msg.buy')}${t('msg.token')}`}></Input> */}
              <Tooltip title="修改选中钱包的买入SOL">
                <Input id='buysol' style={{ width: '20%' }} placeholder={`${t('msg.buy')}SOL`}></Input>
              </Tooltip>
              <Button onClick={handleChangeInfo}>修改</Button>

              <Button style={{ marginLeft: 10 }} onClick={handleGetBalance}>获取余额</Button>
              <Button onClick={handleAutoInputByBalan}>根据余额自动填写</Button>
              {/* <Button style={{ marginLeft: 20 }} onClick={handleAutoInput}>自动填写</Button> */}
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
                />
              </Flex>
            </div>
          </Card>

          {/* <div className='w-[600px]'>
            <Collapse
              bordered={false}
              accordion
              items={items}
              defaultActiveKey={['1']}
              onChange={onChangeMB}
              style={{ background: "rgb(254 242 242)" }}
            />
          </div> */}


          <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 w-[600px]">
            <div className='md:w-1/3 md:text-1xl text-right text-stone-300 text-base mr-2 '>Jito MEV{t('msg.tip')}:</div>

            <div className='max-w-md mx-auto  my-2 w-full flex items-center md:text-sm space-x-3'>
              <Radio.Group value={jitoLevel} onChange={onChangeJitoLevel} style={{ marginBottom: 16 }}>
                <Radio.Button value={1}>{t('msg.def')} 0.0005SOL</Radio.Button>
                <Radio.Button value={2}>{t('msg.def1')} 0.001SOL</Radio.Button>
                <Radio.Button value={3}>{t('msg.def2')} 0.01SOL</Radio.Button>
              </Radio.Group>
            </div>
          </div>

          <div className="mt-4 flex  items-center  space-x-1 text-left">
            {t('create.param.addr')} {tokenAddress ?
              <div >
                <Link href={tokenAddress} target="_blank" rel="noopener noreferrer" passHref className="text-secondary hover:text-white">
                  {tokenAddress}
                </Link>
              </div> : t('create.param.addrnot')} {/* 显示 token 地址或默认值 */}
          </div>

          <button
            className="px-16 m-2 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
            onClick={handleCreate}
          >
            <span>{t('create.param.enter')} </span>
          </button>

          <button
            className="px-16 m-2 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
            onClick={handleSaleAll}
          >
            <span>一键卖出 </span>
          </button>


          {/* <p className="md:w-full md:text-1xl text-center text-slate-500 my-2 text-xs">{t('free.all')}</p> */}
          {/* <FloatButton tooltip={<div>{t('msgbox.fbtn')}</div>} onClick={() => setIsModalOpen(true)} /> */}
          {/* <MsgBoxView isModalOpen={isModalOpen} msgParam={messageBoxPam} handleCancel={() => { setIsModalOpen(false) }} /> */}
          {isLoading && <Loading />}

        </div>







      </div>

    </div >

  );
};

// type Props = {
//   // Add custom props here

// }

// export const getStaticProps: GetStaticProps<Props> = async ({
//   locale,
// }) => ({
//   props: {
//     ...(await serverSideTranslations(locale ?? 'en', [
//       'common',
//     ])),
//   },
// })
