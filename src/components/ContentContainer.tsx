import { FC } from 'react';
import Link from "next/link";
import Text from './Text';
import NavElement from './nav-element';
import type { GetStaticProps } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'

interface Props {
  children: React.ReactNode;
}

interface Props {
  //children: React.ReactNode;

}



// export const getStaticProps: GetStaticProps<Props> = async ({
//   locale,
// }) => ({
//   props: {
//     ...(await serverSideTranslations(locale ?? 'en', [
//       'common',
//     ])),
//   },
// })


export const ContentContainer: React.FC<Props> = ({ children }) => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { locale, pathname } = router;


  const cleanPathname = pathname.replace(/^\/+|\/+$/g, '');

  return (
    <div className="flex-1 drawer flex-col justify-between">
      <input id="my-drawer" type="checkbox" className="grow drawer-toggle" />
      <div className="items-center drawer-content overflow-hidden  flex flex-col justify-between">
        {children}
      </div>
      {/* SideBar / Drawer */}
      <div className="drawer-side  ">
        <label htmlFor="my-drawer" className="drawer-overlay gap-6"></label>
        <ul className="p-4 overflow-y-auto menu w-80 bg-base-100 gap-5 sm:flex items-center">
          <li>
            <Text variant="heading" className='font-extrabold tracking-tighter text-center text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mt-10'>SunTool</Text>
          </li>

          <li>
            <NavElement
              label={t('nav.home')}
              href="/"
            />
          </li>

           
          <li>
            <NavElement
              label={t('nav.telegram')}
               href="https://t.me/php520a"
            />
          </li>

        

          <li>
            <NavElement
              label={t('nav.multi')}
               href="https://cryptologos.cc"
            />
          </li>

          {/* <li>
            <NavElement
              label={t('nav.more')}
              href="/more"
            />
          </li> */}

          <li>
            <NavElement
              label={t('nav.help')}
              href="https://help.pepetool.cc"
            />
          </li>



          <div className="divider divider-primary"></div>
          <li>  <a>Language</a>
            <ul>
              <li>
                <NavElement
                  label="中文"
                  href={`/cn/${cleanPathname}`}
                />
              </li>
              <li>
                <NavElement
                  label="English"
                  href={`/en/${cleanPathname}`}
                />
              </li>

            </ul>
          </li>

          {/* <li>
            <NavElement
              label="首页"
              href="/"
            />
          </li>

          <li>
            <NavElement
              label="创建代币"
              href="/create"
            />
          </li>

          <li>
            <NavElement
              label="更新资料"
              href="/updata"
            />
          </li>

          <li>
            <NavElement
              label="权限"
              href="/authority"
            />
          </li>

          <li>
            <NavElement
              label="燃烧"
              href="/burn"
            />
          </li>

          <li>
            <NavElement
              label="批量转账"
              href="/multiSender"
            />
          </li>

          <li>
            <NavElement
              label="更多工具"
              href="/more"
            />
          </li>

          <li>
            <NavElement
              label="教程"
              href="https://help.pepetool.cc"
            />
          </li> */}

          {process.env.NEXT_PUBLIC_DEBUG === "true" &&
            <li>
              <NavElement
                label="Test"
                href="/test"
              />
            </li>
          }


          {/* <li>
          <NavElement
            label="Basics"
            href="/basics"
          />
          </li> */}




        </ul>
      </div>
    </div>
  );
};




// export const getStaticProps: GetStaticProps<Props> = async ({
//   locale,
// }) => ({
//   props: {
//     ...(await serverSideTranslations(locale ?? 'en', [
//       'common',
//     ])),
//   },
// })
