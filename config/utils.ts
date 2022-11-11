import { Connection, PublicKey } from "@solana/web3.js";

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
