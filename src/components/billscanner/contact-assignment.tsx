'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useContacts } from '../contacts/contacts-context'

// Interface for bill items
export interface BillItem {
  id: number;
  name: string;
  price: string;
  priceValue: number;
  selected: boolean;
}

// Interface for contact
export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  walletAddress?: string; // Added field for Solana wallet address
}

// Interface for item assignment
export interface ItemAssignment {
  itemId: number;
  contactId: string;
}

interface ContactAssignmentProps {
  items: BillItem[];
  onSave: (assignments: ItemAssignment[]) => void;
  onCancel: () => void;
}

export function ContactAssignment({ items, onSave, onCancel }: ContactAssignmentProps) {
  // Use the centralized contacts context instead of local state
  const { contacts, addContact, isValidSolanaAddress } = useContacts()
  
  const [assignments, setAssignments] = useState<ItemAssignment[]>([])
  const [newContactName, setNewContactName] = useState('')
  const [newContactWallet, setNewContactWallet] = useState('')
  const [showAddContact, setShowAddContact] = useState(false)
  
  // Filter only selected items
  const selectedItems = items.filter(item => item.selected)
  
  // Calculate totals per contact
  const contactTotals = contacts.map(contact => {
    const contactAssignments = assignments.filter(a => a.contactId === contact.id)
    const total = contactAssignments.reduce((sum, assignment) => {
      const item = items.find(i => i.id === assignment.itemId)
      return sum + (item?.priceValue || 0)
    }, 0)
    
    return {
      contactId: contact.id,
      total,
      itemCount: contactAssignments.length
    }
  })

  // Add a new contact
  const handleAddContact = () => {
    if (!newContactName.trim()) {
      toast.error('Contact name is required')
      return
    }
    
    // Check if wallet address is valid
    if (newContactWallet.trim() && !isValidSolanaAddress(newContactWallet.trim())) {
      toast.error('Invalid Solana wallet address format')
      return
    }
    
    const success = addContact({
      name: newContactName.trim(),
      avatar: '👤',
      walletAddress: newContactWallet.trim() || undefined
    })
    
    if (success) {
      // Clear form and hide it
      setNewContactName('')
      setNewContactWallet('')
      setShowAddContact(false)
      
      // Log for debugging
      console.log('[snapSolPay] Contact added successfully')
    } else {
      console.error('[snapSolPay] Failed to add contact')
    }
  }

  // Assign item to contact
  const assignItemToContact = (itemId: number, contactId: string) => {
    // Remove any existing assignment for this item
    const filteredAssignments = assignments.filter(a => a.itemId !== itemId)
    
    // Add the new assignment
    setAssignments([...filteredAssignments, { itemId, contactId }])
  }

  // Check if an item is assigned to a contact
  const isItemAssignedToContact = (itemId: number, contactId: string) => {
    return assignments.some(a => a.itemId === itemId && a.contactId === contactId)
  }

  // Get contact name for an item
  const getContactForItem = (itemId: number) => {
    const assignment = assignments.find(a => a.itemId === itemId)
    if (!assignment) return null
    
    const contact = contacts.find(c => c.id === assignment.contactId)
    return contact
  }

  // Save all assignments
  const handleSaveAssignments = () => {
    if (assignments.length === 0) {
      toast.error('No items have been assigned yet')
      return
    }
    
    onSave(assignments)
    toast.success('Assignments saved!')
  }

  // Render contact card
  const renderContact = (contact: Contact) => {
    const total = contactTotals.find(c => c.contactId === contact.id)
    
    return (
      <div 
        key={contact.id} 
        className="flex flex-col items-center border border-base-300 rounded-lg p-3 bg-base-100"
      >
        <div className="text-2xl mb-1">{contact.avatar}</div>
        <div className="font-medium text-center">{contact.name}</div>
        
        {contact.walletAddress && (
          <div className="text-xs mt-1 font-mono w-full overflow-hidden text-ellipsis text-center" title={contact.walletAddress}>
            {contact.walletAddress.substring(0, 4)}...{contact.walletAddress.substring(contact.walletAddress.length - 4)}
          </div>
        )}
        
        {!contact.walletAddress && (
          <div className="text-xs mt-1 text-gray-400 italic">No wallet</div>
        )}
        
        {total?.itemCount ? (
          <div className="text-sm mt-1">
            Items: {total.itemCount}
          </div>
        ) : null}
        
        {total?.total ? (
          <div className="text-sm font-mono">
            ${total.total.toFixed(2)}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-base-200 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Assign Items to Contacts</h2>
      
      {/* Contacts List */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold">Contacts</h3>
          <button 
            onClick={() => setShowAddContact(!showAddContact)} 
            className="btn btn-sm btn-outline"
          >
            {showAddContact ? 'Cancel' : '+ Add Contact'}
          </button>
        </div>
        
        {showAddContact && (
          <div className="bg-base-100 p-4 rounded-lg border border-base-300 mb-4">
            <div className="mb-2">
              <label className="text-xs block mb-1">Name</label>
              <input 
                type="text" 
                placeholder="Enter contact name" 
                className="input input-bordered w-full"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="text-xs block mb-1">Wallet Address</label>
              <input 
                type="text" 
                placeholder="Solana wallet address" 
                className="input input-bordered w-full font-mono"
                value={newContactWallet}
                onChange={(e) => setNewContactWallet(e.target.value)}
              />
              <p className="text-xs mt-1 text-gray-500">Enter the Solana wallet address for receiving payments</p>
            </div>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowAddContact(false)} 
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddContact} 
                className="btn btn-primary"
                disabled={!newContactName.trim()}
              >
                Add Contact
              </button>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {contacts.map(contact => renderContact(contact))}
        </div>
        
        <div className="text-center">
          <a href="/contacts" target="_blank" className="link link-primary">
            Manage Contacts
          </a>
        </div>
      </div>
      
      {/* Selected Items */}
      <div>
        <h3 className="text-lg font-bold mb-2">Selected Items</h3>
        {selectedItems.length === 0 ? (
          <div className="text-center py-4 bg-base-100 rounded-lg">
            No items selected. Please go back and select items to assign.
          </div>
        ) : (
          <table className="table w-full border-2 border-base-300">
            <thead>
              <tr>
                <th>Item</th>
                <th className="text-right">Price</th>
                <th>Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {selectedItems.map(item => {
                const assignedContact = getContactForItem(item.id)
                
                return (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td className="text-right font-mono">{item.price}</td>
                    <td>
                      <div className="relative w-full">
                        <select 
                          className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm text-black"
                          value={assignedContact?.id || ''}
                          onChange={(e) => assignItemToContact(item.id, e.target.value)}
                        >
                          <option value="" style={{ color: '#6B7280' }}>Select a contact</option>
                          {contacts.map(contact => (
                            <option 
                              key={contact.id} 
                              value={contact.id} 
                              style={{ color: '#1F2937' }}
                            >
                              {contact.name} {contact.walletAddress ? '(has wallet)' : ''}
                            </option>
                          ))}
                        </select>
                        {assignedContact && (
                          <div className="absolute inset-y-0 right-8 flex items-center pointer-events-none">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="mt-6 flex justify-end space-x-2">
        <button onClick={onCancel} className="btn btn-outline">
          Back
        </button>
        <button 
          onClick={handleSaveAssignments}
          disabled={assignments.length === 0 || selectedItems.length === 0}
          className="btn btn-primary"
        >
          Save Assignments
        </button>
      </div>
    </div>
  )
} 