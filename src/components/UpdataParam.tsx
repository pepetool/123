import { useConnection, useWallet, } from '@solana/wallet-adapter-react';
import { createMintTokenTransactionproc, createUpdateMetadataIx, disableAuthority, createUpdataMetaV3Proc } from '../utils/web3';

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
    TransactionSignature,
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
import { API_KEY } from '../../constants';
import { log } from 'console';
import { useTranslation } from 'next-i18next'
import Loading from './Loading';
import { getmyTokenUri, getmyImageUri } from '../utils/web3'



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

interface UpdataParamProps {
    useaddr: string;
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



export const UpdataParam: FC<UpdataParamProps> = ({ useaddr }) => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction, signMessage, signTransaction, signAllTransactions } = useWallet();
    const { networkConfiguration } = useNetworkConfiguration();

    const network = networkConfiguration as WalletAdapterNetwork;
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);
    const wallet = useAnchorWallet();
    //const [mintKeypair, setTokenKeypair] = useState<Keypair | null>(null);
    const [metaplex, setMetaplex] = useState(null);
    const [signature, setSignature] = useState<string>("");
    const [tokenAddress, setTokenAddress] = useState<string | null>(null);

    const [selectedFile, setSelectedFile] = useState<File | null>(null); // 声明selectedFile的类型为File | null
    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };
    const { t } = useTranslation('common')
    const [isLoading, setIsLoading] = useState(false);
    const claname1 = "flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 md:w-[600px]"
    const clanametext = "md:w-1/3 md:text-1xl text-right text-stone-200 mr-2"
    const classinput = "max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] p-2 px-2 my-2 w-80"
    const classtextarea = "max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] p-2 px-2 my-2 w-full h-[150px]"


    //const { endpoint } = 
    //const { getUserSOLBalance } = useUserSOLBalanceStore();

    const onClick = useCallback(async () => {
        //const connection = new Connection("https://solana-mainnet.core.chainstack.com/1a404624f4d24c3f11322e195faf25b0");


        if (publicKey) {

            const tokenname = document.getElementById('tokenname') as HTMLInputElement | null;
            //const tokencount = document.getElementById('tokencount') as HTMLInputElement | null;
            //const tokendec = document.getElementById('tokendec') as HTMLInputElement | null;
            const tokenSymbol = document.getElementById('tokenSymbol') as HTMLInputElement | null;
            const userweb = document.getElementById('userweb') as HTMLInputElement | null;
            const tglink = document.getElementById('tglink') as HTMLInputElement | null;
            const xlink = document.getElementById('xlink') as HTMLInputElement | null;
            const dislink = document.getElementById('dislink') as HTMLInputElement | null;
            const des = document.getElementById('des') as HTMLInputElement | null;
            const tags = document.getElementById('tags') as HTMLInputElement | null;
            //const isselfupload = document.getElementById('isselfupload') as HTMLInputElement | null;
            //const isSelfload = isselfupload.checked;
            const isSelfload:boolean = false;

            // console.log(tokenAddr?.value+","+minttoken?.value+","+freeAccount?.value);
            
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
            if (tokenSymbol?.value.length > 8) {
                notify({ type: 'error', message: '错误', description: '代币简称长度不能大于8' });
                return;
            }

            if (!selectedFile) {
                notify({ type: 'error', message: '错误', description: '请选择logo文件' });
                return;
            }

            //return;
            const userinput = {
                tokenName: tokenname?.value,
                symbol: tokenSymbol?.value,
                //image:  ???还不知道怎么弄
                web: userweb?.value,
                tglink: tglink?.value,
                xlink: xlink?.value,
                dislink: dislink?.value,
                description: des?.value,
                tags: tags?.value,
                image: "",
            };

            if (selectedFile) {


                //console.log("Making metaplex...");
                // const newMetaplex = await Metaplex.make(connection)
                //     .use(
                //         irysStorage(
                //             {
                //                 address: process.env.NEXT_PUBLIC_NODE,  //上传检查api
                //                 providerUrl: process.env.NEXT_PUBLIC_RPC,//RPC
                //                 timeout: 60000,
                //             }
                //         )
                //     )
                //     //https://arweave.mainnet.irys.xyz
                //     //https://arweave.devnet.irys.xyz
                //     .use(walletAdapterIdentity({
                //         publicKey,
                //         signMessage,
                //         signTransaction,
                //         signAllTransactions
                //     }));
                // setMetaplex(newMetaplex);

                // //console.log("Getting token accounts...");    
                // let imageuri = "";
                // console.log("upload logo")
                // const uplimg = await newMetaplex.nfts().uploadMetadata({
                //     name: userinput.tokenName,
                //     symbol: userinput.symbol,
                //     description: userinput.description,
                //     image: await toMetaplexFileFromBrowser(selectedFile),
                // });
                // console.log("getimagejson...")
                // let imageurijs = await getimagejson(uplimg.uri);
                // if (imageurijs.hasOwnProperty("image")) {
                //     imageuri = imageurijs["image"];
                // } else {
                //     console.log("GetImage Json Error")
                //     imageuri = imageurijs;
                // }
                // console.log("upload logo success. :" + imageuri);


                /*
                // 使用 split() 方法将字符串分割成单词
                const words = userinput.tags.split(',');
                // 创建一个新的数组，包含分割后的单词
                const wordArray = words.map(word => word.trim());  
                console.log(wordArray);
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
                const tokenuri = uplmetadata.uri;
                console.log("TokenUriData upload success. :" + {tokenuri}); 
                */
                let tokenuri;
                // 使用 split() 方法将字符串分割成单词
                const words = userinput.tags.split(',');
                // 创建一个新的数组，包含分割后的单词
                const wordArray = words.map(word => word.trim());
                setIsLoading(true);
                try {
                    //const jsonuri =await getmyImageUri(selectedFile, userinput.tokenName, userinput.symbol, userinput.description);
                    const jsonuri = await getmyTokenUri(selectedFile, userinput.tokenName, userinput.symbol, userinput.description, userinput.web,
                        userinput.tglink, userinput.xlink, wordArray);
                    setIsLoading(false);
                    if (jsonuri != "error") {
                        tokenuri = jsonuri;
                        console.log(tokenuri);
                        //return;
                    } else {
                        notify({ type: "error", message: "上传元数据失败,请尝试勾选自行上传" });
                        return;
                    }
                } catch (err) {
                    setIsLoading(false);
                    notify({ type: "error", message: "上传元数据失败,请尝试勾选自行上传#" });
                    return;
                }
                try {
                    const MintKey = new PublicKey(useaddr);
                    //失败
                    // const mintIx = await createUpdataMetaV3Proc(
                    //     publicKey,
                    //     MintKey,
                    //     tokenuri,
                    //     userinput.tokenName,
                    //     userinput.symbol
                    // );

                    //const tokenaddr = new PublicKey(useaddr);
                    const mintIx = await createUpdateMetadataIx(
                        MintKey,
                        userinput.tokenName,
                        userinput.symbol,
                        tokenuri,
                        publicKey
                    );


                    mintIx.feePayer = wallet.publicKey;
                    mintIx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
                    //mintIx.partialSign(mintKeypair);
                    const signedTx = await wallet.signTransaction(mintIx);
                    const wireTx = signedTx.serialize();
                    const mintSignature = await connection.sendRawTransaction(wireTx, { skipPreflight: true });
                    setSignature(mintSignature);
                    console.log("交易完成: ", mintSignature);
                    notify({ type: "success", message: "交易已发送", description: "哈希: " + mintSignature });
                    return;
                } catch (err) {
                    notify({ type: "error", message: "错误", description: "交易失败" });
                }
            }
            else {
                notify({ type: "error", message: "请选择logo文件" });
            }
            return;
        }
        else {
            notify({ type: 'error', message: '错误', description: '钱包未链接...' });
            console.log('error', 'wallet not connect!');
            return;
        }

    }, [notify, sendTransaction, useaddr, selectedFile]);
    /**
     * 在 [selectedFile] 后面的这个数组表示 useCallback 钩子的依赖项列表。

    useCallback 是 React 提供的一个钩子，用于创建一个记忆化的回调函数。当依赖项列表中的值发生变化时，useCallback 返回的回调函数会重新生成，否则会复用之前的回调函数。
     */

    return (
        <div className='flex  items-center text-left md:w-[600px]'>
            <div className='space-y-5'>
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

                <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 md:w-[600px]">
                    <div className={`${clanametext} pr-1`}>{t('create.logo')}</div>

                    <div className="md:w-2/3 m-auto">
                        <div className="m-auto w-[350px] px-2 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" >
                                </path>
                            </svg>
                            <label className="cursor-pointer font-medium text-purple-500 hover:text-indigo-500">
                                <span>{t('create.logosel')}</span>
                                <input type="file" id="fileInput" onChange={handleFileChange} className="sr-only" required></input>
                                <p className="md:w-full text-1x1 md:text-1xl text-center text-slate-100 my-2" id="filename">
                                    {selectedFile && (<p>{t('create.logoselts')}{selectedFile.name}</p>)} </p>
                            </label>
                        </div>
                        <p className="md:w-full text-xs text-center text-slate-300 my-2">{t('create.logojy')}</p>
                    </div>
                </div>

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

                <div className={claname1}>
                    <div className={clanametext}>{t('create.des')}</div>
                    <div className="md:w-2/3 m-auto">
                        <textarea id="des" className={classtextarea} placeholder={t('create.dests')}></textarea>
                    </div>
                </div>

                <div className={claname1}>
                    <div className={clanametext}>{t('create.tags')}</div>
                    <div className="md:w-2/3 m-auto">
                        <textarea id="tags" className={classtextarea} placeholder="Meme,NFT,DIFI" defaultValue="Meme,NFT,DIFI"></textarea>
                    </div>
                </div>



                <button className="md:w-full px-16 m-2 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black "
                    onClick={onClick}>
                    <span>{t('updata.enter')} </span>
                </button>
                

                {/* <div className="mt-8 flex  items-center  space-x-2 text-left md:w-[600px]">
                    <div className="md:w-[300px] text-2x1 md:text-2xl text-center text-slate-300 my-2"></div>
                    <div className="m-auto  w-[350px]">
                        <input type="checkbox" id="isselfupload" className="form-checkbox h-6 w-6 text-indigo-600 rounded-md ml-10 mt-4" />
                    </div>
                </div> */}

            </div>











            {/* </h2> */}



            {isLoading && <Loading />}
        </div>


    );
};

