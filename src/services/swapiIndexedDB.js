// src/services/swapiIndexedDB.js
import axios from 'axios';

class SwapiIndexedDBService {
  constructor() {
    this.dbName = 'SwapiDB';
    this.dbVersion = 1;
    this.db = null;
    this.API_BASE_URL = 'https://www.swapi.tech/api';
    
    // Configuration for throttling
    this.MAX_CONCURRENT_REQUESTS = 10;
    this.REQUEST_DELAY_MS = 4000;
    this.BATCH_SIZE = 10;
    
    // Progress tracking
    this.progressCallbacks = new Set();
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  // Initialize IndexedDB
  async initDB() {
    if (this.db) return this.db;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('people')) {
          const peopleStore = db.createObjectStore('people', { keyPath: 'uid' });
          peopleStore.createIndex('name', 'name', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('planets')) {
          const planetsStore = db.createObjectStore('planets', { keyPath: 'uid' });
          planetsStore.createIndex('name', 'name', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('starships')) {
          const starshipsStore = db.createObjectStore('starships', { keyPath: 'uid' });
          starshipsStore.createIndex('name', 'name', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('vehicles')) {
          const vehiclesStore = db.createObjectStore('vehicles', { keyPath: 'uid' });
          vehiclesStore.createIndex('name', 'name', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('species')) {
          const speciesStore = db.createObjectStore('species', { keyPath: 'uid' });
          speciesStore.createIndex('name', 'name', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('films')) {
          const filmsStore = db.createObjectStore('films', { keyPath: 'uid' });
          filmsStore.createIndex('title', 'title', { unique: false });
        }
        
        // Store for tracking initialization status
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      };
    });
  }

  // Helper function to add delay between batches
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Progress notification system
  addProgressCallback(callback) {
    this.progressCallbacks.add(callback);
  }

  removeProgressCallback(callback) {
    this.progressCallbacks.delete(callback);
  }

  notifyProgress(data) {
    this.progressCallbacks.forEach(callback => callback(data));
  }

  // Get data from IndexedDB
  async getFromStore(storeName, key = null) {
    await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      let request;
      if (key) {
        request = store.get(key);
      } else {
        request = store.getAll();
      }
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Store data in IndexedDB
  async saveToStore(storeName, data) {
    await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      if (Array.isArray(data)) {
        data.forEach(item => store.put(item));
      } else {
        store.put(data);
      }
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Check if data is already cached
  async isDataCached() {
    await this.initDB();
    
    try {
      const meta = await this.getFromStore('meta', 'initialization_complete');
      return meta && meta.value === true;
    } catch (error) {
      return false;
    }
  }

  // Mark data as cached
  async markDataAsCached() {
    await this.saveToStore('meta', { key: 'initialization_complete', value: true });
  }

  // Fetch all entities of a specific type with throttling
  async fetchAllEntities(entityType) {
    let allEntities = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      try {
        const response = await axios.get(`${this.API_BASE_URL}/${entityType}?page=${page}&limit=10`);
        const entities = response.data.results || response.data.result || []; // Handle both 'results' and 'result' for different entity types
        
        if (entities && entities.length > 0) {
               if (entityType === 'films') {
          // For films, the detailed data is directly in 'properties'
          // We need to map it to the expected structure
          const filmEntities = entities.map(film => ({
            uid: film.uid,
            name: film.properties.title, // Use title as name for films
            ...film.properties,
            // If there are other top-level fields needed (like 'description'), add them here
            description: film.description // Assuming description is a top-level field sibling to properties
          }));
          allEntities = allEntities.concat(filmEntities);
        } else {
          // For other entity types, just concatenate the basic entities
          allEntities = allEntities.concat(entities);
        }
          hasMore = (response.data.next && response.data.next !== null);
          page++;
          
          this.notifyProgress({
            type: 'list_progress',
            entityType,
            loaded: allEntities.length,
            total: response.data.total_records
          });
        } else {
          hasMore = false;
        }
        
        // Small delay between pages
        await this.delay(1500);
      } catch (error) {
        console.error(`Error fetching ${entityType} page ${page}:`, error);
        hasMore = false;
        await this.delay(3000);
      }
    }
      if (entityType === 'films' && allEntities.length > 0) {
    await this.saveToStore(entityType, allEntities);
  }
    
    return allEntities;
  }

  // Fetch detailed data for entities in throttled batches
// Fetch detailed data for entities in throttled batches
// Fetch detailed data for entities in throttled batches
async fetchDetailedData(entities, entityType) {
  if (!entities || entities.length === 0) return [];

  let detailedData = [];
  let processedCount = 0;
  let batchRetryCount = 0; // NEW: Counter for consecutive batch failures

  for (let i = 0; i < entities.length; i += this.BATCH_SIZE) {
    const batch = entities.slice(i, i + this.BATCH_SIZE);
    let batchFailed = false; // Flag to indicate if any request in the current batch failed

    const batchPromises = batch.map(async (entity) => {
      try {
        const response = await axios.get(`${this.API_BASE_URL}/${entityType}/${entity.uid}`);
        return {
          uid: entity.uid,
          name: entity.name,
          ...response.data.result.properties
        };
      } catch (error) {
        console.error(`Error fetching detailed ${entityType} ${entity.uid}:`, error);
        batchFailed = true; // Mark batch as failed
        return null; // Return null to easily filter out failed requests
      }
    });

    const batchResults = await Promise.all(batchPromises);

    if (batchFailed) {
      batchRetryCount++; // Increment retry count on failure
      let delayDuration = 10000; // Default retry delay

      // NEW: Check if batch failed more than 2 times consecutively
      if (batchRetryCount > 2) {
        delayDuration += 20000; // Add 20 seconds to the delay
        console.warn(`Batch failed for ${entityType} more than 2 times. Increasing delay.`);
      }

      console.warn(`Batch failed for ${entityType}. Retrying after ${delayDuration / 1000} seconds...`);
      // Revert 'i' to re-process the current batch after the delay
      i -= this.BATCH_SIZE;
      await this.delay(delayDuration); // Wait for calculated seconds
      continue; // Skip to the next iteration of the loop, which will re-process this batch
    } else {
      // NEW: Reset retry count if the batch was successful
      batchRetryCount = 0;
    }

    const validResults = batchResults.filter(Boolean); // Filter out nulls from failed requests

    detailedData = detailedData.concat(validResults);
    processedCount += batch.length; // Still increment by batch.length for progress, even if some failed initially

    // Store batch results immediately (only valid ones)
    if (validResults.length > 0) {
      await this.saveToStore(entityType, validResults);
    }

    this.notifyProgress({
      type: 'detail_progress',
      entityType,
      processed: processedCount,
      total: entities.length,
      completed: detailedData.length
    });

    // Delay between batches only if the current batch succeeded and there are more entities to fetch
    // No need to check !batchFailed here explicitly as we'd have continued if it failed
    if (i + this.BATCH_SIZE < entities.length) {
      await this.delay(this.REQUEST_DELAY_MS);
    }
  }

  return detailedData;
}
  // Initialize all data
  async initializeAllData() {
    if (this.isInitialized) return;
    if (this.initializationPromise) return this.initializationPromise;
    
    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  async performInitialization() {
    await this.initDB();
    
    // Check if data is already cached
    if (await this.isDataCached()) {
      this.isInitialized = true;
      this.notifyProgress({ type: 'complete', message: 'Data loaded from cache' });
      return;
    }

    const entityTypes = ['films', 'people' ,'planets', 'starships', 'vehicles', 'species' ];
    
    try {
      this.notifyProgress({ type: 'start', message: 'Starting data initialization...' });
      
      for (const entityType of entityTypes) {
        this.notifyProgress({ 
          type: 'entity_start', 
          entityType, 
          message: `Fetching ${entityType} list...` 
        });
        
        // Fetch all entities of this type
        const entities = await this.fetchAllEntities(entityType);
        
            this.notifyProgress({
            type: 'entity_list_complete',
            entityType,
            count: entities.length,
            message: `Found ${entities.length} ${entityType}.` // Message adjusted
            });

        
        // Fetch detailed data in batches
      if (entityType !== 'films') {
  this.notifyProgress({
    type: 'detail_start', // Added for clarity
    entityType,
    message: `Fetching detailed ${entityType} data...`
  });
  await this.fetchDetailedData(entities, entityType);
} else {
  // For films, data is already detailed from fetchAllEntities, so no separate detail fetch
  this.notifyProgress({
    type: 'detail_skip', // Added for clarity
    entityType,
    message: `Detailed data for ${entityType} already fetched.`
  });
}
        this.notifyProgress({ 
          type: 'entity_complete', 
          entityType,
          message: `Completed ${entityType}` 
        });
      }
      
      // Mark initialization as complete
      await this.markDataAsCached();
      this.isInitialized = true;
      
      this.notifyProgress({ 
        type: 'complete', 
        message: 'All data initialized successfully!' 
      });
      
    } catch (error) {
      console.error('Error during initialization:', error);
      this.notifyProgress({ 
        type: 'error', 
        message: 'Error during initialization: ' + error.message 
      });
      throw error;
    }
  }

  // Get person with all relations
  async getPersonWithRelations(personId) {
    await this.initDB();
    
    try {
      const person = await this.getFromStore('people', personId);
      if (!person) return null;
                  const species = await this.getFromStore('species');
                   const starships = await this.getFromStore('starships');
                  const planets  = await this.getFromStore('planets');
                   const vehicles  = await this.getFromStore('vehicles');
                      const films  = await this.getFromStore('films');
                   console.log("test", films);
      // Extract relation URLs and convert to UIDs
      const relations = {
        homeworld: null,
        species: [],
        starships: [],
        vehicles: [],
        films: []
      };
      
      // Helper function to extract UID from URL
      const extractUid = (url) => {
        const match = url.match(/\/(\d+)\/?$/);
        return match ? match[1] : null;
      };
      
      // Fetch homeworld
      if (person.homeworld) {
        const homeworldUid = extractUid(person.homeworld);
        if (homeworldUid) {
          relations.homeworld = await this.getFromStore('planets', homeworldUid);
        }
      }
      
      // Fetch species
    //   if (person.species && person.species.length > 0) {
    //     for (const speciesUrl of person.species) {
    //       const speciesUid = extractUid(speciesUrl);
    //       if (speciesUid) {
    //         const species = await this.getFromStore('species', speciesUid);
    //         if (species) relations.species.push(species);
    //       }
    //     }
    //   }
            if (species && species.length > 0) {
        for (const specie of species) {
            if(specie.people && specie.people.includes(person.url)) {
                const speciesUrl = specie.url;
          const speciesUid = extractUid(speciesUrl);
          if (speciesUid) {
            const spec = await this.getFromStore('species', speciesUid);
             if (spec) relations.species.push(spec);
          }
        }
      }
    }
      
      // Fetch starships
      if (starships && starships.length > 0) {
        for (const starShip of starships) {
            if(starShip.pilots && starShip.pilots.includes(person.url)) {
                const starshipUrl = starShip.url;
          const starshipUid = extractUid(starshipUrl);
          if (starshipUid) {
            const starship = await this.getFromStore('starships', starshipUid);
        
            if (starship) relations.starships.push(starship);
          }
        }
      }
    }
      
      // Fetch vehicles
    //   if (person.vehicles && person.vehicles.length > 0) {
    //     for (const vehicleUrl of person.vehicles) {
    //       const vehicleUid = extractUid(vehicleUrl);
    //       if (vehicleUid) {
    //         const vehicle = await this.getFromStore('vehicles', vehicleUid);
    //         if (vehicle) relations.vehicles.push(vehicle);
    //       }
    //     }
    //   }
      
      if (vehicles && vehicles.length > 0) {
        for (const vehicle of vehicles) {
            if(vehicle.pilots && vehicle.pilots.includes(person.url)) {
                const vehicleUrl = vehicle.url;
          const vehicleUid = extractUid(vehicleUrl);
          if (vehicleUid) {
            const vehicle = await this.getFromStore('vehicles', vehicleUid);
             if (vehicle) relations.vehicles.push(vehicle);
          }
        }
      }
    }

      // Fetch films
      if (person.films && person.films.length > 0) {
        for (const filmUrl of person.films) {
          const filmUid = extractUid(filmUrl);
          if (filmUid) {
            const film = await this.getFromStore('films', filmUid);
            if (film) relations.films.push(film);
          }
        }
      }
           
      if (films && films.length > 0) {
        for (const film of films) {
            if(film.characters && film.characters.includes(person.url)) {
                const filmURL = film.url;
          const filmUid = extractUid(filmURL);
          if (filmUid) {
            const filmGot = await this.getFromStore('films', filmUid);
             if (filmGot) relations.films.push(filmGot);
          }
        }
      }
    }
      return {
        ...person,
        relations
      };
      
    } catch (error) {
      console.error('Error fetching person with relations:', error);
      throw error;
    }
  }

  // Get all people (for list view)
  async getAllPeople() {
    await this.initDB();
    return await this.getFromStore('people');
  }

  // Clear all data (for development/testing)
  async clearAllData() {
    await this.initDB();
    
    const entityTypes = ['people', 'planets', 'starships', 'vehicles', 'species', 'films', 'meta'];
    
    for (const entityType of entityTypes) {
      const transaction = this.db.transaction([entityType], 'readwrite');
      const store = transaction.objectStore(entityType);
      store.clear();
    }
    
    this.isInitialized = false;
    this.initializationPromise = null;
  }
}

// Singleton instance
const swapiDB = new SwapiIndexedDBService();
export default swapiDB;