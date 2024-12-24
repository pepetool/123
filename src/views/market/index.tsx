// Next, React
import { FC, useEffect, useRef, useState } from 'react';
// Wallet
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import Select from 'react-select';
import { notify } from 'utils/notifications';
import {
  burntokensAndcloseacc,
  burntokens,
  setPublicGasfee,
  setPublicGasfee_Push,
} from '../../utils/web3';
import { getTokenAccounts, getMetadata, getImageUri, truncateString } from '../../utils/gettoken';
import Loading from 'components/Loading';
import {
  LAMPORTS_PER_SOL, PublicKey, Connection, Keypair, Transaction, SystemProgram, TransactionMessage,
  TransactionInstruction
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
import { Flex, FloatButton, Input, Radio, RadioChangeEvent, Switch } from 'antd';
import MsgBoxView, { MessageBoxPam, useMessageBoxPam } from 'views/msgbox';
import LogoImage from 'utils/imageParam';
import { getRandomTipAccount } from 'utils/jito/config';
import bs58 from 'bs58';
import { sendBundle } from 'utils/jito/jito';


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

export const MarketView: FC = ({ }) => {
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

  const [odval, setodval] = useState(3);
  const [bdval, setbdval] = useState(3);
  const [isdefpz, setIsdefpz] = useState(false);
  const [sjdl, setsjdl] = useState(128);
  const [qqdl, setqqdl] = useState(63);
  const [dddl, setdddl] = useState(201);
  const [markidaddr, setmarkidaddr] = useState("");
  const [jitoLevel, setjitoLevel] = useState(1);  //1
  const [jitofee, setJitoFee] = useState(0.00003);
  const jitofeeRef = useRef(jitofee);  //实时数值
  const [emvMode, setemvMode] = useState(true);

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
    jitofeeRef.current = jitofee;
  }, [jitofee]);

  //const [isDisMytoken, setDisMytoken] = useState(false);

  function roundUp(num) {
    return Math.ceil(num);
  }

  const setEmvModeProc = (can) => {
    setemvMode(can);
    // if (can) {
    //   setemvMode(can);
    // } else {
    //   setemvMode(can);
    // }
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
                  <span className="text-rose-600 text-sm ml-2">{tokenlist[i].symbol}</span>
                </div>
                <span className="text-stone-500 text-xs ml-2">{truncateString(tokenlist[i].label, 16, 8, 8)}</span>
                {/* <span className="text-rose-400 text-xs">余额: {tokenlist[i].amount / Math.pow(10, 9)}</span> */}
              </div>,
            mint: tokenlist[i].label,
            address: tokenlist[i].address,
            owner: tokenlist[i].owner,
            amount: tokenlist[i].amount / LAMPORTS_PER_SOL,
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
          };
          setOptions(prevOptions => [...prevOptions, newOption]);
        }
      }
    } else {
      //获取SOL
      //let newOption;
      setbjOptions([]);
      const newOption = {
        value: 0,   //(数量:${tokenlist[i].amount / Math.pow(10, 9)})
        label:
          <div className="flex justify-between">
            <span className="text-gray-800">SOL</span>
            <span className="text-gray-400 text-xs">So111111..........11111112</span>
          </div>,
        mint: "SOL",
        address: "SOL",
        amount: 0
      };
      setbjOptions(prevOptions => [...prevOptions, newOption]);


      const newOption2 = {
        value: 1,   //(数量:${tokenlist[i].amount / Math.pow(10, 9)})
        label:
          <div className="flex justify-between">
            <span className="text-gray-800">USDC</span>
            <span className="text-gray-400 text-sm">EPjFWdd5..........ZwyTDt1v</span>
          </div>,
        mint: "USDC",
        address: "USDC",
        amount: 0
      };
      setbjOptions(prevOptions => [...prevOptions, newOption2]);


      const newOption3 = {
        value: 2,   //(数量:${tokenlist[i].amount / Math.pow(10, 9)})
        label:
          <div className="flex justify-between">
            <span className="text-gray-800">USDT</span>
            <span className="text-gray-400 text-sm">Es9vMFrz..........8BenwNYB</span>
          </div>,
        mint: "USDT",
        address: "USDT",
        amount: 0
      };
      setbjOptions(prevOptions => [...prevOptions, newOption3]);

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

  //确定转账
  const handleEnterbtnclick = async () => {
    //=========================
    //-----------                  So11111111111111111111111111111111111111112
    // setmarkidaddr("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")
    // return;
    // console.log(emvMode);
    // console.log(jitofeeRef.current);
    // return;

    if (!wallet || !publicKey) {
      console.log("钱包未连接");
      notify({ type: "error", message: "钱包未连接" })
      return;
    }

    if (!selectedOption || !selectedBJOption) {
      notify({ type: "error", message: "请选择基础代币和报价代币" })
      return;
    }

    const soladdr = "So11111111111111111111111111111111111111112";
    const usdcaddr = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    const usdtaddr = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
    const baseMintstr = selectedOption.mint.toString();
    // const log = `基础代币: ${selectedOption.mint.toString()} 
    // 报价代币: ${selectedBJOption.mint.toString()}
    // 最小订单数: ${odval}
    // 最小价格变动: ${bdval}
    // 事件: ${sjdl}
    // 请求: ${qqdl}
    // 订单: ${dddl}`;
    // console.log(log);
    let quoteMintStr;
    let baojiastr: String = selectedBJOption.mint.toString();
    if (baojiastr === "SOL") {
      quoteMintStr = soladdr;
    } else if (baojiastr === "USDC") {
      quoteMintStr = usdcaddr;
    } else if (baojiastr == "USDT") {
      quoteMintStr = usdtaddr;
    } else {
      console.error("错误");
      return;
    }



    let baseMintKeypair: Keypair | undefined;
    let baseMint: PublicKey;
    let baseMintDecimals: number;

    let quoteMintKeypair: Keypair | undefined;
    let quoteMint: PublicKey;
    let quoteMintDecimals: number;

    const mintInstructions: TransactionInstruction[] = [];
    const mintSigners: Keypair[] = [];

    const vaultInstructions: TransactionInstruction[] = [];
    const vaultSigners: Keypair[] = [];

    let marketInstructions: TransactionInstruction[] = [];
    const marketSigners: Keypair[] = [];

    // validate existing mints
    //if (!createMint) {
    try {
      const baseMintInfo = await getMint(
        connection,
        new PublicKey(baseMintstr)
      );
      baseMint = baseMintInfo.address;
      baseMintDecimals = baseMintInfo.decimals;

      const quoteMintInfo = await getMint(
        connection,
        new PublicKey(quoteMintStr)
      );
      quoteMint = quoteMintInfo.address;
      quoteMintDecimals = quoteMintInfo.decimals;
    } catch (e) {
      console.error("Invalid mints provided.");
      return;
    }
    //}
    // create new mints
    // else {
    //   // const lamports = await getMinimumBalanceForRentExemptMint(connection);

    //   // baseMintKeypair = Keypair.generate();
    //   // baseMint = baseMintKeypair.publicKey;
    //   // baseMintDecimals = data.newMints!.baseDecimals;

    //   // quoteMintKeypair = Keypair.generate();
    //   // quoteMint = quoteMintKeypair.publicKey;
    //   // quoteMintDecimals = data.newMints!.quoteDecimals;

    //   // mintInstructions.push(
    //   //   ...[
    //   //     SystemProgram.createAccount({
    //   //       fromPubkey: wallet.publicKey,
    //   //       newAccountPubkey: baseMintKeypair.publicKey,
    //   //       space: MINT_SIZE,
    //   //       lamports,
    //   //       programId: TOKEN_PROGRAM_ID,
    //   //     }),
    //   //     SystemProgram.createAccount({
    //   //       fromPubkey: wallet.publicKey,
    //   //       newAccountPubkey: quoteMintKeypair.publicKey,
    //   //       space: MINT_SIZE,
    //   //       lamports,
    //   //       programId: TOKEN_PROGRAM_ID,
    //   //     }),
    //   //   ]
    //   );

    //   mintInstructions.push(
    //     ...[
    //       createInitializeMintInstruction(
    //         baseMint,
    //         data.newMints!.baseDecimals,
    //         new PublicKey(data.newMints!.baseAuthority),
    //         new PublicKey(data.newMints!.baseAuthority)
    //       ),
    //       createInitializeMintInstruction(
    //         quoteMint,
    //         data.newMints!.quoteDecimals,
    //         new PublicKey(data.newMints!.quoteAuthority),
    //         new PublicKey(data.newMints!.quoteAuthority)
    //       ),
    //     ]
    //   );

    //   mintSigners.push(baseMintKeypair, quoteMintKeypair);
    // }

    const marketAccounts = {
      market: Keypair.generate(),
      requestQueue: Keypair.generate(),
      eventQueue: Keypair.generate(),
      bids: Keypair.generate(),
      asks: Keypair.generate(),
      baseVault: Keypair.generate(),
      quoteVault: Keypair.generate(),
    };
    setIsLoading(true);

    // srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX: "Openbook Dex",
    // EoTcMgcDRTJVZDMZWBoU6rhYHZfkNTVEAfz3uUJRcYGj: "Openbook Dex Devnet",
    // "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin": "Serum Dex (Compromised)",
    // DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY: "Serum Dex V3 Devnet",
    const OPENBOOK_DEX = "srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX";
    const OPENBOOK_DEX_Devnet = "EoTcMgcDRTJVZDMZWBoU6rhYHZfkNTVEAfz3uUJRcYGj";
    let programID: PublicKey;
    if (process.env.NEXT_PUBLIC_DEBUG === "true") {
      programID = new PublicKey(OPENBOOK_DEX_Devnet);
    } else {
      programID = new PublicKey(OPENBOOK_DEX);
    }

    const [vaultOwner, vaultOwnerNonce] = await getVaultOwnerAndNonce(
      marketAccounts.market.publicKey,
      programID
    );


    const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
    //         transaction.add(SystemProgram.transfer({
    //           fromPubkey: publicKey,
    //           toPubkey: mykey,
    //           lamports: multiSenderfree * LAMPORTS_PER_SOL
    //         }
    // create vaults
    //第一次确认
    vaultInstructions.push(
      ...[
        SystemProgram.createAccount({
          fromPubkey: wallet.publicKey,
          newAccountPubkey: marketAccounts.baseVault.publicKey,
          lamports: await connection.getMinimumBalanceForRentExemption(
            ACCOUNT_SIZE
          ),
          space: ACCOUNT_SIZE,
          programId: TOKEN_PROGRAM_ID,
        }),
        SystemProgram.createAccount({
          fromPubkey: wallet.publicKey,
          newAccountPubkey: marketAccounts.quoteVault.publicKey,
          lamports: await connection.getMinimumBalanceForRentExemption(
            ACCOUNT_SIZE
          ),
          space: ACCOUNT_SIZE,
          programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeAccountInstruction(
          marketAccounts.baseVault.publicKey,
          baseMint,
          vaultOwner
        ),
        createInitializeAccountInstruction(
          marketAccounts.quoteVault.publicKey,
          quoteMint,
          vaultOwner
        ),
        // SystemProgram.transfer({
        //   fromPubkey: publicKey,
        //   toPubkey: mykey,
        //   lamports: 0.08 * LAMPORTS_PER_SOL
        // }
        // ),
      ]
    );

    vaultSigners.push(marketAccounts.baseVault, marketAccounts.quoteVault);

    // tickSize and lotSize here are the 1e^(-x) values, so no check for ><= 0
    const baseLotSize = Math.round(
      10 ** baseMintDecimals * Math.pow(10, -1 * odval)
    );
    const quoteLotSize = Math.round(
      10 ** quoteMintDecimals *
      Math.pow(10, -1 * odval) *
      Math.pow(10, -1 * bdval)
    );

    // create market account
    //第二次确认的
    marketInstructions.push(
      SystemProgram.createAccount({
        newAccountPubkey: marketAccounts.market.publicKey,
        fromPubkey: wallet.publicKey,
        space: Market.getLayout(programID).span,
        lamports: await connection.getMinimumBalanceForRentExemption(
          Market.getLayout(programID).span
        ),
        programId: programID,
      })
    );

    const totalRequestQueueSize = calculateTotalAccountSize(
      qqdl,
      REQUEST_QUEUE_HEADER_SIZE,
      REQUEST_SIZE
    );
    // create request queue
    marketInstructions.push(
      SystemProgram.createAccount({
        newAccountPubkey: marketAccounts.requestQueue.publicKey,
        fromPubkey: wallet.publicKey,
        space: totalRequestQueueSize,
        lamports: await connection.getMinimumBalanceForRentExemption(
          totalRequestQueueSize
        ),
        programId: programID,
      })
    );

    const money = Number(process.env.NEXT_PUBLIC_PRICE_CREATE);

    const totalEventQueueSize = calculateTotalAccountSize(
      sjdl,
      EVENT_QUEUE_HEADER_SIZE,
      EVENT_SIZE
    )
    // create event queue
    marketInstructions.push(
      SystemProgram.createAccount({
        newAccountPubkey: marketAccounts.eventQueue.publicKey,
        fromPubkey: wallet.publicKey,
        space: totalEventQueueSize,
        lamports: await connection.getMinimumBalanceForRentExemption(
          totalEventQueueSize
        ),
        programId: programID,
      })
    );

    const totalOrderbookSize = calculateTotalAccountSize(
      dddl,
      ORDERBOOK_HEADER_SIZE,
      ORDERBOOK_NODE_SIZE
    )
    const orderBookRentExempt =
      await connection.getMinimumBalanceForRentExemption(totalOrderbookSize);

    // create bids
    marketInstructions.push(
      SystemProgram.createAccount({
        newAccountPubkey: marketAccounts.bids.publicKey,
        fromPubkey: wallet.publicKey,
        space: totalOrderbookSize,
        lamports: orderBookRentExempt,
        programId: programID,
      })
    );

    //好像是使用之前创建的帐号???
    // SystemProgram.createAccountWithSeed({
    //   fromPubkey: wallet.publicKey,
    //   newAccountPubkey: marketAccounts.asks.publicKey,
    //   basePubkey:wallet.publicKey,
    //   seed: ,
    //   lamports: orderBookRentExempt,
    //   space: totalOrderbookSize,
    //   programId: programID
    // })

    // create asks
    marketInstructions.push(
      SystemProgram.createAccount({
        newAccountPubkey: marketAccounts.asks.publicKey,
        fromPubkey: wallet.publicKey,
        space: totalOrderbookSize,
        lamports: orderBookRentExempt,
        programId: programID,
      })
    );

    marketSigners.push(
      marketAccounts.market,
      marketAccounts.requestQueue,
      marketAccounts.eventQueue,
      marketAccounts.bids,
      marketAccounts.asks
    );

    marketInstructions.push(
      DexInstructions.initializeMarket({
        market: marketAccounts.market.publicKey,
        requestQueue: marketAccounts.requestQueue.publicKey,
        eventQueue: marketAccounts.eventQueue.publicKey,
        bids: marketAccounts.bids.publicKey,
        asks: marketAccounts.asks.publicKey,
        baseVault: marketAccounts.baseVault.publicKey,
        quoteVault: marketAccounts.quoteVault.publicKey,
        baseMint,
        quoteMint,
        baseLotSize: new BN(baseLotSize),
        quoteLotSize: new BN(quoteLotSize),
        feeRateBps: 150, // Unused in v3
        quoteDustThreshold: new BN(500), // Unused in v3
        vaultSignerNonce: vaultOwnerNonce,
        programId: programID,
      })
    );

    marketInstructions.push(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: mykey,
        lamports: money * LAMPORTS_PER_SOL
      }
      )
    )


    //marketInstructions = setPublicGasfee_Push(marketInstructions);


    const transactionWithSigners: TransactionWithSigners[] = [];
    // if (mintInstructions.length > 0) {
    //   transactionWithSigners.push({
    //     transaction: new Transaction().add(...mintInstructions),
    //     signers: mintSigners,
    //   });
    // }
    transactionWithSigners.push(
      {
        transaction: new Transaction().add(...vaultInstructions),
        signers: vaultSigners,
      },
      {
        transaction: new Transaction().add(...marketInstructions),
        signers: marketSigners,
      }
    );

    try {
      const signedTransactions = await signTransactions({
        transactionsAndSigners: transactionWithSigners,
        wallet,
        connection,
      });

      if (!emvMode) {
        await sendSignedTransaction({
          signedTransaction: signedTransactions[0],
          connection,
          skipPreflight: false,
          // successCallback: async (txSig) => {
          //   console.log('tx1', txSig);
          //   toast(
          //     () => (
          //       <TransactionToast
          //         txSig={txSig}
          //         message={
          //           signedTransactions.length > 2
          //             ? TRANSACTION_MESSAGES[0].successMessage
          //             : TRANSACTION_MESSAGES[1].successMessage
          //         }
          //       />
          //     ),
          //     { autoClose: 5000 }
          //   );
          // },
          // sendingCallback: async () => {
          //   toast.info(
          //     signedTransactions.length > 2
          //       ? TRANSACTION_MESSAGES[0].sendingMessage
          //       : TRANSACTION_MESSAGES[1].sendingMessage,
          //     {
          //       autoClose: 2000,
          //     }
          //   );
          // },
        });

        let CreatetxSig;
        //signedTransactions[1] = setPublicGasfee(signedTransactions[1]);
        await sendSignedTransaction({
          signedTransaction: signedTransactions[1],
          connection,
          skipPreflight: false,
          successCallback: async (txSig) => {
            console.log('tx2', txSig);
            CreatetxSig = txSig;
          },
          // sendingCallback: async () => {
          //   toast.info(
          //     signedTransactions.length > 2
          //       ? TRANSACTION_MESSAGES[1].sendingMessage
          //       : TRANSACTION_MESSAGES[2].sendingMessage,
          //     {
          //       autoClose: 2000,
          //     }
          //   );
          // },
        });
        setIsLoading(false);
        // router.push({
        //   pathname: `${marketAccounts.market.publicKey.toBase58()}`,
        //   query: router.query,
        // });
        setmarkidaddr(marketAccounts.market.publicKey.toBase58());
        notify({ type: "success", message: "成功", description: "交易已发送" });

        const newPam: MessageBoxPam = {
          addrTag: 'account',
          addrName: "市场ID:",
          addr1: marketAccounts.market.publicKey.toBase58(),
          hxName: '交易哈希:',
          hxAddr: CreatetxSig
        };
        updateMessageBoxPam(newPam);
        setIsModalOpen(true);
      } else {
        const latestBlockhash = await connection.getLatestBlockhash();
        const iTx = new Transaction();
        const JitoTip = getRandomTipAccount();
        const JitoFee = jitofeeRef.current;//getJitoSetFee(jitoRef.current);
        iTx.add(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: JitoTip,
            lamports: JitoFee * LAMPORTS_PER_SOL,
          }));
        iTx.feePayer = wallet.publicKey;
        iTx.recentBlockhash = latestBlockhash.blockhash;
        const signedbTx1 = await wallet.signTransaction(iTx);
        const jitoTx = bs58.encode(signedbTx1.serialize());
        let bundle = [];
        bundle.push(jitoTx);
        const mark1 = signedTransactions[0];
        //mark1.feePayer = wallet.publicKey;
        //mark1.recentBlockhash = latestBlockhash.blockhash;
        const jitoTx2 = bs58.encode(mark1.serialize());
        bundle.push(jitoTx2);
        const mark2 = signedTransactions[1];
        //mark2.feePayer = wallet.publicKey;
        //mark2.recentBlockhash = latestBlockhash.blockhash;
        const jitoTx3 = bs58.encode(mark2.serialize());
        bundle.push(jitoTx3);
        const sent = await sendBundle(bundle);
        console.log("swapped in tx id:", sent);
        //return sent;
        setIsLoading(false);
        setmarkidaddr(marketAccounts.market.publicKey.toBase58());
        notify({ type: "success", message: "成功", description: "交易已发送" });

        const newPam: MessageBoxPam = {
          addrTag: 'account',
          addrName: "市场ID:",
          addr1: marketAccounts.market.publicKey.toBase58(),
          hxName: '交易哈希:',
          hxAddr: "请点击帐号浏览器 查看是否显示OpenBook"
        };
        updateMessageBoxPam(newPam);
        setIsModalOpen(true);
      }
    } catch (e) {
      const newPam: MessageBoxPam = {
        addrTag: 'account',
        addrName: "市场ID:",
        addr1: marketAccounts.market.publicKey.toBase58(),
        hxName: '交易哈希:',
        hxAddr: "交易超时,请查看交易是否上链!"
      };
      updateMessageBoxPam(newPam);
      setIsModalOpen(true);
      notify({ type: "success", message: "成功", description: "交易超时" });
      console.error("[explorer]: ", e);
      setIsLoading(false);
      toast.error("Failed to create market.");
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
          console.log(reJson);
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
                if (metadata) {
                  medaList.push({
                    account: acc,
                    isToken: true,
                    symbol: metadata.data.symbol,
                    uri: metadata.data.uri,
                    updateAuthority: metadata.updateAuthority,
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
              }
            }
            displaytokentocombox(true);
          } else {
            //notify({type:"success", message:"查询成功"});
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
  };

  const handleRangeInputChange2 = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    //console.log('第二个输入范围的值:', value);
    setbdval(value);
  };

  const handlePzCheck = (event: React.ChangeEvent<HTMLInputElement>) => {
    //console.log('值:', event);
    const value = event.target.checked;
    console.log('第二的值:', value);
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



  return (

    <div className="flex flex-col md:hero mx-auto p-1 md:w-full">
      <div className="">
        <div className='mt-6'>
          <h1 className="text-center text-4xl md:pl-12 text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-4">
            {t('market.t1')}
          </h1>
        </div >

        <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 w-[600px]">
          <div className='md:w-1/3 md:text-1xl text-right text-stone-50 text-base mr-2 '>{t('market.base')}</div>
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
          <div className='md:w-1/3 md:text-1xl text-right text-stone-50 text-base mr-2'>{t('market.quote')}</div>
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
          <div className='md:w-1/3 md:text-1xl text-right text-stone-50 text-base mr-2 '>{t('market.minod')}</div>
          <div className='max-w-md mx-auto px-10 my-2 w-full'>
            <span className="tooltip tooltip-open tooltip-left w-full" data-tip={odval}>
              <input type="range" min={0} max={9} defaultValue={3} id="rangeInput1" onChange={handleRangeInputChange1} className="range" />
            </span>

          </div>
        </div>

        <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 w-[600px]">
          <div className='md:w-1/3 md:text-1xl text-right text-stone-50 text-base mr-2 '>{t('market.minpr')}</div>
          <div className='max-w-md mx-auto px-10 my-2 w-full'>
            <span className="tooltip tooltip-open tooltip-left w-full" data-tip={bdval}>
              <input type="range" min={1} max={9} defaultValue={3} id="rangeInput2" onChange={handleRangeInputChange2} className="range" />
            </span>
          </div>
        </div>

        <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 w-[600px]">
          <div className='md:w-1/3 md:text-1xl text-right text-stone-50 text-base mr-2'>{t('market.free')}</div>
          <div className='max-w-md mx-auto px-10 my-2 w-full flex items-center md:text-sm space-x-3'>
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">{t('market.freed')}</span>
                <p className="label-text"> {t('market.freedv')} </p>
                <input type="radio" name="radio-10" className="radio checked:bg-green-500" onChange={handledpeiCheck} defaultChecked={true} />
              </label>
            </div>
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">{t('market.freez')}</span>
                <p className="label-text"> {t('market.freezv')} </p>
                <input type="radio" name="radio-10" className="radio checked:bg-blue-500" onChange={handlezpeiCheck} />
              </label>
            </div>
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">{t('market.freeg')}</span>
                <p className="label-text"> {t('market.freegv')} </p>
                <input type="radio" name="radio-10" className="radio checked:bg-red-500" onChange={handlegpeiCheck} />
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 w-[600px]">
          <div className='md:w-1/3 md:text-1xl text-right text-stone-50 text-base mr-2 ml-5'>{t('market.pz')}</div>
          <div className='max-w-md mx-auto px-10 my-2 w-full'>
            <input type="checkbox" className="toggle" defaultChecked={false} onChange={handlePzCheck} />
          </div>

        </div>

        {isdefpz ?
          <div>
            <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 w-[600px]">
              <div className='md:w-1/3 md:text-1xl text-right text-stone-50 text-base mr-2 ml-5'>{t('market.sj')}</div>
              <div className='max-w-md mx-auto px-10 my-2 w-full'>
                {/* <input id="tokenname" className="max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] p-2 px-10 my-2 w-80" defaultValue={sjdl} placeholder={"128~2978"}></input> */}
                <span className="tooltip tooltip-open tooltip-left w-full" data-tip={sjdl}>
                  <input type="range" min={128} max={2978} value={sjdl} id="rangeInput2" onChange={handlesjdlChange} className="range" />
                </span>
              </div>
            </div>

            <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 w-[600px]">
              <div className='md:w-1/3 md:text-1xl text-right text-stone-50 text-base mr-2 ml-5'>{t('market.qq')}</div>
              <div className='max-w-md mx-auto px-10 my-2 w-full'>
                <span className="tooltip tooltip-open tooltip-left w-full" data-tip={qqdl}>
                  <input type="range" min={12} max={63} value={qqdl} id="rangeInput2" onChange={handleqqdlChange} className="range" />
                </span>
              </div>
            </div>

            <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 w-[600px]">
              <div className='md:w-1/3 md:text-1xl text-right text-stone-50 text-base mr-2 ml-5'>{t('market.dd')}</div>
              <div className='max-w-md mx-auto px-10 my-2 w-full'>
                <span className="tooltip tooltip-open tooltip-left w-full" data-tip={dddl}>
                  <input type="range" min={201} max={909} value={dddl} id="rangeInput2" onChange={handledddlChange} className="range" />
                </span>
              </div>
            </div>

          </div>
          : ""
        }

        <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 w-[600px]">
          <div className='md:w-1/3 md:text-1xl text-right text-stone-50 text-sm mr-2 ml-5'></div>
          <div className='max-w-md mx-auto px-10 my-2 w-full'>
            <button className="px-16 m-2 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
              onClick={handleEnterbtnclick}>
              {t('market.enter')} </button>
            {/* <span className='text-right text-stone-50 text-sm'>{t('market.ent')}</span> */}
            {/* <p className="md:w-full md:text-1xl text-center text-slate-500 my-2 text-xs">{t('free.all')}</p>  */}
            <p className='flex flex-col  text-center text-stone-50 text-base'>{markidaddr !== "" && `市场ID: ${markidaddr}`}</p>
            <Flex style={{ display: 'flex', marginTop: '6px', alignItems: 'center', justifyContent: 'flex-end' }}>
              <span>MEV模式</span>
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
          </div>
        </div>




      </div>
      <FloatButton tooltip={<div>{t('msgbox.fbtn')}</div>} onClick={() => setIsModalOpen(true)} />
      <MsgBoxView isModalOpen={isModalOpen} msgParam={messageBoxPam} handleCancel={() => { setIsModalOpen(false) }} />
      {isLoading && <Loading />}
    </div>
  );
};
