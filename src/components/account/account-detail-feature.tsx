'use client'

import { PublicKey } from '@solana/web3.js'
import { useMemo } from 'react'

import { useParams } from 'next/navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ExplorerLink } from '../cluster/cluster-ui'
import { AppHero, ellipsify } from '../ui/ui-layout'
import { AccountBalance, AccountButtons, AccountTokens, AccountTransactions } from './account-ui'
import { TransactionDashboard } from './transaction-dashboard'

// Create a client
const queryClient = new QueryClient()

export default function AccountDetailFeature() {
  const params = useParams()
  const address = useMemo(() => {
    if (!params.address) {
      return
    }
    try {
      return new PublicKey(params.address)
    } catch (e) {
      console.log(`Invalid public key`, e)
    }
  }, [params])
  if (!address) {
    return <div>Error loading account</div>
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div>
        <AppHero
          title={<AccountBalance address={address} />}
          subtitle={
            <div className="my-4">
              <ExplorerLink path={`account/${address}`} label={ellipsify(address.toString())} />
            </div>
          }
        >
          <div className="my-4">
            <AccountButtons address={address} />
          </div>
        </AppHero>
        <div className="container mx-auto px-4 space-y-8">
          <AccountTokens address={address} />
          <AccountTransactions address={address} />
          
          <div id="transaction-dashboard" className="hidden">
            <TransactionDashboard address={address} />
          </div>
        </div>
      </div>
    </QueryClientProvider>
  )
}
