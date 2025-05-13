'use client'

import { PublicKey } from '@solana/web3.js'
import { useEffect, useMemo, useState } from 'react'
import { useGetSignatures } from './account-data-access'
import { CardTitle, Card, CardContent, CardDescription, CardHeader } from '../ui/ui-card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, PieLabelRenderProps } from 'recharts'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

interface TransactionCountByDay {
  date: string
  count: number
  successful: number
  failed: number
}

interface TransactionStatusData {
  name: string
  value: number
}

const COLORS = ['#10b981', '#ef4444']

// Custom label function with proper type
const renderCustomizedLabel = ({ name, percent }: PieLabelRenderProps) => {
  return `${name}: ${(percent ? (percent * 100).toFixed(0) : 0)}%`;
};

// Create a client
const queryClient = new QueryClient()

export function TransactionDashboard({ address }: { address: PublicKey }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TransactionDashboardContent address={address} />
    </QueryClientProvider>
  );
}

function TransactionDashboardContent({ address }: { address: PublicKey }) {
  const query = useGetSignatures({ address })
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'all'>('7d')

  // Process transaction data into chart-friendly format
  const { transactionsByDay, successVsFailure, volumeOverTime } = useMemo(() => {
    if (!query.data) {
      return { transactionsByDay: [], successVsFailure: [], volumeOverTime: [] }
    }

    // Filter data based on selected timeframe
    const now = new Date()
    let filteredData = query.data
    
    if (timeframe === '7d') {
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(now.getDate() - 7)
      filteredData = query.data.filter(tx => 
        new Date((tx.blockTime || 0) * 1000) > sevenDaysAgo
      )
    } else if (timeframe === '30d') {
      const thirtyDaysAgo = new Date(now)
      thirtyDaysAgo.setDate(now.getDate() - 30)
      filteredData = query.data.filter(tx => 
        new Date((tx.blockTime || 0) * 1000) > thirtyDaysAgo
      )
    }

    // Group transactions by day
    const txByDay = new Map<string, TransactionCountByDay>()
    
    filteredData.forEach(tx => {
      const date = new Date((tx.blockTime || 0) * 1000)
      const dateStr = date.toISOString().split('T')[0]
      
      if (!txByDay.has(dateStr)) {
        txByDay.set(dateStr, { 
          date: dateStr, 
          count: 0,
          successful: 0,
          failed: 0
        })
      }
      
      const dayData = txByDay.get(dateStr)!
      dayData.count++
      
      if (tx.err) {
        dayData.failed++
      } else {
        dayData.successful++
      }
    })
    
    // Create success vs failure data
    const successful = filteredData.filter(tx => !tx.err).length
    const failed = filteredData.filter(tx => tx.err).length
    
    const statusData: TransactionStatusData[] = [
      { name: 'Successful', value: successful },
      { name: 'Failed', value: failed }
    ]
    
    // Create volume over time data (using slot as a proxy for time)
    const volumeData = Array.from(txByDay.values())
      .sort((a, b) => a.date.localeCompare(b.date))
    
    return { 
      transactionsByDay: Array.from(txByDay.values())
        .sort((a, b) => a.date.localeCompare(b.date)), 
      successVsFailure: statusData,
      volumeOverTime: volumeData
    }
  }, [query.data, timeframe])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Transaction Analytics</h2>
        <div className="join">
          <button 
            className={`join-item btn btn-sm ${timeframe === '7d' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setTimeframe('7d')}
          >
            7 Days
          </button>
          <button 
            className={`join-item btn btn-sm ${timeframe === '30d' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setTimeframe('30d')}
          >
            30 Days
          </button>
          <button 
            className={`join-item btn btn-sm ${timeframe === 'all' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setTimeframe('all')}
          >
            All Time
          </button>
        </div>
      </div>

      {query.isLoading ? (
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : query.isError ? (
        <div className="alert alert-error">
          <p>Error loading transaction data: {query.error?.message}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Transaction Volume Card */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Volume</CardTitle>
              <CardDescription>Daily transaction count</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={transactionsByDay}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="successful" fill="#10b981" name="Successful" />
                  <Bar dataKey="failed" fill="#ef4444" name="Failed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Success vs Failure Card */}
          <Card>
            <CardHeader>
              <CardTitle>Success vs Failure</CardTitle>
              <CardDescription>Transaction success rate</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={successVsFailure}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {successVsFailure.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Transaction Trend Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Transaction Trend</CardTitle>
              <CardDescription>Transaction volume over time</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={volumeOverTime}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" name="Total Transactions" />
                  <Line type="monotone" dataKey="successful" stroke="#10b981" name="Successful" />
                  <Line type="monotone" dataKey="failed" stroke="#ef4444" name="Failed" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 