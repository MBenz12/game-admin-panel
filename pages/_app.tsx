/* eslint-disable react-hooks/exhaustive-deps */
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { SlopeWalletAdapter, SolletWalletAdapter } from '@solana/wallet-adapter-wallets';
import { CONNECTION_NETWORK, CONNECTION_NETWORK_RPC } from 'config/constants';
import type { AppProps } from 'next/app';
import { useMemo } from 'react';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const network = CONNECTION_NETWORK;
  const network_rpc = CONNECTION_NETWORK_RPC;
  const endpoint = useMemo(() => network_rpc, [network]);
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(), 
    new SolflareWalletAdapter({network}), 
    new SolletWalletAdapter({network}), 
    new SlopeWalletAdapter({network})
  ], [network]);
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets}>
        <WalletModalProvider>
          <Component {...pageProps} />
        </WalletModalProvider>          
      </WalletProvider>
    </ConnectionProvider>
  )
}
