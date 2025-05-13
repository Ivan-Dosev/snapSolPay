import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Use a higher timeout for API calls
export const maxDuration = 60; // 60 seconds timeout

export async function POST(request: Request) {
  try {
    const { image } = await request.json()
    
    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      )
    }

    // Check if the image is base64
    if (!image.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid image format. Expected base64 encoded image.' },
        { status: 400 }
      )
    }

    // Add a controller for timeout handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 seconds timeout

    try {
      // Call OpenAI's vision model to analyze the bill
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a receipt and bill analysis assistant. Extract and organize information from the provided bill image.

Please follow this structured format in your response:

MERCHANT: [merchant name]
DATE: [date of purchase]
TOTAL: [total amount with currency symbol, e.g., $24.99]

ITEMS:
- [item name]: [price with currency symbol]
- [item name]: [price with currency symbol]
(List all individual items with their prices in this "Item: $Price" format)

TAXES: [tax amount]
TIP: [tip amount if applicable]

ADDITIONAL INFO:
[Add any other relevant information like receipt number, payment method, etc.]

SUMMARY:
[Provide a brief summary with insights about the bill]

If you can't clearly read something, indicate that with [unclear]. It's critical that all items with prices are listed in the "Item: $Price" format for easy parsing.`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Please analyze this bill/receipt image and extract all relevant information:" },
              { type: "image_url", image_url: { url: image } }
            ]
          }
        ],
        max_tokens: 1000,
      })

      // Clear the timeout since the request completed
      clearTimeout(timeoutId)

      // Extract the analysis from the response
      const analysis = response.choices[0].message.content

      console.log('Analysis completed successfully')

      return NextResponse.json({
        success: true,
        analysis,
      })
    } catch (apiError: any) {
      clearTimeout(timeoutId)
      
      // Check if it's an abort error (timeout)
      if (apiError.name === 'AbortError') {
        console.error('OpenAI API timeout')
        return NextResponse.json(
          { error: 'Request timed out. Please try with a smaller image or try again later.' },
          { status: 504 }
        )
      }
      
      console.error('OpenAI API Error:', apiError)
      return NextResponse.json(
        { error: `OpenAI API Error: ${apiError.message || 'Unknown error'}` },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error processing image:', error)
    return NextResponse.json(
      { error: `Failed to analyze the image: ${error.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
} 