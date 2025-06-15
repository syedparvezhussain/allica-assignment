// src/components/PeopleList.test.js

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import "@testing-library/jest-dom";
import PeopleList from "./PeopleList";
import { useSwapi } from "../hooks/useSwapi";
import { useFavorites } from "../contexts/FavoritesContext";

// Mock the hooks our component depends on
jest.mock("../hooks/useSwapi");
jest.mock("../contexts/FavoritesContext");

const mockPeople = [
  { uid: "1", name: "Luke Skywalker", gender: "male", birth_year: "19BBY" },
  { uid: "2", name: "C-3PO", gender: "n/a", birth_year: "112BBY" },
  { uid: "5", name: "Leia Organa", gender: "female", birth_year: "19BBY" },
];

describe("PeopleList", () => {
  // Default mock setup for a clean, successful state
  beforeEach(() => {
    useSwapi.mockReturnValue({
      people: mockPeople,
      arePeopleLoaded: true,
      isSyncing: false,
      error: null,
      progress: { message: "Complete", progress: 100 },
      clearCache: jest.fn(),
    });
    useFavorites.mockReturnValue({
      isFavorite: jest.fn().mockReturnValue(false),
      toggleFavorite: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

test("displays initial loading message when people are not yet loaded", () => {

  useSwapi.mockReturnValue({
    people: [],
    arePeopleLoaded: false,
    isSyncing: true,
    error: null,
    progress: { message: "Loading characters...", progress: 10 },
  });

  render(
    <MemoryRouter>
      <PeopleList />
    </MemoryRouter>
  );


  expect(screen.getByText("Loading characters...", { selector: 'p' })).toBeInTheDocument();


});

  test("displays the list AND a sync progress bar when syncing in background", () => {
    // Mock a state where people are loaded, but a sync is still running
    useSwapi.mockReturnValue({
      people: mockPeople,
      arePeopleLoaded: true,
      isSyncing: true,
      error: null,
      progress: { message: "Syncing planets...", progress: 50 },
    });

    render(
      <MemoryRouter>
        <PeopleList />
      </MemoryRouter>
    );

    // Check that the people list is visible
    expect(screen.getByText("Luke Skywalker")).toBeInTheDocument();

    // Check that the background sync bar is also visible
    expect(screen.getByText("Syncing planets...")).toBeInTheDocument();
  });

  test("displays an error message if fetching fails", () => {
    useSwapi.mockReturnValue({
      people: [],
      arePeopleLoaded: false,
      isSyncing: false,
      error: "Failed to fetch",
    });

    render(
      <MemoryRouter>
        <PeopleList />
      </MemoryRouter>
    );
    expect(screen.getByText("Failed to fetch")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  test("renders a list of people after successful fetch", () => {
    render(
      <MemoryRouter>
        <PeopleList />
      </MemoryRouter>
    );

    // The data is now passed directly, so we don't need to `waitFor` it.
    expect(screen.getByText("Luke Skywalker")).toBeInTheDocument();
    expect(screen.getByText("C-3PO")).toBeInTheDocument();
    expect(screen.getByText("Leia Organa")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Star Wars Characters \(3 total\)/i })
    ).toBeInTheDocument();
  });

  test("filters the list of people based on search term", () => {
    render(
      <MemoryRouter>
        <PeopleList />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText("Search characters...");
    fireEvent.change(searchInput, { target: { value: "leia" } });

    expect(screen.queryByText("Luke Skywalker")).not.toBeInTheDocument();
    expect(screen.queryByText("C-3PO")).not.toBeInTheDocument();
    expect(screen.getByText("Leia Organa")).toBeInTheDocument();
  });

  test("shows a message when search yields no results", () => {
    render(
      <MemoryRouter>
        <PeopleList />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText("Search characters...");
    fireEvent.change(searchInput, { target: { value: "jabba" } });

    expect(
      screen.getByText('No characters found matching "jabba"')
    ).toBeInTheDocument();
  });

  test("calls toggleFavorite when a favorite button is clicked", () => {
    const toggleFavorite = jest.fn();
    useFavorites.mockReturnValue({
      isFavorite: () => false,
      toggleFavorite,
    });

    render(
      <MemoryRouter>
        <PeopleList />
      </MemoryRouter>
    );

    // Get all favorite buttons and click the first one
    const favoriteButtons = screen.getAllByTitle("Add to favorites");
    fireEvent.click(favoriteButtons[0]);

    // Expect the function to be called with the corresponding person object
    expect(toggleFavorite).toHaveBeenCalledWith(mockPeople[0]);
    expect(toggleFavorite).toHaveBeenCalledTimes(1);
  });
});