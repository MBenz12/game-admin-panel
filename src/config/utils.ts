import { Metaplex } from "@metaplex-foundation/js";
import * as anchor from '@project-serum/anchor';
import { AnchorProvider } from "@project-serum/anchor";
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, getMint } from "@solana/spl-token-v2";
import { Connection, LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js";
import { adminWallets } from "./constants";

export const getNetworkFromConnection = (connection: Connection): string => {
    // @ts-ignore
    return connection["_rpcEndpoint"].includes("dev") ? "devnet" : "mainnet"
}

export const getWalletPartiallyHidden = (walletAddress: PublicKey) => {
    const walletStr = walletAddress!.toString();
    const walletStart = walletStr.slice(0, 4);
    const walletEnd = walletStr.slice(-4);
    return `${walletStart}...${walletEnd}`
}

export const getAssociatedTokenAddressAndTransaction = async (connection: Connection, splTokenAddress: PublicKey, sourceWallet: PublicKey, recipientWallet: PublicKey, allowOwnerOffCurve: boolean = false, payerWallet: PublicKey | undefined = undefined) => {
    let transaction = new Transaction();

    const sourceATA = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, splTokenAddress, sourceWallet, allowOwnerOffCurve);
    let recipientATA = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, splTokenAddress, recipientWallet, allowOwnerOffCurve);

    // Make sure receiver has a token account active
    const senderAccount = await connection.getAccountInfo(sourceATA);
    if (senderAccount === null) {
        console.log("--> Creating sourceATA:", sourceATA.toString());
        transaction.add(Token.createAssociatedTokenAccountInstruction(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, splTokenAddress, sourceATA, sourceWallet, payerWallet || sourceWallet));
    }

    // Make sure receiver has a token account active
    const receiverAccount = await connection.getAccountInfo(recipientATA);
    if (receiverAccount === null) {
        console.log("--> Creating recipientATA:", recipientATA.toString());
        transaction.add(Token.createAssociatedTokenAccountInstruction(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, splTokenAddress, recipientATA, recipientWallet, payerWallet || sourceWallet));
    }

    return { transaction, sourceATA, recipientATA };
}

export const getNftMetaData = async (mintAddress: PublicKey, connection: Connection) => {
    return await Metaplex.make(connection).nfts().findByMint({ mintAddress }).run();
}


export interface raffleTransactionDataType {
    connection: Connection,
    wallet: anchor.Wallet,
    raffleAddress: PublicKey,
    raffleTicketPrice: number,
    raffleBank: PublicKey,
    ticketAmount: number,
    currencyType: string,
    splTokenPublicKey: PublicKey,
}

export interface vaultTrancationDataType {
    connection: Connection,
    wallet: anchor.Wallet,
    sktMint: PublicKey,
    claimerAta: PublicKey,
    vault: PublicKey,
    vaultPool: PublicKey,
    vaultPoolAta: PublicKey,
    transactionPrice: number,
    isHolder: boolean,
    exchangeOption: number,
    kittyCoinsGrantAmount: number
}

export enum eInstructionsType {
    buyKittyCoins = "buyKittyCoins",
    buyRaffleTicket = "buyRaffleTicket"
}

export const isAdmin = (pubkey: PublicKey) => {
    return adminWallets.includes(pubkey.toString())
}

export const getSolBalance = async (solConnection: Connection, wallet: PublicKey) => {
    return await getSolBalanceUnWrapped(solConnection, wallet) + await getSolBalanceWrapped(solConnection, wallet);
};

export const getSolBalanceUnWrapped = async (solConnection: Connection, wallet: PublicKey) => {
    try {
        const balance = await solConnection.getBalance(wallet);
        return balance / LAMPORTS_PER_SOL;
    }
    catch (error) {
        console.log(error);
        return 0;
    }
};

export const getSolBalanceWrapped = async (solConnection: Connection, wallet: PublicKey) => {
    try {
        const res = await solConnection.getTokenAccountsByOwner(
            wallet, // owner here
            {
                mint: new PublicKey("So11111111111111111111111111111111111111112"),
            }
        );

        return res.value && res.value[0].account.lamports / LAMPORTS_PER_SOL;
    }
    catch (error) {
        console.log(error);
        return 0;
    }
}

export async function getAta(mint: PublicKey, owner: PublicKey, allowOffCurve: boolean = false) {
    return await getAssociatedTokenAddress(
        mint,
        owner,
        allowOffCurve
    );
}

export async function getCreateAtaInstruction(provider: AnchorProvider, ata: PublicKey, mint: PublicKey, owner: PublicKey) {
    let account = await provider.connection.getAccountInfo(ata);
    if (!account) {
        return createAssociatedTokenAccountInstruction(
            provider.wallet.publicKey,
            ata,
            owner,
            mint,
        );
    }
}

export async function getDecimals(provider: AnchorProvider, mint: PublicKey) {
    const mintAccount = await getMint(provider.connection, mint);
    const decimals = Math.pow(10, mintAccount.decimals);
    return decimals;
}