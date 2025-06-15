import { Link, useLocation } from "react-router";
import { useFavorites } from "../contexts/FavoritesContext";
import "./Navigation.css";

function Navigation() {
  const location = useLocation();
  const { favoritesCount } = useFavorites();

  const isActive = (path) => {
    if (path === "/people") {
      return (
        location.pathname === "/people" ||
        location.pathname.startsWith("/people/")
      );
    }
    return location.pathname === path;
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/people" className="nav-brand">
          ⭐ Star Wars Explorer
        </Link>

        <div className="nav-links">
          <Link
            to="/people"
            className={`nav-link ${isActive("/people") ? "active" : ""}`}
          >
            Characters
          </Link>

          <Link
            to="/favorites"
            className={`nav-link ${isActive("/favorites") ? "active" : ""}`}
          >
            Favorites
            {favoritesCount > 0 && (
              <span className="favorites-badge">{favoritesCount}</span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
