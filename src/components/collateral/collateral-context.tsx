'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import toast from 'react-hot-toast'
import { v4 as uuidv4 } from 'uuid'

// Define collateral type
export interface Collateral {
  id: string
  name: string
  createdAt: number
  ownerId: string
  ownerName: string
  ownerAvatar: string
  description?: string
  solanaAddress?: string // Address of the collateral account on Solana blockchain
  tokenAccount?: string // Address of the token account for this collateral on Solana
}

// Define collateral deposit type
export interface CollateralDeposit {
  id: string
  collateralId: string // Associate with specific collateral
  userId: string
  userName: string
  userAvatar: string
  walletAddress: string
  amount: number
  timestamp: number
}

// Define loan type
export interface CollateralLoan {
  id: string
  collateralId: string // Associate with specific collateral
  userId: string
  userName: string
  userAvatar: string
  amount: number
  timestamp: number
  repaid: boolean
  repaidAmount?: number
  repaidTimestamp?: number
}

// Define transaction type
export interface CollateralTransaction {
  id: string
  collateralId: string // Associate with specific collateral
  type: 'deposit' | 'withdrawal' | 'payment' | 'loan' | 'repayment'
  userId: string
  userName: string
  userAvatar: string
  amount: number
  timestamp: number
  description: string
  billReference?: string
}

// Context type definition
interface CollateralContextType {
  collaterals: Collateral[]
  createCollateral: (name: string, ownerId: string, ownerName: string, ownerAvatar: string, description?: string) => string | null
  getCollateralBalance: (collateralId: string) => number
  setCollateralSolanaAddress: (collateralId: string, solanaAddress: string, tokenAccount: string) => void
  deposits: CollateralDeposit[]
  transactions: CollateralTransaction[]
  loans: CollateralLoan[]
  addDeposit: (collateralId: string, userId: string, userName: string, userAvatar: string, walletAddress: string, amount: number) => boolean
  withdrawFromCollateral: (collateralId: string, userId: string, userName: string, userAvatar: string, amount: number) => boolean
  payFromCollateral: (collateralId: string, userId: string, userName: string, userAvatar: string, amount: number, description: string, billReference?: string) => boolean
  takeLoan: (collateralId: string, userId: string, userName: string, userAvatar: string, amount: number, description: string) => boolean
  repayLoan: (loanId: string, amount: number) => boolean
  getUserDeposits: (userId: string, collateralId?: string) => CollateralDeposit[]
  getUserLoans: (userId: string, collateralId?: string) => CollateralLoan[]
  getUserBalance: (userId: string, collateralId?: string) => number
  getCollateralDeposits: (collateralId: string) => CollateralDeposit[]
  getCollateralTransactions: (collateralId: string) => CollateralTransaction[]
  getCollateralLoans: (collateralId: string) => CollateralLoan[]
  deleteCollateral: (collateralId: string) => boolean
}

const CollateralContext = createContext<CollateralContextType | undefined>(undefined)

// Storage keys
const COLLATERALS_KEY = 'snapSolPay_collaterals'
const COLLATERAL_DEPOSITS_KEY = 'snapSolPay_collateral_deposits'
const COLLATERAL_TRANSACTIONS_KEY = 'snapSolPay_collateral_transactions'
const COLLATERAL_LOANS_KEY = 'snapSolPay_collateral_loans'

// localStorage utility functions
const saveCollateralData = (
  collaterals: Collateral[],
  deposits: CollateralDeposit[], 
  transactions: CollateralTransaction[],
  loans: CollateralLoan[]
) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(COLLATERALS_KEY, JSON.stringify(collaterals))
      localStorage.setItem(COLLATERAL_DEPOSITS_KEY, JSON.stringify(deposits))
      localStorage.setItem(COLLATERAL_TRANSACTIONS_KEY, JSON.stringify(transactions))
      localStorage.setItem(COLLATERAL_LOANS_KEY, JSON.stringify(loans))
      return true
    } catch (e) {
      console.error('Failed to save collateral data to localStorage', e)
      return false
    }
  }
  return false
}

const loadCollaterals = (): Collateral[] => {
  if (typeof window !== 'undefined') {
    try {
      const savedData = localStorage.getItem(COLLATERALS_KEY)
      if (savedData) {
        return JSON.parse(savedData)
      }
    } catch (e) {
      console.error('Failed to load collaterals from localStorage', e)
    }
  }
  return []
}

const loadCollateralDeposits = (): CollateralDeposit[] => {
  if (typeof window !== 'undefined') {
    try {
      const savedData = localStorage.getItem(COLLATERAL_DEPOSITS_KEY)
      if (savedData) {
        return JSON.parse(savedData)
      }
    } catch (e) {
      console.error('Failed to load collateral deposits from localStorage', e)
    }
  }
  return []
}

const loadCollateralTransactions = (): CollateralTransaction[] => {
  if (typeof window !== 'undefined') {
    try {
      const savedData = localStorage.getItem(COLLATERAL_TRANSACTIONS_KEY)
      if (savedData) {
        return JSON.parse(savedData)
      }
    } catch (e) {
      console.error('Failed to load collateral transactions from localStorage', e)
    }
  }
  return []
}

const loadCollateralLoans = (): CollateralLoan[] => {
  if (typeof window !== 'undefined') {
    try {
      const savedData = localStorage.getItem(COLLATERAL_LOANS_KEY)
      if (savedData) {
        return JSON.parse(savedData)
      }
    } catch (e) {
      console.error('Failed to load collateral loans from localStorage', e)
    }
  }
  return []
}

export function CollateralProvider({ children }: { children: ReactNode }) {
  // Initialize state with data from localStorage
  const [collaterals, setCollaterals] = useState<Collateral[]>(loadCollaterals)
  const [deposits, setDeposits] = useState<CollateralDeposit[]>(loadCollateralDeposits)
  const [transactions, setTransactions] = useState<CollateralTransaction[]>(loadCollateralTransactions)
  const [loans, setLoans] = useState<CollateralLoan[]>(loadCollateralLoans)
  const [initialized, setInitialized] = useState(false)

  // Load data from the old pool keys if there's no collateral data yet
  const migrateFromPoolData = () => {
    if (typeof window === 'undefined') return
    try {
      // Check if we already have collateral data
      const hasCollateralData = localStorage.getItem(COLLATERALS_KEY) !== null
      if (hasCollateralData) return // Don't migrate if we already have data

      // Check for old pool data (from previous version)
      const oldPoolsData = localStorage.getItem('solSNAP_pools')
      const oldContributionsData = localStorage.getItem('solSNAP_pool_contributions')
      const oldTransactionsData = localStorage.getItem('solSNAP_pool_transactions')
      const oldLoansData = localStorage.getItem('solSNAP_pool_loans')
      
      if (oldPoolsData) {
        try {
          const oldPools = JSON.parse(oldPoolsData)
          const newCollaterals = oldPools.map((p: any) => ({
            ...p,
            // Keep the same structure but rename if needed
          }))
          setCollaterals(newCollaterals)
          localStorage.setItem(COLLATERALS_KEY, JSON.stringify(newCollaterals))
        } catch (e) {
          console.error('Failed to migrate pool data', e)
        }
      }
      
      if (oldContributionsData) {
        try {
          const oldContributions = JSON.parse(oldContributionsData)
          const newDeposits = oldContributions.map((c: any) => ({
            ...c,
            collateralId: c.poolId
          }))
          setDeposits(newDeposits)
          localStorage.setItem(COLLATERAL_DEPOSITS_KEY, JSON.stringify(newDeposits))
        } catch (e) {
          console.error('Failed to migrate contribution data', e)
        }
      }
      
      if (oldTransactionsData) {
        try {
          const oldTransactions = JSON.parse(oldTransactionsData)
          const newTransactions = oldTransactions.map((t: any) => ({
            ...t,
            collateralId: t.poolId
          }))
          setTransactions(newTransactions)
          localStorage.setItem(COLLATERAL_TRANSACTIONS_KEY, JSON.stringify(newTransactions))
        } catch (e) {
          console.error('Failed to migrate transaction data', e)
        }
      }
      
      if (oldLoansData) {
        try {
          const oldLoans = JSON.parse(oldLoansData)
          const newLoans = oldLoans.map((l: any) => ({
            ...l,
            collateralId: l.poolId
          }))
          setLoans(newLoans)
          localStorage.setItem(COLLATERAL_LOANS_KEY, JSON.stringify(newLoans))
        } catch (e) {
          console.error('Failed to migrate loan data', e)
        }
      }
    } catch (e) {
      console.error('Error migrating from old pool data', e)
    }
  }

  // Ensure we're fully loaded from localStorage before rendering
  useEffect(() => {
    if (!initialized) {
      // Try to migrate from old pool data
      migrateFromPoolData()
      
      setCollaterals(loadCollaterals())
      setDeposits(loadCollateralDeposits())
      setTransactions(loadCollateralTransactions())
      setLoans(loadCollateralLoans())
      setInitialized(true)
    }
  }, [initialized])

  // Save collateral data to localStorage whenever it changes
  useEffect(() => {
    if (initialized) {
      saveCollateralData(collaterals, deposits, transactions, loans)
    }
  }, [collaterals, deposits, transactions, loans, initialized])

  // Create a new collateral account
  const createCollateral = (name: string, ownerId: string, ownerName: string, ownerAvatar: string, description?: string): string | null => {
    if (!name.trim()) {
      toast.error('Collateral name is required')
      return null
    }

    try {
      const id = uuidv4()
      const newCollateral: Collateral = {
        id,
        name: name.trim(),
        createdAt: Date.now(),
        ownerId,
        ownerName,
        ownerAvatar,
        description: description?.trim()
      }
      
      setCollaterals(prev => [...prev, newCollateral])
      toast.success(`Collateral "${name}" created successfully!`)
      return id
    } catch (error) {
      console.error('Error creating collateral:', error)
      toast.error('Failed to create collateral')
      return null
    }
  }

  // Get the total balance of a collateral account
  const getCollateralBalance = (collateralId: string): number => {
    return deposits
      .filter(deposit => deposit.collateralId === collateralId)
      .reduce((sum, deposit) => sum + deposit.amount, 0) - 
      loans
      .filter(loan => loan.collateralId === collateralId && !loan.repaid)
      .reduce((sum, loan) => sum + loan.amount, 0)
  }

  // Update Solana addresses for a collateral account
  const setCollateralSolanaAddress = (collateralId: string, solanaAddress: string, tokenAccount: string): void => {
    setCollaterals(prev => 
      prev.map(collateral => 
        collateral.id === collateralId 
          ? { ...collateral, solanaAddress, tokenAccount } 
          : collateral
      )
    )
  }

  // Add a deposit to a collateral account
  const addDeposit = (
    collateralId: string,
    userId: string,
    userName: string,
    userAvatar: string,
    walletAddress: string,
    amount: number
  ): boolean => {
    if (amount <= 0) {
      toast.error('Deposit amount must be greater than zero')
      return false
    }

    // Validate if collateral exists
    const collateral = collaterals.find(collateral => collateral.id === collateralId)
    if (!collateral) {
      toast.error('Collateral not found')
      return false
    }

    try {
      // Create a deposit record
      const depositId = uuidv4()
      const newDeposit: CollateralDeposit = {
        id: depositId,
        collateralId,
        userId,
        userName,
        userAvatar,
        walletAddress,
        amount,
        timestamp: Date.now()
      }
      
      // Create a transaction record
      const transactionId = uuidv4()
      const newTransaction: CollateralTransaction = {
        id: transactionId,
        collateralId,
        type: 'deposit',
        userId,
        userName,
        userAvatar,
        amount,
        timestamp: Date.now(),
        description: `Deposited ${amount.toFixed(2)} USDC as collateral`
      }
      
      setDeposits(prev => [...prev, newDeposit])
      setTransactions(prev => [...prev, newTransaction])
      
      toast.success(`Deposited ${amount.toFixed(2)} USDC as collateral`)
      return true
    } catch (error) {
      console.error('Error adding deposit:', error)
      toast.error('Failed to add deposit')
      return false
    }
  }

  // Withdraw from collateral account
  const withdrawFromCollateral = (
    collateralId: string,
    userId: string,
    userName: string,
    userAvatar: string,
    amount: number
  ): boolean => {
    if (amount <= 0) {
      toast.error('Withdrawal amount must be greater than zero')
      return false
    }

    // Validate user has sufficient contributions
    const userDeposits = deposits.filter(
      deposit => deposit.collateralId === collateralId && deposit.userId === userId
    )
    
    const totalDeposited = userDeposits.reduce((sum, deposit) => sum + deposit.amount, 0)
    
    // Check user's active loans
    const userLoans = loans.filter(
      loan => loan.collateralId === collateralId && loan.userId === userId && !loan.repaid
    )
    
    const totalActiveLoans = userLoans.reduce((sum, loan) => sum + loan.amount, 0)
    
    // Calculate withdrawable amount (deposits minus active loans)
    const withdrawableAmount = totalDeposited - totalActiveLoans
    
    if (amount > withdrawableAmount) {
      toast.error(`Cannot withdraw more than ${withdrawableAmount.toFixed(2)} USDC due to active loans`)
      return false
    }
    
    // Validate if collateral exists
    const collateral = collaterals.find(collateral => collateral.id === collateralId)
    if (!collateral) {
      toast.error('Collateral not found')
      return false
    }
    
    // Check if collateral has sufficient funds
    const collateralBalance = getCollateralBalance(collateralId)
    if (amount > collateralBalance) {
      toast.error('Insufficient funds in collateral account')
      return false
    }

    try {
      // Create a transaction record
      const transactionId = uuidv4()
      const newTransaction: CollateralTransaction = {
        id: transactionId,
        collateralId,
        type: 'withdrawal',
        userId,
        userName,
        userAvatar,
        amount,
        timestamp: Date.now(),
        description: `Withdrawn ${amount.toFixed(2)} USDC from collateral`
      }
      
      setTransactions(prev => [...prev, newTransaction])
      
      // Create a "negative" deposit to track withdrawals
      const withdrawalId = uuidv4()
      const newWithdrawal: CollateralDeposit = {
        id: withdrawalId,
        collateralId,
        userId,
        userName,
        userAvatar,
        walletAddress: '', // This is a withdrawal, not a deposit
        amount: -amount, // Negative amount to represent withdrawal
        timestamp: Date.now()
      }
      
      setDeposits(prev => [...prev, newWithdrawal])
      
      toast.success(`Withdrawn ${amount.toFixed(2)} USDC from collateral`)
      return true
    } catch (error) {
      console.error('Error withdrawing from collateral:', error)
      toast.error('Failed to withdraw from collateral')
      return false
    }
  }

  // Pay from collateral account (like for a bill payment)
  const payFromCollateral = (
    collateralId: string,
    userId: string,
    userName: string,
    userAvatar: string,
    amount: number,
    description: string,
    billReference?: string
  ): boolean => {
    if (amount <= 0) {
      toast.error('Payment amount must be greater than zero')
      return false
    }

    // Validate user has sufficient balance
    const userBalance = getUserBalance(userId, collateralId)
    if (amount > userBalance) {
      toast.error(`Insufficient funds: You have ${userBalance.toFixed(2)} USDC available`)
      return false
    }
    
    // Validate if collateral exists
    const collateral = collaterals.find(collateral => collateral.id === collateralId)
    if (!collateral) {
      toast.error('Collateral not found')
      return false
    }
    
    // Check if collateral has sufficient funds
    const collateralBalance = getCollateralBalance(collateralId)
    if (amount > collateralBalance) {
      toast.error('Insufficient funds in collateral account')
      return false
    }

    try {
      // Create a transaction record
      const transactionId = uuidv4()
      const newTransaction: CollateralTransaction = {
        id: transactionId,
        collateralId,
        type: 'payment',
        userId,
        userName,
        userAvatar,
        amount,
        timestamp: Date.now(),
        description,
        billReference
      }
      
      setTransactions(prev => [...prev, newTransaction])
      
      // Create a "negative" deposit to track the payment
      const paymentId = uuidv4()
      const newPayment: CollateralDeposit = {
        id: paymentId,
        collateralId,
        userId,
        userName,
        userAvatar,
        walletAddress: '', // This is a payment, not a deposit
        amount: -amount, // Negative amount to represent payment
        timestamp: Date.now()
      }
      
      setDeposits(prev => [...prev, newPayment])
      
      toast.success(`Payment of ${amount.toFixed(2)} USDC made successfully`)
      return true
    } catch (error) {
      console.error('Failed to pay from collateral:', error)
      toast.error('Failed to make payment')
      return false
    }
  }

  // Take a loan using collateral
  const takeLoan = (
    collateralId: string,
    userId: string,
    userName: string,
    userAvatar: string,
    amount: number,
    description: string
  ): boolean => {
    if (amount <= 0) {
      toast.error('Loan amount must be greater than zero')
      return false
    }

    // Find the collateral
    const collateral = collaterals.find(c => c.id === collateralId)
    if (!collateral) {
      toast.error('Collateral not found')
      return false
    }
    
    // Get user's deposit
    const userDeposit = getUserBalance(userId, collateralId)
    
    // Calculate loan limit (set to 100% of user's deposit)
    const loanLimit = userDeposit
    
    // Check existing loans for this user
    const existingLoans = loans
      .filter(loan => loan.collateralId === collateralId && loan.userId === userId && !loan.repaid)
      .reduce((sum, loan) => sum + loan.amount, 0)
    
    // Calculate available credit
    const availableCredit = loanLimit - existingLoans
    
    // Validate loan amount against available credit
    if (amount > availableCredit) {
      toast.error(`Loan exceeds available credit of ${availableCredit.toFixed(2)} USDC. Increase your collateral first.`)
      return false
    }
    
    // Check if collateral has sufficient funds
    const collateralBalance = getCollateralBalance(collateralId)
    if (amount > collateralBalance) {
      toast.error('Insufficient funds in collateral account')
      return false
    }
    
    try {
      // Create a loan record
      const loanId = uuidv4()
      const newLoan: CollateralLoan = {
        id: loanId,
        collateralId,
        userId,
        userName,
        userAvatar,
        amount,
        timestamp: Date.now(),
        repaid: false
      }
      
      // Create a transaction record
      const transactionId = uuidv4()
      const newTransaction: CollateralTransaction = {
        id: transactionId,
        collateralId,
        type: 'loan',
        userId,
        userName,
        userAvatar,
        amount,
        timestamp: Date.now(),
        description
      }
      
      setLoans(prev => [...prev, newLoan])
      setTransactions(prev => [...prev, newTransaction])
      
      toast.success(`Loan of ${amount.toFixed(2)} USDC approved!`)
      return true
    } catch (error) {
      console.error('Error taking loan:', error)
      toast.error('Failed to process loan')
      return false
    }
  }

  // Repay a loan
  const repayLoan = (loanId: string, amount: number): boolean => {
    if (amount <= 0) {
      toast.error('Repayment amount must be greater than zero')
      return false
    }

    // Find the loan
    const loan = loans.find(loan => loan.id === loanId)
    if (!loan) {
      toast.error('Loan not found')
      return false
    }
    
    if (loan.repaid) {
      toast.error('This loan has already been repaid')
      return false
    }
    
    if (amount > loan.amount) {
      toast.error(`Repayment amount cannot exceed the loan amount of ${loan.amount.toFixed(2)} USDC`)
      return false
    }
    
    // Find the collateral
    const collateral = collaterals.find(c => c.id === loan.collateralId)
    if (!collateral) {
      toast.error('Collateral not found')
      return false
    }
    
    try {
      // Update the loan
      const updatedLoan: CollateralLoan = {
        ...loan,
        repaid: amount >= loan.amount,
        repaidAmount: amount,
        repaidTimestamp: Date.now()
      }
      
      // Create a transaction record
      const transactionId = uuidv4()
      const newTransaction: CollateralTransaction = {
        id: transactionId,
        collateralId: loan.collateralId,
        type: 'repayment',
        userId: loan.userId,
        userName: loan.userName,
        userAvatar: loan.userAvatar,
        amount,
        timestamp: Date.now(),
        description: `Repaid ${amount.toFixed(2)} USDC of loan`
      }
      
      // Add the repayment as a deposit to restore the balance
      const depositId = uuidv4()
      const newDeposit: CollateralDeposit = {
        id: depositId,
        collateralId: loan.collateralId,
        userId: loan.userId,
        userName: loan.userName,
        userAvatar: loan.userAvatar,
        walletAddress: '',
        amount,
        timestamp: Date.now()
      }
      
      setLoans(prev => prev.map(l => l.id === loanId ? updatedLoan : l))
      setTransactions(prev => [...prev, newTransaction])
      setDeposits(prev => [...prev, newDeposit])
      
      toast.success(`Repaid ${amount.toFixed(2)} USDC of loan`)
      return true
    } catch (error) {
      console.error('Error repaying loan:', error)
      toast.error('Failed to repay loan')
      return false
    }
  }

  // Get user's deposits
  const getUserDeposits = (userId: string, collateralId?: string): CollateralDeposit[] => {
    return deposits.filter(deposit => 
      deposit.userId === userId && 
      (collateralId ? deposit.collateralId === collateralId : true)
    )
  }

  // Get user's loans
  const getUserLoans = (userId: string, collateralId?: string): CollateralLoan[] => {
    return loans.filter(loan => 
      loan.userId === userId && 
      (collateralId ? loan.collateralId === collateralId : true)
    )
  }

  // Get user's available balance in a collateral account
  const getUserBalance = (userId: string, collateralId?: string): number => {
    // Sum all deposits
    const totalDeposits = deposits
      .filter(deposit => 
        deposit.userId === userId && 
        (collateralId ? deposit.collateralId === collateralId : true)
      )
      .reduce((sum, deposit) => sum + deposit.amount, 0)
    
    // Sum all active loans
    const totalLoans = loans
      .filter(loan => 
        loan.userId === userId && 
        !loan.repaid &&
        (collateralId ? loan.collateralId === collateralId : true)
      )
      .reduce((sum, loan) => sum + loan.amount, 0)
    
    // Available balance = deposits - loans
    return Math.max(0, totalDeposits - totalLoans)
  }

  // Get deposits for a specific collateral account
  const getCollateralDeposits = (collateralId: string): CollateralDeposit[] => {
    return deposits.filter(deposit => deposit.collateralId === collateralId)
  }

  // Get transactions for a specific collateral account
  const getCollateralTransactions = (collateralId: string): CollateralTransaction[] => {
    return transactions.filter(transaction => transaction.collateralId === collateralId)
  }

  // Get loans for a specific collateral account
  const getCollateralLoans = (collateralId: string): CollateralLoan[] => {
    return loans.filter(loan => loan.collateralId === collateralId)
  }

  // Delete a collateral account
  const deleteCollateral = (collateralId: string): boolean => {
    // Check if there are active loans
    const hasActiveLoans = loans.some(loan => loan.collateralId === collateralId && !loan.repaid)
    
    if (hasActiveLoans) {
      toast.error('Cannot delete collateral with active loans')
      return false
    }
    
    try {
      // Remove the collateral and related data
      setCollaterals(prev => prev.filter(c => c.id !== collateralId))
      setDeposits(prev => prev.filter(d => d.collateralId !== collateralId))
      setTransactions(prev => prev.filter(t => t.collateralId !== collateralId))
      setLoans(prev => prev.filter(l => l.collateralId !== collateralId))
      
      toast.success('Collateral account deleted successfully')
      return true
    } catch (error) {
      console.error('Error deleting collateral:', error)
      toast.error('Failed to delete collateral account')
      return false
    }
  }

  const value = {
    collaterals,
    createCollateral,
    getCollateralBalance,
    setCollateralSolanaAddress,
    deposits,
    transactions,
    loans,
    addDeposit,
    withdrawFromCollateral,
    payFromCollateral,
    takeLoan,
    repayLoan,
    getUserDeposits,
    getUserLoans,
    getUserBalance,
    getCollateralDeposits,
    getCollateralTransactions,
    getCollateralLoans,
    deleteCollateral,
  }

  return (
    <CollateralContext.Provider value={value}>
      {children}
    </CollateralContext.Provider>
  )
}

// Custom hook to use the collateral context
export function useCollateral() {
  const context = useContext(CollateralContext)
  if (context === undefined) {
    throw new Error('useCollateral must be used within a CollateralProvider')
  }
  return context
} 