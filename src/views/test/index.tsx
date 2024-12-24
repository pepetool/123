// Next, React
import { FC, useEffect, useState } from 'react';
import Link from 'next/link';

// Wallet
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

// Components
import { TestParam } from '../../components/TestParam';
import pkg from '../../../package.json';
import { PublicKey } from '@metaplex-foundation/js';

// Store
//import useUserSOLBalanceStore from '../../stores/useUserSOLBalanceStore';



export const TestView: FC = ({ }) => {
  const wallet = useWallet();
  const { connection } = useConnection();

  // const balance = useUserSOLBalanceStore((s) => s.balance)
  // const { getUserSOLBalance } = useUserSOLBalanceStore()

  // useEffect(() => {
  //   if (wallet.publicKey) {
  //     console.log(wallet.publicKey.toBase58())
  //     getUserSOLBalance(wallet.publicKey, connection)
  //   }
  // }, [wallet.publicKey, connection, getUserSOLBalance])

  const [selectedFile, setSelectedFile] = useState<File | null>(null); // 声明selectedFile的类型为File | null

  const handleFileChange = (event) => {
      setSelectedFile(event.target.files[0]);
    };
  
  const handletestproc = async ()=>{
    console.log("1111111");
    const OPENBOOK_DEX="srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX";
    const OPENBOOK_DEX_Devnet = "EoTcMgcDRTJVZDMZWBoU6rhYHZfkNTVEAfz3uUJRcYGj";

    const MY_PROGRAM_ID = new PublicKey(OPENBOOK_DEX);
    let accounts
    try{
    accounts = await connection.getProgramAccounts(MY_PROGRAM_ID);
    }catch(err){
      console.log("err",err);
    }
    
    console.log(`Accounts for program ${MY_PROGRAM_ID}: `);
    console.log(accounts);
  }

  return (
    //mx-auto 居中  
    
    <div className="md:hero mx-auto p-4">
      
      {/* <iframe src="https://cointool.app/sol/liquidity?menu=1&contact=1&iframe=1" width="1150"  height="670"  /> */}
      {/* <iframe src="https://foxtool.gitbook.io/sol/" width="1150"  height="670"  /> */}
      {/* <iframe
        src="https://foxtool.gitbook.io/sol/"
        title="Embedded Content"
        // width="800"
        // height="600"
        frameBorder="0"
        allowFullScreen
      /> */}
      
     
      <div className="md:hero-content flex flex-col">
        <div className='mt-6'>
        <h1 className="text-center text-5xl md:pl-12 text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-4">
          创建代币
        </h1>
        <button onClick={handletestproc}>获取程序地址</button>
        </div>
        <h2>
          <div className="mt-4 flex  items-center  space-x-2 text-left md:w-[600px]">
            <div className="md:w-full text-2x1 md:text-2xl text-center text-slate-300 my-2">*代币全称:</div>
              <div className="m-auto  w-[350px]">
                <input id="tokenname" className = "max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] p-2 px-10 my-2" placeholder="请输入全称(如:Btc Coin)"></input>              
            </div>
          </div> 

          <div className="mt-4 flex  items-center  space-x-1 text-left md:w-[600px]">
            <div className="md:w-full text-2x1 md:text-2xl text-center text-slate-300 my-2">*简称:</div>
              <div className="m-auto  w-[350px]">
                <input id="tokenSymbol" className = "max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] p-2 px-10 my-2" placeholder="请输入全称(如:BTC)"></input>              
            </div>
          </div> 

          <div className="mt-4 flex  items-center  space-x-1 text-left md:w-[600px]">
            <div className="md:w-full text-2x1 md:text-2xl text-center text-slate-300 my-2">*精度:</div>
              <div className="m-auto  w-[350px]">
                <input id="tokendec" className = "max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] p-2 px-10 my-2" placeholder="9" defaultValue="9"></input>              
            </div>
          </div> 

          <div className="mt-4 flex  items-center  space-x-1 text-left md:w-[600px]">
            <div className="md:w-full text-2x1 md:text-2xl text-center text-slate-300 my-2">*总供应量:</div>
              <div className="m-auto  w-[350px]">
                <input id="tokencount" className = "max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] p-2 px-10 my-2" placeholder="100000" defaultValue="100000"></input>              
            </div>
          </div> 

          <div className="mt-4 flex  items-center  space-x-1 text-left md:w-[600px]">
            <div className="md:w-full text-2x1 md:text-2xl text-center text-slate-300 my-2">LOGO:</div>
              <div className="m-auto  w-[350px]">
              <div className="m-auto w-[350px] px-2 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-linejoin="round">
                  </path>
                  </svg>
                  <label className="cursor-pointer font-medium text-purple-500 hover:text-indigo-500">
                    <span>选择图片</span> 
                    <input type="file" id="fileInput" onChange={handleFileChange} className="sr-only" required></input>
                    
                    </label>
                  </div>   
              </div>
          </div> 

          <div className="mt-4 flex  items-center  space-x-1 text-left md:w-[600px]">
            <div className="md:w-full text-2x1 md:text-2xl text-center text-slate-300 my-2">官网:</div>
              <div className="m-auto  w-[350px]">
                <input id="userweb" className = "max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] p-2 px-10 my-2" placeholder="选填,"></input>              
            </div>
          </div> 

          <div className="mt-4 flex  items-center  space-x-1 text-left md:w-[600px]">
            <div className="md:w-full text-2x1 md:text-2xl text-center text-slate-300 my-2">Telegram群组:</div>
              <div className="m-auto  w-[350px]">
                <input id="tglink" className = "max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] p-2 px-10 my-2" placeholder="选填,"></input>              
            </div>
          </div> 

          <div className="mt-4 flex  items-center  space-x-1 text-left md:w-[600px]">
            <div className="md:w-full text-2x1 md:text-2xl text-center text-slate-300 my-2">Twitter:</div>
              <div className="m-auto  w-[350px]">
                <input id="xlink" className = "max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] p-2 px-10 my-2" placeholder="选填,"></input>              
            </div>
          </div> 

          <div className="mt-4 flex  items-center  space-x-1 text-left md:w-[600px]">
            <div className="md:w-full text-2x1 md:text-2xl text-center text-slate-300 my-2">Discord:</div>
              <div className="m-auto  w-[350px]">
                <input id="dislink" className = "max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] p-2 px-10 my-2" placeholder="选填,"></input>              
            </div>
          </div> 

          <div className="mt-4 flex  items-center  space-x-1 text-left md:w-[600px]">
            <div className="md:w-full text-2x1 md:text-2xl text-center text-slate-300 my-2">简介:</div>
              <div className="m-auto  w-[468px]">
                <textarea id="des" className = "max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] p-2 px-8 my-2" placeholder="选填,最多200字"></textarea>              
              </div>
          </div> 

          <div className="mt-4 flex  items-center  space-x-1 text-left md:w-[600px]">
            <div className="md:w-full text-2x1 md:text-2xl text-center text-slate-300 my-2">标签:</div>
              <div className="m-auto  w-[468px]">
                <textarea id="tags" className = "max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] p-2 px-8 my-2" placeholder="Meme,NFT,DIFI" defaultValue="Meme,NFT,DIFI"></textarea>              
              </div>
          </div> 
        </h2>
          


        <div className="flex flex-col mt-2">
          <TestParam selectedFile={selectedFile}/>
        </div>
      </div> 
    </div>
  );
};
