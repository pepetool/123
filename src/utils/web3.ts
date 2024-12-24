import { PublicKey, Connection, Keypair, Transaction, SystemProgram, TransactionMessage, LAMPORTS_PER_SOL, TransactionInstruction } from "@solana/web3.js";
import {
  MintLayout, TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction, createMintToInstruction, freezeAccount, getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptMint, createSetAuthorityInstruction, AuthorityType, createTransferInstruction,
  createBurnInstruction, createCloseAccountInstruction, MINT_SIZE, createFreezeAccountInstruction
} from "@solana/spl-token";
import { createCreateMetadataAccountV3Instruction, createUpdateMetadataAccountInstruction, createUpdateMetadataAccountV2Instruction } from "@metaplex-foundation/mpl-token-metadata";
import { GetProgramAccountsFilter, ComputeBudgetProgram } from "@solana/web3.js";
import { connect } from "http2";
import { GAS_LEVEL } from "./config";

export const START_TS = 1691587000 - (86400 * 30) * 20;
export const EPOCH_DURATION = 86400 * 30

const discount = Number(process.env.NEXT_PUBLIC_PRICE_DISCOUNT);

export async function checkAssociatedTokenAccount(
  connection: Connection,
  tokenAddress: PublicKey,
  owner: PublicKey,
) {
  try {
    const associatedTokenAccount = await getAssociatedTokenAddress(tokenAddress, owner, true);
    const accountInfo = await connection.getAccountInfo(associatedTokenAccount);
    if (!accountInfo) {
      return false
    } else {
      return true
    }
  } catch (err) {
    console.log(err)
    alert('cannot check your associated token account')
    return true
  }
}

export const getSolanaTime = async (connection: Connection) => {
  const slot = await connection.getSlot();
  const nowTs = await connection.getBlockTime(slot);
  return nowTs
}



//放弃权限===========================================================
export async function disableAuthority(connection, mintAddress, owner:PublicKey, isMint, isFreeAcc, isMetedata) {
  const mint = new PublicKey(mintAddress);
  const transaction = new Transaction();

  if (isMint) {
    const mintIx = createSetAuthorityInstruction(
      mint,
      owner,
      AuthorityType.MintTokens,  //铸币权限
      null,
    );
    transaction.add(mintIx);
  }

  if (isFreeAcc) {
    const mintIxa = createSetAuthorityInstruction(
      mint,
      owner,
      AuthorityType.FreezeAccount,  //账户权限
      null,
    );
    transaction.add(mintIxa);
  }

  if (isMetedata) {
    const [metadataAddress] = await PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        (new PublicKey(METADATA_PROGRAM_ID)).toBuffer(),
        mint.toBuffer()
      ],
      new PublicKey(METADATA_PROGRAM_ID)
    )

    
    //const metadata = metadataAddress;
    // console.log(owner.toString());
    // console.log(metadataAddress.toString());
    const ix = createUpdateMetadataAccountV2Instruction(
      {
        metadata: metadataAddress,
        updateAuthority: owner
      }, {//updateMetadataAccountArgsV2
      updateMetadataAccountArgsV2: {
        data: null,
        isMutable: false,
        primarySaleHappened: false,
        updateAuthority: owner
      }
    });
    transaction.add(ix);
  }

  //----------插入交易函数  权限
  const money = Number(process.env.NEXT_PUBLIC_PRICE_AUTHITY);
  const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
  const Transfer = SystemProgram.transfer({
    fromPubkey: owner,
    toPubkey: mykey,
    lamports: money * Math.pow(10, 9)
  }
  );

  transaction.add(Transfer);

  /**
   *   const mintToIx = createMintToInstruction(
    mintKeypair.publicKey,
    associatedTokenAccount,
    payer,
    amount * Math.pow(10, dec)
  );

  mintTransaction.add(mintToIx);
   */
  //transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  //transaction.feePayer = owner;
  return transaction;
}

export async function disableAccount(corAddress, mint, owner) {
  const AtaAcc = new PublicKey(corAddress);
  let transaction = new Transaction();
  transaction = setPublicGasfee(transaction);

  const mintIxa = createFreezeAccountInstruction(
    AtaAcc,
    mint,
    owner,
  );
  transaction.add(mintIxa);

  //----------插入交易函数  权限
  const money = Number(process.env.NEXT_PUBLIC_PRICE_AUTHITY);
  const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
  const Transfer = SystemProgram.transfer({
    fromPubkey: owner,
    toPubkey: mykey,
    lamports: money * Math.pow(10, 9)
  }
  );

  transaction.add(Transfer);
  return transaction;
}

//燃烧并关闭账户
export async function burntokensAndcloseacc(connection, accAddr, mintAddress, payer, amount) {
  const mint = new PublicKey(mintAddress);
  const transaction = new Transaction();

  const mintIxa = createBurnInstruction(
    new PublicKey(accAddr),
    new PublicKey(mintAddress),
    payer,
    amount
  );
  transaction.add(mintIxa);

  // const closeIx = createCloseAccountInstruction(
  //   new PublicKey(accAddr),
  //   payer,
  //   payer
  // );
  // transaction.add(closeIx);

  //----------插入交易函数  燃烧
  const money = Number(process.env.NEXT_PUBLIC_PRICE_BURN);
  const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
  const Transfer = SystemProgram.transfer({
    fromPubkey: payer,
    toPubkey: mykey,
    lamports: money * Math.pow(10, 9)
  }
  );

  transaction.add(Transfer);

  return transaction;
}


//setComputeUnitLimit 函数会向交易中添加一条指令，以设置交易的计算预算，
//而 setComputeUnitPrice 函数会向交易中添加一条指令，以设置交易的优先级费用
export function setPublicGasfee(transaction: Transaction, priAdd?: number) {
  switch (GAS_LEVEL) {
    case 0: return transaction;
    case 1:
      transaction.add(ComputeBudgetProgram.setComputeUnitLimit({
        units: 0.0005 * LAMPORTS_PER_SOL,
      })
      )

      transaction.add(ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 0.004 * LAMPORTS_PER_SOL,
      })
      )

      return transaction;
    case 2:
      transaction.add(ComputeBudgetProgram.setComputeUnitLimit({
        units: 0.0006 * LAMPORTS_PER_SOL,
      })
      )

      transaction.add(ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 0.008 * LAMPORTS_PER_SOL,
      })
      )

      return transaction;
  }
}

export function setPublicGasfee_Push(transaction: TransactionInstruction[], priAdd?: number) {
  switch (GAS_LEVEL) {
    case 0: return transaction;
    case 1:
      transaction.push(ComputeBudgetProgram.setComputeUnitLimit({
        units: 0.0005 * LAMPORTS_PER_SOL,
      })
      )

      transaction.push(ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 0.004 * LAMPORTS_PER_SOL,
      })
      )

      return transaction;
    case 2:
      transaction.push(ComputeBudgetProgram.setComputeUnitLimit({
        units: 0.0006 * LAMPORTS_PER_SOL,
      })
      )

      transaction.push(ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 0.008 * LAMPORTS_PER_SOL,
      })
      )

      return transaction;
  }
}

export async function burntokens(connection, accAddr: string, mintAddress: string, payer, amount) {
  //const mint = new PublicKey(mintAddress);
  let transaction = new Transaction();

  transaction = setPublicGasfee(transaction);

  const mintIxa = createBurnInstruction(
    new PublicKey(accAddr),
    new PublicKey(mintAddress),
    payer,
    amount
  );
  transaction.add(mintIxa);

  //----------插入交易函数  燃烧
  const money = Number(process.env.NEXT_PUBLIC_PRICE_BURN);
  const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
  const Transfer = SystemProgram.transfer({
    fromPubkey: payer,
    toPubkey: mykey,
    lamports: money * Math.pow(10, 9)
  }
  );

  transaction.add(Transfer);

  return transaction;
}

export function shortenHash(s: string, slice: number = 5) {
  const N = s.length;
  return s.slice(0, slice) + "..." + s.slice(N - slice, N)
}

export const roundToTwoDigits = (num: number) => {
  return Math.round(num * 100) / 100
}

export const roundToFourDigits = (num: number) => {
  return Math.round(num * 10000) / 10000
}



export const METADATA_PROGRAM_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
//创建代币================================================================
export const createMintTokenTransactionproc = async (
  connection: Connection,
  payer: PublicKey,
  mintKeypair: Keypair,
  dec: number,
  amount: number,
  metadataUri: string,
  name: string,
  symbol: string,
  isFreeMin: boolean,
  isFreeAcc: boolean,
  isFreeYs: boolean,
) => {



  let mintTransaction = new Transaction();
  //mintTransaction.setGas();

  //--4000000
  //修改gas费
  // mintTransaction.add(ComputeBudgetProgram.setComputeUnitPrice({
  //   microLamports: 4_000_000,
  // })
  // )

  // //--500000
  // mintTransaction.add(ComputeBudgetProgram.setComputeUnitLimit({
  //   units: 500_000,
  // })
  // )
  mintTransaction = setPublicGasfee(mintTransaction);


  const mintBalanceNeeded = await getMinimumBalanceForRentExemptMint(connection);

  mintTransaction.add(
    //==生成一个创建新帐户的事务指令
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: mintKeypair.publicKey,
      lamports: mintBalanceNeeded,
      space: MINT_SIZE,
      programId: TOKEN_PROGRAM_ID
    })
  );

  mintTransaction.add(
    //==构造一个初始化Mint指令
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      dec,
      payer,
      payer,
      TOKEN_PROGRAM_ID
    )
  );
  // * getAssociatedTokenAddressSync的异步版本
  // *向后兼容
  // ＊
  // * @param mint令牌薄荷账户
  // * @param owner新帐户的所有者
  // ＊
  // @return承诺包含关联的令牌帐户的地址

  //   * get AssociatedToken Address Sync的异步版本
  const associatedTokenAccount = await getAssociatedTokenAddress(
    mintKeypair.publicKey,  //Mint
    payer                   //转账人
  );


  // 构造一个CreateAssociatedTokenAccount指令
  // ＊
  // * @param payer初始化费用的支付人
  // @param associatedToken新的关联令牌帐户
  // * @param owner新帐户的所有者
  // * @param mint令牌薄荷账户
  // * @param programId SPL令牌程序帐户
  // * @param associatedTokenProgramId SPL关联令牌程序帐户
  // ＊
  // * @return指令添加到一个事务
  // 构造一个CreateAssociatedTokenAccount指令
  const createAssociatedTokenAccountIx = await createAssociatedTokenAccountInstruction(
    payer,        //费用支付人
    associatedTokenAccount, //获取
    payer,        //收款人
    mintKeypair.publicKey  //Mint
  );

  mintTransaction.add(createAssociatedTokenAccountIx);

  const mintToIx = createMintToInstruction(
    mintKeypair.publicKey,
    associatedTokenAccount,
    payer,
    amount * Math.pow(10, dec)
  );

  mintTransaction.add(mintToIx);

  //----------插入交易函数   创建
  const money = Number(process.env.NEXT_PUBLIC_PRICE_CREATE);
  const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
  const Transfer = SystemProgram.transfer({   //SystemProgram代表sol
    fromPubkey: payer,
    toPubkey: mykey,
    lamports: money * Math.pow(10, 9)
  }
  );
  mintTransaction.add(Transfer);


  //如果meta没有就返回了
  if ((metadataUri == "") || (name == "") || (symbol == "")) {
    return mintTransaction
  }

  const [metadataAddress] = await PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      (new PublicKey(METADATA_PROGRAM_ID)).toBuffer(),
      mintKeypair.publicKey.toBuffer()
    ],
    new PublicKey(METADATA_PROGRAM_ID)
  )
  const isMutable = !isFreeYs;
  console.log(isMutable);
  const metadataIx = createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataAddress,
      mint: mintKeypair.publicKey,
      mintAuthority: payer,
      payer: payer,
      updateAuthority: payer
    },
    {
      createMetadataAccountArgsV3: {
        data: {
          name: name,
          symbol: symbol,
          uri: metadataUri,
          sellerFeeBasisPoints: 1000,
          creators: [
            {
              address: payer,
              verified: true,
              share: 100
            }
          ],
          collection: null,
          uses: null
        },
        isMutable: isMutable,
        collectionDetails: null
      }
    }
  );
  mintTransaction.add(metadataIx);

  if (isFreeMin) {
    const mintIx = createSetAuthorityInstruction(
      mintKeypair.publicKey,
      payer,
      AuthorityType.MintTokens,  //铸币权限
      null,
    );
    mintTransaction.add(mintIx);
  }
  if (isFreeAcc) {
    const mintIxa = createSetAuthorityInstruction(
      mintKeypair.publicKey,
      payer,
      AuthorityType.FreezeAccount,  //账户权限
      null,
    );
    mintTransaction.add(mintIxa);
  }

  return mintTransaction

}

export const setMintTokenProc = async (
  payer: PublicKey,
  mintKey: PublicKey,
  dec: number,
  amount: number,
) => {

  let mintTransaction = new Transaction();
  //mintTransaction.setGas();

  //--4000000
  //修改gas费
  // mintTransaction.add(ComputeBudgetProgram.setComputeUnitPrice({
  //   microLamports: 4_000_000,
  // })
  // )

  // //--500000
  // mintTransaction.add(ComputeBudgetProgram.setComputeUnitLimit({
  //   units: 500_000,
  // })
  // )
  mintTransaction = setPublicGasfee(mintTransaction);

  //   * get AssociatedToken Address Sync的异步版本
  const associatedTokenAccount = await getAssociatedTokenAddress(
    mintKey,  //Mint
    payer                   //转账人
  );

  const mintToIx = createMintToInstruction(
    mintKey,
    associatedTokenAccount,
    payer,
    amount,
  );
  mintTransaction.add(mintToIx);

  //----------插入交易函数   创建
  const money = Number(process.env.NEXT_PUBLIC_PRICE_AUTHITY);
  const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
  const Transfer = SystemProgram.transfer({   //SystemProgram代表sol
    fromPubkey: payer,
    toPubkey: mykey,
    lamports: money * Math.pow(10, 9)
  }
  );
  mintTransaction.add(Transfer);

  return mintTransaction;
}

export const createUpdataMetaV3Proc = async (
  payer: PublicKey,
  mintKey: PublicKey,
  metadataUri: string,
  name: string,
  symbol: string,
) => {

  let mintTransaction = new Transaction();
  //mintTransaction.setGas();

  //修改gas费
  // mintTransaction.add(ComputeBudgetProgram.setComputeUnitPrice({
  //   microLamports: 100_000,
  // })
  // )


  // mintTransaction.add(ComputeBudgetProgram.setComputeUnitLimit({
  //   units: 500_000,
  // })
  // )
  mintTransaction = setPublicGasfee(mintTransaction);

  //----------插入交易函数  更新
  const money = Number(process.env.NEXT_PUBLIC_PRICE_UPDATA);
  const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
  const Transfer = SystemProgram.transfer({   //SystemProgram代表sol
    fromPubkey: payer,
    toPubkey: mykey,
    lamports: money * Math.pow(10, 9)
  }
  );
  mintTransaction.add(Transfer);


  //如果meta没有就返回了
  if ((metadataUri == "") || (name == "") || (symbol == "")) {
    return mintTransaction
  }

  const [metadataAddress] = await PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      (new PublicKey(METADATA_PROGRAM_ID)).toBuffer(),
      mintKey.toBuffer()
    ],
    new PublicKey(METADATA_PROGRAM_ID)
  )

  const metadataIx = createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataAddress,
      mint: mintKey,
      mintAuthority: payer,
      payer: payer,
      updateAuthority: payer
    },
    {
      createMetadataAccountArgsV3: {
        data: {
          name: name,
          symbol: symbol,
          uri: metadataUri,
          sellerFeeBasisPoints: 1000,
          creators: [
            {
              address: payer,
              verified: true,
              share: 100
            }
          ],
          collection: null,
          uses: null
        },
        isMutable: true,
        collectionDetails: null
      }
    }
  );
  mintTransaction.add(metadataIx)


  return mintTransaction

}

export const getmyTokenUri = async (myfile: File, tokenname, symbol, description, website, telegram, twitter, wordArray) => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', myfile); // 假设 fileInput 是一个 input[type="file"] 元素
    formData.append('tokenname', tokenname);
    formData.append('symbol', symbol);
    formData.append('description', description);
    formData.append('website', website);
    formData.append('telegram', telegram);
    formData.append('twitter', twitter);
    formData.append('wordArray', wordArray);
    formData.append('key', "PCCAR4Fs2-Fuck U !");
    fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('网络错误');
          //return "error";
        }
        return response.json();
      })
      .then(data => {
        console.log('上传成功:', data);
        resolve(data.uri);
      })
      .catch(error => {
        console.error('上传失败:', error);
        resolve("error");
      });
  });
}


export const getmyImageUri = async (myfile: File, tokenname, symbol, description) => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', myfile); // 假设 fileInput 是一个 input[type="file"] 元素
    formData.append('tokenname', tokenname);
    formData.append('symbol', symbol);
    formData.append('description', description);
    formData.append('key', "AAABBB-Fuck U !");
    fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('网络错误');
          //return "error";
        }
        return response.json();
      })
      .then(data => {
        console.log('上传成功:', data);
        resolve(data.uri);
      })
      .catch(error => {
        console.error('上传失败:', error);
        resolve("error");
      });
  });
}

export interface UserTokenType {
  mintAddress: string,
  tokenBalance: number
}

export const getUserTokens = async (wallet: string, solanaConnection: Connection) => {
  const filters: GetProgramAccountsFilter[] = [
    {
      dataSize: 165,    //size of account (bytes)
    },
    {
      memcmp: {
        offset: 32,     //location of our query in the account (bytes)
        bytes: wallet,  //our search criteria, a base58 encoded string
      },
    }];
  const accounts = await solanaConnection.getParsedProgramAccounts(
    TOKEN_PROGRAM_ID, //new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
    { filters: filters }
  );

  const dataArr = accounts.map((account) => {
    const parsedAccountInfo: any = account.account.data;
    const mintAddress: string = parsedAccountInfo["parsed"]["info"]["mint"];
    const tokenBalance: number = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"];

    return {
      mintAddress: mintAddress,
      tokenBalance: tokenBalance
    }
  });

  return dataArr
}

export const createUpdateMetadataIx = async (
  tokenAddress: PublicKey,
  name: string,
  symbol: string,
  uri: string,
  payer: PublicKey
) => {
  const [metadataAddress] = await PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      (new PublicKey(METADATA_PROGRAM_ID)).toBuffer(),
      tokenAddress.toBuffer()
    ],
    new PublicKey(METADATA_PROGRAM_ID)
  );

  const mintTransaction = new Transaction();

  const data = {
    name: name,
    symbol: symbol,
    uri: uri,
    sellerFeeBasisPoints: 1000,
    creators: [
      {
        address: payer,
        verified: true,
        share: 100
      }
    ],
    collection: null,
    uses: null
  }

  const updateMetadataIx = createUpdateMetadataAccountV2Instruction(
    {
      metadata: metadataAddress,
      updateAuthority: payer
    },
    {
      updateMetadataAccountArgsV2: {
        data: data,
        updateAuthority: payer,
        primarySaleHappened: true,
        isMutable: true
      }
    }
  );

  mintTransaction.add(updateMetadataIx);

  //-------------------插入转账!
  //createTransferInstruction
  //----------插入交易函数  更新
  const money = Number(process.env.NEXT_PUBLIC_PRICE_UPDATA);
  const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
  const Transfer = SystemProgram.transfer({   //SystemProgram代表sol
    fromPubkey: payer,
    toPubkey: mykey,
    lamports: money * Math.pow(10, 9)
  }
  );
  mintTransaction.add(Transfer);


  return mintTransaction

}