import * as anchor from "@project-serum/anchor";
import { IdlTypes, Program, AnchorProvider } from "@project-serum/anchor";
import { TypeDef } from "@project-serum/anchor/dist/cjs/program/namespace/types";
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { WalletContextState } from "@solana/wallet-adapter-react/src/useWallet";
import {
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    Transaction
} from "@solana/web3.js";
import { Buffer } from "buffer";
import {
    GLOBAL_ACCOUNT_SEED,
    IS_DEV_ENVIRONMENT,
    REACT_APP_RAFFLES_PROGRAM_ID,
    SPLTOKENS_MAP_GET_TOKEN_NAME
} from "config/constants";
import {
    getAssociatedTokenAddressAndTransaction, getNftMetaData,
    raffleTransactionDataType,
    vaultTrancationDataType
} from "config/utils";
import { toast } from "react-toastify";
import { eRaffleType } from "types/enum/RaffleEnum";
import {
    initRaffleTransactionDataType,
    raffleFinalizeDataType,
    transferSPLTokenDataType
} from "types/interface/RaffleInterface";
import { AnchorRaffleTicket } from "../idl/anchor_raffle_ticket";


const idl_raffle = require('../idl/anchor_raffle_ticket.json');
const programID = REACT_APP_RAFFLES_PROGRAM_ID;

export function getProviderAndProgram(connection: Connection, anchorWallet: anchor.Wallet) {
    const provider = new AnchorProvider(connection, anchorWallet, AnchorProvider.defaultOptions());
    const program = new Program(idl_raffle, programID, provider) as Program<AnchorRaffleTicket>;

    return { provider, program };
}

export async function getRaffleAccount(rafflePubKey: PublicKey, connection: Connection, wallet: anchor.Wallet): Promise<TypeDef<{ name: "vault"; type: { kind: "struct"; fields: [{ name: "tokenType"; type: "publicKey" }, { name: "vaultBump"; type: "u8" }] } } | { name: "global"; type: { kind: "struct"; fields: [{ name: "authority"; type: "publicKey" }, { name: "authorizedAdmins"; type: { vec: "publicKey" } }] } } | { name: "raffle"; type: { kind: "struct"; fields: [{ name: "poolBump"; type: "u8" }, { name: "totalTickets"; type: "u32" }, { name: "soldTickets"; type: "u32" }, { name: "pricePerTicket"; type: "u64" }, { name: "tokenSplAddress"; type: "publicKey" }, { name: "owner"; type: "publicKey" }, { name: "nftMintAddress"; type: "publicKey" }, { name: "storeBuyers"; type: "bool" }, { name: "buyers"; type: { vec: { defined: "Buyer" } } }] } }, IdlTypes<AnchorRaffleTicket>> | null> {
    const { program } = getProviderAndProgram(connection, wallet);

    const raffle = await program.account.raffle.fetchNullable(rafflePubKey);

    try {
        if (raffle) {
            // @ts-ignore
            raffle.owner = raffle.owner.toString();
            // @ts-ignore
            raffle.nftMintAddress = raffle.nftMintAddress.toString();
            // @ts-ignore
            raffle.raffleAddress = rafflePubKey.toString();
            // @ts-ignore
            raffle.remainingTickets = raffle.totalTickets - raffle.soldTickets;
            // @ts-ignore
            raffle.pricePerTicketNum = raffle.pricePerTicket.toNumber() / anchor.web3.LAMPORTS_PER_SOL;
            // @ts-ignore
            raffle.tokenSplAddress = raffle.tokenSplAddress.toString();
            // @ts-ignore
            raffle.tokenSplAddressCurrencyType = SPLTOKENS_MAP_GET_TOKEN_NAME(raffle.tokenSplAddress.toString()).tokenName;
        }
    }
    catch (error) {
        console.error(error);
    }

    return raffle;
}

export async function getAndPrintRaffleAccount(rafflePubKey: PublicKey, connection: Connection, wallet: anchor.Wallet, logTitle: string = ""): Promise<TypeDef<{ name: "vault"; type: { kind: "struct"; fields: [{ name: "tokenType"; type: "publicKey" }, { name: "vaultBump"; type: "u8" }] } } | { name: "global"; type: { kind: "struct"; fields: [{ name: "authority"; type: "publicKey" }, { name: "authorizedAdmins"; type: { vec: "publicKey" } }] } } | { name: "raffle"; type: { kind: "struct"; fields: [{ name: "poolBump"; type: "u8" }, { name: "totalTickets"; type: "u32" }, { name: "soldTickets"; type: "u32" }, { name: "pricePerTicket"; type: "u64" }, { name: "tokenSplAddress"; type: "publicKey" }, { name: "owner"; type: "publicKey" }, { name: "nftMintAddress"; type: "publicKey" }, { name: "storeBuyers"; type: "bool" }, { name: "buyers"; type: { vec: { defined: "Buyer" } } }] } }, IdlTypes<AnchorRaffleTicket>> | null> {
    const raffle = await getRaffleAccount(rafflePubKey, connection, wallet);

    const title = !logTitle ? "Raffle Details:" : logTitle;
    ///console.log(title, JSON.stringify(raffle, undefined, 4));

    // @ts-ignore
    delete raffle["pricePerTicket"];

    console.log(title, raffle);

    return raffle;
}

/**
Initialize a new raffle on chain
 */
async function getCreateRaffleAccountTransaction(initRaffleTransactionData: initRaffleTransactionDataType): Promise<Transaction> {
    const { program } = getProviderAndProgram(initRaffleTransactionData.connection, initRaffleTransactionData.anchorWallet);
    const { anchorWallet, raffleAddressKP, raffleTicketSupply, storeBuyers } = initRaffleTransactionData;
    const maxBuyers = storeBuyers ? raffleTicketSupply : 0;

    // {
        // pub struct Raffle                        8: Discriminator
        // {
        //     pub pool_bump: u8,                   1
        //     pub total_tickets: u32,              4
        //     pub sold_tickets: u32,               4
        //     pub price_per_ticket: u64,           8
        //     pub token_spl_address: Pubkey,       32
        //     pub owner: Pubkey,                   32
        //     pub nft_mint_address: Pubkey,        32
        //     pub store_buyers: bool,              1
        //     pub buyers: Vec<Buyer>,              (32 + 4 + 8) * maxBuyers + 8(vector Discriminator)
        // }
        // pub struct Buyer {                       8: Discriminator
        //     pub key: Pubkey,                     32
        //     pub tickets: u32,                    4
        // }
    // }


    const space = (1 + 4 + 4 + 8 + 32 + 32 + 32 + 1 + ((32 + 4 + 8) * maxBuyers + 8)) + 8;
    const rentExemptionAmount = await program.provider.connection.getMinimumBalanceForRentExemption(space);

    return new Transaction().add(SystemProgram.createAccount({
        fromPubkey: anchorWallet.publicKey,
        newAccountPubkey: raffleAddressKP.publicKey,
        lamports: rentExemptionAmount,
        space,
        programId: program.programId
    }));
}

export async function getRaffleFinalizeTransaction(raffleFinalizeDataType: raffleFinalizeDataType): Promise<Transaction> {
    const { program } = getProviderAndProgram(raffleFinalizeDataType.provider.connection, raffleFinalizeDataType.provider.wallet as anchor.Wallet);
    const connection = program.provider.connection;
    const raffleAddress = raffleFinalizeDataType.raffleAddress;
    const winner = raffleFinalizeDataType.winner;
    const nftMint = raffleFinalizeDataType.nftMint;
    const raffleBank = raffleFinalizeDataType.raffleBank;
    const owner = raffleFinalizeDataType.owner;
    const splAddress = raffleFinalizeDataType.splAddress;
    const splAddressSKT = new PublicKey("SKTsW8KvzopQPdamXsPhvkPfwzTenegv3c3PEX4DT1o");
    const raffleRoyalties = raffleFinalizeDataType.raffleRoyalties;

    const raffleAccount = await getRaffleAccount(raffleAddress, connection, raffleFinalizeDataType.provider.wallet as anchor.Wallet);
    const raffleToken = raffleAccount!.tokenSplAddress;
    const raffleTokenName = SPLTOKENS_MAP_GET_TOKEN_NAME(raffleToken.toString());

    // @ts-ignore
    const raffleBalance = raffleAccount!.soldTickets * raffleAccount!.pricePerTicketNum;
    const raffleBankRoyalties = raffleBalance * raffleRoyalties / 100;
    const raffleOwnerPrize = raffleBalance - raffleBankRoyalties;

    const cluster = IS_DEV_ENVIRONMENT ? "?cluster=devnet" : "";
    const nftMetaData = await getNftMetaData(nftMint, connection);

    const options: any = { position: toast.POSITION.TOP_LEFT, className: 'raffle-finalize-toast-width', autoClose: false };
    toast.error(``, options);
    toast.error(`NFT Win ${nftMetaData.name} ==> ${winner}`, options);
    toast.error(`Raffle Owner Payout: ${raffleOwnerPrize.toFixed(4)} \\$${raffleTokenName.tokenName} ==> ${owner}`, options);
    toast.error(`Raffle Bank Royalties: ${raffleBankRoyalties.toFixed(4)} \\$${raffleTokenName.tokenName} ==> ${raffleBank}`, options);

    console.log(`======= Raffle Finalize =======`);
    console.log(`NFT Mint: ${nftMint} | ${nftMetaData.name} \n --> https://solscan.io/token/${nftMint}${cluster}`);
    console.log(`NFT Winner Wallet: ${winner}`);
    console.log(`Raffle Owner Wallet: ${owner}`);
    console.log(`==============================`);
    console.log(`Raffle Balance: ${raffleBalance.toFixed(2)} \\$${raffleTokenName.tokenName}`);
    console.log(`Raffle Tickets Sold: ${raffleAccount!.soldTickets}/${raffleAccount!.totalTickets}`);
    console.log(`NFT Win ${nftMetaData.name} ==> ${winner}`);
    console.log(`Raffle Owner Payout: ${raffleOwnerPrize.toFixed(4)} \\$${raffleTokenName.tokenName} ==> ${owner}`);
    console.log(`Raffle Bank Royalties: ${raffleBankRoyalties.toFixed(4)} \\$${raffleTokenName.tokenName} ==> ${raffleBank}`);
    console.log("Approved?");
    console.log(`==============================`);

    //return new Transaction();

    // send nft to raffle winner
    console.log(`Get Assoc for Raffle NFT Winner...`);
    const t1 = await getAssociatedTokenAddressAndTransaction(connection, nftMint, raffleBank, winner);
    const raffleNftAta = t1.sourceATA;
    const winnerNftAta = t1.recipientATA;

    // send payment to raffle owner 95%
    console.log(`Get Assoc for Raffle Owner Funds...`);
    // if we transfer SOL, we need to fake ownerSplAta to match owner, so we will use SKT for it
    const splAddress2 = splAddress.equals(PublicKey.default) ? splAddressSKT : splAddress;
    const t2 = await getAssociatedTokenAddressAndTransaction(connection, splAddress2, raffleBank, owner);
    const raffleSplAta = t2.sourceATA;
    const ownerSplAta = t2.recipientATA;

    const transaction = new Transaction()
    transaction.add(t1.transaction);
    transaction.add(t2.transaction);
    transaction.add(program.transaction.raffleFinalize(raffleRoyalties,
        {
            accounts: {
                raffleBank,
                raffle: raffleAddress,
                owner,
                raffleNftAta,
                winnerNftAta,
                raffleSplAta,
                ownerSplAta,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId
            }
        }));

    return transaction;
}

export async function getInitRaffleTransaction(initRaffleTransactionData: initRaffleTransactionDataType): Promise<Transaction> {
    const { provider, program } = getProviderAndProgram(initRaffleTransactionData.connection, initRaffleTransactionData.anchorWallet);
    const connection = initRaffleTransactionData.connection;
    const anchorWallet = initRaffleTransactionData.anchorWallet;
    const raffleAddressKP = initRaffleTransactionData.raffleAddressKP;
    const raffleTokenSPLAddress = initRaffleTransactionData.raffleTokenSPLAddress;
    const raffleNftAddress = initRaffleTransactionData.raffleNftAddress;
    const price = initRaffleTransactionData.raffleTicketPrice;
    const amount = initRaffleTransactionData.raffleTicketSupply;
    const storeBuyers = initRaffleTransactionData.storeBuyers;
    const raffleType = initRaffleTransactionData.raffleType;
    const transferNft = raffleType === eRaffleType.NFT;
    const [global] = await PublicKey.findProgramAddress([Buffer.from(GLOBAL_ACCOUNT_SEED)], program.programId);

    console.log("Provider:", provider.connection);
    console.log("AnchorWallet:", anchorWallet.publicKey.toString());
    console.log(`Creating Raffle... raffleTokenSPLAddress: ${raffleTokenSPLAddress} price: ${price} supply: ${amount} raffleAddress: ${raffleAddressKP.publicKey.toString()} transferNft: ${transferNft}`);

    const priceBN = new anchor.BN(Math.ceil(price * anchor.web3.LAMPORTS_PER_SOL));
    const tokenTypePubKey = new PublicKey(raffleTokenSPLAddress);
    const raffleNftAddressPubKey = new PublicKey(raffleNftAddress);

    const splTokenPublicKey = initRaffleTransactionData.tokenAddressTransfer;
    const sourcePublicKey = anchorWallet.publicKey;
    const destPublicKey = initRaffleTransactionData.raffleBank;

    console.log("SPL-Token Transfer: " + splTokenPublicKey.toString())

    const { transaction, sourceATA, recipientATA } = await getAssociatedTokenAddressAndTransaction(connection, splTokenPublicKey, sourcePublicKey, destPublicKey)

    transaction.add(await getCreateRaffleAccountTransaction(initRaffleTransactionData));
    transaction.add(await program.transaction.initialize(tokenTypePubKey, priceBN, amount, storeBuyers, transferNft, raffleNftAddressPubKey,
        {
            accounts:
            {
                // Global
                global: global,

                // Init Raffle
                payer: anchorWallet.publicKey,
                raffle: raffleAddressKP.publicKey,
                systemProgram: SystemProgram.programId,

                // Token Transfer
                senderAta: sourceATA,
                rafflePoolAta: recipientATA,
                tokenProgram: TOKEN_PROGRAM_ID
            },
        }));

    // Sign transaction with raffleAddressKP
    transaction.feePayer = anchorWallet.publicKey;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    transaction.sign(raffleAddressKP);

    return transaction;
}

export async function getInitWithPDARaffleTransaction(initRaffleTransactionData: initRaffleTransactionDataType): Promise<Transaction> {
    const { provider, program } = getProviderAndProgram(initRaffleTransactionData.connection, initRaffleTransactionData.anchorWallet);

    const connection = initRaffleTransactionData.connection;
    const anchorWallet = initRaffleTransactionData.anchorWallet;
    const raffleAddressKP = initRaffleTransactionData.raffleAddressKP;
    const raffleTokenSPLAddress = initRaffleTransactionData.raffleTokenSPLAddress;
    const raffleNftAddress = initRaffleTransactionData.raffleNftAddress;
    const price = initRaffleTransactionData.raffleTicketPrice;
    const amount = initRaffleTransactionData.raffleTicketSupply;

    console.log("Provider:", provider.connection);
    console.log("AnchorWallet:", anchorWallet.publicKey.toString());
    console.log(`Creating Raffle... raffleTokenSPLAddress: ${raffleTokenSPLAddress} price: ${price} supply: ${amount} raffleAddress: ${raffleAddressKP.publicKey.toString()}`);

    const priceBN = new anchor.BN(Math.ceil(price * anchor.web3.LAMPORTS_PER_SOL));
    const tokenTypePubKey = new PublicKey(raffleTokenSPLAddress);
    const raffleNftAddressPubKey = new PublicKey(raffleNftAddress);


    const splTokenPublicKey = initRaffleTransactionData.tokenAddressTransfer;
    const sourcePublicKey = anchorWallet.publicKey;
    const [rafflePool, bump] = await PublicKey.findProgramAddress([Buffer.from("raffle_pool"), raffleAddressKP.publicKey.toBuffer()], program.programId);
    const destPublicKey = rafflePool;

    console.log("Raffle Pool", rafflePool.toString());
    console.log("SPL-Token Transfer: " + splTokenPublicKey.toString())

    const sourceATA = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, splTokenPublicKey, sourcePublicKey);
    let recipientATA = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, splTokenPublicKey, destPublicKey, true);

    console.log("Raffle Pool ATA", recipientATA.toString());

    // Make sure receiver has a token account active
    const receiverAccount = await connection.getAccountInfo(recipientATA);
    let transaction = new Transaction();
    if (receiverAccount === null) {
        console.log("Creating recipientATA:", recipientATA.toString());
        transaction.add(Token.createAssociatedTokenAccountInstruction(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, splTokenPublicKey, recipientATA, destPublicKey, sourcePublicKey));
    }

    // const storeBuyers = initRaffleTransactionData.storeBuyers;
    const storeBuyers = false;

    transaction.add(await getCreateRaffleAccountTransaction(initRaffleTransactionData));

    transaction.add(await program.transaction.initializeWithPda(bump, tokenTypePubKey, priceBN, amount, storeBuyers, raffleNftAddressPubKey,
        {
            accounts:
            {
                // Init Raffle
                payer: anchorWallet.publicKey,
                raffle: raffleAddressKP.publicKey,
                systemProgram: SystemProgram.programId,

                // Token Transfer
                senderAta: sourceATA,
                rafflePoolAta: recipientATA,
                tokenProgram: TOKEN_PROGRAM_ID
            },
        }));

    // Sign transaction with raffleAddressKP
    transaction.feePayer = anchorWallet.publicKey;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    transaction.sign(raffleAddressKP);

    return transaction;
}

export async function getBuyTicketTransactionBySOL(ticketTransactionData: raffleTransactionDataType): Promise<Transaction> {
    const { program } = getProviderAndProgram(ticketTransactionData.connection, ticketTransactionData.wallet);

    const raffleAddress = ticketTransactionData.raffleAddress;
    const rafflePrice = ticketTransactionData.raffleTicketPrice;
    const raffleTotalPrice = ticketTransactionData.ticketAmount * ticketTransactionData.raffleTicketPrice;
    const raffleBank = ticketTransactionData.raffleBank;
    const ticketAmount = ticketTransactionData.ticketAmount;
    const ticketPriceLAMPORTS = new anchor.BN(rafflePrice * anchor.web3.LAMPORTS_PER_SOL); // use for constraint confirmation only
    const splTokenPublicKey = ticketTransactionData.splTokenPublicKey;

    console.log("Raffle:", raffleAddress.toString(), "Bank:", raffleBank.toString());
    await getAndPrintRaffleAccount(raffleAddress, ticketTransactionData.connection, ticketTransactionData.wallet);

    console.log(`Wants to buy tickets: ${ticketAmount} ticket price: ${rafflePrice} total price: ${raffleTotalPrice}`);

    const tx: Transaction = await program.transaction.buyTicketSol(ticketAmount, ticketPriceLAMPORTS, splTokenPublicKey,
        {
            accounts: {
                buyer: ticketTransactionData.wallet.publicKey,
                recipient: raffleBank,
                raffle: raffleAddress,
                systemProgram: SystemProgram.programId,
            },
        });

    return tx;
}

export async function getBuyTicketTransactionBySOLWithPDA(ticketTransactionData: raffleTransactionDataType): Promise<Transaction> {
    const { program } = getProviderAndProgram(ticketTransactionData.connection, ticketTransactionData.wallet);

    const raffleAddress = ticketTransactionData.raffleAddress;
    const rafflePrice = ticketTransactionData.raffleTicketPrice;
    const raffleTotalPrice = ticketTransactionData.ticketAmount * ticketTransactionData.raffleTicketPrice;
    // const raffleBank = ticketTransactionData.raffleBank;
    const ticketAmount = ticketTransactionData.ticketAmount;
    const ticketPriceLAMPORTS = new anchor.BN(rafflePrice * anchor.web3.LAMPORTS_PER_SOL); // use for constraint confirmation only
    const splTokenPublicKey = ticketTransactionData.splTokenPublicKey;


    const [rafflePool] = await PublicKey.findProgramAddress(
        [
            Buffer.from("raffle_pool"),
            raffleAddress.toBuffer(),
        ],
        program.programId
    );

    console.log("Raffle :", raffleAddress.toString());
    await getAndPrintRaffleAccount(raffleAddress, ticketTransactionData.connection, ticketTransactionData.wallet);

    console.log(`Wants to buy tickets: ${ticketAmount} ticket price: ${rafflePrice} total price: ${raffleTotalPrice}`);

    const tx: Transaction = await program.transaction.buyTicketSol(ticketAmount, ticketPriceLAMPORTS, splTokenPublicKey,
        {
            accounts: {
                buyer: ticketTransactionData.wallet.publicKey,
                recipient: rafflePool,
                raffle: raffleAddress,
                systemProgram: SystemProgram.programId,
            },
        });

    return tx;
}

export async function getBuyTicketTransactionBySPL(ticketTransactionData: raffleTransactionDataType): Promise<Transaction> {
    const { program } = getProviderAndProgram(ticketTransactionData.connection, ticketTransactionData.wallet);

    const connection = ticketTransactionData.connection;
    const splTokenPublicKey = ticketTransactionData.splTokenPublicKey;
    const sourcePublicKey = ticketTransactionData.wallet.publicKey;
    const destPublicKey = ticketTransactionData.raffleBank;
    const raffleAddress = ticketTransactionData.raffleAddress;
    const amount = ticketTransactionData.ticketAmount
    const pricePerTicket = ticketTransactionData.raffleTicketPrice;
    const pricePerTicketLAMPORTS = ticketTransactionData.raffleTicketPrice * LAMPORTS_PER_SOL;
    const raffleTotalPrice = ticketTransactionData.ticketAmount * ticketTransactionData.raffleTicketPrice;

    console.log("SPL-Token: " + ticketTransactionData.currencyType + " | " + splTokenPublicKey.toString())
    console.log("Raffle :", raffleAddress.toString());
    // let raffleChainData = await getAndPrintRaffleAccount(raffleAddress, ticketTransactionData.connection, ticketTransactionData.wallet);

    const sourceATA = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, splTokenPublicKey, sourcePublicKey);
    let recipientATA = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, splTokenPublicKey, destPublicKey);

    // Make sure receiver has a token account active
    const receiverAccount = await connection.getAccountInfo(recipientATA);
    let transaction = new Transaction();
    if (receiverAccount === null) {
        console.log("Creating recipientATA:", recipientATA.toString());

        transaction.add(
            Token.createAssociatedTokenAccountInstruction(
                ASSOCIATED_TOKEN_PROGRAM_ID,
                TOKEN_PROGRAM_ID,
                splTokenPublicKey,
                recipientATA,
                destPublicKey,
                sourcePublicKey
            )
        )
    }

    console.log("Source TokenAccount:", sourceATA.toString());
    console.log("Dest TokenAccount:", recipientATA.toString());
    //console.log("Receiver Account:", receiverAccount);

    console.log(`Wants to buy tickets: ${amount} ticket price: ${pricePerTicket} total price: ${raffleTotalPrice}`);

    // @ts-ignore
    transaction.add(
        await program.transaction.buyTicketSpl(amount, new anchor.BN(pricePerTicketLAMPORTS), splTokenPublicKey,
            {
                accounts:
                {
                    raffle: raffleAddress,
                    sender: sourcePublicKey,
                    senderTokens: sourceATA,
                    recipientTokens: recipientATA,
                    tokenProgram: TOKEN_PROGRAM_ID
                },
            })
    );

    return transaction;
}

export async function getBuyTicketTransactionBySPLWithPDA(ticketTransactionData: raffleTransactionDataType): Promise<Transaction> {
    const { program } = getProviderAndProgram(ticketTransactionData.connection, ticketTransactionData.wallet);

    const connection = ticketTransactionData.connection;
    const splTokenPublicKey = ticketTransactionData.splTokenPublicKey;
    const sourcePublicKey = ticketTransactionData.wallet.publicKey;
    // const destPublicKey = ticketTransactionData.raffleBank;
    const raffleAddress = ticketTransactionData.raffleAddress;
    const amount = ticketTransactionData.ticketAmount
    const pricePerTicket = ticketTransactionData.raffleTicketPrice;
    const pricePerTicketLAMPORTS = ticketTransactionData.raffleTicketPrice * LAMPORTS_PER_SOL;
    const raffleTotalPrice = ticketTransactionData.ticketAmount * ticketTransactionData.raffleTicketPrice;

    const [rafflePool] = await PublicKey.findProgramAddress(
        [
            Buffer.from("raffle_pool"),
            new PublicKey(raffleAddress.toString()).toBuffer(),
        ],
        program.programId
    );

    const destPublicKey = rafflePool;

    console.log("SPL-Token: " + ticketTransactionData.currencyType + " | " + splTokenPublicKey.toString())
    console.log("Raffle :", raffleAddress.toString());
    // let raffleChainData = await getAndPrintRaffleAccount(raffleAddress, ticketTransactionData.connection, ticketTransactionData.wallet);

    const sourceATA = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, splTokenPublicKey, sourcePublicKey);
    let recipientATA = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, splTokenPublicKey, destPublicKey, true);

    // Make sure receiver has a token account active
    const receiverAccount = await connection.getAccountInfo(recipientATA);
    let transaction = new Transaction();
    if (receiverAccount === null) {
        console.log("Creating recipientATA:", recipientATA.toString());

        transaction.add(
            Token.createAssociatedTokenAccountInstruction(
                ASSOCIATED_TOKEN_PROGRAM_ID,
                TOKEN_PROGRAM_ID,
                splTokenPublicKey,
                recipientATA,
                destPublicKey,
                sourcePublicKey
            )
        )
    }

    console.log("Source TokenAccount:", sourceATA.toString());
    console.log("Dest TokenAccount:", recipientATA.toString());
    //console.log("Receiver Account:", receiverAccount);

    console.log(`Wants to buy tickets: ${amount} ticket price: ${pricePerTicket} total price: ${raffleTotalPrice}`);

    // @ts-ignore
    transaction.add(
        await program.transaction.buyTicketSpl(amount, new anchor.BN(pricePerTicketLAMPORTS), splTokenPublicKey,
            {
                accounts:
                {
                    raffle: raffleAddress,
                    sender: sourcePublicKey,
                    senderTokens: sourceATA,
                    recipientTokens: recipientATA,
                    tokenProgram: TOKEN_PROGRAM_ID
                },
            })
    );

    return transaction;
}

export async function getTransferSPLTokenTransaction(ticketTransactionData: transferSPLTokenDataType): Promise<Transaction> {
    let transaction = new Transaction();

    const { program } = getProviderAndProgram(ticketTransactionData.connection, ticketTransactionData.sourceWallet);

    const connection = ticketTransactionData.connection;
    const splTokenPublicKey = ticketTransactionData.splTokenPublicKey;
    const sourcePublicKey = ticketTransactionData.sourceWallet.publicKey;
    const destPublicKey = ticketTransactionData.destAddress;

    console.log("SPL-Token: " + splTokenPublicKey.toString())

    const sourceATA = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, splTokenPublicKey, sourcePublicKey);
    let recipientATA = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, splTokenPublicKey, destPublicKey);

    // Make sure receiver has a token account active
    const receiverAccount = await connection.getAccountInfo(recipientATA);
    if (receiverAccount === null) {
        console.log("Creating recipientATA:", recipientATA.toString());
        transaction.add(Token.createAssociatedTokenAccountInstruction(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, splTokenPublicKey, recipientATA, destPublicKey, sourcePublicKey));
    }

    console.log("Source TokenAccount:", sourceATA.toString());
    console.log("Dest TokenAccount:", recipientATA.toString());

    console.log(`Going to transfer Token: ${splTokenPublicKey.toString()} To: ${destPublicKey.toString()}`);

    transaction.add
        (
            await program.transaction.transferSplToken
                (
                    new anchor.BN(1),
                    {
                        accounts:
                        {
                            sender: sourcePublicKey,
                            senderTokens: sourceATA,
                            recipientTokens: recipientATA,
                            tokenProgram: TOKEN_PROGRAM_ID
                        }
                    }
                )
        );

    return transaction;
}

export async function convertKCtoSKTWithBackend(connection: Connection, wallet: WalletContextState, serializedTx: string, userCoinsToConvert: number, onSuccessCallback: any) {
    const { program } = getProviderAndProgram(connection, wallet as any as anchor.Wallet);
    const recoveredTx = Transaction.from(Buffer.from(serializedTx, "base64"));

    const txSignature = await wallet.sendTransaction(recoveredTx, program.provider.connection);
    toast.info(`Converting ${userCoinsToConvert} KC to $SKT in progress...`, { autoClose: 50000 });

    let retries = 5;
    while (retries > 0) {
        try {
            await program.provider.connection.confirmTransaction(txSignature, "confirmed");
            retries = -1;
        }
        catch (e) {
            console.warn(e);
            console.log("Retrying again... left:", retries)
            retries--;
        }
    }

    toast.dismiss();
    toast.info(`Conversion done successfully.`);
    console.log("Conversion DONE!:", txSignature);

    // Done, call success callback
    onSuccessCallback();
}

export async function getConvertSktSolTransaction(ticketTransactionData: vaultTrancationDataType): Promise<Transaction> {
    const { program } = getProviderAndProgram(ticketTransactionData.connection, ticketTransactionData.wallet);

    // const connection = ticketTransactionData.connection;
    const claimer = ticketTransactionData.wallet.publicKey;
    const claimerSktAccount = ticketTransactionData.claimerAta;
    const sktMint = ticketTransactionData.sktMint;
    const vault = ticketTransactionData.vault;
    const vaultPool = ticketTransactionData.vaultPool;
    const vaultPoolSktAccount = ticketTransactionData.vaultPoolAta;
    const exchangeOption = ticketTransactionData.exchangeOption;
    const isHolder = ticketTransactionData.isHolder;
    const transactionPrice = ticketTransactionData.transactionPrice;
    const kittyCoinsGrantAmount = ticketTransactionData.kittyCoinsGrantAmount;

    console.log(`Wants to convert SOL to $SKT: exchangeOption: ${exchangeOption} Coins: ${kittyCoinsGrantAmount} Costs: ${transactionPrice} SOL, isHolder: ${isHolder}`);

    const tx: Transaction = program.transaction.convertSktSol(exchangeOption, isHolder,
        {
            accounts:
            {
                claimer,
                claimerSktAccount,
                sktMint,
                vault,
                vaultPool,
                vaultPoolSktAccount,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                rent: SYSVAR_RENT_PUBKEY,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId
            },
        });

    return tx;
}