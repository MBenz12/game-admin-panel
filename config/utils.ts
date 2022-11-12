import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";

export const getNetworkFromConnection = (connection: Connection) : string =>
{
    // @ts-ignore
    return connection["_rpcEndpoint"].includes("dev") ? "devnet" : "mainnet"
}

export const getWalletPartiallyHidden = (walletAddress: PublicKey) =>
{
    const walletStr = walletAddress!.toString();
    const walletStart = walletStr.slice(0,4);
    const walletEnd = walletStr.slice(-4);
    return `${walletStart}...${walletEnd}`
}

export const getAssociatedTokenAddressAndTransaction = async (connection: Connection, splTokenAddress: PublicKey, sourceWallet: PublicKey, recipientWallet: PublicKey, allowOwnerOffCurve: boolean = false, payerWallet: PublicKey | undefined = undefined) =>
{
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
    if (receiverAccount === null)
    {
        console.log("--> Creating recipientATA:", recipientATA.toString());
        transaction.add(Token.createAssociatedTokenAccountInstruction(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, splTokenAddress, recipientATA, recipientWallet, payerWallet || sourceWallet));
    }

    return {transaction, sourceATA, recipientATA};
}