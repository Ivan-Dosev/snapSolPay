'use client'

import { useState, useEffect } from 'react'
import { usePool } from './pool-context'
import toast from 'react-hot-toast'

interface BankLoanCardProps {
  userId: string
  userName: string
  userAvatar: string
  poolId: string
  loanAmount: number
  onComplete: () => void
  onCancel: () => void
}

export function BankLoanCard({ 
  userId, 
  userName, 
  userAvatar, 
  poolId, 
  loanAmount,
  onComplete,
  onCancel
}: BankLoanCardProps) {
  const { getUserBalance, takeLoan } = usePool()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isApproved, setIsApproved] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  
  // Get user's deposit amount
  const userDeposit = getUserBalance(userId)
  
  // Fixed SOL amount for display (hardcoded to 5 SOL)
  const fixedSolDeposit = 5.0
  // Hardcoded SOL to USDC conversion rate (1 SOL = approx 96 USDC as of June 2024)
  const solToUsdcRate = 96
  const solInUsdc = fixedSolDeposit * solToUsdcRate
  
  // Generate random card details on component mount
  useEffect(() => {
    setCardNumber(generateCardNumber())
    setExpiryDate(generateExpiryDate())
    setCvv(generateCVV())
  }, [])
  
  // Format currency with $ sign and 2 decimal places
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`
  }
  
  // Format SOL currency
  const formatSol = (amount: number) => {
    return `${amount.toFixed(2)} SOL`
  }
  
  // Generate a random card number
  const generateCardNumber = () => {
    return `4000 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`
  }
  
  // Generate a random CVV
  const generateCVV = () => {
    return Math.floor(100 + Math.random() * 900).toString()
  }
  
  // Generate a random expiry date (1-3 years in the future)
  const generateExpiryDate = () => {
    const now = new Date()
    const futureYear = now.getFullYear() + Math.floor(1 + Math.random() * 3)
    const month = Math.floor(1 + Math.random() * 12)
    return `${month.toString().padStart(2, '0')}/${(futureYear % 100).toString()}`
  }
  
  // Handle loan request
  const handleRequestLoan = async () => {
    setIsProcessing(true)
    
    // Simulate API call with guaranteed success
    setTimeout(() => {
      // Always set approved state without checking takeLoan result
      setIsApproved(true)
      toast.success(`Loan of ${formatCurrency(loanAmount)} approved!`)
      
      // Still call takeLoan function but don't use its result
      takeLoan(
        poolId,
        userId,
        userName,
        userAvatar,
        loanAmount,
        `Bank loan for ${formatCurrency(loanAmount)}`
      )
      
      // Simulate delay before completion
      setTimeout(() => {
        onComplete()
      }, 2000)
    }, 2000)
  }
  
  return (
    <div className="max-w-md mx-auto bg-base-100 rounded-lg shadow-xl p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Commerzbank Loan Application</h2>
        <p className="text-sm opacity-70">Powered by Solana Blockchain</p>
      </div>
      
      {/* Card Preview */}
      <div className="mb-6">
        <div className={`card w-full bg-gradient-to-r from-green-800 to-blue-800 text-white shadow-xl rounded-xl p-6 ${isApproved ? 'bg-success' : ''}`}>
          <div className="flex justify-between mb-6">
            <div>
              <div className="text-xs opacity-80">CRYPTO CARD</div>
              <div className="font-bold">Commerzbank</div>
            </div>
            <div>
              <svg className="w-10 h-10 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="font-mono text-xl tracking-wider">{cardNumber}</div>
          </div>
          
          <div className="flex justify-between">
            <div>
              <div className="text-xs opacity-70">CARDHOLDER</div>
              <div>{userName}</div>
            </div>
            <div>
              <div className="text-xs opacity-70">EXPIRES</div>
              <div>{expiryDate}</div>
            </div>
            <div>
              <div className="text-xs opacity-70">CVV</div>
              <div>{cvv}</div>
            </div>
          </div>
          
          {isApproved && (
            <div className="absolute top-0 right-0 bg-success text-white rounded-bl-lg rounded-tr-lg p-2 transform rotate-12 font-bold">
              APPROVED
            </div>
          )}
        </div>
      </div>
      
      {/* Loan Details */}
      <div className="bg-base-200 p-4 rounded-lg mb-6">
        <h3 className="font-bold mb-4">Loan Application Details</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Total Deposited:</span>
            <span className="font-bold">{formatSol(fixedSolDeposit)}</span>
          </div>
          <div className="flex justify-between">
            <span>Deposit in USDC:</span>
            <span className="font-bold">{formatCurrency(solInUsdc)}</span>
          </div>
          <div className="flex justify-between">
            <span>Loan Amount:</span>
            <span className="font-bold text-primary">{formatCurrency(loanAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Available Credit After Loan:</span>
            <span className="font-bold">{formatCurrency(solInUsdc - loanAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Interest Rate:</span>
            <span className="font-bold">0.0% APR</span>
          </div>
          <div className="flex justify-between">
            <span>Loan Term:</span>
            <span className="font-bold">No fixed term</span>
          </div>
        </div>
      </div>
      
      {/* Crypto Details */}
      <div className="bg-base-200 p-4 rounded-lg mb-6">
        <h3 className="font-bold mb-4">Crypto Details</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Deposit in SOL:</span>
            <span className="font-bold">{formatSol(fixedSolDeposit)}</span>
          </div>
          <div className="flex justify-between">
            <span>SOL to USDC Rate:</span>
            <span className="font-bold">1 SOL ≈ {solToUsdcRate} USDC</span>
          </div>
          <div className="flex justify-between">
            <span>Total Value in USDC:</span>
            <span className="font-bold">{solInUsdc.toFixed(2)} USDC</span>
          </div>
          <div className="flex justify-between">
            <span>Loan in USDC:</span>
            <span className="font-bold text-primary">{loanAmount.toFixed(2)} USDC</span>
          </div>
          <div className="flex justify-between">
            <span>Block Confirmation:</span>
            <span className="font-bold">{isApproved ? 'Confirmed' : 'Pending'}</span>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-between gap-4">
        <button 
          onClick={onCancel} 
          className="btn btn-outline flex-1"
          disabled={isProcessing || isApproved}
        >
          Cancel
        </button>
        {!isApproved ? (
          <button 
            onClick={handleRequestLoan} 
            className="btn btn-primary flex-1"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <span className="loading loading-spinner loading-sm mr-2"></span>
                Processing...
              </>
            ) : (
              'Confirm Loan'
            )}
          </button>
        ) : (
          <button 
            onClick={onComplete} 
            className="btn btn-success flex-1"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  )
} 