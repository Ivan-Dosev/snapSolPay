'use client'

import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  Connection,
} from '@solana/web3.js'
import { 
  createAssociatedTokenAccountInstruction, 
  getAssociatedTokenAddressSync, 
  createTransferInstruction,
  createCloseAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import { useState, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'
import { usePool, Pool } from '../pool/pool-context'

// USDC Token addresses
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') // Mainnet USDC
const USDC_MINT_DEVNET = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU') // Devnet USDC

// Pool data type to track on-chain data
export interface SolanaPoolAccount {
  pubkey: string
  tokenAccount: string
  initialized: boolean
  balance: number
}

// Map pool IDs to Solana accounts
const POOL_ACCOUNTS_KEY = 'snapSolPay_pool_accounts'

// Save pool solana accounts to localStorage
const savePoolAccounts = (accounts: Record<string, SolanaPoolAccount>) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(POOL_ACCOUNTS_KEY, JSON.stringify(accounts))
      return true
    } catch (e) {
      console.error('Failed to save pool accounts to localStorage', e)
      return false
    }
  }
  return false
}

// Load pool solana accounts from localStorage
const loadPoolAccounts = (): Record<string, SolanaPoolAccount> => {
  if (typeof window !== 'undefined') {
    try {
      const savedData = localStorage.getItem(POOL_ACCOUNTS_KEY)
      if (savedData) {
        return JSON.parse(savedData)
      }
    } catch (e) {
      console.error('Failed to load pool accounts from localStorage', e)
    }
  }
  return {}
}

export function useSolanaPoolService() {
  const { connection } = useConnection()
  const { publicKey, sendTransaction, signTransaction } = useWallet()
  const [isInitializing, setIsInitializing] = useState(false)
  const [poolAccounts, setPoolAccounts] = useState<Record<string, SolanaPoolAccount>>(loadPoolAccounts())
  const [isLoadingBalances, setIsLoadingBalances] = useState(false)
  const { pools } = usePool()

  // Get USDC mint based on network
  const getUsdcMint = useCallback(() => {
    // For simplicity, always return the devnet token for this demo
    // In production, you would check connection.rpcEndpoint to determine the network
    return USDC_MINT_DEVNET
  }, [])

  // Load pool accounts on startup
  useEffect(() => {
    setPoolAccounts(loadPoolAccounts())
  }, [])

  // Save pool accounts to localStorage when updated
  useEffect(() => {
    savePoolAccounts(poolAccounts)
  }, [poolAccounts])

  // Refresh pool balances periodically
  useEffect(() => {
    if (!connection || Object.keys(poolAccounts).length === 0) return

    const refreshPoolBalances = async () => {
      try {
        setIsLoadingBalances(true)
        const newPoolAccounts = { ...poolAccounts }
        let updated = false

        for (const poolId in poolAccounts) {
          const pool = poolAccounts[poolId]
          if (pool.initialized && pool.tokenAccount) {
            try {
              const tokenAccount = new PublicKey(pool.tokenAccount)
              const tokenAccountInfo = await connection.getTokenAccountBalance(tokenAccount)
              const newBalance = parseFloat(tokenAccountInfo.value.uiAmount?.toString() || '0')
              
              if (newBalance !== pool.balance) {
                newPoolAccounts[poolId] = {
                  ...pool,
                  balance: newBalance
                }
                updated = true
              }
            } catch (error) {
              console.error(`Error fetching balance for pool ${poolId}:`, error)
            }
          }
        }

        if (updated) {
          setPoolAccounts(newPoolAccounts)
        }
      } catch (error) {
        console.error('Error refreshing pool balances:', error)
      } finally {
        setIsLoadingBalances(false)
      }
    }

    refreshPoolBalances()
    const intervalId = setInterval(refreshPoolBalances, 30000) // Refresh every 30 seconds
    
    return () => clearInterval(intervalId)
  }, [connection, poolAccounts])

  // Initialize a new pool with a token account
  const initializePool = useCallback(
    async (poolId: string): Promise<boolean> => {
      if (!publicKey || !connection) {
        toast.error('Wallet not connected')
        return false
      }

      try {
        setIsInitializing(true)
        
        // Generate a unique seed for each pool by adding a random suffix if needed
        // First check if we already have this pool initialized
        const existingPool = poolAccounts[poolId];
        if (existingPool && existingPool.initialized) {
          toast.success('Pool already initialized on Solana!')
          return true;
        }
        
        // Generate a unique pool seed by combining the poolId with a timestamp and random value
        const timestamp = Date.now().toString().substring(0, 6);
        const randomValue = Math.floor(Math.random() * 1000000).toString().substring(0, 6);
        const poolSeed = `pool-${poolId.substring(0, 8)}-${timestamp}-${randomValue}`.substring(0, 31); // Seeds must be <= 32 bytes
        
        console.log(`Creating pool with seed: ${poolSeed}`);
        
        // Create the pool account - this will be a SOL account instead of token account for simplicity
        const poolPubkey = await PublicKey.createWithSeed(
          publicKey,
          poolSeed,
          SystemProgram.programId
        )
        
        // Get the minimum lamports required for rent exemption
        const rentExemptionAmount = await connection.getMinimumBalanceForRentExemption(0);
        
        // Create a transaction - this will just create a basic account owned by the wallet
        let tx = new Transaction()
        
        // Create pool account with a small SOL balance (0.01 SOL + rent exemption)
        const initialSolAmount = rentExemptionAmount + 0.01 * LAMPORTS_PER_SOL;
        
        tx.add(
          SystemProgram.createAccountWithSeed({
            fromPubkey: publicKey,
            basePubkey: publicKey,
            seed: poolSeed,
            newAccountPubkey: poolPubkey,
            lamports: initialSolAmount,
            space: 0,
            programId: SystemProgram.programId,
          })
        )

        // Get recent blockhash for transaction
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
        tx.recentBlockhash = blockhash;
        tx.feePayer = publicKey;

        // Send transaction with improved error handling
        let signature: string | undefined;
        try {
          // Send transaction
          signature = await sendTransaction(tx, connection);
          console.log('Transaction sent with signature:', signature);
          
          if (!signature) {
            throw new Error('Failed to get transaction signature');
          }
          
          // TypeScript type assertion - signature is definitely a string at this point
          const confirmedSignature: string = signature;
          
          // Set up confirmation listener
          const subscriptionId = connection.onSignature(
            confirmedSignature, // Use the confirmed signature string
            (result, context) => {
              if (result.err) {
                console.error('Transaction failed:', result.err);
              } else {
                console.log('Transaction confirmed');
              }
            },
            'confirmed'
          );
          
          // Wait for confirmation
          await new Promise<void>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              if (subscriptionId) connection.removeSignatureListener(subscriptionId);
              reject(new Error('Transaction confirmation timeout'));
            }, 60000); // 60 second timeout
            
            const subscriptionId = connection.onSignature(
              confirmedSignature, // Use the confirmed signature string
              (result, context) => {
                clearTimeout(timeoutId);
                connection.removeSignatureListener(subscriptionId);
                if (result.err) {
                  reject(new Error('Transaction failed: ' + JSON.stringify(result.err)));
                } else {
                  resolve();
                }
              },
              'confirmed'
            );
          });
          
          toast.success('Pool account initialized on Solana!');
        } catch (txError) {
          console.error('Transaction error:', txError);
          
          // Handle specific error types
          if (txError instanceof Error) {
            if (txError.message.includes('timeout')) {
              // Sometimes transactions succeed but confirmation timeout occurs
              // Wait a bit and check transaction status manually
              try {
                await new Promise(resolve => setTimeout(resolve, 5000));
                if (signature) {
                  // We know signature is a string at this point
                  const txSignature: string = signature;
                  const status = await connection.getSignatureStatus(txSignature);
                  if (status.value && !status.value.err) {
                    toast.success('Pool account initialized on Solana (late confirmation)!');
                    console.log('Transaction succeeded despite timeout');
                    // Transaction actually succeeded, continue
                  } else {
                    throw new Error('Transaction failed after timeout: ' + JSON.stringify(status.value?.err));
                  }
                } else {
                  throw txError; // Re-throw if no signature
                }
              } catch (confirmError) {
                console.error('Confirmation retry failed:', confirmError);
                throw confirmError;
              }
            } else {
              // For other errors, re-throw
              throw txError;
            }
          } else {
            throw txError;
          }
        }

        // Get the SOL balance of the new account
        const balance = await connection.getBalance(poolPubkey);
        const solBalance = balance / LAMPORTS_PER_SOL;

        // Set initial balance to the SOL balance (converted to USDC equivalent for UI consistency)
        setPoolAccounts(prev => ({
          ...prev,
          [poolId]: {
            pubkey: poolPubkey.toString(),
            tokenAccount: poolPubkey.toString(), // Using same account for both since we're not using USDC
            initialized: true,
            balance: solBalance  // This is now SOL balance 
          }
        }))

        return true
      } catch (error) {
        console.error('Error initializing pool:', error)
        
        // Provide more detailed error messages to the user
        if (error instanceof Error) {
          if (error.message.includes('insufficient funds')) {
            toast.error('Insufficient SOL in your wallet for this transaction');
          } else if (error.message.includes('timeout')) {
            toast.error('Transaction timed out. The network may be congested, but your pool might still be created. Please check the Solana Pool tab.');
          } else if (error.message.includes('Transaction failed')) {
            toast.error('Transaction failed on the blockchain. Please try again with a different pool name.');
          } else if (error.message.includes('User rejected')) {
            toast.error('Transaction was rejected by your wallet');
          } else {
            toast.error(`Failed to initialize pool: ${error.message}`);
          }
        } else {
          toast.error('Failed to initialize pool. Please try again.')
        }
        
        return false
      } finally {
        setIsInitializing(false)
      }
    },
    [publicKey, connection, sendTransaction, poolAccounts]
  )

  // Contribute SOL to a pool
  const contributeToPool = useCallback(
    async (poolId: string, amount: number): Promise<boolean> => {
      if (!publicKey || !connection) {
        toast.error('Wallet not connected')
        return false
      }

      const poolAccount = poolAccounts[poolId]
      if (!poolAccount || !poolAccount.initialized) {
        const initialized = await initializePool(poolId)
        if (!initialized) return false
      }

      try {
        // Get pool's public key
        const poolPubkey = new PublicKey(poolAccounts[poolId].pubkey)
        
        // Calculate amount in lamports (SOL's smallest unit)
        const amountInLamports = Math.floor(amount * LAMPORTS_PER_SOL)
        
        // Create transfer transaction - simple SOL transfer
        const tx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: poolPubkey,
            lamports: amountInLamports
          })
        )

        // Get recent blockhash for transaction
        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        tx.recentBlockhash = blockhash;
        tx.feePayer = publicKey;

        // Send and confirm transaction
        const signature = await sendTransaction(tx, connection)
        await connection.confirmTransaction(signature, 'confirmed')
        
        // Update pool balance after contribution
        const newBalanceInLamports = await connection.getBalance(poolPubkey)
        const newBalance = newBalanceInLamports / LAMPORTS_PER_SOL
        
        setPoolAccounts(prev => ({
          ...prev,
          [poolId]: {
            ...prev[poolId],
            balance: newBalance
          }
        }))

        toast.success(`Successfully contributed ${amount} SOL to the pool`)
        return true
      } catch (error) {
        console.error('Error contributing to pool:', error)
        
        // Provide more helpful error messages
        if (error instanceof Error) {
          if (error.message.includes('insufficient funds')) {
            toast.error('Insufficient SOL in your wallet for this contribution');
          } else if (error.message.includes('timeout')) {
            toast.error('Transaction timed out. The network may be congested, please try again.');
          } else if (error.message.includes('User rejected')) {
            toast.error('Transaction was rejected by your wallet');
          } else {
            toast.error(`Failed to contribute to pool: ${error.message}`);
          }
        } else {
          toast.error('Failed to contribute to pool. Please try again.');
        }
        
        return false
      }
    },
    [publicKey, connection, poolAccounts, initializePool, sendTransaction]
  )

  // Withdraw SOL from a pool
  const withdrawFromPool = useCallback(
    async (poolId: string, recipientAddress: string, amount: number): Promise<boolean> => {
      if (!publicKey || !connection) {
        toast.error('Wallet not connected')
        return false
      }

      const poolAccount = poolAccounts[poolId]
      if (!poolAccount || !poolAccount.initialized) {
        toast.error('Pool is not initialized')
        return false
      }

      try {
        // Convert recipient address string to PublicKey
        const recipientPublicKey = new PublicKey(recipientAddress)
        
        // Get pool keys
        const poolPubkey = new PublicKey(poolAccount.pubkey)
        
        // Calculate amount in lamports
        const amountInLamports = Math.floor(amount * LAMPORTS_PER_SOL)
        
        // Check if the pool has enough balance
        const poolBalance = await connection.getBalance(poolPubkey)
        if (poolBalance < amountInLamports) {
          toast.error(`Insufficient balance in pool. Available: ${poolBalance / LAMPORTS_PER_SOL} SOL`)
          return false
        }
        
        // For this demo, we'll have the connected wallet sign a transaction on behalf of the pool
        // In a real application, this would use a proper program to control access to the pool
        
        // Create a transaction to transfer SOL from pool to recipient
        const tx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: poolPubkey,  // Pool is sending SOL
            toPubkey: recipientPublicKey,  // Recipient receives SOL
            lamports: amountInLamports
          })
        )
        
        // Get recent blockhash for transaction
        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        tx.recentBlockhash = blockhash;
        tx.feePayer = publicKey;  // Connected wallet pays the fee
        
        // This is a simplification - in a real application, you would use a program
        // with proper authorization checks to manage pool withdrawals
        
        // Send the transaction - the wallet adapter will handle signing
        const signature = await sendTransaction(tx, connection)
        await connection.confirmTransaction(signature, 'confirmed')
        
        // Update pool balance after withdrawal
        const newBalanceInLamports = await connection.getBalance(poolPubkey)
        const newBalance = newBalanceInLamports / LAMPORTS_PER_SOL
        
        setPoolAccounts(prev => ({
          ...prev,
          [poolId]: {
            ...prev[poolId],
            balance: newBalance
          }
        }))

        toast.success(`Successfully withdrew ${amount} SOL from the pool`)
        return true
      } catch (error) {
        console.error('Error withdrawing from pool:', error)
        
        // Provide more helpful error messages
        if (error instanceof Error) {
          if (error.message.includes('insufficient funds')) {
            toast.error('Insufficient SOL in the pool for this withdrawal');
          } else if (error.message.includes('timeout')) {
            toast.error('Transaction timed out. The network may be congested, please try again.');
          } else if (error.message.includes('User rejected')) {
            toast.error('Transaction was rejected by your wallet');
          } else {
            toast.error(`Failed to withdraw from pool: ${error.message}`);
          }
        } else {
          toast.error('Failed to withdraw from pool. Please try again.');
        }
        
        return false
      }
    },
    [publicKey, connection, poolAccounts, sendTransaction]
  )

  // Close a pool account on Solana and reclaim the SOL
  const closePool = useCallback(
    async (poolId: string): Promise<boolean> => {
      if (!publicKey || !connection) {
        toast.error('Wallet not connected')
        return false
      }

      const poolAccount = poolAccounts[poolId]
      if (!poolAccount || !poolAccount.initialized) {
        // If we don't have this pool in our local state, we can just remove it
        console.log(`Pool ${poolId} not found in local state or not initialized, removing from pool accounts.`)
        setPoolAccounts(prev => {
          const newAccounts = { ...prev }
          delete newAccounts[poolId]
          return newAccounts
        })
        return true
      }

      try {
        // Get the pool's public key
        const poolPubkey = new PublicKey(poolAccount.pubkey)
        console.log(`Attempting to close pool: ${poolId} with address ${poolPubkey.toString()}`)
        
        // Check if the account exists and get the balance
        const accountInfo = await connection.getAccountInfo(poolPubkey)
        if (!accountInfo) {
          // Account doesn't exist on-chain, just remove from local state
          console.log(`Pool account ${poolId} not found on Solana blockchain, removing from local state only.`)
          toast.success('Pool account not found on Solana. Removing from local state.')
          setPoolAccounts(prev => {
            const newAccounts = { ...prev }
            delete newAccounts[poolId]
            return newAccounts
          })
          return true
        }
        
        console.log(`Pool account exists on chain. Owner: ${accountInfo.owner.toString()}, data length: ${accountInfo.data.length}`)
        
        // Create a transaction to transfer all SOL back to the wallet
        // For accounts created with createAccountWithSeed, we need to close them differently
        // Since the account was created with a seed and is owned by SystemProgram, we transfer all SOL out
        const balanceInLamports = await connection.getBalance(poolPubkey)
        console.log(`Pool balance: ${balanceInLamports / LAMPORTS_PER_SOL} SOL (${balanceInLamports} lamports)`)
        
        // Need to leave enough for rent and fees
        const rentExemption = await connection.getMinimumBalanceForRentExemption(0)
        const transferAmount = Math.max(0, balanceInLamports - rentExemption - 5000) // Leave 5000 lamports for fee
        
        if (transferAmount > 0) {
          // Create transaction to move funds back to wallet
          const tx = new Transaction()
          
          tx.add(
            SystemProgram.transfer({
              fromPubkey: poolPubkey,
              toPubkey: publicKey,
              lamports: transferAmount
            })
          )
          
          // Get recent blockhash for transaction
          const { blockhash } = await connection.getLatestBlockhash('confirmed')
          tx.recentBlockhash = blockhash
          tx.feePayer = publicKey
          
          try {
            // Send and confirm transaction
            console.log(`Sending transaction to transfer ${transferAmount / LAMPORTS_PER_SOL} SOL from pool to wallet`)
            const signature = await sendTransaction(tx, connection)
            console.log(`Transaction sent with signature: ${signature}`)
            
            // Use a more lenient confirmation
            const status = await connection.confirmTransaction(signature, 'processed')
            console.log(`Transaction confirmation status:`, status)
            
            if (status.value && status.value.err) {
              console.error(`Transaction error:`, status.value.err)
              toast.error(`Transaction failed: ${JSON.stringify(status.value.err)}`)
            } else {
              toast.success(`Recovered ${(transferAmount / LAMPORTS_PER_SOL).toFixed(4)} SOL from pool`)
            }
          } catch (txError) {
            console.error('Transaction error:', txError)
            // Continue with removing from local state
            toast.error('Failed to recover funds, but will remove from local state.')
          }
        } else {
          toast.success('No SOL to recover from this pool account')
        }
        
        // Regardless of transaction success, remove the pool from our local state
        setPoolAccounts(prev => {
          const newAccounts = { ...prev }
          delete newAccounts[poolId]
          return newAccounts
        })
        
        console.log(`Pool ${poolId} removed from local state`)
        toast.success('Pool account closed in local state')
        return true
      } catch (error) {
        console.error('Error closing pool account:', error)
        
        // Provide more helpful error messages
        if (error instanceof Error) {
          console.log(`Close pool error details: ${error.message}`)
          if (error.message.includes('insufficient funds')) {
            toast.error('Insufficient funds to pay transaction fee');
          } else if (error.message.includes('timeout')) {
            toast.error('Transaction timed out. The network may be congested.');
          } else if (error.message.includes('User rejected')) {
            toast.error('Transaction was rejected by your wallet');
          } else if (error.message.includes('TokenAccountNotFound') || error.message.includes('not a Token account')) {
            toast.error('Invalid token account. This might be a regular SOL account instead of a token account.');
            // Remove from local state anyway
            setPoolAccounts(prev => {
              const newAccounts = { ...prev }
              delete newAccounts[poolId]
              return newAccounts
            });
            return true;
          } else {
            toast.error(`Failed to close pool account: ${error.message}`);
          }
        } else {
          toast.error('Failed to close pool account. Please try again.');
        }
        
        return false
      }
    },
    [publicKey, connection, poolAccounts, sendTransaction]
  )

  return {
    poolAccounts,
    isInitializing,
    isLoadingBalances,
    initializePool,
    contributeToPool,
    withdrawFromPool,
    closePool
  }
} 