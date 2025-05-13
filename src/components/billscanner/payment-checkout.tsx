'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import { ItemAssignment, BillItem, Contact } from './contact-assignment'
import { useContacts } from '../contacts/contacts-context'
import { usePool } from '../pool/pool-context'
import { BankLoanCard } from '../pool/bank-loan-card'

// Utility function to detect currency and convert to USDC if needed
const convertToUsdc = (items: BillItem[], total: number): { 
  usdcAmount: number, 
  originalCurrency: string,
  conversionMessage: string,
  conversionRate: number
} => {
  // Default values
  let usdcAmount = total;
  let originalCurrency = 'USD';
  let conversionMessage = '';
  let conversionRate = 1;

  // Determine currency by checking all items
  const euroItems = items.filter(item => item.price.includes('€'));
  const dollarItems = items.filter(item => item.price.includes('$'));
  
  // If most items are in euros, consider it a euro bill
  if (euroItems.length > dollarItems.length) {
    // Current conversion rates (in a real app, would use an API)
    // 1 EUR ≈ 1.08 USDC (as of May 2024)
    conversionRate = 1.08;
    usdcAmount = total * conversionRate;
    originalCurrency = 'EUR';
    conversionMessage = `€${total.toFixed(2)} converted to ${usdcAmount.toFixed(2)} USDC (1 EUR ≈ ${conversionRate} USDC)`;
  } else if (originalCurrency === 'USD') {
    // 1:1 for USD to USDC (simplified)
    conversionMessage = `$${total.toFixed(2)} equivalent to ${usdcAmount.toFixed(2)} USDC`;
  }
  
  return { 
    usdcAmount, 
    originalCurrency, 
    conversionMessage,
    conversionRate
  };
};

// Format a price based on detected currency
const formatPrice = (amount: number, currency: string): string => {
  switch(currency) {
    case 'EUR':
      return `€${amount.toFixed(2)}`;
    case 'USD':
    default:
      return `$${amount.toFixed(2)}`;
  }
};

interface PaymentCheckoutProps {
  items: BillItem[]
  assignments: ItemAssignment[]
  onBack: () => void
  onComplete: () => void
}

export function PaymentCheckout({ items, assignments, onBack, onComplete }: PaymentCheckoutProps) {
  const { contacts } = useContacts()
  const [completedPayments, setCompletedPayments] = useState<string[]>([]) // Array of contact IDs who have completed payment
  
  // Group items by contacts
  const contactPayments = groupItemsByContact(items, assignments, contacts)
  
  // Mark a payment as complete
  const markPaymentComplete = (contactId: string) => {
    setCompletedPayments(prev => [...prev, contactId])
    toast.success(`Payment from ${contacts.find(c => c.id === contactId)?.name || 'Contact'} marked as complete!`)
  }
  
  // Check if all payments are complete
  const isAllComplete = contactPayments.length > 0 && 
    contactPayments.every(cp => completedPayments.includes(cp.contactId))
  
  // Complete all payments and finish the process
  const handleCompleteAll = () => {
    if (isAllComplete) {
      onComplete()
      toast.success('All payments completed!')
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-base-200 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Payment Checkout</h2>
      
      {contactPayments.length === 0 ? (
        <div className="text-center py-8 bg-base-100 rounded-lg">
          <p className="mb-4">No items have been assigned to contacts for payment.</p>
          <button onClick={onBack} className="btn btn-primary">
            Go Back
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {contactPayments.map(payment => (
              <PaymentCard 
                key={payment.contactId}
                payment={payment}
                isComplete={completedPayments.includes(payment.contactId)}
                onMarkComplete={() => markPaymentComplete(payment.contactId)}
              />
            ))}
          </div>
          
          <div className="mt-8 border-t border-base-300 pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg font-bold">
                  {completedPayments.length} of {contactPayments.length} payments complete
                </p>
                <p className="text-sm opacity-70">
                  {isAllComplete 
                    ? 'All payments have been completed!' 
                    : 'Waiting for payments to be completed...'}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={onBack} className="btn btn-outline">
                  Back
                </button>
                <button 
                  onClick={handleCompleteAll} 
                  className="btn btn-primary"
                  disabled={!isAllComplete}
                >
                  {isAllComplete ? 'Finish' : 'Waiting for Payments...'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Individual payment card component
function PaymentCard({ 
  payment, 
  isComplete, 
  onMarkComplete 
}: { 
  payment: ContactPaymentInfo,
  isComplete: boolean,
  onMarkComplete: () => void
}) {
  const { payFromPool, takeLoan, getUserBalance } = usePool();
  const [showQR, setShowQR] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showBankLoanCard, setShowBankLoanCard] = useState(false);
  const [conversionInfo, setConversionInfo] = useState<{
    usdcAmount: number;
    originalCurrency: string;
    conversionMessage: string;
    conversionRate: number;
  }>({ 
    usdcAmount: payment.total, 
    originalCurrency: payment.originalCurrency, 
    conversionMessage: '', 
    conversionRate: 1
  });

  // Perform currency detection and conversion when the component loads
  useEffect(() => {
    try {
      const result = convertToUsdc(payment.items, payment.total);
      setConversionInfo(result);
      setQrError(null); // Clear any previous errors
      
      // Show a toast notification when conversion happens (only for EUR)
      if (result.originalCurrency === 'EUR' && result.conversionRate !== 1) {
        toast.success(`Converted €${payment.total.toFixed(2)} to ${result.usdcAmount.toFixed(2)} USDC for payment`, {
          duration: 4000,
          icon: '💱',
        });
      }
    } catch (error) {
      console.error('Error converting currency:', error);
      // Fallback to default values if conversion fails
      setConversionInfo({
        usdcAmount: payment.total,
        originalCurrency: payment.originalCurrency,
        conversionMessage: 'Error converting currency. Using original amount.',
        conversionRate: 1
      });
      setQrError('Failed to convert currency values');
      
      toast.error('Error converting currency. Using original amount.');
    }
  }, [payment.items, payment.total, payment.originalCurrency]);

  // Create Solana payment URL with USDC amount
  const createPaymentUrl = () => {
    if (!payment.walletAddress) return '';
    
    try {
      // Include additional metadata in the payment URL
      // Using SPL-token parameter to specify USDC token address
      const usdcTokenAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC on Solana mainnet
      return `solana:${payment.walletAddress}?amount=${conversionInfo.usdcAmount.toFixed(2)}&spl-token=${usdcTokenAddress}&reference=bill-${Date.now()}&label=snapSolPay%20Payment&message=Payment%20from%20${encodeURIComponent(payment.name)}`;
    } catch (error) {
      console.error('Error creating payment URL:', error);
      setQrError('Failed to create payment URL');
      return '';
    }
  };

  const paymentUrl = createPaymentUrl();

  // Format the conversion info for display
  const getConversionDisplayInfo = () => {
    if (conversionInfo.originalCurrency === 'EUR') {
      return {
        originalAmount: `€${payment.total.toFixed(2)}`,
        convertedAmount: `${conversionInfo.usdcAmount.toFixed(2)} USDC`,
        rate: `1 EUR = ${conversionInfo.conversionRate} USDC`
      };
    } else {
      return {
        originalAmount: `$${payment.total.toFixed(2)}`,
        convertedAmount: `${conversionInfo.usdcAmount.toFixed(2)} USDC`,
        rate: '1:1 conversion'
      };
    }
  };

  const conversionDisplay = getConversionDisplayInfo();

  // Handle payment from the shared pool
  const handlePoolPayment = () => {
    const userBalance = getUserBalance(payment.contactId);
    
    if (userBalance < conversionInfo.usdcAmount) {
      toast.error('Insufficient funds in the pool');
      return;
    }
    
    const success = payFromPool(
      payment.poolId || '',
      payment.contactId,
      payment.name,
      payment.avatar,
      conversionInfo.usdcAmount,
      `Payment for ${payment.items.length} items`,
      `bill-${Date.now()}`
    );
    
    if (success) {
      toast.success(`Paid ${conversionInfo.usdcAmount.toFixed(2)} USDC from the shared pool`);
      onMarkComplete();
    }
  };
  
  // Handle loan request using bank card
  const handleLoanPayment = () => {
    setShowBankLoanCard(true);
    setShowPaymentOptions(false);
  };

  // Handle when bank loan is completed
  const handleBankLoanComplete = () => {
    setShowBankLoanCard(false);
    onMarkComplete();
  }

  // Handle when bank loan is canceled
  const handleBankLoanCancel = () => {
    setShowBankLoanCard(false);
  }

  // If showing the bank loan card, return that component instead
  if (showBankLoanCard) {
    return (
      <BankLoanCard
        userId={payment.contactId}
        userName={payment.name}
        userAvatar={payment.avatar}
        poolId={payment.poolId || ''}
        loanAmount={conversionInfo.usdcAmount}
        onComplete={handleBankLoanComplete}
        onCancel={handleBankLoanCancel}
      />
    );
  }

  return (
    <div className={`border rounded-lg p-4 ${isComplete ? 'bg-success bg-opacity-10 border-success' : 'bg-base-100'}`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="text-2xl">{payment.avatar}</div>
          <div>
            <h3 className="font-bold text-lg">{payment.name}</h3>
            {payment.walletAddress && (
              <p className="text-xs font-mono truncate max-w-60" title={payment.walletAddress}>
                {payment.walletAddress.substring(0, 6)}...{payment.walletAddress.substring(payment.walletAddress.length - 6)}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold">
            {formatPrice(payment.total, conversionInfo.originalCurrency)}
          </p>
          <p className="text-sm">{payment.items.length} item{payment.items.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
      
      {isComplete ? (
        <div className="bg-success bg-opacity-20 text-success rounded p-2 text-center">
          ✓ Payment Complete
        </div>
      ) : (
        <div className="space-y-4">
          {/* Payment Options Dropdown */}
          <div className="dropdown dropdown-top w-full">
            <label 
              tabIndex={0} 
              className="btn btn-primary w-full"
              onClick={() => setShowPaymentOptions(!showPaymentOptions)}
            >
              Payment Options
            </label>
            {showPaymentOptions && (
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-full">
                <li>
                  <button onClick={() => setShowQR(!showQR)} className="justify-between">
                    Solana QR Payment
                    <span className="badge badge-sm">Direct</span>
                  </button>
                </li>
                <li>
                  <button onClick={handleLoanPayment} className="justify-between">
                    Take a Bank Loan
                    <span className="badge badge-sm badge-secondary">Loan</span>
                  </button>
                </li>
                <li>
                  <button onClick={onMarkComplete} className="justify-between">
                    Mark as Paid Manually
                    <span className="badge badge-sm badge-accent">Manual</span>
                  </button>
                </li>
              </ul>
            )}
          </div>
          
          {/* QR Code Display */}
          {payment.walletAddress && showQR && (
            <div className="bg-white p-4 rounded-lg">
              {qrError ? (
                <div className="text-error p-4 text-center">
                  <p className="font-bold">Error generating QR code</p>
                  <p className="text-sm">{qrError}</p>
                </div>
              ) : (
                <>
                  <QRCodeSVG
                    value={paymentUrl}
                    size={200}
                    bgColor={"#ffffff"}
                    fgColor={"#000000"}
                    level={"L"}
                    includeMargin={false}
                  />
                  <p className="text-center text-xs mt-2">Scan to pay with Solana</p>
                  
                  {/* Display the payment amount in USDC */}
                  <p className="text-center font-bold mt-1">{conversionDisplay.convertedAmount}</p>
                  
                  {/* Currency conversion information */}
                  <div className="mt-2 text-center text-xs text-gray-500 space-y-1">
                    <p>Original: {conversionDisplay.originalAmount}</p>
                    <p>Rate: {conversionDisplay.rate}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
      
      <div className="mt-4 space-y-1">
        <p className="text-sm font-bold">Items:</p>
        {payment.items.map(item => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>{item.name}</span>
            <span className="font-mono">{item.price}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Types and helper functions
interface ContactPaymentInfo {
  contactId: string
  name: string
  avatar: string
  walletAddress?: string
  poolId?: string
  items: BillItem[]
  total: number
  originalCurrency: string
}

// Group items by contact for payment
function groupItemsByContact(
  items: BillItem[],
  assignments: ItemAssignment[],
  contacts: Contact[]
): ContactPaymentInfo[] {
  const contactPayments: Record<string, ContactPaymentInfo> = {}
  
  // Process each assignment
  assignments.forEach(assignment => {
    const item = items.find(i => i.id === assignment.itemId)
    const contact = contacts.find(c => c.id === assignment.contactId)
    
    if (item && contact) {
      // Create or update contact payment info
      if (!contactPayments[contact.id]) {
        contactPayments[contact.id] = {
          contactId: contact.id,
          name: contact.name,
          avatar: contact.avatar || '👤',
          walletAddress: contact.walletAddress,
          poolId: '', // Initialize with empty string
          items: [],
          total: 0,
          originalCurrency: 'USD' // Default currency
        }
      }
      
      // Add the item to this contact
      contactPayments[contact.id].items.push(item)
      contactPayments[contact.id].total += item.priceValue
      
      // Update the currency based on the item
      if (item.price.includes('€')) {
        contactPayments[contact.id].originalCurrency = 'EUR'
      }
    }
  })
  
  // Do a final pass to ensure currency is consistent
  // If there are mixed currencies, use the majority
  Object.values(contactPayments).forEach(payment => {
    const euroItems = payment.items.filter(item => item.price.includes('€'))
    const dollarItems = payment.items.filter(item => item.price.includes('$'))
    
    if (euroItems.length > dollarItems.length) {
      payment.originalCurrency = 'EUR'
    } else {
      payment.originalCurrency = 'USD'
    }
  })
  
  return Object.values(contactPayments)
} 