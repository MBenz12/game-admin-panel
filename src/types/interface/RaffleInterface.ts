import * as anchor from "@project-serum/anchor";
import { AnchorProvider } from "@project-serum/anchor";
import { ConnectionContextState } from "@solana/wallet-adapter-react";
import { WalletContextState } from "@solana/wallet-adapter-react/src/useWallet";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { eInstructionsType } from "config/utils";
import { eCurrencyType } from "../../config/constants";
import { eRaffleType } from "../enum/RaffleEnum";

export interface userReduxStateTypes {
    userInfoData: {
        initialUserFoundFlag: boolean,
        userFoundFlag: any,
        userCoinsFlag: boolean,
        monthlySolFlag: boolean,
        ticketsFlag: boolean,
        userId: string
        userName: string,
        tokens2D: number,
        tokens3D: number,
        userCoinsMulti: string,
        userCoins: number,
        userAvatar: string,
        superPodUpgrades: string,
        stakedAmount: number,
        stakedWorth: number,
        totalStakeHolders: number,
        solmonthlp: number
    },
    userStakedTokensData: any[],
    userApprovedWallets: string[],
    userTicketsData: {
        ticketsBought: number,
        ticketsData: any[],
    }
    kittyNftHolding: {
        is2dHolder: boolean,
        is3dHolder: boolean,
    }
}

export interface walletReduxStateTypes {
    isWalletConneted: boolean,
    wallet2dNftData: any[],
    wallet3dNftData: any[],
    userWalletBalance: any
}

export interface nftCollectionType {
    collectionName: string,
    collectionUrl: string,
    collectionCreators: string,
    collectionUpdateAuth: string,
    collectionFloorPrice: string,
    collectionDescription: string,
    collectionSize: number
}

export interface raffleTokenType
{
    tokenName: eCurrencyType | string,
    tokenSPLAddress: string,
    isActive: boolean,
    order: number,
    exchangeUrl: string,
    solExchangeValue: number
}

export interface raffleTicketEntryType {
    ticketamount: string,
    userWalletAddress: string
}

export interface raffleWinnerWalletAddressType {
    tickets: number,
    userWalletAddress: string
}

export interface raffleNftDataType {
    userId: string,
    userWalletAddress: string,
    nftCollectionId: number,
    approvedCreatorAddress: string,
    nftCollection: nftCollectionType,
    collectionSocials: any,
    nftTokenAddress: string,
    nftName: string,
    nftImage: string,
    winnersAmount: number,
    dateCreated: string,
    endDate: string,
    ticketSupply: number,
    ticketPrice: number,
    ticketRemaining: number,
    ticketSold: number,
    raffleId: string,
    raffleToken: raffleTokenType,
    raffleType: eRaffleType,
    raffleTokenId: number,
    raffleTokenSPLAddress: string,
    raffleAddress: PublicKey|undefined,
    raffleTicketEntries: raffleTicketEntryType[],
    raffleWinnerWalletAddress: raffleWinnerWalletAddressType[],
    network: string,
    restrictions: any; // TBD to improve -> ? // { is2DHolderRestriction: boolean, is3DHolderRestriction: boolean },
    acceptTermAndConditions: boolean,
    undefined: boolean,
    active: boolean,
    action: string,
}

export interface dataInstructionType
{
    ownerWallet: string
    instruction: eInstructionsType,
    currency: eCurrencyType | string,
    userId: string,
    price: number,
    amount: number,
    total: number,
    network: string,
    raffleId?: number,
    raffleAddress?: PublicKey,
    extras: {}
}

export interface raffleFinalizeDataType
{
    provider: AnchorProvider,
    raffleBank: PublicKey,
    raffleAddress: PublicKey,
    splAddress: PublicKey,
    owner: PublicKey,
    winner: PublicKey,
    nftMint: PublicKey,
    raffleRoyalties: number;
}

export interface initRaffleTransactionDataType
{
    connection: Connection,
    anchorWallet: anchor.Wallet,
    raffleAddressKP: Keypair,
    raffleTokenSPLAddress: string,
    raffleTicketPrice: number,
    raffleTicketSupply: number,
    raffleNftAddress: string,
    raffleBank: PublicKey,
    raffleType: eRaffleType,
    tokenAddressTransfer: PublicKey,
    storeBuyers: boolean,
}

export interface transferSPLTokenDataType
{
    connection: Connection,
    sourceWallet: anchor.Wallet,
    destAddress: PublicKey,
    splTokenPublicKey: PublicKey
}

export interface raffleTypeInputDataType
{
    nftImageUrl: string,
    nftName: string,
    winnersAmount: number,
    nftCollectionId: number
}

export interface buyRaffleTicketsType
{
    userWalletAddress: string,
    raffleNftData: raffleNftDataType,
    raffleChainTicketData: any,
    userReduxStore: userReduxStateTypes,
    walletReduxStore: walletReduxStateTypes,
    connection: ConnectionContextState,
    wallet: WalletContextState,
    ticketsAmount: number
}
