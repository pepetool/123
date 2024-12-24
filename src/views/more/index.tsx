// Next, React
import { FC, useEffect, useState } from 'react';
import Link from 'next/link';

// Wallet
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

// Components
import pkg from '../../../package.json';

// Store
//import useUserSOLBalanceStore from '../../stores/useUserSOLBalanceStore';



export const MoreView: FC = ({ }) => {
  const wallet = useWallet();
  const { connection } = useConnection();

  //const balance = useUserSOLBalanceStore((s) => s.balance)
  //const { getUserSOLBalance } = useUserSOLBalanceStore()

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

  return (
    //mx-auto 居中  
    
    <div className="md:hero mx-auto p-4">
      
      {/* <iframe src="https://cointool.app/sol/liquidity?menu=1&contact=1&iframe=1" width="1150"  height="670"  /> */}
     
      <div className="md:hero-content flex flex-col">
        <div className='mt-6'>
        <h1 className="text-center text-5xl md:pl-12 text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-4">
          更多工具
        </h1>
        </div>
        <h2>
          <div className="mt-4 flex  items-center  space-x-2 text-left md:w-[600px]">
            <div className="md:w-full text-2x1 md:text-2xl text-center text-slate-300 my-2">OpenBook创建市场ID</div>
              <Link href="http://openbook.jlbcode.com/market/create" target="_blank" rel="noopener noreferrer" passHref className="text-secondary hover:text-white">
                  <div className='flex flex-row ml-1'>
                  <button className="px-16 m-2 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black">
                    立即前往</button> 
                  </div>
              </Link>  
          </div> 

          <div className="mt-4 flex  items-center  space-x-2 text-left md:w-[600px]">
            <div className="md:w-full text-2x1 md:text-2xl text-center text-slate-300 my-2">Cointool创建市场ID</div>
              <Link href="https://cointool.app/sol/openbook-market" target="_blank" rel="noopener noreferrer" passHref className="text-secondary hover:text-white">
                  
                   <div className='flex flex-row ml-1'>
                  <button className="px-16 m-2 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black">
                    立即前往</button> 
                  </div> 
              </Link>  
          </div> 

          <div className="mt-4 flex  items-center  space-x-2 text-left md:w-[600px]">
            <div className="md:w-full text-2x1 md:text-2xl text-center text-slate-300 my-2">Cointool流动性池管理</div>
              <Link href="https://cointool.app/sol/liquidity" target="_blank" rel="noopener noreferrer" passHref className="text-secondary hover:text-white">
                  
                   <div className='flex flex-row ml-1'>
                  <button className="px-16 m-2 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black">
                    立即前往</button> 
                  </div> 
              </Link>  
          </div> 


          <div className="mt-4 flex  items-center  space-x-2 text-left md:w-[600px]">
            <div className="md:w-full text-2x1 md:text-2xl text-center text-slate-300 my-2">批量转账</div>
              <Link href="https://cointool.app/multiSender/sol" target="_blank" rel="noopener noreferrer" passHref className="text-secondary hover:text-white">
                  
                   <div className='flex flex-row ml-1'>
                  <button className="px-16 m-2 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black">
                    立即前往</button> 
                  </div> 
              </Link>  
          </div> 


        
        </h2>
          
      </div> 
    </div>
  );
};
