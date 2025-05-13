'use client'

import { useState } from 'react'
import { usePool } from './pool-context'
import toast from 'react-hot-toast'

export interface CardTransactionProps {
  userId: string
  userName: string
  userAvatar: string
  poolId: string
}

export function CardTransaction({ userId, userName, userAvatar, poolId }: CardTransactionProps) {
  const { 
    getUserBalance, 
    getUserLoans, 
    takeLoan,
    getPoolBalance
  } = usePool()
  
  const [amount, setAmount] = useState('')
  const [merchant, setMerchant] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccessDetails, setShowSuccessDetails] = useState(false)
  const [transactionId, setTransactionId] = useState('')
  
  // Calculate user's deposit and available credit
  const userDeposit = getUserBalance(userId, poolId)
  const loanLimit = userDeposit * 1.0 // 100% of deposit (changed from 60%)
  
  // Calculate already loaned amount
  const userLoans = getUserLoans(userId, poolId)
  const activeLoans = userLoans.filter(loan => !loan.repaid)
  const loanedAmount = activeLoans.reduce((sum, loan) => sum + loan.amount, 0)
  
  // Calculate available credit
  const availableCredit = Math.max(0, loanLimit - loanedAmount)
  
  // Format number as currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }
  
  // Generate a random transaction ID
  const generateTransactionId = () => {
    return 'TX-' + Math.random().toString(36).substring(2, 10).toUpperCase()
  }
  
  // Handle transaction submission
  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const amountValue = parseFloat(amount)
    
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    
    if (!merchant.trim()) {
      toast.error('Please enter a merchant name')
      return
    }
    
    if (amountValue > availableCredit) {
      toast.error(`Transaction amount exceeds your available credit of ${formatCurrency(availableCredit)}`)
      return
    }
    
    setIsProcessing(true)
    
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Create a loan for this amount
      const success = takeLoan(
        poolId,
        userId,
        userName,
        userAvatar,
        amountValue,
        `Card purchase at ${merchant}`
      )
      
      if (success) {
        // Generate transaction ID for receipt
        const txId = generateTransactionId()
        setTransactionId(txId)
        
        toast.success(`Transaction of ${formatCurrency(amountValue)} approved!`)
        setShowSuccessDetails(true)
        
        // Reset form
        setAmount('')
        setMerchant('')
      } else {
        toast.error('Transaction failed. Please try again.')
      }
    } catch (error) {
      toast.error('An error occurred while processing your transaction')
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }
  
  // Format date for receipt
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true
    }).format(date)
  }
  
  const hasAvailableCredit = availableCredit > 0
  
  return (
    <div className="w-full max-w-md mx-auto">
      {showSuccessDetails ? (
        <div className="bg-base-200 p-6 rounded-lg shadow-sm border border-base-300">
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success text-white mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold">Transaction Approved</h3>
            <p className="text-sm opacity-70 mt-1">
              Your purchase has been successfully processed
            </p>
          </div>
          
          <div className="bg-base-100 p-4 rounded-lg border border-base-300 mb-4">
            <div className="text-center border-b pb-3 mb-3">
              <div className="text-sm opacity-70">Amount</div>
              <div className="text-2xl font-bold">{formatCurrency(parseFloat(amount))}</div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="opacity-70">Merchant:</span>
                <span className="font-medium">{merchant}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Date:</span>
                <span>{formatDate(new Date())}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Transaction ID:</span>
                <span className="font-mono text-xs">{transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Payment Method:</span>
                <span>Pool-Backed Card</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Status:</span>
                <span className="text-success font-medium">Approved</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between">
            <button 
              onClick={() => setShowSuccessDetails(false)} 
              className="btn btn-sm btn-outline"
            >
              Make Another Payment
            </button>
            
            <button 
              onClick={() => window.print()} 
              className="btn btn-sm btn-outline"
            >
              Print Receipt
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-base-200 p-6 rounded-lg shadow-sm border border-base-300">
          <div className="mb-4">
            <h3 className="text-xl font-bold mb-1">Make a Card Payment</h3>
            <p className="text-sm opacity-70">
              Use your virtual card to make a purchase (will create a loan)
            </p>
          </div>
          
          {hasAvailableCredit ? (
            <form onSubmit={handleSubmitTransaction} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Merchant</span>
                </label>
                <input 
                  type="text" 
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="Enter merchant name" 
                  className="input input-bordered w-full" 
                  required
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Amount</span>
                  <span className="label-text-alt">Available: {formatCurrency(availableCredit)}</span>
                </label>
                <input 
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={availableCredit}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00" 
                  className="input input-bordered w-full" 
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary w-full" 
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Processing...
                  </>
                ) : (
                  'Submit Payment'
                )}
              </button>
            </form>
          ) : (
            <div className="alert alert-warning">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-bold">No Available Credit</h3>
                <p className="text-sm">You need to deposit funds to the pool or repay existing loans to use your card.</p>
              </div>
            </div>
          )}
          
          <div className="mt-4">
            <div className="text-sm opacity-70">Transaction Information</div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-base-100 p-3 rounded-lg">
                <div className="text-xs opacity-70">Credit Limit</div>
                <div className="text-lg font-semibold">{formatCurrency(loanLimit)}</div>
              </div>
              
              <div className="bg-base-100 p-3 rounded-lg">
                <div className="text-xs opacity-70">Used Credit</div>
                <div className="text-lg font-semibold">{formatCurrency(loanedAmount)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 