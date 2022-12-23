import { AnchorProvider, BN } from "@project-serum/anchor";
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from "@solana/spl-token-v2";
import { PublicKey } from "@solana/web3.js";

export const auction_pda_seed = "auction";

export const auction_name = "test1";
export const auction_creator = new PublicKey("3qWq2ehELrVJrTg2JKKERm67cN6vYjm1EyhCEzfQ6jMd");


export const getAuctionAddress = async (programId: PublicKey, auction_name: string, auction_creator: PublicKey) => (
  await PublicKey.findProgramAddress(
    [
      Buffer.from(auction_pda_seed),
      Buffer.from(auction_name),
      auction_creator.toBuffer(),
    ],
    programId
  )
);


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

export type AuctionData = {
  key: PublicKey,
  name: string,
  creator: PublicKey,
  minBidPrice: BN,
  auctionStartedTime: BN,
  auctionFinishTime: BN,
  nftMint: PublicKey,
  splTokenMint: PublicKey,
  lastBidder: PublicKey,
  bidPrice: number,
  transferedToWinner: boolean,
}
