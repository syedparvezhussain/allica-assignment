import { renderHook, act } from '@testing-library/react';
import { useSwapi } from './useSwapi';
import swapiDB from '../services/swapiIndexedDB';


let progressCallback = null;

jest.mock('../services/swapiIndexedDB', () => ({

  addProgressCallback: jest.fn(cb => {
    progressCallback = cb;
  }),
  removeProgressCallback: jest.fn(),
  initializeAllData: jest.fn(),
  isDataCached: jest.fn(),
  getAllPeople: jest.fn(),
  getPersonWithRelations: jest.fn(),
  initDB: jest.fn().mockResolvedValue(true), // Mock for useSwapiPerson
  clearAllData: jest.fn(),
}));

const mockPeople = [
  { uid: '1', name: 'Luke Skywalker' },
  { uid: '2', name: 'Leia Organa' },
];

describe('useSwapi Hook', () => {
  // Clear mock history before each test, but preserve mock implementations
  beforeEach(() => {
    swapiDB.addProgressCallback.mockClear();
    swapiDB.removeProgressCallback.mockClear();
    swapiDB.initializeAllData.mockClear();
    swapiDB.isDataCached.mockClear();
    swapiDB.getAllPeople.mockClear();
    progressCallback = null;
  });

  test('should handle initial state correctly', () => {
    const { result } = renderHook(() => useSwapi());
    expect(result.current.people).toEqual([]);
    expect(result.current.arePeopleLoaded).toBe(false);
    expect(result.current.isSyncing).toBe(true);
    expect(result.current.error).toBe(null);
  });

  test('should load data from cache if available', async () => {
    swapiDB.isDataCached.mockResolvedValue(true);
    swapiDB.getAllPeople.mockResolvedValue(mockPeople);

    const { result } = renderHook(() => useSwapi());

    // Wait for the async effect to resolve
    await act(async () => {
      await Promise.resolve();
    });

    expect(swapiDB.getAllPeople).toHaveBeenCalledTimes(2);
    expect(swapiDB.initializeAllData).not.toHaveBeenCalled();

    expect(result.current.people).toEqual(mockPeople);
    expect(result.current.arePeopleLoaded).toBe(true);
    expect(result.current.isSyncing).toBe(false);
    expect(result.current.progress.message).toBe('Data loaded from cache');
  });

  test('should initialize data fetch if not cached', async () => {
    swapiDB.isDataCached.mockResolvedValue(false);

    const { result } = renderHook(() => useSwapi());

    // Wait for the hook's useEffect to run
    await act(async () => {
      await Promise.resolve();
    });

    expect(swapiDB.isDataCached).toHaveBeenCalledTimes(1);
    expect(swapiDB.initializeAllData).toHaveBeenCalledTimes(1);
    expect(result.current.isSyncing).toBe(true);
  });

  
  test('should handle an error during initialization', async () => {
    // Suppress the expected console error to keep test output clean
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    swapiDB.isDataCached.mockRejectedValue(new Error('DB read error'));
    const { result } = renderHook(() => useSwapi());
    
    await act(async () => {
        await Promise.resolve();
    });
    
    expect(result.current.error).toContain('Failed to initialize');
    expect(result.current.isSyncing).toBe(false);

    // Restore original console.error function
    consoleErrorSpy.mockRestore();
  });
});

