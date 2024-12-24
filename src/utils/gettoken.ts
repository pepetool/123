
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  TokenAccount,
  SPL_ACCOUNT_LAYOUT,
  LIQUIDITY_STATE_LAYOUT_V4,
} from "@raydium-io/raydium-sdk";
import fetch, { RequestInit, RequestRedirect } from 'node-fetch';
import { GraphQLClient, gql } from "graphql-request";
import axios from "axios";


export const getTokenAccounts = async (parkey: string) => {
  const url = process.env.NEXT_PUBLIC_DEBUG === "true" ? process.env.NEXT_PUBLIC_HELTUS_TOKEN_DEV : process.env.NEXT_PUBLIC_HELIUS_TOKEN_MAIN;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "getTokenAccounts",
      id: "1",
      params: {
        page: 1,
        limit: 100,
        "displayOptions": {
          "showZeroBalance": false,
        },
        owner: parkey,
      },
    }),
  });
  const data = await response.json();

  if (!data.result) {
    console.error("No result in the response", data);
    return;
  }
  //console.log(JSON.stringify(data.result, null, 2));
  return data;

};

async function getMyTokenAccounts(connection: Connection, owner: PublicKey) {
  const tokenResp = await connection.getTokenAccountsByOwner(owner, {
    programId: TOKEN_PROGRAM_ID,
  });

  const accounts: TokenAccount[] = [];
  for (const { pubkey, account } of tokenResp.value) {
    accounts.push({
      programId: TOKEN_PROGRAM_ID,
      pubkey,
      accountInfo: SPL_ACCOUNT_LAYOUT.decode(account.data),
    });
  }

  return accounts;
}

export const getTokenAccountsByRaydium = async (connection, perkey) => {
  const tokenAccounts = await getMyTokenAccounts(connection, perkey);
  console.log(tokenAccounts);
};

export const getMetadata = async (nftAddresses) => {
  //这个好像没有DEBUG  先给个错误的地址   不然会报错???
  const url = process.env.NEXT_PUBLIC_DEBUG === "true" ? process.env.NEXT_PUBLIC_HELTUS_TOKEN_DEV : process.env.NEXT_PUBLIC_HELIUS_METDATA_MAIN;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mintAccounts: nftAddresses,
      includeOffChain: true,
      disableCache: false,
    }),
  });

  const data = await response.json();
  //console.log("metadata: ", data);
  return data;
};

export const truncateString = (str, maxLength, prefixLength, suffixLength) => {
  if (str.length <= maxLength) {
    return str;
  } else {
    const prefix = str.substring(0, prefixLength);
    const suffix = str.substring(str.length - suffixLength);
    return prefix + '............' + suffix;
  }
};

export async function getImageUri(jsonUrl: string) {
  try {
    const response = await fetch(jsonUrl); // 使用fetch()获取JSON数据
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const jsonData = await response.json(); // 将响应转换为文本
    if (jsonData.image) {
      const str: string = jsonData.image;
      return str;
    }
    return jsonUrl; // 返回文本数据
  } catch (error) {
    console.error('Error fetching JSON:', error);
    return jsonUrl; // 返回null或者其他适当的错误处理
  }
}

export async function getImageJson(jsonUrl:string) {
  try {
    const response = await fetch(jsonUrl); // 使用fetch()获取JSON数据
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const jsonData = await response.json(); // 将响应转换为文本

    return jsonData; // 返回文本数据
  } catch (error) {
    console.error('Error fetching JSON:', error);
    return jsonUrl; // 返回null或者其他适当的错误处理
  }
}

//==========================
export const getTokenListByShyft = async (userKey: string) => {
  var myHeaders = new Headers();
  myHeaders.append("x-api-key", "-xyhHbkRL6Q-VUqZ");

  var requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };
  //https://api.shyft.to/sol/v1/wallet/all_tokens?network=mainnet-beta&wallet=
  const url = `https://api.shyft.to/sol/v1/wallet/all_tokens?network=mainnet-beta&wallet=${userKey}`

  const response = await fetch(url, requestOptions);
  const data = await response.json();
  //fetch("https://api.shyft.to/sol/v2/nft/compressed/read_all?network=mainnet-beta&wallet_address=3PnTBCxBP7Eb7QMVSKTsTodDxfvQsLr4AKEaT8jeM2xJ&collection=Evya1SENYn5NUC66hv6hWmtxAcEAXymEt2TfaAHyvkhk&refresh=true&page=1&size=1", requestOptions)
  if (!data.result) {
    console.error("No result in the response", data);
    return;
  }
  console.log(JSON.stringify(data.result, null, 2));
  return data;

};

const endpointA = `https://programs.shyft.to/v0/graphql/?api_key=-xyhHbkRL6Q-VUqZ`;

const graphQLClient = new GraphQLClient(endpointA, {
  method: `POST`,
  jsonSerializer: {
    parse: JSON.parse,
    stringify: JSON.stringify,
  },
});

export async function queryLpPair(tokenOne: string, tokenTwo: string) {
  // Get all proposalsV2 accounts
  const query = gql`
    query MyQuery($where: Raydium_LiquidityPoolv4_bool_exp) {
      Raydium_LiquidityPoolv4(
        where: $where
      ) {  
        _updatedAt
    amountWaveRatio
    baseDecimal
    baseLotSize
    baseMint
    baseNeedTakePnl
    baseTotalPnl
    baseVault
    depth
    lpMint
    lpReserve
    lpVault
    marketId
    marketProgramId
    maxOrder
    maxPriceMultiplier
    minPriceMultiplier
    minSeparateDenominator
    minSeparateNumerator
    minSize
    nonce
    openOrders
    orderbookToInitTime
    owner
    pnlDenominator
    pnlNumerator
    poolOpenTime
    punishCoinAmount
    punishPcAmount
    quoteDecimal
    quoteLotSize
    quoteMint
    quoteNeedTakePnl
    quoteTotalPnl
    quoteVault
    resetFlag
    state
    status
    swapBase2QuoteFee
    swapBaseInAmount
    swapBaseOutAmount
    swapFeeDenominator
    swapFeeNumerator
    swapQuote2BaseFee
    swapQuoteInAmount
    swapQuoteOutAmount
    systemDecimalValue
    targetOrders
    tradeFeeDenominator
    tradeFeeNumerator
    volMaxCutRatio
    withdrawQueue
    pubkey    
      }
      }`;

  //Tokens can be either baseMint or quoteMint, so we will check for both with an _or operator
  const variables = {
    where: {
      _or: [
        { baseMint: { _eq: tokenOne } },
        { quoteMint: { _eq: tokenOne } },
      ]
    }
  };
  return await graphQLClient.request(query, variables);//.then(console.log);
}

export async function queryLpMintInfo(address: string) {
  // See how we are only querying what we need
  const query = gql`
      query MyQuery ($where: Raydium_LiquidityPoolv4_bool_exp) {
    Raydium_LiquidityPoolv4(
      where: $where
    ) {
      baseMint
      lpMint
      lpReserve
    }
  }`;

  const variables = {
    where: {
      pubkey: {
        _eq: address,
      },
    },
  };

  return await graphQLClient.request(query, variables);
}