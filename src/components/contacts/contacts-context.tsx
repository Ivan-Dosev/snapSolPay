'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Contact } from '../billscanner/contact-assignment'
import toast from 'react-hot-toast'

interface ContactsContextType {
  contacts: Contact[]
  addContact: (contact: Omit<Contact, 'id'>) => boolean
  updateContact: (id: string, contact: Partial<Contact>) => boolean
  deleteContact: (id: string) => boolean
  isValidSolanaAddress: (address: string) => boolean
}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined)

// Storage key for contacts
const STORAGE_KEY = 'snapSolPay_contacts'

// Utility functions for localStorage operations
const saveToLocalStorage = (data: Contact[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      console.log(`Saved ${data.length} contacts to localStorage`);
      return true
    } catch (e) {
      console.error('Failed to save contacts to localStorage', e)
      return false
    }
  }
  return false
}

const loadFromLocalStorage = (): Contact[] => {
  if (typeof window !== 'undefined') {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log(`Loaded ${parsedData.length} contacts from localStorage`);
        return parsedData;
      }
    } catch (e) {
      console.error('Failed to load contacts from localStorage', e)
    }
  }
  console.log('No contacts found in localStorage or not running in browser');
  return []
}

// For debugging
const debugLocalStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (savedData) {
        const contacts = JSON.parse(savedData);
        console.log(`DEBUG: Found ${contacts.length} contacts in localStorage:`, contacts);
        return contacts;
      } else {
        console.log('DEBUG: No contacts found in localStorage');
        return [];
      }
    } catch (e) {
      console.error('DEBUG: Error accessing localStorage', e);
      return [];
    }
  } else {
    console.log('DEBUG: Not running in browser environment');
    return [];
  }
};

// Expose debug functions to window for testing
if (typeof window !== 'undefined') {
  (window as any).debugSnapSolPayContacts = {
    getContacts: debugLocalStorage,
    checkStorage: () => {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        keys.push(localStorage.key(i));
      }
      console.log('All localStorage keys:', keys);
      return keys;
    },
    createTestContacts: () => {
      // Create some test contacts for development purposes
      const testContacts: Omit<Contact, 'id'>[] = [
        {
          name: 'Alice',
          email: 'alice@example.com',
          avatar: '👩',
          walletAddress: '88xSzxWEjYjHm6Nez8nWtEJF2jKz14hojyXtQGNXCCNm'
        },
        {
          name: 'Bob',
          email: 'bob@example.com',
          avatar: '👨',
          walletAddress: '5FHwkrdxntf2xezGNJrcP1JF4fB8jGZXo44nL2jVP7PZ'
        }
      ];
      
      // Save directly to localStorage
      const existingData = loadFromLocalStorage();
      const combinedData = [
        ...existingData,
        ...testContacts.map(contact => ({
          ...contact,
          id: `contact-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        }))
      ];
      
      saveToLocalStorage(combinedData);
      console.log('Created test contacts:', testContacts);
      alert('Test contacts created. Please refresh the page.');
      return combinedData;
    },
    clearContacts: () => {
      localStorage.removeItem(STORAGE_KEY);
      console.log('Cleared all contacts from localStorage');
      alert('All contacts cleared. Please refresh the page.');
    }
  };
  
  // Log on startup to help debug
  console.log(`[snapSolPay] To debug contacts storage, use window.debugSnapSolPayContacts in console`);
}

export function ContactsProvider({ children }: { children: ReactNode }) {
  // Initialize with data from localStorage
  const [contacts, setContacts] = useState<Contact[]>(loadFromLocalStorage)
  const [initialized, setInitialized] = useState(false)

  // Ensure we're fully loaded from localStorage before rendering
  useEffect(() => {
    if (!initialized) {
      const loadedContacts = loadFromLocalStorage();
      setContacts(loadedContacts);
      setInitialized(true);
      
      // Only show this toast if contacts were loaded successfully
      if (loadedContacts.length > 0) {
        setTimeout(() => {
          toast.success(`Loaded ${loadedContacts.length} contacts`, {
            id: 'contacts-loaded',
            duration: 2000,
          });
        }, 1000);
      }
    }
  }, [initialized])

  // Save contacts to localStorage whenever they change
  useEffect(() => {
    if (initialized) {
      saveToLocalStorage(contacts)
    }
  }, [contacts, initialized])
  
  // Force save contacts on page unload/refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('[snapSolPay] Saving contacts before unload...');
      saveToLocalStorage(contacts);
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [contacts]);

  // Validate Solana wallet address
  const isValidSolanaAddress = (address: string) => {
    // Basic validation: Solana addresses are ~32-44 characters long and Base58 encoded
    // This is a simple check, consider using a proper validation library in production
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address) || address === ''
  }

  const addContact = (contact: Omit<Contact, 'id'>) => {
    // Validate wallet address if provided
    if (contact.walletAddress && !isValidSolanaAddress(contact.walletAddress)) {
      toast.error('Invalid Solana wallet address format')
      return false
    }

    // Validate name
    if (!contact.name || contact.name.trim() === '') {
      toast.error('Contact name is required')
      return false
    }

    try {
      const newContact: Contact = {
        ...contact,
        id: `contact-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        avatar: contact.avatar || '👤',
        name: contact.name.trim()
      }
      
      setContacts(prevContacts => {
        const updatedContacts = [...prevContacts, newContact]
        // Force an immediate save to localStorage
        setTimeout(() => saveToLocalStorage(updatedContacts), 0)
        return updatedContacts
      })
      
      toast.success(`Added ${contact.name} to contacts!`)
      return true
    } catch (error) {
      console.error('Error adding contact:', error)
      toast.error('Failed to add contact')
      return false
    }
  }

  const updateContact = (id: string, updatedFields: Partial<Contact>) => {
    // Validate wallet address if it's being updated
    if (updatedFields.walletAddress && !isValidSolanaAddress(updatedFields.walletAddress)) {
      toast.error('Invalid Solana wallet address format')
      return false
    }

    // Validate name if it's being updated
    if (updatedFields.name !== undefined && (!updatedFields.name || updatedFields.name.trim() === '')) {
      toast.error('Contact name is required')
      return false
    }

    try {
      // Clean up name if provided
      if (updatedFields.name) {
        updatedFields.name = updatedFields.name.trim()
      }

      setContacts(prevContacts => {
        const updatedContacts = prevContacts.map(contact => 
          contact.id === id 
            ? { ...contact, ...updatedFields } 
            : contact
        )
        
        // Force an immediate save to localStorage
        setTimeout(() => saveToLocalStorage(updatedContacts), 0)
        return updatedContacts
      })
      
      toast.success('Contact updated!')
      return true
    } catch (error) {
      console.error('Error updating contact:', error)
      toast.error('Failed to update contact')
      return false
    }
  }

  const deleteContact = (id: string) => {
    try {
      setContacts(prevContacts => {
        const updatedContacts = prevContacts.filter(contact => contact.id !== id)
        
        // Force an immediate save to localStorage
        setTimeout(() => saveToLocalStorage(updatedContacts), 0)
        return updatedContacts
      })
      
      toast.success('Contact deleted')
      return true
    } catch (error) {
      console.error('Error deleting contact:', error)
      toast.error('Failed to delete contact')
      return false
    }
  }

  const value = {
    contacts,
    addContact,
    updateContact,
    deleteContact,
    isValidSolanaAddress
  }

  return (
    <ContactsContext.Provider value={value}>
      {children}
    </ContactsContext.Provider>
  )
}

export function useContacts() {
  const context = useContext(ContactsContext)
  if (context === undefined) {
    throw new Error('useContacts must be used within a ContactsProvider')
  }
  return context
} 