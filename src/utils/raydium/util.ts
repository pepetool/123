import {
  buildSimpleTransaction,
  findProgramAddress,
  InnerSimpleV0Transaction,
  SPL_ACCOUNT_LAYOUT,
  TOKEN_PROGRAM_ID,
  TokenAccount,
} from '@raydium-io/raydium-sdk';
import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SendOptions,
  Signer,
  SystemProgram,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';

import {
  addLookupTableInfo,
  connection,
  EMVFEE,
  EmvLevel,
  makeTxVersion,
  nowGasFree,
  wallet,
} from '../config';
import { getJitoSetFee, getRandomTipAccount } from 'utils/jito/config';
import bs58 from 'bs58';
import { sendBundle } from 'utils/jito/jito';

export async function sendTx(
  connection: Connection,
  payer: Keypair | Signer,
  myfees: number,
  txs: (VersionedTransaction | Transaction)[],
  options?: SendOptions
): Promise<string[]> {
  const txids: string[] = [];
  for (const iTx of txs) {
    if (iTx instanceof VersionedTransaction) {
      iTx.sign([payer]);
      txids.push(await connection.sendTransaction(iTx, options));
    } else {

      if (nowGasFree !== 0) {
        iTx.add(ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: nowGasFree * LAMPORTS_PER_SOL,
        }));
      }

      const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
      iTx.add(SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: mykey,
        lamports: myfees
      }
      ));
      if (EmvLevel === -1) {
        txids.push(await connection.sendTransaction(iTx, [payer], options));
      } else {
        const JitoTip = getRandomTipAccount();
        const JitoFee = EMVFEE;//getJitoSetFee(EmvLevel);
        iTx.add(
          SystemProgram.transfer({
            fromPubkey: payer.publicKey,
            toPubkey: JitoTip,
            lamports: JitoFee * LAMPORTS_PER_SOL,
          })
        );
        const latestBlockhash = await connection.getLatestBlockhash();
        iTx.feePayer = payer.publicKey;
        iTx.recentBlockhash = latestBlockhash.blockhash;
        iTx.sign(payer);
        const jitoTx = bs58.encode(iTx.serialize());
        let bundle = [];
        bundle.push(jitoTx);
        const sent = await sendBundle(bundle);
        console.log("swapped in tx id:", sent);
        return sent;
      }
    }
  }
  return txids;
}

export async function sendTxProc(
  connection: Connection,
  payer: Keypair | Signer,
  txs: (VersionedTransaction | Transaction)[],
  options?: SendOptions
): Promise<string[]> {
  const txids: string[] = [];
  for (const iTx of txs) {
    if (iTx instanceof VersionedTransaction) {
      iTx.sign([payer]);
      txids.push(await connection.sendTransaction(iTx, options));
    } else {
      if (nowGasFree !== 0) {
        iTx.add(ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: nowGasFree * LAMPORTS_PER_SOL,
        }));
      }

      txids.push(await connection.sendTransaction(iTx, [payer], options));
    }
  }
  return txids;
}

export async function sendTxA(
  connection: Connection,
  payer: Keypair | Signer,
  txs: Transaction,
  options?: SendOptions
): Promise<string[]> {
  const txids: string[] = [];
  txids.push(await connection.sendTransaction(txs, [payer], options));

  return txids;
}

export async function getWalletTokenAccount(connection: Connection, wallet: PublicKey): Promise<TokenAccount[]> {
  const walletTokenAccount = await connection.getTokenAccountsByOwner(wallet, {
    programId: TOKEN_PROGRAM_ID,
  });
  return walletTokenAccount.value.map((i) => ({
    pubkey: i.pubkey,
    programId: i.account.owner,
    accountInfo: SPL_ACCOUNT_LAYOUT.decode(i.account.data),
  }));
}

export async function buildAndSendTx(innerSimpleV0Transaction: InnerSimpleV0Transaction[], options?: SendOptions) {
  return await buildSimpleTransaction({
    connection,
    makeTxVersion,
    payer: wallet.publicKey,
    innerTransactions: innerSimpleV0Transaction,
    addLookupTableInfo: addLookupTableInfo,
  })

  //return await sendTx(connection, wallet, willSendTx, options)
  //return willSendTx;  直接在上面返回了
}

export async function buildAndSendTxA(connect, wallet, myfees, innerSimpleV0Transaction: InnerSimpleV0Transaction[], options?: SendOptions) {
  const willSendTx = await buildSimpleTransaction({
    connection: connect,
    makeTxVersion,
    payer: wallet.publicKey,
    innerTransactions: innerSimpleV0Transaction,
    addLookupTableInfo: addLookupTableInfo,
  })

  return await sendTx(connect, wallet, myfees, willSendTx, options)
}

export function getATAAddress(programId: PublicKey, owner: PublicKey, mint: PublicKey) {
  const { publicKey, nonce } = findProgramAddress(
    [owner.toBuffer(), programId.toBuffer(), mint.toBuffer()],
    new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
  );
  return { publicKey, nonce };
}

export async function sleepTime(ms: number) {
  console.log((new Date()).toLocaleString(), 'sleepTime', ms)
  return new Promise(resolve => setTimeout(resolve, ms))
}
