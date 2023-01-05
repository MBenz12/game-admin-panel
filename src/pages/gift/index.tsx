import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from "@solana/web3.js";
import { eCurrencyType, RPC_DEVNET, RPC_MAINNET, SPLTOKENS_MAP } from "config/constants";
import { useEffect, useMemo, useState } from "react";
import idl from "idl/gift.json";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, BN, Program, Wallet } from "@project-serum/anchor";
import { IDL, Gift } from "idl/gift";
import StorageSelect from "components/SotrageSelect";
import Header from "components/Header";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { getAta, getCreateAtaInstruction, isAdmin } from "config/utils";
import { toast } from "react-toastify";
import { ASSOCIATED_TOKEN_PROGRAM_ID, NATIVE_MINT, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getGiftAddress, getMetadataAddress, TOKEN_METADATA_PROGRAM_ID } from "./utils";
import { createInitializeMintInstruction, createSyncNativeInstruction, MINT_SIZE } from "@solana/spl-token-v2";

const deafultProgramIDs = [idl.metadata.address];

export default function GiftPage() {
  const [network, setNetwork] = useState(WalletAdapterNetwork.Devnet);
  const connection = useMemo(() => new Connection(network === "mainnet-beta" ? RPC_MAINNET : RPC_DEVNET, "confirmed"), [network]);
  const [programID, setProgramID] = useState(idl.metadata.address);
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet() as Wallet;
  const [provider, setProvider] = useState<AnchorProvider | null>();
  const [program, setProgram] = useState<Program<Gift> | null>();
  const [newTokenMint, setNewTokenMint] = useState(NATIVE_MINT.toString());
  const [tokenAmount, setTokenAmount] = useState(0);
  const tokens = [
    { symbol: 'SOL', address: NATIVE_MINT.toString() },
    { symbol: 'SKT', address: SPLTOKENS_MAP.get(eCurrencyType.SKT) },
    { symbol: 'FORGE', address: SPLTOKENS_MAP.get(eCurrencyType.FORGE) },
    { symbol: 'DUST', address: SPLTOKENS_MAP.get(eCurrencyType.DUST) },
    { symbol: 'USDC', address: SPLTOKENS_MAP.get(eCurrencyType.USDC) },    
  ];
  const [targetAddress, setTargetAddress] = useState("");

  useEffect(() => {
    if (!wallet.publicKey) return;

    const provider = new AnchorProvider(connection, anchorWallet, AnchorProvider.defaultOptions());
    setProvider(provider);
    const program = new Program(IDL, programID, provider) as Program<Gift>;
    setProgram(program);

  }, [wallet.publicKey, network, programID]);


  async function fetchData() {
    if (!provider || !program) return;
    try {
    } catch (error) {
      console.log(error);
      toast.error('Failed');
    }
  }

  async function createGift() {
    if (!provider || !program) return;
    try {
      const nftMint = Keypair.generate();
      const [gift] = await getGiftAddress(nftMint.publicKey);
      const creator = provider.wallet.publicKey;
      const target = new PublicKey(targetAddress);
      const [metadata] = await getMetadataAddress(nftMint.publicKey);
      const splTokenMint = new PublicKey(newTokenMint);
      const creatorTokenAta = await getAta(splTokenMint, creator);
      const giftTokenAta = await getAta(splTokenMint, gift, true);
      const targetNftAta = await getAta(nftMint.publicKey, target);

      const transaction = new Transaction();

      if (newTokenMint === NATIVE_MINT.toString()) {
        let instruction = await getCreateAtaInstruction(provider, creatorTokenAta, splTokenMint, creator);
        if (instruction) transaction.add(instruction);

        transaction.add(
          SystemProgram.transfer({
            fromPubkey: provider.wallet.publicKey,
            toPubkey: creatorTokenAta,
            lamports: tokenAmount * LAMPORTS_PER_SOL,
          }),
          createSyncNativeInstruction(creatorTokenAta)
        );

      }
      const lamports = await program.provider.connection.getMinimumBalanceForRentExemption(MINT_SIZE);
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: provider.wallet.publicKey,
          newAccountPubkey: nftMint.publicKey,
          space: MINT_SIZE,
          programId: TOKEN_PROGRAM_ID,
          lamports,
        }),
        createInitializeMintInstruction(nftMint.publicKey, 0, provider.wallet.publicKey, provider.wallet.publicKey),        
      );

      const instruction = await getCreateAtaInstruction(provider, targetNftAta, nftMint.publicKey, target); 
      if (instruction) transaction.add(instruction);

      transaction.add(
        program.instruction.createGift(
          new BN(tokenAmount * LAMPORTS_PER_SOL),
          "Gift 1",
          "Gift",
          "https://arweave.net/0NB1dSUJMZvC_M65xVlFdpAh_WLrukzD0RlT9eZN5OA",
          {
            accounts: {
              creator,
              target,
              nftMint: nftMint.publicKey,
              metadata,
              gift,
              splTokenMint,
              creatorTokenAta,
              giftTokenAta,
              targetNftAta,
              tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
              tokenProgram: TOKEN_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              rent: SYSVAR_RENT_PUBKEY,
            }
          }
        )
      );

      const txSignature = await wallet.sendTransaction(transaction, provider.connection, { skipPreflight: true, signers: [nftMint] });
      await provider.connection.confirmTransaction(txSignature, "confirmed");
      console.log(txSignature);
      fetchData();
      toast.success("Success");
    } catch (error) {
      console.log(error);
      toast.error('Failed');
    }
  }

  useEffect(() => {
    fetchData();
  }, [wallet.connected, network, programID]);

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
        <StorageSelect itemkey={"gift1-programId"} label="Program ID" setItem={setProgramID} defaultItems={deafultProgramIDs} defaultItem={programID} />

        <div className="flex gap-2">
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

          <div>
            Amount:{" "}
            <input
              type="number"
              min={0}
              step={0.1}
              className="border-2 border-black p-2"
              onChange={(e) => {
                setTokenAmount(parseFloat(e.target.value) || 0);
              }}
              value={tokenAmount}
            />
          </div>

          <div>
            Destination Wallet:{" "}
            <input
              className="w-[450px] border-2 border-black p-2"
              onChange={(e) => {
                setTargetAddress(e.target.value);
              }}
              value={targetAddress}
            />
          </div>

          <button className="border-2 border-black p-2" onClick={createGift}>
            Create Gift
          </button>
        </div>
      </div>
    </div>
  );
}