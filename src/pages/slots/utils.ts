import { PublicKey } from "@solana/web3.js";

export const idl_slots = require("idl/slots.json");
export const slots_pda_seed = "slots_game_pda";
export const player_pda_seed = "player_pda";

export const game_name = "test6";
export const game_owner = new PublicKey("3qWq2ehELrVJrTg2JKKERm67cN6vYjm1EyhCEzfQ6jMd");
export const default_commission = new PublicKey("SERVUJeqsyaJTuVuXAmmko6kTigJmxzTxUMSThpC2LZ");
export const default_community = new PublicKey("7AqzmPxixBqbGh6RA49DA4kyKYBWT2UBNbBLhxC1XfCH");
export const splTokenMint = new PublicKey("SKTsW8KvzopQPdamXsPhvkPfwzTenegv3c3PEX4DT1o");

export const default_prices = [
  [ 0.05, 0.1, 0.25, 0.5, 1, 2],
  [ 1, 2, 5, 10, 25, 50]
];

export const getGameAddress = async (programId: PublicKey, game_name: string, game_owner: PublicKey) => (
  await PublicKey.findProgramAddress(
    [
      Buffer.from(game_name),
      Buffer.from(slots_pda_seed),
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

