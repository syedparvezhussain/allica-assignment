import { useParams, Link } from "react-router";
import { useSwapiPerson } from "../hooks/useSwapi";
import { useFavorites } from "../contexts/FavoritesContext";
import "./PersonDetail.css";

function PersonDetail() {
  const { id } = useParams();
  const { person, loading, error } = useSwapiPerson(id);
  const { isFavorite, toggleFavorite } = useFavorites();

  if (loading) {
    return (
      <div className="person-detail-container">
        <div className="detail-loader">
          <p>Loading character details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="person-detail-container">
        <div className="error-message">{error}</div>
        <Link to="/people" className="back-link">
          ← Back to Characters
        </Link>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="person-detail-container">
        <div className="error-message">Character not found.</div>
        <Link to="/people" className="back-link">
          ← Back to Characters
        </Link>
      </div>
    );
  }

  const { relations } = person;

  const handleFavoriteClick = () => {
    toggleFavorite(person);
  };

  return (
    <div className="person-detail-container">
      <Link to="/people" className="back-link">
        ← Back to Characters
      </Link>

      <div className="character-header">
        <h2>{person.name}</h2>
        <button
          onClick={handleFavoriteClick}
          className={`favorite-btn-detail ${
            isFavorite(person.uid) ? "favorited" : ""
          }`}
          title={
            isFavorite(person.uid)
              ? "Remove from favorites"
              : "Add to favorites"
          }
        >
          {isFavorite(person.uid) ? "❤️" : "🤍"}
          {isFavorite(person.uid)
            ? "Remove from Favorites"
            : "Add to Favorites"}
        </button>
      </div>

      <div className="person-properties">
        <div className="property-section">
          <h3>Basic Information</h3>
          <div className="properties-grid">
            <div className="property">
              <strong>Birth Year:</strong> {person.birth_year}
            </div>
            <div className="property">
              <strong>Gender:</strong> {person.gender}
            </div>
            <div className="property">
              <strong>Height:</strong> {person.height} cm
            </div>
            <div className="property">
              <strong>Mass:</strong> {person.mass} kg
            </div>
            <div className="property">
              <strong>Hair Color:</strong> {person.hair_color}
            </div>
            <div className="property">
              <strong>Eye Color:</strong> {person.eye_color}
            </div>
            <div className="property">
              <strong>Skin Color:</strong> {person.skin_color}
            </div>
          </div>
        </div>
      </div>

      {/* Homeworld */}
      <div className="relation-section">
        <h3>Homeworld</h3>
        {relations?.homeworld ? (
          <div className="related-card">
            <h4>{relations.homeworld.name}</h4>
            <div className="card-details">
              <p>
                <strong>Climate:</strong> {relations.homeworld.climate}
              </p>
              <p>
                <strong>Terrain:</strong> {relations.homeworld.terrain}
              </p>
              <p>
                <strong>Population:</strong> {relations.homeworld.population}
              </p>
              <p>
                <strong>Diameter:</strong> {relations.homeworld.diameter} km
              </p>
            </div>
          </div>
        ) : (
          <p className="no-data">No homeworld information available.</p>
        )}
      </div>

      {/* Species */}
      <div className="relation-section">
        <h3>Species</h3>
        {relations?.species?.length > 0 ? (
          <div className="related-grid">
            {relations.species.map((species) => (
              <div key={species.uid} className="related-card">
                <h4>{species.name}</h4>
                <div className="card-details">
                  <p>
                    <strong>Classification:</strong> {species.classification}
                  </p>
                  <p>
                    <strong>Designation:</strong> {species.designation}
                  </p>
                  <p>
                    <strong>Language:</strong> {species.language}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No species information available.</p>
        )}
      </div>

      {/* Starships */}
      <div className="relation-section">
        <h3>Starships</h3>
        {relations?.starships?.length > 0 ? (
          <div className="related-grid">
            {relations.starships.map((starship) => (
              <div key={starship.uid} className="related-card">
                <h4>{starship.name}</h4>
                <div className="card-details">
                  <p>
                    <strong>Model:</strong> {starship.model}
                  </p>
                  <p>
                    <strong>Manufacturer:</strong> {starship.manufacturer}
                  </p>
                  <p>
                    <strong>Cost:</strong> {starship.cost_in_credits} credits
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No starships information available.</p>
        )}
      </div>

      {/* Vehicles */}
      <div className="relation-section">
        <h3>Vehicles</h3>
        {relations?.vehicles?.length > 0 ? (
          <div className="related-grid">
            {relations.vehicles.map((vehicle) => (
              <div key={vehicle.uid} className="related-card">
                <h4>{vehicle.name}</h4>
                <div className="card-details">
                  <p>
                    <strong>Model:</strong> {vehicle.model}
                  </p>
                  <p>
                    <strong>Manufacturer:</strong> {vehicle.manufacturer}
                  </p>
                  <p>
                    <strong>Cost:</strong> {vehicle.cost_in_credits} credits
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No vehicles information available.</p>
        )}
      </div>

      {/* Films */}
      <div className="relation-section">
        <h3>Films</h3>
        {relations?.films?.length > 0 ? (
          <div className="related-grid">
            {relations.films.map((film) => (
              <div key={film.uid} className="related-card">
                <h4>{film.title}</h4>
                <div className="card-details">
                  <p>
                    <strong>Episode:</strong> {film.episode_id}
                  </p>
                  <p>
                    <strong>Director:</strong> {film.director}
                  </p>
                  <p>
                    <strong>Release Date:</strong> {film.release_date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No films information available.</p>
        )}
      </div>
    </div>
  );
}

export default PersonDetail;
