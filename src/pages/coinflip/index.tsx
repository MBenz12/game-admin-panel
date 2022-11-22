/* eslint-disable react-hooks/exhaustive-deps */
import * as anchor from "@project-serum/anchor";
import { Program, Provider } from "@project-serum/anchor";
import { createCloseAccountInstruction, createSyncNativeInstruction, NATIVE_MINT, TOKEN_PROGRAM_ID } from "@solana/spl-token-v2";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, SYSVAR_INSTRUCTIONS_PUBKEY, Transaction } from "@solana/web3.js";
import Header from "components/Header";
import StorageSelect from "components/SotrageSelect";
import { eCurrencyType, RPC_DEVNET, RPC_MAINNET, SPLTOKENS_MAP } from "config/constants";
import { isAdmin } from "config/utils";
import { Coinflip } from "idl/coinflip";
import { useEffect, useMemo, useState } from "react";
import { convertLog, default_commission, game_name, getAta, getCreateAtaInstruction, getGameAddress, getPlayerAddress } from "./utils";

const idl_coinflip = require("idl/coinflip.json");
const deafultProgramIDs = [idl_coinflip.metadata.address];
const deafultGamenames = [game_name];

export default function CoinflipPage() {
  const [network, setNetwork] = useState(WalletAdapterNetwork.Devnet);
  const connection = useMemo(() => new Connection(network === "mainnet-beta" ? RPC_MAINNET : RPC_DEVNET, "confirmed"), [network]);
  const [programID, setProgramID] = useState(idl_coinflip.metadata.address);
  useEffect(() =>
  {
    const network = localStorage.getItem("network");
    if (network)
    {
      setNetwork(network as WalletAdapterNetwork);
    }
  }, []);
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet() as anchor.Wallet;
  function getProviderAndProgram() {
    const provider = new Provider(connection, anchorWallet, Provider.defaultOptions());

    const program = new Program(idl_coinflip, programID, provider) as Program<Coinflip>;

    return { provider, program };
  }

  const [prices] = useState([0.05, 0.1, 0.25, 0.5, 1, 2]);
  const [price, setPrice] = useState(0.05);
  const [betNo, setBetNo] = useState(0);
  const [betNumber, setBetNumber] = useState(0);
  const [gameData, setGameData] = useState<any>();
  const [playerData, setPlayerData] = useState<any>();
  const [playerBalance, setPlayerBalance] = useState(0);
  const [gameBalance, setGameBalance] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [fundAmount, setFundAmount] = useState(0);
  const [tokenType, setTokenType] = useState(false);
  const [newTokenType, setNewTokenType] = useState(false);
  const [commissionWallet, setCommissionWallet] = useState(default_commission.toString());
  const [commissionFee, setCommissionFee] = useState(3);
  const [winPercents, setWinPercents] = useState([47.5, 47.5, 40, 40, 25, 16.7]);

  const sktMint = new PublicKey(SPLTOKENS_MAP.get(eCurrencyType.SKT)!);
  // const dustMint = new PublicKey(SPLTOKENS_MAP.get(eCurrencyType.DUST)!);
  // const usdcMint = new PublicKey(SPLTOKENS_MAP.get(eCurrencyType.USDC)!);
  const splTokenMint = sktMint;

  const [gamename, setGamename] = useState(game_name);

  async function initGame() {
    const { provider, program } = getProviderAndProgram();
    const [game, game_bump] = await getGameAddress(program.programId, gamename, provider.wallet.publicKey);
    const mint = newTokenType ? splTokenMint : NATIVE_MINT;
    const transaction = new Transaction();

    console.log("Init Game:");
    console.log("ProgramId:", program.programId.toString());
    console.log("Mint Address:", mint.toString());

    const gameTreasuryAta = await getAta(mint, game, true);

    let instruction = await getCreateAtaInstruction(provider, gameTreasuryAta, mint, game);
    if (instruction) transaction.add(instruction);

    const commissionTreasury = new PublicKey(commissionWallet);
    const commissionTreasuryAta = await getAta(mint, commissionTreasury);
    instruction = await getCreateAtaInstruction(provider, commissionTreasuryAta, mint, commissionTreasury);
    if (instruction) transaction.add(instruction);

    transaction.add(
      program.transaction.createGame(gamename, game_bump, mint, {
        accounts: {
          payer: provider.wallet.publicKey,
          game,
          systemProgram: SystemProgram.programId,
        },
      })
    );
    const txSignature = await wallet.sendTransaction(transaction, provider.connection);
    await provider.connection.confirmTransaction(txSignature, "finalized");
    console.log(txSignature);
    fetchData();
  }

  async function addPlayer() {
    const { provider, program } = getProviderAndProgram();
    const [game] = await getGameAddress(program.programId, gamename, provider.wallet.publicKey);
    const [player, bump] = await getPlayerAddress(program.programId, provider.wallet.publicKey, game);

    const transaction = new Transaction();

    transaction.add(
      program.transaction.addPlayer(bump, {
        accounts: {
          payer: provider.wallet.publicKey,
          player,
          game,
          systemProgram: SystemProgram.programId,
        },
      })
    );
    const txSignature = await wallet.sendTransaction(transaction, provider.connection);
    await provider.connection.confirmTransaction(txSignature, "confirmed");
    console.log(txSignature);
    fetchData();
  }

  async function play() {
    const { provider, program } = getProviderAndProgram();
    const [game] = await getGameAddress(program.programId, gamename, provider.wallet.publicKey);
    const [player] = await getPlayerAddress(program.programId, provider.wallet.publicKey, game);

    const transaction = new Transaction();
    const gameData = await program.account.game.fetchNullable(game);
    if (!gameData) return;
    const mint = gameData.tokenMint;

    const payerAta = await getAta(mint, provider.wallet.publicKey);
    let instruction = await getCreateAtaInstruction(provider, payerAta, mint, provider.wallet.publicKey);
    if (instruction) transaction.add(instruction);
    if (mint.toString() === NATIVE_MINT.toString()) {
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: provider.wallet.publicKey,
          toPubkey: payerAta,
          lamports: prices[betNo] * LAMPORTS_PER_SOL,
        }),
        createSyncNativeInstruction(payerAta)
      );
    }
    const gameTreasuryAta = await getAta(mint, game, true);
    const commissionTreasury = gameData.royaltyWallet;
    const commissionTreasuryAta = await getAta(mint, commissionTreasury);
    instruction = await getCreateAtaInstruction(provider, commissionTreasuryAta, mint, commissionTreasury);
    if (instruction) transaction.add(instruction);
    transaction.add(
      program.transaction.play(betNo, betNumber, {
        accounts: {
          payer: provider.wallet.publicKey,
          payerAta,
          player,
          game,
          gameTreasuryAta,
          royaltyTreasuryAta: commissionTreasuryAta,
          instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      })
    );

    const txSignature = await wallet.sendTransaction(transaction, provider.connection, { skipPreflight: true });
    await provider.connection.confirmTransaction(txSignature, "confirmed");
    console.log(txSignature);

    const playerData = await program.account.player.fetchNullable(player);
    let status = playerData?.rand;
    console.log(status);
    if (status) {
      await fetchData();
    }
  }

  async function fetchData() {
    const { provider, program } = getProviderAndProgram();
    if (!provider.wallet) return;

    console.log("Network: ", network);
    console.log("Program ID: ", program.programId.toString());

    const [game] = await getGameAddress(program.programId, gamename, provider.wallet.publicKey);
    const [player] = await getPlayerAddress(program.programId, provider.wallet.publicKey, game);
    const playerData = await program.account.player.fetchNullable(player);
    const gameData = await program.account.game.fetchNullable(game);
    setPlayerData(playerData);
    setGameData(gameData);
    // @ts-ignore
    if (gameData) console.log("Game Data:", convertLog(gameData));
    // @ts-ignore
    if (playerData) console.log("Player Data", convertLog(playerData));
    if (playerData?.earnedMoney) {
      setPlayerBalance(playerData?.earnedMoney.toNumber());
    }
    if (gameData) {
      setTokenType(gameData.tokenMint.toString() !== NATIVE_MINT.toString());
      setNewTokenType(gameData.tokenMint.toString() !== NATIVE_MINT.toString());
      setGameBalance(gameData.mainBalance.toNumber());
      setCommissionFee(gameData.royaltyFee / 100);
      // @ts-ignore
      setWinPercents(gameData.winPercents.map((percent) => percent / 200));
    }
  }

  async function claim() {
    const { provider, program } = getProviderAndProgram();
    const [game] = await getGameAddress(program.programId, gamename, provider.wallet.publicKey);
    const [player] = await getPlayerAddress(program.programId, provider.wallet.publicKey, game);
    const mint = gameData.tokenMint;

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
      transaction.add(createCloseAccountInstruction(claimerAta, provider.wallet.publicKey, provider.wallet.publicKey));
    }
    const txSignature = await wallet.sendTransaction(transaction, provider.connection);
    await provider.connection.confirmTransaction(txSignature, "confirmed");
    console.log(txSignature);
    fetchData();
  }

  async function withdraw() {
    const { provider, program } = getProviderAndProgram();
    const [game] = await getGameAddress(program.programId, gamename, provider.wallet.publicKey);

    const transaction = new Transaction();
    const mint = gameData.tokenMint;
    const claimerAta = await getAta(mint, provider.wallet.publicKey);
    const instruction = await getCreateAtaInstruction(provider, claimerAta, mint, provider.wallet.publicKey);
    if (instruction) transaction.add(instruction);
    const gameTreasuryAta = await getAta(mint, game, true);
    transaction.add(
      program.transaction.withdraw(new anchor.BN(LAMPORTS_PER_SOL * withdrawAmount), {
        accounts: {
          claimer: provider.wallet.publicKey,
          claimerAta,
          game,
          gameTreasuryAta,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      })
    );
    const txSignature = await wallet.sendTransaction(transaction, provider.connection);
    await provider.connection.confirmTransaction(txSignature, "confirmed");
    console.log(txSignature);
    fetchData();
  }

  async function updateCommission() {
    const { provider, program } = getProviderAndProgram();
    const [game] = await getGameAddress(program.programId, gamename, provider.wallet.publicKey);
    const transaction = new Transaction();

    const mint = gameData.tokenMint;

    const commissionTreasury = new PublicKey(commissionWallet);
    if ((await program.provider.connection.getBalance(commissionTreasury)) === 0) {
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: program.provider.wallet.publicKey,
          toPubkey: commissionTreasury,
          lamports: await program.provider.connection.getMinimumBalanceForRentExemption(0),
          programId: SystemProgram.programId,
        })
      );
    }
    const commissionTreasuryAta = await getAta(mint, commissionTreasury);

    const instruction = await getCreateAtaInstruction(provider, commissionTreasuryAta, mint, commissionTreasury);
    if (instruction) transaction.add(instruction);

    transaction.add(
      program.transaction.setRoyalty(new PublicKey(commissionWallet), commissionFee * 100, {
        accounts: {
          payer: provider.wallet.publicKey,
          game,
        },
      })
    );
    const txSignature = await wallet.sendTransaction(transaction, provider.connection);
    await provider.connection.confirmTransaction(txSignature, "confirmed");
    console.log(txSignature);
    fetchData();
  }

  async function setWinning() {
    const { provider, program } = getProviderAndProgram();
    const [game] = await getGameAddress(program.programId, gamename, provider.wallet.publicKey);
    const transaction = new Transaction();
    transaction.add(
      program.transaction.setWinning(
        winPercents.map((percent) => percent * 200),
        {
          accounts: {
            payer: provider.wallet.publicKey,
            game,
          },
        }
      )
    );
    const txSignature = await wallet.sendTransaction(transaction, provider.connection);
    await provider.connection.confirmTransaction(txSignature, "confirmed");
    console.log(txSignature);
    fetchData();
  }

  async function fund() {
    const { provider, program } = getProviderAndProgram();
    const [game] = await getGameAddress(program.programId, gamename, provider.wallet.publicKey);
    const transaction = new Transaction();
    const mint = gameData.tokenMint;

    const funderAta = await getAta(mint, provider.wallet.publicKey);
    const gameTreasuryAta = await getAta(mint, game, true);
    let instruction = await getCreateAtaInstruction(provider, funderAta, mint, provider.wallet.publicKey);
    if (instruction) transaction.add(instruction);
    if (mint.toString() === NATIVE_MINT.toString()) {
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: provider.wallet.publicKey,
          toPubkey: funderAta,
          lamports: fundAmount * LAMPORTS_PER_SOL,
        }),
        createSyncNativeInstruction(funderAta)
      );
    }
    transaction.add(
      program.transaction.fund(new anchor.BN(LAMPORTS_PER_SOL * fundAmount), {
        accounts: {
          payer: provider.wallet.publicKey,
          payerAta: funderAta,
          game,
          gameTreasuryAta,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      })
    );

    const txSignature = await wallet.sendTransaction(transaction, provider.connection);
    await provider.connection.confirmTransaction(txSignature, "confirmed");
    console.log(txSignature);
    fetchData();
  }
  useEffect(() => {
    fetchData();
  }, [wallet.connected, gamename, network, programID]);

  if (!wallet.connected || (wallet.publicKey && !isAdmin(wallet.publicKey))) {
    /* If the user's wallet is not connected, display connect wallet button. */
    return (
      <div className="relative">
        <Header />
        <div className="absolute right-5 top-2">
          <WalletMultiButton />
        </div>
      </div>
    );
  }
  return (
    <div className="text-black flex gap-2 flex-col relative">
      <Header />
      <div className="absolute right-5 top-2">
        <WalletMultiButton />
      </div>
      <div className="absolute left-5 top-4 text-white">
        NETWORK:
        <select
          className="border-2 border-black p-2"
          onChange={(e) => {
            setNetwork(e.target.value as WalletAdapterNetwork);
            localStorage.setItem("network", e.target.value);
          }}
          value={network}
        >
          <option value={WalletAdapterNetwork.Mainnet}>Mainnet</option>
          <option value={WalletAdapterNetwork.Devnet}>Devnet</option>
        </select>
      </div>
      <div className="ml-5 flex gap-2 flex-col ">
        <StorageSelect itemkey="coinflip-programId" label="Program ID" setItem={setProgramID} defaultItems={deafultProgramIDs} defaultItem={programID} />
        <StorageSelect itemkey="coinflip-gamename" label="Game Name" setItem={setGamename} defaultItems={deafultGamenames} defaultItem={gamename} />
        <div>
          <input type="radio" id="sol" name="token_type" checked={newTokenType === false} onChange={() => setNewTokenType(false)} />
          <label htmlFor="sol">SOL</label>
          <br />
          <input type="radio" id="skt" name="token_type" checked={newTokenType === true} onChange={() => setNewTokenType(true)} />
          <label htmlFor="skt">$SKT</label>
          <br />
        </div>
        <div className="flex gap-2 items-center">
          <div>
            Commission Wallet:{" "}
            <input
              className="w-[450px] border-2 border-black p-2"
              onChange={(e) => {
                setCommissionWallet(e.target.value);
              }}
              value={commissionWallet}
            />
          </div>
          <div>
            Commission Fee:{" "}
            <input
              className="border-2 border-black p-2"
              type={"number"}
              min={0}
              max={100}
              step={0.01}
              onChange={(e) => {
                setCommissionFee(parseFloat(e.target.value || "0"));
              }}
              value={`${commissionFee}`}
            />
            %
          </div>
          {!!gameData && (
            <>
              <button className="border-2 border-black p-2" onClick={updateCommission}>
                Update Commission
              </button>
            </>
          )}
        </div>
        {!!gameData && (
          <>
            {winPercents.map((percent, row) => (
              <div className="flex gap-2 items-center" key={"row" + row}>
                <div className="w-[150px]">
                  Bet {prices[row]} {tokenType ? "$SKT" : "SOL"}:
                </div>

                <div>
                  <input
                    className="border-2 border-black p-2"
                    type={"number"}
                    min={0}
                    max={100}
                    step={0.01}
                    onChange={(e) => {
                      const percents = [...winPercents];
                      percents[row] = parseFloat(e.target.value || "0");
                      setWinPercents(percents);
                    }}
                    value={`${percent}`}
                  />
                  %
                </div>
              </div>
            ))}
            <div>
              <button className="border-2 border-black p-2" onClick={setWinning}>
                Set Winning
              </button>
            </div>
          </>
        )}
        <div className="flex gap-2">
          {!gameData && (
            <button className="border-2 border-black p-2" onClick={initGame}>
              Init Game
            </button>
          )}
          {!!gameData && !playerData && (
            <button className="border-2 border-black p-2" onClick={addPlayer}>
              Add Player
            </button>
          )}
          {!!playerData && (
            <>
              <select
                className="border-2 border-black p-2"
                value={price}
                onChange={(e) => {
                  let index = parseFloat(e.target.value);
                  setBetNo(index);
                  setPrice(prices[index]);
                }}
              >
                {prices.map((value, index) => (
                  <option value={index} key={value}>
                    {value}
                  </option>
                ))}
              </select>

              <select
                className="border-2 border-black p-2"
                value={betNumber}
                onChange={(e) => {
                  setBetNumber(parseInt(e.target.value));
                }}
              >
                <option value={0}>Head</option>
                <option value={1}>Tail</option>
              </select>

              <button className="border-2 border-black p-2" onClick={play}>
                Play
              </button>

              <button className="border-2 border-black p-2" onClick={claim}>
                Withdraw Player Balance
              </button>
            </>
          )}
        </div>
        {!!gameData && (
          <div className="flex gap-2">
            <div className="flex gap-1 items-center">
              Fund Amount:
              <input
                className="border-2 border-black p-2"
                type={"number"}
                min={0}
                step={0.01}
                onChange={(e) => {
                  setFundAmount(parseFloat(e.target.value || "0"));
                }}
                value={`${fundAmount}`}
              />
              {tokenType ? "$SKT" : "SOL"}
            </div>
            <button className="border-2 border-black p-2" onClick={fund}>
              Fund
            </button>
          </div>
        )}
        {!!gameData && (
          <div className="flex gap-2">
            <div className="flex gap-1 items-center">
              Withdraw Amount:
              <input
                className="border-2 border-black p-2"
                type={"number"}
                min={0}
                step={0.01}
                onChange={(e) => {
                  setWithdrawAmount(parseFloat(e.target.value || "0"));
                }}
                value={`${withdrawAmount}`}
              />
              {tokenType ? "$SKT" : "SOL"}
            </div>
            <button className="border-2 border-black p-2" onClick={withdraw}>
              Withdraw Main Balance
            </button>
          </div>
        )}
        {!!playerData && (
          <div>
            Player Balance: {playerBalance / LAMPORTS_PER_SOL} {tokenType ? "$SKT" : "SOL"}
          </div>
        )}
        {!!gameData && (
          <div>
            Main Balance: {gameBalance / LAMPORTS_PER_SOL} {tokenType ? "$SKT" : "SOL"}
          </div>
        )}
      </div>
    </div>
  );
}
