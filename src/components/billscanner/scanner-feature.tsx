'use client'

import { useState } from 'react'
import { AppHero } from '../ui/ui-layout'
import { BillPreview, AnalysisResult } from './scanner-ui'
import { FileUpload } from './file-upload'
import toast from 'react-hot-toast'

// Define the different states of the scanning process
enum ScanState {
  INITIAL = 'initial',
  PREVIEW = 'preview',
  ANALYZING = 'analyzing',
  RESULTS = 'results',
  ERROR = 'error',
}

export default function ScannerFeature() {
  const [scanState, setScanState] = useState<ScanState>(ScanState.INITIAL)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Handle image capture from file upload
  const handleImageCapture = (imageData: string) => {
    setCapturedImage(imageData)
    setScanState(ScanState.PREVIEW)
    setError(null)
  }

  // Reset to initial state
  const handleRetake = () => {
    setCapturedImage(null)
    setAnalysis(null)
    setError(null)
    setScanState(ScanState.INITIAL)
  }

  // Start the analysis process
  const handleAnalyze = async () => {
    if (!capturedImage) return

    setScanState(ScanState.ANALYZING)
    setIsAnalyzing(true)
    setError(null)
    
    try {
      toast.loading('Analyzing your bill with AI...', { id: 'analyze-toast' })
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out after 45 seconds')), 45000);
      });
      
      // Call the API to analyze the bill with a timeout race
      const fetchPromise = fetch('/api/analyze-bill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: capturedImage }),
      });
      
      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error || 'Failed to analyze the bill';
        console.error('API error response:', errorData);
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setAnalysis(data.analysis)
      setScanState(ScanState.RESULTS)
      toast.success('Analysis complete!', { id: 'analyze-toast' })
    } catch (error: any) {
      console.error('Error analyzing bill:', error)
      
      // Set more descriptive error message based on the error type
      let errorMessage = 'Failed to analyze the bill. Please try again.';
      
      if (error.message.includes('timed out')) {
        errorMessage = 'The request took too long to complete. Try with a smaller or clearer image.';
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('OpenAI API Error')) {
        errorMessage = 'Error communicating with the AI service. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage)
      setScanState(ScanState.ERROR)
      toast.error('Analysis failed: ' + errorMessage, { id: 'analyze-toast' })
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Retry analysis with the same image
  const handleRetry = () => {
    if (capturedImage) {
      setScanState(ScanState.PREVIEW)
      setError(null)
    } else {
      handleRetake()
    }
  }

  return (
    <div className="container mx-auto px-4 pb-16">
      <AppHero 
        title="snapSolPay"
        subtitle="Analyze your receipts and bills instantly with our Solana-powered AI scanner"
      >
        <p className="text-sm opacity-70 mb-6">
          Powered by Solana network 
        </p>
      </AppHero>

      <div className="max-w-4xl mx-auto p-4">
        {scanState === ScanState.INITIAL && (
          <FileUpload onImageCapture={handleImageCapture} />
        )}
        
        {scanState === ScanState.PREVIEW && capturedImage && (
          <BillPreview 
            imageData={capturedImage} 
            onAnalyze={handleAnalyze} 
            onRetake={handleRetake} 
          />
        )}
        
        {scanState === ScanState.ANALYZING && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <span className="loading loading-spinner loading-lg mb-4"></span>
            <h3 className="text-xl font-bold">Analyzing your bill now...</h3>
            <p className="text-sm opacity-70 mt-2">This may take up to 15-30 seconds</p>
          </div>
        )}
        
        {scanState === ScanState.RESULTS && analysis && (
          <AnalysisResult analysis={analysis} onNewScan={handleRetake} />
        )}

        {scanState === ScanState.ERROR && (
          <div className="flex flex-col items-center space-y-4 p-6 bg-error/10 border border-error rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h3 className="text-xl font-bold">Analysis Failed</h3>
            <p className="text-center">{error || 'There was an error analyzing your bill. Please try again.'}</p>
            <div className="flex space-x-4 mt-4">
              <button onClick={handleRetry} className="btn btn-primary">
                Try Again
              </button>
              <button onClick={handleRetake} className="btn btn-outline">
                Upload New Image
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 