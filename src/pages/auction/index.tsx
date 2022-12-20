/* eslint-disable react-hooks/exhaustive-deps */
import * as anchor from "@project-serum/anchor";
import { BN, Program, AnchorProvider } from "@project-serum/anchor";
import { ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { createCloseAccountInstruction, createSyncNativeInstruction, NATIVE_MINT, TOKEN_PROGRAM_ID } from "@solana/spl-token-v2";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, SYSVAR_INSTRUCTIONS_PUBKEY, SYSVAR_RENT_PUBKEY, Transaction } from "@solana/web3.js";
import Header from "components/Header";
import StorageSelect from "components/SotrageSelect";
import { eCurrencyType, RPC_DEVNET, RPC_MAINNET, SPLTOKENS_MAP } from "config/constants";
import { getSolBalance, isAdmin } from "config/utils";
import { Auction } from "idl/auction";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { auction_name, auction_creator, getAta, getCreateAtaInstruction, getAuctionAddress } from "./utils";
const idl = require("idl/auction.json");

const deafultProgramIDs = [idl.metadata.address];
const deafultAuctionNames = [auction_name];
export default function AuctionPage() {
  const [network, setNetwork] = useState(WalletAdapterNetwork.Devnet);
  const connection = useMemo(() => new Connection(network === "mainnet-beta" ? RPC_MAINNET : RPC_DEVNET, "confirmed"), [network]);
  const [programID, setProgramID] = useState(idl.metadata.address);

  const wallet = useWallet();
  const anchorWallet = useAnchorWallet() as anchor.Wallet;
  function getProviderAndProgram() {
    const provider = new AnchorProvider(connection, anchorWallet, AnchorProvider.defaultOptions());

    const program = new Program(idl, programID, provider) as Program<Auction>;

    return { provider, program };
  }

  const [auctionData, setAuctionData] = useState<any>();

  const [tokenMint, setTokenMint] = useState(NATIVE_MINT.toString());
  const [newTokenMint, setNewTokenMint] = useState(NATIVE_MINT.toString());

  const tokens = [
    { symbol: 'SOL', address: NATIVE_MINT.toString() },
    { symbol: 'SKT', address: SPLTOKENS_MAP.get(eCurrencyType.SKT) },
    { symbol: 'FORGE', address: SPLTOKENS_MAP.get(eCurrencyType.FORGE) },
    { symbol: 'DUST', address: SPLTOKENS_MAP.get(eCurrencyType.DUST) },
    { symbol: 'USDC', address: SPLTOKENS_MAP.get(eCurrencyType.USDC) },
  ];

  const [tokenSymbol, setTokenSymbol] = useState('SOL');
  const [nftMintAddress, setNftMintAddress] = useState("");
  const [price, setPrice] = useState(0);
  const [duration, setDuration] = useState(1);
  const [auctionName, setAuctionName] = useState(auction_name);
  const [bidPrice, setBidPrice] = useState(0);
  const [auctionFinishTime, setAuctionFinishTime] = useState(new Date());

  useEffect(() => {
    const network = localStorage.getItem("network");
    if (network) {
      setNetwork(network as WalletAdapterNetwork);
    }
  }, []);

  async function createAuction() {
    try {
      const { provider, program } = getProviderAndProgram();
      const [auction] = await getAuctionAddress(program.programId, auctionName, provider.wallet.publicKey);
      const splTokenMint = new PublicKey(newTokenMint);
      const creator = provider.wallet.publicKey;
      const nftMint = new PublicKey(nftMintAddress);
      const creatorNftAta = await getAta(nftMint, creator);
      const auctionNftAta = await getAta(nftMint, auction, true);
      // const auctionTokenAta = await getAta(splTokenMint, auction, true);

      console.log("Connection:", provider.connection);
      console.log("Create Auction:");
      console.log("-> ProgramId:", program.programId.toString());
      console.log("-> Auction Name:", auctionName);
      console.log("-> Mint Address:", splTokenMint.toString());

      console.log(auctionName, new BN(price * LAMPORTS_PER_SOL).toNumber(), new BN(duration * 3600 * 24).toNumber());
      const transaction = new Transaction();
      transaction.add(
        program.transaction.createAuction(
          auctionName,
          new BN(price * LAMPORTS_PER_SOL),
          new BN(duration * 3600 * 24),
          splTokenMint,
          {
            accounts: {
              creator,
              auction,
              creatorNftAta,
              nftMint,
              auctionNftAta,
              systemProgram: SystemProgram.programId,
              tokenProgram: TOKEN_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              rent: SYSVAR_RENT_PUBKEY
            }
          }
        )
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

  async function updateAuctionDuration() {
    try {
      const { provider, program } = getProviderAndProgram();
      const [auction] = await getAuctionAddress(program.programId, auctionName, provider.wallet.publicKey);
      const creator = provider.wallet.publicKey;

      const transaction = new Transaction();
      transaction.add(
        program.instruction.updateAuction(new BN(duration * 3600 * 24), {
          accounts: {
            creator,
            auction,
          }
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

  async function bid() {
    try {
      const { provider, program } = getProviderAndProgram();
      const [auction] = await getAuctionAddress(program.programId, auctionName, provider.wallet.publicKey);
      const auctionData = await program.account.auction.fetchNullable(auction);
      if (!auctionData) return;

      const splTokenMint = auctionData.splTokenMint;
      const bidder = provider.wallet.publicKey;
      const auctionTokenAta = await getAta(splTokenMint, auction, true);
      const bidderAta = await getAta(splTokenMint, bidder);

      const lastBidder = auctionData.lastBidder;
      const lastBidderAta = await getAta(splTokenMint, lastBidder);

      const transaction = new Transaction();
      if (splTokenMint.toString() === NATIVE_MINT.toString()) {
        let instruction = await getCreateAtaInstruction(provider, bidderAta, splTokenMint, bidder);
        if (instruction) transaction.add(instruction);
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: bidder,
            toPubkey: bidderAta,
            lamports: bidPrice * LAMPORTS_PER_SOL,
          }),
          createSyncNativeInstruction(bidderAta)
        );
      }
      transaction.add(
        program.instruction.bid(
          new BN(bidPrice * LAMPORTS_PER_SOL),
          {
            accounts: {
              bidder,
              auction,
              splTokenMint,
              auctionTokenAta,
              bidderAta,
              lastBidder,
              lastBidderAta,
              tokenProgram: TOKEN_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              rent: SYSVAR_RENT_PUBKEY
            }
          }
        )
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

  async function transferToWinner() {
    try {
      const { provider, program } = getProviderAndProgram();
      const [auction] = await getAuctionAddress(program.programId, auctionName, provider.wallet.publicKey);
      const auctionData = await program.account.auction.fetchNullable(auction);
      if (!auctionData) return;

      const creator = provider.wallet.publicKey;
      // const winner = provider.wallet.publicKey;
      const winner = auctionData.lastBidder;
      const nftMint = auctionData.nftMint;
      const winnerNftAta = await getAta(nftMint, winner);
      const auctionNftAta = await getAta(nftMint, auction, true);

      const transaction = new Transaction();
      transaction.add(
        program.instruction.transferToWinner(
          {
            accounts: {
              creator,
              auction,
              auctionNftAta,
              nftMint,
              winner,
              winnerNftAta,
              tokenProgram: TOKEN_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              rent: SYSVAR_RENT_PUBKEY
            }
          }
        )
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

  async function withdrawToken() {
    try {
      const { provider, program } = getProviderAndProgram();
      const [auction] = await getAuctionAddress(program.programId, auctionName, provider.wallet.publicKey);
      const auctionData = await program.account.auction.fetchNullable(auction);
      if (!auctionData) return;

      const creator = provider.wallet.publicKey;
      const splTokenMint = auctionData.splTokenMint;
      const creatorTokenAta = await getAta(splTokenMint, creator);
      const auctionTokenAta = await getAta(splTokenMint, auction, true);

      const transaction = new Transaction();
      transaction.add(
        program.instruction.withdrawToken(
          {
            accounts: {
              creator,
              auction,
              creatorTokenAta,
              auctionTokenAta,
              tokenProgram: TOKEN_PROGRAM_ID,
            }
          }
        )
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

  async function fetchData() {
    if (!wallet.publicKey) return;
    const { provider, program } = getProviderAndProgram();

    console.log("Network: ", network);
    console.log("Program ID: ", program.programId.toString());
    console.log("Game Name: ", auctionName);

    const [auction] = await getAuctionAddress(program.programId, auctionName, provider.wallet.publicKey);
    const auctionData = await program.account.auction.fetchNullable(auction);
    setAuctionData(auctionData);
    console.log(auctionData);
    // @ts-ignore
    console.log("Auction Data:", auctionData);
    if (auctionData) {
      setTokenMint(auctionData.splTokenMint.toString());
      setTokenSymbol(tokens.filter(token => token.address === auctionData.splTokenMint.toString())[0].symbol);
      setNewTokenMint(auctionData.splTokenMint.toString());
      setBidPrice(auctionData.minBidPrice.toNumber() / LAMPORTS_PER_SOL);
      setAuctionFinishTime(new Date(auctionData.auctionFinishTime.toNumber()));
      setPrice(auctionData.minBidPrice.toNumber() / LAMPORTS_PER_SOL);
      setDuration((auctionData.auctionFinishTime.toNumber() - auctionData.auctionStartedTime.toNumber()) / 86400);
    }
  }

  async function withdraw() {
    try {

      toast.success('Success');
    } catch (error) {
      console.log(error);
      toast.error('Fail');
    }
  }

  useEffect(() => {
    fetchData();
  }, [wallet.connected, auctionName, network, programID]);

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
        <StorageSelect itemkey={"auction-programId"} label="Program ID" setItem={setProgramID} defaultItems={deafultProgramIDs} defaultItem={programID} />
        <StorageSelect itemkey={"auction-auctionname"} label="Game Name" setItem={setAuctionName} defaultItems={deafultAuctionNames} defaultItem={auction_name} />

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

        <div className="flex flex-col gap-2">

          <div className="flex gap-2">
            <div className="flex gap-1 items-center">
              Nft Mint:
              <input
                className="border-2 border-black p-2"
                onChange={(e) => {
                  setNftMintAddress(e.target.value);
                }}
                value={`${nftMintAddress}`}
              />
            </div>
            <div className="flex gap-2 items-center">
              Price:
              <input
                className="border-2 border-black p-2"
                type={"number"}
                min={0}
                step={0.01}
                onChange={(e) => {
                  setPrice(parseFloat(e.target.value || "0"));
                }}
                value={`${price}`}
              />
              {tokenSymbol}
            </div>
            <div className="flex gap-1 items-center">
              Duration:
              <input
                className="border-2 border-black p-2"
                type={"number"}
                min={0}
                step={0.01}
                onChange={(e) => {
                  setDuration(parseFloat(e.target.value || "0"));
                }}
                value={`${duration}`}
              />
              Day
            </div>
            {!auctionData ?
              <button className="border-2 border-black p-2" onClick={createAuction}>
                Create Auction
              </button> :
              <button className="border-2 border-black p-2" onClick={updateAuctionDuration}>
                Update Auction Duration
              </button>
            }
          </div>

          {auctionData && (
            <div className="flex flex-col gap-2">
              <div>Min Bid Price: {price}</div>
              <div>Acution Finishes at: {auctionFinishTime.toString()}</div>
              <div className="flex gap-1 items-center">
                <div className="flex gap-1 items-center">
                  Bid Price:
                  <input
                    className="border-2 border-black p-2"
                    type={"number"}
                    min={0}
                    step={0.01}
                    onChange={(e) => {
                      setBidPrice(parseFloat(e.target.value || "0"));
                    }}
                    value={`${bidPrice}`}
                  />
                  {tokenSymbol}
                </div>
                <button className="border-2 border-black p-2" onClick={bid}>
                  Bid
                </button>
              </div>
              <div className="flex">
                <button className="border-2 border-black p-2" onClick={transferToWinner}>
                  Transfer To Winner
                </button>
                <button className="border-2 border-black p-2" onClick={withdrawToken}>
                  Withdraw Token
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
