import { useConnection, useWallet, } from '@solana/wallet-adapter-react';
import { disableAuthority } from '../utils/web3';
import { FC, useCallback, useState } from 'react';
import { notify } from "../utils/notifications";
import { useNetworkConfiguration } from 'contexts/NetworkConfigurationProvider';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { useMemo } from 'react';
import {
    clusterApiUrl,
    PublicKey,
} from '@solana/web3.js';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { useTranslation } from 'next-i18next'
import { FloatButton } from 'antd';
import MsgBoxView, { MessageBoxPam, useMessageBoxPam } from 'views/msgbox';



export const AuthorityParam: FC = () => {
    const { connection } = useConnection();
    //const userWallet = Keypair.generate();
    const { publicKey, sendTransaction, signMessage, signTransaction, signAllTransactions } = useWallet();
    const { networkConfiguration } = useNetworkConfiguration();
    const network = networkConfiguration as WalletAdapterNetwork;
    const wallet = useAnchorWallet();
    const [metaplex, setMetaplex] = useState(null);
    const [signature, setSignature] = useState<string>("");
    const { t } = useTranslation('common');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const initialPam: MessageBoxPam = {
        addrTag: '',
        addrName: '',
        addr1: '',
        hxName: '',
        hxAddr: ''
    };
    const [messageBoxPam, updateMessageBoxPam] = useMessageBoxPam(initialPam);


    const onClick = useCallback(async () => {
        //const connection = new Connection("https://solana-mainnet.core.chainstack.com/1a404624f4d24c3f11322e195faf25b0");

        if (publicKey) {
            // console.log('钱包已链接'+publicKey.toString());
            // console.log('当前链接:'+clusterApiUrl(network));
            //return;
            //公钥地址指向钱包显示的地址  钱包已链接5qpH4oPbJGMGifhSCPUTX8gWaFCLQtofmmTYn9pFerEj
            const tokenAddr = document.getElementById('tokenaddr') as HTMLInputElement | null;
            //freeMeta
            const freeMeta = document.getElementById('freeMeta') as HTMLInputElement | null;
            const minttoken = document.getElementById('minttoken') as HTMLInputElement | null;
            const freeAccount = document.getElementById('freeAccount') as HTMLInputElement | null;
            //freeAccount  freeMeta

            // console.log(tokenAddr?.value+","+minttoken?.value+","+freeAccount?.value);
            const isMintTokenChecked = minttoken.checked;
            const isFreeAccountChecked = freeAccount.checked;
            const isfreeMeta = freeMeta.checked;

            // console.log('Mint Token Checkbox is ' + (isMintTokenChecked ? 'checked' : 'unchecked'));
            // console.log('Free Account Checkbox is ' + (isFreeAccountChecked ? 'checked' : 'unchecked'));
            // return;
            if (isMintTokenChecked || isFreeAccountChecked || isfreeMeta) {
                try {
                    //===========放弃权限应该成功了!
                    //alert("hi")
                    const addr = new PublicKey(tokenAddr?.value);
                    const mintIx = await disableAuthority(connection, addr, publicKey, isMintTokenChecked, isFreeAccountChecked, isfreeMeta);
                    mintIx.feePayer = wallet.publicKey;

                    const blockhash = (await connection.getLatestBlockhash()).blockhash;
                    mintIx.recentBlockhash = blockhash;
                    //mintIx.partialSign(addr);

                    const signedTx = await wallet.signTransaction(mintIx);
                    const wireTx = signedTx.serialize();
                    const mintSignature = await connection.sendRawTransaction(wireTx, { skipPreflight: true });
                    setSignature(mintSignature);
                    const newPam: MessageBoxPam = {
                    addrTag: 'tx',
                    addrName: "提示:",
                    addr1: "可点击下方查看哈希上链情况",
                    hxName: '交易哈希:',
                    hxAddr: mintSignature
                    };
                    updateMessageBoxPam(newPam);
                    setIsModalOpen(true);
                    //alert("hi2")
                    if (mintSignature) {
                        notify({ type: "success", message: "完成.." });
                        console.log("success", "Succeed to revoke mint authority!");
                    }
                    else {
                        console.log("warning", "Failed to revoke authority!");
                    }
                }
                catch (err) {
                    //console.log(err);
                    console.log("warning", err);
                }
            } else {
                notify({ type: "error", message: "请至少选择一样" });
            }
            //alert("hi11")
            return;
        }
        else {
            notify({ type: 'error', message: '错误', description: '钱包未链接...' });
            console.log('error', 'wallet not connect!');
            return;
        }

    }, [notify, sendTransaction]);

    return (
        <div>
            <button
                className="px-16 m-2 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                onClick={onClick}
            >
                <span>{t('auth.enter')} </span>

            </button>
            {/* <p className="md:w-full md:text-1xl text-center text-slate-500 my-2 text-xs">{t('free.all')}</p> */}
            <FloatButton tooltip={<div> {t('msgbox.fbtn')}</div>} onClick={() => setIsModalOpen(true)}  />
            <MsgBoxView isModalOpen={isModalOpen} msgParam={messageBoxPam} handleCancel={() => { setIsModalOpen(false) }} />
        </div>
    );
};

