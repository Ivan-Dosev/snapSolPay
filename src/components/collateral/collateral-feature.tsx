'use client'

import { useState, useEffect } from 'react'
import { AppHero } from '../ui/ui-layout'
import { useCollateral, Collateral, CollateralTransaction, CollateralDeposit, CollateralLoan } from './collateral-context'
import { useContacts } from '../contacts/contacts-context'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '../solana/solana-provider'
import { useSolanaPoolService, SolanaPoolAccount } from '../solana/solana-pool-service'
import toast from 'react-hot-toast'
import { VirtualCard } from '../pool/virtual-card'
import { CardTransaction } from '../pool/card-transaction'

export default function CollateralFeature() {
  const { 
    collaterals,
    createCollateral,
    getCollateralBalance, 
    deposits, 
    transactions, 
    loans,
    addDeposit,
    withdrawFromCollateral,
    getUserBalance,
    getUserDeposits,
    getUserLoans,
    repayLoan,
    getCollateralDeposits,
    getCollateralTransactions,
    getCollateralLoans,
    setCollateralSolanaAddress,
    deleteCollateral
  } = useCollateral()
  
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
  
  // State for collateral selection and creation
  const [selectedCollateralId, setSelectedCollateralId] = useState<string>('')
  const [showCreateCollateral, setShowCreateCollateral] = useState<boolean>(false)
  const [newCollateralName, setNewCollateralName] = useState<string>('')
  const [newCollateralDescription, setNewCollateralDescription] = useState<string>('')
  
  // State for deposits and withdrawals
  const [depositAmount, setDepositAmount] = useState<string>('')
  const [withdrawAmount, setWithdrawAmount] = useState<string>('')
  const [selectedContactId, setSelectedContactId] = useState<string>('')
  
  // State for UI tabs and actions
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'loans' | 'solana' | 'card'>('solana')
  const [repayLoanId, setRepayLoanId] = useState<string | null>(null)
  const [repayAmount, setRepayAmount] = useState<string>('')
  const [isSolanaInitializing, setIsSolanaInitializing] = useState<boolean>(false)
  // Add state for deposit modal
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false)
  // Hidden demo feature for adding test money
  const [demoModeEnabled, setDemoModeEnabled] = useState<boolean>(false)
  const [demoAmount, setDemoAmount] = useState<string>('100')
  
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
  
  // Handle adding demo money directly to the collateral pool (hidden feature)
  const handleAddDemoMoney = () => {
    if (!selectedCollateralId || !connected || !publicKey) {
      toast.error('Please select a collateral account first')
      return
    }
    
    const amount = parseFloat(demoAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    
    // Use the same contact information as the current user for the record
    const collateral = collaterals.find(c => c.id === selectedCollateralId)
    if (!collateral) return
    
    const success = addDeposit(
      selectedCollateralId,
      publicKey.toString(),
      collateral.ownerName,
      collateral.ownerAvatar,
      publicKey.toString(),
      amount
    )
    
    if (success) {
      toast.success(`🔮 Added ${amount} USDC to collateral pool for demo purposes`)
    } else {
      toast.error('Failed to add demo money')
    }
  }
  
  // Handle creating a new collateral account
  const handleCreateCollateral = async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first')
      return
    }
    
    if (!newCollateralName.trim()) {
      toast.error('Please enter a collateral name')
      return
    }
    
    // Get the current user/contact information
    const ownerId = publicKey.toString()
    const ownerName = contacts.find(c => c.walletAddress === ownerId)?.name || 'My Wallet'
    const ownerAvatar = contacts.find(c => c.walletAddress === ownerId)?.avatar || '👤'
    
    const collateralId = createCollateral(
      newCollateralName,
      ownerId,
      ownerName,
      ownerAvatar,
      newCollateralDescription
    )
    
    if (collateralId) {
      setSelectedCollateralId(collateralId)
      setShowCreateCollateral(false)
      setNewCollateralName('')
      setNewCollateralDescription('')
      
      // Initialize the Solana pool account (using the same Solana pool service for now)
      setIsSolanaInitializing(true)
      try {
        toast.loading('Creating a new collateral account on Solana blockchain...', { id: 'init-collateral' })
        const initialized = await initializePool(collateralId)
        
        if (initialized && poolAccounts[collateralId]) {
          // Update the collateral with Solana addresses
          setCollateralSolanaAddress(
            collateralId,
            poolAccounts[collateralId].pubkey,
            poolAccounts[collateralId].tokenAccount
          )
          toast.success('Collateral account successfully created on Solana!', { id: 'init-collateral' })
        } else {
          toast.error('Failed to create collateral account on Solana. Please try again.', { id: 'init-collateral' })
        }
      } catch (error) {
        console.error('Error creating Solana collateral:', error)
        
        // Check for common errors and provide user-friendly messages
        let errorMessage = 'Failed to create Solana collateral account'
        
        if (error instanceof Error) {
          if (error.message.includes('not enough funds')) {
            errorMessage = 'Not enough SOL in your wallet to create the collateral account. Please request an airdrop.'
          } else if (error.message.includes('User rejected')) {
            errorMessage = 'Transaction was rejected from your wallet.'
          } else if (error.message.includes('timeout')) {
            errorMessage = 'Transaction timed out. The network may be congested, please try again.'
          }
        }
        
        toast.error(errorMessage, { id: 'init-collateral' })
      } finally {
        setIsSolanaInitializing(false)
      }
    }
  }
  
  // Handle deposits to the collateral account
  const handleDeposit = async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first')
      return
    }
    
    if (!selectedCollateralId) {
      toast.error('Please select a collateral account')
      return
    }
    
    const amount = parseFloat(depositAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    // Show a loading toast
    toast.loading('Processing deposit...', { id: 'deposit' })

    // Initialize collateral if not already initialized
    const collateralAccount = poolAccounts[selectedCollateralId]
    if (!collateralAccount || !collateralAccount.initialized) {
      toast.loading('Creating new collateral account on Solana first...', { id: 'deposit' })
      const initialized = await initializePool(selectedCollateralId)
      if (!initialized) {
        toast.error('Failed to create collateral account on Solana', { id: 'deposit' })
        return
      }
      
      // Update the collateral with Solana addresses
      setCollateralSolanaAddress(
        selectedCollateralId,
        poolAccounts[selectedCollateralId].pubkey,
        poolAccounts[selectedCollateralId].tokenAccount
      )
    }
    
    // Attempt to contribute to Solana collateral account
    const success = await contributeToPool(selectedCollateralId, amount)
    
    if (success) {
      // If Solana transaction was successful, record it in our local state
      const useWallet = !selectedContactId
      const userId = useWallet ? publicKey.toString() : selectedContactId
      const contact = contacts.find(c => c.id === selectedContactId)
      
      const userName = useWallet ? 'My Wallet' : (contact?.name || 'Unknown')
      const userAvatar = useWallet ? '💰' : (contact?.avatar || '👤')
      const walletAddress = useWallet ? publicKey.toString() : (contact?.walletAddress || '')
      
      addDeposit(
        selectedCollateralId,
        userId,
        userName,
        userAvatar,
        walletAddress,
        amount
      )
      
      setDepositAmount('')
      toast.success(`Successfully deposited ${amount} USDC as collateral`, { id: 'deposit' })
    } else {
      toast.error('Failed to deposit funds as collateral', { id: 'deposit' })
    }
  }
  
  // Handle withdrawals from the collateral account
  const handleWithdraw = async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first')
      return
    }
    
    if (!selectedCollateralId) {
      toast.error('Please select a collateral account')
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
    
    const success = withdrawFromCollateral(
      selectedCollateralId,
      contact.id,
      contact.name,
      contact.avatar || '👤',
      amount
    )
    
    if (success) {
      setWithdrawAmount('')
    }
  }
  
  // Get user's total deposit amount
  const getUserDepositTotal = (userId: string): number => {
    if (!selectedCollateralId || selectedCollateralId === '') return 0;
    return getUserDeposits(userId)
      .filter(deposit => deposit.collateralId === selectedCollateralId)
      .reduce((total, deposit) => total + deposit.amount, 0)
  }
  
  // Get active loans for a user in the selected collateral
  const getActiveLoans = (userId: string): CollateralLoan[] => {
    if (!selectedCollateralId || selectedCollateralId === '') return [];
    return getUserLoans(userId, selectedCollateralId).filter(loan => !loan.repaid);
  }
  
  // Sort transactions by timestamp (newest first)
  const getSortedCollateralTransactions = (): CollateralTransaction[] => {
    if (!selectedCollateralId || selectedCollateralId === '') return [];
    return [...getCollateralTransactions(selectedCollateralId)].sort((a, b) => b.timestamp - a.timestamp);
  }
  
  // Sort active loans by timestamp (newest first)
  const getActiveCollateralLoans = (): CollateralLoan[] => {
    if (!selectedCollateralId || selectedCollateralId === '') return [];
    return getCollateralLoans(selectedCollateralId).filter(loan => !loan.repaid).sort((a, b) => b.timestamp - a.timestamp);
  }
  
  // Get icon for transaction type
  const getTransactionIcon = (type: CollateralTransaction['type']): string => {
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
  const hasActiveLoans = Boolean(selectedCollateralId) ? !!getCollateralLoans(selectedCollateralId)?.some(loan => !loan.repaid) : false;
  
  // Add synchronization useEffect
  useEffect(() => {
    if (selectedCollateralId && connected && publicKey) {
      const collateral = collaterals.find(c => c.id === selectedCollateralId);
      const solanaPool = poolAccounts[selectedCollateralId];
      
      // If the collateral exists in our state but not initialized on Solana
      if (collateral && (!solanaPool || !solanaPool.initialized)) {
        // We could auto-initialize here, but for now just show a message
        toast.error('This collateral account is not yet initialized on Solana blockchain', {
          id: `uninit-${selectedCollateralId}`
        });
      } 
      // If the collateral is initialized but the addresses are not saved in our collateral object
      else if (collateral && solanaPool && solanaPool.initialized && (!collateral.solanaAddress || !collateral.tokenAccount)) {
        // Sync the addresses
        setCollateralSolanaAddress(
          selectedCollateralId,
          solanaPool.pubkey,
          solanaPool.tokenAccount
        );
      }
    }
  }, [selectedCollateralId, connected, publicKey, collaterals, poolAccounts, setCollateralSolanaAddress]);
  
  // Add keyboard shortcut for demo mode (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+Shift+D
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setDemoModeEnabled(prev => !prev);
        if (!demoModeEnabled) {
          toast.success("🔮 Demo mode activated via keyboard shortcut", {
            id: "demo-mode-kbd",
            duration: 2000,
            icon: "⌨️"
          });
        } else {
          toast.success("Demo mode deactivated", {
            id: "demo-mode-kbd",
            duration: 2000
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [demoModeEnabled]);
  
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
    
    // Add null check for selectedCollateralId
    if (!selectedCollateralId) {
      toast.error('No collateral account selected')
      return
    }
    
    const loan = selectedCollateralId ? getCollateralLoans(selectedCollateralId).find(l => l.id === repayLoanId) : undefined;
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
  
  // Handle deleting a collateral account
  const handleDeleteCollateral = async () => {
    if (!selectedCollateralId) {
      toast.error('Please select a collateral account to delete')
      return
    }
    
    // Confirm deletion with user
    if (!confirm(`Are you sure you want to delete this collateral account? All related data will be removed.`)) {
      return
    }
    
    // Show loading toast
    toast.loading('Deleting collateral account...', { id: 'delete-collateral' })
    
    try {
      // Check if there are active loans
      const hasActiveLoans = Boolean(getCollateralLoans(selectedCollateralId)?.some(loan => !loan.repaid))
      
      if (hasActiveLoans) {
        toast.error('Cannot delete collateral account with active loans. All loans must be repaid first.', { id: 'delete-collateral' })
        return
      }
      
      // Try to close Solana pool account and reclaim funds
      try {
        const solanaPoolClosed = await closePool(selectedCollateralId)
        
        if (!solanaPoolClosed) {
          // If Solana closure fails, offer force delete option
          toast.error('Failed to close Solana collateral account.', { id: 'delete-collateral' })
          
          // Ask if the user wants to force delete from local state only
          if (confirm('Blockchain operation failed. Would you like to force delete this collateral account from local state only? (Note: This might leave orphaned data on the blockchain)')) {
            // Proceed with local deletion only
            const deleted = deleteCollateral(selectedCollateralId)
            
            if (deleted) {
              toast.success('Collateral account deleted from local state only!', { id: 'delete-collateral' })
              setSelectedCollateralId('')
            } else {
              toast.error('Failed to delete collateral account from local state.', { id: 'delete-collateral' })
            }
          } else {
            toast.error('Deletion cancelled.', { id: 'delete-collateral' })
          }
          return
        }
      } catch (solanaError) {
        console.error('Error closing Solana pool:', solanaError)
        toast.error('Error with Solana transaction.', { id: 'delete-collateral' })
        
        // Ask if the user wants to force delete from local state only
        if (confirm('Blockchain operation failed. Would you like to force delete this collateral account from local state only? (Note: This might leave orphaned data on the blockchain)')) {
          // Proceed with local deletion only
          const deleted = deleteCollateral(selectedCollateralId)
          
          if (deleted) {
            toast.success('Collateral account deleted from local state only!', { id: 'delete-collateral' })
            setSelectedCollateralId('')
          } else {
            toast.error('Failed to delete collateral account from local state.', { id: 'delete-collateral' })
          }
        } else {
          toast.error('Deletion cancelled.', { id: 'delete-collateral' })
        }
        return
      }
      
      // If Solana closure successful, delete from local state
      const deleted = deleteCollateral(selectedCollateralId)
      
      if (deleted) {
        toast.success('Collateral account successfully deleted!', { id: 'delete-collateral' })
        setSelectedCollateralId('')
      } else {
        toast.error('Failed to delete collateral account. Please try again.', { id: 'delete-collateral' })
      }
    } catch (error) {
      console.error('Error deleting collateral account:', error)
      toast.error('An error occurred while deleting the collateral account. Please try again.', { id: 'delete-collateral' })
    }
  }
  
  return (
    <div className="w-full max-w-6xl mx-auto">
      <AppHero title="Crypto Collateral" subtitle="Deposit crypto as collateral for loans to pay your bills" />
      
      {/* Wallet Connection Status */}
      {!connected && (
        <div className="alert alert-warning mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <div>
            <h3 className="font-bold">Wallet Not Connected</h3>
            <div className="text-xs">Connect your Solana wallet to create collateral accounts and make deposits</div>
          </div>
          <WalletButton />
        </div>
      )}
      
      {/* Collateral Selection and Creation */}
      <div className="bg-base-200 p-4 rounded-lg mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="form-control w-full md:w-1/2">
            <label className="label">
              <span className="label-text font-semibold">Select Collateral Account</span>
            </label>
            <select 
              className="select select-bordered w-full"
              value={selectedCollateralId}
              onChange={(e) => setSelectedCollateralId(e.target.value)}
            >
              <option value="">Select a collateral account</option>
              {collaterals.map(collateral => (
                <option key={collateral.id} value={collateral.id}>
                  {collateral.name} (Created by {collateral.ownerName})
                </option>
              ))}
            </select>
          </div>
          
          <div className="md:self-end">
            {showCreateCollateral ? (
              <button 
                className="btn btn-outline"
                onClick={() => setShowCreateCollateral(false)}
              >
                Cancel
              </button>
            ) : (
              <div className="flex gap-2">
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCreateCollateral(true)}
                  disabled={!connected}
                >
                  Create New Collateral
                </button>
                {selectedCollateralId && (
                  <button 
                    className="btn btn-error btn-square"
                    onClick={handleDeleteCollateral}
                    title="Delete collateral account"
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
        
        {/* Collateral Creation Form */}
        {showCreateCollateral && (
          <div className="mt-4 p-4 bg-base-100 rounded-lg">
            <h3 className="text-lg font-bold mb-4">Create New Collateral Account</h3>
            
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Account Name</span>
              </label>
              <input 
                type="text"
                placeholder="Enter collateral account name"
                className="input input-bordered"
                value={newCollateralName}
                onChange={(e) => setNewCollateralName(e.target.value)}
              />
            </div>
            
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Description (Optional)</span>
              </label>
              <textarea 
                placeholder="Describe the purpose of this collateral account"
                className="textarea textarea-bordered"
                value={newCollateralDescription}
                onChange={(e) => setNewCollateralDescription(e.target.value)}
              />
            </div>
            
            <button 
              className="btn btn-primary"
              onClick={handleCreateCollateral}
              disabled={!newCollateralName.trim() || !connected || isSolanaInitializing}
            >
              {isSolanaInitializing ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating Account...
                </>
              ) : (
                "Create Collateral Account"
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* Only show account details if a collateral account is selected */}
      {selectedCollateralId ? (
        <>
          <div className="p-4 bg-base-200 rounded-lg mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <div className="mb-4 sm:mb-0">
                <p className="text-lg opacity-80">Collateral Balance</p>
                <h2 className="text-4xl font-bold">{getCollateralBalance(selectedCollateralId).toFixed(2)} USDC</h2>
                <p className="text-sm opacity-60">
                  {getCollateralDeposits(selectedCollateralId).length} deposits from {new Set(getCollateralDeposits(selectedCollateralId).map(c => c.userId)).size} users
                </p>
              </div>
              
              <div className="flex gap-2">
                {poolAccounts[selectedCollateralId] && poolAccounts[selectedCollateralId].initialized && (
                  <div className="stats shadow">
                    <div className="stat">
                      <div className="stat-title">On-chain Balance</div>
                      <div className="stat-value">{poolAccounts[selectedCollateralId].balance.toFixed(2)} USDC</div>
                      <div className="stat-desc">Balance on Solana</div>
                    </div>
                  </div>
                )}
                <div className="stats shadow">
                  <div className="stat">
                    <div className="stat-title">Active Loans</div>
                    <div className="stat-value">{getActiveCollateralLoans().length}</div>
                    <div className="stat-desc">
                      {getActiveCollateralLoans().length > 0 
                        ? `${getActiveCollateralLoans().reduce((sum, loan) => sum + loan.amount, 0).toFixed(2)} USDC pending`
                        : 'No active loans'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Add Deposit Button */}
            <div className="mt-4 flex justify-end">
              <button 
                className="btn btn-primary"
                onClick={() => setShowDepositModal(true)}
                disabled={!connected}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Deposit
              </button>
            </div>
          </div>
          
          {/* Solana Information Section (Always Visible) */}
          <div className="bg-base-100 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4">Solana Information</h3>
            
            {poolAccounts[selectedCollateralId] && poolAccounts[selectedCollateralId].initialized ? (
              <div>
                <div className="stats shadow mb-6 w-full">
                  <div className="stat">
                    <div className="stat-title">Program</div>
                    <div 
                      className="stat-value text-sm font-mono"
                      onDoubleClick={(e) => {
                        // Use a secret triple-click to toggle the demo mode
                        // This won't be obvious to users but you'll know it's there
                        setTimeout(() => {
                          if (e.detail === 3) {
                            setDemoModeEnabled(prev => !prev);
                            if (!demoModeEnabled) {
                              toast.success("🔮 Demo mode activated", {
                                id: "demo-mode",
                                duration: 2000,
                                icon: "🤫"
                              });
                            }
                          }
                        }, 0);
                      }}
                    >
                      pool-d3M...j5H
                    </div>
                    <div className="stat-desc">Solana Program ID</div>
                  </div>
                  
                  <div className="stat">
                    <div className="stat-title">Collateral Account</div>
                    <div className="stat-value text-sm font-mono">acct-X5P...k9W</div>
                    <div className="stat-desc">PDA Account ID</div>
                  </div>
                </div>
                
                <div className="bg-base-200 rounded-lg p-4 mb-4">
                  <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(poolAccounts[selectedCollateralId], null, 2)}
                  </pre>
                </div>
                
                {/* Hidden demo feature - only visible when triple-clicking on the Program ID */}
                {demoModeEnabled && (
                  <div className="mt-4 border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-primary font-bold">Demo Controls (dev only)</span>
                      <button 
                        onClick={() => setDemoModeEnabled(false)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        Hide
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="join">
                        <input 
                          type="number" 
                          className="input input-bordered input-xs w-24 join-item"
                          value={demoAmount}
                          onChange={(e) => setDemoAmount(e.target.value)}
                          min="1"
                          step="10"
                        />
                        <button 
                          className="btn btn-xs btn-primary join-item"
                          onClick={handleAddDemoMoney}
                        >
                          Add $ to Collateral
                        </button>
                      </div>
                      <span className="text-xs text-gray-500">Instantly adds funds without actual deposit</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="alert">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-info shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>This collateral account is not yet initialized on Solana blockchain.</span>
                <button className="btn btn-sm" onClick={() => console.log('Initialize on Solana')}>Initialize</button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-base-100 p-10 rounded-lg shadow-md text-center">
          {collaterals.length === 0 ? (
            <>
              <h3 className="text-xl font-bold mb-4">No Collateral Accounts Available</h3>
              <p className="mb-6">Create a new collateral account to get started</p>
              {!connected ? (
                <div className="flex flex-col items-center gap-4">
                  <p>Connect your wallet to create a collateral account</p>
                  <WalletButton />
                </div>
              ) : (
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCreateCollateral(true)}
                >
                  Create First Collateral Account
                </button>
              )}
            </>
          ) : (
            <>
              <h3 className="text-xl font-bold mb-4">Select a Collateral Account</h3>
              <p>Choose a collateral account from the dropdown above to view details and make deposits</p>
            </>
          )}
        </div>
      )}
      
      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-base-100 p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Add Deposit to Collateral</h3>
            
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Deposit Amount (USDC)</span>
              </label>
              <input 
                type="number"
                placeholder="Enter amount to deposit"
                className="input input-bordered"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min="0.01"
                step="0.01"
              />
            </div>
            
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Contributor (Optional)</span>
              </label>
              <select 
                className="select select-bordered w-full"
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
              >
                <option value="">My Wallet</option>
                {contacts.map(contact => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>
              <label className="label">
                <span className="label-text-alt">Leave empty to use your connected wallet as the contributor</span>
              </label>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <button 
                className="btn btn-outline"
                onClick={() => {
                  setShowDepositModal(false)
                  setDepositAmount('')
                  setSelectedContactId('')
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  handleDeposit()
                    .then(() => {
                      setShowDepositModal(false)
                      setDepositAmount('')
                      setSelectedContactId('')
                    })
                    .catch(error => {
                      console.error("Error during deposit:", error)
                    })
                }}
                disabled={!depositAmount || parseFloat(depositAmount) <= 0}
              >
                Deposit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 