// src/components/PeopleList.js

import React, { useState, useMemo } from "react";
import { Link } from "react-router";
import { useSwapi } from "../hooks/useSwapi";
import { useFavorites } from "../contexts/FavoritesContext";
import ClearDatabaseButton from "./ClearDatabaseButton";
import "./PeopleList.css";


function PeopleList() {
  const { people, arePeopleLoaded, isSyncing, error, progress } = useSwapi();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPeople = useMemo(() => {
    if (!searchTerm.trim()) return people;
    return people.filter((person) =>
      person.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [people, searchTerm]);

  const handleFavoriteClick = (e, person) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(person);
  };

  if (error) {
    return (
      <div className="people-list-container">
        <h2>Star Wars Characters</h2>
        <div className="error-message">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="retry-button"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="people-list-container">
      {/* New: Global progress bar for background sync */}
      {isSyncing && (
        <div className="sync-progress-container">
          <div className="progress-message">{progress.message}</div>
          {progress.currentEntity && (
            <div className="current-entity">
              Syncing: {progress.currentEntity}
            </div>
          )}
          {progress.progress > 0 && (
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{ width: `${progress.progress}%` }}
              ></div>
            </div>
          )}
        </div>
      )}

      <h2>Star Wars Characters ({arePeopleLoaded ? people.length : "..."} total)</h2>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search characters..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Conditional rendering for the grid */}
      {!arePeopleLoaded ? (
        <div className="initial-load-message">
          <p>Loading characters...</p>
          <p className="loading-note">
            This may take a few moments on first load...
          </p>
        </div>
      ) : (
        <>
          {filteredPeople.length === 0 && searchTerm && (
            <p className="no-results">
              No characters found matching "{searchTerm}"
            </p>
          )}

          <div className="people-grid">
            {filteredPeople.map((person) => (
              <div key={person.uid} className="person-card">
                <button
                  onClick={(e) => handleFavoriteClick(e, person)}
                  className={`favorite-btn ${
                    isFavorite(person.uid) ? "favorited" : ""
                  }`}
                  title={
                    isFavorite(person.uid)
                      ? "Remove from favorites"
                      : "Add to favorites"
                  }
                >
                  {isFavorite(person.uid) ? "❤️" : "🤍"}
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

          {filteredPeople.length > 0 && (
            <div className="data-info">
              <p>
                {isSyncing
                  ? "Background data sync in progress..."
                  : "All character data cached locally for instant access!"}
              </p>
              <ClearDatabaseButton />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PeopleList;