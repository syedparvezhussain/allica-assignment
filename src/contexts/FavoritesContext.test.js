import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {
  FavoritesProvider,
  useFavorites,
} from './FavoritesContext';

// Mocking localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem(key) {
      return store[key] || null;
    },
    setItem(key, value) {
      store[key] = value.toString();
    },
    clear() {
      store = {};
    },
    removeItem(key) {
      delete store[key];
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// A test component that consumes the context
const TestFavoritesComponent = () => {
  const {
    favorites,
    toggleFavorite,
    isFavorite,
    clearAllFavorites,
    favoritesCount,
  } = useFavorites();

  const person1 = { uid: '1', name: 'Luke Skywalker' };
  const person2 = { uid: '2', name: 'Darth Vader' };

  return (
    <div>
      <h1>Favorites</h1>
      <p>Count: {favoritesCount}</p>
      <div data-testid="favorites-list">
        {favorites.map(fav => (
          <span key={fav.uid}>{fav.name},</span>
        ))}
      </div>
      <div>
        <p>Is Luke a favorite? {isFavorite('1') ? 'Yes' : 'No'}</p>
        <button onClick={() => toggleFavorite(person1)}>Toggle Luke</button>
        <button onClick={() => toggleFavorite(person2)}>Toggle Vader</button>
        <button onClick={() => clearAllFavorites()}>Clear All</button>
      </div>
    </div>
  );
};

// Helper function to render the component within the provider
const renderWithProvider = () => {
  return render(
    <FavoritesProvider>
      <TestFavoritesComponent />
    </FavoritesProvider>
  );
};

describe('FavoritesProvider', () => {
  // Clear localStorage before each test
  beforeEach(() => {
    localStorage.clear();
    // Also clear any mocks on setItem
    jest.spyOn(localStorage, 'setItem');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('initializes with an empty array when localStorage is empty', () => {
    renderWithProvider();
    expect(screen.getByText('Count: 0')).toBeInTheDocument();
    expect(screen.getByTestId('favorites-list')).toBeEmptyDOMElement();
  });

  test('loads favorites from localStorage on initial render', () => {
    const initialFavs = [{ uid: '1', name: 'Luke Skywalker' }];
    localStorage.setItem('starwars-favorites', JSON.stringify(initialFavs));

    renderWithProvider();

    expect(screen.getByText('Luke Skywalker,')).toBeInTheDocument();
    expect(screen.getByText('Is Luke a favorite? Yes')).toBeInTheDocument();
  });

  test('handles invalid JSON from localStorage gracefully', () => {
    localStorage.setItem('starwars-favorites', 'not-valid-json');
    // Suppress console.error for this specific test
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    renderWithProvider();

    expect(screen.getByText('Count: 0')).toBeInTheDocument();
    expect(screen.getByTestId('favorites-list')).toBeEmptyDOMElement();
    
    consoleErrorSpy.mockRestore();
  });


  test('toggles a character into favorites', async () => {
    renderWithProvider();
    const toggleLukeButton = screen.getByRole('button', { name: 'Toggle Luke' });

    // Initial state
    expect(screen.getByText('Is Luke a favorite? No')).toBeInTheDocument();
    expect(screen.getByText('Count: 0')).toBeInTheDocument();

    // Add to favorites
    await act(async () => {
      await userEvent.click(toggleLukeButton);
    });


    // Assert UI and state update
    expect(screen.getByText('Is Luke a favorite? Yes')).toBeInTheDocument();
    expect(screen.getByText('Count: 1')).toBeInTheDocument();
    expect(screen.getByText('Luke Skywalker,')).toBeInTheDocument();

    // Assert localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'starwars-favorites',
      JSON.stringify([{ uid: '1', name: 'Luke Skywalker' }])
    );
  });

  test('toggles a character out of favorites', async () => {
    const initialFavs = [{ uid: '1', name: 'Luke Skywalker' }];
    localStorage.setItem('starwars-favorites', JSON.stringify(initialFavs));
    
    renderWithProvider();
    const toggleLukeButton = screen.getByRole('button', { name: 'Toggle Luke' });
    
    // Initial state
    expect(screen.getByText('Is Luke a favorite? Yes')).toBeInTheDocument();
    
    // Remove from favorites
    await act(async () => {
      await userEvent.click(toggleLukeButton);
    });
    
    // Assert UI and state update
    expect(screen.getByText('Is Luke a favorite? No')).toBeInTheDocument();
    expect(screen.getByText('Count: 0')).toBeInTheDocument();
    expect(screen.queryByText('Luke Skywalker,')).not.toBeInTheDocument();
    
    // Assert localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'starwars-favorites',
      '[]'
    );
  });
  
  test('does not add a duplicate favorite', async () => {
    renderWithProvider();
    const toggleLukeButton = screen.getByRole('button', { name: 'Toggle Luke' });
    
    // Add once
    await act(async () => {
      await userEvent.click(toggleLukeButton);
    });

    // Try to add again
    await act(async () => {
      await userEvent.click(toggleLukeButton);
    });
    
    expect(screen.getByText('Is Luke a favorite? No')).toBeInTheDocument();
  });


  test('clears all favorites', async () => {
    const initialFavs = [
      { uid: '1', name: 'Luke Skywalker' },
      { uid: '2', name: 'Darth Vader' },
    ];
    localStorage.setItem('starwars-favorites', JSON.stringify(initialFavs));

    renderWithProvider();

    const clearButton = screen.getByRole('button', { name: 'Clear All' });
    expect(screen.getByText('Count: 2')).toBeInTheDocument();

    // Clear favorites
    await act(async () => {
      await userEvent.click(clearButton);
    });

    // Assert UI and state update
    expect(screen.getByText('Count: 0')).toBeInTheDocument();
    expect(screen.getByTestId('favorites-list')).toBeEmptyDOMElement();

    // Assert localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'starwars-favorites',
      '[]'
    );
  });
});
