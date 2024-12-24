// Next, React
import { FC, useEffect, useState } from 'react';
import Link from 'next/link';

// Wallet
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

// Components
import { RequestAirdrop } from '../../components/RequestAirdrop';
import pkg from '../../../package.json';
import { useTranslation } from 'next-i18next'
import type { GetStaticProps } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

// Store
import useUserSOLBalanceStore from '../../stores/useUserSOLBalanceStore';
import { GAS_LEVEL } from 'utils/config';
import { Alert, Badge, Button, Card } from 'antd';

export const HomeView: FC = ({ }) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { t } = useTranslation('common')

  const balance = useUserSOLBalanceStore((s) => s.balance)
  const { getUserSOLBalance } = useUserSOLBalanceStore()

  useEffect(() => {
    if (wallet.publicKey) {
      //console.log(wallet.publicKey.toBase58())
      getUserSOLBalance(wallet.publicKey, connection)
    }
  }, [wallet.publicKey, connection, getUserSOLBalance])

  return (

    <div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col">
        <div className='mt-6'>
        {/* <div className='text-sm font-normal align-bottom text-right text-slate-600 mt-4'>v{pkg.version}</div> */}
        <h1 className="text-center text-5xl md:pl-12 font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-4">
          PEPETool
        </h1>
        </div>
        <h4 className="md:w-full text-2x1 md:text-4xl text-center text-slate-300 my-2 ">
          {/* <p>便捷的Solana工具箱</p> */}
          <p>{t('home.t1')}</p>
          {/* <p className='text-slate-500 text-2x1 leading-relaxed'>一键创建代币、权限管理、批量转账...</p> */}
          <p className='text-slate-500 text-2x1 leading-relaxed mt-8'>{t('home.t2')}</p>
        </h4>

        <Link href="https://t.me/php520a"> 
          <button
              className="px-8 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
              >
              <span>Telegram</span>
          </button>
        </Link>

        
        {/* <Badge.Ribbon text="Hippies" color="green">
          <Card title="Pushes open the window" size="small">
            and raises the spyglass.
          </Card>
        </Badge.Ribbon> */}
        <Alert
          message={t('home.msg1')}
          description={t('home.msg2')}
          type="info"
          showIcon
          closable
        />

        {/* <button onClick={()=>{localStorage.setItem('foxtool.cc-gasfees',"1")}}>Set</button>
        <button onClick={()=>{console.log(localStorage.getItem('foxtool.cc-gasfees'))}}>Get</button>
        <button onClick={()=>{console.log(localStorage.clear())}}>Clear</button> */}
         {/* <button onClick={()=>{console.log(GAS_LEVEL)}}>Get</button> */}
         {/* <button onClick={onclick111}>1111111</button> */}

         {process.env.NEXT_PUBLIC_DEBUG ==="true" && 
         <div>
         <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-indigo-500 rounded-lg blur opacity-40 animate-tilt"></div>
          <div className="max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] p-6 px-10 my-2">
            <pre data-prefix=">">
              <code className="truncate">{`npx create-solana-dapp <dapp-name>`} </code>
            </pre>
          </div>
        </div>
        <div className="flex flex-col mt-2">
          <RequestAirdrop />
          <h4 className="md:w-full text-2xl text-slate-300 my-2">
          {wallet &&
          <div className="flex flex-row justify-center">
            <div>
                {balance}
              </div>
              <div className='text-slate-600 ml-2'>
                SOL
              </div>
          </div>
          }
          </h4>
        </div> 
        </div>
        }
        
      </div>
      
    </div>
  );
};

// type Props = {
//   // Add custom props here
  
// }

// export const getStaticProps: GetStaticProps<Props> = async ({
//   locale,
// }) => ({
//   props: {
//     ...(await serverSideTranslations(locale ?? 'en', [
//       'common',
//     ])),
//   },
// })
