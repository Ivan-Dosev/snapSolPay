'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import toast from 'react-hot-toast'
import { v4 as uuidv4 } from 'uuid'

// Define pool type
export interface Pool {
  id: string
  name: string
  createdAt: number
  ownerId: string
  ownerName: string
  ownerAvatar: string
  description?: string
  solanaAddress?: string // Address of the pool account on Solana blockchain
  tokenAccount?: string // Address of the token account for this pool on Solana
}

// Define pool contribution type
export interface PoolContribution {
  id: string
  poolId: string // Associate with specific pool
  userId: string
  userName: string
  userAvatar: string
  walletAddress: string
  amount: number
  timestamp: number
}

// Define loan type
export interface PoolLoan {
  id: string
  poolId: string // Associate with specific pool
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
export interface PoolTransaction {
  id: string
  poolId: string // Associate with specific pool
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
interface PoolContextType {
  pools: Pool[]
  createPool: (name: string, ownerId: string, ownerName: string, ownerAvatar: string, description?: string) => string | null
  getPoolBalance: (poolId: string) => number
  setPoolSolanaAddress: (poolId: string, solanaAddress: string, tokenAccount: string) => void
  contributions: PoolContribution[]
  transactions: PoolTransaction[]
  loans: PoolLoan[]
  addContribution: (poolId: string, userId: string, userName: string, userAvatar: string, walletAddress: string, amount: number) => boolean
  withdrawFromPool: (poolId: string, userId: string, userName: string, userAvatar: string, amount: number) => boolean
  payFromPool: (poolId: string, userId: string, userName: string, userAvatar: string, amount: number, description: string, billReference?: string) => boolean
  takeLoan: (poolId: string, userId: string, userName: string, userAvatar: string, amount: number, description: string) => boolean
  repayLoan: (loanId: string, amount: number) => boolean
  getUserContributions: (userId: string, poolId?: string) => PoolContribution[]
  getUserLoans: (userId: string, poolId?: string) => PoolLoan[]
  getUserBalance: (userId: string, poolId?: string) => number
  getPoolContributions: (poolId: string) => PoolContribution[]
  getPoolTransactions: (poolId: string) => PoolTransaction[]
  getPoolLoans: (poolId: string) => PoolLoan[]
  deletePool: (poolId: string) => boolean
}

const PoolContext = createContext<PoolContextType | undefined>(undefined)

// Storage keys
const POOLS_KEY = 'snapSolPay_pools'
const POOL_CONTRIBUTIONS_KEY = 'snapSolPay_pool_contributions'
const POOL_TRANSACTIONS_KEY = 'snapSolPay_pool_transactions'
const POOL_LOANS_KEY = 'snapSolPay_pool_loans'

// localStorage utility functions
const savePoolData = (
  pools: Pool[],
  contributions: PoolContribution[], 
  transactions: PoolTransaction[],
  loans: PoolLoan[]
) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(POOLS_KEY, JSON.stringify(pools))
      localStorage.setItem(POOL_CONTRIBUTIONS_KEY, JSON.stringify(contributions))
      localStorage.setItem(POOL_TRANSACTIONS_KEY, JSON.stringify(transactions))
      localStorage.setItem(POOL_LOANS_KEY, JSON.stringify(loans))
      return true
    } catch (e) {
      console.error('Failed to save pool data to localStorage', e)
      return false
    }
  }
  return false
}

const loadPools = (): Pool[] => {
  if (typeof window !== 'undefined') {
    try {
      const savedData = localStorage.getItem(POOLS_KEY)
      if (savedData) {
        return JSON.parse(savedData)
      }
    } catch (e) {
      console.error('Failed to load pools from localStorage', e)
    }
  }
  return []
}

const loadPoolContributions = (): PoolContribution[] => {
  if (typeof window !== 'undefined') {
    try {
      const savedData = localStorage.getItem(POOL_CONTRIBUTIONS_KEY)
      if (savedData) {
        return JSON.parse(savedData)
      }
    } catch (e) {
      console.error('Failed to load pool contributions from localStorage', e)
    }
  }
  return []
}

const loadPoolTransactions = (): PoolTransaction[] => {
  if (typeof window !== 'undefined') {
    try {
      const savedData = localStorage.getItem(POOL_TRANSACTIONS_KEY)
      if (savedData) {
        return JSON.parse(savedData)
      }
    } catch (e) {
      console.error('Failed to load pool transactions from localStorage', e)
    }
  }
  return []
}

const loadPoolLoans = (): PoolLoan[] => {
  if (typeof window !== 'undefined') {
    try {
      const savedData = localStorage.getItem(POOL_LOANS_KEY)
      if (savedData) {
        return JSON.parse(savedData)
      }
    } catch (e) {
      console.error('Failed to load pool loans from localStorage', e)
    }
  }
  return []
}

export function PoolProvider({ children }: { children: ReactNode }) {
  // Initialize state with data from localStorage
  const [pools, setPools] = useState<Pool[]>(loadPools)
  const [contributions, setContributions] = useState<PoolContribution[]>(loadPoolContributions)
  const [transactions, setTransactions] = useState<PoolTransaction[]>(loadPoolTransactions)
  const [loans, setLoans] = useState<PoolLoan[]>(loadPoolLoans)
  const [initialized, setInitialized] = useState(false)

  // Ensure we're fully loaded from localStorage before rendering
  useEffect(() => {
    if (!initialized) {
      setPools(loadPools())
      setContributions(loadPoolContributions())
      setTransactions(loadPoolTransactions())
      setLoans(loadPoolLoans())
      setInitialized(true)
    }
  }, [initialized])

  // Save pool data to localStorage whenever it changes
  useEffect(() => {
    if (initialized) {
      savePoolData(pools, contributions, transactions, loans)
    }
  }, [pools, contributions, transactions, loans, initialized])

  // Create a new pool
  const createPool = (name: string, ownerId: string, ownerName: string, ownerAvatar: string, description?: string): string | null => {
    if (!name.trim()) {
      toast.error('Pool name is required')
      return null
    }

    try {
      const newPool: Pool = {
        id: uuidv4(),
        name: name.trim(),
        createdAt: Date.now(),
        ownerId,
        ownerName,
        ownerAvatar,
        description
      }

      setPools(prev => [...prev, newPool])
      toast.success(`Pool "${name}" created successfully!`)
      return newPool.id
    } catch (error) {
      console.error('Failed to create pool:', error)
      toast.error('Failed to create pool')
      return null
    }
  }

  // Calculate pool balance
  const getPoolBalance = (poolId: string): number => {
    // Sum of all contributions for this pool
    const totalContributions = contributions
      .filter(c => c.poolId === poolId)
      .reduce((total, c) => total + c.amount, 0)
    
    // Sum of all withdrawals for this pool
    const totalWithdrawals = transactions
      .filter(t => t.poolId === poolId && t.type === 'withdrawal')
      .reduce((total, t) => total + t.amount, 0)
    
    // Sum of all payments for this pool
    const totalPayments = transactions
      .filter(t => t.poolId === poolId && t.type === 'payment')
      .reduce((total, t) => total + t.amount, 0)
    
    return totalContributions - totalWithdrawals - totalPayments
  }

  // Set Solana address for a pool
  const setPoolSolanaAddress = (poolId: string, solanaAddress: string, tokenAccount: string): void => {
    setPools(prev => prev.map(pool => {
      if (pool.id === poolId) {
        return {
          ...pool,
          solanaAddress,
          tokenAccount
        }
      }
      return pool
    }))
  }

  // Add contribution to pool
  const addContribution = (
    poolId: string,
    userId: string,
    userName: string,
    userAvatar: string,
    walletAddress: string,
    amount: number
  ): boolean => {
    if (!poolId) {
      toast.error('Pool ID is required')
      return false
    }
    
    if (!pools.some(p => p.id === poolId)) {
      toast.error('Pool not found')
      return false
    }

    if (amount <= 0) {
      toast.error('Amount must be greater than 0')
      return false
    }

    try {
      const contributionId = uuidv4()
      const timestamp = Date.now()

      // Add contribution
      const newContribution: PoolContribution = {
        id: contributionId,
        poolId,
        userId,
        userName,
        userAvatar,
        walletAddress,
        amount,
        timestamp
      }
      setContributions(prev => [...prev, newContribution])

      // Add transaction record
      const newTransaction: PoolTransaction = {
        id: uuidv4(),
        poolId,
        type: 'deposit',
        userId,
        userName,
        userAvatar,
        amount,
        timestamp,
        description: `Deposit to pool`
      }
      setTransactions(prev => [...prev, newTransaction])

      toast.success(`Successfully deposited ${amount.toFixed(2)} USDC to the pool`)
      return true
    } catch (error) {
      console.error('Failed to add contribution:', error)
      toast.error('Failed to add contribution')
      return false
    }
  }

  // Withdraw from pool
  const withdrawFromPool = (
    poolId: string,
    userId: string,
    userName: string,
    userAvatar: string,
    amount: number
  ): boolean => {
    try {
      if (amount <= 0) {
        toast.error("Withdrawal amount must be greater than 0")
        return false
      }

      // Calculate user's contribution total
      const userContributions = contributions.filter(
        contribution => contribution.poolId === poolId && contribution.userId === userId
      )
      const totalContributed = userContributions.reduce((total, contribution) => total + contribution.amount, 0)

      // Get user's active loans
      const userLoans = loans.filter(
        loan => loan.poolId === poolId && loan.userId === userId && !loan.repaid
      )
      const totalLoaned = userLoans.reduce((total, loan) => total + loan.amount, 0)

      // Calculate withdrawable amount (contribution minus active loans)
      const withdrawableAmount = totalContributed - totalLoaned

      if (amount > withdrawableAmount) {
        toast.error(`Cannot withdraw more than ${withdrawableAmount.toFixed(2)} SOL. You have active loans that are secured by your deposit.`)
        return false
      }

      // Check if pool exists
      const pool = pools.find(p => p.id === poolId)
      if (!pool) {
        toast.error("Pool not found")
        return false
      }

      // Check pool balance
      const poolBalance = getPoolBalance(poolId)
      if (poolBalance < amount) {
        toast.error("Insufficient pool balance")
        return false
      }

      // Create transaction record
      const transactionId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const transaction: PoolTransaction = {
        id: transactionId,
        poolId,
        type: 'withdrawal',
        userId,
        userName,
        userAvatar,
        amount,
        timestamp: Date.now(),
        description: `Withdrawal by ${userName}`
      }

      // Add to transactions
      setTransactions([...transactions, transaction])

      toast.success(`Successfully withdrew ${amount.toFixed(2)} SOL from the pool`)
      return true
    } catch (error) {
      console.error('Error withdrawing from pool:', error)
      toast.error("Failed to withdraw from pool")
      return false
    }
  }

  // Pay from pool
  const payFromPool = (
    poolId: string,
    userId: string,
    userName: string,
    userAvatar: string,
    amount: number,
    description: string,
    billReference?: string
  ): boolean => {
    if (!poolId) {
      toast.error('Pool ID is required')
      return false
    }
    
    if (amount <= 0) {
      toast.error('Amount must be greater than 0')
      return false
    }

    const poolBalance = getPoolBalance(poolId)
    if (amount > poolBalance) {
      toast.error(`Insufficient pool balance. Available: ${poolBalance.toFixed(2)} USDC`)
      return false
    }

    try {
      const timestamp = Date.now()

      // Add transaction record
      const newTransaction: PoolTransaction = {
        id: uuidv4(),
        poolId,
        type: 'payment',
        userId,
        userName,
        userAvatar,
        amount,
        timestamp,
        description,
        billReference
      }
      setTransactions(prev => [...prev, newTransaction])

      toast.success(`Successfully paid ${amount.toFixed(2)} USDC from the pool`)
      return true
    } catch (error) {
      console.error('Failed to pay from pool:', error)
      toast.error('Failed to pay from pool')
      return false
    }
  }

  // Take loan from pool
  const takeLoan = (
    poolId: string,
    userId: string,
    userName: string,
    userAvatar: string,
    amount: number,
    description: string
  ): boolean => {
    try {
      // Get the user's deposit balance
      const userDeposit = getUserBalance(userId, poolId)
      
      // Calculate the user's loan limit (100% of deposit instead of 60%)
      const loanLimit = userDeposit * 1.0
      
      // Calculate already loaned amount
      const userLoans = getUserLoans(userId, poolId)
      const activeLoans = userLoans.filter(loan => !loan.repaid)
      const loanedAmount = activeLoans.reduce((sum, loan) => sum + loan.amount, 0)
      
      // Calculate available credit
      const availableCredit = Math.max(0, loanLimit - loanedAmount)
      
      // Check if amount exceeds user's available credit
      if (amount > availableCredit) {
        toast.error(`Loan amount exceeds your available credit of ${availableCredit.toFixed(2)}. You can borrow up to 100% of your deposit.`)
        return false
      }
      
      // Original code...
      if (amount <= 0) {
        toast.error("Loan amount must be greater than 0")
        return false
      }

      // Check if pool exists
      const pool = pools.find(p => p.id === poolId)
      if (!pool) {
        toast.error("Pool not found")
        return false
      }

      // Check pool balance
      const poolBalance = getPoolBalance(poolId)
      if (poolBalance < amount) {
        toast.error("Insufficient pool balance for this loan")
        return false
      }

      // Create loan record
      const loanId = `loan-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const loan: PoolLoan = {
        id: loanId,
        poolId,
        userId,
        userName,
        userAvatar,
        amount,
        timestamp: Date.now(),
        repaid: false
      }

      // Add to loans
      setLoans([...loans, loan])

      // Create transaction record
      const transactionId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const transaction: PoolTransaction = {
        id: transactionId,
        poolId,
        type: 'loan',
        userId,
        userName, 
        userAvatar,
        amount,
        timestamp: Date.now(),
        description
      }

      // Add to transactions
      setTransactions([...transactions, transaction])

      toast.success(`Successfully took a loan of ${amount.toFixed(2)} SOL`)
      return true
    } catch (error) {
      console.error('Error taking loan:', error)
      toast.error("Failed to take loan")
      return false
    }
  }

  // Repay loan
  const repayLoan = (loanId: string, amount: number): boolean => {
    if (amount <= 0) {
      toast.error('Amount must be greater than 0')
      return false
    }

    const loan = loans.find(l => l.id === loanId)
    if (!loan) {
      toast.error('Loan not found')
      return false
    }

    if (loan.repaid) {
      toast.error('This loan has already been repaid')
      return false
    }

    if (amount > loan.amount) {
      toast.error(`Repayment amount cannot exceed loan amount of ${loan.amount.toFixed(2)} USDC`)
      return false
    }

    try {
      const timestamp = Date.now()
      const fullRepayment = amount === loan.amount

      // Update loan record
      setLoans(prev => prev.map(l => {
        if (l.id === loanId) {
          return {
            ...l,
            repaid: fullRepayment,
            repaidAmount: amount,
            repaidTimestamp: timestamp
          }
        }
        return l
      }))

      // Add transaction record
      const newTransaction: PoolTransaction = {
        id: uuidv4(),
        poolId: loan.poolId,
        type: 'repayment',
        userId: loan.userId,
        userName: loan.userName,
        userAvatar: loan.userAvatar,
        amount,
        timestamp,
        description: fullRepayment ? 'Full loan repayment' : 'Partial loan repayment'
      }
      setTransactions(prev => [...prev, newTransaction])

      toast.success(`Successfully repaid ${amount.toFixed(2)} USDC of loan`)
      return true
    } catch (error) {
      console.error('Failed to repay loan:', error)
      toast.error('Failed to repay loan')
      return false
    }
  }

  // Get contributions for a specific user
  const getUserContributions = (userId: string, poolId?: string): PoolContribution[] => {
    if (poolId) {
      return contributions.filter(c => c.userId === userId && c.poolId === poolId)
    }
    return contributions.filter(c => c.userId === userId)
  }

  // Get loans for a specific user
  const getUserLoans = (userId: string, poolId?: string): PoolLoan[] => {
    if (poolId) {
      return loans.filter(l => l.userId === userId && l.poolId === poolId)
    }
    return loans.filter(l => l.userId === userId)
  }

  // Get user's balance in a specific pool or across all pools
  const getUserBalance = (userId: string, poolId?: string): number => {
    let filteredContributions = contributions.filter(c => c.userId === userId)
    let filteredTransactions = transactions.filter(t => t.userId === userId && (t.type === 'withdrawal' || t.type === 'payment'))
    
    if (poolId) {
      filteredContributions = filteredContributions.filter(c => c.poolId === poolId)
      filteredTransactions = filteredTransactions.filter(t => t.poolId === poolId)
    }
    
    // Sum of all contributions
    const totalContributions = filteredContributions.reduce((total, c) => total + c.amount, 0)
    
    // Sum of all withdrawals and payments
    const totalWithdrawals = filteredTransactions.reduce((total, t) => total + t.amount, 0)
    
    return totalContributions - totalWithdrawals
  }

  // Get contributions for a specific pool
  const getPoolContributions = (poolId: string): PoolContribution[] => {
    return contributions.filter(c => c.poolId === poolId)
  }

  // Get transactions for a specific pool
  const getPoolTransactions = (poolId: string): PoolTransaction[] => {
    return transactions.filter(t => t.poolId === poolId)
  }

  // Get loans for a specific pool
  const getPoolLoans = (poolId: string): PoolLoan[] => {
    return loans.filter(l => l.poolId === poolId)
  }

  // Delete a pool and all associated data
  const deletePool = (poolId: string): boolean => {
    if (!poolId) {
      toast.error('Pool ID is required')
      return false
    }

    try {
      // Remove the pool
      setPools(prev => prev.filter(pool => pool.id !== poolId))
      
      // Remove all contributions associated with this pool
      setContributions(prev => prev.filter(contribution => contribution.poolId !== poolId))
      
      // Remove all transactions associated with this pool
      setTransactions(prev => prev.filter(transaction => transaction.poolId !== poolId))
      
      // Remove all loans associated with this pool
      setLoans(prev => prev.filter(loan => loan.poolId !== poolId))
      
      toast.success('Pool successfully deleted')
      return true
    } catch (error) {
      console.error('Failed to delete pool:', error)
      toast.error('Failed to delete pool')
      return false
    }
  }

  const value = {
    pools,
    createPool,
    getPoolBalance,
    setPoolSolanaAddress,
    contributions,
    transactions,
    loans,
    addContribution,
    withdrawFromPool,
    payFromPool,
    takeLoan,
    repayLoan,
    getUserContributions,
    getUserLoans,
    getUserBalance,
    getPoolContributions,
    getPoolTransactions,
    getPoolLoans,
    deletePool
  }

  return <PoolContext.Provider value={value}>{children}</PoolContext.Provider>
}

export function usePool() {
  const context = useContext(PoolContext)
  if (context === undefined) {
    throw new Error('usePool must be used within a PoolProvider')
  }
  return context
} 