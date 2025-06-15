import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import "@testing-library/jest-dom";
import PeopleList from "./PeopleList";
import { useSwapi } from "../hooks/useSwapi";
import { useFavorites } from "../contexts/FavoritesContext";


jest.mock("../hooks/useSwapi");
jest.mock("../contexts/FavoritesContext");

const mockPeople = [
  { uid: "1", name: "Luke Skywalker", gender: "male", birth_year: "19BBY" },
  { uid: "2", name: "C-3PO", gender: "n/a", birth_year: "112BBY" },
  { uid: "5", name: "Leia Organa", gender: "female", birth_year: "19BBY" },
];

describe("PeopleList", () => {

  beforeEach(() => {
    useSwapi.mockReturnValue({
      isInitialized: true,
      isLoading: false,
      error: null,
      progress: {},
      getAllPeople: jest.fn().mockResolvedValue(mockPeople),
    });
    useFavorites.mockReturnValue({
      isFavorite: jest.fn().mockReturnValue(false),
      toggleFavorite: jest.fn(),
    });
  });


  afterEach(() => {
    jest.clearAllMocks();
  });

  test("displays loading state initially", () => {
    
    useSwapi.mockReturnValue({
      isInitialized: false,
      isLoading: true,
      error: null,
      progress: { message: "Fetching data...", progress: 50 },
      getAllPeople: jest.fn(),
    });
    render(
      <MemoryRouter>
        <PeopleList />
      </MemoryRouter>
    );
    expect(screen.getByText("Fetching data...")).toBeInTheDocument();
 
  });

  test("displays an error message if fetching fails", () => {
    useSwapi.mockReturnValue({
      isInitialized: false,
      isLoading: false,
      error: "Failed to fetch",
      progress: {},
      getAllPeople: jest.fn(),
    });
    render(
      <MemoryRouter>
        <PeopleList />
      </MemoryRouter>
    );
    expect(screen.getByText("Failed to fetch")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  test("renders a list of people after successful fetch", async () => {
    render(
      <MemoryRouter>
        <PeopleList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Luke Skywalker")).toBeInTheDocument();
    });
    expect(screen.getByText("C-3PO")).toBeInTheDocument();
    expect(screen.getByText("Leia Organa")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Star Wars Characters \(3 total\)/i })
    ).toBeInTheDocument();
  });

  test("filters the list of people based on search term", async () => {
    render(
      <MemoryRouter>
        <PeopleList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Luke Skywalker")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search characters...");
    fireEvent.change(searchInput, { target: { value: "leia" } });

    expect(screen.queryByText("Luke Skywalker")).not.toBeInTheDocument();
    expect(screen.queryByText("C-3PO")).not.toBeInTheDocument();
    expect(screen.getByText("Leia Organa")).toBeInTheDocument();
  });

  test("shows a message when search yields no results", async () => {
    render(
      <MemoryRouter>
        <PeopleList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Luke Skywalker")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search characters...");
    fireEvent.change(searchInput, { target: { value: "jabba" } });

    expect(
      screen.getByText('No characters found matching "jabba"')
    ).toBeInTheDocument();
  });

  test("calls toggleFavorite when a favorite button is clicked", async () => {
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

    await waitFor(() => {
      expect(screen.getByText("Luke Skywalker")).toBeInTheDocument();
    });

    const favoriteButtons = screen.getAllByTitle("Add to favorites");
    fireEvent.click(favoriteButtons[0]);

    expect(toggleFavorite).toHaveBeenCalledWith(mockPeople[0]);
  });
});
