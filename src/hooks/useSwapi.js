
import { useState, useEffect, useCallback } from "react";
import swapiDB from "../services/swapiIndexedDB";

export const useSwapi = () => {
  const [people, setPeople] = useState([]);
  const [arePeopleLoaded, setArePeopleLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({
    message: "Initializing...",
    currentEntity: "",
    progress: 0,
  });

  const handleProgressUpdate = useCallback(
    (progressData) => {
      // Update progress state for the UI
      setProgress((prev) => {
        switch (progressData.type) {
          case "start":
            return { ...prev, message: progressData.message, progress: 0 };
          case "entity_start":
          case "entity_list_complete":
            return {
              ...prev,
              message: progressData.message,
              currentEntity: progressData.entityType,
            };
          case "list_progress":
          case "detail_progress":
            const newProgress = Math.round(
              ((progressData.loaded || progressData.processed) /
                progressData.total) *
                100
            );
            return { ...prev, message: progressData.message, progress: newProgress };
          case "complete":
            return { ...prev, message: progressData.message, progress: 100 };
          default:
            return prev;
        }
      });

      // **NEW**: When 'people' entity is fully loaded, fetch them for the list
      if (
        (progressData.type === "entity_complete" &&
          progressData.entityType === "people") ||
        (progressData.type === "detail_skip" &&
          progressData.entityType === "people")
      ) {
        if (!arePeopleLoaded) {
          swapiDB.getAllPeople().then((allPeople) => {
            setPeople(allPeople);
            setArePeopleLoaded(true);
          });
        }
      }

      if (progressData.type === "complete") {
        setIsInitialized(true);
        setIsLoading(false);
        // Final check to ensure people are loaded if they weren't caught before
        if (!arePeopleLoaded) {
          swapiDB.getAllPeople().then((allPeople) => {
            setPeople(allPeople);
            setArePeopleLoaded(true);
          });
        }
      }

      if (progressData.type === "error") {
        setError(progressData.message);
        setIsLoading(false);
      }
    },
    [arePeopleLoaded]
  );

  useEffect(() => {
    const initializeData = async () => {
      try {
        swapiDB.addProgressCallback(handleProgressUpdate);
        const isCached = await swapiDB.isDataCached();

        if (isCached) {
          // If all data is cached, load people immediately and finish
          const allPeople = await swapiDB.getAllPeople();
          setPeople(allPeople);
          setArePeopleLoaded(true);
          setIsInitialized(true);
          setIsLoading(false);
          setProgress({
            message: "Data loaded from cache",
            currentEntity: "",
            progress: 100,
          });
        } else {
          // Otherwise, start the full initialization process.
          // The progress handler will load people when they are ready.
          swapiDB.initializeAllData();
        }
      } catch (err) {
        console.error("Error during initialization:", err);
        setError(
          "Failed to initialize Star Wars data. Please refresh to try again."
        );
        setIsLoading(false);
      }
    };

    initializeData();

    return () => {
      swapiDB.removeProgressCallback(handleProgressUpdate);
    };
  }, [handleProgressUpdate]);
  
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
      window.location.reload(); // Easiest way to re-trigger initialization
    } catch (err) {
      console.error('Error clearing cache:', err);
      setError('Failed to clear cache');
    }
  }, []);


  return {
    people,
    arePeopleLoaded,
    isSyncing: isLoading && !isInitialized, // True while background sync is active
    error,
    progress,
    getPersonWithRelations,
    clearCache,
  };
};

// No changes needed for useSwapiPerson hook
export const useSwapiPerson = (personId) => {
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // We check isInitialized from the main hook to ensure DB is ready
  const [isDbReady, setIsDbReady] = useState(false);
  useEffect(() => {
    swapiDB.initDB().then(() => setIsDbReady(true));
  }, []);

  useEffect(() => {
    const loadPerson = async () => {
      if (!isDbReady || !personId) return;

      setLoading(true);
      setError(null);

      try {
        const personData = await swapiDB.getPersonWithRelations(personId);
        if (!personData) {
          setError("Character not found");
        } else {
          setPerson(personData);
        }
      } catch (err) {
        console.error("Error loading person:", err);
        setError("Failed to load character data");
      } finally {
        setLoading(false);
      }
    };

    loadPerson();
  }, [personId, isDbReady]);

  return {
    person,
    loading,
    error,
  };
};
export default useSwapi;