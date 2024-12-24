import { useConnection, useWallet, } from '@solana/wallet-adapter-react';
import { createMintTokenTransactionproc, createUpdateMetadataIx, disableAuthority, getmyTokenUri } from '../utils/web3';

import { FC, useCallback, useState } from 'react';
import { notify } from "../utils/notifications";
//import useUserSOLBalanceStore from '../stores/useUserSOLBalanceStore';
import {
    MINT_SIZE,
    TOKEN_PROGRAM_ID,
    createInitializeMintInstruction,
    getMinimumBalanceForRentExemptMint,
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    createMintToInstruction,
    transfer,
    createTransferCheckedInstruction,
    
} from "@solana/spl-token";

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { NetworkConfigurationProvider, useNetworkConfiguration } from 'contexts/NetworkConfigurationProvider';
import { WalletAdapterNetwork, WalletError } from '@solana/wallet-adapter-base';
import { useMemo } from 'react';
import {
    Metaplex,
    walletAdapterIdentity,
    irysStorage,
    toMetaplexFileFromBrowser,
} from "@metaplex-foundation/js";
import { keypairIdentity, createGenericFile } from '@metaplex-foundation/umi';
import { 
    LAMPORTS_PER_SOL, 
    TransactionSignature ,
    SystemProgram,
    Cluster, clusterApiUrl,
    TransactionMessage,
    VersionedTransaction,
    Keypair,
    PublicKey,
    Connection,
    Transaction,
    sendAndConfirmTransaction,
} from '@solana/web3.js';
import bs58 from 'bs58';
import { verify } from '@noble/ed25519';
import { useAnchorWallet, WalletContextState } from '@solana/wallet-adapter-react';
// Metaplex
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys';

import { API_KEY } from '../../constants';
import { log } from 'console';


const getNetworkConfig = (network) => {
    return network === "mainnet"
        ? {
            cluster: clusterApiUrl("mainnet-beta"),
            address: "https://node1.bundlr.network",
            providerUrl: "https://api.mainnet-beta.solana.com",
        }
        : {
            cluster: clusterApiUrl("devnet"),
            address: "https://devnet.bundlr.network",
            providerUrl: "https://api.devnet.solana.com",
        };
};

interface TestParamProps {
    selectedFile: File;
}

const uploadMetadata = async (metaplex, tokenMetadata) => {
    try {
        const { uri } = await metaplex.nfts().uploadMetadata(tokenMetadata);
        return uri;
    } catch (error) {
        console.error("Error uploading token metadata:", error);
        throw error;
    }
};

// const getimagejson = async()=>{
//     fetch('https://47kqnnakfpavzw4oj4n5m7ctf3of5nrozsfmksfjdlhbzuckl77a.arweave.net/59UGtAorwVzbjk8b1nxTLtxeti7MisVIqRrOHNBKX_4')
//     .then(response => response.json()) // 将响应解析为 JSON 格式
//     .then(data => {
//         // 在这里处理获取到的 JSON 数据
//         console.log(data);
//     })
//     .catch(error => {
//         // 处理错误情况
//         console.error('Error fetching JSON: ', error);
//     });
// }

async function getimagejson(jsonUrl) {
    try {
      const response = await fetch(jsonUrl); // 使用fetch()获取JSON数据
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const jsonData = await response.json(); // 将响应转换为文本
      return jsonData; // 返回文本数据
    } catch (error) {
      console.error('Error fetching JSON:', error);
      return jsonUrl; // 返回null或者其他适当的错误处理
    }
  }



  const getAssetsByOwner = async (url, myid) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: myid,
        method: 'getAssetsByOwner',
        params: {
          ownerAddress: '86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY',
          page: 1, // Starts at 1
          limit: 1000,
      displayOptions: {
          showFungible: true //return both fungible and non-fungible tokens
      }
        },
      }),
    });
    const { result } = await response.json();
    console.log("Assets by Owner: ", result.items);
  };

  

  const getTokenAccounts = async (url, parkey) => {
    //const fetch = (await import("node-fetch")).default;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "getTokenAccounts",
        id: "1",
        params: {
          page: 1,
          limit: 100,
          "displayOptions": {
              "showZeroBalance": false, 
          },
          owner: parkey,
        },
      }),
    });
    const data = await response.json();
  
    if (!data.result) {
      console.error("No result in the response", data);
      return;
    }
  
    console.log(JSON.stringify(data.result, null, 2));
  };
  
  //getTokenAccounts();

//getAssetsByOwner(); 

const getMetadata = async (url, nftAddresses) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mintAccounts: nftAddresses,
        includeOffChain: true,
        disableCache: false,
      }),
    });
  
    const data = await response.json();
    console.log("metadata: ", data);
  };
  

export const TestParam: FC<TestParamProps> = ({selectedFile}) => {
    const { connection } = useConnection();
    //const userWallet = Keypair.generate();
    const { publicKey , sendTransaction , signMessage, signTransaction, signAllTransactions } = useWallet();
    const { networkConfiguration } = useNetworkConfiguration();
      //const wallet = useAnchorWallet();
    
    const network = networkConfiguration as WalletAdapterNetwork;

    //这句好像是使用rpc相关的.
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);
    const wallet = useAnchorWallet();
    //const [mintKeypair, setTokenKeypair] = useState<Keypair | null>(null);
    // You can also provide a custom RPC endpoint.
//   const endpoint = useMemo(() => {
//     if (network === "mainnet-beta") {
//       return "https://swr.xnftdata.com/rpc-proxy/";
//     } else {
//       return clusterApiUrl(network);
//     }
//   }, [network]);
    const [metaplex, setMetaplex] = useState(null);
    const [signature, setSignature] = useState<string>("");
    
    
    const onClick = useCallback(async () => {
        //const connection = new Connection("https://solana-mainnet.core.chainstack.com/1a404624f4d24c3f11322e195faf25b0");
        
        if (publicKey) {
          
          // console.log(process.env.NEXT_PUBLIC_PAYTOADDRESS);
          // const money = Number(process.env.NEXT_PUBLIC_PRICE_CREATE);
          // const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
          // console.log(mykey.toString()+","+ money);
          // return;
            // console.log('钱包已链接'+publicKey.toString());
            // console.log('当前链接:'+clusterApiUrl(network));
            //return;
            //公钥地址指向钱包显示的地址  钱包已链接5qpH4oPbJGMGifhSCPUTX8gWaFCLQtofmmTYn9pFerEj
            //const str = 
            //getAssetsByOwner("https://mainnet.helius-rpc.com/?api-key=953eb10a-b5e0-4340-a480-da7b2a38c4a6", publicKey.toString());
            //https://api.helius.xyz/v0/token-metadata?api-key=<your-key>
            //953eb10a-b5e0-4340-a480-da7b2a38c4a6
            //getMetadata("https://api.helius.xyz/v0/token-metadata?api-key=953eb10a-b5e0-4340-a480-da7b2a38c4a6", publicKey.toString());
   
            //getTokenAccounts("https://mainnet.helius-rpc.com/?api-key=953eb10a-b5e0-4340-a480-da7b2a38c4a6", publicKey.toString());
            // {
            //     "total": 1,
            //     "limit": 100,
            //     "page": 1,
            //     "token_accounts": [
            //       {
            //         "address": "B1S1Q1Yf5faQZmdiNyeg18ToMDrJH6ZzdsDYZ7r5bFNb",   //不知道
            //         "mint": "DJxXb4xBv3BfxhLPPv5xdrPnQ69yoC3rVvC14GGMPj96",      //tokens地址
            //         "owner": "C15wuCYePWPJaRTimLxDgS8j7qewtUSnzKbcJiFUYuF3",     //我的地址
            //         "amount": 66462000000000,                                 //代币数量
            //         "delegated_amount": 0,
            //         "frozen": false
            //       }
            //     ]
            //   }

            //没有可操作的token
            // {
            //     "total": 0,
            //     "limit": 100,
            //     "page": 1,
            //     "token_accounts": []
            //   }
            //return;

            const tokenname = document.getElementById('tokenname') as HTMLInputElement | null;
            const tokencount = document.getElementById('tokencount') as HTMLInputElement | null;
            const tokendec = document.getElementById('tokendec') as HTMLInputElement | null;
            const tokenSymbol = document.getElementById('tokenSymbol') as HTMLInputElement | null;
            const userweb = document.getElementById('userweb') as HTMLInputElement | null;
            const tglink = document.getElementById('tglink') as HTMLInputElement | null;
            const xlink = document.getElementById('xlink') as HTMLInputElement | null;
            const dislink = document.getElementById('dislink') as HTMLInputElement | null;
            const des = document.getElementById('des') as HTMLInputElement | null;
            const tags = document.getElementById('tags') as HTMLInputElement | null;
            //const value = tokenname?.value;
            if (tokenname?.value=="")
            {
                notify({ type: 'error', message: '错误', description: '代币名称不能为空' });
                return;
            }
            if (tokenname?.value.length>15)
            {
                notify({ type: 'error', message: '错误', description: '代币名称长度不能大于15' });
                return;
            }
            if (tokenSymbol?.value=="")
            {
                notify({ type: 'error', message: '错误', description: '代币名称不能为空' });
                return;
            }
            if (tokenSymbol?.value.length>8)
            {
                notify({ type: 'error', message: '错误', description: '代币简称长度不能大于8' });
                return;
            }
            if (isNaN(Number(tokendec?.value)))
            {
                notify({ type: 'error', message: '错误', description: '代币精度请输入一个数字1-10' });
                return;
            }
            if (isNaN(Number(tokencount?.value)))
            {
                notify({ type: 'error', message: '错误', description: '代币总数必须为数字' });
                return;
            }

            // const mysiyao = "4vZ3FGd9NaGwpBJNDyahMJuiTxCESrbFiETDa1qUCgC5xnbBCrBftfF2r2aV1qZasnnVmKLDrdoKMthkd9V7371W";
            // const userWallet1 = Keypair.fromSecretKey(bs58.decode(mysiyao));
            // console.log(userWallet1);
            // return;
            
            
            //return;
            const userinput={
                decimals: tokendec?.value,
                supply: tokencount?.value,
                tokenName: tokenname?.value,
                symbol: tokenSymbol?.value,
                //image:  ???还不知道怎么弄
                web: userweb?.value,
                tglink: tglink?.value,
                xlink: xlink?.value,
                dislink: dislink?.value,
                description: des?.value,
                tags:tags?.value,
                image:"",
            };

            if(selectedFile)
            {
              // 使用 split() 方法将字符串分割成单词
            const words = userinput.tags.split(',');
            // 创建一个新的数组，包含分割后的单词
            const wordArray = words.map(word => word.trim());
            console.log(wordArray);

              // let mintKeypair = Keypair.generate();
              // console.log("生成的token地址: " + mintKeypair.publicKey.toString());
              // console.log("生成的token秘钥: " + bs58.encode(mintKeypair.secretKey));
              console.log('sendfile:', selectedFile);
              const resjs = await getmyTokenUri(selectedFile, userinput.tokenName, userinput.symbol, userinput.description,
                userinput.web, userinput.tglink, userinput.xlink, wordArray);
              console.log(resjs);
            }
            return;

 
            //return;
            //构造token
          //   const token = {
          //       decimals: parseInt(userinput.decimals),
          //       totalSupply: parseFloat(userinput.supply),
          //   };
          //   //const test=process.env.REACT_APP_KEY_MYKEY;
          //   console.log(API_KEY);
          //   return;
          //   //=================
          //   try {
          //       //===========放弃权限应该成功了!
          //       const addr = new PublicKey(userinput.web);
          //       const mintIx = await disableAuthority(connection, addr, publicKey, true, true);
          //       mintIx.feePayer = wallet.publicKey;
          //       mintIx.recentBlockhash = (await connection.getRecentBlockhash("max")).blockhash;
          //       //mintIx.partialSign(addr);
          //       const signedTx = await wallet.signTransaction(mintIx);
          //       const wireTx = signedTx.serialize();
          //       const mintSignature = await connection.sendRawTransaction(wireTx, { skipPreflight: true });
          //       setSignature(mintSignature);
          //       if (mintSignature)
          //           console.log("success", "Succeed to revoke mint authority!");
          //       else
          //           console.log("warning", "Failed to revoke mint authority!");
          //   }
          //   catch (err) {
          //       console.log(err);
          //       console.log("warning", "Failed to revoke mint authority!");
          //   }
          //   return;


          // console.log("Making metaplex...");
          //   const newMetaplex = Metaplex.make(connection)
          //       .use(irysStorage(
          //           {
          //               address: 'https://devnet.bundlr.network',  ///////////==========注意这里用的是开发网
          //               providerUrl: 'https://api.devnet.solana.com',
          //               timeout: 60000,
          //           }
          //       ))
          //       .use(walletAdapterIdentity({
          //           publicKey,
          //           signMessage,
          //           signTransaction,
          //           signAllTransactions
          //       }));
          //   setMetaplex(newMetaplex);
          //   console.log("Getting token accounts...");
          //   let imageuri="";
          //   //以下是上传图片相关的
          //   if (selectedFile) {
          //       console.log("upload logo")
          //       const uplimg = await newMetaplex.nfts().uploadMetadata({
          //           name: userinput.tokenName,
          //           symbol: userinput.symbol,
          //           description: "",
          //           image: await toMetaplexFileFromBrowser(selectedFile),
          //       });
          //       let imageurijs = await getimagejson(uplimg.uri);
          //       if(imageurijs.hasOwnProperty("image"))
          //       {
          //           imageuri=imageurijs["image"];
          //       }else{
          //           imageuri=imageurijs;
          //       }
          //       console.log("upload logo success. :" + imageuri);
          //       //返回:https://47kqnnakfpavzw4oj4n5m7ctf3of5nrozsfmksfjdlhbzuckl77a.arweave.net/59UGtAorwVzbjk8b1nxTLtxeti7MisVIqRrOHNBKX_4
          //       //数据:{"name":"asfasdf","symbol":"123123","description":"","image":"https://arweave.net/-6S08eWis7pYO8y_s5rzXU4sM70lBz3J1e4Y9uwqnJ4"}
          //       //console.log(uri);
          //       //return;
          //   }
          //   else{
          //       console.log("未选择logo文件");
          //       return;
          //   }
            
          //   // 使用 split() 方法将字符串分割成单词
          //   const words = userinput.tags.split(',');
          //   // 创建一个新的数组，包含分割后的单词
          //   const wordArray = words.map(word => word.trim());
          //   console.log(wordArray);

            
          //   //-----------------
          //   const tokenMetadata = {
          //       name: userinput.tokenName,
          //       symbol: userinput.symbol,
          //       image: imageuri,  //这里先指定
          //       description: userinput.description,
          //       extensions:{
          //           website:userinput.web,
          //           telegram:userinput.tglink,
          //           twitter:userinput.xlink
          //       },
          //       tags:wordArray, 
          //   };
          //   console.log("tokenMetadata:");
          //   console.log(tokenMetadata);
           
          //   console.log("upload TokenUriData");
          //   const uplmetadata = await newMetaplex.nfts().uploadMetadata(tokenMetadata);
          //   const tokenuri = uplmetadata.uri;
          //   console.log("TokenUriData upload success. :"+{tokenuri});
          //   //    返回: https://arweave.net/hmNV7LlkLSYU_9e7Y4LkhGd3RSDV0DtYuwe9Ngl4pS4
          //   //    数据: {"name":"My NFT Metadata","description":"My description","image":"https://placekitten.com/20/30","attributes":[{"trait_type":"Genre","value":"Cat"}]}
          //   //console.log(uri) 
          //   //============上传元数据成功------------!!!!!!!!!!
          //   //return;

            
            

            
            

          //   //================铸造代币函数----------------已ok有一些细节比如小数点需要修改
          //   //==============生成地址

          //   let mintKeypair = Keypair.generate();
          //   console.log("生成的token地址: " + mintKeypair.publicKey.toString());
          //   //console.log("生成的token秘钥: " + bs58.encode(mintKeypair.secretKey));
          //   const mintIx = await createMintTokenTransactionproc(
          //       connection,
          //       wallet.publicKey,
          //       mintKeypair,
          //       token.decimals,
          //       token.totalSupply,
          //       tokenuri,
          //       userinput.tokenName,
          //       userinput.symbol,
          //       false,
          //       false                
          //     );
        
          //     mintIx.feePayer = wallet.publicKey;
          //     mintIx.recentBlockhash = (await connection.getRecentBlockhash("max")).blockhash;
          //     mintIx.partialSign(mintKeypair);
          //     const signedTx = await wallet.signTransaction(mintIx);
          //     const wireTx = signedTx.serialize();
          //     const mintSignature = await connection.sendRawTransaction(wireTx, { skipPreflight: true });
          //     setSignature(mintSignature);
          //     //console.log(mintSignature);
          //     console.log("交易完成!!!!!!");
          //     console.log("token地址:"+mintKeypair.publicKey.toString());
          //     return;          
        }
        else{
            notify({ type: 'error', message: '错误', description: '钱包未链接...' });
            console.log('error', 'wallet not connect!');
            return;
        }

    }, [notify, sendTransaction, selectedFile]);
    /**
     * 在 [selectedFile] 后面的这个数组表示 useCallback 钩子的依赖项列表。

    useCallback 是 React 提供的一个钩子，用于创建一个记忆化的回调函数。当依赖项列表中的值发生变化时，useCallback 返回的回调函数会重新生成，否则会复用之前的回调函数。
     */

    return (
        <button
            className="px-16 m-2 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
            onClick={onClick}
            >
                <span>确定创建 </span>

        </button>      
    );
};

