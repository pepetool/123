// Next, React
import { FC, useEffect, useState } from 'react';
import Link from 'next/link';

// Wallet
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

// Components
import { AuthorityParam } from '../../components/AuthorityParam';
import pkg from '../../../package.json';
import { useTranslation } from 'next-i18next'

import { ammRemoveLiquidity } from "../../utils/raydium/ammRemoveLiquidity"

import {
  jsonInfo2PoolKeys,
  Liquidity,
  LiquidityPoolKeys,
  Token,
  TokenAmount
} from '@raydium-io/raydium-sdk';

import {
  //buildAndSendTx,
  getWalletTokenAccount,
} from '../../utils/raydium/util';

import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import Loading from 'components/Loading';

import {
  LAMPORTS_PER_SOL, PublicKey, Connection, Keypair, Transaction, SystemProgram, TransactionMessage,
  TransactionInstruction,
  VersionedTransaction
} from '@solana/web3.js'
import { notify } from 'utils/notifications';

import BN from "bn.js"

import {
  setWallet,
  setConnection,
  PROGRAMIDS,
} from '../../utils/config';
import MsgBoxView, { MessageBoxPam, useMessageBoxPam } from 'views/msgbox';
import { formatAmmKeysById } from 'utils/raydium/formatAmmKeysById';
import assert from 'assert';
import { GetparsePoolInfo } from 'utils/raydium/ammV4MockPoolInfo';
import { usesBeet } from '@metaplex-foundation/mpl-token-metadata';
import { getMarketAssociatedPoolKeys } from 'utils/raydium/ammCreatePool';
import { getTokenAccountsByRaydium } from 'utils/gettoken';
import { sendSignedTransaction, sleep } from 'utils/transaction';
import { FloatButton, Tooltip } from 'antd';
import { setPublicGasfee } from 'utils/web3';

// Store
//import useUserSOLBalanceStore from '../../stores/useUserSOLBalanceStore';

let lpDec;

export const RemoveView: FC = ({ }) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signMessage, signTransaction, signAllTransactions } = useWallet();
  const { t } = useTranslation('common');
  const [isLoading, setIsLoading] = useState(false);
  const [checkFromMint, setchekFromMint] = useState(false);
  const [chekced, setchecked] = useState(false);
  const [removeamt, setRemoveamt] = useState(0);
  const [odval, setodval] = useState(100);
  const [polTotel, setpolTotel] = useState("");
  const [polBanlace, setpolBanlace] = useState("");
  const [polBanlaceVal, setpolBanlaceVal] = useState(0);
  const [polOrder, setpolOrder] = useState("");
  const [polAmount, setpolAmount] = useState(0);
  const [polGet, setpolGet] = useState(0.01);
  //let targetPoolAddr:string = "";
  const [targetPoolAddr, settargetPoolAddr] = useState("");


  useEffect(() => {
    if (chekced) {
      setRemoveamt(polAmount / 100 * odval);
      setpolGet(polBanlaceVal / 100 * odval);
    }
  }, [odval, polAmount, polBanlaceVal]);


  const [isModalOpen, setIsModalOpen] = useState(false);
  const initialPam: MessageBoxPam = {
    addrTag: '',
    addrName: '',
    addr1: '',
    hxName: '',
    hxAddr: ''
  };
  const [messageBoxPam, updateMessageBoxPam] = useMessageBoxPam(initialPam);


  const getPoolAssociatedId = (marketId: PublicKey) => {
    const programId = PROGRAMIDS.AmmV4;
    const [publicKey] = PublicKey.findProgramAddressSync(
      [programId.toBuffer(), marketId.toBuffer(), Buffer.from('amm_associated_seed', 'utf-8')],
      programId,
    )
    return publicKey
  }

  const handleCheckClick = async () => {

    if (!publicKey) {
      notify({ type: "error", message: "钱包未连接" });
      return;
    }
    const doc = document.getElementById("tokenaddr") as HTMLInputElement | null;
    const poolAddr = doc?.value;
    if (poolAddr === "") {
      notify({ type: "error", message: "请输入查询地址" });
      return;
    }
    setWallet(wallet);
    setConnection(connection);
    if (!checkFromMint) {
      settargetPoolAddr("");
      setIsLoading(true);
      try {
        setpolTotel(``);
        setpolBanlace(``);
        setpolOrder(``);
        setpolAmount(0);
        setpolGet(0);
        setpolBanlaceVal(0);
        setchecked(false);
        const targetPoolInfo = await formatAmmKeysById(poolAddr)
        if (targetPoolInfo) {
          lpDec = targetPoolInfo.lpDecimals;
          console.log("lpDec:", lpDec);
          console.log('targetPoolInfo', targetPoolInfo);
          const { base, quote, baseBalance, quoteBalance,
            baseOpenOrder, quoteOpenOrder, baseDec,
            quoteDec, totalLP, LpAmount } = await GetparsePoolInfo(connection, publicKey, poolAddr);
          //targetPoolInfo.lpMint 指向 AaBMmVoZPwsUnqi1yKzCKT5wEeVkWpcTFprVfKqFEtZ8
          console.log("LpAmount",LpAmount);
          setIsLoading(false);
          //console.log(LpAmount);
          setpolTotel(`${base.toFixed(3)}/${quote.toFixed(3)}`);
          setpolBanlace(`${baseBalance.toFixed(3)}/${quoteBalance.toFixed(3)}`);
          setpolOrder(`${baseOpenOrder}/${quoteOpenOrder}`);
          setpolAmount(LpAmount);
          setpolGet(quoteBalance);
          setpolBanlaceVal(quoteBalance);
          settargetPoolAddr(targetPoolInfo.id);
          setchecked(true);
          //-----------
          //ammRemoveLiquidity()
          //SOL_USDC pool info: pool total base 25000 pool total quote 0.909264576 base vault balance 25000 quote vault balance 0.909264576 base tokens in openorders 0 quote tokens in openorders  0 base token decimals 9 quote token decimals 9 total lp 150 addedLpAmount 149.7700713
          //SOL_USDC pool info: pool total base 24668.369195764 pool total quote 0.897202971 base vault balance 24668.369195764 quote vault balance 0.897202971 base tokens in openorders 0 quote tokens in openorders  0 base token decimals 9 quote token decimals 9 total lp 148 addedLpAmount 147.7700713

        } else {
          notify({ type: "error", message: "没有查询到池子信息" });
          return;
        }
      } catch (err) {
        setIsLoading(false);
        console.log('查询错误',err);
        notify({ type: "error", message: "查询错误" });
        return;
      }
    } else {
      //getTokenAccountsByRaydium(connection, publicKey);
      //return;
      settargetPoolAddr("");
      setIsLoading(true);
      try {
        const targetMarketId = new PublicKey(poolAddr);
        // const quoteMintStr = "So11111111111111111111111111111111111111112";
        // const baseToken = new Token(TOKEN_PROGRAM_ID, new PublicKey(poolAddr), 9, "baseMintSymbol", "baseMintSymbol");//DEFAULT_TOKEN.USDC // USDC  需要构造Token?
        // const quoteToken = new Token(TOKEN_PROGRAM_ID, new PublicKey(quoteMintStr), 9, "quoteMintName", "quoteMintName");//DEFAULT_TOKEN.RAY // RAY
        // const associatedPoolKeys = getMarketAssociatedPoolKeys({
        //   baseToken,
        //   quoteToken,
        //   targetMarketId,
        // })
        // console.log(associatedPoolKeys);
        //xiQSL2KppkLrAtUstPqTXzWCMkBN17CKazcBJmjHjJ7          
        const poolid = getPoolAssociatedId(targetMarketId);

        console.log(poolid.toString());  //???  FUvpwgNN5yXVS5s2fbs7qTst6bfWmqob8DGSB2gNrhWM

        const targetPoolInfo = await formatAmmKeysById(poolid.toString())
        if (targetPoolInfo) {
          lpDec = targetPoolInfo.lpDecimals;
          console.log("lpDec:", lpDec);
          setpolTotel(``);
          setpolBanlace(``);
          setpolOrder(``);
          setpolAmount(0);
          setpolGet(0);
          setpolBanlaceVal(0);
          setchecked(false);
          console.log('targetPoolInfo', targetPoolInfo);
          const { base, quote, baseBalance, quoteBalance,
            baseOpenOrder, quoteOpenOrder, baseDec,
            quoteDec, totalLP, LpAmount } = await GetparsePoolInfo(connection, publicKey, poolid.toString());
          //targetPoolInfo.lpMint 指向 AaBMmVoZPwsUnqi1yKzCKT5wEeVkWpcTFprVfKqFEtZ8
          setIsLoading(false);
          //console.log(LpAmount);
          setpolTotel(`${base.toFixed(3)}/${quote.toFixed(3)}`);
          setpolBanlace(`${baseBalance.toFixed(3)}/${quoteBalance.toFixed(3)}`);
          setpolOrder(`${baseOpenOrder}/${quoteOpenOrder}`);
          setpolAmount(LpAmount);
          setpolGet(quoteBalance);
          setpolBanlaceVal(quoteBalance);
          settargetPoolAddr(targetPoolInfo.id);
          setchecked(true);
          //-----------
          //ammRemoveLiquidity()
          //SOL_USDC pool info: pool total base 25000 pool total quote 0.909264576 base vault balance 25000 quote vault balance 0.909264576 base tokens in openorders 0 quote tokens in openorders  0 base token decimals 9 quote token decimals 9 total lp 150 addedLpAmount 149.7700713
          //SOL_USDC pool info: pool total base 24668.369195764 pool total quote 0.897202971 base vault balance 24668.369195764 quote vault balance 0.897202971 base tokens in openorders 0 quote tokens in openorders  0 base token decimals 9 quote token decimals 9 total lp 148 addedLpAmount 147.7700713

        } else {
          notify({ type: "error", message: "没有查询到池子信息" });
          return;
        }
        setIsLoading(false);

      } catch (err) {
        setIsLoading(false);
        console.log('err', err);
        notify({ type: "error", message: "查询错误" });
        return;
      }
    }
  }


  const handleRemoveClick = async () => {
    if (!publicKey) {
      notify({ type: "error", message: "钱包未连接" });
      return;
    }

    if (targetPoolAddr === "") {
      notify({ type: "error", message: "请先查询池子信息" });
      return;
    }

    // for(let i=0;i<20;i++){
    //   await sleep(1000)
    //   console.log(i);
    // }
    // return;

    setWallet(wallet);
    setConnection(connection);

    //const lpToken = new Token(TOKEN_PROGRAM_ID, new PublicKey(lpMint), lpMindec, "TO", "TO"); // LP   //getMarketAssociatedPoolKeys().lpMint
    //const removeLpTokenAmount = new TokenAmount(lpToken, 2 * LAMPORTS_PER_SOL)  //移除数量  //new BN(2 * LAMPORTS_PER_SOL);
    const targetPool = targetPoolAddr; // RAY-USDC pool   //池子ID
    console.log(targetPool);
    console.log("lpDec:",lpDec);
    const removeAmount = removeamt * Math.pow(10, lpDec);  //这里代币精度不是9可能会出错吧??
    console.log("removeAmount:", removeAmount);
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
                fromPubkey:publicKey,
                toPubkey:mykey,
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

          // await sendSignedTransaction({
          //   signedTransaction: signedTx,
          //   connection,
          //   skipPreflight: false,
          //   timeout:10000,
          //   successCallback: async (txSig) => {
          //     console.log("交易完成2: ", txSig);

          //     const newPam: MessageBoxPam = {
          //       addrTag: '',
          //       addrName: '',
          //       addr1: '',
          //       hxName: '交易哈希:',
          //       hxAddr: txSig
          //     };
          //     updateMessageBoxPam(newPam);
          //     setIsModalOpen(true);

          //   },            
          // });
          //console.log("交易完成: ", signedTx);
          // console.log("交易完成2: ", mintSignature);

          // const newPam: MessageBoxPam = {
          //     addrTag: '',
          //     addrName: '',
          //     addr1: '',
          //     hxName: '交易哈希:',
          //     hxAddr: mintSignature
          // };
          // updateMessageBoxPam(newPam);
          // setIsModalOpen(true);
        }
      }




      notify({ type: 'success', message: '成功', description: '交易已发送' });
      //console.log("交易完成: ", mintSignature);
    } catch (err) {
      notify({ type: 'success', message: '错误', description: '交易失败' });
      console.log('err', err);
    } finally {
      setIsLoading(false)
    }

  }


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

  const handleRangeInputChange1 = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    setodval(value);
  };

  return (

    <div className="flex flex-col md:hero mx-auto p-1 md:w-full">
      <div className="md:hero-content flex flex-col">
        <div className='mt-6'>
          <h1 className="text-center text-4xl md:pl-12 text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-4">
            {t('repool.t1')}
          </h1>

        </div>

        <div className="flex flex-col md:max-w-2xl md:flex-row  items-center  space-x-2 text-left md:w-[600px]">
          <div className="md:w-1/3 text-center text-slate-400 text-base my-2"> {checkFromMint ? t('repool.lpid2') : t('repool.lpid') }</div>
          <div className="md:w-2/3 m-auto text-sm w-full">
            {checkFromMint
              ? <input id="tokenaddr" className="w-full mx-auto mockup-code bg-primary border-2 border-[#5252529f] p-2 px-2 text-sm" placeholder={t('repool.lpidin2')}></input>
              : <input id="tokenaddr" className="w-full mx-auto mockup-code bg-primary border-2 border-[#5252529f] p-2 px-2 text-sm" placeholder={t('repool.lpidin')}></input>
            }
            {checkFromMint
              ? <p>{t('repool.lpid2wj')}  <Link href={""}> <span className='text-sky-500' onClick={() => { setchekFromMint(!checkFromMint) }}>{t('repool.lpid2wj2')}</span></Link> {t('repool.lpidcheck')}</p>
              : <p>{t('repool.lpidwj')} <Link href={""}> <span className='text-sky-500' onClick={() => { setchekFromMint(!checkFromMint) }}>{t('repool.lpidwj2')}</span></Link> {t('repool.lpidcheck')} </p>
            }
          </div>
        </div>

        <div className="flex flex-col w-50">
          {/* <AuthorityParam /> */}
          <button
            className="px-10 m-2 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
            onClick={handleCheckClick}
          >
            {t('repool.lpidcheck')}
          </button>
          {/* <p className="md:w-full md:text-1xl text-center text-slate-500 my-2 text-xs">{t('free.all')}</p> */}
        </div>

        {chekced &&
          <div className="card justify-center glass md:w-[500px]">
            {/* <figure><img src="https://daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.jpg" alt="car!" /></figure> */}
            <div className="card-body flex justify-start">
              <h2 className="card-title flex justify-center">{t('repool.lpinfo')} </h2>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-end mr-4">
                </div>
                <div className="flex justify-start">
                {t('repool.lpinfoty')}
                </div>
                <div className="flex justify-end mr-4">
                {t('repool.lpinfototal')}
                </div>
                <div className="flex justify-start">
                  {polTotel}
                </div>
                <div className="flex justify-end mr-4">
                {t('repool.lpinfobalance')}
                </div>
                <div className="flex justify-start">
                  {polBanlace}
                </div>
                <div className="flex justify-end mr-4">
                {t('repool.lpinfoorder')}
                </div>
                <div className="flex justify-start">
                  {polOrder}
                </div>
                <div className="flex justify-end mr-4">
                {t('repool.lpinfolpamount')}
                </div>
                <div className="flex justify-start">
                  {polAmount}
                </div>

                <div className="flex justify-end mr-4 mt-4">
                {t('repool.lpinfolpget')}
                </div>
                <div className="flex justify-start mt-4">
                  {polGet}
                </div>
              </div>

              <div>
                <div className="flex md:flex-row items-center justify-start">
                  <div className='flex justify-start mx-left md:w-2/1 mt-2 w-full items-center'>
                    <div className='flex flex-col md:w-1/2'>
                      <input type="number"
                        className="max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] text-sm p-2 px-2 my-2 w-full"
                        value={removeamt}
                        onChange={handleBaseChange}
                      />
                      <span className='text-stone-300 text-sm'>
                        <span>{t('repool.lpinfolpremove')} {polAmount}</span>
                      </span>
                    </div>
                    <span className="flex flex-col mx-left md:w-1/2 tooltip" data-tip={`${odval}%`}>
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
              </div>


              <div className="card-actions justify-end">
                <button className="btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black" onClick={handleRemoveClick}>{t('repool.enter')}</button>
              </div>
            </div>
          </div>
        }



      </div>
      <FloatButton tooltip={<div>{t('msgbox.fbtn')}</div>} onClick={() => setIsModalOpen(true)} />
      <MsgBoxView isModalOpen={isModalOpen} msgParam={messageBoxPam} handleCancel={() => { setIsModalOpen(false) }} />
      {isLoading && <Loading />}
    </div>
  );
};
