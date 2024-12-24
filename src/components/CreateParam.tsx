import { useConnection, useWallet, } from '@solana/wallet-adapter-react';
import { createMintTokenTransactionproc, getmyTokenUri } from '../utils/web3';

import { FC, useCallback, useState } from 'react';
import { notify } from "../utils/notifications";

import {
    Metaplex,
    walletAdapterIdentity,
    irysStorage,
    toMetaplexFileFromBrowser,
} from "@metaplex-foundation/js";
import { 
    LAMPORTS_PER_SOL, 
    Keypair,
} from '@solana/web3.js';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import Loading from './Loading';
import { useTranslation } from 'next-i18next'
import { t } from 'i18next';

import type { GetStaticProps } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { FloatButton } from 'antd';
import MsgBoxView, { MessageBoxPam, useMessageBoxPam } from 'views/msgbox';





interface CreateParamProps {
    selectedFile: File;
}


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

  

export const CreateParam: FC<CreateParamProps> = ({selectedFile}) => {
    const { connection } = useConnection();
    const { publicKey , sendTransaction , signMessage, signTransaction, signAllTransactions } = useWallet();
    //const { networkConfiguration } = useNetworkConfiguration();
    
    //const network = networkConfiguration as WalletAdapterNetwork;
    const wallet = useAnchorWallet();
    const [metaplex, setMetaplex] = useState(null);
    const [signature, setSignature] = useState<string>("");
    const [tokenAddress, setTokenAddress] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
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

    //const { endpoint } = 
    //const { getUserSOLBalance } = useUserSOLBalanceStore();
    
    const onClick = useCallback(async () => {
        //const connection = new Connection("https://solana-mainnet.core.chainstack.com/1a404624f4d24c3f11322e195faf25b0");
        //const connect = new Connection(process.env.NEXT_PUBLIC_DEBUG==="true" ? process.env.NEXT_PUBLIC_HELTUS_TOKEN_DEV : process.env.NEXT_PUBLIC_HELIUS_TOKEN_MAIN);
        if (publicKey) {
            // setTokenAddress("5qpH4oPbJGMGifhSCPUTX8gWaFCLQtofmmTYn9pFerEj");
            // return;  
            // console.log('钱包已链接'+publicKey.toString());
            // console.log('当前链接:'+clusterApiUrl(network));
            //return;
            //公钥地址指向钱包显示的地址  钱包已链接5qpH4oPbJGMGifhSCPUTX8gWaFCLQtofmmTYn9pFerEj
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

            const freeys = document.getElementById('freeys') as HTMLInputElement | null;
            const minttoken = document.getElementById('freemint') as HTMLInputElement | null;
            const freeAccount = document.getElementById('freeacc') as HTMLInputElement | null;
            const isMintToken = minttoken.checked;
            const isFreeAccount = freeAccount.checked;
            const isFreeYs = freeys.checked;
            //const isselfupload = document.getElementById('isselfupload') as HTMLInputElement | null;
            

            // console.log(tokenAddr?.value+","+minttoken?.value+","+freeAccount?.value);
            //const isSelfload = isselfupload.checked;
            const isSelfload = false;
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
            if (tokenSymbol?.value.length>15)
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
            if (!selectedFile) {
                notify({ type: 'error', message: '错误', description: '请选择logo文件' });
                return;
            }
            
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

            const token = {
                decimals: parseInt(userinput.decimals),
                totalSupply: parseFloat(userinput.supply),
            };
           let tokenuri;
           // 使用 split() 方法将字符串分割成单词
           const words = userinput.tags.split(',');
           // 创建一个新的数组，包含分割后的单词
           const wordArray = words.map(word => word.trim());
           
           console.log(wordArray);
           if (selectedFile) {
                if(isSelfload)
                {
                    console.log("Making metaplex...");
                    const newMetaplex = Metaplex.make(connection)
                        .use(
                            irysStorage(
                                {
                                address: process.env.NEXT_PUBLIC_NODE,  //上传检查api
                                providerUrl: process.env.NEXT_PUBLIC_RPC,//RPC
                                timeout: 60000,
                                }
                            )
                        )
                        .use(walletAdapterIdentity({
                            publicKey,
                            signMessage,
                            signTransaction,
                            signAllTransactions
                        }));
                    setMetaplex(newMetaplex);
                    console.log("Getting token accounts...");
                    let imageuri="";
                    //以下是上传图片相关的
                    
                    console.log("upload logo")
                    const uplimg = await newMetaplex.nfts().uploadMetadata({
                        name: userinput.tokenName,
                        symbol: userinput.symbol,
                        description: userinput.description,
                        image: await toMetaplexFileFromBrowser(selectedFile),
                    });
                    console.log("getimagejson...")
                    let imageurijs = await getimagejson(uplimg.uri);
                    if(imageurijs.hasOwnProperty("image"))
                    {
                        imageuri=imageurijs["image"];
                    }else{
                        console.log("GetImage Json Error")
                        imageuri=imageurijs;
                    }
                    console.log("upload logo success. :" + imageuri);
                    //返回:https://47kqnnakfpavzw4oj4n5m7ctf3of5nrozsfmksfjdlhbzuckl77a.arweave.net/59UGtAorwVzbjk8b1nxTLtxeti7MisVIqRrOHNBKX_4
                    //数据:{"name":"asfasdf","symbol":"123123","description":"","image":"https://arweave.net/-6S08eWis7pYO8y_s5rzXU4sM70lBz3J1e4Y9uwqnJ4"}
                    //console.log(uri);
                    //return;
                    
                    
                    

                    //-----------------
                    const tokenMetadata = {
                        name: userinput.tokenName,
                        symbol: userinput.symbol,
                        image: imageuri,  //这里先指定
                        description: userinput.description,
                        extensions:{
                            website:userinput.web,
                            telegram:userinput.tglink,
                            twitter:userinput.xlink
                        },
                        tags:wordArray, 
                    };
                    console.log("tokenMetadata:");
                    console.log(tokenMetadata);
                
                    console.log("upload TokenUriData");
                    const uplmetadata = await newMetaplex.nfts().uploadMetadata(tokenMetadata);
                    tokenuri = uplmetadata.uri;
                    console.log("TokenUriData upload success. :" + {tokenuri});
                    //    返回: https://arweave.net/hmNV7LlkLSYU_9e7Y4LkhGd3RSDV0DtYuwe9Ngl4pS4
                    //    数据: {"name":"My NFT Metadata","description":"My description","image":"https://placekitten.com/20/30","attributes":[{"trait_type":"Genre","value":"Cat"}]}
                    //console.log(uri) 
                    //============上传元数据成功------------!!!!!!!!!!
                    //return;        
                } else {
                    setIsLoading(true);
                    try{
                        const jsonuri =await getmyTokenUri(selectedFile, userinput.tokenName, userinput.symbol, userinput.description, userinput.web, 
                        userinput.tglink, userinput.xlink, wordArray);
                        setIsLoading(false);
                        if(jsonuri!="error")
                        {
                            tokenuri= jsonuri;
                            console.log(jsonuri);
                        } else {
                            notify( {type:"error", message:"上传元数据失败,请尝试勾选自行上传"} );
                            return;   
                        }
                    }catch(err){
                        setIsLoading(false);
                        notify( {type:"error", message:"上传元数据失败,请尝试勾选自行上传#"} );
                        return; 
                    }
                    
                }
            }
            else{
                notify( {type:"error", message:"未选择logo文件"} );
                return;
            }
            //return;
           

            //================铸造代币函数----------------已ok有一些细节比如小数点需要修改
            //==============生成地址
            try{
                let mintKeypair = Keypair.generate();
                console.log("生成的token地址: " + mintKeypair.publicKey.toString());
                //console.log("生成的token秘钥: " + bs58.encode(mintKeypair.secretKey));
                console.log(isFreeYs);
                const mintIx = await createMintTokenTransactionproc(
                    connection,
                    wallet.publicKey,
                    mintKeypair,
                    token.decimals,
                    token.totalSupply,
                    tokenuri,
                    userinput.tokenName,
                    userinput.symbol,
                    isMintToken,
                    isFreeAccount,
                    isFreeYs                
                );
        
                //   mintIx.feePayer = wallet.publicKey;       
                //                                            //getRecentBlockhash替换
                //   mintIx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
                //   mintIx.partialSign(mintKeypair);
                //   const signedTx = await wallet.signTransaction(mintIx);
                //   const wireTx = signedTx.serialize();
                //   const mintSignature = await connection.sendRawTransaction(wireTx, { skipPreflight: true });
                //   setSignature(mintSignature);
                //   console.log("交易完成!!!!!!");
                //   console.log("token地址:"+mintKeypair.publicKey.toString());
                //   setTokenAddress(mintKeypair.publicKey.toString());
                //   console.log(mintSignature);
                //   return;         
            
                setIsLoading(true)
                try{
                    // 设置交易的 feePayer
                    mintIx.feePayer = wallet.publicKey;
                    
                    // 获取最新的区块哈希值
                    const blockhash = (await connection.getLatestBlockhash()).blockhash;
                    mintIx.recentBlockhash = blockhash;

                    // 对交易进行部分签名
                    mintIx.partialSign(mintKeypair);
                    //mintIx.sign(mintKeypair);
                    
                    // 对交易进行钱包签名
                    const signedTx = await wallet.signTransaction(mintIx);
                    
                    const wireTx = signedTx.serialize();
                    //connection.sendTransaction(signedTx, []);
                    // 发送交易
                    
                    const mintSignature = await connection.sendRawTransaction(wireTx, { skipPreflight: true});
                    

                    // 设置交易签名
                    setSignature(mintSignature); 
                    //await connection.confirmTransaction(mintSignature);
                    //TransactionConfirmationStrategy
                    //connection.sendTransaction()

                    setTokenAddress(mintKeypair.publicKey.toString());
                    notify({ type: 'success', message: '成功', description: '交易已发送' });
                    const newPam: MessageBoxPam = {
                        addrTag: 'token',
                        addrName: t('create.param.addr'),
                        addr1: mintKeypair.publicKey.toString(),
                        hxName: '交易哈希:',
                        hxAddr: mintSignature
                      };
                      updateMessageBoxPam(newPam);
                      setIsModalOpen(true);

                    console.log("交易完成: ", mintSignature);
                } catch (err) {
                    notify({ type: 'success', message: '错误', description: '交易失败' });
                } finally {
                    setIsLoading(false)
                }
            } 
            catch (error)
            {
                console.error("交易失败: ", error);
                // 处理错误
            }
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
        <div className='flex justify-center items-center'>
            <div>
            <div className="mt-4 flex  items-center  space-x-1 text-left">
                {t('create.param.addr')} {tokenAddress ? tokenAddress : t('create.param.addrnot') } {/* 显示 token 地址或默认值 */}
            </div>            
  
            {/* <div className="mt-4 flex  items-center  space-x-1 text-left">
                {t('create.param.addrts')}
            </div> */}
            <button
                className="px-16 m-2 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                onClick={onClick}
                >
                <span>{t('create.param.enter')} </span>
            </button>  
            {/* <p className="md:w-full md:text-1xl text-center text-slate-500 my-2 text-xs">{t('free.all')}</p> */}
            </div>
            <FloatButton tooltip={<div>{t('msgbox.fbtn')}</div>} onClick={() => setIsModalOpen(true)} />
            <MsgBoxView isModalOpen={isModalOpen} msgParam={messageBoxPam} handleCancel={() => { setIsModalOpen(false) }} />
            {isLoading && <Loading />}
        </div>         
    );
};

// type Props = {
//     // Add custom props here
    
//   }
  
//   export const getStaticProps: GetStaticProps<Props> = async ({
//     locale,
//   }) => ({
//     props: {
//       ...(await serverSideTranslations(locale ?? 'en', [
//         'common',
//       ])),
//     },
//   })

