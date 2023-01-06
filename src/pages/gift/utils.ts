import { BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import idl from "idl/gift.json";
export const programId = new PublicKey(idl.metadata.address);
export const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

export const getGiftAddress = async (nftMint: PublicKey) => {
    return await PublicKey.findProgramAddress([
        Buffer.from("gift"),
        nftMint.toBuffer()
    ], programId);
}

export const getMetadataAddress = async (nftMint: PublicKey) => {
    return await PublicKey.findProgramAddress([
        Buffer.from("metadata"), 
        TOKEN_METADATA_PROGRAM_ID.toBuffer(), 
        nftMint.toBuffer()
    ], TOKEN_METADATA_PROGRAM_ID);
}

export type NftData = {
    mint: PublicKey;
    name: string;
    symbol: string;
    uri: string;
    image: string;
    gift: GiftData;
};

export type GiftData = {
    creator: PublicKey;
    splTokenMint: PublicKey;
    destinationAddress: PublicKey;
    tokenAmount: BN;
    nftMint: PublicKey;
    redeemed: boolean;
    bump: number;
}