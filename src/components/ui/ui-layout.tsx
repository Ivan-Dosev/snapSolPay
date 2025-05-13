'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'
import { ReactNode, Suspense, useEffect, useRef } from 'react'
import toast, { Toaster } from 'react-hot-toast'

import { AccountChecker } from '../account/account-ui'
import { ClusterChecker, ClusterUiSelect, ExplorerLink } from '../cluster/cluster-ui'
import { WalletButton } from '../solana/solana-provider'

export function UiLayout({ children, links }: { children: ReactNode; links: { label: string; path: string }[] }) {
  const pathname = usePathname()

  // Function to determine if a link is active based on exact path or closest match
  const isActive = (path: string) => {
    // Exact match (highest priority)
    if (pathname === path) return true;
    
    // For root path ("/"), only match exactly
    if (path === '/') return pathname === '/';
    
    // For non-root paths, check if it's the closest parent path
    // This handles cases like /scanner and /scanner/detail properly
    if (pathname.startsWith(path + '/')) {
      // Check if there's another path that's a better (longer) match
      const betterMatch = links.some(
        link => link.path !== path && 
                pathname.startsWith(link.path) && 
                link.path.startsWith(path)
      );
      return !betterMatch;
    }
    
    return false;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Premium-looking header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-40 sticky top-0">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link className="flex-shrink-0 flex items-center overflow-hidden max-w-[180px] sm:max-w-none" href="/">
                <img src="/logo.png" alt="snapSolPay Logo" className="h-7 sm:h-8 w-auto mr-2 flex-shrink-0" />
                <span className="text-lg sm:text-xl font-bold tracking-tight whitespace-nowrap">
                  <span className="text-primary">snap</span>
                  <span className="text-accent">SolPay</span>
                </span>
              </Link>
              <div className="hidden sm:ml-10 sm:flex sm:space-x-4">
                {links.map(({ label, path }) => (
                  <Link 
                    key={path}
                    href={path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(path)
                        ? 'bg-gray-50 dark:bg-gray-800 text-primary font-semibold'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <ClusterUiSelect className="hidden md:block" />
              <WalletButton />
              <div className="block sm:hidden">
                <button className="ml-1 p-1.5 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Mobile menu */}
        <div className="sm:hidden border-t border-gray-200 dark:border-gray-800 hidden">
          <div className="px-2 py-3 space-y-1">
            {links.map(({ label, path }) => (
              <Link 
                key={path}
                href={path}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive(path)
                    ? 'bg-gray-50 dark:bg-gray-800 text-primary'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <ClusterChecker>
        <AccountChecker />
      </ClusterChecker>

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="loading-pulse w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
          }
        >
          {children}
        </Suspense>
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            style: {
              background: '#FFFFFF',
              color: '#333333',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              borderRadius: '8px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#42B883',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#FF4B4B',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
      </main>
    </div>
  )
}

export function AppModal({
  children,
  title,
  hide,
  show,
  submit,
  submitDisabled,
  submitLabel,
}: {
  children: ReactNode
  title: string
  hide: () => void
  show: boolean
  submit?: () => void
  submitDisabled?: boolean
  submitLabel?: string
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  useEffect(() => {
    if (!dialogRef.current) return
    if (show) {
      dialogRef.current.showModal()
    } else {
      dialogRef.current.close()
    }
  }, [show, dialogRef])

  return (
    <dialog className="modal modal-bottom sm:modal-middle" ref={dialogRef}>
      <div className="modal-box rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg bg-white dark:bg-gray-900 p-6">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-4 mb-5">{title}</h3>
        <div className="space-y-5">{children}</div>
        <div className="modal-action mt-6 flex justify-end gap-3">
          <button onClick={hide} className="btn btn-outline rounded-lg px-5 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
            Cancel
          </button>
          {submit ? (
            <button 
              className={`btn rounded-lg px-5 ${submitDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={submit} 
              disabled={submitDisabled}
              style={{
                backgroundColor: submitDisabled ? '#E5E7EB' : '#0A0F25',
                color: submitDisabled ? '#9CA3AF' : 'white',
                border: 'none'
              }}
            >
              {submitLabel || 'Save'}
            </button>
          ) : null}
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={hide}>close</button>
      </form>
    </dialog>
  )
}

export function AppHero({
  children,
  title,
  subtitle,
}: {
  children?: ReactNode
  title: ReactNode
  subtitle: ReactNode
}) {
  return (
    <div className="py-10 md:py-14 text-center max-w-3xl mx-auto">
      <div className="mb-8">
        {typeof title === 'string' ? (
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-4">{title}</h1>
        ) : (
          title
        )}
        {typeof subtitle === 'string' ? (
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">{subtitle}</p>
        ) : (
          subtitle
        )}
      </div>
      {children}
    </div>
  )
}

export function ellipsify(str = '', len = 4) {
  if (str.length > 30) {
    return str.substring(0, len) + '..' + str.substring(str.length - len, str.length)
  }
  return str
}

export function useTransactionToast() {
  return (signature: string) => {
    toast.success(
      <div className="text-center">
        <div className="text-lg font-medium mb-2">Transaction sent</div>
        <ExplorerLink 
          path={`tx/${signature}`} 
          label="View Transaction" 
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-primary-50 text-primary hover:bg-primary-100 transition-colors"
        />
      </div>,
    )
  }
}
