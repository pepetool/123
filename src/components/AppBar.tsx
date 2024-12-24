import { FC, useEffect } from 'react';
import Link from "next/link";
import dynamic from 'next/dynamic';
import React, { useState } from "react";
import { useAutoConnect } from '../contexts/AutoConnectProvider';
import NetworkSwitcher from './NetworkSwitcher';
import NavElement from './nav-element';
import Image from 'next/image';
import type { GetStaticProps } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { getGasLevel, getGasLevelStr, setGasLevel, setNowRPCId } from 'utils/config';
import EndpointUpdater from './EndpointUpdater';

const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

let nowlan = 'cn';

export const AppBar: React.FC = () => {
  const { autoConnect, setAutoConnect } = useAutoConnect();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [nowGas, setNowGas] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);



  const { t, i18n } = useTranslation(['common']);
  const router = useRouter()
  const { locale, pathname } = router;
  const cleanPathname = pathname.replace(/^\/+|\/+$/g, '');

  useEffect(() => {
    // 在组件加载后调用 getGasLevelStr() 函数获取初始状态值
    //getGasLevel();
    const initialValue = getGasLevelStr(); // 假设这是你的获取初始状态的函数
    // 将获取的值设置为 isNavOpen 的初始状态
    setNowGas(initialValue);
  }, []);

  function clientSideLanguageChange(newLocale: string) {
    //console.log(newLocale);
    nowlan = newLocale;
    i18n.changeLanguage(newLocale);
  }

  function clientrouter() {
    console.log(router.pathname)
  }

  function setGasfee(level: number) {
    setGasLevel(level);
    const initialValue = getGasLevelStr(); // 假设这是你的获取初始状态的函数
    setNowGas(initialValue);
  }

  return (
    <div>
      {/* NavBar / Header */}
      <div className="navbar flex h-20 flex-row md:mb-2 shadow-lg bg-black text-neutral-content border-b border-zinc-600 bg-opacity-66">
        <div className="navbar-start align-items-center">
          <div className="hidden sm:inline w-22 h-22 md:p-2 ml-10">
            <Link href="/" rel="noopener noreferrer" passHref className="text-secondary hover:text-white">
              <Image
                src="/foxLogo.png"
                alt="solana icon"
                width={186}
                height={86}
              />
            </Link>
          </div>
          {/* <WalletMultiButtonDynamic className="btn-ghost btn-sm relative flex md:hidden text-lg" /> */}
        </div>

        {/* Nav Links */}
        {/* Wallet & Settings */}
        <div className="navbar-center text-base">
          <div className="hidden md:inline-flex align-items-center justify-items text-slate-300 gap-5">
            <NavElement
              label={t('nav.home')}
              href="/"
              navigationStarts={() => setIsNavOpen(false)}
            />

            <div className="dropdown dropdown-hover p-18">
              <div tabIndex={0} className="">
                <NavElement
                  label={t('nav.tokenmanage')}
                  href="/create"
                />
              </div>
              <ul tabIndex={0} className="dropdown-content z-[1] menu shadow bg-base-100 rounded-box md:w-32">

                <li>
                  <span>
                    <NavElement
                      label={t('nav.create')}
                      href="/create"
                    />
                  </span>
                </li>


                <li>
                  <span>
                    <NavElement
                      label={t('nav.auth')}
                      href="/authority"
                    />
                  </span>
                </li>

                <li>
                  <span>
                    <NavElement
                      label={t('nav.burn')}
                      href="/burn"
                    />
                  </span>
                </li>

                <li>
                  <span>
                    <NavElement
                      label={t('nav.freeacc')}
                      href="/frozen"
                    />
                  </span>
                </li>

                <li>
                  <span>
                    <NavElement
                      label={t('nav.updata')}
                      href="/updata"
                    />
                  </span>
                </li>
              </ul>
            </div>


            <Link href={"https://help.pepetool.cc"} target='_blank'>{t('nav.mint')}</Link>

            <div className="dropdown dropdown-hover p-18">
              <div tabIndex={0} className="flex justify-center items-center w-full">
                <span>
                  <Image
                    src="/zdy.png"
                    alt="zdy icon"
                    width={16}
                    height={16}
                  />
                </span>
                <NavElement
                  label={` ${t('nav.tool1')}`}//{t('nav.poolmanage')}
                  href="/meteorapool"
                />
              </div>
              <ul tabIndex={0} className="dropdown-content z-[1] menu shadow bg-base-100 rounded-box md:w-32">
                <li>
                  <NavElement
                    label={t('nav.pool1')}
                    href="/meteorapool"
                  />
                </li>

                <li>
                  <NavElement
                    label={t('nav.pool2')}
                    href="/meteoraliq"
                  />
                </li>

                <li>
                  <NavElement
                      label={t('nav.pool3')}
                    href="/removemeteoraliq"
                  />
                </li>

                <li>
                  <NavElement
                      label='SWAP'
                    href="/meteoraswap"
                  />
                </li>

              </ul>
            </div>

               
            <div className="dropdown dropdown-hover p-18">
              <div tabIndex={0} className="flex justify-center items-center w-full">
                <span>
                  <Image
                    src="/raydium.png"
                    alt="raydium icon"
                    width={16}
                    height={16}
                  />
                </span>
                <NavElement
                  label={`Raydium ${t('nav.tool')}`}//{t('nav.poolmanage')}
                  href="/market"
                />
              </div>
              <ul tabIndex={0} className="dropdown-content z-[1] menu shadow bg-base-100 rounded-box md:w-32">
                <li>
                  <NavElement
                    label={t('nav.market')}
                    href="/market"
                  />
                </li>

                <li>
                  <NavElement
                    label={t('nav.pool')}
                    href="/pool"
                  />
                </li>

                <li>
                  <NavElement
                    label={t('nav.repool')}
                    href="/remove"
                  />
                </li>

                <li>
                  <NavElement
                    label={t('nav.poolandbuy')}
                    href="/poolandbuy"
                  />
                </li>

                <li>
                  <NavElement
                    label={t('nav.marketmanage') + "-A"}
                    href="/marketmanage"
                  />
                </li>

                <li>
                  <NavElement
                    label={t('nav.marketmanage') + "-B"}
                    href="/marketmanagev2"
                  />
                </li>

                <li>
                  <NavElement
                    label={t('nav.tradebot')}
                    href="/tradebot"
                  />
                </li>


              </ul>
            </div>


            <div className="dropdown dropdown-hover p-18">
              <div tabIndex={0} className="flex justify-center items-center w-full">
                <span>
                  <Image
                    src="/pump.png"
                    alt="Pump icon"
                    width={16}
                    height={16}
                  />
                </span>
                <NavElement
                  label={`Pump ${t('nav.tool')}`}//{t('nav.marketmanage')}
                  href="/marketmanage"
                />
              </div>
              <ul tabIndex={0} className="dropdown-content z-[1] menu shadow bg-base-100 rounded-box md:w-32">
                <li>
                  <span>
                    <NavElement
                      label={`${t('nav.poolandbuy')} Pump`}
                      href="/createandbuypump"
                    />
                  </span>
                </li>

                <li>
                  <NavElement
                    label={t('nav.marketmanage') + "Pump"}
                    href="/marketagepump"
                  />
                </li>

                <li>
                  <NavElement
                    label={t('nav.tradebot') + "Pump"}
                    href="/tradebotpump"
                  />
                </li>
              </ul>
            </div>



            
          <Link href={"https://cryptologos.cc/"} target='_blank'>{t('nav.multi')}</Link>


            {/* <NavElement
              label={t('nav.more')}
              href="/more"
            /> */}

            {/* <NavElement
              label={t('nav.help')}
              href="https://help.pepetool.cc"
            /> */}
            <Link href={"https://help.pepetool.cc"} target='_blank'>{t('nav.help')}</Link>

            {process.env.NEXT_PUBLIC_DEBUG === "true" &&
              <NavElement
                label="Test"
                href="/test"
                navigationStarts={() => setIsNavOpen(false)}
              />}
          </div>
        </div>

        <div className="navbar-end">
          <div className="hidden md:inline-flex items-center justify-items gap-3">
            <div className="dropdown dropdown-hover ">
              <div tabIndex={0} role="button" className="btn btn-ghost rounded-btn text-lime-300">
                Gas {nowGas}
              </div>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-auto">
                <li> <button onClick={() => setGasfee(0)}>0</button> </li>
                <li> <button onClick={() => setGasfee(1)}>1x</button> </li>
                <li> <button onClick={() => setGasfee(2)}>2x</button> </li>
              </ul>
            </div>

            <div className="dropdown dropdown-hover ">
              <div role="button" className="btn btn-ghost rounded-btn text-lime-300" >
                <button onClick={() => setIsModalOpen(true)}>RPC</button>
              </div>
            </div>

            <div className="dropdown dropdown-hover ">
              <div tabIndex={0} role="button" className="btn btn-ghost rounded-btn">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.23 20.403a9.011 9.011 0 005.684-7.153h-3.942c-.147 2.86-.793 5.388-1.741 7.153zm-.757-7.153c-.178 4.102-1.217 7.25-2.473 7.25-1.256 0-2.295-3.148-2.473-7.25h4.946zm0-2.5H9.527C9.705 6.648 10.744 3.5 12 3.5c1.256 0 2.295 3.148 2.473 7.25zm2.499 0h3.942a9.01 9.01 0 00-5.683-7.153c.948 1.765 1.594 4.293 1.741 7.153zm-9.936 0c.147-2.862.793-5.392 1.743-7.156a9.01 9.01 0 00-5.693 7.156h3.95zm0 2.5h-3.95a9.01 9.01 0 005.693 7.157c-.95-1.765-1.596-4.295-1.743-7.157z" /></svg>
                {t('nav.lan')}
              </div>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-auto">
                         {/* locale="cn" */}
                <Link href={`/${cleanPathname}`} locale="cn"> 
                  <li> <button onClick={() => clientSideLanguageChange("cn")} >中文</button> </li>
                </Link>
                <Link href={`en/${cleanPathname}`}>
                  <li> <button onClick={() => clientSideLanguageChange("en")} >English</button> </li>
                </Link>
              </ul>
            </div>
            {/* <button onClick={() => clientrouter()} >router</button> */}
            <WalletMultiButtonDynamic className="btn-ghost btn-sm rounded-btn text-lg  ml-8 " />
            
          </div>
          <label
            htmlFor="my-drawer"
            className="btn-gh items-center justify-between md:hidden mr-6"
          // onClick={() => setIsNavOpen(!isNavOpen)} 
          >

            <div className="HAMBURGER-ICON space-y-2.5 ml-5">
              <div className={`h-0.5 w-8 bg-purple-600 ${isNavOpen ? 'hidden' : ''}`} />
              <div className={`h-0.5 w-8 bg-purple-600 ${isNavOpen ? 'hidden' : ''}`} />
              <div className={`h-0.5 w-8 bg-purple-600 ${isNavOpen ? 'hidden' : ''}`} />
            </div>

            <div className={`absolute block h-0.5 w-8 animate-pulse bg-purple-600 ${isNavOpen ? "" : "hidden"}`}
              style={{ transform: "rotate(45deg)" }}>
            </div>
            <div className={`absolute block h-0.5 w-8 animate-pulse bg-purple-600 ${isNavOpen ? "" : "hidden"}`}
              style={{ transform: "rotate(135deg)" }}>
            </div>
          </label>
          <div>
            {/* 线 */}
            {/* <span className="absolute block h-0.5 w-12 bg-zinc-600 rotate-90 right-14"></span> */}
          </div>
          {/* 钱包选项  网络等 */}
          <div className="dropdown dropdown-end">
            <div tabIndex={0} className="btn btn-square btn-ghost text-right mr-4">
              <svg className="w-7 h-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <ul tabIndex={0} className="p-2 shadow menu dropdown-content bg-base-100 rounded-box sm:w-52">
              <li>
                <div className="form-control bg-opacity-100">
                  <label className="cursor-pointer label">
                    <a>Autoconnect</a>
                    <input type="checkbox" checked={autoConnect} onChange={(e) => setAutoConnect(e.target.checked)} className="toggle" />
                  </label>
                  {/* 选择网络类型 */}
                  <NetworkSwitcher />
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <EndpointUpdater isModalOpen={isModalOpen} handleCancel={() => { setIsModalOpen(false) }} />
    </div>
  );
};

type Props = {
  // Add custom props here
}

export const getStaticProps: GetStaticProps<Props> = async ({
  locale,
}) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', [
      'common'
    ])),
  },
})


