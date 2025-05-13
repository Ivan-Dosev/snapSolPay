'use client'

import { useState, useEffect } from 'react'
import { AppHero } from '../ui/ui-layout'
import { usePool, Pool, PoolTransaction, PoolContribution, PoolLoan } from './pool-context'
import { useContacts } from '../contacts/contacts-context'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '../solana/solana-provider'
import { useSolanaPoolService, SolanaPoolAccount } from '../solana/solana-pool-service'
import toast from 'react-hot-toast'
import { VirtualCard } from './virtual-card'
import { CardTransaction } from './card-transaction'

export default function PoolFeature() {
  const { 
    pools,
    createPool,
    getPoolBalance, 
    contributions, 
    transactions, 
    loans,
    addContribution,
    withdrawFromPool,
    getUserBalance,
    getUserContributions,
    getUserLoans,
    repayLoan,
    getPoolContributions,
    getPoolTransactions,
    getPoolLoans,
    setPoolSolanaAddress,
    deletePool
  } = usePool()
  
  const { 
    poolAccounts,
    isInitializing,
    isLoadingBalances,
    initializePool,
    contributeToPool,
    withdrawFromPool: withdrawFromSolanaPool,
    closePool
  } = useSolanaPoolService()
  
  const { contacts } = useContacts()
  const { publicKey, connected } = useWallet()
  
  // State for pool selection and creation
  const [selectedPoolId, setSelectedPoolId] = useState<string>('')
  const [showCreatePool, setShowCreatePool] = useState<boolean>(false)
  const [newPoolName, setNewPoolName] = useState<string>('')
  const [newPoolDescription, setNewPoolDescription] = useState<string>('')
  
  // State for deposits and withdrawals
  const [depositAmount, setDepositAmount] = useState<string>('')
  const [withdrawAmount, setWithdrawAmount] = useState<string>('')
  const [selectedContactId, setSelectedContactId] = useState<string>('')
  
  // State for UI tabs and actions
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'loans' | 'solana' | 'card'>('solana')
  const [repayLoanId, setRepayLoanId] = useState<string | null>(null)
  const [repayAmount, setRepayAmount] = useState<string>('')
  const [isSolanaInitializing, setIsSolanaInitializing] = useState<boolean>(false)
  
  // Format date for display
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // Handle creating a new pool
  const handleCreatePool = async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first')
      return
    }
    
    if (!newPoolName.trim()) {
      toast.error('Please enter a pool name')
      return
    }
    
    // Get the current user/contact information
    const ownerId = publicKey.toString()
    const ownerName = contacts.find(c => c.walletAddress === ownerId)?.name || 'My Wallet'
    const ownerAvatar = contacts.find(c => c.walletAddress === ownerId)?.avatar || '👤'
    
    const poolId = createPool(
      newPoolName,
      ownerId,
      ownerName,
      ownerAvatar,
      newPoolDescription
    )
    
    if (poolId) {
      setSelectedPoolId(poolId)
      setShowCreatePool(false)
      setNewPoolName('')
      setNewPoolDescription('')
      
      // Initialize the Solana pool account
      setIsSolanaInitializing(true)
      try {
        toast.loading('Creating a new pool on Solana blockchain...', { id: 'init-pool' })
        const initialized = await initializePool(poolId)
        
        if (initialized && poolAccounts[poolId]) {
          // Update the pool with Solana addresses
          setPoolSolanaAddress(
            poolId,
            poolAccounts[poolId].pubkey,
            poolAccounts[poolId].tokenAccount
          )
          toast.success('Pool successfully created on Solana!', { id: 'init-pool' })
        } else {
          toast.error('Failed to create pool on Solana. Please try again.', { id: 'init-pool' })
        }
      } catch (error) {
        console.error('Error creating Solana pool:', error)
        
        // Check for common errors and provide user-friendly messages
        let errorMessage = 'Failed to create Solana pool'
        
        if (error instanceof Error) {
          if (error.message.includes('not enough funds')) {
            errorMessage = 'Not enough SOL in your wallet to create the pool. Please request an airdrop.'
          } else if (error.message.includes('User rejected')) {
            errorMessage = 'Transaction was rejected from your wallet.'
          } else if (error.message.includes('timeout')) {
            errorMessage = 'Transaction timed out. The network may be congested, please try again.'
          }
        }
        
        toast.error(errorMessage, { id: 'init-pool' })
      } finally {
        setIsSolanaInitializing(false)
      }
    }
  }
  
  // Handle deposits to the pool
  const handleDeposit = async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first')
      return
    }
    
    if (!selectedPoolId) {
      toast.error('Please select a pool')
      return
    }
    
    const amount = parseFloat(depositAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    // Show a loading toast
    toast.loading('Processing deposit...', { id: 'deposit' })

    // Initialize pool if not already initialized
    const poolAccount = poolAccounts[selectedPoolId]
    if (!poolAccount || !poolAccount.initialized) {
      toast.loading('Creating new pool account on Solana first...', { id: 'deposit' })
      const initialized = await initializePool(selectedPoolId)
      if (!initialized) {
        toast.error('Failed to create pool on Solana', { id: 'deposit' })
        return
      }
      
      // Update the pool with Solana addresses
      setPoolSolanaAddress(
        selectedPoolId,
        poolAccounts[selectedPoolId].pubkey,
        poolAccounts[selectedPoolId].tokenAccount
      )
    }
    
    // Attempt to contribute to Solana pool
    const success = await contributeToPool(selectedPoolId, amount)
    
    if (success) {
      // If Solana transaction was successful, record it in our local state
      const useWallet = !selectedContactId
      const userId = useWallet ? publicKey.toString() : selectedContactId
      const contact = contacts.find(c => c.id === selectedContactId)
      
      const userName = useWallet ? 'My Wallet' : (contact?.name || 'Unknown')
      const userAvatar = useWallet ? '💰' : (contact?.avatar || '👤')
      const walletAddress = useWallet ? publicKey.toString() : (contact?.walletAddress || '')
      
      addContribution(
        selectedPoolId,
        userId,
        userName,
        userAvatar,
        walletAddress,
        amount
      )
      
      setDepositAmount('')
      toast.success(`Successfully deposited ${amount} USDC into the pool`, { id: 'deposit' })
    } else {
      toast.error('Failed to deposit funds into the pool', { id: 'deposit' })
    }
  }
  
  // Handle withdrawals from the pool
  const handleWithdraw = async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first')
      return
    }
    
    if (!selectedPoolId) {
      toast.error('Please select a pool')
      return
    }
    
    if (!selectedContactId) {
      toast.error('Please select a contact')
      return
    }
    
    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    
    const contact = contacts.find(c => c.id === selectedContactId)
    if (!contact) {
      toast.error('Contact not found')
      return
    }
    
    const success = withdrawFromPool(
      selectedPoolId,
      contact.id,
      contact.name,
      contact.avatar || '👤',
      amount
    )
    
    if (success) {
      setWithdrawAmount('')
    }
  }
  
  // Get user's total contribution amount
  const getUserContributionTotal = (userId: string): number => {
    if (!selectedPoolId || selectedPoolId === '') return 0;
    return getUserContributions(userId)
      .filter(contribution => contribution.poolId === selectedPoolId)
      .reduce((total, contribution) => total + contribution.amount, 0)
  }
  
  // Get active loans for a user in the selected pool
  const getActiveLoans = (userId: string): PoolLoan[] => {
    if (!selectedPoolId || selectedPoolId === '') return [];
    return getUserLoans(userId, selectedPoolId).filter(loan => !loan.repaid);
  }
  
  // Sort transactions by timestamp (newest first)
  const getSortedPoolTransactions = (): PoolTransaction[] => {
    if (!selectedPoolId || selectedPoolId === '') return [];
    return [...getPoolTransactions(selectedPoolId)].sort((a, b) => b.timestamp - a.timestamp);
  }
  
  // Sort active loans by timestamp (newest first)
  const getActivePoolLoans = (): PoolLoan[] => {
    if (!selectedPoolId || selectedPoolId === '') return [];
    return getPoolLoans(selectedPoolId).filter(loan => !loan.repaid).sort((a, b) => b.timestamp - a.timestamp);
  }
  
  // Get icon for transaction type
  const getTransactionIcon = (type: PoolTransaction['type']): string => {
    switch (type) {
      case 'deposit': return '💰'
      case 'withdrawal': return '🔄'
      case 'payment': return '💸'
      case 'loan': return '🏦'
      case 'repayment': return '✅'
      default: return '📝'
    }
  }
  
  // Fix the linter error related to the hasActiveLoans line
  const hasActiveLoans = Boolean(selectedPoolId) ? !!getPoolLoans(selectedPoolId)?.some(loan => !loan.repaid) : false;
  
  // Add synchronization useEffect
  useEffect(() => {
    if (selectedPoolId && connected && publicKey) {
      const pool = pools.find(p => p.id === selectedPoolId);
      const solanaPool = poolAccounts[selectedPoolId];
      
      // If the pool exists in our state but not initialized on Solana
      if (pool && (!solanaPool || !solanaPool.initialized)) {
        // We could auto-initialize here, but for now just show a message
        toast.error('This pool is not yet initialized on Solana blockchain', {
          id: `uninit-${selectedPoolId}`
        });
      } 
      // If the pool is initialized but the addresses are not saved in our pool object
      else if (pool && solanaPool && solanaPool.initialized && (!pool.solanaAddress || !pool.tokenAccount)) {
        // Sync the addresses
        setPoolSolanaAddress(
          selectedPoolId,
          solanaPool.pubkey,
          solanaPool.tokenAccount
        );
      }
    }
  }, [selectedPoolId, connected, publicKey, pools, poolAccounts, setPoolSolanaAddress]);
  
  // Handle loan repayment
  const handleRepayLoan = () => {
    if (!repayLoanId) {
      toast.error('No loan selected for repayment')
      return
    }
    
    const amount = parseFloat(repayAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    
    // Add null check for selectedPoolId
    if (!selectedPoolId) {
      toast.error('No pool selected')
      return
    }
    
    const loan = selectedPoolId ? getPoolLoans(selectedPoolId).find(l => l.id === repayLoanId) : undefined;
    if (!loan) {
      toast.error('Loan not found')
      return
    }
    
    if (amount > loan.amount) {
      toast.error(`Repayment amount cannot exceed loan amount of ${loan.amount.toFixed(2)} USDC`)
      return
    }
    
    const success = repayLoan(repayLoanId, amount)
    
    if (success) {
      setRepayLoanId(null)
      setRepayAmount('')
    }
  }
  
  // Handle deleting a pool
  const handleDeletePool = async () => {
    if (!selectedPoolId) {
      toast.error('Please select a pool to delete')
      return
    }
    
    // Confirm deletion with user
    if (!confirm(`Are you sure you want to delete this pool? All related data will be removed.`)) {
      return
    }
    
    // Show loading toast
    toast.loading('Deleting pool...', { id: 'delete-pool' })
    
    try {
      // Check if there are active loans
      const hasActiveLoans = Boolean(getPoolLoans(selectedPoolId)?.some(loan => !loan.repaid))
      
      if (hasActiveLoans) {
        toast.error('Cannot delete pool with active loans. All loans must be repaid first.', { id: 'delete-pool' })
        return
      }
      
      // Check if there's an associated Solana account
      let solanaPoolClosed = true; // Default to true if no Solana account exists
      
      if (poolAccounts[selectedPoolId] && poolAccounts[selectedPoolId].initialized) {
        try {
          // Attempt to close Solana pool account and reclaim funds
          solanaPoolClosed = await closePool(selectedPoolId);
          
          if (!solanaPoolClosed) {
            // Just warn the user but continue with deletion
            toast.error('Could not close the Solana pool account, but the pool will still be deleted from local state.', { id: 'delete-pool' });
          }
        } catch (error) {
          console.error('Error closing Solana pool account:', error);
          // Just warn the user but continue with deletion
          toast.error('Error closing Solana pool account, but the pool will still be deleted from local state.', { id: 'delete-pool' });
        }
      }
      
      // Delete pool from local state regardless of Solana account closure
      const deleted = deletePool(selectedPoolId);
      
      if (deleted) {
        toast.success('Pool successfully deleted!', { id: 'delete-pool' });
        setSelectedPoolId('');
      } else {
        toast.error('Failed to delete pool from local state. Please try again.', { id: 'delete-pool' });
      }
    } catch (error) {
      console.error('Error deleting pool:', error)
      toast.error('An error occurred while deleting the pool. Please try again.', { id: 'delete-pool' })
    }
  }
  
  return (
    <div className="w-full max-w-6xl mx-auto">
      <AppHero title="Pool Management" subtitle="Create and manage pools for group expenses" />
      
      {/* Wallet Connection Status */}
      {!connected && (
        <div className="alert alert-warning mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <div>
            <h3 className="font-bold">Wallet Not Connected</h3>
            <div className="text-xs">Connect your Solana wallet to create pools and make contributions</div>
          </div>
          <WalletButton />
        </div>
      )}
      
      {/* Pool Selection and Creation */}
      <div className="bg-base-200 p-4 rounded-lg mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="form-control w-full md:w-1/2">
            <label className="label">
              <span className="label-text font-semibold">Select Pool</span>
            </label>
            <select 
              className="select select-bordered w-full"
              value={selectedPoolId}
              onChange={(e) => setSelectedPoolId(e.target.value)}
            >
              <option value="">Select a pool</option>
              {pools.map(pool => (
                <option key={pool.id} value={pool.id}>
                  {pool.name} (Created by {pool.ownerName})
                </option>
              ))}
            </select>
          </div>
          
          <div className="md:self-end">
            {showCreatePool ? (
              <button 
                className="btn btn-outline"
                onClick={() => setShowCreatePool(false)}
              >
                Cancel
              </button>
            ) : (
              <div className="flex gap-2">
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCreatePool(true)}
                  disabled={!connected}
                >
                  Create New Pool
                </button>
                {selectedPoolId && (
                  <button 
                    className="btn btn-error btn-square"
                    onClick={handleDeletePool}
                    title="Delete pool"
                    disabled={!connected}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Pool Creation Form */}
        {showCreatePool && (
          <div className="mt-4 p-4 bg-base-100 rounded-lg">
            <h3 className="text-lg font-bold mb-4">Create New Pool</h3>
            
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Pool Name</span>
              </label>
              <input 
                type="text"
                placeholder="Enter pool name"
                className="input input-bordered"
                value={newPoolName}
                onChange={(e) => setNewPoolName(e.target.value)}
              />
            </div>
            
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Description (Optional)</span>
              </label>
              <textarea 
                placeholder="Describe the purpose of this pool"
                className="textarea textarea-bordered"
                value={newPoolDescription}
                onChange={(e) => setNewPoolDescription(e.target.value)}
              />
            </div>
            
            <button 
              className="btn btn-primary"
              onClick={handleCreatePool}
              disabled={!newPoolName.trim() || !connected || isSolanaInitializing}
            >
              {isSolanaInitializing ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating Pool...
                </>
              ) : (
                "Create Pool"
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* Only show pool details if a pool is selected */}
      {selectedPoolId ? (
        <>
          <div className="p-4 bg-base-200 rounded-lg mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <div className="mb-4 sm:mb-0">
                <p className="text-lg opacity-80">Pool Balance</p>
                <h2 className="text-4xl font-bold">{getPoolBalance(selectedPoolId).toFixed(2)} USDC</h2>
                <p className="text-sm opacity-60">
                  {getPoolContributions(selectedPoolId).length} contributions from {new Set(getPoolContributions(selectedPoolId).map(c => c.userId)).size} users
                </p>
              </div>
              
              <div className="flex gap-2">
                {poolAccounts[selectedPoolId] && poolAccounts[selectedPoolId].initialized && (
                  <div className="stats shadow">
                    <div className="stat">
                      <div className="stat-title">On-chain Balance</div>
                      <div className="stat-value">{poolAccounts[selectedPoolId].balance.toFixed(2)} USDC</div>
                      <div className="stat-desc">Balance on Solana</div>
                    </div>
                  </div>
                )}
                <div className="stats shadow">
                  <div className="stat">
                    <div className="stat-title">Active Loans</div>
                    <div className="stat-value">{getActivePoolLoans().length}</div>
                    <div className="stat-desc">
                      {getActivePoolLoans().length > 0 
                        ? `${getActivePoolLoans().reduce((sum, loan) => sum + loan.amount, 0).toFixed(2)} USDC pending`
                        : 'No active loans'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Solana Information Section (Always Visible) */}
          <div className="bg-base-100 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4">Solana Information</h3>
            
            {poolAccounts[selectedPoolId] && poolAccounts[selectedPoolId].initialized ? (
              <div>
                <div className="stats shadow mb-6 w-full">
                  <div className="stat">
                    <div className="stat-title">Program</div>
                    <div className="stat-value text-sm font-mono">pool-d3M...j5H</div>
                    <div className="stat-desc">Solana Program ID</div>
                  </div>
                  
                  <div className="stat">
                    <div className="stat-title">Pool Account</div>
                    <div className="stat-value text-sm font-mono">acct-X5P...k9W</div>
                    <div className="stat-desc">PDA Account ID</div>
                  </div>
                </div>
                
                <div className="bg-base-200 rounded-lg p-4 mb-4">
                  <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(poolAccounts[selectedPoolId], null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="alert">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-info shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>This pool is not yet initialized on Solana blockchain.</span>
                <button className="btn btn-sm" onClick={() => console.log('Initialize on Solana')}>Initialize</button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-base-100 p-10 rounded-lg shadow-md text-center">
          {pools.length === 0 ? (
            <>
              <h3 className="text-xl font-bold mb-4">No Pools Available</h3>
              <p className="mb-6">Create a new pool to get started</p>
              {!connected ? (
                <div className="flex flex-col items-center gap-4">
                  <p>Connect your wallet to create a pool</p>
                  <WalletButton />
                </div>
              ) : (
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCreatePool(true)}
                >
                  Create First Pool
                </button>
              )}
            </>
          ) : (
            <>
              <h3 className="text-xl font-bold mb-4">Select a Pool</h3>
              <p>Choose a pool from the dropdown above to view details and make contributions</p>
            </>
          )}
        </div>
      )}
    </div>
  )
} 