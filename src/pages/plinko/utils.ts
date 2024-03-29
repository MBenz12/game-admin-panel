import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import { Keypair, PublicKey } from "@solana/web3.js";

export const plinko_pda_seed = "plinko_game_pda";
export const JWT_TOKEN = "plinko-game";
export const JWT_EXPIRES_IN = 3600 * 24;
export const game_name = "test1";
export const game_owner = new PublicKey("3qWq2ehELrVJrTg2JKKERm67cN6vYjm1EyhCEzfQ6jMd");
export const default_backend = new PublicKey("3Y1aeNnXcepyyptH5hcSXDQ97WrMGNfXjRYN6qs1kMA6");
export const splTokenMint = new PublicKey("SKTsW8KvzopQPdamXsPhvkPfwzTenegv3c3PEX4DT1o");
export const siteUrl = "http://localhost:5001";
export const nonceAccountAuth = Keypair.fromSecretKey(bs58.decode("4QexB3reKGvf8tpENZLktDVhdujC3XoSvT88mxfrXre94XKcndhoVSjMgD8zSQ6z1FPZbPhK6uvRdqUhzbWdM8dV"));

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
