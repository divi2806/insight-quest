import firebaseService from './firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, getDoc, updateDoc, writeBatch, setDoc } from 'firebase/firestore';
import { mockAgents } from '../lib/mockAgents'; // Adjust the import path as needed

const AGENTS_COLLECTION = 'agents';
const { db } = firebaseService;

// Get all agents
export const getAllAgents = async () => {
  try {
    const agentsCollection = collection(db, AGENTS_COLLECTION);
    const agentSnapshot = await getDocs(agentsCollection);
    // If no agents in Firestore, load mock data
    if (agentSnapshot.empty) {
      console.log("No agents found in Firestore. Loading mock data...");
      await loadMockAgents();
      // Get agents again after loading mock data
      const newSnapshot = await getDocs(agentsCollection);
      return newSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }
    return agentSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting agents:", error);
    return [];
  }
};
// Load mock agents into Firestore
export const loadMockAgents = async () => {
  try {
    const batch = writeBatch(db);
    const agentsRef = collection(db, AGENTS_COLLECTION);
    // Check if agents collection already has data
    const agentSnapshot = await getDocs(query(agentsRef));
    if (!agentSnapshot.empty) {
      console.log("Agents collection already has data. Skipping mock data load.");
      return;
    }
    // Add each mock agent to Firestore
    const addPromises = mockAgents.map(agent => {
      const { id, ...agentWithoutId } = agent;
      const docRef = doc(agentsRef, id);
      return setDoc(docRef, {
        ...agentWithoutId,
        purchasedBy: [] // Ensure purchasedBy is initialized
      });
    });
    await Promise.all(addPromises);
    console.log(`Successfully loaded ${mockAgents.length} mock agents into Firestore.`);
    return true;
  } catch (error) {
    console.error("Error loading mock agents:", error);
    return false;
  }
};

// Add a new agent - now with better error handling
export const addAgent = async (agentData) => {
  try {
    // Validate that there is a creatorId before proceeding
    if (!agentData.creatorId) {
      throw new Error("Creator ID is required to add an agent");
    }
    
    const agentsRef = collection(db, AGENTS_COLLECTION);
    
    // Add timestamp and ensure purchasedBy is initialized
    const agentWithTimestamp = {
      ...agentData,
      dateCreated: new Date().toISOString(),
      purchasedBy: agentData.purchasedBy || []
    };
    
    // Add to Firestore
    const docRef = await addDoc(agentsRef, agentWithTimestamp);
    
    // Return the complete agent with its new ID
    return {
      id: docRef.id,
      ...agentWithTimestamp
    };
  } catch (error) {
    console.error("Error adding agent:", error);
    throw error; // Re-throw to handle in the component
  }
};

// Delete an agent
export const deleteAgent = async (agentId) => {
  try {
    // Check if wallet is connected - similar to your checkWalletAuth() function in firebase.ts
    const walletAddress = localStorage.getItem('connectedAddress');
    if (!walletAddress) {
      throw new Error("Not authenticated with wallet");
    }
    
    // Get the agent to check if the current user is the creator
    const agentRef = doc(db, AGENTS_COLLECTION, agentId);
    const agentDoc = await getDoc(agentRef);
    
    if (!agentDoc.exists()) {
      throw new Error("Agent not found");
    }
    
    const agentData = agentDoc.data();
    
    // Check if the current user is the creator
    if (agentData.creatorId.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new Error("Permission denied: You can only delete agents you have created");
    }
    
    // Delete the document
    await deleteDoc(agentRef);
    return true;
  } catch (error) {
    console.error("Error deleting agent:", error);
    throw error;
  }
};

// Get agents by creator ID
export const getAgentsByCreator = async (creatorId) => {
  try {
    const agentsRef = collection(db, AGENTS_COLLECTION);
    const q = query(agentsRef, where("creatorId", "==", creatorId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting creator's agents:", error);
    return [];
  }
};

// Purchase an agent
export const purchaseAgent = async (agentId, userId) => {
  try {
    const agentRef = doc(db, AGENTS_COLLECTION, agentId);
    const agentDoc = await getDoc(agentRef);
    
    if (!agentDoc.exists()) {
      throw new Error("Agent not found");
    }
    
    const agentData = agentDoc.data();
    const purchasedBy = agentData.purchasedBy || [];
    
    // Add buyer if not already purchased
    if (!purchasedBy.includes(userId)) {
      await updateDoc(agentRef, {
        purchasedBy: [...purchasedBy, userId]
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error updating purchase:", error);
    throw error;
  }
};

// Initialize Firestore with mock data on app startup
export const initializeFirestore = async () => {
  try {
    // Check if we need to load mock data
    const agentsRef = collection(db, AGENTS_COLLECTION);
    const agentSnapshot = await getDocs(agentsRef);
    if (agentSnapshot.empty) {
      console.log("Initializing Firestore with mock data...");
      await loadMockAgents();
      return true;
    }
    console.log("Firestore already contains agent data. Skipping initialization.");
    return false;
  } catch (error) {
    console.error("Error initializing Firestore:", error);
    return false;
  }
};

// Get an agent by ID
export const getAgentById = async (agentId) => {
  try {
    const agentRef = doc(db, AGENTS_COLLECTION, agentId);
    const agentDoc = await getDoc(agentRef);
    if (agentDoc.exists()) {
      return {
        id: agentDoc.id,
        ...agentDoc.data()
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting agent by ID:", error);
    return null;
  }
};

// Get agents by category
export const getAgentsByCategory = async (category) => {
  try {
    const agentsRef = collection(db, AGENTS_COLLECTION);
    const q = query(agentsRef, where("category", "==", category));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting agents by category:", error);
    return [];
  }
};

// Update agent's purchased by field (legacy function, kept for compatibility)
export const updateAgentPurchase = async (agentId, buyerId) => {
  return purchaseAgent(agentId, buyerId);
};

export default {
  getAllAgents,
  addAgent,
  deleteAgent,
  getAgentsByCreator,
  purchaseAgent,
  updateAgentPurchase,
  loadMockAgents,
  initializeFirestore,
  getAgentById,
  getAgentsByCategory
};