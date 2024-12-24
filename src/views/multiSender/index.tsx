// Next, React
import { FC, useState } from 'react';
// Wallet
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import Select from 'react-select';
import { notify } from 'utils/notifications';
import {
  burntokensAndcloseacc,
  burntokens,
  setPublicGasfee,
} from '../../utils/web3';
import { getTokenAccounts, getMetadata, truncateString, getImageUri, getTokenListByShyft } from '../../utils/gettoken';
import Loading from 'components/Loading';
import { LAMPORTS_PER_SOL, PublicKey, Connection, Keypair, Transaction, SystemProgram, TransactionMessage, ComputeBudgetProgram } from '@solana/web3.js'
import { createTransferCheckedInstruction, createTransferInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  NATIVE_MINT, ACCOUNT_SIZE,
  getAssociatedTokenAddress,
  createSyncNativeInstruction,
  createAccount,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { min } from 'date-fns';
import { useTranslation } from 'next-i18next'
import { FloatButton } from 'antd';
import MsgBoxView, { MessageBoxPam, useMessageBoxPam } from 'views/msgbox';
import LogoImage from 'utils/imageParam';



let tokenlist = [];
let tranList = [];
let tranCount;

export const MultiSenderView: FC = ({ }) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signMessage, signTransaction, signAllTransactions } = useWallet();
  const [isChecked, setisChecked] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [options, setOptions] = useState([]);
  const [tokentotal, setTokentotal] = useState(0);
  const [signature, setSignature] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isnextCheck, setNextCheck] = useState(false);
  const [tokencount, setTokenCount] = useState(0);
  const [tokenamount, setTokenAmount] = useState(0);
  const { t } = useTranslation('common');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const initialPam: MessageBoxPam = {
    addrTag: '',
    addrName: '',
    addr1: '',
    hxName: '',
    hxAddr: ''
  };
  const [messageBoxPam, updateMessageBoxPam] = useMessageBoxPam(initialPam);

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

  const addOptionsToSelect = (selectRef: React.MutableRefObject<HTMLSelectElement | null>) => {
    if (!selectRef.current) {
      return;
    }
    // 清空现有的选项
    //selectRef.current.innerHTML = '';
    const newOption = document.createElement('option');
    //
  }

  async function displaytokentocombox(isAll, keystr?: string) {
    if (isAll) {
      //获取SOL
      const Solbalance = await getSolBalance();
      setOptions([]);
      const newOption = {
        value: -1,   //(数量:${tokenlist[i].amount / Math.pow(10, 9)})
        label:
          <div className="flex justify-between">
            <span className="text-gray-800 text-base">SOL</span>
            <span className="text-gray-400 text-xs">余额:{Solbalance}</span>
          </div>,
        mint: "SOL",
        address: "SOL",
        amount: Solbalance
      };
      setOptions(prevOptions => [...prevOptions, newOption]);

      for (let i = 0; i < tokenlist.length; i++) {
        if (tokenlist[i].isToken) {
          const tokendec = tokenlist[i].dec;
          const newOption = {
            value: i,   //(数量:${tokenlist[i].amount / Math.pow(10, 9)})
            label:
              <div className="flex justify-between">
                <div className="flex items-center">
                  {/* <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200">
                    <LogoImage src={await getImageUri(tokenlist[i].uri)} alt='LOGO'/>
                  </div> */}
                  <span className="text-rose-600 ml-2">{tokenlist[i].symbol}</span>
                  <span className="text-stone-500 text-xs ml-2">{truncateString(tokenlist[i].label, 16, 8, 8)}</span>
                </div>
                <span className="text-rose-400 text-sm">余额: {tokenlist[i].amount / Math.pow(10, tokendec)}</span>
              </div>,
            mint: tokenlist[i].label,
            address: tokenlist[i].address,
            owner: tokenlist[i].owner,
            dec: tokendec,
            amount: tokenlist[i].amount / Math.pow(10, tokendec),
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
            dec: tokenlist[i].dec,
            amount: tokenlist[i].amount / LAMPORTS_PER_SOL,
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
                <span className="text-gray-800 text-xs">{tokenlist[i].symbol} - {tokenlist[i].label}</span>
                <span className="text-gray-400 text-xs">余额:{tokenlist[i].amount / LAMPORTS_PER_SOL}</span>
              </div>,
            mint: tokenlist[i].label,
            address: tokenlist[i].address,
            owner: tokenlist[i].owner,
            amount: tokenlist[i].amount / LAMPORTS_PER_SOL,
          };
          setOptions(prevOptions => [...prevOptions, newOption]);
        }
      }
    }
  }

  const handleChange = selectedOption => {
    setNextCheck(false);
    setSelectedOption(selectedOption);
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
    if (publicKey) {
      if (isnextCheck) {
        let multiSenderfree = Number(process.env.NEXT_PUBLIC_PRICE_MULTISENDER);
        if (selectedOption.mint === "SOL") {
          console.log("sol")
          const Solbalance = await getSolBalance();
          if (Solbalance > tokenamount) {
            let transaction = new Transaction();
            //----------插入交易函数
            const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
            transaction.add(SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: mykey,
              lamports: multiSenderfree * LAMPORTS_PER_SOL
            }
            ));

            // //修改gas费
            // transaction.add(ComputeBudgetProgram.setComputeUnitPrice({
            //   microLamports: 4_000_000,
            // })
            // )

            // //--500000
            // transaction.add(ComputeBudgetProgram.setComputeUnitLimit({
            //   units: 500_000,
            // })
            // )
            transaction = setPublicGasfee(transaction);


            //加入转账列表SOL
            for (let i = 0; i < tranList.length; i++) {
              const corkey = new PublicKey(tranList[i].addr);
              const amount = tranList[i].amount;
              transaction.add(SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: corkey,
                lamports: amount * LAMPORTS_PER_SOL
              }
              ));
            }
            //==============发送交易~~~~~~Success
            setIsLoading(true)
            try {
              // 设置交易的 feePayer
              transaction.feePayer = wallet.publicKey;

              // 获取最新的区块哈希值
              const blockhash = (await connection.getLatestBlockhash()).blockhash;
              transaction.recentBlockhash = blockhash;

              // 对交易进行部分签名
              //mintIx.partialSign(mintKeypair);

              // 对交易进行钱包签名
              const signedTx = await wallet.signTransaction(transaction);
              const wireTx = signedTx.serialize();
              //connection.sendTransaction(signedTx, []);
              // 发送交易
              const mintSignature = await connection.sendRawTransaction(wireTx, { skipPreflight: true });

              const newPam: MessageBoxPam = {
                addrTag: 'account',
                addrName: "提示",
                addr1: "可点击下方查看哈希上链情况",
                hxName: '交易哈希:',
                hxAddr: mintSignature
              };
              updateMessageBoxPam(newPam);
              setIsModalOpen(true);
              // 设置交易签名
              setSignature(mintSignature);
              notify({ type: 'success', message: '成功', description: '交易已发送' });
              console.log("交易完成: ", mintSignature);
            } catch (err) {
              notify({ type: 'success', message: '错误', description: '交易失败' });
            } finally {
              setIsLoading(false)
            }
          } else {
            notify({ type: "error", message: "失败", description: "SOL余额不足以支付转账" });
            return;
          }

        } else {
          console.log("token")
          let tokendec = selectedOption.dec;
          if (!tokendec) (tokendec = 9);
          console.log("tokendec:", tokendec);
          //---------isToken
          // notify({type:"error", message:"失败", description:"Token转账正在开发!!!"});
          // return;
          const Solbalance = await getSolBalance();
          if (Solbalance < 0.01) {
            notify({ type: "error", message: "失败", description: "SOL余额不足以支付转账费,请补充" });
            return;
          }
          if (selectedOption.amount > tokenamount) {

            // const tokenMint = new PublicKey("DJxXb4xBv3BfxhLPPv5xdrPnQ69yoC3rVvC14GGMPj96") //BEBEE
            // const peyer = new PublicKey("Ef6rCcMG1xxdwo3fejio8JTff15DEvLRxduxafKsPNGt");
            // console.log(tokenMint.toString());
            // // /////////////////////Ata就是这个返回的
            // const associatedTokenAccount = await getAssociatedTokenAddress(
            //   tokenMint,  //Mint
            //   peyer       //转账人
            // );
            // console.log(associatedTokenAccount.toString());
            //return;

            // const tokenAccountPubkey = new PublicKey(selectedOption.address)
            //console.log(tokenAccountPubkey.toString());
            // let tokenAccount = await getAccount(connection, associatedTokenAccount);
            // console.log(tokenAccount);
            // return;

            let tokenKey = new PublicKey(selectedOption.mint);
            console.log(tokenKey);
            let transaction = new Transaction();

            //
            //----------插入交易函数
            const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
            transaction.add(SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: mykey,
              lamports: multiSenderfree * LAMPORTS_PER_SOL
            }
            ));
            transaction = setPublicGasfee(transaction);


            //========插入转账Token------------已在测试网测试成功
            let mint = new PublicKey(selectedOption.mint);
            let myATAT = new PublicKey(selectedOption.address);
            console.log("mint", mint.toString())
            console.log("myATA", myATAT.toString())
            console.log("tranList", tranList.length)
            for (let i = 0; i < tranList.length; i++) {
              const corkey = new PublicKey(tranList[i].addr);
              const amount = Number(tranList[i].amount);
              const CorATA = await getAssociatedTokenAddress(
                mint,  //Mint
                corkey       //转账人
              );
              let CorATA_Acc;
              try {
                CorATA_Acc = await getAccount(connection, CorATA);
              } catch (error: unknown) {
                if (error instanceof TokenAccountNotFoundError || error instanceof TokenInvalidAccountOwnerError) {
                  //有人没有账户
                  transaction.add(
                    //创建账户
                    createAssociatedTokenAccountInstruction(
                      publicKey,
                      CorATA,
                      corkey,
                      mint
                    )
                  )
                } else {
                  notify({ type: "error", message: "未知错误" })
                }
              }

              transaction.add(createTransferInstruction(
                myATAT,
                CorATA,
                publicKey,
                amount * Math.pow(10, tokendec),
                [],
                TOKEN_PROGRAM_ID
              ));
            }

            setIsLoading(true)
            try {
              // 设置交易的 feePayer
              transaction.feePayer = wallet.publicKey;

              // 获取最新的区块哈希值
              const blockhash = (await connection.getLatestBlockhash()).blockhash;
              transaction.recentBlockhash = blockhash;

              // 对交易进行部分签名
              //mintIx.partialSign(mintKeypair);

              // 对交易进行钱包签名
              const signedTx = await wallet.signTransaction(transaction);
              const wireTx = signedTx.serialize();
              //connection.sendTransaction(signedTx, []);
              // 发送交易
              const mintSignature = await connection.sendRawTransaction(wireTx, { skipPreflight: true });

              // 设置交易签名
              setSignature(mintSignature);

              const newPam: MessageBoxPam = {
                addrTag: 'account',
                addrName: "提示",
                addr1: "可点击下方查看哈希上链情况",
                hxName: '交易哈希:',
                hxAddr: mintSignature
              };
              updateMessageBoxPam(newPam);
              setIsModalOpen(true);
              // 设置交易签名
              setSignature(mintSignature);
              notify({ type: 'success', message: '成功', description: '交易已发送' });
              console.log("交易完成: ", mintSignature);
            } catch (err) {
              notify({ type: 'success', message: '错误', description: '交易失败' });
            } finally {
              setIsLoading(false)
            }

          } else {
            notify({ type: "error", message: "失败", description: "Token余额不足" });
            return;
          }

        }
      } else {
        notify({ type: "error", message: "错误", description: "请先点击下一步检测地址有效性" });
        return;
      }
    } else {
      notify({ type: "error", message: "错误", description: "钱包未连接" });
      return;
    }
  }

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

  // const handleFocus = async () => {


  //   if (publicKey) {
  //     // setOptions(prevOptions => [...prevOptions, {
  //     //   label: 
  //     //   <div className="flex justify-between">
  //     //     <span className="text-gray-800">加载中...</span>
  //     //     <span className="text-gray-400 text-sm">请稍后</span>
  //     //   </div>
  //     //   }]);   
  //     // return;
  //     if (!isChecked) {
  //       setisChecked(true);
  //       //setIsLoading(true)
  //       setOptions(prevOptions => [...prevOptions, { label: "Loading..." }]);
  //       //--------------------------
  //       //let reJson = await getTokenAccounts("G3HC5zyovRn4i4BQqVWoVPbPKwWZmyeqhTs2e92zBDK8");
  //       let reJson = await getTokenAccounts(publicKey.toString());
  //       if (reJson.result) {
  //         setisChecked(true);
  //         //reJson = JSON.stringify(reJson.result, null, 2);
  //         console.log(reJson);
  //         //tokenlist=[];
  //         if (reJson.result.total != 0) {
  //           setTokentotal(reJson.result.total);

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
  //           console.log(metaJson);
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
  //           displaytokentocombox(true);
  //         } else {
  //           //notify({type:"success", message:"查询成功"});
  //           displaytokentocombox(true);
  //           setTokentotal(0);
  //         }
  //       } else {
  //         notify({ type: 'error', message: '获取失败' });
  //       }
  //     }
  //   } else {
  //     notify({ type: 'error', message: '错误', description: "请先连接钱包" });
  //   }
  // }
  const handleFocus = async () => {
    if (publicKey) {
      if (!isChecked) {
        setisChecked(true);
        setOptions(prevOptions => [...prevOptions, { label: "Loading..." }]);
        let reJson = await getTokenListByShyft(publicKey.toString());
        console.log(reJson);
        
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
      if (addr.length <= 46 && addr.length >= 43) {
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
    setTokenCount(unTranList.length);
    setTokenAmount(tranCount);
    console.log(unTranList);
    setNextCheck(true);
    //console.log("111")
  }



  return (

    <div className="md:hero mx-auto p-1 md:w-full">
      <div className="md:hero-content flex flex-col">
        <div className='mt-6'>
          <h1 className="text-center text-4xl md:pl-12 text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-4">
            {t('multi.t1')}
          </h1>
        </div >
        <div className="text-center mt-6 md:w-[480px]">
          {/* <span className="pointer-events:none">选择您的代币</span>'` */}
          {/* <span className="pointer-events:none">{tokentotal===0 ? "当前钱包没有Tokens" : `当前钱包拥有: ${tokentotal} 个Tokens` }</span>  */}
          <div className="text-left">
            {/* <div className='text-sm p-2'>{t('multi.t2')}</div> */}
            {/* <span className='text-sm'>请输入 地址 , 数量     1.一行一个 2.请不要重复 3.一次不超过11个地址</span> */}
            {/* <h2>{selectedOption ? selectedOption.label : '请选择代币'}</h2> */}
            <Select
              value={selectedOption}
              onChange={handleChange}
              onFocus={handleFocus}
              //onMenuOpen={handleMenuClick}
              options={options}
              isMulti={false} // 如果想要多选，则设置为true
              className="text-black" // 使用 Tailwind 的 text-black 类来修改字体颜色
            />
            <p className='text-sm p-2'>{t('multi.t3')}</p>
            <p className='text-sm p-2'>{t('multi.t4')}</p>

            <div className='flex flex-col md-full'>
              <textarea id="addrs" className="md:w-full h-[250px] mockup-code bg-primary border-2 border-[#5252529f] p-2 px-2 my-2 overflow-auto text-sm" wrap="off"
                placeholder="示例(example):&#10;DgV7KvRciGc8szGkKkYTYN4xuXbiiLJRd5VNY3P9zgmQ,0.1&#10;22MpkPyfEXfHvxvEH5TifCtohZaNkVNCWAtEYzBjSKnL,0.2"></textarea>
            </div>
            <p></p>
            <button className="px-16 m-2 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
              onClick={handleNextlick}>
              {t('multi.next')} </button>
            {
              isnextCheck &&
              <p>{t('multi.addr')} 【{tokencount}】   {t('multi.amount')} 【{tokenamount.toFixed(2)}】  {t('multi.hold')} 【{selectedOption.amount.toFixed(2)}】</p>
            }
          </div>

          <button className="px-16 m-2 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
            onClick={handleEnterbtnclick}>
            {t('multi.enter')} </button>
          {/* <p className="md:w-full md:text-1xl text-center text-slate-500 my-2 text-xs">{t('free.mt')}</p> */}
        </div>
      </div>
      <FloatButton tooltip={<div>{t('msgbox.fbtn')}</div>} onClick={() => setIsModalOpen(true)} />
      <MsgBoxView isModalOpen={isModalOpen} msgParam={messageBoxPam} handleCancel={() => { setIsModalOpen(false) }} />
      {isLoading && <Loading />}
    </div>
  );
};
