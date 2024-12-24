// Next, React
import { FC, useEffect, useState } from 'react';
import Link from 'next/link';

// Wallet
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

// Components
import { UpdataParam } from '../../components/UpdataParam';
import pkg from '../../../package.json';

// Store
//import useUserSOLBalanceStore from '../../stores/useUserSOLBalanceStore';
import { usesBeet } from '@metaplex-foundation/mpl-token-metadata';
import { getTokenAccounts, getMetadata } from '../../utils/gettoken';
import { notify } from 'utils/notifications';
import Loading from '../../components/Loading';
import { useTranslation } from 'next-i18next'





export const UpdataView: FC = ({ }) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  // const balance = useUserSOLBalanceStore((s) => s.balance)
  // const { getUserSOLBalance } = useUserSOLBalanceStore()
  const [useraddr, setuseraddr] = useState<string | "">(null); // 声明selectedFile的类型为File | null
  const [ischeck, setischeck] = useState(false);
  const [isauthity, setisauthity] = useState(false);
  const { publicKey } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation('common')

  // useEffect(() => {
  //   if (wallet.publicKey) {
  //     console.log(wallet.publicKey.toBase58())
  //     getUserSOLBalance(wallet.publicKey, connection)
  //   }
  // }, [wallet.publicKey, connection, getUserSOLBalance])

  const handlecheck = async () => {

    //---------
    if (publicKey) {
      const tokenaddr = document.getElementById('tokenaddr') as HTMLInputElement | null;
      let tokenkey = tokenaddr?.value;


      // setischeck(true)
      // //设置是否有管理权限
      // setisauthity(true)
      // //获取值传
      // setuseraddr(tokenkey);


      setIsLoading(true);
      let metaJson = await getMetadata([tokenkey]);
      if (metaJson) {
        setIsLoading(false);
        let metadata = metaJson[0].onChainMetadata.metadata;
        if (metadata) {
          console.log(metadata.updateAuthority)
          console.log(wallet.publicKey.toString())
          if (metadata.updateAuthority === wallet.publicKey.toString()) {
            //设置是否显示控件
            setischeck(true)
            //设置是否有管理权限
            setisauthity(true)
            //获取值传
            setuseraddr(tokenkey);
          } else {
            //设置是否显示控件
            setischeck(true)
            //设置是否有管理权限
            setisauthity(false)
            //获取值传
            setuseraddr("");
          }

        } else {
          notify({ type: "error", message: "无效地址" });
        }

      } else {
        notify({ type: "error", message: "获取Json错误" });
      }
    } else {
      notify({ type: "error", message: "错误", description: "请先连接钱包!" });
    }
  }
  return (
    <div className="md:hero mx-auto p-2">
      <div className="md:hero-content flex flex-col">
        <div className='mt-6'>
          <h1 className="text-center text-4xl md:pl-12 text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500">
            {t('updata.t1')}
          </h1>
        </div>
        <div>
          <div className="mt-4 flex  items-center  space-x-2 text-left md:w-[600px]">
            <div className="md:w-[200px] md:text-1xl text-center text-slate-300 my-2">{t('updata.addr')}</div>
            <div className="m-auto  w-[350px]">
              <input id="tokenaddr" className="md:w-[400px] mx-auto mockup-code bg-primary border-2 border-[#5252529f] p-2 px-2 my-2" placeholder={t('updata.addrts')}></input>
            </div>

          </div>
          <div className='flex justify-center items-center'>
            <button
              className="px-16 m-2 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
              onClick={handlecheck}
            >
              <span>{t('updata.check')} </span>
            </button>
            
          </div>
          {/* <p className="md:w-full md:text-1xl text-center text-slate-500 my-2 text-xs">{t('free.all')}</p> */}
          {
            ischeck &&
            <div className="mt-4 flex  items-center  space-x-2 text-left md:w-[600px]">
              <div className="md:w-[200px] md:text-1xl text-center text-slate-300 my-2">{t('updata.auth')}</div>
              {
                isauthity
                  ?
                  <div>
                    <span className="md:w-[200px] md:text-1xl text-center text-slate-300 my-2">{t('updata.authyes')}</span>

                  </div>
                  : <span className="md:w-[200px] md:text-1xl text-center text-slate-300 my-2">{t('updata.authnot')}</span>
              }
            </div>
          }
        </div>
        <div className='scroll-pr-1'>
          {isauthity && <UpdataParam useaddr={useraddr} />}
        </div>
      </div>
      {isLoading && <Loading />}
    </div>

  );
};
