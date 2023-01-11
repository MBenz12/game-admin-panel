/* eslint-disable react-hooks/exhaustive-deps */
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
import { getGiftAddress, getMetadataAddress, NftData, TOKEN_METADATA_PROGRAM_ID } from "./utils";
import { createInitializeMintInstruction, createSyncNativeInstruction, MINT_SIZE, getMint } from "@solana/spl-token-v2";
import { Metaplex } from "@metaplex-foundation/js";
import axios from "axios";

const deafultProgramIDs = [idl.metadata.address];

export default function GiftPage() {
  const [network, setNetwork] = useState(WalletAdapterNetwork.Devnet);
  const connection = useMemo(() => new Connection(network === "mainnet-beta" ? RPC_MAINNET : RPC_DEVNET, "confirmed"), [network]);
  const metaplex = new Metaplex(connection);
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
  const [giftNfts, setGiftNfts] = useState<NftData[]>([]);
  const [gateTokenAddress, setGateTokenAddress] = useState(NATIVE_MINT.toString());
  const [gateTokenAmount, setGateTokenAmount] = useState(0);
  const [expirationTime, setExpirationTime] = useState(new Date().getTime());
  const [verifiedCreators, setVerifiedCreators] = useState<string[]>(['']);
  const [nftName, setNftName] = useState("Gift 1");
  const [nftSymbol, setNftSymbol] = useState("DOG");
  const [nftUri, setNftUri] = useState("https://arweave.net/0NB1dSUJMZvC_M65xVlFdpAh_WLrukzD0RlT9eZN5OA");

  useEffect(() => {
    if (!wallet.publicKey) return;

    const provider = new AnchorProvider(connection, anchorWallet, AnchorProvider.defaultOptions());
    setProvider(provider);
    const program = new Program(IDL, programID, provider) as Program<Gift>;
    setProgram(program);

  }, [wallet.publicKey, network, programID]);

  async function fetchWalletNfts() {
    if (!provider || !program) return;
    try {
      const nfts = await metaplex.nfts().findAllByOwner({ owner: provider.wallet.publicKey }).run();
      const gifts: NftData[] = [];
      await Promise.all(nfts.map(async (nft) => {
        // @ts-ignore
        const mint = nft.mintAddress;
        const [gift] = await getGiftAddress(mint);
        const giftData = await program.account.gift.fetchNullable(gift);
        if (giftData) {
          gifts.push({
            mint,
            name: nft.name,
            symbol: nft.symbol,
            uri: nft.uri,
            image: "",
            gift: giftData
          });
        }
      }));

      await Promise.all(gifts.map(async (nft) => {
        try {
          const { data } = await axios.get(nft.uri);
          nft.image = data.image;
        } catch (error) {
          console.log(error);
        }
      }));
      console.log(gifts);
      setGiftNfts(gifts);
    } catch (error) {

    }
  }


  async function getNftByVerifiedCreators(creators: PublicKey[]) {
    if (!provider || !program) return;
    try {
      const nfts = await metaplex.nfts().findAllByOwner({ owner: provider.wallet.publicKey }).run();
      const creatorsAddresss = creators.map(creator => creator.toString());
      for (const nft of nfts) {
        if (creatorsAddresss.includes(nft.creators[0].address.toString())) {
          // @ts-ignore
          return nft.mintAddress;
        }
      }
    } catch (error) {

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
      const gateTokenMint = new PublicKey(gateTokenAddress);
      const mintAccount = await getMint(provider.connection, gateTokenMint);
      const decimals = Math.pow(10, mintAccount.decimals);

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
          nftName,
          nftSymbol,
          nftUri,
          new BN(expirationTime),
          new BN(gateTokenAmount * decimals),
          gateTokenMint,
          verifiedCreators.filter(creator => creator).map(creator => new PublicKey(creator)),
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
      fetchWalletNfts();
      toast.success("Success");
    } catch (error) {
      console.log(error);
      toast.error('Failed');
    }
  }

  async function redeem(nft: NftData) {
    if (!provider || !program) return;
    try {
      console.log(provider.connection);
      const nftMint = nft.mint;
      const [gift] = await getGiftAddress(nftMint);
      const target = nft.gift.destinationAddress;
      const gateTokenAta = await getAta(nft.gift.gateTokenMint, target);
      const targetNftAta = await getAta(nftMint, target);
      const splTokenMint = nft.gift.splTokenMint;
      const giftTokenAta = await getAta(splTokenMint, gift, true);
      const targetTokenAta = await getAta(splTokenMint, target);
      const gateNftMint = nft.gift.verifiedCreators.length ? await getNftByVerifiedCreators(nft.gift.verifiedCreators) : nftMint;
      const gateNftAta = await getAta(gateNftMint, target);
      const [gateNftMetadata] = await getMetadataAddress(gateNftMint);
      const transaction = new Transaction();
      transaction.add(
        program.instruction.redeem({
          accounts: {
            target,
            nftMint,
            targetNftAta,
            gift,
            gateTokenAta,
            gateNftMint,
            gateNftAta,
            gateNftMetadata,
            splTokenMint,
            giftTokenAta,
            targetTokenAta,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY
          }
        })
      );

      console.log(transaction);

      const txSignature = await wallet.sendTransaction(transaction, provider.connection, { skipPreflight: true });
      await provider.connection.confirmTransaction(txSignature, "confirmed");
      console.log(txSignature);
      fetchWalletNfts();
      toast.success("Success");
    } catch (error) {

    }
  }

  useEffect(() => {
    fetchWalletNfts();
  }, [wallet.publicKey, network, programID]);

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
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <div>
              Nft Name:{" "}
              <input
                className="border-2 border-black p-2"
                onChange={(e) => {
                  setNftName(e.target.value);
                }}
                value={nftName}
              />
            </div>
            <div>
              Nft Symbol:{" "}
              <input
                className="border-2 border-black p-2"
                onChange={(e) => {
                  setNftSymbol(e.target.value);
                }}
                value={nftSymbol}
              />
            </div>
            <div>
              Nft Uri:{" "}
              <input
                className="w-[450px] border-2 border-black p-2"
                onChange={(e) => {
                  setNftUri(e.target.value);
                }}
                value={nftUri}
              />
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <div>
              Expiration Date:{" "}
              <input
                type="datetime-local"
                className="border-2 border-black p-2"
                onChange={(e) => {
                  setExpirationTime(new Date(e.target.value).getTime() / 1000);
                }}
                defaultValue={""}
              />
            </div>

            <div>
              Gate Token Mint:{" "}
              <input
                className="w-[450px] border-2 border-black p-2"
                onChange={(e) => {
                  setGateTokenAddress(e.target.value);
                }}
                value={gateTokenAddress}
              />
            </div>

            <div>
              Gate Token Amount:{" "}
              <input
                type="number"
                min={0}
                step={0.1}
                className="border-2 border-black p-2"
                onChange={(e) => {
                  setGateTokenAmount(parseFloat(e.target.value) || 0);
                }}
                value={gateTokenAmount}
              />
            </div>
          </div>
          <div className="flex gap-1 flex-col">
            {verifiedCreators.map((verifiedCreator, index) => (
              <div className="flex gap-2 items-center" key={"creator" + index}>
                <p>Verified Creator {index + 1}:</p>
                <input
                  className="w-[450px] border-2 border-black p-2"
                  onChange={(e) => {
                    setVerifiedCreators(verifiedCreators.map((verifiedCreator, i) => index === i ? e.target.value : verifiedCreator));
                  }}
                  value={verifiedCreator}
                />
                <button
                  className="border-2 border-black p-2"
                  onClick={() => {
                    setVerifiedCreators(verifiedCreators.filter((_, i) => index !== i));
                  }}
                >-</button>
              </div>
            ))}
            <button
              className="border-2 border-black p-2 w-fit"
              onClick={() => {
                setVerifiedCreators(verifiedCreators.concat(""));
              }}
            >+</button>
          </div>
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

          <button className="border-2 border-black p-2 w-fit" onClick={createGift}>
            Create Gift
          </button>
        </div>
        <div className="w-full grid grid-cols-4">
          {giftNfts.map(nft => (
            <div key={nft.mint.toString()} className="flex flex-col gap-2 border border-black p-2 rounded-md items-center justify-center">
              <p className="">{nft.name}</p>
              <img src={nft.image} alt="" className="w-full h-full" />
              {nft.gift.redeemed ? <p>Redeemed</p> : <button className="w-full border border-black p-2 rounded-md" onClick={() => redeem(nft)}>Redeem</button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}