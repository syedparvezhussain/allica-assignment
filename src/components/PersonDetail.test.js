import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import "@testing-library/jest-dom";
import PersonDetail from "./PersonDetail";
import { useSwapiPerson } from "../hooks/useSwapi";
import { useFavorites } from "../contexts/FavoritesContext";


jest.mock("../hooks/useSwapi");
jest.mock("../contexts/FavoritesContext");

const mockPerson = {
  uid: "1",
  name: "Luke Skywalker",
  birth_year: "19BBY",
  gender: "male",
  height: "172",
  mass: "77",
  hair_color: "blond",
  eye_color: "blue",
  skin_color: "fair",
  relations: {
    homeworld: {
      name: "Tatooine",
      climate: "arid",
      terrain: "desert",
      population: "200000",
      diameter: "10465",
    },
    films: [
      {
        uid: "4",
        title: "A New Hope",
        episode_id: 4,
        director: "George Lucas",
        release_date: "1977-05-25",
      },
    ],
    species: [],
    starships: [
      {
        uid: "12",
        name: "X-wing",
        model: "T-65 X-wing",
        manufacturer: "Incom Corporation",
        cost_in_credits: "149999",
      },
    ],
    vehicles: [],
  },
};

const renderWithRouter = (ui, { route = "/", path = "/" } = {}) => {
  window.history.pushState({}, "Test page", route);
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={path} element={ui} />
      </Routes>
    </MemoryRouter>
  );
};

describe("PersonDetail", () => {
  beforeEach(() => {
    useFavorites.mockReturnValue({
      isFavorite: jest.fn().mockReturnValue(false),
      toggleFavorite: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("displays loading state", () => {
    useSwapiPerson.mockReturnValue({
      person: null,
      loading: true,
      error: null,
    });
    renderWithRouter(<PersonDetail />, {
      route: "/people/1",
      path: "/people/:id",
    });
    expect(
      screen.getByText("Loading character details...")
    ).toBeInTheDocument();
  });

  test("displays error message", () => {
    useSwapiPerson.mockReturnValue({
      person: null,
      loading: false,
      error: "Character not found",
    });
    renderWithRouter(<PersonDetail />, {
      route: "/people/1",
      path: "/people/:id",
    });
    expect(screen.getByText("Character not found")).toBeInTheDocument();
  });

  test("renders person details and relations", () => {
    useSwapiPerson.mockReturnValue({
      person: mockPerson,
      loading: false,
      error: null,
    });
    renderWithRouter(<PersonDetail />, {
      route: "/people/1",
      path: "/people/:id",
    });

    // Basic info
    expect(
      screen.getByRole("heading", { name: "Luke Skywalker" })
    ).toBeInTheDocument();
    expect(screen.getByText("19BBY")).toBeInTheDocument();
    expect(screen.getByText("male")).toBeInTheDocument();
    expect(screen.getByText("172 cm")).toBeInTheDocument();

    // Relations
    expect(
      screen.getByRole("heading", { name: "Homeworld" })
    ).toBeInTheDocument();
    expect(screen.getByText("Tatooine")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Films" })).toBeInTheDocument();
    expect(screen.getByText("A New Hope")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Starships" })
    ).toBeInTheDocument();
    expect(screen.getByText("X-wing")).toBeInTheDocument();

    // Empty relations
    expect(
      screen.getByText("No species information available.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("No vehicles information available.")
    ).toBeInTheDocument();
  });

  test("calls toggleFavorite when the favorite button is clicked", () => {
    const toggleFavorite = jest.fn();
    useSwapiPerson.mockReturnValue({
      person: mockPerson,
      loading: false,
      error: null,
    });
    useFavorites.mockReturnValue({
      isFavorite: () => false,
      toggleFavorite,
    });
    renderWithRouter(<PersonDetail />, {
      route: "/people/1",
      path: "/people/:id",
    });

    const favoriteButton = screen.getByRole("button", {
      name: /Add to Favorites/i,
    });
    fireEvent.click(favoriteButton);

    expect(toggleFavorite).toHaveBeenCalledWith(mockPerson);
  });

  test("displays correct favorite button text and state", () => {
    useSwapiPerson.mockReturnValue({
      person: mockPerson,
      loading: false,
      error: null,
    });
    useFavorites.mockReturnValue({
      isFavorite: (uid) => uid === "1",
      toggleFavorite: jest.fn(),
    });

    renderWithRouter(<PersonDetail />, {
      route: "/people/1",
      path: "/people/:id",
    });
    const favoriteButton = screen.getByRole("button", {
      name: /Remove from Favorites/i,
    });
    expect(favoriteButton).toBeInTheDocument();
    expect(favoriteButton).toHaveClass("favorited");
  });
});
