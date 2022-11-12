import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

export enum eCurrencyType {
  SOL = "SOL",
  DUST = "DUST",
  CRECK = "CRECK",
  FORGE = "FORGE",
  SKT = "SKT",
  USDC = "USDC",
  SKBC = "SKBC",
  SCRAP = "SCRAP",
  PYJ = "PYJ",
  LINX = "LINX",
}

export const SPLTOKENS_MAP: Map<string, string> = new Map();
SPLTOKENS_MAP.set(eCurrencyType.SKT, 'SKTsW8KvzopQPdamXsPhvkPfwzTenegv3c3PEX4DT1o');
SPLTOKENS_MAP.set(eCurrencyType.CRECK, 'Ao94rg8D6oK2TAq3nm8YEQxfS73vZ2GWYw2AKaUihDEY');
SPLTOKENS_MAP.set('CRECK_D', 'ASxC3n3smkcUkA7Z58EUKZ2NfHoQ8eZrkTRK7ergYr2a');
SPLTOKENS_MAP.set(eCurrencyType.DUST, 'DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ');
SPLTOKENS_MAP.set('DUST_D', '8kY8hSzXbD9uwmNtsDtRmSxQhbVwAK22kaJVbWzvQwn3');
SPLTOKENS_MAP.set(eCurrencyType.FORGE, 'FoRGERiW7odcCBGU1bztZi16osPBHjxharvDathL5eds');
SPLTOKENS_MAP.set(eCurrencyType.USDC, 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
SPLTOKENS_MAP.set(eCurrencyType.SOL, '11111111111111111111111111111111');
SPLTOKENS_MAP.set(eCurrencyType.SKBC, 'PXWNGZXNUQfnaa5eKhmRW7rBrUKWTW86KwyFRnGMuwR');
SPLTOKENS_MAP.set(eCurrencyType.SCRAP, '6naWDMGNWwqffJnnXFLBCLaYu1y5U9Rohe5wwJPHvf1p');
SPLTOKENS_MAP.set(eCurrencyType.PYJ, '3bYb7U7ofZzXraVUz28DpqwQG127NW3nFVoiGtC4PrH6');
SPLTOKENS_MAP.set(eCurrencyType.LINX, '6ajDhJoo1kxcEredyJWYrcq4tCQW4gRywB7LLMNtuw2U');

const SOLANA_RPC_HOST_MAINNET = 'https://quiet-aged-frog.solana-mainnet.quiknode.pro/6a56c0f12de472ff85a245955e5ff33d99704b1a/';
const SOLANA_RPC_HOST_DEVNET = 'https://api.devnet.solana.com';
let IS_DEV_ENVIRONMENT = false;

export const CONNECTION_NETWORK = IS_DEV_ENVIRONMENT ?  WalletAdapterNetwork.Devnet : WalletAdapterNetwork.Mainnet;
export const CONNECTION_NETWORK_RPC = CONNECTION_NETWORK === WalletAdapterNetwork.Mainnet ? SOLANA_RPC_HOST_MAINNET : SOLANA_RPC_HOST_DEVNET;

export const NFT_VAULT_POOL_SEED = "nft_vault_pool";
