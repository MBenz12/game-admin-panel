import { BN } from "@project-serum/anchor";
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
