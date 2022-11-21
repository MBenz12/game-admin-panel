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

export const SOLANA_RPC_HOST_MAINNET = 'https://quiet-aged-frog.solana-mainnet.quiknode.pro/6a56c0f12de472ff85a245955e5ff33d99704b1a/';
export const SOLANA_RPC_HOST_DEVNET = 'https://api.devnet.solana.com';
export const IS_DEV_ENVIRONMENT = false;

export const CONNECTION_NETWORK = IS_DEV_ENVIRONMENT ? WalletAdapterNetwork.Devnet : WalletAdapterNetwork.Mainnet;
export const CONNECTION_NETWORK_RPC = CONNECTION_NETWORK === WalletAdapterNetwork.Mainnet ? SOLANA_RPC_HOST_MAINNET : SOLANA_RPC_HOST_DEVNET;

export const NFT_VAULT_POOL_SEED = "nft_vault_pool";
export const GLOBAL_ACCOUNT_SEED = "global_account";
export const VAULT_SKT_SEED_PREFIX = "skt_pool";
export const RAFFLE_STORE_BUYERS = false;


export const REACT_APP_RAFFLES_PROGRAM_ID = "Hjaw5obT3bWQazo4bASgzjuP1mRgXoXMFbwVroHbWPSC";
export const REACT_APP_RAFFLE_VAULT_WALLET_ADDRESS = "9xAv1a1to5pzYEjmh5bEFcbZbFA5SuJfKDMu7J2WbqYB";
export const REACT_APP_SKT_TOKEN_ADDRESS = "SKTsW8KvzopQPdamXsPhvkPfwzTenegv3c3PEX4DT1o";
export const REACT_APP_SOLANA_RPC_HOST_MAINNET = "https://quiet-aged-frog.solana-mainnet.quiknode.pro/6a56c0f12de472ff85a245955e5ff33d99704b1a/";
export const VAULT_ADDRESS = "8Cd1qkkbq9XeB7GzUwVmak9d33QNd3ovqoTBEz8vmYHP";

export const SPLTOKENS_MAP_GET_TOKEN_NAME: (tokenAddress: string) => { tokenAddress: string; tokenName: string } = (tokenAddress: string) => {
  // @ts-ignore
  const res = [...SPLTOKENS_MAP].find(([_tokenName, _tokenAddress]) => _tokenAddress === tokenAddress);

  return res ? { tokenName: res[0], tokenAddress: res[1] } : { tokenName: "", tokenAddress: "" }
}

export const DEBUG_API_CALLS = true;
export const REACT_APP_IS_ACTIVE_SK_ENDPOINT = IS_DEV_ENVIRONMENT // false means use Servica.io (production)
export const REACT_APP_RAFFLE_AUTH = "tok42412354692119";
export const REACT_APP_SERVICA_API_ENDPOINT = "https://api.servica.io/extorio/apis/";
export const REACT_APP_SK_API_ENDPOINT = "https://api.solkitties.net/kitties/hooks/";


export const adminWallets = [
  "SERVUJeqsyaJTuVuXAmmko6kTigJmxzTxUMSThpC2LZ",
  "EF5qxGB1AirUH4ENw1niV1ewiNHzH2fWs7naQQYF2dc",
  "3qWq2ehELrVJrTg2JKKERm67cN6vYjm1EyhCEzfQ6jMd"
];
