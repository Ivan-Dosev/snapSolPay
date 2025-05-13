'use client'

import { useState } from 'react'
import { usePool } from './pool-context'
import toast from 'react-hot-toast'

export interface VirtualCardProps {
  userId: string
  userName: string
  userAvatar: string
  poolId: string
}

export function VirtualCard({ userId, userName, userAvatar, poolId }: VirtualCardProps) {
  const { 
    getUserBalance, 
    getUserLoans, 
    takeLoan,
    getPoolBalance
  } = usePool()
  
  const [showCardDetails, setShowCardDetails] = useState(false)
  const [isRequestingCard, setIsRequestingCard] = useState(false)
  const [cardActivated, setCardActivated] = useState(false)
  
  // Calculate user's deposit and available credit
  const userDeposit = getUserBalance(userId, poolId)
  const loanLimit = userDeposit * 1.0 // 100% of deposit (changed from 60%)
  
  // Calculate already loaned amount
  const userLoans = getUserLoans(userId, poolId)
  const activeLoans = userLoans.filter(loan => !loan.repaid)
  const loanedAmount = activeLoans.reduce((sum, loan) => sum + loan.amount, 0)
  
  // Calculate available credit
  const availableCredit = Math.max(0, loanLimit - loanedAmount)
  
  // Pool total balance
  const poolBalance = getPoolBalance(poolId)
  
  // Format number as currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }
  
  // Generate a random card number (for simulation)
  const generateCardNumber = () => {
    const prefix = '4756'
    const randomPart = Math.floor(Math.random() * 10000000000000).toString().padStart(12, '0')
    return `${prefix} ${randomPart.slice(0, 4)} ${randomPart.slice(4, 8)} ${randomPart.slice(8, 12)}`
  }
  
  // Generate random CVV
  const generateCVV = () => {
    return Math.floor(Math.random() * 900 + 100).toString() // 3-digit number
  }
  
  // Generate random expiry date (2 years from now)
  const generateExpiryDate = () => {
    const date = new Date()
    const month = date.getMonth() + 1
    const year = date.getFullYear() + 2
    return `${month.toString().padStart(2, '0')}/${(year % 100).toString()}`
  }
  
  // Card details
  const [cardNumber] = useState(generateCardNumber())
  const [cardCVV] = useState(generateCVV())
  const [cardExpiry] = useState(generateExpiryDate())
  
  // Request virtual card
  const handleRequestCard = async () => {
    if (userDeposit <= 0) {
      toast.error('You need to deposit funds to the pool first')
      return
    }
    
    setIsRequestingCard(true)
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      setCardActivated(true)
      toast.success('Virtual card activated successfully!')
    } catch (error) {
      toast.error('Failed to activate card. Please try again.')
    } finally {
      setIsRequestingCard(false)
    }
  }
  
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Your Virtual Card</h3>
        <p className="text-gray-600 dark:text-gray-300">
          {cardActivated 
            ? "Use this virtual card for purchases up to your available credit limit" 
            : "Activate a virtual card backed by your pool deposit"}
        </p>
      </div>
      
      {/* Klarna-style Card Component */}
      <div className="relative">
        <div 
          className={`klarna-card w-full aspect-[1.6/1] rounded-2xl p-6 overflow-hidden ${
            cardActivated 
              ? availableCredit > 0 
                ? "bg-gradient-to-br from-accent to-secondary" 
                : "bg-gradient-to-br from-gray-700 to-gray-900"
              : "bg-gradient-to-br from-gray-200 to-gray-400"
          }`}
        >
          {/* Background pattern */}
          <div className="absolute top-0 left-0 w-full h-full" style={{ opacity: 0.07 }}>
            <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full border border-white"></div>
            <div className="absolute right-16 top-16 w-24 h-24 rounded-full border border-white"></div>
            <div className="absolute left-32 bottom-8 w-16 h-16 rounded-full border border-white"></div>
          </div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xl font-bold text-white tracking-tight">
                  <span className="text-white">snap</span>
                  <span className="text-white/80">Pay</span>
                </div>
                <div className="text-sm text-white/70 mt-1 font-medium">Pay Anywhere</div>
              </div>
              
              <div className="bg-white bg-opacity-20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-white">
                {cardActivated ? availableCredit > 0 ? 'ACTIVE' : 'MAXED OUT' : 'INACTIVE'}
              </div>
            </div>
            
            <div className="mt-4">
              {showCardDetails && cardActivated ? (
                <>
                  <div className="font-mono text-lg font-medium tracking-wider mb-4 text-white">{cardNumber}</div>
                  <div className="flex gap-6">
                    <div>
                      <div className="text-white/70 text-xs mb-1">EXPIRES</div>
                      <div className="text-white font-medium">{cardExpiry}</div>
                    </div>
                    <div>
                      <div className="text-white/70 text-xs mb-1">CVV</div>
                      <div className="text-white font-medium">{cardCVV}</div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="font-mono text-lg font-medium tracking-wider text-white mb-4">
                    {cardActivated ? '•••• •••• •••• ' + cardNumber.slice(-4) : '•••• •••• •••• ••••'}
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <div className="text-white/70 text-xs mb-1">AVAILABLE CREDIT</div>
                      <div className="text-white font-semibold">{formatCurrency(availableCredit)}</div>
                    </div>
                    <div>
                      <div className="text-white/70 text-xs mb-1">DEPOSIT</div>
                      <div className="text-white font-semibold">{formatCurrency(userDeposit)}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <div className="text-white/80 text-xs">{userName}</div>
              {userAvatar && (
                <div className="text-sm">{userAvatar}</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Card chip design */}
        <div className="absolute left-6 top-16 w-10 h-6 rounded-sm bg-yellow-300 bg-opacity-80 backdrop-blur-sm flex flex-col justify-around p-1 overflow-hidden">
          <div className="h-0.5 w-full bg-yellow-600"></div>
          <div className="h-0.5 w-full bg-yellow-600"></div>
        </div>
      </div>
      
      {/* Card Controls */}
      <div className="mt-8 space-y-5">
        {cardActivated ? (
          <>
            <button
              onClick={() => setShowCardDetails(!showCardDetails)}
              className="w-full py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {showCardDetails ? 
                  <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></>
                  : 
                  <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></>
                }
              </svg>
              {showCardDetails ? 'Hide Card Details' : 'Show Card Details'}
            </button>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Credit Limit</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(loanLimit)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">100% of deposit</div>
              </div>
              
              <div className={`rounded-xl p-4 border shadow-sm ${
                availableCredit > 0 
                  ? 'bg-success bg-opacity-10 border-success text-success' 
                  : 'bg-error bg-opacity-10 border-error text-error'
              }`}>
                <div className="text-xs opacity-80 mb-1">Available</div>
                <div className="text-xl font-bold">{formatCurrency(availableCredit)}</div>
                <div className="text-xs opacity-80 mt-1">
                  {loanedAmount > 0 ? `${formatCurrency(loanedAmount)} used` : 'Full amount available'}
                </div>
              </div>
            </div>
            
            {availableCredit <= 0 && (
              <div className="bg-error bg-opacity-10 border border-error text-error px-4 py-3 rounded-lg text-sm">
                Your available credit is depleted. Repay existing loans or increase your deposit to restore credit.
              </div>
            )}
          </>
        ) : (
          <>
            <button
              onClick={handleRequestCard}
              disabled={isRequestingCard || userDeposit <= 0}
              className={`w-full py-3 rounded-xl text-white font-medium text-center transition-colors ${
                userDeposit <= 0 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : isRequestingCard 
                    ? 'bg-primary opacity-80' 
                    : 'bg-primary hover:bg-primary-700'
              }`}
            >
              {isRequestingCard ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Activating...
                </span>
              ) : (
                'Activate Virtual Card'
              )}
            </button>
            
            {userDeposit <= 0 && (
              <div className="bg-warning bg-opacity-10 border border-warning text-warning-500 px-4 py-3 rounded-lg text-sm">
                You need to deposit funds to the pool first before you can activate a card.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
} 