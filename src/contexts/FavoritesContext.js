// src/contexts/FavoritesContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('starwars-favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('Error parsing favorites from localStorage:', error);
        setFavorites([]);
      }
    }
  }, []);

  // Save favorites to localStorage whenever favorites change
  useEffect(() => {
    localStorage.setItem('starwars-favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addToFavorites = (person) => {
    setFavorites(prev => {
      // Check if already in favorites
      if (prev.some(fav => fav.uid === person.uid)) {
        return prev;
      }
      return [...prev, person];
    });
  };

  const removeFromFavorites = (uid) => {
    setFavorites(prev => prev.filter(fav => fav.uid !== uid));
  };

  const isFavorite = (uid) => {
    return favorites.some(fav => fav.uid === uid);
  };

  const toggleFavorite = (person) => {
    if (isFavorite(person.uid)) {
      removeFromFavorites(person.uid);
    } else {
      addToFavorites(person);
    }
  };

  const clearAllFavorites = () => {
    setFavorites([]);
  };

  const value = {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    toggleFavorite,
    clearAllFavorites,
    favoritesCount: favorites.length
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};