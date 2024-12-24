import { AppProps } from 'next/app';
import Head from 'next/head';
import { FC } from 'react';
import { ContextProvider } from '../contexts/ContextProvider';
import { AppBar } from '../components/AppBar';
import { ContentContainer } from '../components/ContentContainer';
import { Footer } from '../components/Footer';
import Notifications from '../components/Notification'
require('@solana/wallet-adapter-react-ui/styles.css');
require('../styles/globals.css');
import { appWithTranslation, SSRConfig } from 'next-i18next'
//import type { AppProps as NextJsAppProps } from 'next/app';
import nextI18NextConfig from '../../next-i18next.config.js'
import EndpointUpdater from 'components/EndpointUpdater';

// declare type AppProps = NextJsAppProps & {
//   pageProps: SSRConfig;
// };


const App: FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <>
      <Head>
        <title>PEPE工具 | PEPEtool | 便捷的Solana工具箱</title>
      </Head>

      <ContextProvider>
        <div className="flex flex-col min-h-screen">
          <Notifications />
          <AppBar />

          {/* <div className="flex-grow"> */}
          <ContentContainer>
            
            <Component {...pageProps} />
            <Footer />
          </ContentContainer>
          {/* </div> */}



        </div>
      </ContextProvider>
    </>
  );
};

{/* <ContextProvider>
<div className="flex flex-col h-screen">
  <Notifications />
  <AppBar/>
  <ContentContainer>
    <Component {...pageProps} />
    <Footer/>
  </ContentContainer>
</div>
</ContextProvider> */}

export default appWithTranslation(App, nextI18NextConfig);
