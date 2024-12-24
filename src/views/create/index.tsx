// Next, React
import { FC, useEffect, useState } from 'react';
import Link from 'next/link';

// Wallet
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

// Components
import { CreateParam } from '../../components/CreateParam';

import { useTranslation } from 'next-i18next'

import type { GetStaticProps } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { cn } from 'utils';
import { GAS_LEVEL } from 'utils/config';

// Store
//import useUserSOLBalanceStore from '../../stores/useUserSOLBalanceStore';



export const CreateView: FC = ({ }) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { t } = useTranslation('common');
  const [isShowXT, setisShowXT] = useState(true);
  const claname1 = "flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 md:w-[600px]"
  const clanametext = "md:w-1/3 md:text-1xl text-right text-stone-200 mr-2"
  const classinput = "max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] p-2 px-2 my-2 w-80"
  const classtextarea = "max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] p-2 px-2 my-2 w-full h-[150px]"
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

    <div className="md:hero mx-auto p-1 ">
      <div>
        <div className="md:hero-content flex flex-col">
          <div className='mt-1'>
            <h1 className="text-center text-4xl md:pl-12 text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-4 ">
              {/* 创建代币 */}
              {t('create.t1')}
            </h1>
          </div>
          {/* <button onClick={()=>{console.log(GAS_LEVEL)}}>Get</button> */}

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

          <div className={claname1}>
            <div className={clanametext}>{t('create.dec')}</div>
            <div className="md:w-2/3 m-auto">
              <input id="tokendec" className={classinput} placeholder="6" defaultValue="6"></input>
            </div>
          </div>

          <div className={claname1}>
            <div className={clanametext}>{t('create.amount')}</div>
            <div className="md:w-2/3 m-auto">
              <input id="tokencount" className={classinput} placeholder="1" defaultValue="1"></input>
            </div>
          </div>

          <div className="flex flex-col md:max-w-2xl md:flex-row items-center space-x-3 md:w-[600px]">
            <div className={`${clanametext} pr-1`}>{t('create.logo')}</div>
            <div className="md:w-2/3 m-auto">
              <div className="m-auto w-[350px] px-2 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" >
                </path>
                </svg>
                <label className="cursor-pointer font-medium text-purple-500 hover:text-indigo-500">
                  <span>{t('create.logosel')}</span>
                  <input type="file" id="fileInput" onChange={handleFileChange} className="sr-only" required></input>
                  <p className="text-1x1 md:text-1xl text-center text-slate-100 my-2" id="filename">
                    {selectedFile && (<p>{t('create.logoselts')}{selectedFile.name}</p>)} </p>
                </label>
              </div>
              <p className="text-center text-slate-300 my-2 text-sm">{t('create.logojy')}</p>
            </div>
          </div>

          <div className={claname1}>
            <div className={clanametext}>
              {t('create.openxt')}
            </div>
            <div className="md:w-2/3 m-auto">
              <input type="checkbox" className="toggle" defaultChecked={false} onChange={() => { setisShowXT(!isShowXT) }} />
            </div>
          </div>


          {isShowXT ?
            <div>
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
            </div>
            : ""
          }

          <div className="flex justify-between md:flex-row items-center space-x-3 md:w-[600px]">
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">{t('auth.freeys')}</span>
                <input type="checkbox" id='freeys' className="toggle" defaultChecked={false} />
              </label>
            </div>

            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">{t('auth.mint')}</span>
                <input type="checkbox" id='freemint' className="toggle" defaultChecked={false} />
              </label>
            </div>

            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">{t('auth.free')}</span>
                <input type="checkbox" id='freeacc' className="toggle" defaultChecked={false} />
              </label>
            </div>
          </div>



          <CreateParam selectedFile={selectedFile} />

          {/* <div className="mt-1 flex  items-center  space-x-2 text-left md:w-[600px]">
            <div className="md:w-[300px] md:text-2xl text-center text-slate-300 my-2">{t('create.selfupload')}</div>
            <div className="m-auto  w-[350px]">
              <input type="checkbox" id="isselfupload" className="form-checkbox h-6 w-6 text-indigo-600 rounded-md ml-10 mt-4" />
            </div>
          </div> */}
        </div>







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
