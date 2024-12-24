// Next, React
import { FC, useEffect, useState } from 'react';
// Wallet
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import Select from 'react-select';
import { notify } from 'utils/notifications';
import { burntokensAndcloseacc, burntokens } from '../../utils/web3';
import { getTokenAccounts, getMetadata, getImageUri, truncateString, getTokenListByShyft } from '../../utils/gettoken';
import Loading from 'components/Loading';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { useTranslation } from 'next-i18next'
import { ExtensionType, TOKEN_PROGRAM_ID, getAccount, getAssociatedTokenAddress, getExtensionData, getExtraAccountMetaAddress, getExtraAccountMetas, getMetadataPointerState, getMint, getMintCloseAuthority, getTokenMetadata, resolveExtraAccountMeta } from '@solana/spl-token';
import { getTokenMetadataProc } from 'utils/getTokenMetadataA';
import LogoImage from 'utils/imageParam';


let tokenlist = [];

export const BurnView: FC = ({ }) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signMessage, signTransaction, signAllTransactions } = useWallet();
  const [isChecked, setisChecked] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [options, setOptions] = useState([]);
  const [tokentotal, setTokentotal] = useState(0);
  const [signature, setSignature] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation('common')


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
        const tokendec = tokenlist[i].dec;
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
                <span className="text-rose-400 text-sm">余额: {tokenlist[i].amount / Math.pow(10, tokendec)}</span>
              </div>,
            mint: tokenlist[i].label,
            amount: tokenlist[i].amount / Math.pow(10, tokendec),
            address: tokenlist[i].address,
            dec: tokendec,
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
          //setOptions(prevOptions => [...prevOptions, newOption]);
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
    const freeAccount = document.getElementById('freeAccount') as HTMLInputElement | null;
    const amount = document.getElementById('burnamount') as HTMLInputElement | null;
    let tokendec = selectedOption.dec;
    if (!tokendec) (tokendec = 9);
    console.log("tokendec:", tokendec);
    const burnamount = Number(amount?.value) * Math.pow(10, tokendec);

    console.log(burnamount);
    const isFreeAccount = freeAccount.checked;
    if (isFreeAccount) {
      const burnAmtVal =   Math.floor(Number(selectedOption.amount) * Math.pow(10, 9));
      const mintIx = await burntokensAndcloseacc(connection, selectedOption.address, selectedOption.mint, publicKey, burnAmtVal);
      mintIx.feePayer = wallet.publicKey;
      mintIx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      //mintIx.partialSign(addr);
      const signedTx = await wallet.signTransaction(mintIx);
      const wireTx = signedTx.serialize();
      const mintSignature = await connection.sendRawTransaction(wireTx, { skipPreflight: true });
      setSignature(mintSignature);
      if (mintSignature) {
        notify({ type: "success", message: "完成.." });
        console.log("success", "Succeed to revoke mint authority!");
      }
      else {
        console.log("warning", "Failed to revoke mint authority!");
      }
    } else {
      console.log(selectedOption.address);
      console.log(selectedOption.mint);
      try {

        const mintIx = await burntokens(connection, selectedOption.address, selectedOption.mint, publicKey, burnamount);
        mintIx.feePayer = wallet.publicKey;
        mintIx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        const signedTx = await wallet.signTransaction(mintIx);
        const wireTx = signedTx.serialize();
        const mintSignature = await connection.sendRawTransaction(wireTx, { skipPreflight: true });
        setSignature(mintSignature);
        if (mintSignature) {
          notify({ type: "success", message: "完成.." });
          console.log(mintSignature);
          console.log("success", "Succeed to revoke mint authority!");
        }
        else {
          console.log("warning", "Failed to revoke mint authority!");
        }
      } catch (err) {
        notify({ type: "error", message: "错误,交易失败" });
        console.log(err);
      }
    }
    return;
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
                <span className="text-gray-400 text-sm">余额:{tokenlist[i].amount}</span>
              </div>,
            //<div style={{display: 'flex', justifyContent: 'space-between'}}>Tokens - {tokenlist[i].label}<span style={{fontSize: '0.8em'}}>余额:{roundUp(tokenlist[i].amount  / Math.pow(10, 9))}</span></div>, 
            mint: tokenlist[i].label,
            amount: tokenlist[i].amount,
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

  //----------这个函数的返回类似那个Gettokens
  const handletestproc = async () => {                      //CzGMUqihFwG7zxwLqTqrpDTdXQGoY71B87yk8nQsLo5U
    //console.log(connection.getAccountInfo(publicKey));  //DJxXb4xBv3BfxhLPPv5xdrPnQ69yoC3rVvC14GGMPj96



    const addr = new PublicKey("BaBVZzK595vXBwq5S6RJecP7rZ54iV6hjyo6KLBLKJH");
    const Mint = await getMint(connection, addr);
    console.log(Mint.freezeAuthority);  //冻结权限  一个publick.toString()地址或Null
    console.log(Mint.mintAuthority);  //Mint权限   一个publick.toString()地址或Null
    //supply 总量
    //decimals  dec
    console.log(Mint);



    //-------------获取元数据
    const a = await getTokenMetadataProc(connection, addr);
    // 创建一个 TextDecoder 对象
    const decoder = new TextDecoder('utf-8'); // 指定字符编码为 UTF-8

    // 使用 TextDecoder 解码 Uint8Array 数组并转换为字符串
    // const base64 = Buffer.from(a.data, 'base64');
    // //const base64 = atob(a.data);
    console.log(a);

    //    {
    //     "key": 4,
    //     "updateAuthority": "Gge3dSAbiaNheY5fA4qsaAvvK6ZqSaQSBBE1PArYitBZ",
    //     "mint": "BaBVZzK595vXBwq5S6RJecP7rZ54iV6hjyo6KLBLKJH",
    //     "data": {
    //         "name": "FROTH\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000",
    //         "symbol": "FROTH\u0000\u0000\u0000\u0000\u0000",
    //         "uri": "https://ipfs.io/ipfs/QmRyCfNeRTpKGEzaSjBUMpmgusqt91qWYWC5bQXK8uWT2M\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000",
    //         "sellerFeeBasisPoints": 0,
    //         "creators": null
    //     },
    //     "primarySaleHappened": false,
    //     "isMutable": false,
    //     "editionNonce": 254,
    //     "tokenStandard": 2,
    //     "collection": null,
    //     "uses": null,
    //     "collectionDetails": null,
    //     "programmableConfig": null
    // }
    // console.log(base64);
    //const str = decoder.decode(a.data);
    //console.log(str);
    //还有一段乱码


    // console.log('a',addr);
    //     const tokenAccountPubkey = new PublicKey(
    //   "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
    // );

    // const a  = getExtraAccountMetaAddress(addr,tokenAccountPubkey );
    // console.log(a.toString());

    //resolveExtraAccountMeta()
    // const associatedTokenAccount = await getAssociatedTokenAddress(
    //   tokenAccountPubkey,  //Mint
    //   publicKey,                   //转账人
    // );
    //console.log(associatedTokenAccount.toString());

    // const METADATA_PROGRAM_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
    // const [metadataAddress] = await PublicKey.findProgramAddressSync(
    //   [
    //     Buffer.from("metadata"),
    //     (new PublicKey(METADATA_PROGRAM_ID)).toBuffer(),
    //     addr.toBuffer()
    //   ],
    //   new PublicKey(METADATA_PROGRAM_ID)
    // )

    //const MetaData = await getExtensionData(ExtensionType.TokenMetadata, Mint.tlvData);
    //const MetaData = getExtraAccountMetaAddress(addr, TOKEN_PROGRAM_ID)
    //const a =await getTokenMetadata(connection, addr);
    //console.log("MetaData",MetaData);
    //console.log("a",a);


    //可能有用的函数
    //getMultipleAccounts获取多个账户
    //getTokenMetadata
    //isMint   ??
    //tokenMetadataUpdateAuthority  元数据更新权限



    // const closeAuthority = getMintCloseAuthority(Mint)
    // console.log(closeAuthority);
    // const tokenAccountPubkey = new PublicKey(
    //   "DJxXb4xBv3BfxhLPPv5xdrPnQ69yoC3rVvC14GGMPj96"
    // );


    // const associatedTokenAccount = await getAssociatedTokenAddress(
    //   tokenAccountPubkey,  //Mint
    //   publicKey,                   //转账人
    // );
    // console.log("ata:",associatedTokenAccount);
    //ret = B1S1Q1Yf5faQZmdiNyeg18ToMDrJH6ZzdsDYZ7r5bFNb
    // let tokenAccount = await getAccount(connection, associatedTokenAccount);
    // console.log("tokenAccount:",tokenAccount);

    // console.log("1111111");
    // const OPENBOOK_DEX="srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX";
    // const OPENBOOK_DEX_Devnet = "EoTcMgcDRTJVZDMZWBoU6rhYHZfkNTVEAfz3uUJRcYGj";
    // //TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
    // const program = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
    // const MY_WALLET_ADDRESS = "Ef6rCcMG1xxdwo3fejio8JTff15DEvLRxduxafKsPNGt";
    // const accounts = await connection.getParsedProgramAccounts(
    //   program, // new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
    //   {
    //     filters: [
    //       {
    //         dataSize: 165, // number of bytes
    //       },
    //       {
    //         memcmp: {
    //           offset: 32, // number of bytes
    //           bytes: MY_WALLET_ADDRESS, // base58 encoded string
    //         },
    //       },
    //     ],

    //   }
    // );

    // console.log(
    //   `Found ${accounts.length} token account(s) for wallet ${MY_WALLET_ADDRESS}: `
    // );
    // accounts.forEach((account, i) => {
    //   console.log(
    //     `-- Token Account Address ${i + 1}: ${account.pubkey.toString()} --`
    //   );
    //   console.log(`Mint: ${account.account.data["parsed"]["info"]["mint"]}`);
    //   console.log(
    //     `Amount: ${account.account.data["parsed"]["info"]["tokenAmount"]["uiAmount"]}`
    //   );
    //   console.log("acc:",account);
    // });

    //返回值账户中的所有地址
    //   {
    //     "account": {
    //         "data": {
    //             "parsed": {
    //                 "info": {
    //                     "isNative": false,
    //                     "mint": "B2eU54HAms5qerDQSY88FLPMBAhRJjuXQMdqe8APRFJL",   //Mint地址
    //                     "owner": "C15wuCYePWPJaRTimLxDgS8j7qewtUSnzKbcJiFUYuF3",
    //                     "state": "initialized",
    //                     "tokenAmount": {
    //                         "amount": "97329123393646",     //"数量"
    //                         "decimals": 9,                  //"小数"
    //                         "uiAmount": 97329.123393646,
    //                         "uiAmountString": "97329.123393646"
    //                     }
    //                 },
    //                 "type": "account"         //类型
    //             },
    //             "program": "spl-token",         //"类型"
    //             "space": 165
    //         },
    //         "executable": false,
    //         "lamports": 2039280,
    //         "owner": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    //         "rentEpoch": 18446744073709552000,
    //         "space": 165
    //     },
    //     "pubkey": "72bH8C7JD9fXNVGby8WvxzTrhxeMu9PS4yyVYbPVkBhF"
    // }


    //------
    // const MY_PROGRAM_ID = new PublicKey("B1S1Q1Yf5faQZmdiNyeg18ToMDrJH6ZzdsDYZ7r5bFNb");
    // let accounts
    // try{
    //   console.log("333");
    // accounts = await connection.getProgramAccounts(MY_PROGRAM_ID);
    // }catch(err){
    //   console.log("err",err);
    // }
    // console.log("222");

    // console.log(`Accounts for program ${MY_PROGRAM_ID}: `);
    // console.log(accounts);
  }

  const handletestproc2 = () => {
    const rpclist = ["rpc", "rpc2", "rpc3"];
    console.log(rpclist);
    for (let i = 0; i < rpclist.length; i++) {
      console.log(rpclist[i]);
    }

  }


  return (

    <div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col">
        <div className='mt-6'>
          <h1 className="text-center text-4xl md:pl-12 text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-4">
            {t('burn.t1')}
          </h1>
          {/* <button onClick={handletestproc}>获取程序地址</button> */}
          {/* <button onClick={handletestproc2}>test2</button> */}
        </div >
        <div className="text-center mt-6">
          <div>
            {/* <div>
              <button className="px-16 m-2 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                onClick={handleFilterclick}>
                {t('burn.filtr')} </button>
            </div> */}

            {/* <span className="pointer-events:none">选择您的代币</span>'` */}
            {/* <span className="pointer-events:none">{tokentotal===0 ? "当前钱包没有Tokens" : `当前钱包拥有: ${tokentotal} 个Tokens` }</span>  */}
            <div className="md:w-[450px]">

              <div className="text-left">
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
              </div>

              <input id="burnamount" className="max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] p-2 px-10 my-2" placeholder={t('burn.burnamount')}></input>
              {/* <input type="checkbox" id="freeAccount" className="form-checkbox h-6 w-6 text-indigo-600 rounded-md ml-10 mt-4" />
                <span className="pointer-events:none ml-2">燃烧全部并关闭账户</span> */}
              <label htmlFor="freeAccount" className="inline-flex items-center">
                <input
                  type="checkbox"
                  id="freeAccount"
                  className="form-checkbox h-6 w-6 text-indigo-600 rounded-md ml-2 mt-1"
                />
                <span className="pointer-events:none ml-2">{t('burn.burnandfree')}</span>
              </label>

              <button className="px-16 m-2 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                onClick={handleEnterbtnclick}>
                {t('burn.enter')} </button>

              {/* <p className="md:w-full md:text-1xl text-center text-slate-500 my-2 text-xs">{t('free.all')}</p> */}
            </div>
          </div>
        </div>
      </div>
      {isLoading && <Loading />}
    </div>
  );
};
