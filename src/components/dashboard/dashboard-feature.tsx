"use client";

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default function DashboardFeature() {
  const router = useRouter()

  return (
    <div className="w-full overflow-hidden">
      {/* Hero Section with consistent gradient background */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-primary-900 pt-20 pb-28 md:pt-28 md:pb-36">
        {/* Background elements with matched colors */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute -left-10 top-10 w-72 h-72 rounded-full bg-accent opacity-10 blur-3xl"></div>
          <div className="absolute -right-20 bottom-10 w-96 h-96 rounded-full bg-secondary opacity-10 blur-3xl"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6">
            Split bills. <span className="text-secondary-light">Pay later.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10">
            Analyze your receipts and bills instantly with our Solana-powered AI scanner.
            Split costs and pay in installments.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => router.push('/scanner')} 
              className="bg-white text-primary font-medium px-8 py-3 rounded-lg shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 8v12h20V8M1 4h22"></path>
                <path d="M7 8v2M12 8v2M17 8v2"></path>
              </svg>
              Scan Your Bill
            </button>
            <button 
              onClick={() => router.push('/collateral')}
              className="bg-secondary text-black font-medium px-8 py-3 rounded-lg shadow-md hover:shadow-lg hover:bg-secondary-light transition-all duration-200"
            >
              Create Collateral
            </button>
          </div>
          
          {/* Updated Features Table with new CSS classes */}
          <div className="hero-features-container">
            <div className="hero-features-card">
              <div className="hero-features-grid">
                <div className="hero-feature-item">
                  <div className="hero-feature-icon" style={{ backgroundColor: 'rgba(79, 70, 229, 0.2)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                      <line x1="9" y1="9" x2="9.01" y2="9"></line>
                      <line x1="15" y1="9" x2="15.01" y2="9"></line>
                    </svg>
                  </div>
                  <div className="hero-feature-content">
                    <h3>AI-Powered</h3>
                    <p>Smart learning system adapts to your bill paying habits</p>
                  </div>
                </div>

                <div className="hero-feature-item">
                  <div className="hero-feature-icon" style={{ backgroundColor: 'rgba(249, 174, 77, 0.2)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                      <path d="M7 15h0M2 9.5h20"></path>
                    </svg>
                  </div>
                  <div className="hero-feature-content">
                    <h3>Pay Later</h3>
                    <p>Split your bills into manageable installments</p>
                  </div>
                </div>

                <div className="hero-feature-item">
                  <div className="hero-feature-icon" style={{ backgroundColor: 'rgba(10, 15, 37, 0.3)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                    </svg>
                  </div>
                  <div className="hero-feature-content">
                    <h3>Solana Powered</h3>
                    <p>Fast, secure transactions with minimal fees</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">How snapSolPay Works</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              A simple way to handle your bills and payments with the power of AI and blockchain
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <path d="M20.4 14.5L16 10 4 20"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Scan Your Bill</h3>
              <p className="text-gray-600">
                Upload a photo of your receipt or bill and let our AI extract all the details for you
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-secondary-50 rounded-lg flex items-center justify-center mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
                  <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
                  <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Split Expenses</h3>
              <p className="text-gray-600">
                Easily split the bill with friends or family and manage who owes what amount
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-accent-50 rounded-lg flex items-center justify-center mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                  <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Pay Later</h3>
              <p className="text-gray-600">
                Create a collateral pool or use an existing one to defer payments and repay when convenient
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Why Choose snapSolPay?</h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Fast & Accurate</h3>
                      <p className="text-gray-600">Our AI analyzes receipts in seconds with high accuracy to save you time</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Low Fees</h3>
                      <p className="text-gray-600">Using Solana blockchain ensures minimal transaction fees for payments</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Secure & Private</h3>
                      <p className="text-gray-600">Your data is encrypted and your privacy is protected at every step</p>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => router.push('/scanner')} 
                  className="mt-8 bg-primary text-white font-medium px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Get Started Now
                </button>
              </div>
              
              <div className="hidden md:block relative">
                <div className="absolute -left-4 -top-4 w-24 h-24 bg-accent-100 rounded-full"></div>
                <div className="klarna-card relative z-10 p-8">
                  <div className="relative z-10">
                    <div className="font-bold text-white text-xl mb-6">Instant Bill Analysis</div>
                    <div className="space-y-3">
                      <div className="bg-white bg-opacity-10 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <div className="text-white">Coffee Shop</div>
                          <div className="text-white font-medium">$12.95</div>
                        </div>
                      </div>
                      <div className="bg-white bg-opacity-10 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <div className="text-white">Grocery Store</div>
                          <div className="text-white font-medium">$87.33</div>
                        </div>
                      </div>
                      <div className="bg-white bg-opacity-10 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <div className="text-white">Restaurant</div>
                          <div className="text-white font-medium">$65.00</div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white border-opacity-20">
                      <div className="flex justify-between items-center">
                        <div className="text-white opacity-70">Total</div>
                        <div className="text-white font-bold text-xl">$165.28</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to simplify your bill payments?</h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
            Join thousands of users who are already enjoying the benefits of snapSolPay
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => router.push('/scanner')} 
              className="bg-white text-primary font-medium px-8 py-3 rounded-lg shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all duration-200"
            >
              Scan Your First Bill
            </button>
            <Link 
              href="/clusters"
              className="bg-secondary text-black font-medium px-8 py-3 rounded-lg shadow-md hover:shadow-lg hover:bg-secondary-light transition-all duration-200"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
