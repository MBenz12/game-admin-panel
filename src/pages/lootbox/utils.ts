import { BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import idl from "idl/lootbox.json";
export const programId = new PublicKey(idl.metadata.address);

export const getLootboxAddress = async (name: string, authority: PublicKey,) => {
    return await PublicKey.findProgramAddress([
        Buffer.from("lootbox"),
        Buffer.from(name),
        authority.toBuffer()
    ], programId);
}

export const getPlayerAddress = async (key: PublicKey) => {
    return await PublicKey.findProgramAddress([
        Buffer.from("player"),
        key.toBuffer()
    ], programId);
}

export type Balance = {
    tokenMint: PublicKey;
    amount: BN;
};

export type LootboxData = {
    authority: PublicKey;
    name: string;
    imageUrl: string;
    price: BN;
    winPercent: number;
    balance: Balance;
};

export type PlayerData = {
    key: PublicKey;
    balances: Balance[];
};


