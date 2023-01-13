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
import { getAta, getCreateAtaInstruction } from "config/utils";
import { toast } from "react-toastify";
import { ASSOCIATED_TOKEN_PROGRAM_ID, NATIVE_MINT, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getGiftAddress, getMetadataAddress, GiftData, NftData, TOKEN_METADATA_PROGRAM_ID } from "./utils";
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
    { symbol: 'Other', address: "" },
    { symbol: 'SOL', address: NATIVE_MINT.toString() },
    { symbol: 'SKT', address: SPLTOKENS_MAP.get(eCurrencyType.SKT) },
    { symbol: 'FORGE', address: SPLTOKENS_MAP.get(eCurrencyType.FORGE) },
    { symbol: 'DUST', address: SPLTOKENS_MAP.get(eCurrencyType.DUST) },
    { symbol: 'DUST(Devnet)', address: SPLTOKENS_MAP.get(eCurrencyType.DUST_DEVNET) },
    { symbol: 'USDC', address: SPLTOKENS_MAP.get(eCurrencyType.USDC) },
  ];
  const [targetAddress, setTargetAddress] = useState("");
  const [giftNfts, setGiftNfts] = useState<NftData[]>([]);
  const [gateTokenAddress, setGateTokenAddress] = useState(NATIVE_MINT.toString());
  const [gateTokenAmount, setGateTokenAmount] = useState(0);
  const [expirationTime, setExpirationTime] = useState(0);
  const [verifiedCreators, setVerifiedCreators] = useState<string[]>(['']);
  const [nftName, setNftName] = useState("Gift 1");
  const [nftSymbol, setNftSymbol] = useState("DOG");
  const [nftUri, setNftUri] = useState("https://arweave.net/0NB1dSUJMZvC_M65xVlFdpAh_WLrukzD0RlT9eZN5OA");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [gifts, setGifts] = useState<Array<GiftData>>([]);
  const [walletNfts, setWalletNfts] = useState<Array<string>>([]);
  useEffect(() => {
    if (!wallet.publicKey) return;

    const provider = new AnchorProvider(connection, anchorWallet, AnchorProvider.defaultOptions());
    setProvider(provider);
    const program = new Program(IDL, programID, provider) as Program<Gift>;
    setProgram(program);

  }, [wallet.publicKey, network, programID]);

  async function fetchAllGifts() {
    if (!provider || !program) return;
    try {
      const gifts = await program.account.gift.all();
      const sortedGifts = await Promise.all(gifts.map(async (gift) => {
        const mint = gift.account.splTokenMint;
        const mintAccount = await getMint(provider.connection, mint);
        const decimals = Math.pow(10, mintAccount.decimals);
        return { ...gift.account, decimals };
      }));
      sortedGifts.sort((a, b) => a.expirationTime.toNumber() - b.expirationTime.toNumber());
      setGifts(sortedGifts);
      console.log(gifts);
    } catch (error) {
      console.log(error);
    }
  }

  async function fetchWalletNfts() {
    if (!provider || !program) return;
    try {
      fetchAllGifts();
      console.log("fetching gift");
      const nfts = await metaplex.nfts().findAllByOwner({ owner: provider.wallet.publicKey }).run();
      // @ts-ignore
      setWalletNfts(nfts.map(nft => nft.mintAddress.toString()));
      const gifts: NftData[] = [];
      await Promise.all(nfts.map(async (nft) => {
        // @ts-ignore
        const mint = nft.mintAddress;
        const [gift] = await getGiftAddress(mint);
        try {
          const giftData = await program.account.gift.fetchNullable(gift);
          if (giftData) {
            const mintAccount = await getMint(provider.connection, giftData.splTokenMint);
            const decimals = Math.pow(10, mintAccount.decimals);
            gifts.push({
              mint,
              name: nft.name,
              symbol: nft.symbol,
              uri: nft.uri,
              image: "",
              gift: { ...giftData, decimals },
            });
          }
        } catch (error) {

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
      console.log(error);
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
      // if (expirationTime * 1000 - new Date().getTime() <= 8 * 3600 * 1000) {
      //   toast.error('Expiration time should be at least 8hrs');
      //   return;
      // }
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

      const giftTokenMint = await getMint(provider.connection, splTokenMint);
      const giftDecimals = Math.pow(10, giftTokenMint.decimals);

      const transaction = new Transaction();

      if (newTokenMint === NATIVE_MINT.toString()) {
        let instruction = await getCreateAtaInstruction(provider, creatorTokenAta, splTokenMint, creator);
        if (instruction) transaction.add(instruction);

        transaction.add(
          SystemProgram.transfer({
            fromPubkey: provider.wallet.publicKey,
            toPubkey: creatorTokenAta,
            lamports: tokenAmount * giftDecimals,
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
          new BN(tokenAmount * giftDecimals),
          nftName,
          nftSymbol,
          nftUri,
          new BN(expirationTime || Math.floor(new Date().getTime() / 1000)),
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

      const txSignature = await wallet.sendTransaction(transaction, provider.connection, { skipPreflight: false, signers: [nftMint] });
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

      const txSignature = await wallet.sendTransaction(transaction, provider.connection, { skipPreflight: false });
      await provider.connection.confirmTransaction(txSignature, "confirmed");
      console.log(txSignature);
      fetchWalletNfts();
      toast.success("Success");
    } catch (error) {

    }
  }

  async function burn(nftMint: PublicKey, splTokenMint: PublicKey, destinationAddress?: PublicKey) {
    if (!provider || !program) return;
    try {
      // const nftMint = nft.mint;
      const [gift] = await getGiftAddress(nftMint);
      const target = withdrawAddress ? new PublicKey(withdrawAddress) : (destinationAddress || new PublicKey(withdrawAddress));
      // const splTokenMint = nft.gift.splTokenMint;
      const giftTokenAta = await getAta(splTokenMint, gift, true);
      const targetTokenAta = await getAta(splTokenMint, target);
      const transaction = new Transaction();
      transaction.add(
        program.instruction.burnGift({
          accounts: {
            admin: provider.wallet.publicKey,
            target,
            nftMint,
            gift,
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

      const txSignature = await wallet.sendTransaction(transaction, provider.connection, { skipPreflight: false });
      await provider.connection.confirmTransaction(txSignature, "confirmed");
      console.log(txSignature);
      fetchWalletNfts();
      toast.success("Success");
    } catch (error) {

    }
  }

  async function closeAllGift() {
    if (!wallet.publicKey || !wallet.signAllTransactions || !program || !provider) return;
    try {
      const pdas = await program.provider.connection.getParsedProgramAccounts(program.programId);
      const txns = [];
      let transaction = new Transaction();
      let cnt = 0;
      for (const pda of pdas) {
        transaction.add(
          program.instruction.closePda({
            accounts: {
              signer: wallet.publicKey,
              pda: pda.pubkey,
              systemProgram: SystemProgram.programId
            }
          })
        );
        cnt++;
        if (cnt % 10 === 0) {
          txns.push(transaction);
          transaction = new Transaction();
        }
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
    fetchWalletNfts();
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
            <p>NFTs:</p>
            <select
              className="border-2 border-black p-2"
              onChange={(e) => {
                setNewTokenMint(e.target.value);
                setTokenAmount(1);
              }}
              value={newTokenMint}
            >
              {walletNfts.map((nft) => (
                <option value={nft} key={nft}>
                  {nft}
                </option>
              ))}
            </select>
            <input
              className="w-[450px] border-2 border-black p-2"
              onChange={(e) => {
                setNewTokenMint(e.target.value);
              }}
              value={newTokenMint}
            />
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

        <div>
          Withdraw Wallet:{" "}
          <input
            className="w-[450px] border-2 border-black p-2"
            onChange={(e) => {
              setWithdrawAddress(e.target.value);
            }}
            value={withdrawAddress}
          />
        </div>

        {/* <button className="w-fit border border-black p-2 rounded-md cursor-pointer" onClick={() => closeAllGift()}>Close All Gift</button> */}

        <div className="w-full grid grid-cols-4 gap-2">
          {giftNfts.map(nft => (
            <div key={nft.mint.toString()} className="flex flex-col gap-2 border border-black p-2 rounded-md items-center justify-center">
              <p className="">{nft.name}</p>
              <img src={nft.image} alt="" className="w-full h-full" />
              <p>Expire at: {new Date(nft.gift.expirationTime.toNumber() * 1000).toLocaleString()}</p>
              {nft.gift.redeemed ? <p>Redeemed</p> : (
                (nft.gift.expirationTime.toNumber() * 1000 < new Date().getTime()) ?
                  <p>Expired</p> :
                  <button className="w-full border border-black p-2 rounded-md cursor-pointer" onClick={() => redeem(nft)}>Redeem</button>)}
              {nft.gift.burned ?
                <p>Burned</p> :
                (nft.gift.expirationTime.toNumber() * 1000 < new Date().getTime() &&
                  <button className="w-full border border-black p-2 rounded-md cursor-pointer" onClick={() => burn(nft.mint, nft.gift.splTokenMint)}>Burn</button>)}

              <p>Author: {nft.gift.creator.toString()}</p>
              <p>Destination: {nft.gift.destinationAddress.toString()}</p>
              <p>{nft.gift.splTokenMint.toString()} - {nft.gift.tokenAmount.toNumber() / (nft.gift.decimals || 1)}</p>
            </div>
          ))}
        </div>

        <button className="w-fit border border-black p-2 rounded-md cursor-pointer" onClick={() => fetchAllGifts()}>Refresh</button>
        <table className="my-2 border border-black w-full border-collapse">
          <thead>
            <tr className="border border-black">
              <td>No</td>
              <td>Creator Address</td>
              <td>Destination Address</td>
              <td>TokenAddress</td>
              <td>Expiration Time</td>
              <td>Token Amount</td>
              <td>Redeem</td>
              <td>Burn</td>
            </tr>
          </thead>
          <tbody>
            {gifts.map((gift: GiftData, index: number) => (
              <tr className="border border-black">
                <td>{index + 1}</td>
                <td>{gift.creator.toString()}</td>
                <td>{gift.destinationAddress.toString()}</td>
                <td>{gift.nftMint.toString()}</td>
                <td>{new Date(gift.expirationTime.toNumber() * 1000).toLocaleString()}</td>
                <td className="text-center">{gift.tokenAmount.toNumber() / (gift.decimals || 1)}</td>
                <td>{gift.redeemed ? "Redeemed" : ""}</td>
                <td>
                  {gift.burned ? "Burned" :
                    (gift.expirationTime.toNumber() * 1000 <= new Date().getTime() &&
                      <button
                        className="border border-black px-2 py-1 cursor-pointer"
                        onClick={() => burn(gift.nftMint, gift.splTokenMint, gift.creator)}>
                        Burn
                      </button>)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}