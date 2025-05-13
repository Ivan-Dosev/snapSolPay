'use client'

import dynamic from 'next/dynamic'
import { AnchorProvider } from '@coral-xyz/anchor'
import { WalletError } from '@solana/wallet-adapter-base'
import {
  AnchorWallet,
  useConnection,
  useWallet,
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { ReactNode, useCallback, useMemo } from 'react'
import { useCluster } from '../cluster/cluster-data-access'
import { ellipsify } from '../ui/ui-layout'

require('@solana/wallet-adapter-react-ui/styles.css')

const WalletMultiButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
)

export function WalletButton() {
  const { publicKey, connected } = useWallet()
  
  return (
    <WalletMultiButton className={`btn rounded-lg border-none h-9 sm:h-10 min-h-0 min-w-0 sm:min-w-[120px] px-2 sm:px-4 text-sm sm:text-base ${connected ? 'wallet-connected' : 'bg-primary text-white hover:bg-primary-light'}`}>
      {connected && publicKey ? (
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="hidden sm:inline">{ellipsify(publicKey.toString())}</span>
          <span className="sm:hidden">{ellipsify(publicKey.toString(), 2)}</span>
        </div>
      ) : (
        <>
          <span className="hidden sm:inline">Connect Wallet</span>
          <span className="sm:hidden">Connect</span>
        </>
      )}
    </WalletMultiButton>
  )
}

export function SolanaProvider({ children }: { children: ReactNode }) {
  const { cluster } = useCluster()
  const endpoint = useMemo(() => cluster.endpoint, [cluster])
  const onError = useCallback((error: WalletError) => {
    console.error(error)
  }, [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} onError={onError} autoConnect={true}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export function useAnchorProvider() {
  const { connection } = useConnection()
  const wallet = useWallet()

  return new AnchorProvider(connection, wallet as AnchorWallet, { commitment: 'confirmed' })
}
