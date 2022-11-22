/* eslint-disable react-hooks/exhaustive-deps */
import * as anchor from "@project-serum/anchor";
import { Program, Provider } from "@project-serum/anchor";
import { createSyncNativeInstruction, NATIVE_MINT, TOKEN_PROGRAM_ID } from "@solana/spl-token-v2";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import Header from "components/Header";
import StorageSelect from "components/SotrageSelect";
import { eCurrencyType, RPC_DEVNET, RPC_MAINNET, SPLTOKENS_MAP } from "config/constants";
import { isAdmin } from "config/utils";
import { Plinko } from "idl/plinko";
import { useEffect, useMemo, useState } from "react";
import { convertLog, default_backend, game_name, getAta, getCreateAtaInstruction, getGameAddress } from "./utils";

const idl_plinko = require("idl/plinko.json");
const deafultProgramIDs = [idl_plinko.metadata.address];
const deafultGamenames = [game_name];

export default function PlinkoPage() {
  const [network, setNetwork] = useState(WalletAdapterNetwork.Devnet);
  const connection = useMemo(() => new Connection(network === "mainnet-beta" ? RPC_MAINNET : RPC_DEVNET, "confirmed"), [network]);
  const [programID, setProgramID] = useState(idl_plinko.metadata.address);
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

    const program = new Program(idl_plinko, programID, provider) as Program<Plinko>;

    return { provider, program };
  }

  const [gameData, setGameData] = useState<any>();
  const [gameBalance, setGameBalance] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [fundAmount, setFundAmount] = useState(0);
  const [tokenType, setTokenType] = useState(false);
  const [newTokenType, setNewTokenType] = useState(false);
  const [backendWallet, setBackendWallet] = useState(default_backend.toString());

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


    transaction.add(
      program.transaction.createGame(gamename, game_bump, mint, new PublicKey(backendWallet), {
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

  async function fetchData() {
    const { provider, program } = getProviderAndProgram();
    if (!provider.wallet) return;

    console.log("Network: ", network);
    console.log("Program ID: ", program.programId.toString());

    const [game] = await getGameAddress(program.programId, gamename, provider.wallet.publicKey);
    const gameData = await program.account.game.fetchNullable(game);
    setGameData(gameData);
    // @ts-ignore
    if (gameData) console.log("Game Data:", convertLog(gameData));
    // @ts-ignore

    if (gameData) {
      setTokenType(gameData.tokenMint.toString() !== NATIVE_MINT.toString());
      setNewTokenType(gameData.tokenMint.toString() !== NATIVE_MINT.toString());
      setGameBalance(gameData.mainBalance.toNumber());
      setBackendWallet(gameData.backendWallet.toString());
    }
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

  async function updateBackendWallet() {
    const { provider, program } = getProviderAndProgram();
    const [game] = await getGameAddress(program.programId, gamename, provider.wallet.publicKey);
    const transaction = new Transaction();

    transaction.add(
      program.transaction.setBackendWallet(new PublicKey(backendWallet), {
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
        <StorageSelect itemkey="Plinko-programId" label="Program ID" setItem={setProgramID} defaultItems={deafultProgramIDs} defaultItem={programID} />
        <StorageSelect itemkey="Plinko-gamename" label="Game Name" setItem={setGamename} defaultItems={deafultGamenames} defaultItem={gamename} />
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
            Backend Wallet:{" "}
            <input
              className="w-[450px] border-2 border-black p-2"
              onChange={(e) => {
                setBackendWallet(e.target.value);
              }}
              value={backendWallet}
            />
          </div>          
          {!!gameData && (
            <>
              <button className="border-2 border-black p-2" onClick={updateBackendWallet}>
                Update Backend Wallet
              </button>
            </>
          )}
        </div>
        <div className="flex gap-2">
          {!gameData && (
            <button className="border-2 border-black p-2" onClick={initGame}>
              Init Game
            </button>
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
        {!!gameData && (
          <div>
            Main Balance: {gameBalance / LAMPORTS_PER_SOL} {tokenType ? "$SKT" : "SOL"}
          </div>
        )}
      </div>
    </div>
  );
}
