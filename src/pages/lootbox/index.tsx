/* eslint-disable react-hooks/exhaustive-deps */
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { Connection, PublicKey, SystemProgram, SYSVAR_INSTRUCTIONS_PUBKEY, SYSVAR_RENT_PUBKEY, SYSVAR_SLOT_HASHES_PUBKEY, Transaction } from "@solana/web3.js";
import { eCurrencyType, RPC_DEVNET, RPC_MAINNET, SPLTOKENS_MAP } from "config/constants";
import { useEffect, useMemo, useState } from "react";
import idl from "idl/lootbox.json";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, BN, Program, Wallet } from "@project-serum/anchor";
import { IDL, Lootbox } from "idl/lootbox";
import StorageSelect from "components/SotrageSelect";
import Header from "components/Header";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { getAta, getCreateAtaInstruction, getDecimals } from "config/utils";
import { toast } from "react-toastify";
import { ASSOCIATED_TOKEN_PROGRAM_ID, NATIVE_MINT, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { createSyncNativeInstruction } from "@solana/spl-token-v2";
import { getLootboxAddress, getPlayerAddress, LootboxData, PlayerData } from "./utils";

const deafultProgramIDs = [idl.metadata.address];

export default function LootboxPage() {
  const [network, setNetwork] = useState(WalletAdapterNetwork.Devnet);
  const connection = useMemo(() => new Connection(network === "mainnet-beta" ? RPC_MAINNET : RPC_DEVNET, "confirmed"), [network]);
  const [programID, setProgramID] = useState(idl.metadata.address);
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet() as Wallet;
  const [provider, setProvider] = useState<AnchorProvider | null>();
  const [program, setProgram] = useState<Program<Lootbox> | null>();
  const [tokenMint, setTokenMint] = useState(NATIVE_MINT.toString());
  const tokens = [
    { symbol: 'Other', address: "" },
    { symbol: 'SOL', address: NATIVE_MINT.toString() },
    { symbol: 'SKT', address: SPLTOKENS_MAP.get(eCurrencyType.SKT) },
    { symbol: 'FORGE', address: SPLTOKENS_MAP.get(eCurrencyType.FORGE) },
    { symbol: 'DUST', address: SPLTOKENS_MAP.get(eCurrencyType.DUST) },
    { symbol: 'DUST(Devnet)', address: SPLTOKENS_MAP.get(eCurrencyType.DUST_DEVNET) },
    { symbol: 'USDC', address: SPLTOKENS_MAP.get(eCurrencyType.USDC) },
  ];
  const [lootboxes, setLootboxes] = useState<Array<LootboxData>>([]);
  const [playerData, setPlayerData] = useState<PlayerData | null>();
  const [lootboxName, setLootboxName] = useState("box1");
  const [imageUrl, setImageUrl] = useState("https://www.arweave.net/2D5IZpG2lNR15P8rKaf7P-DcgbG7Xbc__Jo8ZZrb07w?ext=png");
  const [price, setPrice] = useState(0.1);
  const [winPercent, setWinPercent] = useState(50);
  const [fundAmount, setFundAmount] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  useEffect(() => {
    if (!wallet.publicKey) return;

    const provider = new AnchorProvider(connection, anchorWallet, AnchorProvider.defaultOptions());
    setProvider(provider);
    const program = new Program(IDL, programID, provider) as Program<Lootbox>;
    setProgram(program);

  }, [wallet.publicKey, network, programID]);

  async function fetchData() {
    if (!provider || !program) return;
    try {
      const lootboxes = await program.account.lootbox.all();
      setLootboxes(lootboxes.map(lootbox => lootbox.account as LootboxData));

      const [player] = await getPlayerAddress(provider.wallet.publicKey);
      const playerData = await program.account.player.fetchNullable(player);
      if (playerData) {
        setPlayerData(playerData as PlayerData);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function createLootbox() {
    if (!provider || !program) return;
    try {
      if (!lootboxName) {
        toast.error("Please input lootbox name to create");
        return;
      }
      const [lootbox] = await getLootboxAddress(lootboxName, provider.wallet.publicKey);

      const transaction = new Transaction();
      const splTokenMint = new PublicKey(tokenMint);
      const decimals = await getDecimals(provider, splTokenMint);

      transaction.add(
        program.instruction.createLootbox(
          lootboxName,
          imageUrl,
          splTokenMint,
          new BN(price * decimals),
          winPercent * 100,
          {
            accounts: {
              authority: provider.wallet.publicKey,
              lootbox,
              systemProgram: SystemProgram.programId,
            }
          }
        )
      );

      const txSignature = await wallet.sendTransaction(transaction, provider.connection, { skipPreflight: true });
      await provider.connection.confirmTransaction(txSignature, "confirmed");
      console.log(txSignature);
      fetchData();
      toast.success("Success");
    } catch (error) {
      console.log(error);
      toast.error('Failed');
    }
  }

  async function updateLootbox(lootboxData: LootboxData) {
    if (!provider || !program) return;
    try {
      const [lootbox] = await getLootboxAddress(lootboxData.name, lootboxData.authority);

      const transaction = new Transaction();

      transaction.add(
        program.instruction.setWinning(
          lootboxData.imageUrl,
          winPercent * 100,
          lootboxData.price,
          {
            accounts: {
              authority: provider.wallet.publicKey,
              lootbox,
            }
          }
        )
      );

      const txSignature = await wallet.sendTransaction(transaction, provider.connection, { skipPreflight: false });
      await provider.connection.confirmTransaction(txSignature, "confirmed");
      console.log(txSignature);
      fetchData();
      toast.success("Success");
    } catch (error) {
      console.log(error);
      toast.error('Failed');
    }
  }

  async function addPlayer() {
    if (!provider || !program) return;
    try {
      const [player] = await getPlayerAddress(provider.wallet.publicKey);
      const transaction = new Transaction();

      transaction.add(
        program.transaction.addPlayer({
          accounts: {
            payer: provider.wallet.publicKey,
            player,
            systemProgram: SystemProgram.programId,
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

  async function fund(lootboxData: LootboxData) {
    if (!provider || !program) return;
    try {
      const transaction = new Transaction();
      const [lootbox] = await getLootboxAddress(lootboxData.name, lootboxData.authority);
      const mint = lootboxData.balance.tokenMint;
      const decimals = await getDecimals(provider, mint);

      const funderAta = await getAta(mint, provider.wallet.publicKey);
      const lootboxAta = await getAta(mint, lootbox, true);
      if (mint.toString() === NATIVE_MINT.toString()) {
        let instruction = await getCreateAtaInstruction(provider, funderAta, mint, provider.wallet.publicKey);
        if (instruction) transaction.add(instruction);
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: provider.wallet.publicKey,
            toPubkey: funderAta,
            lamports: fundAmount * decimals,
          }),
          createSyncNativeInstruction(funderAta)
        );
      }
      transaction.add(
        program.transaction.fund(new BN(decimals * fundAmount), {
          accounts: {
            payer: provider.wallet.publicKey,
            lootbox,
            tokenMint: mint,
            payerAta: funderAta,
            lootboxAta,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY
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

  async function withdraw(lootboxData: LootboxData) {
    if (!provider || !program) return;
    try {
      const transaction = new Transaction();
      const [lootbox] = await getLootboxAddress(lootboxData.name, lootboxData.authority);
      const mint = lootboxData.balance.tokenMint;
      const decimals = await getDecimals(provider, mint);

      const claimerAta = await getAta(mint, provider.wallet.publicKey);
      const lootboxAta = await getAta(mint, lootbox, true);
      transaction.add(
        program.transaction.withdraw(new BN(decimals * withdrawAmount), {
          accounts: {
            claimer: provider.wallet.publicKey,
            lootbox,
            claimerAta,
            lootboxAta,
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

  async function play(lootboxData: LootboxData) {
    if (!provider || !program) return;
    try {
      const transaction = new Transaction();
      const [player] = await getPlayerAddress(provider.wallet.publicKey);
      const [lootbox] = await getLootboxAddress(lootboxData.name, lootboxData.authority);
      const mint = lootboxData.balance.tokenMint;
      const decimals = await getDecimals(provider, mint);

      const payerAta = await getAta(mint, provider.wallet.publicKey);
      const lootboxAta = await getAta(mint, lootbox, true);
      const playerAta = await getAta(mint, player, true);
      const price = lootboxData.price.toNumber();

      if (mint.toString() === NATIVE_MINT.toString()) {
        let instruction = await getCreateAtaInstruction(provider, payerAta, mint, provider.wallet.publicKey);
        if (instruction) transaction.add(instruction);
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: provider.wallet.publicKey,
            toPubkey: payerAta,
            lamports: price,
          }),
          createSyncNativeInstruction(payerAta)
        );
      }
      transaction.add(
        program.transaction.play({
          accounts: {
            payer: provider.wallet.publicKey,
            lootbox,
            player,
            tokenMint: mint,
            payerAta,
            lootboxAta,
            playerAta,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
            instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
            recentSlothashes: SYSVAR_SLOT_HASHES_PUBKEY,
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

  async function claim(mint: PublicKey) {
    if (!provider || !program) return;
    try {
      const transaction = new Transaction();
      const [player] = await getPlayerAddress(provider.wallet.publicKey);
      const claimerAta = await getAta(mint, provider.wallet.publicKey);
      const playerAta = await getAta(mint, player, true);
      transaction.add(
        program.transaction.claim({
          accounts: {
            claimer: provider.wallet.publicKey,
            player,
            tokenMint: mint,
            claimerAta,
            playerAta,
            tokenProgram: TOKEN_PROGRAM_ID,
            instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
          },
        })
      );

      const txSignature = await wallet.sendTransaction(transaction, provider.connection, { skipPreflight: true });
      await provider.connection.confirmTransaction(txSignature, "confirmed");
      console.log(txSignature);
      fetchData();
      toast.success('Success');
    } catch (error) {
      console.log(error);
      toast.error('Fail');
    }
  }

  async function closeAllLootbox() {
    if (!wallet.publicKey || !wallet.signAllTransactions || !program || !provider) return;
    try {
      const pdas = await program.provider.connection.getParsedProgramAccounts(program.programId);
      const txns = [];
      let transaction = new Transaction();
      let cnt = 0;
      for (const pda of pdas) {
        // transaction.add(
        //   program.instruction.closePda({
        //     accounts: {
        //       signer: wallet.publicKey,
        //       pda: pda.pubkey,
        //       systemProgram: SystemProgram.programId
        //     }
        //   })
        // );
        // cnt++;
        // if (cnt % 10 === 0) {
        //   txns.push(transaction);
        //   transaction = new Transaction();
        // }
      }
      if (cnt % 10 && transaction.instructions.length > 0) txns.push(transaction);
      const recentBlockhash = await (await program.provider.connection.getLatestBlockhash('finalized')).blockhash;
      for (const transaction of txns) {
        transaction.feePayer = wallet.publicKey;
        transaction.recentBlockhash = recentBlockhash;
      }
      const signedTxns = await wallet.signAllTransactions(txns);
      const txSignatures = [];
      for (const signedTxn of signedTxns) {
        const txSignature = await program.provider.connection.sendRawTransaction(signedTxn.serialize());
        txSignatures.push(txSignature);
      }
      for (const txSignature of txSignatures) {
        await program.provider.connection.confirmTransaction(txSignature, "confirmed");
      }
      return txSignatures;
    } catch (error) {
      console.log(error);
      return;
    }
  }

  useEffect(() => {
    fetchData();
  }, [wallet.publicKey, program, provider]);

  if (!wallet.connected) {
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
    <div className="text-black relative flex gap-2 flex-col ">
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
        <StorageSelect itemkey={"lootbox-programId"} label="Program ID" setItem={setProgramID} defaultItems={deafultProgramIDs} defaultItem={programID} />
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <div>
              Lootbox Name:{" "}
              <input
                className="border-2 border-black p-2"
                onChange={(e) => {
                  setLootboxName(e.target.value);
                }}
                value={lootboxName}
              />
            </div>
            <div>
              Image Url:{" "}
              <input
                className="w-[450px] border-2 border-black p-2"
                onChange={(e) => {
                  setImageUrl(e.target.value);
                }}
                value={imageUrl}
              />
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <p>Token Name:</p>
            <select
              className="border-2 border-black p-2"
              onChange={(e) => {
                setTokenMint(e.target.value);
              }}
              value={tokenMint}
            >
              {tokens.map((token) => (
                <option value={token.address} key={token.address}>
                  {token.symbol}
                </option>
              ))}
            </select>
            Price:{" "}
            <input
              type="number"
              min={0}
              step={0.1}
              className="border-2 border-black p-2"
              onChange={(e) => {
                setPrice(parseFloat(e.target.value) || 0);
              }}
              value={price}
            />
            <p>Win Percent:</p>
            <input
              className="border-2 border-black p-2"
              type="number"
              min={0}
              step={0.01}
              onChange={(e) => {
                setWinPercent(parseFloat(e.target.value) || 0);
              }}
              value={winPercent}
            />
          </div>

          <button className="border-2 border-black p-2 w-fit" onClick={createLootbox}>
            Create Lootbox
          </button>
        </div>

        <div>
          Fund Amount:{" "}
          <input
            className="border-2 border-black p-2"
            type="number"
            min={0}
            step={0.1}
            onChange={(e) => {
              setFundAmount(parseFloat(e.target.value) || 0);
            }}
            value={fundAmount}
          />
        </div>

        <div>
          Withdraw Amount:{" "}
          <input
            className="w-[450px] border-2 border-black p-2"
            type="number"
            min={0}
            step={0.1}
            onChange={(e) => {
              setWithdrawAmount(parseFloat(e.target.value) || 0);
            }}
            value={withdrawAmount}
          />
        </div>

        {playerData ?
          <div className="flex flex-col gap-1">
            Player Balances:
            {playerData.balances.map((balance) => (
              <div className="flex gap-3 items-center" key={balance.tokenMint.toString()}>
                <p>{balance.tokenMint.toString()}</p>
                <p className="text-red">{balance.amount.toString()}</p>
                <button className="border border-black p-1" onClick={() => claim(balance.tokenMint)}>Claim</button>
              </div>
            ))}
          </div> :
          <button className="border border-black p-2 w-fit" onClick={() => addPlayer()}>Add Player</button>
        }

        {/* <button className="w-fit border border-black p-2 rounded-md cursor-pointer" onClick={() => closeAllLootbox()}>Close All Lootbox</button> */}

        <div className="w-full grid grid-cols-3 gap-2">
          {lootboxes.map(lootbox => (
            <div key={lootbox.name + lootbox.authority.toString()} className="flex flex-col gap-2 border border-black p-2 rounded-md items-center justify-center">
              <p className="">{lootbox.name}</p>
              <img src={lootbox.imageUrl} alt="" className="w-full h-full" />
              <p>Token Mint: {lootbox.balance.tokenMint.toString()}</p>
              <p>Price: {lootbox.price.toString()}</p>
              <p>Authority: {lootbox.authority.toString()}</p>
              {wallet.publicKey?.toString() === lootbox.authority.toString() &&
                <>
                  <p>Balance: {lootbox.balance.amount.toString()}</p>
                  <div className="flex gap-1">
                    <p>Win Percent: {lootbox.winPercent / 100}%</p>                    
                    <button className="border border-black p-1" onClick={() => updateLootbox(lootbox)}>Update</button>
                  </div>
                  <button className="border border-black p-1" onClick={() => fund(lootbox)}>Fund</button>
                  <button className="border border-black p-1" onClick={() => withdraw(lootbox)}>Withdraw</button>
                </>
              }
              {playerData && <button className="border border-black p-1" onClick={() => play(lootbox)}>Play</button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}