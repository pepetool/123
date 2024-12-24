// Next, React
import { FC, useEffect, useState } from 'react';
import Link from 'next/link';

// Wallet
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

// Components
import { AuthorityParam } from '../../components/AuthorityParam';
import pkg from '../../../package.json';
import { useTranslation } from 'next-i18next'
import { publicKey } from '@raydium-io/raydium-sdk';
import { notify } from 'utils/notifications';
import { getMint } from '@solana/spl-token';
import { PublicKey } from '@metaplex-foundation/js';
import { Tag } from 'antd';
import { Metadata } from '@metaplex-foundation/mpl-token-metadata';

// Store
//import useUserSOLBalanceStore from '../../stores/useUserSOLBalanceStore';



export const AuthorityView: FC = ({ }) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { t } = useTranslation('common');
  const [canCheck, setCanCheck] = useState(false);
  const [canFreeYs, setcanFreeYs] = useState(false);
  const [canFreeMint, setcanFreeMint] = useState(false);
  const [canFreeAcc, setcanFreeAcc] = useState(false);
  // const balance = useUserSOLBalanceStore((s) => s.balance)
  // const { getUserSOLBalance } = useUserSOLBalanceStore()

  // useEffect(() => {
  //   if (wallet.publicKey) {
  //     console.log(wallet.publicKey.toBase58())
  //     getUserSOLBalance(wallet.publicKey, connection)
  //   }
  // }, [wallet.publicKey, connection, getUserSOLBalance])

  const handleCheck = async () => {
    //
    if (!publicKey) {
      notify({ type: "error", message: "钱包未连接" });
      return;
    }
    try {
      const tokenaddr = document.getElementById('tokenaddr') as HTMLInputElement | null;
      const tokenKey = new PublicKey(tokenaddr?.value);

      const METADATA_PROGRAM_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
      const [metadataAddress] = await PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          (new PublicKey(METADATA_PROGRAM_ID)).toBuffer(),
          tokenKey.toBuffer()
        ],
        new PublicKey(METADATA_PROGRAM_ID)
      )
      const [mintAccountInfo, metadataAccountInfo] = await connection.getMultipleAccountsInfo([tokenKey, metadataAddress]).catch(error => [null, null])
      if (!mintAccountInfo) {
        console.log("Token not found")
        return
      }

      console.log("metadataAccountInfo:", metadataAccountInfo)
      if (metadataAccountInfo) {
        const metadataInfo = Metadata.deserialize(metadataAccountInfo.data)[0]
        console.log("metadataInfo:", metadataInfo);
        const metadataUpdateAuthStr = metadataInfo.updateAuthority.toBase58();
        //console.log(metadataUpdateAuthStr);
        //console.log(metadataInfo.isMutable);
        if(metadataInfo.isMutable){
          //可变
          setcanFreeYs(true);
        }else{
          //不可变
          setcanFreeYs(false);
        }
      }


      const Mint = await getMint(connection, tokenKey);
      console.log(Mint.freezeAuthority);  //冻结权限  一个publick.toString()地址或Null
      console.log(Mint.mintAuthority);  //Mint权限   一个publick.toString()地址或Null
      if (Mint.freezeAuthority) {
        setcanFreeAcc(true);
      } else {
        setcanFreeAcc(false);
      }

      if (Mint.mintAuthority) {
        setcanFreeMint(true);
      } else {
        setcanFreeMint(false);
      }
      //setcanFreeYs(true);
      setCanCheck(true);
    } catch (err) {
      notify({ type: "error", message: "查询错误" });
      return;
    }

  }


  return (

    <div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col">
        <div className='mt-6'>
          <h1 className="text-center text-4xl md:pl-12 text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-4">
            {t('auth.t1')}
          </h1>
        </div>
        <h2>
          <div className="flex mt-4 items-center  space-x-2 text-left md:w-[600px]">
            <div className="md:w-[200px] text-2x1 md:text-2xl text-center text-slate-300 my-2">{t('auth.addr')}</div>
            <div className="m-auto  w-[350px]">
              <input id="tokenaddr" className="md:w-[400px] mx-auto mockup-code bg-primary border-2 border-[#5252529f] p-2 my-2 text-sm" placeholder={t('auth.addrts')}></input>

            </div>

          </div>
          <div className="flex mt-4 items-center  space-x-2 text-left md:w-[600px]">
            <div className="md:w-[200px] text-2x1 md:text-2xl text-center text-slate-300 my-2"></div>
            <div className="m-auto  w-[350px]">
              <button
                className="px-5 m-2 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                onClick={handleCheck}>
                <span>{t('auth.check')}</span>
              </button>
            </div>
          </div>
          <div className='items-center'>
            <div className="mt-4 space-x-2 text-left md:w-[600px] flex justify-center">
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text text-slate-300">{t('auth.freeys')}</span>
                  <input type="checkbox" id='freeMeta' className="toggle" defaultChecked={false} disabled={!canFreeYs} />
                  {canCheck ? canFreeYs ? <Tag color="#f50">{t('auth.not')}</Tag> : <Tag color="#87d068">{t('auth.yes')}</Tag> : ""}
                </label>

              </div>
            </div>

            <div className="mt-4 space-x-2 text-left md:w-[600px] flex justify-center">
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text text-slate-300">{t('auth.mint')}</span>
                  <input type="checkbox" id='minttoken' className="toggle" defaultChecked={false} disabled={!canFreeMint} />
                  {canCheck ? canFreeMint ? <Tag color="#f50">{t('auth.not')}</Tag> : <Tag color="#87d068">{t('auth.yes')}</Tag> : ""}
                </label>
              </div>
            </div>

            <div className="mt-4 space-x-2 text-left md:w-[600px] flex justify-center">
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text text-slate-300">{t('auth.free')}</span>
                  <input type="checkbox" id='freeAccount' className="toggle" defaultChecked={false} disabled={!canFreeAcc} />
                  {canCheck ? canFreeAcc ? <Tag color="#f50">{t('auth.not')}</Tag> : <Tag color="#87d068">{t('auth.yes')}</Tag> : ""}
                </label>
              </div>
            </div>


            {/* <div className="mt-4 space-x-2 text-left md:w-[600px] flex justify-center">
              <label htmlFor="minttoken" className="inline-flex items-center">
                <input
                  type="checkbox"
                  id="minttoken"
                  className="form-checkbox h-6 w-6 text-indigo-600 rounded-md ml-2 mt-1"
                />
                <span className="pointer-events:none ml-2">{t('auth.mint')}</span>
              </label>
            </div> */}

            {/* <div className="mt-4 space-x-2 text-left md:w-[600px] flex justify-center">
              <label htmlFor="freeAccount" className="inline-flex items-center">
                <input
                  type="checkbox"
                  id="freeAccount"
                  className="form-checkbox h-6 w-6 text-indigo-600 rounded-md ml-2 mt-1"
                />
                <span className="pointer-events:none ml-2">{t('auth.free')}</span>
              </label>
            </div> */}
          </div>

          {/* <div className="mt-4 flex  items-center  space-x-2 text-left md:w-[600px]">
            <div className="md:w-[200px] text-2x1 md:text-2xl text-center text-slate-300 my-2">丢弃增发权限:</div>
              <div className="m-auto  w-[350px]">
              <input type="checkbox" id="minttoken" className="form-checkbox h-6 w-6 text-indigo-600 rounded-md ml-10 mt-4" />
            </div>
          </div> 

          <div className="mt-4 flex  items-center  space-x-2 text-left md:w-[600px]">
            <div className="md:w-[200px] text-2x1 md:text-2xl text-center text-slate-300 my-2">丢弃冻结权限:</div>
              <div className="m-auto  w-[350px]">
              <input type="checkbox" id="freeAccount" className="form-checkbox h-6 w-6 text-indigo-600 rounded-md ml-10 mt-4" />
            </div>
          </div>  */}

        </h2>



        <div className="flex flex-col mt-2">
          <AuthorityParam />


        </div>

      </div>
    </div>
  );
};
