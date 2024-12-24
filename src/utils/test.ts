import { Keypair, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { sleep } from "./config";
import bs58 from "bs58";
import { getTokenListByShyft } from "./gettoken";
const crypto = require('crypto');
import fetch, { RequestInit, RequestRedirect } from 'node-fetch';

// 加密函数
function encrypt(text, password) {
  const cipher = crypto.createCipher('aes-256-cbc', password);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// 解密函数
function decrypt(encryptedText, password) {
  const decipher = crypto.createDecipher('aes-256-cbc', password);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// // 测试加密解密
// const text = '';   //加密文本
// const password = ''; // 用于加密解密的密钥，请确保足够复杂和安全

// const encryptedText = encrypt(text, password);
// console.log('加密后的文本:', encryptedText);

// const decryptedText = decrypt(encryptedText, password);
// console.log('解密后的文本:', decryptedText);

function encryptmysiyao(){
    const text = '2df5f70817d4a6c67e904ada67d85d485cf9e7162bd98a5ac5147bee1f8e40ac6f4d1601e19f48fea9b3e01291393546d95c46fb60a5bb34fc0bdf5124d84ee22f4662fab867a62bbf398f6824e3722e10326062ddffcbae7a0d2d88ecc5ddfb';
    const password = '@'; 

    // const encryptedText = encrypt(text, password);
    // console.log('加密后的文本:', encryptedText);

    const decryptedText = decrypt(text, password);
    console.log('解密后的文本:', decryptedText);
}
//encryptmysiyao();


// function main(){
//   const keypai = Keypair.generate();
//   console.log("秘钥:", keypai.publicKey.toString());
//   console.log("私钥:", bs58.encode(keypai.secretKey));
// }
// main();


let finder = false;

async function main() {
  console.log('正在开始创建靓号!');
  await new Promise(resolve => setTimeout(resolve, 1000));
  let i = 0;
  const patterns = [
    /^888.*888$/,
    /^666.*666$/,
    /^fox.*888$/,
    /^fox.*666$/,
    /^Fox.*888$/,
    /^Fox.*666$/,
    /.*8888$/,
    /.*6666$/,
    /.*(Pump|pUmp|PuMp|pumP|PUmp|PumP|PUMp|pump)$/
  ];

  while (!finder) {
    await sleep(1);
    const keypai = Keypair.generate();
    i += 1;
    const keystr = keypai.publicKey.toString();
    if (patterns.some(pattern => pattern.test(keystr))) {
      console.log('生成靓号成功');
      console.log('秘钥:', keystr);
      console.log('私钥:', bs58.encode(keypai.secretKey));
      finder = true;
      break;
    }
  }
}

async function test() {
  const promises = [];
  for (let i = 0; i < 100; i++) { // 增加并发数量到100
    promises.push(main());
  }
  await Promise.all(promises);
}
//test();

// async function main(){
//     const json = await getTokenListByShyft("LM4rkN3fqBHhnPKCaYXi7wRGdJZ3L5PjNBMdPWwm888");
//     console.log(json);
// }
// main();
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createCloseAccountInstruction, getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import { getuid } from "process";


// async function getaccount(){
//     const rpc = "https://late-bold-frog.solana-mainnet.quiknode.pro/f1f4d357a1d3468a05726f12051b10fa57790c3b/";
//     //
//     const connect = new Connection(rpc);
//     const mint = new PublicKey("CcQqnYA8GsCrgCkMg586Pqjk8dWjJAcv26NH7LfnaR5f");  //代币Mint
//     const addr = new PublicKey("C15wuCYePWPJaRTimLxDgS8j7qewtUSnzKbcJiFUYuF3");   //目标地址

//     const CorATA = await getAssociatedTokenAddress(
//         mint,  
//         addr    
//       );

//     //const Acc = await connect.getAccountInfo();
//     const Acc = await getAccount(connect, CorATA);
//     console.log(Acc);
//     //Acc.isFrozen: false,  没禁用  true,禁用
//     //Acc.amount = 数量




// }
// getaccount();


//=============扫描持币人
async function getAllAccByMint(connect, pubkey) {
  const accounts = await connect.getParsedProgramAccounts(
    TOKEN_PROGRAM_ID, // new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
    {
      filters: [
        {
          dataSize: 165, // number of bytes
        },
        {
          memcmp: {
            offset: 0, // number of bytes
            bytes: pubkey, // base58 encoded string
          },
        },
      ],
    }
  );
  return accounts;
}


async function getTokenAccount(connect, pubkey) {
  const accounts = await connect.getParsedProgramAccounts(
    TOKEN_PROGRAM_ID, // new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
    {
      filters: [
        {
          dataSize: 165, // number of bytes
        },
        {
          memcmp: {
            offset: 32, // number of bytes
            bytes: pubkey, // base58 encoded string
          },
        },
      ],
    }
  );
  return accounts;
}


async function getTokenList() {
  const rpc = "https://late-bold-frog.solana-mainnet.quiknode.pro/f1f4d357a1d3468a05726f12051b10fa57790c3b/";
  const connect = new Connection(rpc);
  const mint = new PublicKey("C15wuCYePWPJaRTimLxDgS8j7qewtUSnzKbcJiFUYuF3");  //代币Mint 23YWegTQMovijdtg8Smd5PhrsYTNQs7pewty6ZKt7A1L
  //获取持币地址
  // const tokenAccount = await getAllAccByMint(connect, mint);
  // console.log(tokenAccount);

  // for (let j = 0; j < tokenAccount.length; j++) {
  //     const Tokeninfo = tokenAccount[j].account.data.parsed.info;
  //     console.log(Tokeninfo.owner + "," + Tokeninfo.tokenAmount.uiAmount);
  // }

  //获取账户
  const tokenAccount = await getTokenAccount(connect, mint);
  console.log(tokenAccount);
  //console.log(baseToken);
  for (let j = 0; j < tokenAccount.length; j++) {
    const Tokeninfo = tokenAccount[j].account.data.parsed.info;
    console.log(Tokeninfo);

  }
}
//getTokenList();

const getViewToken = async (url) => {
  var myHeaders = new Headers();
  //Accept: */*
  //Accept-Encoding: gzip, deflate, br
  //Accept-Language: zh-CN,zh;q=0.9
  //User-Agent: Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36
  myHeaders.append("Accept", "*/*");
  myHeaders.append("Accept-Encoding", "gzip, deflate, br");
  myHeaders.append("Accept-Language", "zh-CN,zh;q=0.9");
  myHeaders.append("User-Agent", "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36");


  var requestOptions = {
    method: 'GET',
    headers: myHeaders,
  };
  //https://api.shyft.to/sol/v1/wallet/all_tokens?network=mainnet-beta&wallet=
  //const url = `https://ssec2.chinaacc.com/jxjyhls.cdeledu.com/i45iQfXUKa38K7bK0l-rSLG6P5OnQQT-SHkreAq8Td-FNsY0i5V0S2bznlw78uM8.mp4/seg-${i}-v1-a1.ts?cwareID=6909&videoID=103&userID=63341569&time=1715308893538&code=cb149b2f2638b2ce9e22d053eee253c7&sid=&host=jxjyxuexi.chinaacc.com`
  //https://ssec2.chinaacc.com/jxjyhls.cdeledu.com/i45iQfXUKa38K7bK0l-rSLG6P5OnQQT-SHkreAq8Td-FNsY0i5V0S2bznlw78uM8.mp4/seg-16-v1-a1.ts?cwareID=6909&videoID=103&userID=63341569&time=1715308893538&code=cb149b2f2638b2ce9e22d053eee253c7&sid=&host=jxjyxuexi.chinaacc.com
  //https://ssec2.chinaacc.com/jxjyhls.cdeledu.com/i45iQfXUKa38K7bK0l-rSLG6P5OnQQT-SHkreAq8Td-FNsY0i5V0S2bznlw78uM8.mp4/seg-4-v1-a1.ts?cwareID=6909&videoID=103&userID=63341569&time=1715308713729&code=2190e2147ab718083dbe8666e95cc15c&sid=&host=jxjyxuexi.chinaacc.com
  const response = await fetch(url, requestOptions);
  // const data = await response.json();
  // //fetch("https://api.shyft.to/sol/v2/nft/compressed/read_all?network=mainnet-beta&wallet_address=3PnTBCxBP7Eb7QMVSKTsTodDxfvQsLr4AKEaT8jeM2xJ&collection=Evya1SENYn5NUC66hv6hWmtxAcEAXymEt2TfaAHyvkhk&refresh=true&page=1&size=1", requestOptions)
  // if (!data.result) {
  //   console.error("No result in the response", data);
  //   return;
  // }
  // console.log(JSON.stringify(data.result, null, 2));
  return response;

};

function getUrl(videoAddr, i, cwareId, videoID, userID, code) {
  const data = Date.now();
  const nowtime = Math.floor(new Date(data).getTime());
  return `https://ssec2.chinaacc.com/jxjyhls.cdeledu.com/${videoAddr}/seg-${i}-v1-a1.ts?cwareID=${cwareId}&videoID=${videoID}&userID=${userID}&time=${nowtime}&code=${code}&sid=&host=jxjyxuexi.chinaacc.com`
}

async function viewmain() {
  //--------
  //1715309146633
  //1715310515329

  //return;
  for (let i = 1; i <= 100; i++) {
    //const data = Date.now();
    //const nowtime = Math.floor(new Date(data).getTime());
    //https://ssec2.chinaacc.com/jxjyhls.cdeledu.com/i45iQfXUKa38K7bK0l-rSLG6P5OnQQT-SHkreAq8Td8cVY7PlLFtQmbznlw78uM8.mp4/seg-2-v1-a1.ts?cwareID=6909&videoID=104&userID=63341569&time=1715310647792&code=4d8baa1c73546a03d1ad826b7ccc9397&sid=&host=jxjyxuexi.chinaacc.com
    //https://ssec2.chinaacc.com/jxjyhls.cdeledu.com/i45iQfXUKa38K7bK0l-rSLG6P5OnQQT-SHkreAq8Td-R3qyHlWWpNGbznlw78uM8.mp4/seg-3-v1-a1.ts?cwareID=6909&videoID=105&userID=63341569&time=1715310666567&code=364df3ac8c62974f0fdcf9bd4f92ce47&sid=&host=jxjyxuexi.chinaacc.com
    // const url = getUrl("i45iQfXUKa38K7bK0l-rSLG6P5OnQQT-SHkreAq8Td8cVY7PlLFtQmbznlw78uM8.mp4", i, "6909", "104", "63341569", "4d8baa1c73546a03d1ad826b7ccc9397");
    // const res = await getViewToken(url);
    // console.log(`1-${i}:`,res.status);
    const url2 = getUrl("i45iQfXUKa38K7bK0l-rSLG6P5OnQQT-SHkreAq8Td8cVY7PlLFtQmbznlw78uM8.mp4", i, "6909", "105", "63341569", "364df3ac8c62974f0fdcf9bd4f92ce47");
    const res2 = await getViewToken(url2);
    console.log(`2-${i}:`, res2.status);

    await sleep(10000);
  }
}
// viewmain();


// Node.js (using axios)
const axios = require('axios');

//function
const url = "https://pumpapi.fun/api/get_newer_mints";
const params = { limit: 10 };  // Optional parameter to limit results

// axios.get(url, { params })
//     .then(response => {
//         if (response.status === 200) {
//             console.log(response.data);  // Process the JSON response
//         } else {
//             console.error(`Error retrieving data: ${response.status}`);
//         }
//     })
//     .catch(error => {
//         console.error(error);
//     });

//get();

import {
  SystemProgram,
  clusterApiUrl,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { keyBeet } from "@metaplex-foundation/mpl-token-metadata";
import { keypairIdentity } from "@metaplex-foundation/js";


// (async () => {

//   let basePubkey = new PublicKey(
//     "2nfpX2vpenwayhHc8utRsDf2h3xFKobU5Lj6PD19HqpC"
//   );
//   let seed = "foxtool";
//   let programId = SystemProgram.programId;

//   console.log(
//     `${(
//       await PublicKey.createWithSeed(basePubkey, seed, programId)
//     ).toBase58()}`
//   );
// })();

// (async () => {
//   // connection
//   const connection = new Connection("https://late-bold-frog.solana-mainnet.quiknode.pro/f1f4d357a1d3468a05726f12051b10fa57790c3b");
//   //const keypai = Keypair.generate();
//   // console.log(bs58.encode(keypai.secretKey));
//   // console.log(keypai.publicKey.toString());
//   // return;
//   // 5YNmS1R9nNSCDzb5a7mMJ1dwK9uHeAAF4CmPEwKgVWr8
//   const feePayer = Keypair.fromSecretKey(
//     bs58.decode(
//       "B2Z1ZkFh4wPx92bY1wf2QuHtiH5NET11Jkb5vmFWbaoZNsMdFqLNa86UubKvJSoZ8juVp9jodRoGe3nq5VdFvYM"
//     )
//   );

//   // G2FAbFQPFa5qKXCetoFZQEvF9BVvCKbvUZvodpVidnoY
//   const base = Keypair.fromSecretKey(
//     bs58.decode(
//       "5v3i1MQd2u5vnNQrJGsU9RppBSvo4e8YBLk1fT8Bpwo4Ve9sd59DJZfRR3kdFGLq6vmCM5QRTCD8yGBfETByfMTE"
//     )
//   );

//   let basePubkey = base.publicKey;
//   let seed = "foxtool";
//   let programId = SystemProgram.programId;

//   let derived = await PublicKey.createWithSeed(basePubkey, seed, programId);

//   const tx = new Transaction().add(
//     SystemProgram.createAccountWithSeed({
//       fromPubkey: feePayer.publicKey, // funder
//       newAccountPubkey: derived,
//       basePubkey: basePubkey,
//       seed: seed,
//       lamports: 0.03 * LAMPORTS_PER_SOL, // 0.1 SOL
//       space: 0,
//       programId: programId,
//     })
//   );

//   console.log(
//     `txhash: ${await sendAndConfirmTransaction(connection, tx, [
//       feePayer,
//       base,
//     ])}`
//   );
// })();

// (async () => {
//   // connection
//   const connection = new Connection("https://late-bold-frog.solana-mainnet.quiknode.pro/f1f4d357a1d3468a05726f12051b10fa57790c3b");

//   // 5YNmS1R9nNSCDzb5a7mMJ1dwK9uHeAAF4CmPEwKgVWr8
//   const feePayer = Keypair.fromSecretKey(
//     bs58.decode(
//       "B2Z1ZkFh4wPx92bY1wf2QuHtiH5NET11Jkb5vmFWbaoZNsMdFqLNa86UubKvJSoZ8juVp9jodRoGe3nq5VdFvYM"
//     )
//   );

//   // G2FAbFQPFa5qKXCetoFZQEvF9BVvCKbvUZvodpVidnoY
//   const base = Keypair.fromSecretKey(
//     bs58.decode(
//       "5v3i1MQd2u5vnNQrJGsU9RppBSvo4e8YBLk1fT8Bpwo4Ve9sd59DJZfRR3kdFGLq6vmCM5QRTCD8yGBfETByfMTE"
//     )
//   );

//   let basePubkey = base.publicKey;
//   let seed = "foxtool";
//   let programId = SystemProgram.programId;

//   let derived = await PublicKey.createWithSeed(basePubkey, seed, programId);

//   const tx = new Transaction().add(
//     SystemProgram.transfer({
//       fromPubkey: derived,
//       basePubkey: basePubkey,
//       toPubkey: new PublicKey("36ssFLWKAzN3VvokcYpzwiABugGGzQ3N9ta5aLXFpe5j"), // create a random receiver
//       lamports: 0.03 * LAMPORTS_PER_SOL,
//       seed: seed,
//       programId: programId,
//     })
//   );

//   //tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
//   console.log(
//     `txhash: ${await sendAndConfirmTransaction(connection, tx, [
//       feePayer,
//       base,
//     ])}`
//   );
// })();
async function mian() {
  // const keypai = Keypair.generate();
  // console.log(keypai.publicKey.toString());
  // console.log(bs58.encode(keypai.secretKey));
  // return;
  //Main
  //const connection = new Connection("https://late-bold-frog.solana-mainnet.quiknode.pro/f1f4d357a1d3468a05726f12051b10fa57790c3b");
  //Dev
  const connection = new Connection("https://patient-fluent-dust.solana-devnet.quiknode.pro/b9d45f29c3f33a4991f1fdfb1d7e2c3f785b551e/");

  const feePayer = Keypair.fromSecretKey(
    bs58.decode(
      "B2Z1ZkFh4wPx92bY1wf2QuHtiH5NET11Jkb5vmFWbaoZNsMdFqLNa86UubKvJSoZ8juVp9jodRoGe3nq5VdFvYM"
    )
  );


  const base = Keypair.fromSecretKey(
    bs58.decode(
      "AaZ8zKbBQSniNN4j61eLhqiXs4myQxHTNRga7SkX6MYrZNMgU2TPaaUDhhxVgk2YV59N72UPpMbdyEhZzn7LFUT"
    )
  );


  // const tokenAccount = await getTokenAccount(connection, feePayer.publicKey);
  // console.log(tokenAccount);
  // return;

  // const tx = new Transaction().add(
  //   SystemProgram.createAccount({
  //     fromPubkey: feePayer.publicKey,
  //     newAccountPubkey: base.publicKey,
  //     lamports: 0.1 * LAMPORTS_PER_SOL,
  //     space: 0,
  //     programId: SystemProgram.programId
  //   })
  // );
  //const addr
  // const CorATA = await getAssociatedTokenAddress(
  //   base.publicKey,  //Mint
  //   feePayer.publicKey       //转账人
  // );

  // const tx = new Transaction().add(
  //    createCloseAccountInstruction(
  //     CorATA,
  //     feePayer.publicKey,
  //     feePayer.publicKey
  //   )
  // );

  //---
  // console.log(
  //   `txhash: ${await sendAndConfirmTransaction(connection, tx, [
  //     feePayer,
  //     base,
  //   ])}`
  // );

  let closeAccountTx = new Transaction().add(
    new TransactionInstruction({
      keys: [
        {
          pubkey: base.publicKey,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: feePayer.publicKey,
          isSigner: false,
          isWritable: true,
        },
      ],
      programId: SystemProgram.programId,
    })
  );
  console.log(
    `close account txhash: ${await connection.sendTransaction(closeAccountTx, [
      feePayer,
    ])}`
  );
}
//mian();

async function bundle() {
  //
  // const url = "https://dallas.testnet.block-engine.jito.wtf/api/v1/bundles";
  // const requests = await axios.post(url, {
  //   jsonrpc: '2.0',
  //   id: 1,
  //   method: 'getBundleStatuses',
  //   params: ["56732218a8ebfd00ee8a70b86e25fbdd8a166b010b5c1a43160759ffc0e606c1"],
  // });
  // console.log(requests.json());


  const connection = new Connection("https://late-bold-frog.solana-mainnet.quiknode.pro/f1f4d357a1d3468a05726f12051b10fa57790c3b");
  const latestBlockhash = await connection.getLatestBlockhash();
  const jitTipTxFeeMessage = new TransactionMessage({
    payerKey: new PublicKey("GfPxUM7RvXib41si7BjnKEvkN7G9qSX9qoar9QkfEADe"),
    recentBlockhash: latestBlockhash.blockhash,
    instructions: [
      SystemProgram.transfer({
        fromPubkey: new PublicKey("GfPxUM7RvXib41si7BjnKEvkN7G9qSX9qoar9QkfEADe"),
        toPubkey: new PublicKey("ATTUK2DHgLhKZRDjePq6eiHRKC1XXFMBiSUFQ2JNDbN"),
        lamports: 0.001 * LAMPORTS_PER_SOL,
      }),
    ],
  }).compileToV0Message();

  const jitoFeeTx = new VersionedTransaction(jitTipTxFeeMessage);
  const payer = Keypair.fromSecretKey(bs58.decode("5RsyEeg4E4KsHU7HEXLcjMHEeSooioR6Y8wRbzvGoAfbcC9HFpBCq2SUcopg6myB8kQfNPKPkA24fbJd8UgBw9dY"));
  console.log(payer.publicKey.toString());
  jitoFeeTx.sign([payer]);
  const jitoTxsignature = bs58.encode(jitoFeeTx.signatures[0]);
  console.log("jitoTxsignature:", jitoTxsignature);
  const serializedjitoFeeTx = bs58.encode(jitoFeeTx.serialize());
  console.log("serializedjitoFeeTx", serializedjitoFeeTx);

}
//bundle();

const connection = new Connection("https://late-bold-frog.solana-mainnet.quiknode.pro/f1f4d357a1d3468a05726f12051b10fa57790c3b")
const pumpPROGRAMID = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
async function fetchPumpPairs(txId: string) {
  try {
    const tx = await connection.getParsedTransaction(txId, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });

    //@ts-ignore
    const accounts = (tx?.transaction.message.instructions).find(
      (ix) =>
        ix.programId.toBase58() === pumpPROGRAMID.toBase58()
      // @ts-ignore
    ).accounts as PublicKey[];

    if (!accounts) {
      console.log("No accounts found in the transaction.");
      return;
    }

    if (accounts.length === 14) {
      console.log("Accounts found:", accounts.length);

      console.log(
        //`Signature for ${searchInstruction}:`,
        `https://solscan.io/tx/${txId}`
      );
      console.log(accounts);

    }

  } catch (error) {
    console.error(error);
  }
}



export async function getCoinData(mintStr: string) {
  try {
    const url = `https://client-api-2-74b1891ee9f9.herokuapp.com/coins/${mintStr}`;
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": "https://www.pump.fun/",
        "Origin": "https://www.pump.fun",
        "Connection": "keep-alive",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site",
        "If-None-Match": 'W/"43a-tWaCcS4XujSi30IFlxDCJYxkMKg"'
      }
    });
    if (response.status === 200) {
      return response.data;
    } else {
      console.error('Failed to retrieve coin data:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Error fetching coin data:', error);
    return null;
  }
}

async function snipe() {
  // const acc = await getCoinData("4chb41V9HCQxhq35j5fERK4moSNdb4Urs4TWr7AUkN4w");
  // console.log(acc);

  console.log("listening for new Pump pools...")
  // //监听其他地址???
  // connection.onLogs(
  // 	pumpPROGRAMID,
  // 	({ logs, err, signature }) => {
  // 		if (err) return;
  // 		// console.log("Logs found:", logs);
  // 		// if (logs && logs.some((log) => log.includes(searchInstruction))) {
  // 		if (logs) {
  // 			//console.log(logs);
  // 			//callBackFunction(signature);
  // 			fetchPumpPairs(signature);
  // 		}
  // 	},
  // 	"finalized"
  // );
}
//snipe()
