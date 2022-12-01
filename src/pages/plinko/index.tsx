/* eslint-disable react-hooks/exhaustive-deps */
import * as anchor from "@project-serum/anchor";
import { Program, Provider } from "@project-serum/anchor";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import { createCloseAccountInstruction, createSyncNativeInstruction, NATIVE_MINT, TOKEN_PROGRAM_ID } from "@solana/spl-token-v2";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import Header from "components/Header";
import StorageSelect from "components/SotrageSelect";
import { eCurrencyType, RPC_DEVNET, RPC_MAINNET, SPLTOKENS_MAP } from "config/constants";
import { isAdmin } from "config/utils";
import { Plinko } from "idl/plinko";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import * as nacl from "tweetnacl";
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
  const [tokenMint, setTokenMint] = useState(NATIVE_MINT.toString());
  const [newTokenMint, setNewTokenMint] = useState(NATIVE_MINT.toString());
  const [backendWallet, setBackendWallet] = useState(default_backend.toString());

  const tokens = [
    { symbol: 'SOL', address: NATIVE_MINT.toString() },
    { symbol: 'SKT', address: SPLTOKENS_MAP.get(eCurrencyType.SKT) },
    { symbol: 'FORGE', address: SPLTOKENS_MAP.get(eCurrencyType.FORGE) },
    { symbol: 'DUST', address: SPLTOKENS_MAP.get(eCurrencyType.DUST) },
    { symbol: 'USDC', address: SPLTOKENS_MAP.get(eCurrencyType.USDC) },    
  ];

  const [tokenSymbol, setTokenSymbol] = useState('SOL'); 

  const [gamename, setGamename] = useState(game_name);

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

  async function claim() {
    if (!wallet.signTransaction || !wallet.publicKey) return;
    
    const claimAmount = 0.1; // get from backend

    const { provider, program } = getProviderAndProgram();
    const [game] = await getGameAddress(program.programId, gamename, provider.wallet.publicKey);
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
          claimer: provider.wallet.publicKey,
          backend: new PublicKey(backendWallet),
          claimerAta,
          game,
          gameTreasuryAta,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      })
    );
    if (mint.toString() === NATIVE_MINT.toString()) {
      transaction.add(createCloseAccountInstruction(claimerAta, provider.wallet.publicKey, provider.wallet.publicKey));
    }
    
    transaction.feePayer = wallet.publicKey;
    transaction.recentBlockhash = (await program.provider.connection.getLatestBlockhash("confirmed")).blockhash;

    const signedTx = await wallet.signTransaction(transaction);
    console.log("Transaction made by FE:", signedTx);
    const serializedBuffer = signedTx.serialize({ requireAllSignatures: false }).toString("base64");
    // Send serialized buffer

    // Backend Part
    const recoveredTx = Transaction.from(Buffer.from(serializedBuffer, "base64"));
    console.log("Transaction recovered by BE: ", recoveredTx);
    const programInstructions = recoveredTx.instructions.filter(instruction => instruction.programId.toString() === idl_plinko.metadata.address);
    const claimInstruction = programInstructions[0];
    const amountBytes = claimInstruction.data.slice(8).reverse();
    const amount = new anchor.BN(amountBytes);
    console.log("Claim amount: ", amount.toString());
    if (amount.toNumber() !== LAMPORTS_PER_SOL * claimAmount) return;
    console.log("Recovered Transaction Correctly!");

    const backendKP = Keypair.fromSecretKey(bs58.decode("3VDsp2mphhxaHXFYJQsHEcEQG3ahKBGw5xJ3AoMv25h8aQh7YZqjjKYUTYH4QfFufTkJKcRaPGZJ68NW3ujWoBav"));
    console.log(backendKP.publicKey.toString());
    recoveredTx.partialSign(backendKP);
    // recoveredTx.sign(backendKP);
    const claimerSignature = recoveredTx.signatures[0];
    const realDataNeedToSign = recoveredTx.serializeMessage();
    console.log(claimerSignature.signature);
    let verifyAliceSignatureResult = nacl.sign.detached.verify(
      realDataNeedToSign,
      new Uint8Array(claimerSignature.signature as Buffer),
      claimerSignature.publicKey.toBytes()
    );
    console.log(`verify claimer signature: ${verifyAliceSignatureResult}`);
    // console.log(transaction.serializeMessage(), realDataNeedToSign);
    const beSignature = nacl.sign.detached(realDataNeedToSign, backendKP.secretKey);
    recoveredTx.addSignature(backendKP.publicKey, Buffer.from(beSignature));
    
    console.log(recoveredTx);
    const txSignature = await program.provider.connection.sendRawTransaction(recoveredTx.serialize());
    await program.provider.connection.confirmTransaction(txSignature, "confirmed");
    console.log(txSignature);
    // fetchData();
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
      </div>
    </div>
  );
}
