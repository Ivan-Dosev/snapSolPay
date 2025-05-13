'use client'

import { getSuperteam101Program, getSuperteam101ProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'

export function useSuperteam101Program() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getSuperteam101ProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getSuperteam101Program(provider, programId), [provider, programId])

  const accounts = useQuery({
    queryKey: ['superteam101', 'all', { cluster }],
    queryFn: () => program.account.superteam101.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const initialize = useMutation({
    mutationKey: ['superteam101', 'initialize', { cluster }],
    mutationFn: (keypair: Keypair) =>
      program.methods.initialize().accounts({ superteam101: keypair.publicKey }).signers([keypair]).rpc(),
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: () => toast.error('Failed to initialize account'),
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize,
  }
}

export function useSuperteam101ProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useSuperteam101Program()

  const accountQuery = useQuery({
    queryKey: ['superteam101', 'fetch', { cluster, account }],
    queryFn: () => program.account.superteam101.fetch(account),
  })

  const closeMutation = useMutation({
    mutationKey: ['superteam101', 'close', { cluster, account }],
    mutationFn: () => program.methods.close().accounts({ superteam101: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accounts.refetch()
    },
  })

  const decrementMutation = useMutation({
    mutationKey: ['superteam101', 'decrement', { cluster, account }],
    mutationFn: () => program.methods.decrement().accounts({ superteam101: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const incrementMutation = useMutation({
    mutationKey: ['superteam101', 'increment', { cluster, account }],
    mutationFn: () => program.methods.increment().accounts({ superteam101: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const setMutation = useMutation({
    mutationKey: ['superteam101', 'set', { cluster, account }],
    mutationFn: (value: number) => program.methods.set(value).accounts({ superteam101: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  return {
    accountQuery,
    closeMutation,
    decrementMutation,
    incrementMutation,
    setMutation,
  }
}
