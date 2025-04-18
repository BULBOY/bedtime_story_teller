// app/api/lib/firebase-service.js
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc
} from "firebase/firestore";
import { db } from "src/lib/firebase/firebase_conf";


// Collection references
const STORIES_COLLECTION = 'stories';

/**
 * Save a story to Firestore
 * @param {string} id - Story ID
 * @param {object} storyData - Story data including story text and metadata
 * @returns {Promise<void>}
 */
export async function saveStory(id, storyData) {
  try {
    const storyRef = doc(db, STORIES_COLLECTION, id);
    
    // Convert date strings to Firestore timestamps
    const processedData = {
      ...storyData,
      metadata: {
        ...storyData.metadata
      }
    };
    
    await setDoc(storyRef, processedData);
    return true;
  } catch (error) {
    console.error('Error saving story to Firestore:', error);
    throw error;
  }
}

/**
 * Get a story by ID
 * @param {string} id - Story ID
 * @returns {Promise<object|null>} - Story data or null if not found
 */
export async function getStory(id) {
  try {
    const storyRef = doc(db, STORIES_COLLECTION, id);
    console.log(storyRef);
    const storySnap = await getDoc(storyRef);
    
    if (!storySnap.exists()) {
      return null;
    }
    
    const data = storySnap.data();
    
    // Convert Firestore timestamps back to ISO strings for consistency
    return {
      ...data,
      id: storySnap.id,
      metadata: {
        ...data.metadata
      }
    };
  } catch (error) {
    console.error('Error getting story from Firestore:', error);
    throw error;
  }
}

/**
 * Update a story
 * @param {string} id - Story ID
 * @param {object} updates - Fields to update
 * @returns {Promise<boolean>} - Success indicator
 */
export async function updateStory(id, updates) {
  try {
    const storyRef = doc(db, STORIES_COLLECTION, id);
    
    // Process timestamps if they exist in the updates
    const processedUpdates = { ...updates };
    
    if (updates.metadata) {
      processedUpdates.metadata = { ...updates.metadata };
    
    }
    
    await updateDoc(storyRef, processedUpdates);
    return true;
  } catch (error) {
    console.error('Error updating story in Firestore:', error);
    throw error;
  }
}

/**
 * Delete a story
 * @param {string} id - Story ID
 * @returns {Promise<boolean>} - Success indicator
 */
export async function deleteStory(id) {
  try {
    console.log(`Inside deleteStory function with ID: ${id}`);
    // First check if document exists
    const storyRef = doc(db, STORIES_COLLECTION, id);
    const storyDoc = await getDoc(storyRef);
    
    if (!storyDoc.exists()) {
      console.log(`Document with ID ${id} does not exist in Firestore`);
      throw new Error(`Document with ID ${id} not found`);
    }
    
    console.log(`Document exists, attempting to delete: ${id}`);
    await deleteDoc(storyRef);
    console.log(`Successfully deleted document: ${id}`);
    return true;
  } catch (error) {
    console.error(`Error deleting story ${id} from Firestore:`, error);
    throw error;
  }
}

/**
 * Get all stories with filtering and pagination
 * @param {object} options - Filter and pagination options
 * @returns {Promise<{stories: Array, total: number, totalPages: number}>}
 */
export async function getStories({
  limit: limitCount = 10,
  page = 1,
  tags = null,
  category = null,
  ageMin = null,
  ageMax = null,
  theme = null,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  userId = null // Add userId parameter
}) {
  try {
    // Unfortunately, Firestore doesn't directly support all the complex filtering we need
    // So we'll get all stories and filter them in memory
    const storiesRef = collection(db, STORIES_COLLECTION);
    const storiesSnap = await getDocs(storiesRef);
    
    // Convert to array of stories with proper date formatting
    let stories = storiesSnap.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        metadata: {
          ...data.metadata
        }
      };
    });
    
    // Filter by userId if provided
    if (userId) {
      stories = stories.filter(story => 
        // Check for userId in both places depending on how it was saved
        (story.metadata && story.metadata.userId === userId) || 
        story.userId === userId
      );
    }
    
    // Apply other filters
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim().toLowerCase());
      stories = stories.filter(story => {
        const storyTags = story.metadata.tags || [];
        return tagArray.some(tag => storyTags.includes(tag));
      });
    }
    
    if (category) {
      stories = stories.filter(story => {
        const storyCategories = story.metadata.categories || [];
        return storyCategories.includes(category);
      });
    }
    
    if (ageMin) {
      const ageMinNum = parseInt(ageMin, 10);
      stories = stories.filter(story => story.metadata.age >= ageMinNum);
    }
    
    if (ageMax) {
      const ageMaxNum = parseInt(ageMax, 10);
      stories = stories.filter(story => story.metadata.age <= ageMaxNum);
    }
    
    if (theme) {
      stories = stories.filter(story => story.metadata.theme.toLowerCase() === theme.toLowerCase());
    }
    
    // Sort stories
    stories.sort((a, b) => {
      let valA, valB;
      
      // Get the values to compare based on sortBy
      switch (sortBy) {
        // case 'createdAt':
        //   valA = new Date(a.metadata.createdAt).getTime();
        //   valB = new Date(b.metadata.createdAt).getTime();
        //   break;
        // case 'lastEdited':
        //   valA = a.metadata.lastEdited ? new Date(a.metadata.lastEdited).getTime() : 0;
        //   valB = b.metadata.lastEdited ? new Date(b.metadata.lastEdited).getTime() : 0;
        //   break;
        case 'age':
          valA = a.metadata.age;
          valB = b.metadata.age;
          break;
        default:
          valA = a.metadata.age;
          valB = b.metadata.age;
      }
      
      // Apply sort order
      if (sortOrder.toLowerCase() === 'asc') {
        return valA - valB;
      } else {
        return valB - valA;
      }
    });
    
    // Calculate pagination
    const startIndex = (page - 1) * limitCount;
    const endIndex = page * limitCount;
    const paginatedStories = stories.slice(startIndex, endIndex);
    
    return {
      stories: paginatedStories,
      total: stories.length,
      totalPages: Math.ceil(stories.length / limitCount)
    };
  } catch (error) {
    console.error('Error getting stories from Firestore:', error);
    throw error;
  }
}

/**
 * Get all unique tags
 * @returns {Promise<string[]>} - Array of unique tags
 */
export async function getAllTags() {
  try {
    const storiesRef = collection(db, STORIES_COLLECTION);
    const storiesSnap = await getDocs(storiesRef);
    
    const allTags = new Set();
    storiesSnap.docs.forEach(doc => {
      const storyData = doc.data();
      const storyTags = storyData.metadata?.tags || [];
      storyTags.forEach(tag => allTags.add(tag));
    });
    
    return [...allTags].sort();
  } catch (error) {
    console.error('Error getting tags from Firestore:', error);
    throw error;
  }
}

/**
 * Get all unique categories
 * @returns {Promise<string[]>} - Array of unique categories
 */
export async function getAllCategories() {
  try {
    const storiesRef = collection(db, STORIES_COLLECTION);
    const storiesSnap = await getDocs(storiesRef);
    
    const allCategories = new Set();
    storiesSnap.docs.forEach(doc => {
      const storyData = doc.data();
      const storyCategories = storyData.metadata?.categories || [];
      storyCategories.forEach(category => allCategories.add(category));
    });
    
    return [...allCategories].sort();
  } catch (error) {
    console.error('Error getting categories from Firestore:', error);
    throw error;
  }
}