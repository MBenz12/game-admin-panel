import * as anchor from "@project-serum/anchor";
import { Program, Provider } from "@project-serum/anchor";
import { createAssociatedTokenAccountInstruction, createCloseAccountInstruction, createSyncNativeInstruction, getAssociatedTokenAddress, NATIVE_MINT, TOKEN_PROGRAM_ID } from "@solana/spl-token-v2";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, SYSVAR_INSTRUCTIONS_PUBKEY, Transaction } from "@solana/web3.js";
import axios from "axios";
import { getNetworkFromConnection, getWalletPartiallyHidden } from "config/utils";
import { Slots } from "idl/slots";
import { useEffect, useState } from "react";

export const idl_slots = require("idl/slots.json");
export const programId = new PublicKey(idl_slots.metadata.address);
export const slots_pda_seed = "slots_game_pda";
export const player_pda_seed = "player_pda";

export const game_name = "test4";
export const game_owner = new PublicKey("3qWq2ehELrVJrTg2JKKERm67cN6vYjm1EyhCEzfQ6jMd");
export const default_commission = new PublicKey("SERVUJeqsyaJTuVuXAmmko6kTigJmxzTxUMSThpC2LZ");
export const default_community = new PublicKey("7AqzmPxixBqbGh6RA49DA4kyKYBWT2UBNbBLhxC1XfCH");
export const splTokenMint = new PublicKey("SKTsW8KvzopQPdamXsPhvkPfwzTenegv3c3PEX4DT1o");

export const adminWallets = [
  "SERVUJeqsyaJTuVuXAmmko6kTigJmxzTxUMSThpC2LZ",
  "EF5qxGB1AirUH4ENw1niV1ewiNHzH2fWs7naQQYF2dc",
  "3qWq2ehELrVJrTg2JKKERm67cN6vYjm1EyhCEzfQ6jMd"
];

export const getGameAddress = async (game_name: string, game_owner: PublicKey) => (
  await PublicKey.findProgramAddress(
    [
      Buffer.from(game_name),
      Buffer.from(slots_pda_seed),
      game_owner.toBuffer(),
    ],
    programId
  )
);

export const getPlayerAddress = async (playerKey: PublicKey, game: PublicKey) => (
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

export const postWinLoseToDiscordAPI = async (userWallet: PublicKey, balance: number, bet: number, connection: Connection) =>
{
    const wonEmoji = `<a:tada2:921047402016821349>`;
    const catPartyEmoji = `<:joker_emoji_01:921352072052490271>`;

    let message = ``;

    balance = Number(balance.toFixed(3));
    if (balance > 0)
    {
      message += `A kitty just **Won** \`${balance}\` SOL ${wonEmoji} with a bet of \`${bet}\``;
    }
    else
    {
      message += `A kitty almost won \`${-balance}\` SOL, better luck next time ${catPartyEmoji}`;
    }

    message += `\n\n> Wallet: \`${getWalletPartiallyHidden(userWallet)}\` \n`;

    await postToDiscordApi(message, "1031495600937644066", getNetworkFromConnection(connection)); // slots
}

export const postWithdrawToDiscordAPI = async (userWallet: PublicKey | null, balance: number, connection: Connection, bankBalance: number, txSignature: string) =>
{
    let message = `\`${userWallet!.toString()}\``;
    message += `\n> Is asking to withdraw \`${balance}\` SOL`;
    message += `\n> Bank Balance \`${bankBalance}\` SOL`;

    const sigLink = `[${txSignature}](https://solscan.io/tx/${txSignature})`;
    message += `\n> Tx Signature: ${sigLink}`;

    await postToDiscordApi(message, `1038111261168238652`, getNetworkFromConnection(connection)); // slots-admin
}

export const postToDiscordApi = async (message: string, channelId: string, network: string) =>
{
    return await axios.post("https://api.servica.io/extorio/apis/general",
      {
        method: "postDiscordSK",
        params:
            {
              token: "tok41462952672239",
              channelId: channelId,
              message: message,
              network: network
            },
      });
}

export const isAdmin = (pubkey: PublicKey) => {
  return adminWallets.includes(pubkey.toString())
}

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height,
  };
}

export function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(
    getWindowDimensions()
  );

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowDimensions;
}

const programID = idl_slots.metadata.address;

export function getProviderAndProgram(connection: Connection, anchorWallet: anchor.Wallet) {
  const provider = new Provider(
    connection,
    anchorWallet,
    Provider.defaultOptions()
  );

  const program = new Program(
    idl_slots,
    programID,
    provider
  ) as Program<Slots>;

  return { provider, program };
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

async function getAddPlayerTransaction(program: Program<Slots>, provider: Provider, game_name: string, game_owner: PublicKey) {
  const [game] = await getGameAddress(game_name, game_owner);

  const [player, bump] = await getPlayerAddress(
    provider.wallet.publicKey,
    game
  );

  console.log(player.toString());
  console.log(game.toString());
  return program.transaction.addPlayer(bump, {
    accounts: {
      payer: provider.wallet.publicKey,
      player,
      game,
      systemProgram: SystemProgram.programId,
    },
  });
}
const prices = [0.05, 0.1, 0.25, 0.5, 1, 2];
export async function playTransaction(program: Program<Slots>, provider: Provider, wallet: WalletContextState, game_name: string, game_owner: PublicKey, betNo: number) {
  const [game] = await getGameAddress(game_name, game_owner);
  const [player] = await getPlayerAddress(provider.wallet.publicKey, game);

  const transaction = new Transaction();
  const playerAccount = await program.provider.connection.getAccountInfo(
    player
  );
  if (!playerAccount) {
    transaction.add(await getAddPlayerTransaction(program, provider, game_name, game_owner));
  }

  let gameData = await program.account.game.fetchNullable(game);
  if (!gameData) return;

  const mint = gameData.tokenMint;
  const payerAta = await getAta(mint, provider.wallet.publicKey);
  
  const instruction = await getCreateAtaInstruction(provider, payerAta, mint, provider.wallet.publicKey);
  if (instruction) transaction.add(instruction);
  if (mint.toString() === NATIVE_MINT.toString()) {
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: payerAta,
        lamports: prices[betNo] * LAMPORTS_PER_SOL
      }),
      createSyncNativeInstruction(payerAta)
    )
  }
  const gameTreasuryAta = await getAta(mint, game, true);
  const commissionTreasury = gameData.commissionWallet;
  const commissionTreasuryAta = await getAta(mint, commissionTreasury);
  transaction.add(
    program.transaction.play(betNo, {
      accounts: {
        payer: provider.wallet.publicKey,
        payerAta,
        player,
        game,
        gameTreasuryAta,
        commissionTreasuryAta,
        instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    })
  );
  for (const communityWallet of gameData.communityWallets) {
    const communityTreasuryAta = await getAta(mint, communityWallet);
    transaction.add(
      program.transaction.sendToCommunityWallet({
        accounts: {
          game,
          gameTreasuryAta,
          communityTreasuryAta,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      })
    );
  }
  const txSignature = await wallet.sendTransaction(
    transaction,
    provider.connection
  );
  let playerData = await program.account.player.fetchNullable(player);
  console.log(playerData);
  await provider.connection.confirmTransaction(txSignature, "confirmed");
  console.log(txSignature);
  playerData = await program.account.player.fetchNullable(player);
  console.log(playerData);
  gameData = await program.account.game.fetchNullable(game);
  return { gameData, playerData };
}

export async function withdrawTransaction(program: Program<Slots>, provider: Provider, wallet: WalletContextState, game_name: string, game_owner: PublicKey)
{
    const [game] = await getGameAddress(game_name, game_owner);
    const [player] = await getPlayerAddress(provider.wallet.publicKey, game);

    const gameData = await program.account.game.fetchNullable(game);
    if (!gameData) return;
    
    const mint = gameData?.tokenMint;
    const transaction = new Transaction();

    const claimerAta = await getAta(mint, provider.wallet.publicKey);
    
    const instruction = await getCreateAtaInstruction(provider, claimerAta, mint, provider.wallet.publicKey);
    if (instruction) transaction.add(instruction);
    

    const gameTreasuryAta = await getAta(mint, game, true);

    transaction.add(
        program.transaction.claim({
            accounts: {
                claimer: provider.wallet.publicKey,
                claimerAta,
                game,
                gameTreasuryAta,
                player,
                instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
                tokenProgram: TOKEN_PROGRAM_ID,
            },
        })
    );
    if (mint.toString() === NATIVE_MINT.toString()) {
      transaction.add(
        createCloseAccountInstruction(
          claimerAta,
          provider.wallet.publicKey,
          provider.wallet.publicKey,
        )
      );
    }

    const txSignature = await wallet.sendTransaction(transaction, provider.connection);

    await provider.connection.confirmTransaction(txSignature, "confirmed");
    console.log(txSignature);

    return txSignature;
}