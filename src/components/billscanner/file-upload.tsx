'use client'

import { useRef, useState } from 'react'
import toast from 'react-hot-toast'

export function FileUpload({ onImageCapture }: { onImageCapture: (imageData: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    processFile(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const processFile = (file: File) => {
    setIsLoading(true)

    // Check if the file is an image
    if (!file.type.match('image.*')) {
      toast.error('Please select an image file')
      setIsLoading(false)
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Please select a smaller image (max 5MB)')
      setIsLoading(false)
      return
    }

    const reader = new FileReader()
    
    reader.onload = (e) => {
      const imageData = e.target?.result as string
      
      // For larger images on desktop: compress before sending
      if (file.size > 1 * 1024 * 1024) { // If larger than 1MB
        compressImage(imageData, (compressedData) => {
          onImageCapture(compressedData)
          setIsLoading(false)
        })
      } else {
        onImageCapture(imageData)
        setIsLoading(false)
      }
    }

    reader.onerror = () => {
      toast.error('Error reading file')
      setIsLoading(false)
    }

    reader.readAsDataURL(file)
  }

  // Function to compress large images
  const compressImage = (base64Img: string, callback: (compressedBase64: string) => void) => {
    const img = new Image()
    img.src = base64Img
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Calculate scaled dimensions (max 1000px wide/tall)
      let width = img.width
      let height = img.height
      const maxDimension = 1000
      
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }
      
      // Set canvas dimensions and draw scaled image
      canvas.width = width
      canvas.height = height
      ctx?.drawImage(img, 0, 0, width, height)
      
      // Get compressed image data
      const compressedData = canvas.toDataURL('image/jpeg', 0.7) // 70% quality JPEG
      callback(compressedData)
    }
    img.onerror = () => {
      toast.error('Error compressing image')
      callback(base64Img) // Return original if compression fails
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div 
      className={`flex flex-col items-center space-y-6 p-8 border-2 ${dragActive ? 'border-primary bg-primary/5' : 'border-dashed border-base-300'} rounded-lg cursor-pointer`}
      onClick={triggerFileInput}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="text-center">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-16 h-16 mx-auto text-primary mb-4" 
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"></path>
          <line x1="16" y1="5" x2="22" y2="5"></line>
          <line x1="19" y1="2" x2="19" y2="8"></line>
          <circle cx="9" cy="9" r="2"></circle>
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
        </svg>
        
        <h3 className="text-2xl font-semibold mb-2">Upload Bill Image</h3>
        <p className="text-center max-w-md mb-4">
          Drag and drop a photo of your bill here, or click to select a file from your device
        </p>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      <button
        onClick={(e) => {
          e.stopPropagation()
          triggerFileInput()
        }}
        disabled={isLoading}
        className="btn btn-primary btn-lg"
      >
        {isLoading ? (
          <>
            <span className="loading loading-spinner loading-sm mr-2"></span>
            Processing...
          </>
        ) : (
          'Select Image'
        )}
      </button>
      
      <p className="text-sm text-center opacity-70">
        Accepted formats: JPG, PNG, HEIC • Max size: 5MB
      </p>
    </div>
  )
} 