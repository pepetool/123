// Next, React
import { FC, useEffect, useState } from 'react';
// Wallet
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import Select from 'react-select';
import { notify } from 'utils/notifications';
import { burntokensAndcloseacc, burntokens, setMintTokenProc } from '../../utils/web3';
import { getTokenAccounts, getMetadata, getImageUri, truncateString, getTokenListByShyft } from '../../utils/gettoken';
import Loading from 'components/Loading';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { useTranslation } from 'next-i18next'
import { ExtensionType, TOKEN_PROGRAM_ID, getAccount, getAssociatedTokenAddress, getExtensionData, getExtraAccountMetaAddress, getExtraAccountMetas, getMetadataPointerState, getMint, getMintCloseAuthority, getTokenMetadata, resolveExtraAccountMeta } from '@solana/spl-token';
import { getTokenMetadataProc } from 'utils/getTokenMetadataA';
import LogoImage from 'utils/imageParam';
import { Typography } from 'antd';


let tokenlist = [];



export const MintView: FC = ({ }) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signMessage, signTransaction, signAllTransactions } = useWallet();
  const [isChecked, setisChecked] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [options, setOptions] = useState([]);
  const [tokentotal, setTokentotal] = useState(0);
  const [signature, setSignature] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation('common');
  const { Text } = Typography;


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

  const [imageSrc, setImageSrc] = useState(null);



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
                  <span className="text-rose-600 ml-2">{tokenlist[i].symbol}</span>
                  <span className="text-stone-400 text-xs ml-2">{truncateString(tokenlist[i].label, 16, 8, 8)}</span>
                </div>
                <span className="text-rose-400 text-sm">余额: {tokenlist[i].amount / Math.pow(10, 9)}</span>
              </div>,
            mint: tokenlist[i].label,
            amount: tokenlist[i].amount / Math.pow(10, 9),
            address: tokenlist[i].address,
            dec: tokenlist[i].dec,
          };
          setOptions(prevOptions => [...prevOptions, newOption]);
          // // 异步加载图片并更新newOption
          // const fetchImage = async () => {
          //   try {
          //     const imageUri = await getImageUri(tokenlist[i].uri);
          //     newOption.label = (
          //       <div className="flex justify-between">
          //         <div className="flex items-center">
          //           <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200">
          //             <LogoImage src={await getImageUri(tokenlist[i].uri)} alt='LOGO' />
          //           </div>
          //           <span className="text-rose-600 ml-2">{tokenlist[i].symbol}</span>
          //           <span className="text-stone-400 text-xs ml-2">{truncateString(tokenlist[i].label, 16, 8, 8)}</span>
          //         </div>
          //         <span className="text-rose-400 text-sm">余额: {tokenlist[i].amount / Math.pow(10, 9)}</span>
          //       </div>
          //     );
          //     setOptions(prevOptions => [...prevOptions, newOption]);
          //   } catch (error) {
          //     console.error('Error fetching image:', error);
          //   }
          // };

          // fetchImage(); // 启动异步加载
          // //setOptions(prevOptions => [...prevOptions, newOption]);
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

  const handleChange = selectedOption => {
    setSelectedOption(selectedOption);
  };

  const handleFilterclick = () => {
    //const { publicKey } = useWallet();
    displaytokentocombox(false, publicKey.toString());
  }

  //确定燃烧
  const handleEnterbtnclick = async () => {

    if (!publicKey) {
      notify({ type: "error", message: "提示", description: "请先连接钱包!" });
      return;
    }

    if (!selectedOption) {
      notify({ type: "error", message: "提示", description: "请先选择要增发的代币!" });
      return;
    }
    // console.log(selectedOption.dec);
    // return;
    const dec = Number(selectedOption.dec);
    const amount = document.getElementById('mintamount') as HTMLInputElement | null;
    const mintAmount = Number(amount?.value) * Math.pow(10, dec);

    // console.log(amount?.value);
    // return;

    console.log(selectedOption.address);
    console.log(selectedOption.mint);
    setIsLoading(true);
    try {
      const mintIx = await setMintTokenProc(publicKey, new PublicKey(selectedOption.mint), dec, mintAmount);
      mintIx.feePayer = wallet.publicKey;
      mintIx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      const signedTx = await wallet.signTransaction(mintIx);
      const wireTx = signedTx.serialize();
      const mintSignature = await connection.sendRawTransaction(wireTx, { skipPreflight: true });
      setSignature(mintSignature);
      setIsLoading(false);
      if (mintSignature) {
        notify({ type: "success", message: "完成", description:"交易已发送" });
        console.log(mintSignature);
        console.log("success", "Succeed to revoke mint authority!");
      }
      else {
        console.log("warning", "Failed to revoke mint authority!");
      }
    } catch (err) {
      setIsLoading(false);
      notify({ type: "error", message: "错误,交易未完成" });
      console.log(err);
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
  //           setTokentotal(reJson.result.total);

  //           let nftAddr = [];
  //           for (let i = 0; i < reJson.result.token_accounts.length; i++) {
  //             tokenlist.push({
  //               value: i,
  //               label: reJson.result.token_accounts[i].mint,
  //               address: reJson.result.token_accounts[i].address,
  //               amount: reJson.result.token_accounts[i].amount
  //             });
  //             nftAddr.push(reJson.result.token_accounts[i].mint);
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
  //               let tokendec;
  //               try {
  //                 //onChainAccountInfo
  //                 tokendec = metaJson[i].onChainAccountInfo.accountInfo.data.parsed.info.decimals;
  //               } catch (err) {
  //                 console.log("获取代币dec失败");
  //               }
  //               if (metadata) {
  //                 medaList.push({
  //                   account: acc,
  //                   isToken: true,
  //                   symbol: metadata.data.symbol,
  //                   uri: metadata.data.uri,
  //                   updateAuthority: metadata.updateAuthority,
  //                   dec: tokendec,
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





  return (

    <div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col">
        <div className='mt-6'>
          <h1 className="text-center text-4xl md:pl-12 text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-4">
            代币增发
          </h1>
          <h1 className="text-center text-1xl md:p-0 md:pl-12 text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500">
            未丢弃代币增发权限，即可在这里增发代币。
          </h1>
          {/* <button onClick={handletestproc}>获取程序地址</button> */}
          {/* <button onClick={handletestproc2}>test2</button> */}
        </div >
        <div className="text-center mt-6">
          <div>
            <div className="md:w-[450px]">
              <div className="text-left">
                <Select
                  value={selectedOption}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  //onMenuOpen={handleMenuClick}
                  options={options}
                  isMulti={false} // 如果想要多选，则设置为true
                  className="text-black" // 使用 Tailwind 的 text-black 类来修改字体颜色
                />
              </div>

              {/* <p><Text type="danger">条件: 1.你是代币的创建者  2.未丢弃代币增发权限</Text></p> */}
              <input id="mintamount" className="max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] p-2 my-2 w-80" placeholder="请输入要增发的数量"></input>

              <button className="px-16 m-2 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                onClick={handleEnterbtnclick}>
                确定增发
              </button>

              {/* <p className="md:w-full md:text-1xl text-center text-slate-500 my-2 text-xs">{t('free.all')}</p> */}

            </div>
          </div>
        </div>
      </div>
      {isLoading && <Loading />}
    </div>
  );
};
