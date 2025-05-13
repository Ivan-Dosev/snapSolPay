'use client'

import { useState } from 'react'
import { AppHero } from '../ui/ui-layout'
import { useContacts } from './contacts-context'
import { Contact } from '../billscanner/contact-assignment'
import toast from 'react-hot-toast'

export default function ContactsFeature() {
  const { contacts, addContact, updateContact, deleteContact, isValidSolanaAddress } = useContacts()
  
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContactName, setNewContactName] = useState('')
  const [newContactEmail, setNewContactEmail] = useState('')
  const [newContactPhone, setNewContactPhone] = useState('')
  const [newContactWallet, setNewContactWallet] = useState('')
  
  const [editContactId, setEditContactId] = useState<string | null>(null)
  const [editContactName, setEditContactName] = useState('')
  const [editContactEmail, setEditContactEmail] = useState('')
  const [editContactPhone, setEditContactPhone] = useState('')
  const [editContactWallet, setEditContactWallet] = useState('')
  
  // Avatar emojis for selection
  const avatarOptions = ['👤', '👩‍💼', '👨‍💼', '👩‍🔧', '👨‍🔧', '👩‍⚕️', '👨‍⚕️', '👩‍🚀', '👨‍🚀', '👸', '🤴', '🧙‍♀️', '🧙‍♂️']
  const [selectedAvatar, setSelectedAvatar] = useState(avatarOptions[0])
  const [editAvatar, setEditAvatar] = useState('')

  // Handle adding a new contact
  const handleAddContact = () => {
    if (newContactName.trim()) {
      addContact({
        name: newContactName.trim(),
        email: newContactEmail.trim() || undefined,
        phone: newContactPhone.trim() || undefined,
        walletAddress: newContactWallet.trim() || undefined,
        avatar: selectedAvatar
      })
      
      // Reset form
      setNewContactName('')
      setNewContactEmail('')
      setNewContactPhone('')
      setNewContactWallet('')
      setSelectedAvatar(avatarOptions[0])
      setShowAddContact(false)
    } else {
      toast.error('Contact name is required')
    }
  }

  // Start editing a contact
  const startEditContact = (contact: Contact) => {
    setEditContactId(contact.id)
    setEditContactName(contact.name)
    setEditContactEmail(contact.email || '')
    setEditContactPhone(contact.phone || '')
    setEditContactWallet(contact.walletAddress || '')
    setEditAvatar(contact.avatar || '👤')
  }

  // Save contact edits
  const saveContactEdit = () => {
    if (!editContactId) return
    
    if (!editContactName.trim()) {
      toast.error('Contact name cannot be empty')
      return
    }

    updateContact(editContactId, {
      name: editContactName.trim(),
      email: editContactEmail.trim() || undefined,
      phone: editContactPhone.trim() || undefined,
      walletAddress: editContactWallet.trim() || undefined,
      avatar: editAvatar
    })
    
    setEditContactId(null)
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditContactId(null)
  }

  // Handle deletion with confirmation
  const handleDeleteContact = (id: string) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      deleteContact(id)
    }
  }

  // Render contact card or edit form
  const renderContact = (contact: Contact) => {
    const isEditing = editContactId === contact.id
    
    if (isEditing) {
      return (
        <div key={contact.id} className="border border-primary rounded-lg p-4 bg-base-100">
          <div className="flex flex-col space-y-4">
            <div className="flex justify-center mb-2">
              <div className="avatar">
                <div className="text-4xl">{editAvatar}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-2">
              {avatarOptions.map(avatar => (
                <button
                  key={avatar}
                  className={`btn btn-sm ${avatar === editAvatar ? 'btn-accent' : 'btn-ghost'}`}
                  onClick={() => setEditAvatar(avatar)}
                >
                  {avatar}
                </button>
              ))}
            </div>
            
            <div>
              <label className="text-xs block mb-1">Name</label>
              <input 
                type="text" 
                value={editContactName}
                onChange={(e) => setEditContactName(e.target.value)}
                className="input input-bordered w-full"
              />
            </div>
            
            <div>
              <label className="text-xs block mb-1">Email (optional)</label>
              <input 
                type="email" 
                value={editContactEmail}
                onChange={(e) => setEditContactEmail(e.target.value)}
                className="input input-bordered w-full"
                placeholder="email@example.com"
              />
            </div>
            
            <div>
              <label className="text-xs block mb-1">Phone (optional)</label>
              <input 
                type="tel" 
                value={editContactPhone}
                onChange={(e) => setEditContactPhone(e.target.value)}
                className="input input-bordered w-full"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            
            <div>
              <label className="text-xs block mb-1">Wallet Address</label>
              <input 
                type="text" 
                value={editContactWallet}
                onChange={(e) => setEditContactWallet(e.target.value)}
                placeholder="Solana wallet address"
                className="input input-bordered w-full font-mono text-xs"
              />
              <p className="text-xs mt-1 text-gray-500">Enter the Solana wallet address for payments</p>
            </div>
            
            <div className="flex justify-between mt-4">
              <button 
                onClick={() => handleDeleteContact(contact.id)} 
                className="btn btn-error btn-sm"
              >
                Delete
              </button>
              <div className="space-x-2">
                <button onClick={cancelEdit} className="btn btn-ghost btn-sm">
                  Cancel
                </button>
                <button onClick={saveContactEdit} className="btn btn-primary btn-sm">
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }
    
    return (
      <div 
        key={contact.id} 
        className="flex flex-col items-center border border-base-300 rounded-lg p-4 bg-base-100"
      >
        <div className="text-4xl mb-2">{contact.avatar}</div>
        <div className="font-bold text-lg text-center">{contact.name}</div>
        
        {contact.email && (
          <div className="text-sm mt-1">{contact.email}</div>
        )}
        
        {contact.phone && (
          <div className="text-sm mt-1">{contact.phone}</div>
        )}
        
        {contact.walletAddress && (
          <div className="text-xs mt-2 font-mono w-full overflow-hidden text-ellipsis text-center" title={contact.walletAddress}>
            {contact.walletAddress.substring(0, 4)}...{contact.walletAddress.substring(contact.walletAddress.length - 4)}
          </div>
        )}
        
        {!contact.walletAddress && (
          <div className="text-xs mt-2 text-gray-400 italic">No wallet address</div>
        )}
        
        <div className="flex justify-center gap-2 mt-4 w-full">
          <button 
            onClick={() => startEditContact(contact)} 
            className="btn btn-sm btn-outline"
          >
            Edit
          </button>
          <button 
            onClick={() => handleDeleteContact(contact.id)} 
            className="btn btn-sm btn-outline btn-error"
          >
            Delete
          </button>
        </div>
      </div>
    )
  }

  // Render the add contact form
  const renderAddContactForm = () => {
    return (
      <div className="bg-base-100 p-6 rounded-lg border border-base-300 mb-8">
        <h3 className="text-xl font-bold mb-4">Add New Contact</h3>
        
        <div className="flex flex-col space-y-4">
          <div className="flex justify-center mb-2">
            <div className="avatar">
              <div className="text-4xl">{selectedAvatar}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
            {avatarOptions.map(avatar => (
              <button
                key={avatar}
                className={`btn btn-sm ${avatar === selectedAvatar ? 'btn-accent' : 'btn-ghost'}`}
                onClick={() => setSelectedAvatar(avatar)}
              >
                {avatar}
              </button>
            ))}
          </div>
          
          <div>
            <label className="text-xs block mb-1">Name</label>
            <input 
              type="text" 
              placeholder="Enter contact name" 
              className="input input-bordered w-full"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-xs block mb-1">Email (optional)</label>
            <input 
              type="email" 
              placeholder="email@example.com" 
              className="input input-bordered w-full"
              value={newContactEmail}
              onChange={(e) => setNewContactEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-xs block mb-1">Phone (optional)</label>
            <input 
              type="tel" 
              placeholder="+1 (555) 123-4567" 
              className="input input-bordered w-full"
              value={newContactPhone}
              onChange={(e) => setNewContactPhone(e.target.value)}
            />
          </div>
          
          <div>
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
          
          <div className="flex justify-end gap-2 mt-4">
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
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <AppHero 
        title="Contact Management" 
        subtitle="Manage your contacts and their wallet addresses for bill splitting"
      >
        <div className="mt-4">
          <button 
            onClick={() => setShowAddContact(!showAddContact)} 
            className="btn btn-primary"
            disabled={editContactId !== null}
          >
            {showAddContact ? 'Cancel' : '+ Add New Contact'}
          </button>
        </div>
      </AppHero>

      {showAddContact && renderAddContactForm()}

      {contacts.length === 0 && !showAddContact ? (
        <div className="text-center p-8 bg-base-200 rounded-lg">
          <h3 className="text-xl font-bold mb-2">No Contacts Yet</h3>
          <p className="mb-4">You haven't added any contacts yet. Add a contact to get started!</p>
          <button 
            onClick={() => setShowAddContact(true)} 
            className="btn btn-primary"
          >
            + Add New Contact
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {contacts.map(contact => renderContact(contact))}
        </div>
      )}
    </div>
  )
} 