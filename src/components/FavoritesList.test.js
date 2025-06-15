import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import "@testing-library/jest-dom";
import { useFavorites } from "../contexts/FavoritesContext";
import FavoritesList from "./FavoritesList";

jest.mock("../contexts/FavoritesContext", () => ({
  useFavorites: jest.fn(),
}));

const mockFavorites = [
  {
    uid: "1",
    name: "Luke Skywalker",
    gender: "male",
    birth_year: "19BBY",
  },
  { uid: "5", name: "Leia Organa", gender: "female", birth_year: "19BBY" },
];

describe("FavoritesList", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("shows a message when there are no favorites", () => {
    useFavorites.mockReturnValue({
      favorites: [],
      removeFromFavorites: jest.fn(),
      clearAllFavorites: jest.fn(),
    });

    render(
      <MemoryRouter>
        <FavoritesList />
      </MemoryRouter>
    );

    expect(
      screen.getByText("You haven't added any favorites yet.")
    ).toBeInTheDocument();
    expect(screen.getByText("Browse Characters")).toBeInTheDocument();
  });

  test("renders a list of favorite characters", () => {
    useFavorites.mockReturnValue({
      favorites: mockFavorites,
      removeFromFavorites: jest.fn(),
      clearAllFavorites: jest.fn(),
    });

    render(
      <MemoryRouter>
        <FavoritesList />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { name: /Your Favorite Characters \(2\)/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Luke Skywalker")).toBeInTheDocument();
    expect(screen.getByText("Leia Organa")).toBeInTheDocument();
  });

  test("calls removeFromFavorites when a remove button is clicked", () => {
    const removeFromFavorites = jest.fn();
    useFavorites.mockReturnValue({
      favorites: mockFavorites,
      removeFromFavorites,
      clearAllFavorites: jest.fn(),
    });

    render(
      <MemoryRouter>
        <FavoritesList />
      </MemoryRouter>
    );

    const removeButtons = screen.getAllByTitle("Remove from favorites");
    fireEvent.click(removeButtons[0]);

    expect(removeFromFavorites).toHaveBeenCalledWith("1");
  });

  test('calls clearAllFavorites when the "Clear All" button is clicked', () => {
    const clearAllFavorites = jest.fn();
    useFavorites.mockReturnValue({
      favorites: mockFavorites,
      removeFromFavorites: jest.fn(),
      clearAllFavorites,
    });

    render(
      <MemoryRouter>
        <FavoritesList />
      </MemoryRouter>
    );

    const clearButton = screen.getByRole("button", { name: "Clear All" });
    fireEvent.click(clearButton);

    expect(clearAllFavorites).toHaveBeenCalledTimes(1);
  });
});
