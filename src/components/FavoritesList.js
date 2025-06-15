// src/components/FavoritesList.js
import React from "react";
import { Link } from "react-router";
import { useFavorites } from "../contexts/FavoritesContext";
import "./FavoritesList.css";

function FavoritesList() {
  const { favorites, removeFromFavorites, clearAllFavorites } = useFavorites();

  if (favorites.length === 0) {
    return (
      <div className="favorites-list-container">
        <h2>Your Favorite Characters</h2>
        <div className="empty-favorites">
          <p>You haven't added any favorites yet.</p>
          <Link to="/people" className="browse-link">
            Browse Characters
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-list-container">
      <div className="favorites-header">
        <h2>Your Favorite Characters ({favorites.length})</h2>
        <button
          onClick={clearAllFavorites}
          className="clear-favorites-btn"
          title="Clear all favorites"
        >
          Clear All
        </button>
      </div>

      <div className="favorites-grid">
        {favorites.map((person) => (
          <div key={person.uid} className="favorite-card">
            <button
              onClick={() => removeFromFavorites(person.uid)}
              className="remove-favorite-btn"
              title="Remove from favorites"
            >
              ❤️
            </button>

            <Link to={`/people/${person.uid}`}>
              <h3>{person.name}</h3>
              <div className="person-preview">
                <p>Gender: {person.gender}</p>
                <p>Birth Year: {person.birth_year}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <div className="favorites-actions">
        <Link to="/people" className="browse-link">
          Browse More Characters
        </Link>
      </div>
    </div>
  );
}

export default FavoritesList;
