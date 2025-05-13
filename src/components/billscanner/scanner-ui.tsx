'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { ContactAssignment, ItemAssignment } from './contact-assignment'
import { PaymentCheckout } from './payment-checkout'

export function BillPreview({ imageData, onAnalyze, onRetake }: { 
  imageData: string, 
  onAnalyze: () => void, 
  onRetake: () => void 
}) {
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="w-full max-w-md bg-black rounded-lg overflow-hidden">
        <img src={imageData} alt="Uploaded bill" className="w-full h-auto" />
      </div>
      <div className="flex space-x-4">
        <button onClick={onRetake} className="btn btn-outline">
          Upload Different Image
        </button>
        <button onClick={onAnalyze} className="btn btn-primary">
          Analyze Bill
        </button>
      </div>
    </div>
  )
}

// Interface for bill items
interface BillItem {
  id: number;
  name: string;
  price: string;
  priceValue: number;
  selected: boolean;
}

// Component for the interactive items table
function ItemsTable({ items, onItemToggle, onAssignItems, onAddItem }: { 
  items: BillItem[],
  onItemToggle: (id: number) => void,
  onAssignItems: () => void,
  onAddItem: (name: string, price: string) => void
}) {
  const [selectAll, setSelectAll] = useState(false)
  const selectedCount = items.filter(item => item.selected).length
  const [showAddItem, setShowAddItem] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [newItemPrice, setNewItemPrice] = useState('')

  const toggleSelectAll = () => {
    const newState = !selectAll
    setSelectAll(newState)
    items.forEach(item => onItemToggle(item.id))
  }

  // Calculate total of selected items
  const selectedTotal = items
    .filter(item => item.selected)
    .reduce((sum, item) => sum + item.priceValue, 0)
    .toFixed(2)

  const handleAddItem = () => {
    if (!newItemName.trim() || !newItemPrice.trim()) {
      toast.error('Please enter both item name and price')
      return
    }

    // Validate price format
    const priceValue = parseFloat(newItemPrice.replace(/[$€]/, ''))
    if (isNaN(priceValue) || priceValue <= 0) {
      toast.error('Please enter a valid price (e.g., 10.99)')
      return
    }

    onAddItem(newItemName, `$${priceValue.toFixed(2)}`)
    setNewItemName('')
    setNewItemPrice('')
    setShowAddItem(false)
    toast.success('Item added successfully')
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-xl font-bold">Items in Bill</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm">
            {selectedCount > 0 ? `${selectedCount} item${selectedCount > 1 ? 's' : ''} selected` : 'No items selected'}
          </span>
          <label className="cursor-pointer label">
            <input 
              type="checkbox" 
              checked={selectAll} 
              onChange={toggleSelectAll} 
              className="checkbox checkbox-primary checkbox-sm" 
            />
          </label>
        </div>
      </div>

      {/* Add item form */}
      <div className="mb-4">
        <button 
          onClick={() => setShowAddItem(!showAddItem)} 
          className="btn btn-sm btn-outline mb-2"
        >
          {showAddItem ? 'Cancel' : '+ Add Missing Item'}
        </button>
        
        {showAddItem && (
          <div className="bg-base-100 p-3 rounded-lg border border-base-300">
            <div className="flex flex-col md:flex-row gap-2 mb-2">
              <input 
                type="text" 
                placeholder="Item name" 
                className="input input-bordered flex-grow"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
              <input 
                type="text" 
                placeholder="Price (e.g., 10.99)" 
                className="input input-bordered w-full md:w-32"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
              />
              <button 
                onClick={handleAddItem} 
                className="btn btn-primary"
              >
                Add
              </button>
            </div>
            <p className="text-xs opacity-70">
              Add items that weren't detected automatically from the bill
            </p>
          </div>
        )}
      </div>
      
      <table className="table w-full border-2 border-base-300">
        <thead>
          <tr>
            <th className="w-12">Select</th>
            <th className="w-auto">Item</th>
            <th className="w-24 text-right">Price</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr 
              key={item.id} 
              className={`cursor-pointer ${item.selected ? 'bg-primary bg-opacity-10' : ''}`}
              onClick={() => onItemToggle(item.id)}
            >
              <td>
                <label className="cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={item.selected} 
                    onChange={() => onItemToggle(item.id)} 
                    className="checkbox checkbox-primary checkbox-sm" 
                    onClick={(e) => e.stopPropagation()}
                  />
                </label>
              </td>
              <td>{item.name}</td>
              <td className="text-right font-mono">{item.price}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={3} className="text-center py-4">No items found in the bill</td>
            </tr>
          )}
        </tbody>
        {selectedCount > 0 && (
          <tfoot>
            <tr className="font-bold">
              <td colSpan={2} className="text-right">Selected Total:</td>
              <td className="text-right font-mono">${selectedTotal}</td>
            </tr>
          </tfoot>
        )}
      </table>
      
      {selectedCount > 0 && (
        <div className="mt-4 flex justify-end">
          <button 
            onClick={onAssignItems} 
            className="btn btn-primary btn-sm"
          >
            Assign to Contacts
          </button>
        </div>
      )}
    </div>
  )
}

export function AnalysisResult({ analysis, onNewScan }: { 
  analysis: string | null, 
  onNewScan: () => void 
}) {
  const [copied, setCopied] = useState(false)
  const [billItems, setBillItems] = useState<BillItem[]>([])
  const [showItemAssignment, setShowItemAssignment] = useState(false)
  const [showPaymentCheckout, setShowPaymentCheckout] = useState(false)
  const [savedAssignments, setSavedAssignments] = useState<ItemAssignment[]>([])
  const [nextItemId, setNextItemId] = useState(1000) // Start IDs for manually added items at 1000
  const [showDebugInfo, setShowDebugInfo] = useState(false)

  // Extract items with prices from the analysis text
  useEffect(() => {
    if (!analysis) return
    
    console.log("Starting bill analysis...")
    
    // Pattern to match item: price format (e.g., "Coffee: $3.50" or "Sandwich - $8.99")
    const lines = analysis.split('\n')
    const extractedItems: BillItem[] = []
    
    // First pass: Look for structured items like "Item: $price" or "Item - $price"
    console.log(`Processing ${lines.length} lines from analysis`)
    
    lines.forEach((line, index) => {
      if (line.trim() === '') return // Skip empty lines
      
      // Debug the line being processed
      console.log(`Processing line ${index}: ${line.trim().substring(0, 50)}${line.length > 50 ? '...' : ''}`)
      
      // Look for various price patterns:
      // 1. $ followed by number: $3.50
      // 2. Number followed by $: 3.50$
      // 3. € followed by number: €3.50
      // 4. Number followed by €: 3.50€
      // 5. USD format: USD 3.50 or 3.50 USD
      // 6. Plain numbers at the end of a line that look like prices: Coffee 3.50
      let priceMatch = line.match(/(?::|-)?\s*\$\s*(\d+(?:\.\d{1,2})?)/) || 
                       line.match(/(?::|-)?\s*(\d+(?:\.\d{1,2})?)\s*\$/) ||
                       line.match(/(?::|-)?\s*€\s*(\d+(?:\.\d{1,2})?)/) ||
                       line.match(/(?::|-)?\s*(\d+(?:\.\d{1,2})?)\s*€/) ||
                       line.match(/(?::|-)?\s*USD\s*(\d+(?:\.\d{1,2})?)/) ||
                       line.match(/(?::|-)?\s*(\d+(?:\.\d{1,2})?)\s*USD/)
      
      // If no match found, look for numbers at the end of a line that might be prices
      if (!priceMatch && /\d+\.\d{2}$/.test(line.trim())) {
        priceMatch = line.trim().match(/(\d+\.\d{2})$/)
      }
      
      if (priceMatch) {
        console.log(`  Found price match: ${priceMatch[0]}`)
        
        let name = line
        let price = priceMatch[0].trim()
        
        // Extract name based on various common formats
        
        // Format 1: "Item: $price"
        if (line.includes(':')) {
          const parts = line.split(':')
          name = parts[0].trim()
          if (parts[1].includes('$') || parts[1].includes('€') || parts[1].includes('USD') || /\d+\.\d{2}$/.test(parts[1].trim())) {
            price = parts[1].trim()
          }
          console.log(`  Format 1 - Name: ${name}, Price: ${price}`)
        } 
        // Format 2: "Item - $price" or "Item — $price" (em dash)
        else if (line.includes(' - ') || line.includes(' — ')) {
          const separator = line.includes(' - ') ? ' - ' : ' — '
          const parts = line.split(separator)
          name = parts[0].trim()
          if (parts.length > 1 && (parts[1].includes('$') || parts[1].includes('€') || parts[1].includes('USD') || /\d+\.\d{2}$/.test(parts[1].trim()))) {
            price = parts[1].trim()
          }
          console.log(`  Format 2 - Name: ${name}, Price: ${price}`)
        } 
        // Format 3: "Item................$price" (dots or spaces then price)
        else if (line.match(/.*?[\.…\s]{2,}\s*[\$€]?\d+\.\d{2}/)) {
          // Find the last sequence of dots, spaces, or other separators
          const separatorMatch = line.match(/(.*?)[\.…\s]{2,}\s*([\$€]?\d+\.\d{2}.*)/)
          if (separatorMatch) {
            name = separatorMatch[1].trim()
            price = separatorMatch[2].trim()
            console.log(`  Format 3 - Name: ${name}, Price: ${price}`)
          }
        }
        // Format 4: "Item $price" (price at the end)
        else if (line.match(/.*\s+[\$€]?\d+\.\d{2}(\s|$)/)) {
          // Find the last whitespace before the price
          const priceIndex = line.lastIndexOf(priceMatch[0])
          if (priceIndex > 0) {
            // Look for the last space before the price
            const lastSpaceBeforePrice = line.lastIndexOf(' ', priceIndex - 1)
            if (lastSpaceBeforePrice > 0) {
              name = line.substring(0, lastSpaceBeforePrice).trim()
              price = line.substring(lastSpaceBeforePrice).trim()
              console.log(`  Format 4 - Name: ${name}, Price: ${price}`)
            }
          }
        }
        
        // If we still have the whole line as name, try to extract just the item name
        if (name === line) {
          // If price appears at the end of the line, take everything before it as the name
          const priceIndex = line.lastIndexOf(price)
          if (priceIndex > 0) {
            name = line.substring(0, priceIndex).trim()
            console.log(`  Extracted name before price: ${name}`)
          }
        }
        
        // Ensure we have a usable price value
        // Allow for prices without $ or € prefix
        let priceValue: number;
        const priceValueMatch = price.match(/(\d+(?:\.\d{1,2})?)/)
        if (priceValueMatch) {
          priceValue = parseFloat(priceValueMatch[1])
          
          // If price doesn't have a currency symbol, add $ for display
          if (!price.includes('$') && !price.includes('€') && !price.includes('USD')) {
            price = `$${priceValue.toFixed(2)}`
          }
        } else {
          priceValue = 0
        }
        
        // Remove any quantity indicators from the name (e.g., "2x Coffee" -> "Coffee")
        let quantity = 1
        const quantityMatch = name.match(/^(\d+)\s*[xX]\s*(.*)$/)
        if (quantityMatch) {
          quantity = parseInt(quantityMatch[1])
          name = quantityMatch[2].trim()
          console.log(`  Extracted quantity ${quantity}x from name: ${name}`)
        }
        
        // Clean up name by removing common noise like item numbers
        name = name.replace(/^#\d+\s*/, '').trim()  // Remove item numbers like "#1"
        name = name.replace(/^\d+\.\s*/, '').trim() // Remove numbering like "1."
        
        if (name && price && priceValue > 0 && name !== price) {
          // If quantity is more than 1, show it in the name
          const displayName = quantity > 1 ? `${quantity}x ${name}` : name
          
          extractedItems.push({
            id: index,
            name: displayName,
            price,
            priceValue: priceValue * quantity, // Multiply by quantity for correct total
            selected: false
          })
          console.log(`  Added item: ${displayName} - ${price}`)
        }
      }
    })
    
    // Second pass: Look for tabular data with prices in a grid format
    if (extractedItems.length < 3) { // Only try this if we found few or no items in the first pass
      console.log("Few items found, trying alternative detection methods...")
      
      // Look for price patterns at the end of lines (common in receipt tables)
      lines.forEach((line, index) => {
        if (line.trim() === '' || extractedItems.some(item => item.id === index)) return
        
        // Match patterns like "Coffee                      3.50"
        // Where there's text, then whitespace, then a price
        const tableMatch = line.match(/^(.*?)\s{2,}(\d+\.\d{2})(?:\s|$)/)
        
        if (tableMatch) {
          const name = tableMatch[1].trim()
          const priceValue = parseFloat(tableMatch[2])
          const price = `$${priceValue.toFixed(2)}`
          
          if (name && priceValue > 0) {
            extractedItems.push({
              id: 1000 + index, // Offset ID to avoid conflicts
              name,
              price,
              priceValue,
              selected: false
            })
            console.log(`  Added tabular item: ${name} - ${price}`)
          }
        }
      })
      
      // Look for common item patterns in bills like "1x Coffee.........$3.50"
      lines.forEach((line, index) => {
        if (line.trim() === '' || extractedItems.some(item => item.id === index)) return
        
        // Match patterns like "1x Item" or "2 x Item" followed by a price
        const itemMatch = line.match(/^(\d+)\s*x\s*(.*?)(?:\s|\.{2,})+\$?(\d+(?:\.\d{1,2})?)/)
        
        if (itemMatch) {
          const quantity = parseInt(itemMatch[1])
          const name = itemMatch[2].trim()
          const priceValue = parseFloat(itemMatch[3])
          const price = `$${priceValue.toFixed(2)}`
          
          if (name && priceValue > 0) {
            extractedItems.push({
              id: 2000 + index, // Offset ID to avoid conflicts
              name: quantity > 1 ? `${quantity}x ${name}` : name,
              price,
              priceValue: priceValue * quantity,
              selected: false
            })
            console.log(`  Added quantity item: ${quantity}x ${name} - ${price}`)
          }
        }
      })
    }
    
    console.log(`Total items extracted: ${extractedItems.length}`)
    setBillItems(extractedItems)
    setNextItemId(3000) // Reset next ID for manually added items
    
    // If we still couldn't extract any items, show a toast notification
    if (extractedItems.length === 0) {
      console.log("No items found. Analysis text:", analysis)
      toast.error("No items with prices could be extracted from the bill. Please try a clearer image or manually add items.")
    }
  }, [analysis])

  if (!analysis) {
    return (
      <div className="flex justify-center items-center h-40">
        <span className="loading loading-spinner loading-lg"></span>
        <p className="ml-4">Analyzing your bill...</p>
      </div>
    )
  }

  // Toggle selection of an item
  const toggleItemSelection = (id: number) => {
    setBillItems(items => 
      items.map(item => 
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    )
  }

  // Add a new item manually
  const addItem = (name: string, price: string) => {
    // Extract price value
    const priceValue = parseFloat(price.replace(/[$€]/g, ''))
    
    const newItem: BillItem = {
      id: nextItemId,
      name,
      price,
      priceValue,
      selected: true, // Automatically select manually added items
    }
    
    setBillItems([...billItems, newItem])
    setNextItemId(nextItemId + 1)
  }

  // Handle assignment of items to contacts
  const handleAssignItems = () => {
    const selectedItems = billItems.filter(item => item.selected)
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item to assign')
      return
    }
    setShowItemAssignment(true)
  }

  // Handle saving assignments from the contact assignment component
  const handleSaveAssignments = (assignments: ItemAssignment[]) => {
    setSavedAssignments(assignments)
    setShowItemAssignment(false)
    setShowPaymentCheckout(true) // Show payment checkout after assignments are saved
    
    // Display success message with count of items assigned
    const assignedItemCount = new Set(assignments.map(a => a.itemId)).size
    toast.success(`Assigned ${assignedItemCount} items to contacts!`)
  }

  // Handle completed payments
  const handlePaymentComplete = () => {
    setShowPaymentCheckout(false)
    setSavedAssignments([]) // Reset assignments after payment completion
    toast.success('Bill payment process completed!')
  }

  // Add a debug panel to show when item detection fails
  const renderDebugPanel = () => {
    if (!showDebugInfo || !analysis) return null

    return (
      <div className="w-full max-w-2xl bg-gray-100 rounded-lg p-6 border-2 border-red-300">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-red-600">Debug Information</h3>
          <button 
            onClick={() => setShowDebugInfo(false)} 
            className="btn btn-sm btn-outline"
          >
            Close Debug
          </button>
        </div>
        <div className="bg-gray-200 p-4 rounded overflow-auto max-h-96 whitespace-pre-wrap">
          <code className="text-xs">{analysis}</code>
        </div>
        <p className="mt-4 text-sm text-gray-600">
          This is the raw analysis text from OpenAI. If items aren't being detected properly, 
          please check if they're included in this text and formatted correctly.
        </p>
      </div>
    )
  }

  // Format the analysis for better display
  const formattedAnalysis = analysis
    .split('\n')
    .map((line, i) => {
      // Bold headers
      if (line.endsWith(':') && !line.includes(':') && line.length < 30) {
        return <h4 key={i} className="font-bold mt-3 mb-1">{line}</h4>
      }
      
      // Bold item headers with prices
      if (line.includes(':') && (line.includes('$') || line.includes('€'))) {
        const [item, price] = line.split(':').map(part => part.trim())
        return (
          <div key={i} className="flex justify-between my-1">
            <span className="font-medium">{item}:</span>
            <span className="font-mono">{price}</span>
          </div>
        )
      }
      
      // Handle lists
      if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
        return <li key={i} className="ml-4">{line.trim().substring(1).trim()}</li>
      }
      
      return <p key={i} className="my-1">{line}</p>
    })

  const copyToClipboard = () => {
    navigator.clipboard.writeText(analysis)
    setCopied(true)
    toast.success('Analysis copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  // Modify renderContent to include payment checkout
  const renderContent = () => {
    if (showPaymentCheckout) {
      return (
        <PaymentCheckout 
          items={billItems}
          assignments={savedAssignments}
          onBack={() => setShowPaymentCheckout(false)}
          onComplete={handlePaymentComplete}
        />
      )
    }
    
    if (showItemAssignment) {
      return (
        <ContactAssignment 
          items={billItems} 
          onSave={handleSaveAssignments} 
          onCancel={() => setShowItemAssignment(false)} 
        />
      )
    }

    return (
      <div className="flex flex-col items-center space-y-6">
        {/* Items Table */}
        <div className="w-full max-w-2xl bg-base-200 rounded-lg p-6">
          <ItemsTable 
            items={billItems} 
            onItemToggle={toggleItemSelection} 
            onAssignItems={handleAssignItems}
            onAddItem={addItem}
          />
          
          {/* Show debug toggle if no items were detected */}
          {billItems.length === 0 && (
            <div className="mt-4 text-center">
              <button 
                onClick={() => setShowDebugInfo(!showDebugInfo)} 
                className="btn btn-sm btn-outline btn-error"
              >
                {showDebugInfo ? "Hide Debug Info" : "Show Debug Info"}
              </button>
              <p className="text-sm mt-2 text-gray-500">
                No items were detected. Click above to see the raw analysis text for debugging.
              </p>
            </div>
          )}
        </div>
        
        {/* Debug Panel */}
        {renderDebugPanel()}
        
        {/* Assignment Summary - shown only if we have saved assignments */}
        {savedAssignments.length > 0 && (
          <div className="w-full max-w-2xl bg-primary bg-opacity-10 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-2">Assignment Summary</h3>
            <p>
              {new Set(savedAssignments.map(a => a.itemId)).size} items assigned to {new Set(savedAssignments.map(a => a.contactId)).size} contacts
            </p>
            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => setShowItemAssignment(true)}
                className="btn btn-sm btn-outline"
              >
                Edit Assignments
              </button>
              <button 
                onClick={() => setShowPaymentCheckout(true)}
                className="btn btn-sm btn-primary"
              >
                Proceed to Payment
              </button>
            </div>
          </div>
        )}
        
        {/* Analysis Results */}
        <div className="w-full max-w-2xl bg-base-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Analysis Results</h3>
            <div className="flex gap-2">
              <button 
                onClick={copyToClipboard} 
                className="btn btn-sm btn-outline"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
              {billItems.length > 0 && (
                <button 
                  onClick={() => setShowDebugInfo(!showDebugInfo)} 
                  className="btn btn-sm btn-outline btn-ghost"
                >
                  {showDebugInfo ? "Hide Raw" : "Show Raw"}
                </button>
              )}
            </div>
          </div>
          <div className="divider my-2"></div>
          <div className="prose max-w-none">
            {formattedAnalysis}
          </div>
        </div>
        
        <div className="flex space-x-4">
          <button onClick={onNewScan} className="btn btn-primary">
            Analyze Another Bill
          </button>
        </div>
      </div>
    )
  }

  return renderContent()
} 