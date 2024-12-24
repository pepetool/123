import { ComputeBudgetProgram, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { u8, struct, NearUInt64 } from "@solana/buffer-layout"
import * as spl from "@solana/spl-token"
import { connection, wallet } from "utils/config";
import { TOKEN_PROGRAM_ID, createCloseAccountInstruction, createTransferInstruction, getAssociatedTokenAddress } from "@solana/spl-token";
import axios from "axios";
import BN from 'bn.js'
import { DEVNET_PROGRAM_ID, MAINNET_PROGRAM_ID } from "@raydium-io/raydium-sdk";

const RAYPROGARM_ID = process.env.NEXT_PUBLIC_DEBUG === "true" ? DEVNET_PROGRAM_ID : MAINNET_PROGRAM_ID;

const ray = RAYPROGARM_ID.AmmV4;//new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8')
//const connection = new Connection("https://late-bold-frog.solana-mainnet.quiknode.pro/f1f4d357a1d3468a05726f12051b10fa57790c3b")
let pubGas = 0.0001;

export function setRayPubGas(gas: number) {
	pubGas = gas;
}


export async function getMarketInfoA(marketId) {
	//console.log("2")
	const info = await connection.getAccountInfo(marketId)
	//console.log("2")
	const ownAddress = new PublicKey(info.data.slice(13, 45))
	const vaultSignerNonce = new NearUInt64().decode(new Uint8Array((info).data.subarray(45, 53)))
	const baseMint = new PublicKey(info.data.slice(53, 85))
	const quoteMint = new PublicKey(info.data.slice(85, 117))
	const bids = new PublicKey(info.data.slice(285, 317))
	const asks = new PublicKey(info.data.slice(317, 349))
	const event = new PublicKey(info.data.slice(253, 285))
	const baseVault = new PublicKey(info.data.slice(117, 149))
	const quoteVault = new PublicKey(info.data.slice(165, 197))
	const marketInfo = {
		ownAddress,
		vaultSignerNonce,
		baseMint,
		quoteMint,
		bids,
		asks,
		event,
		baseVault,
		quoteVault
	}
	return (marketInfo)
}

export async function getKeys(marketId, baseDecimals, quoteDecimals) {
	const getAta = async (mint, publicKey) => PublicKey.findProgramAddressSync([publicKey.toBuffer(), spl.TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()], spl.ASSOCIATED_TOKEN_PROGRAM_ID)[0];
	async function getMarketInfo(marketId) {
		//console.log("2")
		const info = await connection.getAccountInfo(marketId)
		//console.log("2")
		const ownAddress = new PublicKey(info.data.slice(13, 45))
		const vaultSignerNonce = new NearUInt64().decode(new Uint8Array((info).data.subarray(45, 53)))
		const baseMint = new PublicKey(info.data.slice(53, 85))
		const quoteMint = new PublicKey(info.data.slice(85, 117))
		const bids = new PublicKey(info.data.slice(285, 317))
		const asks = new PublicKey(info.data.slice(317, 349))
		const event = new PublicKey(info.data.slice(253, 285))
		const baseVault = new PublicKey(info.data.slice(117, 149))
		const quoteVault = new PublicKey(info.data.slice(165, 197))
		const marketInfo = {
			ownAddress,
			vaultSignerNonce,
			baseMint,
			quoteMint,
			bids,
			asks,
			event,
			baseVault,
			quoteVault
		}
		return (marketInfo)
	}
	// console.log("1");
	const marketInfo = await getMarketInfo(marketId)
	// console.log("1");
	const [baseMint, quoteMint] = [marketInfo.baseMint, marketInfo.quoteMint];
	const [ownerBaseAta, ownerQuoteAta] = await Promise.all([getAta(baseMint, wallet.publicKey), getAta(quoteMint, wallet.publicKey)]);
	const authority = PublicKey.findProgramAddressSync([Buffer.from([97, 109, 109, 32, 97, 117, 116, 104, 111, 114, 105, 116, 121])], ray)[0];
	const marketAuthority = PublicKey.createProgramAddressSync([marketId.toBuffer(), Buffer.from([Number(marketInfo.vaultSignerNonce.toString())]), Buffer.alloc(7)], RAYPROGARM_ID.OPENBOOK_MARKET); //new PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX')
	const seeds = ['amm_associated_seed', 'coin_vault_associated_seed', 'pc_vault_associated_seed', 'lp_mint_associated_seed', 'temp_lp_token_associated_seed', 'target_associated_seed', 'withdraw_associated_seed', 'open_order_associated_seed', 'pc_vault_associated_seed'].map(seed => Buffer.from(seed, 'utf-8'));
	const [id, baseVault, coinVault, lpMint, lpVault, targetOrders, withdrawQueue, openOrders, quoteVault] = await Promise.all(seeds.map(seed => PublicKey.findProgramAddress([ray.toBuffer(), marketId.toBuffer(), seed], ray)));
	return ({
		programId: ray,
		baseMint,
		quoteMint,
		ownerBaseAta,
		ownerQuoteAta,
		baseDecimals,
		quoteDecimals,
		tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
		lpDecimals: baseDecimals,
		authority,
		marketAuthority,
		marketProgramId: RAYPROGARM_ID.OPENBOOK_MARKET,//new PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX'),
		marketId,
		marketBids: marketInfo.bids,
		marketAsks: marketInfo.asks,
		marketQuoteVault: marketInfo.quoteVault,
		marketBaseVault: marketInfo.baseVault,
		marketEventQueue: marketInfo.event,
		id: id[0],
		baseVault: baseVault[0],
		coinVault: coinVault[0],
		lpMint: lpMint[0],
		lpVault: lpVault[0],
		targetOrders: targetOrders[0],
		withdrawQueue: withdrawQueue[0],
		openOrders: openOrders[0],
		quoteVault: quoteVault[0],
		lookupTableAccount: PublicKey.default,
		wallet: wallet.publicKey
	})
}

export async function getKeys_wallet(marketId, baseDecimals, quoteDecimals, wallet, connection) {
	const getAta = async (mint, publicKey) => PublicKey.findProgramAddressSync([publicKey.toBuffer(), spl.TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()], spl.ASSOCIATED_TOKEN_PROGRAM_ID)[0];
	async function getMarketInfo(marketId) {
		//console.log("2")
		const info = await connection.getAccountInfo(marketId)
		//console.log("2")
		const ownAddress = new PublicKey(info.data.slice(13, 45))
		const vaultSignerNonce = new NearUInt64().decode(new Uint8Array((info).data.subarray(45, 53)))
		const baseMint = new PublicKey(info.data.slice(53, 85))
		const quoteMint = new PublicKey(info.data.slice(85, 117))
		const bids = new PublicKey(info.data.slice(285, 317))
		const asks = new PublicKey(info.data.slice(317, 349))
		const event = new PublicKey(info.data.slice(253, 285))
		const baseVault = new PublicKey(info.data.slice(117, 149))
		const quoteVault = new PublicKey(info.data.slice(165, 197))
		const marketInfo = {
			ownAddress,
			vaultSignerNonce,
			baseMint,
			quoteMint,
			bids,
			asks,
			event,
			baseVault,
			quoteVault
		}
		return (marketInfo)
	}
	// console.log("1");
	const marketInfo = await getMarketInfo(marketId)
	// console.log("1");
	const [baseMint, quoteMint] = [marketInfo.baseMint, marketInfo.quoteMint];
	const [ownerBaseAta, ownerQuoteAta] = await Promise.all([getAta(baseMint, wallet.publicKey), getAta(quoteMint, wallet.publicKey)]);
	const authority = PublicKey.findProgramAddressSync([Buffer.from([97, 109, 109, 32, 97, 117, 116, 104, 111, 114, 105, 116, 121])], ray)[0];
	const marketAuthority = PublicKey.createProgramAddressSync([marketId.toBuffer(), Buffer.from([Number(marketInfo.vaultSignerNonce.toString())]), Buffer.alloc(7)], RAYPROGARM_ID.OPENBOOK_MARKET); //new PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX')
	const seeds = ['amm_associated_seed', 'coin_vault_associated_seed', 'pc_vault_associated_seed', 'lp_mint_associated_seed', 'temp_lp_token_associated_seed', 'target_associated_seed', 'withdraw_associated_seed', 'open_order_associated_seed', 'pc_vault_associated_seed'].map(seed => Buffer.from(seed, 'utf-8'));
	const [id, baseVault, coinVault, lpMint, lpVault, targetOrders, withdrawQueue, openOrders, quoteVault] = await Promise.all(seeds.map(seed => PublicKey.findProgramAddress([ray.toBuffer(), marketId.toBuffer(), seed], ray)));
	return ({
		programId: ray,
		baseMint,
		quoteMint,
		ownerBaseAta,
		ownerQuoteAta,
		baseDecimals,
		quoteDecimals,
		tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
		lpDecimals: baseDecimals,
		authority,
		marketAuthority,
		marketProgramId: RAYPROGARM_ID.OPENBOOK_MARKET,//new PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX'),
		marketId,
		marketBids: marketInfo.bids,
		marketAsks: marketInfo.asks,
		marketQuoteVault: marketInfo.quoteVault,
		marketBaseVault: marketInfo.baseVault,
		marketEventQueue: marketInfo.event,
		id: id[0],
		baseVault: baseVault[0],
		coinVault: coinVault[0],
		lpMint: lpMint[0],
		lpVault: lpVault[0],
		targetOrders: targetOrders[0],
		withdrawQueue: withdrawQueue[0],
		openOrders: openOrders[0],
		quoteVault: quoteVault[0],
		lookupTableAccount: PublicKey.default,
		wallet: wallet.publicKey
	})
}

export async function getAllAccByMint(connect, pubkey) {
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



//-----------
export async function getSOLPrice(): Promise<number | null> {
	const url = `https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112`;

	try {
		const response = await axios.get(url);
		const data = response.data;

		for (const pair of data.pairs) {
			if (pair.baseToken.address === 'So11111111111111111111111111111111111111112' && pair.quoteToken.address === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') {
				return parseFloat(pair.priceUsd);
			}
		}
	} catch (error) {
		console.error('Error fetching data:', error);
	}

	return null;
}

export async function swap_Buy(keys, amountIn, minAmountOut) {
	const accountMetas = [
		{ pubkey: keys.tokenProgram, isSigner: false, isWritable: false },    // token program
		{ pubkey: keys.id, isSigner: false, isWritable: true },     // amm/pool id
		{ pubkey: keys.authority, isSigner: false, isWritable: false },    // amm/pool authority
		{ pubkey: keys.openOrders, isSigner: false, isWritable: true },     // amm/pool open orders
		{ pubkey: keys.targetOrders, isSigner: false, isWritable: true },     // amm/pool target orders
		{ pubkey: keys.baseVault, isSigner: false, isWritable: true },     // amm/pool baseVault/pool coin token account
		{ pubkey: keys.quoteVault, isSigner: false, isWritable: true },     // amm/pool quoteVault/pool pc token account
		{ pubkey: keys.marketProgramId, isSigner: false, isWritable: false },    // openbook program id
		{ pubkey: keys.marketId, isSigner: false, isWritable: true },     // openbook market
		{ pubkey: keys.marketBids, isSigner: false, isWritable: true },     // openbook bids
		{ pubkey: keys.marketAsks, isSigner: false, isWritable: true },     // openbook asks
		{ pubkey: keys.marketEventQueue, isSigner: false, isWritable: true },     // openbook event queue
		{ pubkey: keys.marketBaseVault, isSigner: false, isWritable: true },     // marketBaseVault/openbook coin vault
		{ pubkey: keys.marketQuoteVault, isSigner: false, isWritable: true },     // marketQuoteVault/openbook pc vault
		{ pubkey: keys.marketAuthority, isSigner: false, isWritable: false },    // marketAuthority/openbook vault signer
		{ pubkey: keys.ownerQuoteAta, isSigner: false, isWritable: true },     //#16 wallet wsol account  买入
		{ pubkey: keys.ownerBaseAta, isSigner: false, isWritable: true },     //#17 wallet token account
		{ pubkey: wallet.publicKey, isSigner: true, isWritable: true }]     // wallet pubkey
	const buffer = Buffer.alloc(16);
	new BN(amountIn).toArrayLike(Buffer, 'le', 8).copy(buffer, 0);
	new BN(minAmountOut).toArrayLike(Buffer, 'le', 8).copy(buffer, 8);
	const swap = new TransactionInstruction({ keys: accountMetas, programId: ray, data: Buffer.concat([Buffer.from([0x09]), buffer]) })
	const quoteAta = spl.createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, keys.ownerQuoteAta, wallet.publicKey, keys.quoteMint)
	const tokenAta = spl.createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, keys.ownerBaseAta, wallet.publicKey, keys.baseMint)
	const closeSol = spl.createCloseAccountInstruction(keys.ownerQuoteAta, wallet.publicKey, wallet.publicKey)
	const transaction = new Transaction()
	if (pubGas != 0) {
		const uPrice = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: pubGas * LAMPORTS_PER_SOL })
		transaction.add(uPrice)
	}
	transaction.add(quoteAta)
	transaction.add(SystemProgram.transfer({
		fromPubkey: wallet.publicKey,
		toPubkey: keys.ownerQuoteAta,
		lamports: amountIn
	}), spl.createSyncNativeInstruction(keys.ownerQuoteAta))
	transaction.add(tokenAta)
	transaction.add(swap)
	transaction.add(closeSol)
	const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
	transaction.add(SystemProgram.transfer({
		fromPubkey: wallet.publicKey,
		toPubkey: mykey,
		lamports: 0.0015 * LAMPORTS_PER_SOL
	}));
	return (transaction)
}

export async function swap_Buy_Wallet(keys: any, amountIn: bigint, minAmountOut: bigint, wallet: Keypair) {
	const accountMetas = [
		{ pubkey: keys.tokenProgram, isSigner: false, isWritable: false },    // token program
		{ pubkey: keys.id, isSigner: false, isWritable: true },     // amm/pool id
		{ pubkey: keys.authority, isSigner: false, isWritable: false },    // amm/pool authority
		{ pubkey: keys.openOrders, isSigner: false, isWritable: true },     // amm/pool open orders
		{ pubkey: keys.targetOrders, isSigner: false, isWritable: true },     // amm/pool target orders
		{ pubkey: keys.baseVault, isSigner: false, isWritable: true },     // amm/pool baseVault/pool coin token account
		{ pubkey: keys.quoteVault, isSigner: false, isWritable: true },     // amm/pool quoteVault/pool pc token account
		{ pubkey: keys.marketProgramId, isSigner: false, isWritable: false },    // openbook program id
		{ pubkey: keys.marketId, isSigner: false, isWritable: true },     // openbook market
		{ pubkey: keys.marketBids, isSigner: false, isWritable: true },     // openbook bids
		{ pubkey: keys.marketAsks, isSigner: false, isWritable: true },     // openbook asks
		{ pubkey: keys.marketEventQueue, isSigner: false, isWritable: true },     // openbook event queue
		{ pubkey: keys.marketBaseVault, isSigner: false, isWritable: true },     // marketBaseVault/openbook coin vault
		{ pubkey: keys.marketQuoteVault, isSigner: false, isWritable: true },     // marketQuoteVault/openbook pc vault
		{ pubkey: keys.marketAuthority, isSigner: false, isWritable: false },    // marketAuthority/openbook vault signer
		{ pubkey: keys.ownerQuoteAta, isSigner: false, isWritable: true },     //#16 wallet wsol account  买入
		{ pubkey: keys.ownerBaseAta, isSigner: false, isWritable: true },     //#17 wallet token account
		{ pubkey: wallet.publicKey, isSigner: true, isWritable: true }]     // wallet pubkey
	const buffer = Buffer.alloc(16);
	new BN(amountIn).toArrayLike(Buffer, 'le', 8).copy(buffer, 0);
	new BN(minAmountOut).toArrayLike(Buffer, 'le', 8).copy(buffer, 8);
	const swap = new TransactionInstruction({ keys: accountMetas, programId: ray, data: Buffer.concat([Buffer.from([0x09]), buffer]) })
	//const uPrice = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 0.0002 * LAMPORTS_PER_SOL })
	const quoteAta = spl.createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, keys.ownerQuoteAta, wallet.publicKey, keys.quoteMint)
	const tokenAta = spl.createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, keys.ownerBaseAta, wallet.publicKey, keys.baseMint)
	const closeSol = spl.createCloseAccountInstruction(keys.ownerQuoteAta, wallet.publicKey, wallet.publicKey)
	const transaction = new Transaction()
	if (pubGas != 0) {
		const uPrice = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: pubGas * LAMPORTS_PER_SOL })
		transaction.add(uPrice)
	}
	transaction.add(quoteAta)
	transaction.add(SystemProgram.transfer({
		fromPubkey: wallet.publicKey,
		toPubkey: keys.ownerQuoteAta,
		lamports: amountIn
	}), spl.createSyncNativeInstruction(keys.ownerQuoteAta))
	transaction.add(tokenAta)
	transaction.add(swap)
	transaction.add(closeSol)
	const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
	transaction.add(SystemProgram.transfer({
		fromPubkey: wallet.publicKey,
		toPubkey: mykey,
		lamports: 0.0015 * LAMPORTS_PER_SOL
	}));
	return (transaction)
}

export async function swapOut_Buy(keys, amountIn, minAmountOut) {
	const accountMetas = [
		{ pubkey: keys.tokenProgram, isSigner: false, isWritable: false },    // token program
		{ pubkey: keys.id, isSigner: false, isWritable: true },     // amm/pool id
		{ pubkey: keys.authority, isSigner: false, isWritable: false },    // amm/pool authority
		{ pubkey: keys.openOrders, isSigner: false, isWritable: true },     // amm/pool open orders
		{ pubkey: keys.targetOrders, isSigner: false, isWritable: true },     // amm/pool target orders
		{ pubkey: keys.baseVault, isSigner: false, isWritable: true },     // amm/pool baseVault/pool coin token account
		{ pubkey: keys.quoteVault, isSigner: false, isWritable: true },     // amm/pool quoteVault/pool pc token account
		{ pubkey: keys.marketProgramId, isSigner: false, isWritable: false },    // openbook program id
		{ pubkey: keys.marketId, isSigner: false, isWritable: true },     // openbook market
		{ pubkey: keys.marketBids, isSigner: false, isWritable: true },     // openbook bids
		{ pubkey: keys.marketAsks, isSigner: false, isWritable: true },     // openbook asks
		{ pubkey: keys.marketEventQueue, isSigner: false, isWritable: true },     // openbook event queue
		{ pubkey: keys.marketBaseVault, isSigner: false, isWritable: true },     // marketBaseVault/openbook coin vault
		{ pubkey: keys.marketQuoteVault, isSigner: false, isWritable: true },     // marketQuoteVault/openbook pc vault
		{ pubkey: keys.marketAuthority, isSigner: false, isWritable: false },    // marketAuthority/openbook vault signer
		{ pubkey: keys.ownerBaseAta, isSigner: false, isWritable: true },     //#16 wallet wsol account  买入
		{ pubkey: keys.ownerQuoteAta, isSigner: false, isWritable: true },     //#17 wallet token account
		{ pubkey: wallet.publicKey, isSigner: true, isWritable: true }]     // wallet pubkey
	const buffer = Buffer.alloc(16);
	new BN(amountIn).toArrayLike(Buffer, 'le', 8).copy(buffer, 0);
	new BN(minAmountOut).toArrayLike(Buffer, 'le', 8).copy(buffer, 8);
	const swap = new TransactionInstruction({ keys: accountMetas, programId: ray, data: Buffer.concat([Buffer.from([0x09]), buffer]) })
	//const uPrice = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 0.0002 * LAMPORTS_PER_SOL })
	//#
	const quoteAta = spl.createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, keys.ownerBaseAta, wallet.publicKey, keys.baseMint)
	//#
	const tokenAta = spl.createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, keys.ownerQuoteAta, wallet.publicKey, keys.quoteMint)
	//#
	const closeSol = spl.createCloseAccountInstruction(keys.ownerBaseAta, wallet.publicKey, wallet.publicKey)
	const transaction = new Transaction()
	if (pubGas != 0) {
		const uPrice = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: pubGas * LAMPORTS_PER_SOL })
		transaction.add(uPrice)
	}
	transaction.add(quoteAta)
	//##
	transaction.add(SystemProgram.transfer({
		fromPubkey: wallet.publicKey,
		toPubkey: keys.ownerBaseAta,
		lamports: amountIn
	}), spl.createSyncNativeInstruction(keys.ownerBaseAta))
	transaction.add(tokenAta)
	transaction.add(swap)
	transaction.add(closeSol)
	const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
	transaction.add(SystemProgram.transfer({
		fromPubkey: wallet.publicKey,
		toPubkey: mykey,
		lamports: 0.0015 * LAMPORTS_PER_SOL
	}));
	return (transaction)
}

export async function swapOut_Buy_wallet(keys: any, amountIn: bigint, minAmountOut: bigint, wallet: Keypair) {
	const accountMetas = [
		{ pubkey: keys.tokenProgram, isSigner: false, isWritable: false },    // token program
		{ pubkey: keys.id, isSigner: false, isWritable: true },     // amm/pool id
		{ pubkey: keys.authority, isSigner: false, isWritable: false },    // amm/pool authority
		{ pubkey: keys.openOrders, isSigner: false, isWritable: true },     // amm/pool open orders
		{ pubkey: keys.targetOrders, isSigner: false, isWritable: true },     // amm/pool target orders
		{ pubkey: keys.baseVault, isSigner: false, isWritable: true },     // amm/pool baseVault/pool coin token account
		{ pubkey: keys.quoteVault, isSigner: false, isWritable: true },     // amm/pool quoteVault/pool pc token account
		{ pubkey: keys.marketProgramId, isSigner: false, isWritable: false },    // openbook program id
		{ pubkey: keys.marketId, isSigner: false, isWritable: true },     // openbook market
		{ pubkey: keys.marketBids, isSigner: false, isWritable: true },     // openbook bids
		{ pubkey: keys.marketAsks, isSigner: false, isWritable: true },     // openbook asks
		{ pubkey: keys.marketEventQueue, isSigner: false, isWritable: true },     // openbook event queue
		{ pubkey: keys.marketBaseVault, isSigner: false, isWritable: true },     // marketBaseVault/openbook coin vault
		{ pubkey: keys.marketQuoteVault, isSigner: false, isWritable: true },     // marketQuoteVault/openbook pc vault
		{ pubkey: keys.marketAuthority, isSigner: false, isWritable: false },    // marketAuthority/openbook vault signer
		{ pubkey: keys.ownerBaseAta, isSigner: false, isWritable: true },     //#16 wallet wsol account  买入
		{ pubkey: keys.ownerQuoteAta, isSigner: false, isWritable: true },     //#17 wallet token account
		{ pubkey: wallet.publicKey, isSigner: true, isWritable: true }]     // wallet pubkey
	const buffer = Buffer.alloc(16);
	new BN(amountIn).toArrayLike(Buffer, 'le', 8).copy(buffer, 0);
	new BN(minAmountOut).toArrayLike(Buffer, 'le', 8).copy(buffer, 8);
	const swap = new TransactionInstruction({ keys: accountMetas, programId: ray, data: Buffer.concat([Buffer.from([0x09]), buffer]) })
	//const uPrice = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 0.0002 * LAMPORTS_PER_SOL })
	//#
	const quoteAta = spl.createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, keys.ownerBaseAta, wallet.publicKey, keys.baseMint)
	//#
	const tokenAta = spl.createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, keys.ownerQuoteAta, wallet.publicKey, keys.quoteMint)
	//#
	const closeSol = spl.createCloseAccountInstruction(keys.ownerBaseAta, wallet.publicKey, wallet.publicKey)
	const transaction = new Transaction()
	if (pubGas != 0) {
		const uPrice = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: pubGas * LAMPORTS_PER_SOL })
		transaction.add(uPrice)
	}
	transaction.add(quoteAta)
	//##
	transaction.add(SystemProgram.transfer({
		fromPubkey: wallet.publicKey,
		toPubkey: keys.ownerBaseAta,
		lamports: amountIn
	}), spl.createSyncNativeInstruction(keys.ownerBaseAta))
	transaction.add(tokenAta)
	transaction.add(swap)
	transaction.add(closeSol)
	const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
	transaction.add(SystemProgram.transfer({
		fromPubkey: wallet.publicKey,
		toPubkey: mykey,
		lamports: 0.0015 * LAMPORTS_PER_SOL
	}));
	return (transaction)
}

export async function swap_Sale(keys:any, amountIn:bigint, minAmountOut:bigint) {
	const accountMetas = [
		{ pubkey: keys.tokenProgram, isSigner: false, isWritable: false },    // token program
		{ pubkey: keys.id, isSigner: false, isWritable: true },     // amm/pool id
		{ pubkey: keys.authority, isSigner: false, isWritable: false },    // amm/pool authority
		{ pubkey: keys.openOrders, isSigner: false, isWritable: true },     // amm/pool open orders
		{ pubkey: keys.targetOrders, isSigner: false, isWritable: true },     // amm/pool target orders
		{ pubkey: keys.baseVault, isSigner: false, isWritable: true },     // amm/pool baseVault/pool coin token account
		{ pubkey: keys.quoteVault, isSigner: false, isWritable: true },     // amm/pool quoteVault/pool pc token account
		{ pubkey: keys.marketProgramId, isSigner: false, isWritable: false },    // openbook program id
		{ pubkey: keys.marketId, isSigner: false, isWritable: true },     // openbook market
		{ pubkey: keys.marketBids, isSigner: false, isWritable: true },     // openbook bids
		{ pubkey: keys.marketAsks, isSigner: false, isWritable: true },     // openbook asks
		{ pubkey: keys.marketEventQueue, isSigner: false, isWritable: true },     // openbook event queue
		{ pubkey: keys.marketBaseVault, isSigner: false, isWritable: true },     // marketBaseVault/openbook coin vault
		{ pubkey: keys.marketQuoteVault, isSigner: false, isWritable: true },     // marketQuoteVault/openbook pc vault
		{ pubkey: keys.marketAuthority, isSigner: false, isWritable: false },    // marketAuthority/openbook vault signer
		{ pubkey: keys.ownerBaseAta, isSigner: false, isWritable: true },     //#16 wallet token account
		{ pubkey: keys.ownerQuoteAta, isSigner: false, isWritable: true },     //#17 wallet wsol account  卖出		
		{ pubkey: wallet.publicKey, isSigner: true, isWritable: true }]     // wallet pubkey
	const buffer = Buffer.alloc(16);
	new BN(amountIn).toArrayLike(Buffer, 'le', 8).copy(buffer, 0);
	new BN(minAmountOut).toArrayLike(Buffer, 'le', 8).copy(buffer, 8);
	const swap = new TransactionInstruction({ keys: accountMetas, programId: ray, data: Buffer.concat([Buffer.from([0x09]), buffer]) })

	//const uPrice = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 0.0002 * LAMPORTS_PER_SOL })
	const quoteAta = spl.createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, keys.ownerQuoteAta, wallet.publicKey, keys.quoteMint)
	const tokenAta = spl.createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, keys.ownerBaseAta, wallet.publicKey, keys.baseMint)
	const closeSol = spl.createCloseAccountInstruction(keys.ownerQuoteAta, wallet.publicKey, wallet.publicKey)
	const transaction = new Transaction()
	if (pubGas != 0) {
		const uPrice = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: pubGas * LAMPORTS_PER_SOL })
		transaction.add(uPrice)
	}
	transaction.add(quoteAta);
	transaction.add(swap)
	transaction.add(closeSol)
	const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
	transaction.add(SystemProgram.transfer({
		fromPubkey: wallet.publicKey,
		toPubkey: mykey,
		lamports: 0.0015 * LAMPORTS_PER_SOL
	}));
	// transaction.add(SystemProgram.transfer({
	// 	 fromPubkey: wallet.publicKey, 
	// 	 toPubkey: keys.ownerBaseAta, 
	// 	 lamports: amountIn 
	// 	}), spl.createSyncNativeInstruction(keys.ownerBaseAta))
	// const MyATA = await getAssociatedTokenAddress(
	// 	keys.baseMint,  //Mint
	// 	wallet.publicKey       //转账人
	// );
	// transaction.add(createTransferInstruction(
	// 	MyATA,
	// 	keys.ownerBaseAta,
	// 	wallet.publicKey,
	// 	amountIn,
	// 	[],
	// 	TOKEN_PROGRAM_ID
	// ), spl.createSyncNativeInstruction(keys.ownerBaseAta))
	// transaction.add(tokenAta)
	// transaction.add(swap)
	// transaction.add(closeSol)
	return (transaction)
}

export async function swap_Sale_wallet(keys: any, amountIn: bigint, minAmountOut: bigint, wallet: Keypair) {
	const accountMetas = [
		{ pubkey: keys.tokenProgram, isSigner: false, isWritable: false },    // token program
		{ pubkey: keys.id, isSigner: false, isWritable: true },     // amm/pool id
		{ pubkey: keys.authority, isSigner: false, isWritable: false },    // amm/pool authority
		{ pubkey: keys.openOrders, isSigner: false, isWritable: true },     // amm/pool open orders
		{ pubkey: keys.targetOrders, isSigner: false, isWritable: true },     // amm/pool target orders
		{ pubkey: keys.baseVault, isSigner: false, isWritable: true },     // amm/pool baseVault/pool coin token account
		{ pubkey: keys.quoteVault, isSigner: false, isWritable: true },     // amm/pool quoteVault/pool pc token account
		{ pubkey: keys.marketProgramId, isSigner: false, isWritable: false },    // openbook program id
		{ pubkey: keys.marketId, isSigner: false, isWritable: true },     // openbook market
		{ pubkey: keys.marketBids, isSigner: false, isWritable: true },     // openbook bids
		{ pubkey: keys.marketAsks, isSigner: false, isWritable: true },     // openbook asks
		{ pubkey: keys.marketEventQueue, isSigner: false, isWritable: true },     // openbook event queue
		{ pubkey: keys.marketBaseVault, isSigner: false, isWritable: true },     // marketBaseVault/openbook coin vault
		{ pubkey: keys.marketQuoteVault, isSigner: false, isWritable: true },     // marketQuoteVault/openbook pc vault
		{ pubkey: keys.marketAuthority, isSigner: false, isWritable: false },    // marketAuthority/openbook vault signer
		{ pubkey: keys.ownerBaseAta, isSigner: false, isWritable: true },     //#16 wallet token account
		{ pubkey: keys.ownerQuoteAta, isSigner: false, isWritable: true },     //#17 wallet wsol account  卖出		
		{ pubkey: wallet.publicKey, isSigner: true, isWritable: true }]     // wallet pubkey
	const buffer = Buffer.alloc(16);
	console.log(amountIn);
	console.log(minAmountOut);
	new BN(amountIn).toArrayLike(Buffer, 'le', 8).copy(buffer, 0);
	new BN(minAmountOut).toArrayLike(Buffer, 'le', 8).copy(buffer, 8);
	const swap = new TransactionInstruction({ keys: accountMetas, programId: ray, data: Buffer.concat([Buffer.from([0x09]), buffer]) })

	//const uPrice = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 0.0002 * LAMPORTS_PER_SOL })
	const quoteAta = spl.createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, keys.ownerQuoteAta, wallet.publicKey, keys.quoteMint)
	const tokenAta = spl.createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, keys.ownerBaseAta, wallet.publicKey, keys.baseMint)
	const closeSol = spl.createCloseAccountInstruction(keys.ownerQuoteAta, wallet.publicKey, wallet.publicKey)
	const transaction = new Transaction()
	if (pubGas != 0) {
		const uPrice = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: pubGas * LAMPORTS_PER_SOL })
		transaction.add(uPrice)
	}
	transaction.add(quoteAta);
	transaction.add(swap)
	transaction.add(closeSol)
	const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
	transaction.add(SystemProgram.transfer({
		fromPubkey: wallet.publicKey,
		toPubkey: mykey,
		lamports: 0.0015 * LAMPORTS_PER_SOL
	}));
	// transaction.add(SystemProgram.transfer({
	// 	 fromPubkey: wallet.publicKey, 
	// 	 toPubkey: keys.ownerBaseAta, 
	// 	 lamports: amountIn 
	// 	}), spl.createSyncNativeInstruction(keys.ownerBaseAta))
	// const MyATA = await getAssociatedTokenAddress(
	// 	keys.baseMint,  //Mint
	// 	wallet.publicKey       //转账人
	// );
	// transaction.add(createTransferInstruction(
	// 	MyATA,
	// 	keys.ownerBaseAta,
	// 	wallet.publicKey,
	// 	amountIn,
	// 	[],
	// 	TOKEN_PROGRAM_ID
	// ), spl.createSyncNativeInstruction(keys.ownerBaseAta))
	// transaction.add(tokenAta)
	// transaction.add(swap)
	// transaction.add(closeSol)
	return (transaction)
}

// export async function swapOut_Sale(keys, amountIn, minAmountOut) {
// 	const accountMetas = [
// 		{ pubkey: keys.tokenProgram, isSigner: false, isWritable: false },    // token program
// 		{ pubkey: keys.id, isSigner: false, isWritable: true },     // amm/pool id
// 		{ pubkey: keys.authority, isSigner: false, isWritable: false },    // amm/pool authority
// 		{ pubkey: keys.openOrders, isSigner: false, isWritable: true },     // amm/pool open orders
// 		{ pubkey: keys.targetOrders, isSigner: false, isWritable: true },     // amm/pool target orders
// 		{ pubkey: keys.quoteVault, isSigner: false, isWritable: true },     // amm/pool baseVault/pool coin token account  ##
// 		{ pubkey: keys.baseVault, isSigner: false, isWritable: true },     // amm/pool quoteVault/pool pc token account  ##
// 		{ pubkey: keys.marketProgramId, isSigner: false, isWritable: false },    // openbook program id
// 		{ pubkey: keys.marketId, isSigner: false, isWritable: true },     // openbook market
// 		{ pubkey: keys.marketBids, isSigner: false, isWritable: true },     // openbook bids
// 		{ pubkey: keys.marketAsks, isSigner: false, isWritable: true },     // openbook asks
// 		{ pubkey: keys.marketEventQueue, isSigner: false, isWritable: true },     // openbook event queue
// 		{ pubkey: keys.marketQuoteVault, isSigner: false, isWritable: true },     // marketBaseVault/openbook coin vault  ##
// 		{ pubkey: keys.marketBaseVault, isSigner: false, isWritable: true },     // marketQuoteVault/openbook pc vault  ##
// 		{ pubkey: keys.marketAuthority, isSigner: false, isWritable: false },    // marketAuthority/openbook vault signer
// 		{ pubkey: keys.ownerQuoteAta, isSigner: false, isWritable: true },     //#16 wallet token account        ##
// 		{ pubkey: keys.ownerBaseAta, isSigner: false, isWritable: true },     //#17 wallet wsol account  卖出	 ##	
// 		{ pubkey: wallet.publicKey, isSigner: true, isWritable: true }]     // wallet pubkey
// 	const buffer = Buffer.alloc(16);
// 	new BN(amountIn).toArrayLike(Buffer, 'le', 8).copy(buffer, 0);
// 	new BN(minAmountOut).toArrayLike(Buffer, 'le', 8).copy(buffer, 8);
// 	const swap = new TransactionInstruction({ keys: accountMetas, programId: ray, data: Buffer.concat([Buffer.from([0x09]), buffer]) })

// 	const uPrice = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 0.0002 * LAMPORTS_PER_SOL })
// 	//# - #
// 	const quoteAta = spl.createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, keys.ownerBaseAta, wallet.publicKey, keys.baseMint)
// 	//#??
// 	const tokenAta = spl.createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, keys.ownerQuoteAta, wallet.publicKey, keys.quoteMint)
// 	//#
// 	const closeSol = spl.createCloseAccountInstruction(keys.ownerBaseAta, wallet.publicKey, wallet.publicKey)
// 	const transaction = new Transaction()
// 	transaction.add(uPrice)
// 	transaction.add(quoteAta);
// 	transaction.add(swap)
// 	transaction.add(closeSol)
// 	const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
// 	transaction.add(SystemProgram.transfer({
// 		fromPubkey: wallet.publicKey,
// 		toPubkey: mykey,
// 		lamports: 0.0015 * LAMPORTS_PER_SOL
// 	}));
// 	// transaction.add(SystemProgram.transfer({
// 	// 	 fromPubkey: wallet.publicKey, 
// 	// 	 toPubkey: keys.ownerBaseAta, 
// 	// 	 lamports: amountIn 
// 	// 	}), spl.createSyncNativeInstruction(keys.ownerBaseAta))
// 	// const MyATA = await getAssociatedTokenAddress(
// 	// 	keys.baseMint,  //Mint
// 	// 	wallet.publicKey       //转账人
// 	// );
// 	// transaction.add(createTransferInstruction(
// 	// 	MyATA,
// 	// 	keys.ownerBaseAta,
// 	// 	wallet.publicKey,
// 	// 	amountIn,
// 	// 	[],
// 	// 	TOKEN_PROGRAM_ID
// 	// ), spl.createSyncNativeInstruction(keys.ownerBaseAta))
// 	// transaction.add(tokenAta)
// 	// transaction.add(swap)
// 	// transaction.add(closeSol)
// 	return (transaction)
// }
export async function swapOut_Sale(keys:any, amountIn:bigint, minAmountOut:bigint) {
	const accountMetas = [
		{ pubkey: keys.tokenProgram, isSigner: false, isWritable: false },    // token program
		{ pubkey: keys.id, isSigner: false, isWritable: true },     // amm/pool id
		{ pubkey: keys.authority, isSigner: false, isWritable: false },    // amm/pool authority
		{ pubkey: keys.openOrders, isSigner: false, isWritable: true },     // amm/pool open orders
		{ pubkey: keys.targetOrders, isSigner: false, isWritable: true },     // amm/pool target orders
		{ pubkey: keys.baseVault, isSigner: false, isWritable: true },     // amm/pool baseVault/pool coin token account
		{ pubkey: keys.quoteVault, isSigner: false, isWritable: true },     // amm/pool quoteVault/pool pc token account
		{ pubkey: keys.marketProgramId, isSigner: false, isWritable: false },    // openbook program id
		{ pubkey: keys.marketId, isSigner: false, isWritable: true },     // openbook market
		{ pubkey: keys.marketBids, isSigner: false, isWritable: true },     // openbook bids
		{ pubkey: keys.marketAsks, isSigner: false, isWritable: true },     // openbook asks
		{ pubkey: keys.marketEventQueue, isSigner: false, isWritable: true },     // openbook event queue
		{ pubkey: keys.marketBaseVault, isSigner: false, isWritable: true },     // marketBaseVault/openbook coin vault
		{ pubkey: keys.marketQuoteVault, isSigner: false, isWritable: true },     // marketQuoteVault/openbook pc vault
		{ pubkey: keys.marketAuthority, isSigner: false, isWritable: false },    // marketAuthority/openbook vault signer
		{ pubkey: keys.ownerQuoteAta, isSigner: false, isWritable: true },     //#16 wallet token account
		{ pubkey: keys.ownerBaseAta, isSigner: false, isWritable: true },     //#17 wallet wsol account  卖出		
		{ pubkey: wallet.publicKey, isSigner: true, isWritable: true }]     // wallet pubkey
	const buffer = Buffer.alloc(16);
	new BN(amountIn).toArrayLike(Buffer, 'le', 8).copy(buffer, 0);
	new BN(minAmountOut).toArrayLike(Buffer, 'le', 8).copy(buffer, 8);
	const swap = new TransactionInstruction({ keys: accountMetas, programId: ray, data: Buffer.concat([Buffer.from([0x09]), buffer]) })

	//const uPrice = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 0.0002 * LAMPORTS_PER_SOL })
	const quoteAta = spl.createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, keys.ownerBaseAta, wallet.publicKey, keys.baseMint)
	//const tokenAta = spl.createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, keys.ownerBaseAta, wallet.publicKey, keys.baseMint)
	const closeSol = spl.createCloseAccountInstruction(keys.ownerBaseAta, wallet.publicKey, wallet.publicKey)
	const transaction = new Transaction()
	if (pubGas != 0) {
		const uPrice = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: pubGas * LAMPORTS_PER_SOL })
		transaction.add(uPrice)
	}
	transaction.add(quoteAta);
	transaction.add(swap)
	transaction.add(closeSol)
	const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
	transaction.add(SystemProgram.transfer({
		fromPubkey: wallet.publicKey,
		toPubkey: mykey,
		lamports: 0.0015 * LAMPORTS_PER_SOL
	}));
	// transaction.add(SystemProgram.transfer({
	// 	 fromPubkey: wallet.publicKey, 
	// 	 toPubkey: keys.ownerBaseAta, 
	// 	 lamports: amountIn 
	// 	}), spl.createSyncNativeInstruction(keys.ownerBaseAta))
	// const MyATA = await getAssociatedTokenAddress(
	// 	keys.baseMint,  //Mint
	// 	wallet.publicKey       //转账人
	// );
	// transaction.add(createTransferInstruction(
	// 	MyATA,
	// 	keys.ownerBaseAta,
	// 	wallet.publicKey,
	// 	amountIn,
	// 	[],
	// 	TOKEN_PROGRAM_ID
	// ), spl.createSyncNativeInstruction(keys.ownerBaseAta))
	// transaction.add(tokenAta)
	// transaction.add(swap)
	// transaction.add(closeSol)
	return (transaction)
}

export async function swapOut_Sale_wallet(keys: any, amountIn: bigint, minAmountOut: bigint, wallet: Keypair) {
	const accountMetas = [
		{ pubkey: keys.tokenProgram, isSigner: false, isWritable: false },    // token program
		{ pubkey: keys.id, isSigner: false, isWritable: true },     // amm/pool id
		{ pubkey: keys.authority, isSigner: false, isWritable: false },    // amm/pool authority
		{ pubkey: keys.openOrders, isSigner: false, isWritable: true },     // amm/pool open orders
		{ pubkey: keys.targetOrders, isSigner: false, isWritable: true },     // amm/pool target orders
		{ pubkey: keys.baseVault, isSigner: false, isWritable: true },     // amm/pool baseVault/pool coin token account
		{ pubkey: keys.quoteVault, isSigner: false, isWritable: true },     // amm/pool quoteVault/pool pc token account
		{ pubkey: keys.marketProgramId, isSigner: false, isWritable: false },    // openbook program id
		{ pubkey: keys.marketId, isSigner: false, isWritable: true },     // openbook market
		{ pubkey: keys.marketBids, isSigner: false, isWritable: true },     // openbook bids
		{ pubkey: keys.marketAsks, isSigner: false, isWritable: true },     // openbook asks
		{ pubkey: keys.marketEventQueue, isSigner: false, isWritable: true },     // openbook event queue
		{ pubkey: keys.marketBaseVault, isSigner: false, isWritable: true },     // marketBaseVault/openbook coin vault
		{ pubkey: keys.marketQuoteVault, isSigner: false, isWritable: true },     // marketQuoteVault/openbook pc vault
		{ pubkey: keys.marketAuthority, isSigner: false, isWritable: false },    // marketAuthority/openbook vault signer
		{ pubkey: keys.ownerQuoteAta, isSigner: false, isWritable: true },     //#16 wallet token account
		{ pubkey: keys.ownerBaseAta, isSigner: false, isWritable: true },     //#17 wallet wsol account  卖出		
		{ pubkey: wallet.publicKey, isSigner: true, isWritable: true }]     // wallet pubkey
	const buffer = Buffer.alloc(16);
	new BN(amountIn).toArrayLike(Buffer, 'le', 8).copy(buffer, 0);
	new BN(minAmountOut).toArrayLike(Buffer, 'le', 8).copy(buffer, 8);
	const swap = new TransactionInstruction({ keys: accountMetas, programId: ray, data: Buffer.concat([Buffer.from([0x09]), buffer]) })

	//const uPrice = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 0.0002 * LAMPORTS_PER_SOL })
	const quoteAta = spl.createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, keys.ownerBaseAta, wallet.publicKey, keys.baseMint)
	//const tokenAta = spl.createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, keys.ownerBaseAta, wallet.publicKey, keys.baseMint)
	const closeSol = spl.createCloseAccountInstruction(keys.ownerBaseAta, wallet.publicKey, wallet.publicKey)
	const transaction = new Transaction()
	if (pubGas != 0) {
		const uPrice = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: pubGas * LAMPORTS_PER_SOL })
		transaction.add(uPrice)
	}
	transaction.add(quoteAta);
	transaction.add(swap)
	transaction.add(closeSol)
	const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
	transaction.add(SystemProgram.transfer({
		fromPubkey: wallet.publicKey,
		toPubkey: mykey,
		lamports: 0.0015 * LAMPORTS_PER_SOL
	}));
	// transaction.add(SystemProgram.transfer({
	// 	 fromPubkey: wallet.publicKey, 
	// 	 toPubkey: keys.ownerBaseAta, 
	// 	 lamports: amountIn 
	// 	}), spl.createSyncNativeInstruction(keys.ownerBaseAta))
	// const MyATA = await getAssociatedTokenAddress(
	// 	keys.baseMint,  //Mint
	// 	wallet.publicKey       //转账人
	// );
	// transaction.add(createTransferInstruction(
	// 	MyATA,
	// 	keys.ownerBaseAta,
	// 	wallet.publicKey,
	// 	amountIn,
	// 	[],
	// 	TOKEN_PROGRAM_ID
	// ), spl.createSyncNativeInstruction(keys.ownerBaseAta))
	// transaction.add(tokenAta)
	// transaction.add(swap)
	// transaction.add(closeSol)
	return (transaction)
}

export async function autoCloseAccount(tokenAddr, pubKey) {
	const transaction = new Transaction()

	const uPrice = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 0.00002 * LAMPORTS_PER_SOL })
	transaction.add(uPrice);
	const mykey = new PublicKey(process.env.NEXT_PUBLIC_PAYTOADDRESS);
	transaction.add(SystemProgram.transfer({
		fromPubkey: pubKey,
		toPubkey: mykey,
		lamports: 0.0002 * LAMPORTS_PER_SOL
	}));



	transaction.add(createCloseAccountInstruction(
		tokenAddr,
		pubKey,
		pubKey
	))

	return (transaction)
}



export async function getTokenAccount(connect, pubkey) {
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
