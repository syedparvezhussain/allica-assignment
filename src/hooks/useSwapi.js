// src/hooks/useSwapi.js
import { useState, useEffect, useCallback } from 'react';
import swapiDB from '../services/swapiIndexedDB';

export const useSwapi = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({
    message: 'Initializing...',
    currentEntity: '',
    progress: 0
  });

  const handleProgressUpdate = useCallback((progressData) => {
    switch (progressData.type) {
      case 'start':
        setProgress({
          message: progressData.message,
          currentEntity: '',
          progress: 0
        });
        break;
      
      case 'entity_start':
        setProgress(prev => ({
          ...prev,
          message: progressData.message,
          currentEntity: progressData.entityType
        }));
        break;
      
      case 'list_progress':
        setProgress(prev => ({
          ...prev,
          message: `Loading ${progressData.entityType}: ${progressData.loaded}/${progressData.total}`,
          progress: Math.round((progressData.loaded / progressData.total) * 100)
        }));
        break;
      
      case 'detail_progress':
        setProgress(prev => ({
          ...prev,
          message: `Fetching ${progressData.entityType} details: ${progressData.processed}/${progressData.total}`,
          progress: Math.round((progressData.processed / progressData.total) * 100)
        }));
        break;
      
      case 'entity_complete':
        setProgress(prev => ({
          ...prev,
          message: `Completed ${progressData.entityType}`
        }));
        break;
      
      case 'complete':
        setProgress({
          message: progressData.message,
          currentEntity: '',
          progress: 100
        });
        setIsInitialized(true);
        setIsLoading(false);
        break;
      
      case 'error':
        setError(progressData.message);
        setIsLoading(false);
        break;
      
      default:
        break;
    }
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Add progress callback
        swapiDB.addProgressCallback(handleProgressUpdate);
        
        // Check if data is already cached
        const isCached = await swapiDB.isDataCached();
        
        if (isCached) {
          setProgress({
            message: 'Data loaded from cache',
            currentEntity: '',
            progress: 100
          });
          setIsInitialized(true);
          setIsLoading(false);
        } else {
          // Initialize all data
          await swapiDB.initializeAllData();
        }
      } catch (err) {
        console.error('Error during initialization:', err);
        setError('Failed to initialize Star Wars data. Please refresh to try again.');
        setIsLoading(false);
      }
    };

    initializeData();

    // Cleanup
    return () => {
      swapiDB.removeProgressCallback(handleProgressUpdate);
    };
  }, [handleProgressUpdate]);

  const getAllPeople = useCallback(async () => {
    try {
      return await swapiDB.getAllPeople();
    } catch (err) {
      console.error('Error fetching people:', err);
      throw new Error('Failed to fetch people data');
    }
  }, []);

  const getPersonWithRelations = useCallback(async (personId) => {
    try {
      return await swapiDB.getPersonWithRelations(personId);
    } catch (err) {
      console.error('Error fetching person with relations:', err);
      throw new Error('Failed to fetch person data');
    }
  }, []);

  const clearCache = useCallback(async () => {
    try {
      await swapiDB.clearAllData();
      setIsInitialized(false);
      setIsLoading(true);
      setError(null);
      setProgress({
        message: 'Cache cleared. Reinitializing...',
        currentEntity: '',
        progress: 0
      });
      
      // Restart initialization
      await swapiDB.initializeAllData();
    } catch (err) {
      console.error('Error clearing cache:', err);
      setError('Failed to clear cache');
    }
  }, []);

  return {
    isInitialized,
    isLoading,
    error,
    progress,
    getAllPeople,
    getPersonWithRelations,
    clearCache
  };
};

// Alternative hook for components that only need specific data
export const useSwapiPerson = (personId) => {
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isInitialized, isLoading: dbLoading } = useSwapi();

  useEffect(() => {
    const loadPerson = async () => {
      if (!isInitialized || !personId) return;

      setLoading(true);
      setError(null);

      try {
        const personData = await swapiDB.getPersonWithRelations(personId);
        if (!personData) {
          setError('Character not found');
        } else {
          setPerson(personData);
        }
      } catch (err) {
        console.error('Error loading person:', err);
        setError('Failed to load character data');
      } finally {
        setLoading(false);
      }
    };

    loadPerson();
  }, [personId, isInitialized]);

  return {
    person,
    loading: loading || dbLoading,
    error
  };
};

export default useSwapi;