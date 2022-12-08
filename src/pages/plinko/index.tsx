/* eslint-disable react-hooks/exhaustive-deps */
import * as anchor from "@project-serum/anchor";
import { Program, Provider } from "@project-serum/anchor";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import { createCloseAccountInstruction, createSyncNativeInstruction, NATIVE_MINT, TOKEN_PROGRAM_ID } from "@solana/spl-token-v2";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import axios from "axios";
import Header from "components/Header";
import StorageSelect from "components/SotrageSelect";
import { eCurrencyType, RPC_DEVNET, RPC_MAINNET, SPLTOKENS_MAP } from "config/constants";
import { isAdmin } from "config/utils";
import { Plinko } from "idl/plinko";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import * as nacl from "tweetnacl";
import { convertLog, default_backend, game_name, getAta, getCreateAtaInstruction, getGameAddress, JWT_EXPIRES_IN, JWT_TOKEN } from "./utils";
import jwt from "jsonwebtoken";

const idl_plinko = require("idl/plinko.json");
const deafultProgramIDs = [idl_plinko.metadata.address];
const deafultGamenames = [game_name];

export default function PlinkoPage() {
  const [network, setNetwork] = useState(WalletAdapterNetwork.Devnet);
  const connection = useMemo(() => new Connection(network === "mainnet-beta" ? RPC_MAINNET : RPC_DEVNET, "confirmed"), [network]);
  const [programID, setProgramID] = useState(idl_plinko.metadata.address);
  useEffect(() => {
    const network = localStorage.getItem("network");
    if (network) {
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
  const [tokenMint, setTokenMint] = useState(NATIVE_MINT.toString());
  const [newTokenMint, setNewTokenMint] = useState(NATIVE_MINT.toString());
  const [backendWallet, setBackendWallet] = useState(default_backend.toString());
  const [multiplier, setMultiplier] = useState<any>();
  const [chance, setChance] = useState<any>();
  const tokens = [
    { symbol: 'SOL', address: NATIVE_MINT.toString() },
    { symbol: 'SKT', address: SPLTOKENS_MAP.get(eCurrencyType.SKT) },
    { symbol: 'FORGE', address: SPLTOKENS_MAP.get(eCurrencyType.FORGE) },
    { symbol: 'DUST', address: SPLTOKENS_MAP.get(eCurrencyType.DUST) },
    { symbol: 'USDC', address: SPLTOKENS_MAP.get(eCurrencyType.USDC) },
  ];

  const [tokenSymbol, setTokenSymbol] = useState('SOL');

  const [gamename, setGamename] = useState(game_name);

  const [lineCount, setLineCount] = useState(8);
  const [risk, setRisk] = useState('Low');
  const [ballCount, setBallCount] = useState(1);
  const [betAmount, setBetAmount] = useState(1);

  async function initGame() {
    try {
      const { provider, program } = getProviderAndProgram();
      const [game, game_bump] = await getGameAddress(program.programId, gamename, provider.wallet.publicKey);
      const mint = new PublicKey(newTokenMint);
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
      toast.success('Success');
    } catch (error) {
      console.log(error);
      toast.error('Fail');
    }
  }

  function updateAccessToken(token: string) {
    if (token) {
      localStorage.setItem("accessToken", token);
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      localStorage.removeItem('accessToken');
      delete axios.defaults.headers.common.Authorization;
    }
  }

  async function getSignedMessage() {
    if (wallet.signMessage && wallet.publicKey) {
      const message = "I am an authorized admin wallet.";
      const signature = await wallet.signMessage(new Uint8Array(Buffer.from(message)));

      return { message, signature, wallet: wallet.publicKey.toString() };
    }
  }

  async function getSettings() {
    if (!wallet.signMessage || !wallet.publicKey) return;

    try {
      let token = localStorage.getItem('accessToken');
      console.log(token);
      if (!token) {
        const payload = await getSignedMessage();
        if (payload) {
          updateAccessToken(jwt.sign(payload, JWT_TOKEN, { expiresIn: JWT_EXPIRES_IN }));
        }
      } else {
        const { payload } = jwt.verify(token, JWT_TOKEN, { complete: true });
        updateAccessToken(token);
        // @ts-ignore
        if (!payload || payload && payload.wallet !== wallet.publicKey.toString()) {
          const newPayload = await getSignedMessage();
          if (newPayload) {
            updateAccessToken(jwt.sign(newPayload, JWT_TOKEN, { expiresIn: JWT_EXPIRES_IN }));
          }
        }
      }

      const { data } = await axios.get('http://localhost:5001/settings/admin');
      if (data) {
        const { multiplier, chance } = data;
        setMultiplier(multiplier);
        setChance(chance);
      }
    } catch (error) {
      console.log(error);
      toast.error('Unauthorized Wallet');
    }
  }

  async function setSettings() {
    try {
      let token = localStorage.getItem('accessToken');
      if (token) {
        updateAccessToken(token);
        await axios.post('http://localhost:5001/settings/admin', { multiplier, chance });
      }
      toast.success("Settings Updated Successfully");
    } catch (error) {
      console.log(error);
      toast.error('Unauthorized Wallet');
    }
  }

  async function play() {
    if (!wallet.publicKey) return;
    try {
      let token = localStorage.getItem('accessToken');
      if (token) {
        updateAccessToken(token);
        const { data } = await axios.post('http://localhost:5001/game/play', { lines: lineCount, risk, betValue: betAmount, ballCount, wallet: wallet?.publicKey.toString() });
        console.log(data);
      }
      toast.success("Played Successfully");
    } catch (error) {
      console.log(error);
      toast.error('Unauthorized Wallet');
    }
  }

  async function fetchData() {
    getSettings();
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
      setTokenMint(gameData.tokenMint.toString());
      setTokenSymbol(tokens.filter(token => token.address === gameData.tokenMint.toString())[0].symbol);
      setNewTokenMint(gameData.tokenMint.toString());
      setGameBalance(gameData.mainBalance.toNumber());
      setBackendWallet(gameData.backendWallet.toString());
    }
  }

  async function withdraw() {
    try {
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
      toast.success('Success');
    } catch (error) {
      console.log(error);
      toast.error('Fail');
    }
  }

  async function updateBackendWallet() {
    try {
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
      toast.success('Success');
    } catch (error) {
      console.log(error);
      toast.error('Fail');
    }
  }

  async function fund() {
    try {
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
      toast.success('Success');
    } catch (error) {
      console.log(error);
      toast.error('Fail');
    }
  }

  async function deposit() {
    if (!wallet.signTransaction || !wallet.publicKey) return;

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

    transaction.feePayer = wallet.publicKey;
    transaction.recentBlockhash = (await program.provider.connection.getLatestBlockhash("confirmed")).blockhash;

    const signedTx = await wallet.signTransaction(transaction);
    console.log(signedTx.serialize());

    const serializedBuffer = signedTx.serialize().toString("base64");
    // Send serialized buffer

    // Backend Part
    const txSignature = await program.provider.connection.sendRawTransaction(Buffer.from(serializedBuffer, "base64"));
    await program.provider.connection.confirmTransaction(txSignature, "confirmed");
    console.log(txSignature);
    fetchData();
  }

  // async function claim() {
  //   if (!wallet.signTransaction || !wallet.publicKey) return;

  //   const claimAmount = 0.1; // get from backend

  //   const { provider, program } = getProviderAndProgram();
  //   const [game] = await getGameAddress(program.programId, gamename, provider.wallet.publicKey);
  //   const mint = gameData.tokenMint;

  //   const transaction = new Transaction();

  //   const claimerAta = await getAta(mint, provider.wallet.publicKey);
  //   const instruction = await getCreateAtaInstruction(provider, claimerAta, mint, provider.wallet.publicKey);
  //   if (instruction) transaction.add(instruction);
  //   const gameTreasuryAta = await getAta(mint, game, true);
  //   console.log("Backend Wallet:", backendWallet);
  //   transaction.add(
  //     program.transaction.claim(new anchor.BN(claimAmount * LAMPORTS_PER_SOL), {
  //       accounts: {
  //         claimer: provider.wallet.publicKey,
  //         backend: new PublicKey(backendWallet),
  //         claimerAta,
  //         game,
  //         gameTreasuryAta,
  //         tokenProgram: TOKEN_PROGRAM_ID,
  //       },
  //     })
  //   );
  //   if (mint.toString() === NATIVE_MINT.toString()) {
  //     transaction.add(createCloseAccountInstruction(claimerAta, provider.wallet.publicKey, provider.wallet.publicKey));
  //   }

  //   transaction.feePayer = wallet.publicKey;
  //   transaction.recentBlockhash = (await program.provider.connection.getLatestBlockhash("confirmed")).blockhash;

  //   const signedTx = await wallet.signTransaction(transaction);
  //   console.log("Transaction made by FE:", signedTx);
  //   const serializedBuffer = signedTx.serialize({ requireAllSignatures: false }).toString("base64");
  //   // Send serialized buffer

  //   // Backend Part
  //   const recoveredTx = Transaction.from(Buffer.from(serializedBuffer, "base64"));
  //   console.log("Transaction recovered by BE: ", recoveredTx);
  //   const programInstructions = recoveredTx.instructions.filter(instruction => instruction.programId.toString() === idl_plinko.metadata.address);
  //   const claimInstruction = programInstructions[0];
  //   const amountBytes = claimInstruction.data.slice(8).reverse();
  //   const amount = new anchor.BN(amountBytes);
  //   console.log("Claim amount: ", amount.toString());
  //   if (amount.toNumber() !== LAMPORTS_PER_SOL * claimAmount) return;
  //   console.log("Recovered Transaction Correctly!");

  //   const backendKP = Keypair.fromSecretKey(bs58.decode("3VDsp2mphhxaHXFYJQsHEcEQG3ahKBGw5xJ3AoMv25h8aQh7YZqjjKYUTYH4QfFufTkJKcRaPGZJ68NW3ujWoBav"));
  //   console.log(backendKP.publicKey.toString());
  //   recoveredTx.partialSign(backendKP);
  //   // recoveredTx.sign(backendKP);
  //   const claimerSignature = recoveredTx.signatures[0];
  //   const realDataNeedToSign = recoveredTx.serializeMessage();
  //   console.log(claimerSignature.signature);
  //   let verifyAliceSignatureResult = nacl.sign.detached.verify(
  //     realDataNeedToSign,
  //     new Uint8Array(claimerSignature.signature as Buffer),
  //     claimerSignature.publicKey.toBytes()
  //   );
  //   console.log(`verify claimer signature: ${verifyAliceSignatureResult}`);
  //   // console.log(transaction.serializeMessage(), realDataNeedToSign);
  //   const beSignature = nacl.sign.detached(realDataNeedToSign, backendKP.secretKey);
  //   recoveredTx.addSignature(backendKP.publicKey, Buffer.from(beSignature));

  //   console.log(recoveredTx);
  //   const txSignature = await program.provider.connection.sendRawTransaction(recoveredTx.serialize());
  //   await program.provider.connection.confirmTransaction(txSignature, "confirmed");
  //   console.log(txSignature);
  //   // fetchData();
  // }

  async function claim() {
    if (!wallet.signTransaction || !wallet.publicKey) return;

    // Front End
    const { provider, program } = getProviderAndProgram();
    const claimer = provider.wallet.publicKey;

    // Backend
    const claimAmount = 0.1;
    const [game] = await getGameAddress(program.programId, gamename, claimer);
    const mint = gameData.tokenMint;

    const transaction = new Transaction();

    const claimerAta = await getAta(mint, provider.wallet.publicKey);
    const instruction = await getCreateAtaInstruction(provider, claimerAta, mint, provider.wallet.publicKey);
    if (instruction) transaction.add(instruction);
    const gameTreasuryAta = await getAta(mint, game, true);
    console.log("Backend Wallet:", backendWallet);
    transaction.add(
      program.transaction.claim(new anchor.BN(claimAmount * LAMPORTS_PER_SOL), {
        accounts: {
          claimer,
          backend: new PublicKey(backendWallet),
          claimerAta,
          game,
          gameTreasuryAta,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      })
    );
    if (mint.toString() === NATIVE_MINT.toString()) {
      transaction.add(createCloseAccountInstruction(claimerAta, claimer, claimer));
    }

    transaction.feePayer = claimer;
    transaction.recentBlockhash = (await program.provider.connection.getLatestBlockhash("confirmed")).blockhash;

    const backendKP = Keypair.fromSecretKey(bs58.decode("3VDsp2mphhxaHXFYJQsHEcEQG3ahKBGw5xJ3AoMv25h8aQh7YZqjjKYUTYH4QfFufTkJKcRaPGZJ68NW3ujWoBav"));
    console.log(backendKP.publicKey.toString());

    console.log("Transaction made by BE:", transaction);
    transaction.partialSign(backendKP);
    console.log("Partial Signed Transaction by BE Keypair:", transaction);
    let serializedBuffer = transaction.serialize({ requireAllSignatures: false }).toString("base64");
    // Send serialized buffer

    // Frontend Part
    let recoveredTx = Transaction.from(Buffer.from(serializedBuffer, "base64"));
    console.log("Transaction recovered by FE: ", recoveredTx);
    const signedTx = await wallet.signTransaction(recoveredTx);
    console.log("Transaction Signed by FE:", signedTx);
    serializedBuffer = signedTx.serialize().toString("base64");

    // Backend Part
    recoveredTx = Transaction.from(Buffer.from(serializedBuffer, "base64"));
    const txSignature = await program.provider.connection.sendRawTransaction(recoveredTx.serialize());
    await program.provider.connection.confirmTransaction(txSignature, "confirmed");
    console.log(txSignature);


    fetchData();
  }

  async function signMessage() {
    if (wallet.signMessage && wallet.publicKey) {
      // Sign in FE
      const message = "Signing Message";
      const signature = await wallet.signMessage(new Uint8Array(Buffer.from(message)));
      console.log(signature);

      // Verify in BE
      const clientKey = wallet.publicKey;
      const verified = nacl.sign.detached.verify(new Uint8Array(Buffer.from(message)), signature, clientKey.toBytes());
      console.log(verified);
    }
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
        <div className="flex gap-2 items-center">
          <p>Token Name:</p>
          <select
            className="border-2 border-black p-2"
            onChange={(e) => {
              setNewTokenMint(e.target.value);
            }}
            value={newTokenMint}
          >
            {tokens.map((token) => (
              <option value={token.address} key={token.address}>
                {token.symbol}
              </option>
            ))}
          </select>
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
              {tokenSymbol}
            </div>
            <button className="border-2 border-black p-2" onClick={fund}>
              Fund
            </button>
            <button className="border-2 border-black p-2" onClick={deposit}>
              Deposit through Backend
            </button>
            <button className="border-2 border-black p-2" onClick={claim}>
              Claim through Backend
            </button>
            <button className="border-2 border-black p-2" onClick={signMessage}>
              Sign Message
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
              {tokenSymbol}
            </div>
            <button className="border-2 border-black p-2" onClick={withdraw}>
              Withdraw Main Balance
            </button>
          </div>
        )}
        {!!gameData && (
          <div>
            Main Balance: {gameBalance / LAMPORTS_PER_SOL} {tokenSymbol}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <p className="text-[20px]">Settings</p>
          {(multiplier && chance) && (
            Object.keys(multiplier).map((key => (
              <div key={key} className="flex items-center gap-2 border border-black w-fit p-2">
                <p className="w-[50px]">{key}</p>
                <div className="flex flex-col gap-2">
                  {multiplier[key] && multiplier[key].map((vals: number[], i: number) => (
                    <div key={key + i} className="flex gap-1 items-center">
                      <p className="w-[70px]">{[8, 12, 16][i]}Lines</p>
                      {vals && vals.map((val: number, j) => (
                        <div key={key + i + j} className="flex flex-col gap-1 ">
                          <input
                            className="border border-black p-1 w-[55px]"
                            type={"number"}
                            min={0}
                            step={0.1}
                            value={val}
                            onChange={(e) => {
                              const newMultiplier = JSON.parse(JSON.stringify(multiplier));
                              newMultiplier[key][i][j] = parseFloat(e.target.value) || 0;
                              setMultiplier(newMultiplier);
                            }}
                          />
                          <input
                            className="border border-black p-1 w-[55px]"
                            type={"number"}
                            min={0}
                            step={0.1}
                            value={(chance[key][i][j] || 0) / 100}
                            onChange={(e) => {
                              const newChance = JSON.parse(JSON.stringify(chance));
                              newChance[key][i][j] = (parseFloat(e.target.value) || 0) * 100;
                              setChance(newChance);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )))
          )}
          <div>
            <button className="border-2 border-black p-2" onClick={setSettings}>
              Save Settings
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-2 items-center">
            <p>Lines:</p>
            <select
              className="border-2 border-black p-2"
              onChange={(e) => {
                setLineCount(parseInt(e.target.value));
              }}
              value={lineCount}
            >
              {[8, 12, 16].map((count) => (
                <option value={count} key={count}>
                  {count}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <p>Risk:</p>
            <select
              className="border-2 border-black p-2"
              onChange={(e) => {
                setRisk(e.target.value);
              }}
              value={risk}
            >
              {['Low', 'Middle', 'High'].map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-1 items-center">
            Bet Amount:
            <input
              className="border-2 border-black p-2 w-[60px]"
              type={"number"}
              min={0}
              step={0.01}
              onChange={(e) => {
                setBetAmount(parseFloat(e.target.value || "0"));
              }}
              value={`${betAmount}`}
            />$
          </div>
          <div className="flex gap-1 items-center">
            Ball Count:
            <input
              className="border-2 border-black p-2 w-[60px]"
              type={"number"}
              min={0}
              step={0.01}
              onChange={(e) => {
                setBallCount(parseFloat(e.target.value || "0"));
              }}
              value={`${ballCount}`}
            />
          </div>
          <button className="border-2 border-black p-2" onClick={play}>
            Play
          </button>
        </div>
      </div>
    </div>
  );
}
