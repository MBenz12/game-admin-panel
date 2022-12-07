import { Provider } from "@project-serum/anchor";
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from "@solana/spl-token-v2";
import { PublicKey } from "@solana/web3.js";

export const plinko_pda_seed = "plinko_game_pda";
export const JWT_TOKEN = "plinko-game";
export const JWT_EXPIRES_IN = 3600 * 24;
export const game_name = "test1";
export const game_owner = new PublicKey("3qWq2ehELrVJrTg2JKKERm67cN6vYjm1EyhCEzfQ6jMd");
export const default_backend = new PublicKey("SERVUJeqsyaJTuVuXAmmko6kTigJmxzTxUMSThpC2LZ");
export const splTokenMint = new PublicKey("SKTsW8KvzopQPdamXsPhvkPfwzTenegv3c3PEX4DT1o");


export const getGameAddress = async (programId: PublicKey, game_name: string, game_owner: PublicKey) => (
  await PublicKey.findProgramAddress(
    [
      Buffer.from(game_name),
      Buffer.from(plinko_pda_seed),
      game_owner.toBuffer(),
    ],
    programId
  )
);


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