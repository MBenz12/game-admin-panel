import { Provider } from "@project-serum/anchor";
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from "@solana/spl-token-v2";
import { PublicKey } from "@solana/web3.js";

export const idl_coinflip = require("idl/coinflip.json");
export const coinflip_pda_seed = "coinflip_game_pda";
export const player_pda_seed = "player_pda";

export const game_name = "test4";
export const game_owner = new PublicKey("3qWq2ehELrVJrTg2JKKERm67cN6vYjm1EyhCEzfQ6jMd");
export const default_commission = new PublicKey("SERVUJeqsyaJTuVuXAmmko6kTigJmxzTxUMSThpC2LZ");
export const splTokenMint = new PublicKey("SKTsW8KvzopQPdamXsPhvkPfwzTenegv3c3PEX4DT1o");


export const getGameAddress = async (programId: PublicKey, game_name: string, game_owner: PublicKey) => (
  await PublicKey.findProgramAddress(
    [
      Buffer.from(game_name),
      Buffer.from(coinflip_pda_seed),
      game_owner.toBuffer(),
    ],
    programId
  )
);

export const getPlayerAddress = async (programId: PublicKey, playerKey: PublicKey, game: PublicKey) => (
  await PublicKey.findProgramAddress(
    [
      Buffer.from(player_pda_seed),
      playerKey.toBuffer(),
      game.toBuffer(),
    ],
    programId
  )
)

export const convertLog = (data: { [x: string]: { toString?: () => any; }; }, isAdmin: boolean = true) => {
  const res: { [x: string]: any } = {};
  Object.keys(data).forEach(key => {
    if (isAdmin || key !== "winPercents") {
      res[key] = data[key];
      if (typeof data[key] === "object") {
        // @ts-ignore
        if (data[key].toString) res[key] = data[key].toString();
      }
    }
  });
  return res;
}

export async function getAta(mint: PublicKey, owner: PublicKey, allowOffCurve: boolean = false) {
  return await getAssociatedTokenAddress(
    mint,
    owner,
    allowOffCurve
  );
}

export async function getCreateAtaInstruction(provider: Provider, ata: PublicKey, mint: PublicKey, owner: PublicKey) {
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