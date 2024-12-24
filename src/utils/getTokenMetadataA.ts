// const {
//   deserializeMetadata,
// } = require("@metaplex-foundation/mpl-token-metadata");

import { Metadata } from "@metaplex-foundation/mpl-token-metadata";




const { PublicKey } = require("@solana/web3.js");

function findTokenMetadataPda(mint) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata", "utf8"),
      new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(),
      new PublicKey(mint).toBuffer(),
    ],
    new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
  )[0];
}

function findToken2022MetadataPda(mint) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata", "utf8"),
      new PublicKey("META4s4fSmpkTbZoUsgC1oBnWB31vQcmnN8giPw51Zu").toBuffer(),
      new PublicKey(mint).toBuffer(),
    ],
    new PublicKey("META4s4fSmpkTbZoUsgC1oBnWB31vQcmnN8giPw51Zu")
  )[0];
}

const deserializeMetadata = (rawMetadata: any): Metadata | undefined => {
  try {
    return Metadata.fromAccountInfo(rawMetadata)[0];
    // @ts-ignore
  } catch (e: any) {
    console.log("Failed to deserialize on-chain metadata:", e);
  }
};

export async function getTokenMetadataProc(connection, mint) {
  const tokenMetadataPda = findTokenMetadataPda(mint);
  const tokenMetadataAccount = await connection
    .getAccountInfo(tokenMetadataPda)
    .catch((e) => null);
  if (tokenMetadataAccount) return deserializeMetadata(tokenMetadataAccount);  //deserializeMetadata

  const token2022MetadataPda = findToken2022MetadataPda(mint);
  const token2022MetadataAccount = await connection
    .getAccountInfo(token2022MetadataPda)
    .catch((e) => null);
  if (token2022MetadataAccount)
    return deserializeMetadata(token2022MetadataAccount);  //deserializeMetadata
  return null;
};


//howuse
//-------------获取元数据
// const a  =await getTokenMetadataProc(connection, addr );
// // 创建一个 TextDecoder 对象
// const decoder = new TextDecoder('utf-8'); // 指定字符编码为 UTF-8
// // 使用 TextDecoder 解码 Uint8Array 数组并转换为字符串
// // const base64 = Buffer.from(a.data, 'base64');
// // //const base64 = atob(a.data);
//  console.log(a);

//    {
//     "key": 4,
//     "updateAuthority": "Gge3dSAbiaNheY5fA4qsaAvvK6ZqSaQSBBE1PArYitBZ",
//     "mint": "BaBVZzK595vXBwq5S6RJecP7rZ54iV6hjyo6KLBLKJH",
//     "data": {
//         "name": "FROTH\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000",
//         "symbol": "FROTH\u0000\u0000\u0000\u0000\u0000",
//         "uri": "https://ipfs.io/ipfs/QmRyCfNeRTpKGEzaSjBUMpmgusqt91qWYWC5bQXK8uWT2M\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000",
//         "sellerFeeBasisPoints": 0,
//         "creators": null
//     },
//     "primarySaleHappened": false,
//     "isMutable": false,
//     "editionNonce": 254,
//     "tokenStandard": 2,
//     "collection": null,
//     "uses": null,
//     "collectionDetails": null,
//     "programmableConfig": null
// }