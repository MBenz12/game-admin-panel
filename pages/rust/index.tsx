import {
  bundlrStorage,
  BundlrStorageDriver, keypairIdentity,
  Metaplex, toMetaplexFile, walletAdapterIdentity
} from "@metaplex-foundation/js";
import * as anchor from '@project-serum/anchor';
import { Program, Provider, web3 } from '@project-serum/anchor';
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  BlockheightBasedTransactionConfirmationStrategy, Cluster, clusterApiUrl, Connection,
  LAMPORTS_PER_SOL, ParsedInstruction, ParsedTransactionWithMeta,
  PublicKey, Signer,
  SYSVAR_RENT_PUBKEY,
  Transaction
} from '@solana/web3.js';
import axios from "axios";
import bs58 from "bs58";
import { Buffer } from 'buffer';
import {
  CONNECTION_NETWORK, eCurrencyType, GLOBAL_ACCOUNT_SEED, NFT_VAULT_POOL_SEED, RAFFLE_STORE_BUYERS, REACT_APP_RAFFLES_PROGRAM_ID, REACT_APP_RAFFLE_VAULT_WALLET_ADDRESS, REACT_APP_SKT_TOKEN_ADDRESS, SOLANA_RPC_HOST_MAINNET,
  SPLTOKENS_MAP_GET_TOKEN_NAME, VAULT_ADDRESS, VAULT_SKT_SEED_PREFIX
} from "config/constants";
import { getAssociatedTokenAddressAndTransaction, raffleTransactionDataType } from "config/utils";
import { AnchorRaffleTicket } from "idl/anchor_raffle_ticket";
import { useEffect, useRef, useState } from 'react';
import {
  getAndPrintRaffleAccount,
  getBuyTicketTransactionBySOL,
  getBuyTicketTransactionBySPL, getInitRaffleTransaction, getRaffleAccount, getRaffleFinalizeTransaction, getTransferSPLTokenTransaction
} from "service/programsHelper";
import { callRafflesAPI } from "service/rafflesServiceProvider";
import { eRaffleType } from "types/enum/RaffleEnum";
import { initRaffleTransactionDataType, raffleFinalizeDataType } from "types/interface/RaffleInterface";
//import {writeJsonFile} from 'write-json-file';
import { CreateMetadataV2, DataV2, Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { saveAs } from 'file-saver';

const { SystemProgram, Keypair } = web3;
const idl_raffle = require('idl/anchor_raffle_ticket.json');
const token_image = require("minting/Token_800.jpg");
const wl_image = require("minting/WL_800.jpg");
const onchain_json = require("minting/OnChain.json");
const uri_json = require("minting/URI.json");

const programID = REACT_APP_RAFFLES_PROGRAM_ID;
require("@solana/wallet-adapter-react-ui/styles.css");


export default function Rust()
{
  // const {connection} = useConnection();
  const [connection, setConnection] = useState(new Connection(clusterApiUrl('devnet'), "confirmed"));
  const [value, setValue] = useState(null);
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet() as anchor.Wallet;

  const [raffleAddress, setRaffleAddress] = useState<PublicKey>(PublicKey.default);
  const [ticketsAmount, setTicketsAmount] = useState(1);
  const [splTokenAddress, setSPLTokenAddress] = useState(PublicKey.default.toString());
  const [splTokenAddressTransfer, setSplTokenAddressTransfer] = useState(PublicKey.default);
  const [vaultAddress, setVaultAddress] = useState("Insert Vault Address...");
  const [globalAddress, setGlobalAddress] = useState("Insert Global Address or Admin Address...");
  const [delegatorAddress, setDelegatorAddress] = useState("Insert Delegator Address...");
  const [nftMintAddress, setNftMintAddress] = useState("Insert NFT Mint Address to Delegate");
  const [targetAddress, setTargetAddress] = useState("Insert Target Address to Send NFT");
  const [ownerAddress, setOwnerAddress] = useState("Insert Owner Address of NFT to Send");
  const [network, setNetwork] = useState<Cluster>('devnet');

  const raffleAddressInput = useRef<HTMLInputElement>(null);

  const [raffleOutput, setRaffleOutput] = useState();

  const raffleAddressInput1 = useRef<HTMLInputElement>(null);
  const raffleNftWinnerTxInput = useRef<HTMLInputElement>(null);
  const raffleRafflerTxInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
      const url = network == "mainnet-beta" ? "https://quiet-aged-frog.solana-mainnet.quiknode.pro/6a56c0f12de472ff85a245955e5ff33d99704b1a" : clusterApiUrl(network);
      const connection = new Connection(url, "confirmed");
      setConnection(connection);
      console.log(connection);
  }, [network]);

  const sleep = (milliseconds: number) => {
      return new Promise(resolve => setTimeout(resolve, milliseconds))
  }

  function getProviderAndProgram()
  {
      const provider = new Provider(connection, anchorWallet, Provider.defaultOptions());

      const program = new Program(idl_raffle, programID, provider) as Program<AnchorRaffleTicket>;

      return { provider, program };
  }

  async function getSOLBalance(account: PublicKey)
  {
      const { program } = getProviderAndProgram();
      return (await program.provider.connection.getBalance(account)) / LAMPORTS_PER_SOL;
  }

  async function getSPLTokensBalance(account: PublicKey, filterMint: string = "")
  {
      const { program } = getProviderAndProgram();

      const solBalance = (await program.provider.connection.getBalance(account)) / LAMPORTS_PER_SOL;
      const balance = await program.provider.connection.getParsedTokenAccountsByOwner(account, { programId: TOKEN_PROGRAM_ID });

      if (balance.value)
      {
          console.log(`============================================================================================================================`);
          console.log(`SOL Balance: ${solBalance} SOL`);
          console.log(`SPL Tokens Balance for ${account.toString()}:`);
          balance.value.forEach((accountInfo) => {
              let pubKey = accountInfo.pubkey.toBase58();
              let mint = accountInfo.account.data["parsed"]["info"]["mint"];
              let owner = accountInfo.account.data["parsed"]["info"]["owner"];
              let decimal = accountInfo.account.data["parsed"]["info"]["tokenAmount"]["decimals"];
              let amount = accountInfo.account.data["parsed"]["info"]["tokenAmount"]["amount"];
              if (filterMint && mint == filterMint || !filterMint) {
                  console.log(`Mint: ${mint} | ATA: ${pubKey} | ${Math.ceil(Number(amount))} | ${Math.ceil(amount / LAMPORTS_PER_SOL)}`);
                  //console.log(`owner: ${owner} | pubKey: ${pubKey}`);
              }
          });
          console.log(`============================================================================================================================`);
      }
  }

  async function updateMetaDataToken()
  {
      console.log(connection);
      const updateAuth = new PublicKey("[update auth]");
      const mint = new PublicKey("[spl token mint address]");
      const metadataPDA2 = await Metadata.getPDA(mint);
      console.log(metadataPDA2)

      const tokenMetadata = new DataV2();
      console.log(tokenMetadata);

      // For new tokens we must CREATE FIRST !
      const metax = new CreateMetadataV2({ feePayer: wallet.publicKey },
      {
          updateAuthority: updateAuth,
          mint: mint,
          mintAuthority: updateAuth,
          metadata: metadataPDA2,
          metadataData: tokenMetadata
      });

      // This is used to update TOKENS !
      // const metax = new UpdateMetadataV2({ feePayer: wallet.publicKey },
      //     {
      //         metadata: metadataPDA2,
      //         metadataData: tokenMetadata,
      //         updateAuthority: updateAuth,
      //         newUpdateAuthority: updateAuth,
      //         primarySaleHappened: true,
      //         isMutable: true
      //     });
      console.log(metax);

      const updateMetadataTransaction = new Transaction().add(metax);

      const tx = await wallet.sendTransaction(updateMetadataTransaction, connection);
      console.log("DONE!", tx);
  }

  async function updateMetaData()
  {
      // https://github.com/metaplex-foundation/js#uploadMetadata
      console.log(connection);
      const metaplex = Metaplex.make(connection)
          .use(walletAdapterIdentity(wallet));

      const mintAddress = new PublicKey("xxxxx");
      const nft = await metaplex.nfts().findByMint({ mintAddress }).run();
      console.log(nft);

      return;

      // const nftRes = await metaplex
      //     .nfts()
      //     .update({
      //         nftOrSft: nft,
      //         name: "Sol Kitties #3045",
      //         sellerFeeBasisPoints: 8000,
      //     })
      //     .run();
      //
      // console.log(nftRes.response);

      // Create new ARWEAVE file
      const { uri: newUri } = await metaplex
          .nfts()
          .uploadMetadata({
              ...nft.json,
              seller_fee_basis_points: 8000,
          })
          .run();

      console.log(newUri);

      // Update chain URI
      const nftRes2 = await metaplex
          .nfts()
          .update({
              nftOrSft: nft,
              uri: newUri
          })
          .run();

      console.log(nftRes2.response);
  }

  //const sliceMax = 20;
  const KCGreaterThan = 3;
  const maxPerTransactions = 10;
  const loopCount = 1;
  const convertKCtoSKTKP = ''
  async function convertKCtoSKTFinalized()
  {
      console.log(connection);

      const saved = localStorage.getItem("kittiesWithKC_TX");
      const users = JSON.parse(saved!);

      console.log("Confirming...");
      for (const user of users)//.slice(0, sliceMax))
      {
          if (user.txId && !user.txIdConfirmed) // && (user.userId == 216834139989606401 || user.userId == 697870826640375819 || user.userId == 772732866844688385))
          {
              try
              {
                  // @ts-ignore
                  console.log(`${user.userId} ${user.userName} | https://solscan.io/tx/${user.txId}?cluster=${CONNECTION_NETWORK == WalletAdapterNetwork.Mainnet ? "mainnet" : "devnet"}`);
                  const confirmation: ParsedTransactionWithMeta | null = await connection.getParsedTransaction(user.txId);
                  //console.log(confirmation);

                  if (confirmation && confirmation.meta && !confirmation.meta.err)
                  {
                      let sentCoinsFromChain = 0;
                      let sentCoinsFromChainNotRounded = 0;
                      let sentCoinsFromChainRounded = 0;
                      // Find the right instruction and get the coins amount value
                      for (const instruction of confirmation.transaction.message.instructions)
                      {
                          const parsedInstruction = (instruction as ParsedInstruction).parsed;
                          if (parsedInstruction.type == "transfer")
                          {
                              //console.log(parsedInstruction.info.destination)
                              //console.log(user);
                              if (user.userWalletATA == parsedInstruction.info.destination)
                              {
                                  sentCoinsFromChainNotRounded = parsedInstruction.info.amount / LAMPORTS_PER_SOL;
                                  sentCoinsFromChainRounded = Math.round(sentCoinsFromChainNotRounded * 10000) / 10000; // round float point

                                  //console.log(sentCoinsFromChainNotRounded);
                                  //console.log(sentCoinsFromChainRounded);

                                  sentCoinsFromChain = sentCoinsFromChainNotRounded == user.userCoins ? sentCoinsFromChainNotRounded : sentCoinsFromChainRounded;
                              }

                              // if (sentCoinsFromChainNotRounded == user.userCoins || sentCoinsFromChainRounded == user.userCoins)
                              //     break;
                          }
                      }

                      // Only if coins match db == chain then we can proceed
                      if (sentCoinsFromChainNotRounded == user.userCoins || sentCoinsFromChainRounded == user.userCoins)
                      {
                          user.txIdConfirmed = true;
                          const result = await callRafflesAPI("finalizedConvertKCtoSKT",
                              {
                                  userId: user.userId,
                                  userName: user.userName,
                                  userCoins: sentCoinsFromChain//user.userCoins, // safer
                              });

                          console.log(result)
                      }
                      else
                      {
                          console.error(`${user.userId} ${user.userName} coins mismatched. DB: ${user.userCoins} Chain: ${sentCoinsFromChain}`);
                      }
                  }
                  else
                  {
                      console.error("Error confirming txId", user.txId);
                      console.error("-->", confirmation);
                  }
              }
              catch (e)
              {
                  console.error(e);
              }
          }
      }

      localStorage.setItem("kittiesWithKC_TX", JSON.stringify(users));
      console.log("All DONE!", users.length);
  }

  async function convertKCtoSKT()
  {
      for (let i=1; i <= loopCount; i++)
      {
          console.log(`Loop #${i}`);

          await convertKCtoSKT_Start();
          await sleep(5000);

          console.log(`Loop #${i} DONE!`);
      }
  }

  async function convertKCtoSKT_Start()
  {
      console.log(connection);

      if (!convertKCtoSKTKP) {
          console.error("No $SKT KP found");
          return;
      }

      const KPWallet = Keypair.fromSecretKey(bs58.decode(convertKCtoSKTKP));

      const refresh = true; // important to fetch every time if we use slice! dangerous if not

      if (refresh)
      {
          console.log("Fetching conversion list from backend...");
          const kittiesWithKC = await callRafflesAPI("convertKCtoSKT", {KCGreaterThan: KCGreaterThan});
          localStorage.setItem("kittiesWithKC", JSON.stringify(kittiesWithKC));
      }

      const saved = localStorage.getItem("kittiesWithKC");
      const users = JSON.parse(saved!);
      console.log("Total:", users.length, "Greater Than Coins:", KCGreaterThan);

      let transactions: Transaction[] = [];
      let transactionsChained: Transaction = new Transaction();
      let transactionsData = [];
      let transactionCount = 0;
      // go over all users and create transaction instructions
      for (const user of users)//.slice(0, sliceMax))
      {
          //if (user.userName != "JokerKitty")
              //continue;
          if (transactionCount >= maxPerTransactions)
              break;

          const userId = user.userId;
          const userName = user.userName;
          const userCoins = user.userCoins;
          const userWallets: [] = user.walletAddress;
          const userWalletsMap = userWallets.map((walletItem:any) => {return walletItem.walletAddress});
          let userWallet = userWalletsMap[0];

          if (user.userName == "JokerKitty")
              userWallet = userWalletsMap[3];

          if (!userWallet)
              continue;

          console.log(userId, userName, userCoins, userWallets.length, userWallet, userWalletsMap);

          const destPublicKey = new PublicKey(userWallet);
          const sktTokenPublicKey = new PublicKey(REACT_APP_SKT_TOKEN_ADDRESS);
          const ataAndTransaction = await getAssociatedTokenAddressAndTransaction(connection, sktTokenPublicKey, KPWallet.publicKey, destPublicKey);

          const amount = userCoins * LAMPORTS_PER_SOL;

          //console.log(destPublicKey.toString(), sktTokenPublicKey.toString(), userCoins);

          ataAndTransaction.transaction.add(Token.createTransferInstruction(TOKEN_PROGRAM_ID, ataAndTransaction.sourceATA, ataAndTransaction.recipientATA, KPWallet.publicKey, [], amount));
          ataAndTransaction.transaction.feePayer = KPWallet.publicKey;
          ataAndTransaction.transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

          transactionsChained.add(ataAndTransaction.transaction);
          transactions.push(ataAndTransaction.transaction);
          transactionsData.push(
              {
                  user: user,
                  userId: userId,
                  userName: userName,
                  userWallet: userWallet,
                  userCoins: userCoins,
                  transaction: ataAndTransaction.transaction
              }
          );

          user.userWalletATA = ataAndTransaction.recipientATA;

          transactionCount++;
      }

      // // Sign all transactions
      // await anchorWallet.signAllTransactions(transactions);
      //console.log(transactions);
      //console.log(transactionsChained);
      //console.log(transactionsData)

      if (transactionsChained.instructions.length == 0)
      {
          console.log("No Instructions, exiting...");
          return;
      }

      // Send all transactions in one transaction
      const txId = await connection.sendTransaction(transactionsChained,[KPWallet]); //wallet.sendTransaction(transactionsChained, connection);
      console.log("Confirming txId...");

      let done = false;
      let retries = 10;
      try
      {
          while (!done && retries > 0)
          {
              await connection.confirmTransaction(txId, 'processed');
              // @ts-ignore
              console.log(`-> Processed txId: https://solscan.io/tx/${txId}?cluster=${CONNECTION_NETWORK == WalletAdapterNetwork.Mainnet ? "mainnet" : "devnet"}`, txId);

              done = true;
          }
      }
      catch (e)
      {
          await sleep(2000);
          retries--;
      }

      // Go over signed transactions and send them
      for (const transactionData of transactionsData)
      {
          console.log(transactionData);
          const destPubKey = new PublicKey(transactionData.userWallet);
          const userCoins = transactionData.userCoins;
          const transaction = transactionData.transaction;

          console.log(`-> Sent ${userCoins} $SKT to ${destPubKey.toString()}`);
          //const txId = await connection.sendRawTransaction(transaction.serialize());
          //await connection.confirmTransaction(txId, 'processed');
          //console.log(`-> Processed txId: https://solscan.io/tx/${txId}?cluster=${CONNECTION_NETWORK == WalletAdapterNetwork.Mainnet ? "mainnet" : "devnet"}`, txId);

          transactionData.user.txId = txId;
      }

      localStorage.setItem("kittiesWithKC_TX", JSON.stringify(users));
      console.log("Total:", users.length, "Greater Than Coins:", KCGreaterThan);


      await sleep(5000);
      await convertKCtoSKTFinalized();
      await sleep(1000);
      await convertKCtoSKTFinalized(); // do again just in case
  }

  const json_exports = async () =>
  {
      const {idStart, idEnd} = {idStart: 1, idEnd: 221};

      //const json_template = card_json;
      const json_template = JSON.parse(
`
{    
}
`);

      console.log(json_template);
      for (let i = idStart; i <= idEnd; i++)
      {
          // @ts-ignore
          json_template.name = `[name] #${i+1}`;
          // @ts-ignore
          json_template.image = `${i}.png`;
          // @ts-ignore
          json_template.properties.files[0].uri = `${i}.png`;

          const blob = new Blob([JSON.stringify(json_template, null, 4)], { type: 'application/json' });
          saveAs(blob, `${i}.json`);

          // if some files are missing increase value below and try again
          await sleep(100);
      }
  }

  const updateNftURI = async () =>
  {
      const connectionMainnet = new Connection(SOLANA_RPC_HOST_MAINNET);
      console.log(connectionMainnet);

      const keypair = Keypair.fromSecretKey(bs58.decode('[fill private]'));

      const bundlrMainnet = { address: 'https://node1.bundlr.network',  providerUrl: 'https://api.mainnet-beta.solana.com', timeout: 60000};
      const metaplex = Metaplex.make(connection)
          .use(walletAdapterIdentity(wallet));

      const bundlrStorage = metaplex.storage().driver() as BundlrStorageDriver;
      const bal = await bundlrStorage.getBalance();
      console.log("Balance:", bal.basisPoints.toNumber());
      if (bal.basisPoints.toNumber() < 50000) {
          const r = await (await bundlrStorage.bundlr()).fund(200000); // not needed everytime, fund as needed
          console.log(r);
      }

      let offset = 0;
      let updateAmount = 25;
      let pages = 5;
      let count = 0;
      let nftsDatas = [];
      for (let i=1; i<pages; i++)
      {
          offset = i * 25;
          console.log("Page:", i+1);

          const url = `https://api.solscan.io/collection/nft?sortBy=nameDec&collectionId=92fd50b965f82b84ee701085ce9368ee36034e0a7f7a2829306d275825537955&offset=${offset}&limit=25`;
          const nfts = (await axios.get(url)).data;
          count += nfts.data.length;
          for (const nftData of nfts.data)
          {
              nftsDatas.push(nftData);
              console.log(nftData.info.mint);
          }

          await sleep(200);
      }
      console.log(count);
      console.log(nftsDatas);

      console.log("Starting...", count);
      let index = 1;
      for (const nftData of nftsDatas)
      {
          const nftMintGoodImageUrl = nftData.info.meta.image;
          const nftMintAddress = nftData.info.mint as string;
          const nftMintAddressPubKey = new PublicKey(nftMintAddress);
          const nftRes = await metaplex.nfts().findByMint({ mintAddress: nftMintAddressPubKey }).run();
          const nftMintOldImageUrl = nftRes.json!.image;
          console.log("good",nftMintGoodImageUrl);
          console.log("old",nftMintOldImageUrl);

          console.log(nftMintAddress, nftMintOldImageUrl, " => ", nftMintGoodImageUrl, "\n", `https://solscan.io/token/${nftMintAddress}#metadata`);
          console.log(nftRes)
          //const newUri = "https://arweave.net/wUX-me0ZNT0Hqn8g9XiBb8CNtKvWo3ESVcSBJ8UZ3QI";
          const { uri: newUri } = await metaplex.use(keypairIdentity(keypair))
              .nfts()
              .uploadMetadata({
                  ...nftRes.json,
                  image: nftMintGoodImageUrl,
                  properties: {
                      files: [{
                          uri: nftMintGoodImageUrl,
                          type: "image/png"
                      }],
                      creators: nftRes.json!.properties!.creators
                  }
              })
              .run();

          console.log("New URI", newUri);

          const { nft: updatedNft }: any = await metaplex.use(keypairIdentity(keypair))
              .nfts()
              .update({
                  nftOrSft: nftRes,
                  name: "The Holy 100",
                  uri: newUri,
                  creators: nftRes.creators,
                  collection: nftRes.collection!.address,
                  collectionAuthority: keypair
              })
              .run();

          console.log("DONE!", `${index}#`, `https://solscan.io/token/${nftMintAddress}#metadata`, "\n");
          console.log("");

          index++;
      }

      console.log("Fully DONE!");
      return;
  }


  /*
  The correct way is to getTokenLargestAccounts for a tokenMint
  Then look at postTokenBalances and check in the array that seller is 0 and buyer is 1
  This will mean a buy took place on chain level
   */
  const mintTrackerWIP = async () =>
  {
      /* Phase1 - First we need to get all mints for a collection */
      console.log("Start Phase1");
      const creator2 = new PublicKey("4Y5JRaBkqzJbctaddYsQqeQ5FQAkjuGEkSM2pAxwEcqs");
      const creator = new PublicKey("PUNKRAqYJbaLTNjMPeLBk23TzaNvWWsTtFZcPABgjDi");

      //console.log(connection);
      //const metaplex = Metaplex.make(connection);
      //const nfts = await metaplex.nfts().findAllByCreator({ creator, position: 2 }).run();
      //console.log("Result:");
      //console.log(nfts);
      /* Phase1 - End */


      /*
         Phase2 - get all transactions for token mint
         Then look for each transaction if a new sale happened
      */
      const tokenMint = new PublicKey("BxkaW4Mp2f1WKLjfCqAhvtSoPZpVg7EGzLcMuZSGuk8a");
      const largestAccounts = await connection.getTokenLargestAccounts(new PublicKey(tokenMint));
      const tokenAccount = largestAccounts.value[1].address;
      //console.log(tokenAccount.toString());
      const sigs = await connection.getSignaturesForAddress(new PublicKey(tokenMint));
      //console.log(sigs)
      for (const sig of sigs)
      {
          const tx = await connection.getParsedTransaction(sig.signature);

          console.log(sig.signature);
          console.dir(tx!.meta!.preTokenBalances!);
          console.dir(tx!.meta!.postTokenBalances!);
          console.log("=====");
      }
  }

  const encrypt = async () =>
  {
      //await json_exports();
      //updateNftURI();
      // const imageURI = await uploadImageToArweave(temp);
      // console.log("imageURI:", imageURI);

      //const jsonURI = await uploadJSONToArweave(temp2);
      //console.log("jsonURI:", jsonURI);

      //const metaplex = Metaplex.make(connection)
      //const mintAddress = new PublicKey("2wt9CWuhSayzVMoHBCTEdwT8sKi8bJfdxQmCBRZ6SA3m");
      //const nftRes = await metaplex.nfts().findByMint({ mintAddress }).run();
      //console.log(nftRes);

      //await json_exports();
      //const kp = Keypair.fromSecretKey(bs58.decode(''));
      //console.log(kp.secretKey.toString());

      // Encode anything as bytes
      // const message = new TextEncoder().encode(data.removeUserWalletAddress);
      //
      // // Sign the bytes using the wallet
      // const signature = await signMessage(message);
      //
      // // Verify that the bytes were signed using the private key that matches the known public key
      // if (!sign.detached.verify(message, signature, publicKey.toBytes()))
      //     throw new Error("Invalid signature!");
      //
      // console.log(`Message signature: ${bs58.encode(signature)}`);
  }

  // https://github.com/metaplex-foundation/js
  function getMetaplex(): Metaplex
  {
      //const bundlrMainnet = {};
      const bundlrMainnet = { address: 'https://node1.bundlr.network',  providerUrl: 'https://api.mainnet-beta.solana.com', timeout: 60000};
      const bundlrDevnet = { address: 'https://devnet.bundlr.network',  providerUrl: 'https://api.devnet.solana.com', timeout: 60000}
      // @ts-ignore
      const bundlrNetwork = CONNECTION_NETWORK == WalletAdapterNetwork.Devnet ? bundlrDevnet : bundlrMainnet;
      const metaplex = Metaplex.make(connection)
          .use(walletAdapterIdentity(wallet))
          .use(bundlrStorage(bundlrNetwork));

      return metaplex;
  }

  async function uploadImageToArweave(imageUrl: any)
  {
      const metaplex = getMetaplex();
      console.log(metaplex.connection);
      const file_wl_image_content = await axios.get(imageUrl,  { responseType: 'arraybuffer' })
      const file_wl_image = toMetaplexFile(Buffer.from(file_wl_image_content.data, "utf-8"), 'metaplexFile.txt');
      const imageURI = await metaplex.storage().upload(file_wl_image);

      return imageURI;
  }

  async function uploadJSONToArweave(chain_json: any)
  {
      const metaplex = getMetaplex();

      const file_wl_uri_json = toMetaplexFile(Buffer.from(JSON.stringify(chain_json, null, 4)), 'metaplexFile.txt');
      const jsonURI = await metaplex.storage().upload(file_wl_uri_json);

      return jsonURI;
  }

  async function mintTokenFromMainnet()
  {
      console.log(connection);

      const connectionMainnet = new Connection(SOLANA_RPC_HOST_MAINNET);
      console.log(connectionMainnet);

      const mintAddress = new PublicKey("8LA7QikrF9e8z1gFBzPSYHKcKGmi1KBwRqn28X3BSiSS");
      const metaplexMainnet = Metaplex.make(connectionMainnet).use(walletAdapterIdentity(wallet));
      const nft = await metaplexMainnet.nfts().findByMint({ mintAddress }).run();

      console.log(nft);

      const mintAmount = 1;
      onchain_json.name = nft.name;
      onchain_json.symbol = nft.symbol;
      onchain_json.uri = nft.uri;
      onchain_json.creators[0].address = wallet.publicKey!; // TODO - new keypair, fund, and make it creator address for good seperation on phantom
      onchain_json.creators[1].address = nft.creators[1].address;

      console.log(metaplexMainnet.identity());
      const nftBuilder = await metaplexMainnet
          .nfts()
          .create(onchain_json)
          .run();

      console.log(nftBuilder);
  }

  async function mintToken()
  {
      console.log(connection);
      const name = "Raffle Token";
      const symbol = "SKT-Token";
      const mintAmount = 1;

      // Upload image to arweave and get uri
      const imageURI = await uploadImageToArweave(token_image);
      console.log("imageURI:", imageURI);

      // Upload WL URI JSON
      uri_json.name = name;
      uri_json.symbol = symbol;
      uri_json.image = imageURI;
      uri_json.properties.files[0].uri = imageURI;
      uri_json.properties.creators[0].address = wallet.publicKey!.toString();
      const jsonURI = await uploadJSONToArweave(uri_json);
      console.log("uri_json", jsonURI);

      onchain_json.name = name;
      onchain_json.symbol = symbol;
      onchain_json.uri = jsonURI;
      onchain_json.creators[0].address = wallet.publicKey!;
      onchain_json.creators[1].address = new PublicKey(onchain_json.creators[1].address);

      await mintFromOnChainJSON(onchain_json, mintAmount);
  }

  async function mintWL()
  {
      const name = "Raffle WL";
      const symbol = "SKT-WL";
      const mintAmount = 1;

      // Upload image to arweave and get uri
      const imageURI = await uploadImageToArweave(wl_image);
      console.log("imageURI:", imageURI);

      // Upload WL URI JSON
      uri_json.name = name;
      uri_json.symbol = symbol;
      uri_json.image = imageURI;
      uri_json.properties.files[0].uri = imageURI;
      uri_json.properties.creators[0].address = wallet.publicKey!.toString();
      const jsonURI = await uploadJSONToArweave(uri_json);
      console.log("uri_json", jsonURI);

      onchain_json.name = name;
      onchain_json.symbol = symbol;
      onchain_json.uri = jsonURI;
      onchain_json.creators[0].address = wallet.publicKey!;
      onchain_json.creators[1].address = new PublicKey(onchain_json.creators[1].address);

      await mintFromOnChainJSON(onchain_json, mintAmount);
  }

  async function mintFromOnChainJSON(json: any, mintAmount: number)
  {
      const txs: Transaction[] = [];
      const metaplex = getMetaplex();

      for (let i = 1; i <= mintAmount; i++)
      {
          const nftBuilder = await metaplex
              .nfts()
              .builders()
              .create(json);

          const tx = nftBuilder.toTransaction();

          const tokenSinger = nftBuilder.getSigners()[2] as Signer;

          tx.feePayer = anchorWallet.publicKey;
          tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
          tx.sign(tokenSinger);

          txs.push(tx);
      }

      const signedTXs = await anchorWallet.signAllTransactions(txs);
      console.log("signedTXs:", signedTXs);

      console.log(`Minted ${mintAmount}:`);
      await Promise.all(signedTXs.map(async (signedTx: Transaction, index: number, array: Transaction[]) =>
      {
          const txId = await connection.sendRawTransaction(signedTx.serialize());
          await connection.confirmTransaction(txId, 'processed');
          console.log(`Processed txId: https://solscan.io/tx/${txId}?cluster=devnet`);
      }));
  }

  async function finalizeRaffle()
  {
      const { program } = getProviderAndProgram();

      const raffleAccount = await fetchRaffle();
      const raffleDB = await callRafflesAPI("getRaffleByRaffleAddress", raffleAddress);
      const raffleWinnerWalletAddressArray = raffleDB.success ? raffleDB.data.raffleWinnerWalletAddress : [];
      const raffleWinnerWalletAddress = raffleWinnerWalletAddressArray.length > 0 ? raffleWinnerWalletAddressArray[0].userWalletAddress : [];

      console.log("Raffle in DB:", raffleDB.data);

      const raffleFinalizeDataType: raffleFinalizeDataType =
      {
          provider: program.provider,
          raffleAddress: raffleAddress,
          raffleBank: new PublicKey(REACT_APP_RAFFLE_VAULT_WALLET_ADDRESS),
          owner: new PublicKey(raffleAccount.owner), // raffle owner
          winner: new PublicKey(raffleWinnerWalletAddress), // nft winner
          splAddress: new PublicKey(raffleAccount.tokenSplAddress),
          nftMint: new PublicKey(raffleAccount.nftMintAddress),
          raffleRoyalties: 5,
      };

      const transaction = await getRaffleFinalizeTransaction(raffleFinalizeDataType);

      console.log("Sending the transaction...");
      const txSignature = await wallet.sendTransaction(transaction, program.provider.connection);
      await program.provider.connection.confirmTransaction(txSignature, "confirmed");
      console.log("DONE:", txSignature);
      // @ts-ignore
      console.log(`https://solscan.io/tx/${txSignature}?cluster=${CONNECTION_NETWORK == WalletAdapterNetwork.Mainnet ? "mainnet" : "devnet"}`);
  }

  async function initRaffle()
  {
      const { program } = getProviderAndProgram();

      console.log("Connected Wallet:", program.provider.wallet.publicKey.toString());
      console.log(connection);

      // const tokenType = PublicKey.default;
      //const tokenType = new PublicKey("ASxC3n3smkcUkA7Z58EUKZ2NfHoQ8eZrkTRK7ergYr2a"); // $CRECK devnet
      // const tokenType = new PublicKey("DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ");
      const tokenType = new PublicKey(splTokenAddress);
      console.log('token type:', tokenType.toString());

      const raffle = Keypair.generate();
      console.log("raffle :", raffle.publicKey.toString());
      console.log(raffle.secretKey.toString());

      let raffleAccount = await getAndPrintRaffleAccount(raffle.publicKey, connection, anchorWallet);

      if (!raffleAccount)
      {
          const price = 0.3;
          const priceBN = new anchor.BN(Math.ceil(price * anchor.web3.LAMPORTS_PER_SOL));
          const amount = 8;

          // @ts-ignore
          const tx = await program.rpc.initialize(tokenType, priceBN, amount,
              {
                  accounts: {
                      payer: wallet.publicKey,
                      raffle: raffle.publicKey,
                      systemProgram: SystemProgram.programId,


                  },
                  signers: [raffle]
              });

          console.log("Step-2 DONE", tx);

          let raffleAccountDeployed = await getAndPrintRaffleAccount(raffle.publicKey, connection, anchorWallet);
      }
  }

  async function fetchGlobal()
  {
      const { program } = getProviderAndProgram();
      const [globalProgAddress] = await PublicKey.findProgramAddress([Buffer.from(GLOBAL_ACCOUNT_SEED)], program.programId);

      const globalAccount = await program.account.global.fetchNullable(globalProgAddress);

      const out =
      {
          authority: globalAccount!.authority.toString(),
          authorizedAdmins: globalAccount!.authorizedAdmins.map(authAdminPubKey => { return authAdminPubKey.toString(); })
      };

      console.log("Global Account:", out);

      return globalAccount;
  }

  async function announceRaffleFinalized()
  {
      const raffleAddress = raffleAddressInput1.current!.value;
      const raffleNftWinnerTx = raffleNftWinnerTxInput.current!.value.includes("Enter") ? "" : raffleNftWinnerTxInput.current!.value;
      const raffleRafflerTx = raffleRafflerTxInput.current!.value.includes("Enter") ? "" : raffleRafflerTxInput.current!.value;

      console.log(raffleAddressInput1.current!.value);
      console.log(raffleNftWinnerTxInput.current!.value);
      console.log(raffleRafflerTxInput.current!.value);

      const url = `https://api.servica.io/test?announce=${raffleAddress}&nftwinner=${raffleNftWinnerTx}&raffler=${raffleRafflerTx}`;
      await axios.get(url);
  }

  async function initGlobal()
  {
      const { program } = getProviderAndProgram();

      console.log(program.provider.connection);
      console.log(program.programId.toString());
      console.log(program.provider.wallet.publicKey.toString());

      const [globalProgAddress] = await PublicKey.findProgramAddress([Buffer.from(GLOBAL_ACCOUNT_SEED)], program.programId);

      console.log("Global:", globalProgAddress.toString());

      const tx = program.transaction.initializeGlobal({
          accounts: {
              payer: program.provider.wallet.publicKey,
              global: globalProgAddress,
              admin: program.provider.wallet.publicKey,
              systemProgram: SystemProgram.programId
          },
      });

      const txSignature = await wallet.sendTransaction(tx, program.provider.connection);

      await program.provider.connection.confirmTransaction(txSignature, "confirmed");
      console.log("Global Address: ", globalProgAddress.toString());

      await fetchGlobal();
  }

  async function addAdmin(newAdmin: PublicKey, isAdd: boolean)
  {
      const { program } = getProviderAndProgram();

      console.log("Connection:", program.provider.connection);
      console.log("ProgramId:", program.programId.toString());
      console.log("Signer:", program.provider.wallet.publicKey.toString());

      const [globalProgAddress] = await PublicKey.findProgramAddress([Buffer.from(GLOBAL_ACCOUNT_SEED)], program.programId);
      console.log(`%cGlobal: ${globalProgAddress.toString()}` ,"color:green");

      let tx;
      if (isAdd)
      {
          console.log("Add Admin Wallet:", newAdmin.toString());

          tx = program.transaction.authorizeAdmin({
              accounts: {
                  authority: program.provider.wallet.publicKey,
                  global: globalProgAddress,
                  admin: newAdmin,
              },
          });
      }
      else
      {
          console.log("Remove Admin Wallet:", newAdmin.toString());

          tx = program.transaction.unauthorizeAdmin({
              accounts: {
                  authority: program.provider.wallet.publicKey,
                  global: globalProgAddress,
                  admin: newAdmin,
              },
          });
      }

      const txSignature = await wallet.sendTransaction(tx, program.provider.connection);

      await program.provider.connection.confirmTransaction(txSignature, "confirmed");
      console.log("Global Address: ", globalProgAddress.toString());

      const globalAccount = await fetchGlobal();
  }


  async function withdrawFromPda() {
      const { program } = getProviderAndProgram();
      const raffle = new PublicKey("FAApzUJoA9uBvjV9m9cktyJ7SaoVpmyLN72FeBVJrjZu");
      const global = new PublicKey("syfj4o1eSqPyeGfWvnEgdNwUjTd9h4tPe5e939jB6FW");
      const nftMint = new PublicKey("EQLFPM57Mh79HABtkeAE7qXxQQDBe2apqHVkhzzAmXeG");
      const destPublicKey = new PublicKey("EF5qxGB1AirUH4ENw1niV1ewiNHzH2fWs7naQQYF2dc");
      const [rafflePool] = await PublicKey.findProgramAddress(
          [
              Buffer.from("raffle_pool"),
              raffle.toBuffer(),
          ],
          program.programId
      );

      const rafflePoolAta = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, nftMint, rafflePool, true);
      let recipientATA = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, nftMint, destPublicKey);
      const receiverAccount = await connection.getAccountInfo(recipientATA);

      console.log("NFT Mint:", nftMint.toString());
      console.log("Raffle:", raffle.toString());
      console.log("RafflePool:", rafflePool.toString());
      console.log("RafflePool ATA:", rafflePoolAta.toString());
      console.log("Recipient:", destPublicKey.toString());
      console.log("Recipient ATA:", recipientATA.toString());


      let transaction = new Transaction();
      if (receiverAccount === null) {
          console.log("Creating recipientATA:", recipientATA.toString());

          transaction.add(
              Token.createAssociatedTokenAccountInstruction(
                  ASSOCIATED_TOKEN_PROGRAM_ID,
                  TOKEN_PROGRAM_ID,
                  nftMint,
                  recipientATA,
                  destPublicKey,
                  program.provider.wallet.publicKey
              )
          );
      }

      transaction.add(
          program.transaction.withdrawFromPda(new anchor.BN(1), {
              accounts: {
                  admin: program.provider.wallet.publicKey,
                  global,
                  raffle,
                  rafflePool,
                  rafflePoolAta,
                  dstAta: recipientATA,
                  tokenProgram: TOKEN_PROGRAM_ID,
                  systemProgram: SystemProgram.programId
              }
          })
      );

      const txSignature = await wallet.sendTransaction(transaction, program.provider.connection);
      await program.provider.connection.confirmTransaction(txSignature, "confirmed");

      console.log(txSignature);
  }

  async function initRaffleAndTransferNFT()
  {
      const raffleBank = new PublicKey(REACT_APP_RAFFLE_VAULT_WALLET_ADDRESS); // raffle vault
      const tokenType = new PublicKey("ASxC3n3smkcUkA7Z58EUKZ2NfHoQ8eZrkTRK7ergYr2a"); // $CRECK devnet
      const tokenAddress = new PublicKey(splTokenAddressTransfer);
      const raffleType = eRaffleType.NFT;
      const raffleAddressKP = Keypair.generate();
      console.log("Raffle Address :", raffleAddressKP.publicKey.toString());

      const initRaffleTransactionData: initRaffleTransactionDataType =
      {
          connection: connection,
          anchorWallet: anchorWallet,
          raffleAddressKP: raffleAddressKP,
          raffleTokenSPLAddress: tokenType.toString(),
          raffleTicketPrice: 0.15,
          raffleTicketSupply: ticketsAmount,
          raffleBank: raffleBank,
          raffleNftAddress: splTokenAddressTransfer.toString(),
          tokenAddressTransfer: tokenAddress,
          storeBuyers: RAFFLE_STORE_BUYERS,
          raffleType: raffleType
      };

      const transaction = await getInitRaffleTransaction(initRaffleTransactionData);
      // const transaction = await getInitWithPDARaffleTransaction(initRaffleTransactionData);

      console.log("Let's send it...");

      const tx = await wallet.sendTransaction(transaction, connection);
      console.log(`Init & Transfer successful, tx: ${tx}`);

      await connection.confirmTransaction(tx, "finalized");
      console.log(`Finalized, tx: ${tx}`);
  }

  async function buyTicketSOL()
  {
      const { provider, program } = getProviderAndProgram();

      const raffleBank = new PublicKey(REACT_APP_RAFFLE_VAULT_WALLET_ADDRESS);
      const splTokenPublicKey = PublicKey.default; // SOL

      let raffleAccount = await getRaffleAccount(raffleAddress, connection, anchorWallet);

      const ticketsAmountToBuy = ticketsAmount;
      const ticketsPrice = raffleAccount?.pricePerTicket.toNumber()! / anchor.web3.LAMPORTS_PER_SOL;//0.3;
      const ticketPriceLAMPORTS = new anchor.BN(ticketsAmountToBuy * ticketsPrice * anchor.web3.LAMPORTS_PER_SOL);

      const ticketTransactionData: raffleTransactionDataType =
          {
              connection: connection,
              wallet: anchorWallet,
              raffleAddress: raffleAddress,
              raffleTicketPrice: ticketsPrice,
              raffleBank: raffleBank,
              ticketAmount: ticketsAmountToBuy,
              currencyType: eCurrencyType.SOL,
              splTokenPublicKey: splTokenPublicKey
          };

      const tx = await getBuyTicketTransactionBySOL(ticketTransactionData);

      const txSignature = await wallet.sendTransaction(tx, program.provider.connection);
      console.log("DONE:", txSignature);

      const latestBlockHash = await connection.getLatestBlockhash();
      const blockheightBasedTransactionConfirmationStrategy: BlockheightBasedTransactionConfirmationStrategy = {blockhash: latestBlockHash.blockhash, lastValidBlockHeight: latestBlockHash.lastValidBlockHeight, signature: txSignature};
      const conf = await provider.connection.confirmTransaction(txSignature, "confirmed");
      console.log("CONFIRMED:", conf);

      raffleAccount = await getAndPrintRaffleAccount(raffleAddress, connection, anchorWallet);
  }

  async function buyTicketSPL()
  {
      const { provider, program } = getProviderAndProgram();

      // console.log(connection);
      // console.log(wallet);
      // console.log(anchorWallet);

      const raffleBank = new PublicKey(REACT_APP_RAFFLE_VAULT_WALLET_ADDRESS);
      const splTokenPublicKey = new PublicKey("ASxC3n3smkcUkA7Z58EUKZ2NfHoQ8eZrkTRK7ergYr2a"); // $CRECK devnet
      const splCurrencyType = SPLTOKENS_MAP_GET_TOKEN_NAME(splTokenPublicKey.toString()).tokenName;
      //console.log("SPL-Token:", splTokenPublicKey.toString(), "| CurrencyType:" , splCurrencyType);
      //console.log("Raffle :", raffleAddress.toString());
      let raffleAccount = await getRaffleAccount(raffleAddress, connection, anchorWallet);

      const ticketsAmountToBuy = ticketsAmount;
      const ticketsPrice = raffleAccount?.pricePerTicket.toNumber()! / anchor.web3.LAMPORTS_PER_SOL;//0.3;
      const ticketPriceLAMPORTS = new anchor.BN(ticketsAmountToBuy * ticketsPrice * anchor.web3.LAMPORTS_PER_SOL);
      const senderAnchorWallet = anchorWallet;
      const sender = anchorWallet.publicKey;
      console.log("Sender:", sender.toString());

      const ticketTransactionData: raffleTransactionDataType =
          {
              connection: connection,
              wallet: anchorWallet,
              raffleAddress: raffleAddress,
              raffleTicketPrice: ticketsPrice,
              raffleBank: raffleBank,
              ticketAmount: ticketsAmountToBuy,
              currencyType: splCurrencyType,
              splTokenPublicKey: splTokenPublicKey
          };

      const transaction = await getBuyTicketTransactionBySPL(ticketTransactionData);

      const tx = await wallet.sendTransaction(transaction, connection);
      console.log(`Bought successful, tx: ${tx}`);

      await connection.confirmTransaction(tx, "finalized");
      console.log(`Finalized, tx: ${tx}`);

      await getAndPrintRaffleAccount(raffleAddress, connection, anchorWallet);
  }

  async function transferSPLToken(destAddress: PublicKey, splTokenPublicKey: PublicKey )
  {
      console.log("Sender:", anchorWallet.publicKey.toString());

      const transferSPLTokenData: any =
      {
          connection: connection,
          sourceWallet: anchorWallet,
          destAddress: destAddress,
          splTokenPublicKey: splTokenPublicKey
      };

      const transaction = await getTransferSPLTokenTransaction(transferSPLTokenData);

      const tx = await wallet.sendTransaction(transaction, connection);
      console.log(`Transfer successful, tx: ${tx}`);

      await connection.confirmTransaction(tx, "finalized");
      console.log(`Finalized, tx: ${tx}`);
  }

  async function fetchRaffle()
  {
      //console.log(raffleAddress);
      //console.log(raffleAddressInput)

      const provider = new Provider(connection, anchorWallet, Provider.defaultOptions());
      const raffle: any = await getAndPrintRaffleAccount(raffleAddress, connection, anchorWallet);

      setRaffleOutput(raffle);

      return raffle;
  }

  const MEMO_PROGRAM_ID: PublicKey = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
  async function doMemo()
  {
      const { provider, program } = getProviderAndProgram();
      const txMemo = await program.rpc.memo(
          {
              accounts: {
                  memo: MEMO_PROGRAM_ID
              }
          });

      console.log("Memo sent, tx:", txMemo);
  }

  async function fetchVault()
  {
      const { program } = getProviderAndProgram();

      console.log("Fetching Vault...");

      const vaultAddressPubKey = vaultAddress.indexOf("Insert") >= 0 ? new PublicKey(VAULT_ADDRESS) : new PublicKey(vaultAddress);
      console.log(await getSOLBalance((vaultAddressPubKey)) + "SOL");

      const [_vaultPool, bump] = await PublicKey.findProgramAddress([Buffer.from(VAULT_SKT_SEED_PREFIX), vaultAddressPubKey.toBuffer()], program.programId);
      console.log("Vault PDA:", _vaultPool.toString(), bump);

      console.log("Vault Balance:");
      await getSPLTokensBalance(_vaultPool);
  }

  async function withdrawVault()
  {
      const { program } = getProviderAndProgram();
      const [global] = await PublicKey.findProgramAddress([Buffer.from(GLOBAL_ACCOUNT_SEED)], program.programId);

      const client = anchorWallet;
      const tokenSPLAddress = new PublicKey(REACT_APP_SKT_TOKEN_ADDRESS);
      const withdrawSPLAmount = 0;
      const withdrawSOLAmount = 1.7;

      console.log("Vault Withdraw...");
      console.log(`${client.publicKey.toString()} wants to withdraw %c${withdrawSPLAmount}%c $SKT %c${withdrawSOLAmount}%c $SOL`, "color:green", "color:black", "color:green", "color:black");

      const vaultAddressPubKey = new PublicKey(vaultAddress);
      const [_vaultPool, bump] = await PublicKey.findProgramAddress([Buffer.from(VAULT_SKT_SEED_PREFIX), vaultAddressPubKey.toBuffer()], program.programId);

      const _vaultPoolSktAccount = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, tokenSPLAddress, _vaultPool,true);
      let recipientATA = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, tokenSPLAddress, client.publicKey);

      console.log("Vault Balance:", await getSOLBalance((vaultAddressPubKey)), "SOL");

      // Make sure receiver has a token account active
      const receiverAccount = await connection.getAccountInfo(recipientATA);
      let transaction = new Transaction();
      if (receiverAccount === null)
      {
          console.log("Creating recipientATA:", recipientATA.toString());
          transaction.add(Token.createAssociatedTokenAccountInstruction(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, tokenSPLAddress, recipientATA, client.publicKey, client.publicKey));
      }

      console.log("--> Client Balance Before:");
      await getSPLTokensBalance(client.publicKey, "SKTsW8KvzopQPdamXsPhvkPfwzTenegv3c3PEX4DT1o");

      console.log("--> Vault Balance Before :");
      await getSPLTokensBalance(_vaultPool, "SKTsW8KvzopQPdamXsPhvkPfwzTenegv3c3PEX4DT1o");

      console.log("RecipientATA:", recipientATA.toString());
      console.log("VaultAddress:", vaultAddress.toString());

      const tran = await program.transaction.withdrawVault
      (
          new anchor.BN(withdrawSPLAmount * LAMPORTS_PER_SOL),
          new anchor.BN(withdrawSOLAmount * LAMPORTS_PER_SOL),
          {
              accounts:
                  {
                      global,
                      claimer: client.publicKey,
                      claimerSktAccount: recipientATA,
                      vault: vaultAddress,
                      vaultPool: _vaultPool,
                      vaultPoolSktAccount: _vaultPoolSktAccount,
                      sktMint: tokenSPLAddress,
                      rent: SYSVAR_RENT_PUBKEY,
                      tokenProgram: TOKEN_PROGRAM_ID,
                      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                      systemProgram: SystemProgram.programId,
                  },
          }
      );

      transaction.add(tran!);

      try
      {
          const tx = await wallet.sendTransaction(transaction, connection);
          console.log(`\nWithdraw request sent, Finalizing... tx: ${tx}`);

          await connection.confirmTransaction(tx, "finalized");
          console.log(`Confirmed, tx: ${tx}`);
      }
      catch (e: any)
      {
          console.log(e);
          const errorCodeHex = e.message.split("custom program error: ")[1];
          const errorCode = parseInt(errorCodeHex, 16);
          console.log("Error Code:", errorCodeHex, errorCode);

          return;
      }

      console.log("==============================\n");

      console.log("--> Client Balance Now:");
      await getSPLTokensBalance(client.publicKey, "SKTsW8KvzopQPdamXsPhvkPfwzTenegv3c3PEX4DT1o");

      console.log("--> Vault Balance Now:");
      await getSPLTokensBalance(_vaultPool, "SKTsW8KvzopQPdamXsPhvkPfwzTenegv3c3PEX4DT1o");
  }

  async function approve() {
      const { provider } = getProviderAndProgram();
      const delegator = new PublicKey(delegatorAddress);
      const nftMint = new PublicKey(nftMintAddress);
      const nftAta = await Token.getAssociatedTokenAddress(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          nftMint,
          provider.wallet.publicKey,
          false
      );
      const transaction = new Transaction();
      transaction.add(
          Token.createApproveInstruction(
              TOKEN_PROGRAM_ID,
              nftAta,
              delegator,
              provider.wallet.publicKey,
              [],
              1
          )
      );
      // transaction.add(
      //     Token.createApproveInstruction(
      //         NATIVE_MINT,
      //         provider.wallet.publicKey,
      //         delegator,
      //         provider.wallet.publicKey,
      //         [],
      //         LAMPORTS_PER_SOL
      //     )
      // );

      const tx = await wallet.sendTransaction(transaction, connection);
      console.log(`Approve successful, tx: ${tx}`);

      await connection.confirmTransaction(tx, "finalized");
      console.log(`Finalized, tx: ${tx}`);
  }

  async function revoke() {
      const { provider } = getProviderAndProgram();
      const nftMint = new PublicKey(nftMintAddress);
      const nftAta = await Token.getAssociatedTokenAddress(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          nftMint,
          provider.wallet.publicKey,
          false
      );
      const transaction = new Transaction();
      transaction.add(
          Token.createRevokeInstruction(
              TOKEN_PROGRAM_ID,
              nftAta,
              provider.wallet.publicKey,
              []
          )
      );
      // transaction.add(
      //     Token.createApproveInstruction(
      //         NATIVE_MINT,
      //         provider.wallet.publicKey,
      //         delegator,
      //         provider.wallet.publicKey,
      //         [],
      //         LAMPORTS_PER_SOL
      //     )
      // );

     console.log(nftAta.toString());

      const tx = await wallet.sendTransaction(transaction, connection);
      console.log(`Revoke successful, tx: ${tx}`);

      await connection.confirmTransaction(tx, "finalized");
      console.log(`Finalized, tx: ${tx}`);
  }

  async function transfer() {
      const { provider } = getProviderAndProgram();
      const owner = new PublicKey(ownerAddress);
      const target = new PublicKey(targetAddress);
      const nftMint = new PublicKey(nftMintAddress);
      const { transaction, sourceATA, recipientATA } = await getAssociatedTokenAddressAndTransaction(connection, nftMint, owner, target, false, provider.wallet.publicKey);
      transaction.add(
          Token.createTransferCheckedInstruction(
              TOKEN_PROGRAM_ID,
              sourceATA,
              nftMint,
              recipientATA,
              owner,
              [],
              1,
              0
          )
      );
      const tx = await wallet.sendTransaction(transaction, connection);
      console.log(`Revoke successful, tx: ${tx}`);

      await connection.confirmTransaction(tx, "finalized");
      console.log(`Finalized, tx: ${tx}`);
  }

  async function convertBS58ToArray()
  {
      const kp = Keypair.fromSecretKey(bs58.decode(''));
      console.log(kp.secretKey.toString());
  }

  async function initNftVault()
  {
      const { provider, program } = getProviderAndProgram();
      console.log("Init NFT Vault...");
      const nftVaultKP = Keypair.generate();
      const mintPrice = new anchor.BN(LAMPORTS_PER_SOL * 0.01);
      const totalSupply = 10;
      // #[account]
      // pub struct NftVault {                8
      //     pub authority: Pubkey,           32
      //     pub pool_bump: u8,               1
      //     pub mint_price: u64,             8
      //     pub total_supply: u32,           4
      //     pub sold_mints: Vec<Pubkey>,     8 + 32 * totalSupply
      // }
      const space = (32 + 1 + 8 + 4 + (8 + (32 * totalSupply))) + 8;
      const rentExemptionAmount = await program.provider.connection.getMinimumBalanceForRentExemption(space);

      const tx = new Transaction().add(SystemProgram.createAccount({
          fromPubkey: program.provider.wallet.publicKey,
          newAccountPubkey: nftVaultKP.publicKey,
          lamports: rentExemptionAmount,
          space,
          programId: program.programId
      }));
      const [nftVaultPool, poolBump] = await PublicKey.findProgramAddress(
          [
              Buffer.from(NFT_VAULT_POOL_SEED),
              nftVaultKP.publicKey.toBuffer()
          ],
          program.programId
      );

      // TBD needs fixing
      // tx.add(program.transaction.initializeNftVault(poolBump, mintPrice, totalSupply,
      // {
      //     accounts: {
      //         authority: program.provider.wallet.publicKey,
      //         nftVault: nftVaultKP.publicKey,
      //         nftVaultPool,
      //         systemProgram: SystemProgram.programId
      //     }
      // }));
      //
      // const txSignature = await wallet.sendTransaction(tx, program.provider.connection, {
      //     signers: []
      // });
      //
      // await program.provider.connection.confirmTransaction(txSignature, "confirmed");
      // console.log("Initialized: ", txSignature);
  }

  async function initVault()
  {
      console.log(connection);

      const { provider, program } = getProviderAndProgram();

      console.log("Init Vault...");
  
      const _vaultKeypair = Keypair.generate();
      console.log("Vault Address:", _vaultKeypair.publicKey.toString());
      console.log("Vault Secret:", _vaultKeypair.secretKey.toString());
  
      const [_vaultPool, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(VAULT_SKT_SEED_PREFIX), _vaultKeypair.publicKey.toBuffer()],
        program.programId
      );
      console.log("Vault PDA:", _vaultPool.toString(), bump);
  
      const tokenSPLAddress = new PublicKey(REACT_APP_SKT_TOKEN_ADDRESS);
  
      const _vaultPoolSktAccount = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        tokenSPLAddress,
        _vaultPool,
        true
      );
      console.log("Vault ATA", _vaultPoolSktAccount.toString());
  
      let transaction = await program.transaction.initializeVault(
          bump,
          SystemProgram.programId,
          {
          accounts: {
              payer: provider.wallet.publicKey,
              vault: _vaultKeypair.publicKey,
              vaultPool: _vaultPool,
              vaultPoolSktAccount: _vaultPoolSktAccount,
              sktMint: tokenSPLAddress,
              memo: MEMO_PROGRAM_ID,
              rent: SYSVAR_RENT_PUBKEY,
              tokenProgram: TOKEN_PROGRAM_ID,
              associatedToken: ASSOCIATED_TOKEN_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
          },
          signers: [_vaultKeypair],
        }
      );
  
      //transaction.feePayer = anchorWallet.publicKey;
      //transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      //transaction.sign(_vaultKeypair);
  
      let tx = await wallet.sendTransaction(transaction, connection, {signers: [_vaultKeypair]});
      console.log(`Vault Creation Tx confirmed, tx: ${tx}`);
  
      await connection.confirmTransaction(tx, "finalized");
      console.log(`Vault Creation Tx finalized, tx: ${tx}`);
  
      let vault = await program.account.vault.fetchNullable(_vaultKeypair.publicKey);

      // @ts-ignore
      vault.tokenType = vault.tokenType.toString();
      console.log("Vault Account:", vault);

      const k = 'kQfth4PH6rkLQgJKpDHKGRoqUgcvemzcy9NAN7wcCB8e1FCGePEMck8aDbKsmG3SNyEEW6PkG8SMpf4L3XpYzta'; // temp private key
      const sktTempWallet = Keypair.fromSecretKey(bs58.decode(k));
      const transferToVaultAmount = 300;
      console.log("sktTempWallet Public: ", sktTempWallet.publicKey.toString());
      console.log("Let's fund vault with amount:", transferToVaultAmount, "$SKT");

      const sourceATA = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        tokenSPLAddress,
        sktTempWallet.publicKey
      );

      const recipientATA = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        tokenSPLAddress,
        _vaultPool,
       true
      );

      const instruction = Token.createTransferCheckedInstruction(
        TOKEN_PROGRAM_ID,
        sourceATA,
        tokenSPLAddress,
        recipientATA,
        sktTempWallet.publicKey,
        [],
        transferToVaultAmount * LAMPORTS_PER_SOL,
        9
      );
      console.log("--> Source ATA:", sourceATA.toString());
      console.log("--> Recipient ATA:", recipientATA.toString());

      transaction = new Transaction().add(instruction);
      tx = await wallet.sendTransaction(transaction, connection, { signers: [sktTempWallet] });

      await connection.confirmTransaction(tx, "confirmed");
      console.log(`$SKT Token Transfer successful, tx: ${tx}`);

      console.log("\nVault Balance:");
      await getSPLTokensBalance(_vaultPool);
  }

  async function claimSkt() {
      const { program } = getProviderAndProgram();
      const response = await axios.get(`http://localhost:5000/transaction/${program.provider.wallet.publicKey.toString()}`);
      const recoveredTx = Transaction.from(Buffer.from(response.data, "base64"));

      console.log(recoveredTx);
      recoveredTx.instructions[0].data[0] = 10;

      const txSignature = await wallet.sendTransaction(recoveredTx, program.provider.connection);
      await program.provider.connection.confirmTransaction(txSignature, "confirmed");
      console.log(txSignature);
  }

  const handleFieldChange = async (event: any) =>
  {
      if (!event.target.value)
          return;

      switch (event.target.id)
      {
          case "globalAddress":
              setGlobalAddress(event.target.value);
              break;

          case "vaultAddress":
              setVaultAddress(event.target.value);
              break;

          case "splTokenAddressTransfer":
              setSplTokenAddressTransfer(new PublicKey(event.target.value));
              break;

          case "raffleAddress":
              //console.log(raffleAddressRef.current!.value);
              //setRaffleAddress(new PublicKey(event.target.value));
              break;

          case "ticketsAmount":
              setTicketsAmount(event.target.value);
              break;

          case "splTokenAddress":
              setSPLTokenAddress(event.target.value);
              break;

          default:
              break;
      }

      //console.log(event.target.id);
      //console.log('value is:', event.target.value);
  };

  if (!wallet.connected)
  {
      /* If the user's wallet is not connected, display connect wallet button. */
      return (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop:'100px' }}>
              <WalletMultiButton />
          </div>
      )
  }
  else
  {
      return (
          <div className="App">
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <WalletMultiButton />
                  </div>
                  {
                      <>
                          NETWORK:
                          <select className="border-2 border-black p-2" onChange={(e) => setNetwork(e.target.value as Cluster)} value={network}>
                              <option value="mainnet-beta">Mainnet</option>
                              <option value="devnet">Devnet</option>
                          </select>
                      </>
                  }
                  {
                      <div style={{margin:"15px"}}>
                          {
                              !value &&
                              (<button className="border-2 border-black p-2" onClick={announceRaffleFinalized}>Announce Raffle Finalized</button>)
                          }
                          {
                              <div>
                                  <input className="border-2 border-black p-2" type="text" id="raffleAddress1" ref={raffleAddressInput1} onFocus={(t)=>t.target.select()} style={{width:400}} defaultValue={"Enter Raffle Address..."} />
                              </div>
                          }
                          {
                              <div>
                                  <input className="border-2 border-black p-2" type="text" id="raffleNftWinnerTx" ref={raffleNftWinnerTxInput} onFocus={(t)=>t.target.select()} style={{width:400}} defaultValue={"Enter Nft Winner Tx..."} />
                              </div>
                          }
                          {
                              <div>
                                  <input className="border-2 border-black p-2" type="text" id="raffleRafflerTx" ref={raffleRafflerTxInput} onFocus={(t)=>t.target.select()} style={{width:400}} defaultValue={"Enter Raffler Tx..."} />
                              </div>
                          }
                      </div>
                  }

                  {
                      <div style={{margin:"15px"}}>
                          {
                              !value &&
                              (<button className="border-2 border-black p-2" onClick={initGlobal}>Init Global</button>)
                          }
                          {
                              !value &&
                              (<button className="border-2 border-black p-2" onClick={()=>fetchGlobal()}>Fetch Global</button>)
                          }
                          {
                              !value &&
                              (<button className="border-2 border-black p-2" onClick={()=>addAdmin(new PublicKey(globalAddress), true)}>Add Admin</button>)
                          }
                          {
                              !value &&
                              (<button className="border-2 border-black p-2" onClick={()=>addAdmin(new PublicKey(globalAddress), false)}>Remove Admin</button>)
                          }
                          {
                              <div>
                                  <input className="border-2 border-black p-2" type="text" id="globalAddress" onChange={handleFieldChange} value={globalAddress} style={{width:400}} />
                              </div>
                          }
                      </div>
                  }

                  {
                      <div style={{margin:"15px"}}>
                          {
                              !value &&
                              (<button className="border-2 border-black p-2" onClick={initVault}>Init Vault</button>)
                          }
                          {
                              !value &&
                              (<button className="border-2 border-black p-2" onClick={claimSkt}>Claim Skt Token</button>)
                          }
                          {
                              !value &&
                              (<button className="border-2 border-black p-2" onClick={fetchVault}>Fetch Vault</button>)
                          }
                          {
                              !value &&
                              (<button className="border-2 border-black p-2" onClick={withdrawVault}>Withdraw From Vault</button>)
                          }
                          {
                              <div>
                                  {"Vault Address: "}
                                  <input className="border-2 border-black p-2" type="text" id="vaultAddress" onChange={handleFieldChange} value={vaultAddress} style={{width:400}} />
                              </div>
                          }
                      </div>
                  }
              {
                      <div>
                          {
                               !value &&
                               (<button className="border-2 border-black p-2" onClick={initRaffleAndTransferNFT}>Init Raffle</button>)
                          }
                          {
                              !value &&
                              (<button className="border-2 border-black p-2" onClick={fetchRaffle}>Fetch Raffle</button>)
                          }
                          {
                              !value &&
                              (<button className="border-2 border-black p-2" onClick={finalizeRaffle}>Finalize Raffle</button>)
                          }
                      </div>
                  }
                  {
                      !value &&
                      (<button className="border-2 border-black p-2" onClick={initNftVault}>Init NFT Vault</button>)
                  }
                  {
                      !value &&
                      (<button className="border-2 border-black p-2" onClick={withdrawFromPda}>Withdraw From Raffle PDA</button>)
                  }

                  {
                      !value &&
                      (<button className="border-2 border-black p-2" onClick={buyTicketSOL}>Buy Ticket SOL</button>)
                  }
                  {
                      !value &&
                      (<button className="border-2 border-black p-2" onClick={buyTicketSPL}>Buy Ticket SPL</button>)
                  }
                  {
                      !value &&
                      (<button className="border-2 border-black p-2" onClick={()=>transferSPLToken(new PublicKey(REACT_APP_RAFFLE_VAULT_WALLET_ADDRESS), splTokenAddressTransfer)}>Transfer Token</button>)
                  }
                  {
                      <div>
                          {
                              !value &&
                              (<button className="border-2 border-black p-2" onClick={mintWL}>Mint WL</button>)
                          }

                          {
                              !value &&
                              (<button className="border-2 border-black p-2" onClick={mintToken}>Mint Token</button>)
                          }

                          {
                              !value &&
                              (<button className="border-2 border-black p-2" onClick={mintTokenFromMainnet}>Mint Token Mainnet</button>)
                          }
                      </div>
                  }
                  {
                      <div>
                          {
                              !value &&
                              (<button className="border-2 border-black p-2" onClick={updateMetaDataToken}>Update Meta Data Token</button>)
                          }

                          {
                              !value &&
                              (<button className="border-2 border-black p-2" onClick={updateMetaData}>Update Meta Data</button>)
                          }
                      </div>
                  }

                  {
                      <div>
                          {
                              !value &&
                              (<button className="border-2 border-black p-2" onClick={convertKCtoSKT}>Convert $KC to $SKT</button>)
                          }

                          {
                              !value &&
                              (<button className="border-2 border-black p-2" onClick={convertKCtoSKTFinalized}>Finalize</button>)
                          }

                          {
                              !value &&
                              (<button className="border-2 border-black p-2" onClick={encrypt}>Encrypt</button>)
                          }
                      </div>
                  }


                  {
                      <h3>Init / Raffle Transfer:</h3>
                  }

                  {
                      <h3>
                          {"SPL Token Address Transfer: "}
                          <input className="border-2 border-black p-2" type="text" id="splTokenAddressTransfer" onChange={handleFieldChange} value={splTokenAddressTransfer.toString()} style={{width:400}} />
                      </h3>
                  }

                  {
                      <h3>Raffle Input:</h3>
                  }

                  {
                      <h3>
                          {"Raffle Address : "}
                          <input className="border-2 border-black p-2" type="text" id="raffleAddress" ref={raffleAddressInput}
                                 onChange={(e:any) => {setRaffleAddress(new PublicKey(e.target.value)); console.log("Raffle Address Changed:", raffleAddressInput.current!.value)} }
                                 defaultValue={"Insert Raffle Address..."} style={{width:400}} />

                          <br/>

                          {"SPL Token Address : "}
                          <input className="border-2 border-black p-2" type="text" id="splTokenAddress" onChange={handleFieldChange} value={splTokenAddress} style={{width:400}} />

                          <br/>

                          {"Raffle Tickets : "}
                          <input className="border-2 border-black p-2" type="number" id="ticketsAmount" onChange={handleFieldChange} value={ticketsAmount} style={{width:400}} />
                      </h3>
                  }

                  {
                      <h3>
                          Raffle Output:
                          <br/>
                          <div>
                              <pre style={{textAlign: 'left', display: 'flex', justifyContent: 'space-around'}}>
                                  {JSON.stringify(raffleOutput, null, '\t')}
                              </pre>
                          </div>
                      </h3>
                  }

                  {
                      <h3>Delegate:</h3>
                  }

                  {
                      <h3>
                          {"Delegator Address : "}
                          <input className="border-2 border-black p-2" type="text"
                                 onChange={(e:any) => setDelegatorAddress(e.target.value)} value={delegatorAddress}
                                 style={{width:400}} />

                          <br/>

                          {"NFT Mint Address : "}
                          <input className="border-2 border-black p-2" type="text" onChange={(e) => setNftMintAddress(e.target.value) } value={nftMintAddress} style={{width:400}} />

                          <br/>

                          {"Owner Address : "}
                          <input className="border-2 border-black p-2" type="text" onChange={(e) => setOwnerAddress(e.target.value) } value={ownerAddress} style={{width:400}} />

                          <br/>

                          {"Target Address : "}
                          <input className="border-2 border-black p-2" type="text" onChange={(e) => setTargetAddress(e.target.value) } value={targetAddress} style={{width:400}} />

                          <br/>

                          <button className="border-2 border-black p-2" onClick={approve}>Approve</button>
                          <button className="border-2 border-black p-2" onClick={revoke}>Revoke</button>
                          <button className="border-2 border-black p-2" onClick={transfer}>Transfer</button>
                      </h3>
                  }
          </div>
      );
  }
};
