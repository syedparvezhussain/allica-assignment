
import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { useSwapi } from "../hooks/useSwapi";
import { useFavorites } from "../contexts/FavoritesContext";
import ClearDatabaseButton from "./ClearDatabaseButton";
import "./PeopleList.css";

function PeopleList() {
  const { isInitialized, isLoading, error, progress, getAllPeople } =
    useSwapi();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [people, setPeople] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Load people once initialization is complete
  useEffect(() => {
    if (isInitialized) {
      getAllPeople()
        .then(setPeople)
        .catch((err) => console.error("Error loading people:", err));
    }
  }, [isInitialized, getAllPeople]);

  // Filter people based on search term
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

  if (isLoading) {
    return (
      <div className="people-list-container">
        <h2>Star Wars Characters</h2>
        <div className="initialization-progress">
          <div className="progress-message">{progress.message}</div>
          {progress.currentEntity && (
            <div className="current-entity">
              Processing: {progress.currentEntity}
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
        <p className="loading-note">
          This may take a few minutes on first load as we fetch and cache all
          Star Wars data...
        </p>
      </div>
    );
  }

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
      <h2>Star Wars Characters ({people.length} total)</h2>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search characters..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

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
          <p>All character data cached locally for instant access!</p>
          <ClearDatabaseButton />
        </div>
      )}
    </div>
  );
}

export default PeopleList;
