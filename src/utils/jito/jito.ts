//@ts-nocheck
import { Keypair } from '@solana/web3.js'
import { config } from './config'
import axios from 'axios';

//import { useJito } from 'jito-ts';

const BLOCK_ENGINE_URLS = [
  "amsterdam.mainnet.block-engine.jito.wtf",
  "frankfurt.mainnet.block-engine.jito.wtf",
  "ny.mainnet.block-engine.jito.wtf",
  "tokyo.mainnet.block-engine.jito.wtf"
];
//const BLOCK_ENGINE_URLS = ["dallas.testnet.block-engine.jito.wtf"];//config.get('block_engine_urls')
//const AUTH_KEYPAIR_PATH = config.get('auth_keypair_path')
//const auth = Keypair.fromSecretKey(Uint8Array.from([ 170, 102, 199, 216, 226, 201, 23, 43, 26, 120, 207, 73, 110, 164, 116, 178, 255, 140, 255, 218, 189, 56, 60, 156, 217, 54, 187, 126, 163, 9, 162, 105, 7, 82, 19, 78, 31, 45, 211, 21, 169, 244, 1, 88, 110, 145, 211, 13, 133, 99, 16, 32, 105, 253, 55, 213, 94, 124, 237, 195, 235, 255, 7, 72 ]))
function getEngineUrl() {
  if (process.env.NEXT_PUBLIC_DEBUG === "true") {
    return "ny.testnet.block-engine.jito.wtf"
  }
  else {
    return BLOCK_ENGINE_URLS[Math.floor(Math.random() * BLOCK_ENGINE_URLS.length)];
  }
}

//let ids = new Map()
export async function sendBundle(bundle) {
  //useJito
  //const url = getEngineUrl();
  //const { data, loading, error, fetch } = useJito(url);

  // console.log("sendBundle");
  // //console.log(client);
  // const url = getEngineUrl();
  // const search = jitoSearcherClient(url);
  // const bundleId = await search.sendBundle(new JitoBundle(bundle, bundle.length))
  // console.log(`${bundleId} sent.`)
  // ids.set(bundleId, bundleId)
  // bundleId.onBundleResult((bundleResult) => {
  //   if (ids.has(bundleResult.bundleId)) {
  //     console.log('result:', bundleResult)
  //   }
  // })
  const engurl = await getEngineUrl();
  console.log(engurl);
  try {
    const url = `https://${engurl}/api/v1/bundles`;
    const requests = await axios.post(url, {
      jsonrpc: '2.0',
      id: 1,
      method: 'sendBundle',
      params: [bundle],
    });
    if (requests.status === 200) {
      const buid = requests.data.result;
      console.log("id", buid);
      return buid;
    } else {
      return ""
    }

    //console.log("成功:", requests);

  } catch (err) {
    console.log("err", err);
    return ""
  }
}