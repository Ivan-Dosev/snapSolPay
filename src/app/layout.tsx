import './globals.css'
import { ClusterProvider } from '@/components/cluster/cluster-data-access'
import { SolanaProvider } from '@/components/solana/solana-provider'
import { UiLayout } from '@/components/ui/ui-layout'
import { ReactQueryProvider } from './react-query-provider'
import { ContactsProvider } from '@/components/contacts/contacts-context'
import { PoolProvider } from '@/components/pool/pool-context'
import { CollateralProvider } from '@/components/collateral/collateral-context'

export const metadata = {
  title: 'snapSolPay',
  description: 'Analyze your receipts and bills with AI',
}

const links: { label: string; path: string }[] = [
  { label: 'Home', path: '/' },
  { label: 'Scanner', path: '/scanner' },
  { label: 'Contacts', path: '/contacts' },
  { label: 'Collateral', path: '/collateral' },
  { label: 'Wallet', path: '/account' },
  { label: 'Settings', path: '/clusters' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReactQueryProvider>
          <ClusterProvider>
            <SolanaProvider>
              <ContactsProvider>
                <PoolProvider>
                  <CollateralProvider>
                    <UiLayout links={links}>{children}</UiLayout>
                  </CollateralProvider>
                </PoolProvider>
              </ContactsProvider>
            </SolanaProvider>
          </ClusterProvider>
        </ReactQueryProvider>
      </body>
    </html>
  )
}
