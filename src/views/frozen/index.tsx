// Next, React
import { FC, useEffect, useState } from 'react';
// Wallet
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import Select from 'react-select';
import { notify } from 'utils/notifications';
import { burntokensAndcloseacc, burntokens, setMintTokenProc, disableAccount } from '../../utils/web3';
import { getTokenAccounts, getMetadata, getImageUri, truncateString, getTokenListByShyft } from '../../utils/gettoken';
import Loading from 'components/Loading';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { useTranslation } from 'next-i18next'
import { ExtensionType, TOKEN_PROGRAM_ID, TokenAccountNotFoundError, TokenInvalidAccountOwnerError, getAccount, getAssociatedTokenAddress, getExtensionData, getExtraAccountMetaAddress, getExtraAccountMetas, getMetadataPointerState, getMint, getMintCloseAuthority, getTokenMetadata, resolveExtraAccountMeta } from '@solana/spl-token';
import { getTokenMetadataProc } from 'utils/getTokenMetadataA';
import LogoImage from 'utils/imageParam';
import { Typography } from 'antd';
import { usesBeet } from '@metaplex-foundation/mpl-token-metadata';
import { Tag } from 'antd';


import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  MinusCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';


let tokenlist = [];



export const FrozenView: FC = ({ }) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signMessage, signTransaction, signAllTransactions } = useWallet();
  const [isChecked, setisChecked] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [options, setOptions] = useState([]);
  const [tokentotal, setTokentotal] = useState(0);
  const [signature, setSignature] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation('common');
  const { Text } = Typography;
  const [mintAuth, setmintAuth] = useState(0);  //0 空  1未放弃  2放弃  3读取中
  const [corAuth, setcorAuth] = useState(0);  //0未查找 -1地址错误 1未弃权  2已弃权 3账户不存在 4查询中
  const [corAmount, setCorAmount] = useState(0);
  const [corAddress, setCorAddress] = useState("");



  //const [isDisMytoken, setDisMytoken] = useState(false);

  function roundUp(num) {
    return Math.ceil(num);
  }

  const getSolBalance = async () => {
    let balance = 0;
    try {
      balance = await connection.getBalance(
        publicKey,
        'confirmed'
      );
      balance = balance / LAMPORTS_PER_SOL;
      return balance;
    } catch (e) {
      console.log(`error getting balance: `, e);
      return 0;
    }
  }

  const [imageSrc, setImageSrc] = useState(null);



  async function displaytokenList(isAll, keystr?: string) {
    if (isAll) {
      setOptions([]);
      for (let i = 0; i < tokenlist.length; i++) {
        if (tokenlist[i].isToken) {
          const uri: string = tokenlist[i].uri;
          const newOption = {
            value: i,   //(数量:${tokenlist[i].amount / Math.pow(10, 9)})
            label:
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200">
                    <LogoImage src={uri} alt='LOGO' />
                  </div>
                  <div>
                    <span className="text-rose-600 ml-2">{tokenlist[i].symbol}</span>
                    <span className="text-stone-400 text-xs ml-2">{truncateString(tokenlist[i].label, 16, 8, 8)}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-rose-400 text-xs">余额: {tokenlist[i].amount}</span>
                </div>
              </div>,
            mint: tokenlist[i].label,
            amount: tokenlist[i].amount,
            address: tokenlist[i].address,
            dec: tokenlist[i].dec,
          };
          setOptions(prevOptions => [...prevOptions, newOption]);
        } else {
          const newOption = {
            value: i,     //(数量:${tokenlist[i].amount / Math.pow(10, 9)}) 
            label:
              <div className="flex justify-between">
                <span className="text-stone-400 text-sm ml-2">Token - {truncateString(tokenlist[i].label, 16, 8, 8)}</span>
                <span className="text-gray-400 text-sm">余额:{tokenlist[i].amount / Math.pow(10, 9)}</span>
              </div>,
            //<div style={{display: 'flex', justifyContent: 'space-between'}}>Tokens - {tokenlist[i].label}<span style={{fontSize: '0.8em'}}>余额:{roundUp(tokenlist[i].amount  / Math.pow(10, 9))}</span></div>, 
            mint: tokenlist[i].label,
            amount: tokenlist[i].amount / Math.pow(10, 9),
            address: tokenlist[i].address,
            dec: tokenlist[i].dec,
          };
          setOptions(prevOptions => [...prevOptions, newOption]);
        }
      }
    } else {
      setOptions([]);
      console.log(tokenlist);
      for (let i = 0; i < tokenlist.length; i++) {
        if (tokenlist[i].isToken && tokenlist[i].updateAuthority === keystr) {
          const newOption = {
            value: i,   //(数量:${tokenlist[i].amount / Math.pow(10, 9)})
            label:
              <div className="flex justify-between">
                <span className="text-gray-800">{tokenlist[i].symbol} - {tokenlist[i].label}</span>
                <span className="text-gray-400 text-sm">余额:{tokenlist[i].amount / Math.pow(10, 9)}</span>
              </div>,
            mint: tokenlist[i].label,
            address: tokenlist[i].address,
          };
          setOptions(prevOptions => [...prevOptions, newOption]);
        }
      }
    }
  }

  const handleChange = async selectedOption => {
    setSelectedOption(selectedOption);
    if (publicKey) {
      setmintAuth(3);
      console.log(selectedOption.mint);
      const tokenKey = new PublicKey(selectedOption.mint);
      const Mint = await getMint(connection, tokenKey);
      console.log(Mint.freezeAuthority);  //冻结权限  一个publick.toString()地址或Null
      //console.log(Mint.mintAuthority);  //Mint权限   一个publick.toString()地址或Null
      if (Mint.freezeAuthority) {
        setmintAuth(1);
      } else {
        setmintAuth(2);
      }
    }
  };

  const handleFilterclick = () => {
    //const { publicKey } = useWallet();
    displaytokenList(false, publicKey.toString());
  }

  //确定燃烧
  const handleEnterbtnclick = async () => {

    if (!publicKey) {
      notify({ type: "error", message: "提示", description: "请先连接钱包!" });
      return;
    }

    if (!selectedOption) {
      notify({ type: "error", message: "提示", description: "请先选择代币!" });
      return;
    }

    if (corAuth !== 1) {
      notify({ type: "error", message: "提示", description: "此地址当前状态不可冻结，请重新输入地址" });
      return;
    }
    // console.log("1");
    // return;
    // console.log(selectedOption.dec);
    // return;
    //const dec = Number(selectedOption.dec);
    //const corAddrdoc = document.getElementById('coraddr') as HTMLInputElement | null;
    const corAddr = new PublicKey(corAddress);
    const mint = new PublicKey(selectedOption.mint);
    //const corAddr = new PublicKey();
    //const mintAmount = Number(amount?.value) * Math.pow(10, dec);

    // console.log(amount?.value);
    // return;

    console.log(selectedOption.address);
    console.log(selectedOption.mint);
    setIsLoading(true);
    try {
      const mintIx = await disableAccount(corAddr, mint, publicKey);//setMintTokenProc(publicKey, new PublicKey(selectedOption.mint), dec, mintAmount);
      mintIx.feePayer = wallet.publicKey;
      mintIx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      const signedTx = await wallet.signTransaction(mintIx);
      const wireTx = signedTx.serialize();
      const mintSignature = await connection.sendRawTransaction(wireTx, { skipPreflight: true });
      //
      setIsLoading(false);
      if (mintSignature) {
        notify({ type: "success", message: "完成", description: "交易已发送" });
        console.log(mintSignature);
        console.log("success", "Succeed to revoke mint authority!");
      }
      else {
        console.log("warning", "Failed to revoke mint authority!");
      }
    } catch (err) {
      setIsLoading(false);
      notify({ type: "error", message: "错误,交易未完成" });
      console.log(err);
    }
  }

  const handleFocus = async () => {
    if (publicKey) {
      if (!isChecked) {
        setisChecked(true);
        setOptions(prevOptions => [...prevOptions, { label: "Loading..." }]);
        let reJson = await getTokenListByShyft(publicKey.toString());
        if (reJson.result) {
          setisChecked(true);
          tokenlist = [];
          for (let i = 0; i < reJson.result.length; i++) {
            const nowToken = reJson.result[i];
            if (nowToken.info.name === "Unknown Token") {
              tokenlist.push({
                value: i,
                label: nowToken.address,  //代币地址
                address: nowToken.associated_account,
                amount: nowToken.balance,  //余额  已经处理了dec的
                isToken: false,
                name: nowToken.info.name,
                symbol: nowToken.info.symbol,
                uri: nowToken.info.image,
                dec: nowToken.info.decimals
              });
            } else {
              tokenlist.push({
                value: i,
                label: nowToken.address,  //代币地址
                address: nowToken.associated_account,
                amount: nowToken.balance,  //余额  已经处理了dec的
                isToken: true,
                name: nowToken.info.name,
                symbol: nowToken.info.symbol,
                uri: nowToken.info.image,
                dec: nowToken.info.decimals
              });
            }
          }
          displaytokenList(true);
        }
      }
    } else {
      notify({ type: 'error', message: '错误', description: "请先连接钱包" });
    }
  }

  const onAddrChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;//parseInt(event.target.value, 10);
    //console.log(value);
    if (value !== "") {
      if (selectedOption) {
        setcorAuth(4);
        setCorAddress("");
        try {
          const corKey = new PublicKey(value);
          const mint = new PublicKey(selectedOption.mint);
          const CorATA = await getAssociatedTokenAddress(
            mint,  //Mint
            corKey       //转账人
          );
          let CorAcc;
          try {
            CorAcc = await getAccount(connection, CorATA);
            console.log("coracc:", CorAcc);

            const corAmt = Number(CorAcc.amount) / LAMPORTS_PER_SOL;
            setCorAmount(corAmt);
            if (CorAcc.isFrozen) {
              setcorAuth(2);
            } else {
              setcorAuth(1);
              setCorAddress(CorAcc.address.toString());
            }
          } catch (error: unknown) {
            if (error instanceof TokenAccountNotFoundError || error instanceof TokenInvalidAccountOwnerError) {
              setcorAuth(3);
            } else {
              console.log(error);
              notify({ type: "error", message: "查询错误" })
            }
          }
        } catch (err) {
          console.log(err);
          setcorAuth(-1);
        }
      }
    } else {
      setcorAuth(0);
    }
  }





  return (

    <div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col">
        <div className='mt-6'>
          <h1 className="text-center text-4xl md:pl-12 text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-4">
            冻结账户
          </h1>
          <h1 className="text-center text-1xl md:p-0 md:pl-12 text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500">
            “黑名单”功能，被冻结的账户无法进行交易、转账等。有助于防止机器人对代币进行恶意攻击等！
          </h1>
          {/* <button onClick={handletestproc}>获取程序地址</button> */}
          {/* <button onClick={handletestproc2}>test2</button> */}
        </div >
        <div className="text-center mt-6">
          <div>
            <div className="md:w-[450px]">
              <span className='flex text-slate-300'>选择代币:</span>
              <div className="text-left">
                <Select
                  value={selectedOption}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  //onMenuOpen={handleMenuClick}
                  options={options}
                  isMulti={false} // 如果想要多选，则设置为true        
                  className="text-black" // 使用 Tailwind 的 text-black 类来修改字体颜色
                />
              </div>

              {/* <p><Text type="danger">条件: 1.你是代币的创建者  2.未丢弃代币增发权限</Text></p> */}
              <div className='flex mt-2'>
                {mintAuth === 1
                  ? <Tag icon={<CheckCircleOutlined />} color="success" style={{ fontSize: '16px' }} >未放弃权限,可操作 </Tag>
                  : mintAuth === 2 ? <Tag icon={<CloseCircleOutlined />} color="error" style={{ fontSize: '16px' }}>已放弃冻结权限，请重新选择代币 </Tag>
                    : mintAuth === 3 ? <Tag icon={<SyncOutlined spin />} color="processing" style={{ fontSize: '16px' }}>查询中</Tag>
                      : ""
                }
              </div>


              <input id="coraddr" className="max-w-md mx-auto mockup-code bg-primary border-2 border-[#5252529f] text-xs mt-2 p-2 my-2 w-full" onChange={onAddrChange} placeholder="请输入要冻结的地址"></input>
              <div className='flex mt-2'>
                {corAuth === 1
                  ? <div>
                    <Tag icon={<CheckCircleOutlined />} color="success" style={{ fontSize: '16px' }}>
                      可冻结
                    </Tag>
                    <Tag color="#69B1FF" style={{ fontSize: '16px' }}>目标钱包余额:{corAmount}</Tag>
                  </div>
                  : corAuth === -1 ? <Tag icon={<CloseCircleOutlined />} color="error" style={{ fontSize: '16px' }}>地址错误 </Tag>
                    : corAuth === 2 ? <Tag icon={<CloseCircleOutlined />} color="error" style={{ fontSize: '16px' }}>此地址已在黑名单 </Tag>
                      : corAuth === 3 ? <Tag icon={<CloseCircleOutlined />} color="error" style={{ fontSize: '16px' }}>此钱包没有对应的代币 </Tag>
                        : corAuth === 4 ? <Tag icon={<SyncOutlined spin />} color="processing" style={{ fontSize: '16px' }}>查询中</Tag>
                          : ""
                }
              </div>

              {/* <div className='flex mt-2'>
                <Tag icon={<ClockCircleOutlined />} color="warning" style={{ fontSize: '16px' }}>
                  waiting
                </Tag>
              </div> */}

              <button className="px-16 m-2 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                onClick={handleEnterbtnclick}>
                冻结帐号
              </button>

              {/* <p className="md:w-full md:text-1xl text-center text-slate-500 my-2 text-xs">{t('free.all')}</p> */}

            </div>
          </div>
        </div>
      </div>
      {isLoading && <Loading />}
    </div>
  );
};
