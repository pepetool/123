import { createAssociatedTokenAccountInstruction, getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import { Commitment, ComputeBudgetProgram, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { struct, bool, u64, Layout, publicKey } from "@coral-xyz/borsh";
import { Program, Provider } from "@coral-xyz/anchor";
import { IDL } from "utils/pump/IDL";
import { PumpFun } from "utils/pump/IDL/pump-fun";
import { bigInt } from "@solana/buffer-layout-utils";
import { BN } from "bn.js";

const GLOBAL = new PublicKey("4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf");
const FEE_RECIPIENT = new PublicKey("CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM");
const SYSTEM_PROGRAM_ID = new PublicKey("11111111111111111111111111111111");
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOC_TOKEN_ACC_PROG = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const RENT = new PublicKey("SysvarRent111111111111111111111111111111111");
const PUMP_FUN_ACCOUNT = new PublicKey("Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1");
const PUMP_PROGRAMID = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
let PUBLIC_UNIT = 0.0001;
let PUBLIC_gasFee = 0.0001;

export function setPumpUnit(u){
    PUBLIC_UNIT = u;
}

export function setPumpPirce(u){
    PUBLIC_gasFee = u;
}


export const BONDING_CURVE_SEED = "bonding-curve";

export function getBondingCurvePDA(mint: PublicKey) {
    return PublicKey.findProgramAddressSync(
        [Buffer.from(BONDING_CURVE_SEED), mint.toBuffer()],
        PUMP_PROGRAMID
    )[0];
}

export function bufferFromUInt64(value: number | string) {
    let buffer = Buffer.alloc(8);
    buffer.writeBigUInt64LE(BigInt(value));
    return buffer;
}

class BondingCurveAccount {
    discriminator: bigint;
    virtualTokenReserves: bigint;
    virtualSolReserves: bigint;
    realTokenReserves: bigint;
    realSolReserves: bigint;
    tokenTotalSupply: bigint;
    complete: boolean;
    constructor(
        discriminator,
        virtualTokenReserves,
        virtualSolReserves,
        realTokenReserves,
        realSolReserves,
        tokenTotalSupply,
        complete
    ) {
        this.discriminator = discriminator;
        this.virtualTokenReserves = virtualTokenReserves;
        this.virtualSolReserves = virtualSolReserves;
        this.realTokenReserves = realTokenReserves;
        this.realSolReserves = realSolReserves;
        this.tokenTotalSupply = tokenTotalSupply;
        this.complete = complete;
    }

    public static fromBuffer(buffer: Buffer): BondingCurveAccount {
        const structure: Layout<BondingCurveAccount> = struct([
            u64("discriminator"),
            u64("virtualTokenReserves"),
            u64("virtualSolReserves"),
            u64("realTokenReserves"),
            u64("realSolReserves"),
            u64("tokenTotalSupply"),
            bool("complete"),
        ]);

        let value = structure.decode(buffer);
        return new BondingCurveAccount(
            BigInt(value.discriminator),
            BigInt(value.virtualTokenReserves),
            BigInt(value.virtualSolReserves),
            BigInt(value.realTokenReserves),
            BigInt(value.realSolReserves),
            BigInt(value.tokenTotalSupply),
            value.complete
        );
    }
}


class GlobalAccount {
    public discriminator: bigint;
    public initialized: boolean = false;
    public authority: PublicKey;
    public feeRecipient: PublicKey;
    public initialVirtualTokenReserves: bigint;
    public initialVirtualSolReserves: bigint;
    public initialRealTokenReserves: bigint;
    public tokenTotalSupply: bigint;
    public feeBasisPoints: bigint;

    constructor(
        discriminator: bigint,
        initialized: boolean,
        authority: PublicKey,
        feeRecipient: PublicKey,
        initialVirtualTokenReserves: bigint,
        initialVirtualSolReserves: bigint,
        initialRealTokenReserves: bigint,
        tokenTotalSupply: bigint,
        feeBasisPoints: bigint
    ) {
        this.discriminator = discriminator;
        this.initialized = initialized;
        this.authority = authority;
        this.feeRecipient = feeRecipient;
        this.initialVirtualTokenReserves = initialVirtualTokenReserves;
        this.initialVirtualSolReserves = initialVirtualSolReserves;
        this.initialRealTokenReserves = initialRealTokenReserves;
        this.tokenTotalSupply = tokenTotalSupply;
        this.feeBasisPoints = feeBasisPoints;
    }

    public static fromBuffer(buffer: Buffer): GlobalAccount {
        const structure: Layout<GlobalAccount> = struct([
            u64("discriminator"),
            bool("initialized"),
            publicKey("authority"),
            publicKey("feeRecipient"),
            u64("initialVirtualTokenReserves"),
            u64("initialVirtualSolReserves"),
            u64("initialRealTokenReserves"),
            u64("tokenTotalSupply"),
            u64("feeBasisPoints"),
        ]);

        let value = structure.decode(buffer);
        return new GlobalAccount(
            BigInt(value.discriminator),
            value.initialized,
            value.authority,
            value.feeRecipient,
            BigInt(value.initialVirtualTokenReserves),
            BigInt(value.initialVirtualSolReserves),
            BigInt(value.initialRealTokenReserves),
            BigInt(value.tokenTotalSupply),
            BigInt(value.feeBasisPoints)
        );
    }
}

const DEFAULT_COMMITMENT: Commitment = "finalized";
export const GLOBAL_ACCOUNT_SEED = "global";
const PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";

async function getGlobalAccount(commitment: Commitment = DEFAULT_COMMITMENT, connection) {
    const [globalAccountPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from(GLOBAL_ACCOUNT_SEED)],
        new PublicKey(PROGRAM_ID)
    );

    const tokenAccount = await connection.getAccountInfo(
        globalAccountPDA,
        commitment
    );

    return GlobalAccount.fromBuffer(tokenAccount!.data);
}

async function getBondingCurveAccount(mint, connection, commitment = "finalized") {
    const tokenAccount = await connection.getAccountInfo(getBondingCurvePDA(mint), commitment);
    if (!tokenAccount) {
        return null;
    }
    return BondingCurveAccount.fromBuffer(tokenAccount.data);
}

export const calculateWithSlippageBuy = (
    amount: bigint,
    basisPoints: bigint
) => {
    return amount + (amount * basisPoints) / BigInt(10000);
};

export async function getBuyPrice(mint, connection: any, amount: bigint): Promise<bigint> {
    const bondingCurveAccount = await getBondingCurveAccount(mint, connection);
    // console.log(bondingCurveAccount);
    if (!bondingCurveAccount) {
        throw new Error("error");
    }

    if (bondingCurveAccount.complete) {
        throw new Error("Curve is complete");
    }

    if (amount <= BigInt(0)) {
        return BigInt(0);
    }


    // Calculate the product of virtual reserves
    const n = bondingCurveAccount.virtualSolReserves * bondingCurveAccount.virtualTokenReserves;

    // Calculate the new virtual sol reserves after the purchase
    const i = bondingCurveAccount.virtualSolReserves + amount;

    // Calculate the new virtual token reserves after the purchase
    const r = n / i + BigInt(1);


    // Calculate the amount of tokens to be purchased
    const s = bondingCurveAccount.virtualTokenReserves - r;

    // Return the minimum of the calculated tokens and real token reserves
    console.log("virtualSolReserves: ", bondingCurveAccount.virtualSolReserves);
    console.log("virtualTokenReserves: ", bondingCurveAccount.virtualTokenReserves);
    console.log("realTokenReserves: ", bondingCurveAccount.realTokenReserves);
    return s < bondingCurveAccount.realTokenReserves ? s : bondingCurveAccount.realTokenReserves;
}

export async function getInitialBuyPrice(connection, amount: bigint): Promise<bigint> {
    if (amount <= 0) {
        return BigInt(0);
    }

    let globalAccount = await getGlobalAccount(DEFAULT_COMMITMENT, connection);

    // 30000000000n   initialVirtualSolReserves
    // 1073000000000000n   initialVirtualTokenReserves
    let n = globalAccount.initialVirtualSolReserves * globalAccount.initialVirtualTokenReserves;
    let i = globalAccount.initialVirtualSolReserves + amount;
    let r = n / i + BigInt(1);
    let s = globalAccount.initialVirtualTokenReserves - r;
    return s < globalAccount.initialRealTokenReserves
        ? s
        : globalAccount.initialRealTokenReserves;
}

export async function getBuyInstructions(
    buyer: PublicKey,
    mint: PublicKey,
    amount: bigint,
    solAmount: bigint,
    provider?: Provider
) {
    const associatedBondingCurve = await getAssociatedTokenAddress(
        mint,
        getBondingCurvePDA(mint),
        true
    );

    const associatedUser = await getAssociatedTokenAddress(mint, buyer, false);

    let transaction = new Transaction();

    try {
        await getAccount(this.connection, associatedUser, "confirmed");
    } catch (e) {
        transaction.add(
            createAssociatedTokenAccountInstruction(
                buyer,
                associatedUser,
                buyer,
                mint
            )
        );
    }
    const program = new Program<PumpFun>(IDL as PumpFun, provider);

    transaction.add(
        await program.methods
            .buy(new BN(amount.toString()), new BN(solAmount.toString()))
            .accounts({
                feeRecipient: new PublicKey(FEE_RECIPIENT),
                mint: mint,
                associatedBondingCurve: associatedBondingCurve,
                associatedUser: associatedUser,
                user: buyer,
            })
            .transaction()
    );

    return transaction;
}

export async function Swap_Buy_pump(connection, bondingCurve, accbondingCurve, mint, wallet: any, buyTokenNum: any, buySolNum: any, cnaInit: boolean = true) {
    // const bondingCurve = accounts[2];//new PublicKey("DpkkdkiZAo5JuCshJpLyANLhr9Bph69CVKwn61rZ7LLP");
    // const accbondingCurve = accounts[3];
    //const mint = accounts[0];//new PublicKey("GZveUoLfqrM6CnTpyKqFmJHEoCvHFJ2J6XXAJaiRpump");    

    const txBuilder = new Transaction();

    if (PUBLIC_UNIT !== 0) {
        const uLimit = ComputeBudgetProgram.setComputeUnitLimit({ units: PUBLIC_UNIT * LAMPORTS_PER_SOL });
        txBuilder.add(uLimit);
    }
    if (PUBLIC_gasFee !== 0) {
        const uPrice = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: PUBLIC_gasFee * LAMPORTS_PER_SOL })
        txBuilder.add(uPrice);
    }

    const tokenAccountAddress = await getAssociatedTokenAddress(
        mint,
        wallet.publicKey,
        false
    );

    if (cnaInit) {
        txBuilder.add(
            createAssociatedTokenAccountInstruction(
                wallet.publicKey,
                tokenAccountAddress,
                wallet.publicKey,
                mint
            )
        );
    } else {
        const tokenAccountInfo = await connection.getAccountInfo(tokenAccountAddress);
        if (!tokenAccountInfo) {
            //console.log("没帐号");
            txBuilder.add(
                createAssociatedTokenAccountInstruction(
                    wallet.publicKey,
                    tokenAccountAddress,
                    wallet.publicKey,
                    mint
                )
            );
        };
    }
    // m_ataList.push(
    //     {
    //         publickey: wallet.publicKey,
    //         ataAccount: tokenAccountAddress
    //     });

    const ASSOCIATED_USER = tokenAccountAddress;
    const keys = [
        { pubkey: GLOBAL, isSigner: false, isWritable: false },
        { pubkey: FEE_RECIPIENT, isSigner: false, isWritable: true },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: bondingCurve, isSigner: false, isWritable: true },
        { pubkey: accbondingCurve, isSigner: false, isWritable: true },
        { pubkey: ASSOCIATED_USER, isSigner: false, isWritable: true },
        { pubkey: wallet.publicKey, isSigner: false, isWritable: true },
        { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: RENT, isSigner: false, isWritable: false },
        { pubkey: PUMP_FUN_ACCOUNT, isSigner: false, isWritable: false },
        { pubkey: PUMP_PROGRAMID, isSigner: false, isWritable: false },
    ];
    //357666000000
    //const buyTokenAmt = buyTokenNum;
    //--------
    const maxSolCost1 = buySolNum;// * LAMPORTS_PER_SOL; //Math.floor(solInWithSlippage * LAMPORTS_PER_SOL);   
    const tokenOut = buyTokenNum;//buyTokenAmt * (10 ** 6);//50000000000;  //50000
    const data = Buffer.concat([
        bufferFromUInt64("16927863322537952870"),
        bufferFromUInt64(tokenOut),  //测试0行不行???
        bufferFromUInt64(maxSolCost1)
    ]);

    const instruction = new TransactionInstruction({
        keys: keys,
        programId: PUMP_PROGRAMID,
        data: data
    });
    txBuilder.add(instruction);
    return txBuilder;
}

export async function Swap_Sale_pump(bondingCurve, accbondingCurve, mint, wallet: any, tokenBalance: any) {
    //const bondingCurve = accounts[2];//new PublicKey("DpkkdkiZAo5JuCshJpLyANLhr9Bph69CVKwn61rZ7LLP");
    //const accbondingCurve = accounts[3];
    //const mint = accounts[0];//new PublicKey("GZveUoLfqrM6CnTpyKqFmJHEoCvHFJ2J6XXAJaiRpump");    
    //const maxSolCost1 = buySolNum * LAMPORTS_PER_SOL;//Math.floor(solInWithSlippage * LAMPORTS_PER_SOL);
    const minSolOutput = 0;//Math.floor(tokenBalance! * (1 - slippageDecimal) * 1/1);  
    const txBuilder = new Transaction();
    if (PUBLIC_UNIT !== 0) {
        const uLimit = ComputeBudgetProgram.setComputeUnitLimit({ units: PUBLIC_UNIT * LAMPORTS_PER_SOL });
        txBuilder.add(uLimit);
    }
    if (PUBLIC_gasFee !== 0) {
        const uPrice = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: PUBLIC_gasFee * LAMPORTS_PER_SOL })
        txBuilder.add(uPrice);
    }
    const tokenAccountAddress1 = await getAssociatedTokenAddress(
        mint,
        wallet.publicKey,
        false
    );
    // txBuilder.add(
    //     createAssociatedTokenAccountInstruction(
    //         wallet.publicKey,
    //         tokenAccountAddress,
    //         wallet.publicKey,
    //         mint
    //     )
    // );
    const ASSOCIATED_USER = tokenAccountAddress1;
    const keys = [
        { pubkey: GLOBAL, isSigner: false, isWritable: false },
        { pubkey: FEE_RECIPIENT, isSigner: false, isWritable: true },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: bondingCurve, isSigner: false, isWritable: true },
        { pubkey: accbondingCurve, isSigner: false, isWritable: true },
        { pubkey: ASSOCIATED_USER, isSigner: false, isWritable: true },
        { pubkey: wallet.publicKey, isSigner: false, isWritable: true },
        { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: ASSOC_TOKEN_ACC_PROG, isSigner: false, isWritable: false },  //不一样
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: PUMP_FUN_ACCOUNT, isSigner: false, isWritable: false },
        { pubkey: PUMP_PROGRAMID, isSigner: false, isWritable: false },
    ];
    //357666000000
    //const amt = (tokenBalance * (10 ** 6));
    const tokenBalance1 = tokenBalance;//Math.floor(amt);
    const data = Buffer.concat([
        bufferFromUInt64("12502976635542562355"),
        bufferFromUInt64(tokenBalance1),
        bufferFromUInt64(minSolOutput)
    ]);

    const instruction = new TransactionInstruction({
        keys: keys,
        programId: PUMP_PROGRAMID,
        data: data
    });
    txBuilder.add(instruction);
    return txBuilder;
}

const MPL_TOKEN_METADATA_PROGRAM_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
const METADATA_SEED = "metadata";

export async function getCreateInstructions(
    creator: PublicKey,
    name: string,
    symbol: string,
    uri: string,
    mint: Keypair,
    provider?: Provider
) {
    const mplTokenMetadata = new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID);

    const [metadataPDA] = PublicKey.findProgramAddressSync(
        [
            Buffer.from(METADATA_SEED),
            mplTokenMetadata.toBuffer(),
            mint.publicKey.toBuffer(),
        ],
        mplTokenMetadata
    );

    const associatedBondingCurve = await getAssociatedTokenAddress(
        mint.publicKey,
        getBondingCurvePDA(mint.publicKey),
        true
    );

    const program = new Program<PumpFun>(IDL as PumpFun, provider);
    return program.methods
        .create(name, symbol, uri)
        .accounts({
            mint: mint.publicKey,
            associatedBondingCurve: associatedBondingCurve,
            metadata: metadataPDA,
            user: creator,
        })
        .signers([mint])
        .transaction();
}

export function getPumpprice(token: bigint, sol: bigint, amount: bigint) {
    const virtualSolReserves = BigInt(30000000000) + sol;
    const virtualTokenReserves = BigInt(1073000000000000) - token;                                        
    const realTokenReserves = BigInt(793099998307558);

    // Calculate the product of virtual reserves
    const n = virtualSolReserves * virtualTokenReserves;
    //console.log("n: ", n);

    // Calculate the new virtual sol reserves after the purchase
    const i = virtualSolReserves + amount;
    //console.log("i: ", i);

    // Calculate the new virtual token reserves after the purchase
    const r = n / i + BigInt(1);
    //console.log("r: ", r);


    // Calculate the amount of tokens to be purchased
    const s = virtualTokenReserves - r;


    // Return the minimum of the calculated tokens and real token reserves
    // console.log("virtualSolReserves: ", virtualSolReserves);
    // console.log("virtualTokenReserves: ", virtualTokenReserves);
    // console.log("realTokenReserves: ", realTokenReserves);
    //console.log("s: ", s);
    const ret = s < realTokenReserves ? s : realTokenReserves;
    return ret;
    //console.log(ret);
}