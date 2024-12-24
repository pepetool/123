import { WalletAdapterNetwork, WalletError } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import {
    UnsafeBurnerWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { Cluster, clusterApiUrl } from '@solana/web3.js';
import { FC, ReactNode, useCallback, useMemo } from 'react';
import { AutoConnectProvider, useAutoConnect } from './AutoConnectProvider';
import { notify } from "../utils/notifications";
import { NetworkConfigurationProvider, useNetworkConfiguration } from './NetworkConfigurationProvider';
import dynamic from "next/dynamic";

import {
    //BackpackWalletAdapter,
    //GlowWalletAdapter,
    PhantomWalletAdapter,
    //SlopeWalletAdapter,
    SolflareWalletAdapter,
    TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";

import { Connection, PublicKey } from '@solana/web3.js';
import { getPublicRpc } from 'utils/config';
import { useEndpoint, EndpointProvider } from './EndpointProvider';

const ReactUIWalletModalProviderDynamic = dynamic(
    async () =>
        (await import("@solana/wallet-adapter-react-ui")).WalletModalProvider,
    { ssr: false }
);



//const provider = getProvider();
//const message = 'To avoid digital dognappers, sign below to authenticate with CryptoCorgis.';

const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const { autoConnect } = useAutoConnect();
    const { networkConfiguration } = useNetworkConfiguration();
    const network = networkConfiguration as WalletAdapterNetwork;
    // const network =
    // process.env.NEXT_PUBLIC_HELIUS_TOKEN_MAIN;
    // const opts = {
    // preflightCommitment: "processed",
    // };

    //const endpoint = useMemo(() => clusterApiUrl(network), [network]);
    //const endpoint = process.env.NEXT_PUBLIC_DEBUG==="true" ? process.env.NEXT_PUBLIC_RPC_DEV : process.env.NEXT_PUBLIC_RPC;
    //const endpoint = process.env.NEXT_PUBLIC_DEBUG==="true" ? process.env.NEXT_PUBLIC_RPC_DEV : getPublicRpc();
    const { endpoint } = useEndpoint();
    //const endpoint = useMemo(() => network, [network]);
    //console.log(endpoint);

    const wallets = useMemo(
        () => [
            //new UnsafeBurnerWalletAdapter(),
            //provider
            //new PhantomWalletAdapter(),

        ],
        [network]
    );

    //错误钩子
    // const onError = useCallback(
    //     (error: WalletError) => {
    //         notify({ type: 'error', message: error.message ? `${error.name}: ${error.message}` : error.name });
    //         console.error(error);
    //     },
    //     []
    // );

    return (
        // TODO: updates needed for updating and referencing endpoint: wallet adapter rework
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} /* onError={onError} */ autoConnect={autoConnect}>
                <ReactUIWalletModalProviderDynamic>
                    {children}
                </ReactUIWalletModalProviderDynamic>
            </WalletProvider>
        </ConnectionProvider>
    );
};

export const ContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <>
            <NetworkConfigurationProvider>
                <AutoConnectProvider>
                    <EndpointProvider>
                        <WalletContextProvider>{children}</WalletContextProvider>
                    </EndpointProvider>
                </AutoConnectProvider>
            </NetworkConfigurationProvider>
        </>
    );
};
