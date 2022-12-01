/* eslint-disable react-hooks/exhaustive-deps */
import { Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js";
import * as anchor from "@project-serum/anchor";
import { Program, Provider, web3 } from "@project-serum/anchor";
import { ASSOCIATED_TOKEN_PROGRAM_ID, MintLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL, PublicKey, SYSVAR_RENT_PUBKEY, Transaction } from "@solana/web3.js";
import { Buffer } from "buffer";
import Header from "components/Header";
import StorageSelect from "components/SotrageSelect";
import { NFT_VAULT_POOL_SEED, RPC_DEVNET, RPC_MAINNET } from "config/constants";
import { getAssociatedTokenAddressAndTransaction, isAdmin } from "config/utils";
import { MintMachine } from "idl/mint_machine";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

const { SystemProgram, Keypair } = web3;
const idl_mint_machine = require("idl/mint_machine.json");

const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
const MINT_SIZE = MintLayout.span;

const mode1Default = "DFsK8SCKGDwwuGJxiA6q9vNhpxBuJhWb6iZbGcLqttEu";
const mode2Default = "ERRbgy1zePa3kYs2xfjXo457p54hFPEZ1Rm37UdSJCcr"; //"H72H4tF6kRhSP8SUzoRDeivXz3255TDnAMvnG66cALHY";

const defaultProgramIDs = [idl_mint_machine.metadata.address];

export default function MyNftMachine() {
  const [network, setNetwork] = useState(WalletAdapterNetwork.Devnet);
  const connection = useMemo(() => new Connection(network === "mainnet-beta" ? RPC_MAINNET : RPC_DEVNET, "confirmed"), [network]);
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet() as anchor.Wallet;
  const [programID, setProgramID] = useState(idl_mint_machine.metadata.address);

  const [vaultMode1, setVaultMode1] = useState(mode1Default);
  const [vaultMode2, setVaultMode2] = useState(mode2Default);
  const [name, setName] = useState("Number");
  const [symbol, setSymbol] = useState("NB");
  const [creator, setCreator] = useState("");
  const [totalSupply, setTotalSupply] = useState(5);
  const [price, setPrice] = useState(0.01);
  const [mints, setMints] = useState<Array<string>>([]);
  const [hashes, setHashes] = useState([
    "1ukmPB88jTJja5FEkH4BG2VWC8MfiU-CnRbZJyHq6zU",
    "hCOQpLUvhiRPSLKLvRVEuv1WFL0yAILAFI9dtyTI4AQ",
    "P0Zk-U18khiUsQp2oMTY3KcYRxguOixWWnC-jtBGl8w",
    "9ieLlJwgOqqvwHfetmQXsI09NYjnzWIa3_8wLr7yWXo",
    "1AaqGxO2fq1H7oDWDaNdpcNCZTUO_4JNK6oQoJ6sPS0",
  ]);

  useEffect(() => {
    const network = localStorage.getItem("network");
    if (network) {
      setNetwork(network as WalletAdapterNetwork);
    }
  }, []);

  function getProviderAndProgram() {
    const provider = new Provider(connection, anchorWallet, Provider.defaultOptions());
    const program = new Program(idl_mint_machine, programID, provider) as Program<MintMachine>;

    return { provider, program };
  }

  async function getSPLTokensBalance(account: PublicKey, filterMint: string = "") {
    const { program } = getProviderAndProgram();

    const balance = await program.provider.connection.getParsedTokenAccountsByOwner(account, { programId: TOKEN_PROGRAM_ID });

    if (balance.value) {
      console.log(`============================================================================================================================`);
      console.log(`SPL Tokens Balance for ${account.toString()}:`);
      balance.value.forEach((accountInfo) => {
        let pubKey = accountInfo.pubkey.toBase58();
        let mint = accountInfo.account.data["parsed"]["info"]["mint"];
        // let owner = accountInfo.account.data["parsed"]["info"]["owner"];
        // let decimal = accountInfo.account.data["parsed"]["info"]["tokenAmount"]["decimals"];
        let amount = accountInfo.account.data["parsed"]["info"]["tokenAmount"]["amount"];
        if ((filterMint && mint === filterMint) || !filterMint) {
          const metaplex = Metaplex.make(connection).use(walletAdapterIdentity(wallet));
          metaplex
            .nfts()
            .findByMint({ mintAddress: new PublicKey(mint) })
            .run()
            .then((nft) => {
              //console.log(nft.name);
              console.log(`Mint: ${mint} | ATA: ${pubKey} | ${Math.ceil(Number(amount))} | ${Math.ceil(amount / LAMPORTS_PER_SOL)} | ${nft.name}`);
            });

          //console.log(accountInfo.account.data)
          //console.log(`Mint: ${mint} | ATA: ${pubKey} | ${Math.ceil(Number(amount))} | ${Math.ceil(amount / LAMPORTS_PER_SOL)}`);
          //console.log(`owner: ${owner} | pubKey: ${pubKey}`);
        }
      });
      console.log(`============================================================================================================================`);
    }
  }

  useEffect(() => {
    getSPLTokensBalance(new PublicKey("ESZoUU9g9A7EdCnGQePR5pUT3ntygbuRodifLADPcBAK"));
  }, []);

  async function initNftVaultMode1() {
    try {
      const { program } = getProviderAndProgram();

      console.log("Init NFT Vault Mode 1...");
      const nftVaultKP = Keypair.generate();
      const mintPrice = new anchor.BN(LAMPORTS_PER_SOL * price);
      // #[account]
      // pub struct NftVault {                8
      //     pub authority: Pubkey,           32
      //     pub pool_bump: u8,               1
      //     pub mint_price: u64,             8
      //     pub total_supply: u32,           4
      //     pub sold_mints: Vec<Pubkey>,     8 + 32 * totalSupply
      //     pub name: String,                8
      //     pub symbol: String,              8
      //     pub creator: Pubkey,             32
      //     pub uris: Vec<Vec<u8>>,          8
      // }
      const space = 8 + 32 + 1 + 8 + 4 + (8 + 32 * totalSupply) + 8 + 8 + 32 + 8;
      const rentExemptionAmount = await program.provider.connection.getMinimumBalanceForRentExemption(space);
  
      const tx = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: program.provider.wallet.publicKey,
          newAccountPubkey: nftVaultKP.publicKey,
          lamports: rentExemptionAmount,
          space,
          programId: program.programId,
        })
      );
  
      const [nftVaultPool, poolBump] = await PublicKey.findProgramAddress([Buffer.from(NFT_VAULT_POOL_SEED), nftVaultKP.publicKey.toBuffer()], program.programId);
  
      tx.add(
        program.transaction.initializeNftVault(poolBump, mintPrice, totalSupply, "", "", SystemProgram.programId, {
          accounts: {
            authority: program.provider.wallet.publicKey,
            nftVault: nftVaultKP.publicKey,
            nftVaultPool,
            systemProgram: SystemProgram.programId,
          },
        })
      );
  
      const txSignature = await wallet.sendTransaction(tx, program.provider.connection, {
        signers: [nftVaultKP],
      });
  
      await program.provider.connection.confirmTransaction(txSignature, "confirmed");
  
      console.log("Initialized: ", txSignature);
      setVaultMode1(nftVaultKP.publicKey.toString());
      toast.success('Success');
    } catch (error) {
      console.log(error);
      toast.error('Fail');
    }
  }

  async function initNftVaultMode2() {
    try {
      const { program } = getProviderAndProgram();

      console.log("Init NFT Vault Mode2...");
      const nftVaultKP = Keypair.generate();
      const mintPrice = new anchor.BN(LAMPORTS_PER_SOL * price);
  
      // pub struct NftVault {                8
      //     pub authority: Pubkey,           32
      //     pub pool_bump: u8,               1
      //     pub mint_price: u64,             8
      //     pub total_supply: u32,           4
      //     pub sold_mints: Vec<Pubkey>,     8 + 32 * totalSupply
      //     pub name: String,                8 + 32
      //     pub symbol: String,              8 + 10
      //     pub creator: Pubkey,             32
      //     pub uris: Vec<Vec<u8>>,          8 + (8 + 43) * 444
      // }
  
      const space = 8 + 32 + 1 + 8 + 4 + (8 + 32 * totalSupply) + (8 + 32) + (8 + 10) + 32 + (8 + (8 + 43) * totalSupply);
  
      const rentExemptionAmount = await program.provider.connection.getMinimumBalanceForRentExemption(space);
  
      const tx = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: program.provider.wallet.publicKey,
          newAccountPubkey: nftVaultKP.publicKey,
          lamports: rentExemptionAmount,
          space,
          programId: program.programId,
        })
      );
  
      const [nftVaultPool, poolBump] = await PublicKey.findProgramAddress([Buffer.from(NFT_VAULT_POOL_SEED), nftVaultKP.publicKey.toBuffer()], program.programId);
  
      tx.add(
        program.transaction.initializeNftVault(poolBump, mintPrice, totalSupply, name, symbol, new PublicKey(creator), {
          accounts: {
            authority: program.provider.wallet.publicKey,
            nftVault: nftVaultKP.publicKey,
            nftVaultPool,
            systemProgram: SystemProgram.programId,
          },
        })
      );
  
      const txSignature = await wallet.sendTransaction(tx, program.provider.connection, { signers: [nftVaultKP] });
  
      await program.provider.connection.confirmTransaction(txSignature, "confirmed");
      console.log("Initialized: ", txSignature);
      setVaultMode2(nftVaultKP.publicKey.toString());
      toast.success('Success');
    } catch (error) {
      console.log(error);
      toast.error('Fail');
    }
  }

  async function addUris() {
    try {
      const { program } = getProviderAndProgram();
      const nftVault = new PublicKey(vaultMode2);
      const txs = [];
      for (const hash of hashes) {
        const tx = program.transaction.addUri(Buffer.from(hash), {
          accounts: {
            authority: program.provider.wallet.publicKey,
            nftVault,
          },
        });
        tx.feePayer = program.provider.wallet.publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        txs.push(tx);
      }
  
      const signedTxs = await program.provider.wallet.signAllTransactions(txs);
      for (const signedTx of signedTxs) {
        const txSignature = await program.provider.connection.sendRawTransaction(signedTx.serialize());
        await program.provider.connection.confirmTransaction(txSignature, "confirmed");
        console.log(txSignature);
      }      
      toast.success('Success');
    } catch (error) {
      console.log(error);
      toast.error('Fail');
    }
  }

  async function mintFromVault() {
    try {
      const { program } = getProviderAndProgram();
      const nftVault = new PublicKey(vaultMode1);
      const vaultData = await program.account.nftVault.fetchNullable(nftVault);
  
      console.log(vaultData?.mintPrice.toNumber(), vaultData?.totalSupply, vaultData);
  
      const [nftVaultPool] = await PublicKey.findProgramAddress([Buffer.from("nft_vault_pool"), nftVault.toBuffer()], program.programId);
      const balance = await program.provider.connection.getParsedTokenAccountsByOwner(nftVaultPool, { programId: TOKEN_PROGRAM_ID });
  
      let nftToMint;
  
      if (balance.value) {
        console.log(`SPL Tokens Balance for ${nftVaultPool.toString()}:`);
        const accounts = balance.value.filter((accountInfo) => {
          let decimal = accountInfo.account.data["parsed"]["info"]["tokenAmount"]["decimals"];
          let amount = accountInfo.account.data["parsed"]["info"]["tokenAmount"]["amount"];
          return Math.ceil(Number(amount)) === 1 && decimal === 0;
        });
  
        const rand = Math.ceil(Math.random() * (accounts.length - 1));
        console.log(rand, accounts.length);
        nftToMint = accounts[rand].account.data["parsed"]["info"]["mint"];
        console.log(accounts[rand].pubkey.toBase58());
      }
  
      const nftMint = new PublicKey(nftToMint);
      const {
        transaction: tx,
        sourceATA: buyerAta,
        recipientATA: vaultPoolAta,
      } = await getAssociatedTokenAddressAndTransaction(program.provider.connection, nftMint, program.provider.wallet.publicKey, nftVaultPool, true);
  
      console.log("NFT Mint Address", nftMint.toString());
      console.log("Vault Pool ATA", vaultPoolAta.toString());
      console.log("Buyer ATA", buyerAta.toString());
  
      tx.add(
        program.transaction.buyFromVault({
          accounts: {
            buyer: program.provider.wallet.publicKey,
            nftVault,
            nftVaultPool,
            nftMint,
            vaultPoolAta,
            buyerAta,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          },
        })
      );
  
      const txSignature = await wallet.sendTransaction(tx, program.provider.connection);
  
      await program.provider.connection.confirmTransaction(txSignature, "confirmed");
      console.log("Initialized: ", txSignature);      
      toast.success('Success');
    } catch (error) {
      console.log(error);
      toast.error('Fail');
    }
  }

  async function mint() {
    try {
      const { program } = getProviderAndProgram();
      const nftVault = new PublicKey(vaultMode2);
      const [nftVaultPool] = await PublicKey.findProgramAddress([Buffer.from("nft_vault_pool"), nftVault.toBuffer()], program.programId);
      const mintKeypair = Keypair.generate();
      const [metadata] = await anchor.web3.PublicKey.findProgramAddress([Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mintKeypair.publicKey.toBuffer()], TOKEN_METADATA_PROGRAM_ID);
  
      const lamports = await program.provider.connection.getMinimumBalanceForRentExemption(MINT_SIZE);
      const tokenAccount = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mintKeypair.publicKey, program.provider.wallet.publicKey, false);
  
      console.log("Mint Address: ", mintKeypair.publicKey.toString());
      console.log("Token Account: ", tokenAccount.toString());
  
      const tx = new Transaction();
  
      tx.add(
        SystemProgram.createAccount({
          fromPubkey: program.provider.wallet.publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          programId: TOKEN_PROGRAM_ID,
          lamports,
        }),
        Token.createInitMintInstruction(TOKEN_PROGRAM_ID, mintKeypair.publicKey, 0, program.provider.wallet.publicKey, program.provider.wallet.publicKey),
        Token.createAssociatedTokenAccountInstruction(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          mintKeypair.publicKey,
          tokenAccount,
          program.provider.wallet.publicKey,
          program.provider.wallet.publicKey
        )
      );
  
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = program.provider.wallet.publicKey;
  
      tx.add(
        program.transaction.mint({
          accounts: {
            mintAuthority: program.provider.wallet.publicKey,
            nftVault,
            nftVaultPool,
            mint: mintKeypair.publicKey,
            metadata,
            payer: program.provider.wallet.publicKey,
            tokenAccount,
            rent: SYSVAR_RENT_PUBKEY,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          },
        })
      );
  
      const txSignature = await wallet.sendTransaction(tx, program.provider.connection, { signers: [mintKeypair] });
  
      await program.provider.connection.confirmTransaction(txSignature, "confirmed");
      console.log("Minted Successfully: ", txSignature);      
      toast.success('Succes');
    } catch (error) {
      console.log(error);
      toast.error('Fail');
    }
  }

  async function fetchVault(key: string) {
    const { program } = getProviderAndProgram();
    const nftVault = new PublicKey(key);
    const vaultData = await program.account.nftVault.fetchNullable(nftVault);
    console.log("Authority: ", vaultData?.authority.toString());
    console.log("Creator: ", vaultData?.creator.toString());
    console.log("Mint Price: ", Number(vaultData?.mintPrice) / LAMPORTS_PER_SOL, "SOL");
    console.log("Total Supply: ", vaultData?.totalSupply);
    console.log("Sold: ", vaultData?.soldMints.length);
    console.log("==>", JSON.stringify(vaultData?.soldMints));
    console.log("Name: ", vaultData?.name);
    console.log("Symbol: ", vaultData?.symbol);
    console.log("URIs:", (vaultData?.uris! as any[]).length);
    console.log(vaultData?.uris ? (vaultData?.uris as any[]).map((uri) => "https://arweave.net/" + uri.toString()).join("\n") : "");
  }

  async function fetchVault1() {
    console.log("Vault mode 1");
    console.log("==========================================");
    await fetchVault(vaultMode1);
    console.log("==========================================");
  }

  async function fetchVault2() {
    console.log("Vault mode 2");
    console.log("==========================================");
    await fetchVault(vaultMode2);
    console.log("==========================================");
  }

  async function sendNfts() {
    try {
      const { program } = getProviderAndProgram();
      const nftVault = new PublicKey(vaultMode1);
      const [nftVaultPool] = await PublicKey.findProgramAddress([Buffer.from("nft_vault_pool"), nftVault.toBuffer()], program.programId);
      const txs = [];
      for (const mint of mints) {
        const mintKey = new PublicKey(mint);
        const { transaction, sourceATA, recipientATA } = await getAssociatedTokenAddressAndTransaction(program.provider.connection, mintKey, program.provider.wallet.publicKey, nftVaultPool, true);
  
        transaction.add(Token.createTransferCheckedInstruction(TOKEN_PROGRAM_ID, sourceATA, mintKey, recipientATA, program.provider.wallet.publicKey, [], 1, 0));
        transaction.feePayer = program.provider.wallet.publicKey;
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        txs.push(transaction);
      }
  
      const signedTxs = await program.provider.wallet.signAllTransactions(txs);
      for (const signedTx of signedTxs) {
        const txSignature = await program.provider.connection.sendRawTransaction(signedTx.serialize());
        await program.provider.connection.confirmTransaction(txSignature, "confirmed");
        console.log(txSignature);
      }
      toast.success('Success');
    } catch (error) {
      console.log(error);
      toast.error('Fail');
    }
  }

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
  } else {
    return (
      <div className="App relative">
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
        <div className="flex gap-3 flex-col m-5">
          <div className="flex items-center justify-center">
            <StorageSelect itemkey="nft-program" label="Program ID" defaultItems={defaultProgramIDs} defaultItem={programID} setItem={setProgramID} />
          </div>
          <div className="flex items-center justify-center">
            Total Supply: <input className="border-2 border-black p-2" onChange={(e) => setTotalSupply(parseInt(e.target.value))} value={totalSupply} />
          </div>
          <div className="flex items-center justify-center">
            Mint Price: <input className="border-2 border-black p-2" onChange={(e) => setPrice(parseFloat(e.target.value))} value={price} />
          </div>
          <div className="flex items-center justify-center">
            Name: <input className="border-2 border-black p-2" onChange={(e) => setName(e.target.value)} value={name} />
          </div>
          <div className="flex items-center justify-center">
            Symbol: <input className="border-2 border-black p-2" onChange={(e) => setSymbol(e.target.value)} value={symbol} />
          </div>
          <div className="flex items-center justify-center">
            Creator: <input className="w-[450px] border-2 border-black p-2" onChange={(e) => setCreator(e.target.value)} value={creator} />
          </div>
          <div className="w-full flex justify-evenly">
            <div className="flex flex-col justify-center items-center">
              <div>
                <div>Vault Mode 1:</div>
                <input className="w-[600px] border-2 border-black p-2" onChange={(e) => setVaultMode1(e.target.value)} value={vaultMode1} />
              </div>
              <div>
                <div>NFT Mints to send to Vault Mode 1:</div>
                <textarea className="w-[600px] border-2 border-black p-2" rows={5} onChange={(e) => setMints(e.target.value.split("\n"))} value={mints.join("\n")} />
              </div>

              <div className="flex gap-2">
                <button className="border-2 border-black p-2" onClick={fetchVault1}>
                  Fetch Vault1
                </button>
                <button className="border-2 border-black p-2" onClick={initNftVaultMode1}>
                  Init Vault1
                </button>
                <button className="border-2 border-black p-2" onClick={mintFromVault}>
                  Mint From Vault1
                </button>
                <button className="border-2 border-black p-2" onClick={sendNfts}>
                  Send NFTs to Vault1
                </button>
              </div>

              <div className="p-2">
                Mode 1 Description:
                <ul>
                  <li>Create a new vault by clicking the Init Vault Mode 1 with entering the total supply and mint price</li>
                  <li>Use already created vault by entering the public key</li>
                  <li>After initialize or enter the public key, have to send NFTs to the vault mod 1 by entering the mint addresses in the textarea and clicking the send buton</li>
                  <li>Then can mint from vault by clicking the mint button</li>
                </ul>
              </div>
            </div>
            <div className="flex flex-col justify-center items-center">
              <div>
                <div>Vault Mode 2:</div>
                <input className="w-[600px] border-2 border-black p-2" onChange={(e) => setVaultMode2(e.target.value)} value={vaultMode2} />
              </div>
              <div>
                <div>Arweave URI Hashes:</div>
                <textarea className="w-[600px] border-2 border-black p-2" rows={5} onChange={(e) => setHashes(e.target.value.split("\n"))} value={hashes.join("\n")} />
              </div>
              <div className="flex gap-2">
                <button className="border-2 border-black p-2" onClick={fetchVault2}>
                  Fetch Vault2
                </button>
                <button className="border-2 border-black p-2" onClick={initNftVaultMode2}>
                  Init Vault2
                </button>
                <button className="border-2 border-black p-2" onClick={addUris}>
                  Add Uris to Vault2
                </button>
                <button className="border-2 border-black p-2" onClick={mint}>
                  Mint Mode 2
                </button>
              </div>
              <div className="p-2">
                Mode 2 Description:
                <ul>
                  <li>Create a new vault by clicking the Init Vault Mode 2 with entering the total supply and mint price, name, symbol, creator</li>
                  <li>Use already created vault by entering the public key</li>
                  <li>After initialize or enter the public key, have to send uri hashes to the vault mod 2 by entering the hashes list in the textarea and clicking the add uris button</li>
                  <li>Then can mint from vault by clicking the mint button</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
