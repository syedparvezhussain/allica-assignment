import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router";
import "@testing-library/jest-dom";
import Navigation from "./Navigation";
import { useFavorites } from "../contexts/FavoritesContext";


jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useLocation: jest.fn(),
}));
jest.mock("../contexts/FavoritesContext", () => ({
  useFavorites: jest.fn(),
}));

describe("Navigation", () => {
  beforeEach(() => {
    useFavorites.mockReturnValue({ favoritesCount: 0 });
  });

  test("renders navigation links", () => {
    useLocation.mockReturnValue({ pathname: "/people" });
    render(
      <MemoryRouter>
        <Navigation />
      </MemoryRouter>
    );
    expect(screen.getByText("⭐ Star Wars Explorer")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Characters" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Favorites" })).toBeInTheDocument();
  });

  test("applies active class to Characters link on /people route", () => {
    useLocation.mockReturnValue({ pathname: "/people" });
    render(
      <MemoryRouter>
        <Navigation />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: "Characters" })).toHaveClass(
      "active"
    );
    expect(screen.getByRole("link", { name: "Favorites" })).not.toHaveClass(
      "active"
    );
  });

  test("applies active class to Characters link on /people/:id route", () => {
    useLocation.mockReturnValue({ pathname: "/people/1" });
    render(
      <MemoryRouter>
        <Navigation />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: "Characters" })).toHaveClass(
      "active"
    );
    expect(screen.getByRole("link", { name: "Favorites" })).not.toHaveClass(
      "active"
    );
  });

  test("applies active class to Favorites link on /favorites route", () => {
    useLocation.mockReturnValue({ pathname: "/favorites" });
    render(
      <MemoryRouter>
        <Navigation />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: "Favorites" })).toHaveClass(
      "active"
    );
    expect(screen.getByRole("link", { name: "Characters" })).not.toHaveClass(
      "active"
    );
  });

  test("displays favorites count badge when there are favorites", () => {
    useLocation.mockReturnValue({ pathname: "/people" });
    useFavorites.mockReturnValue({ favoritesCount: 3 });
    render(
      <MemoryRouter>
        <Navigation />
      </MemoryRouter>
    );
    const badge = screen.getByText("3");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("favorites-badge");
  });

  test("does not display favorites count badge when there are no favorites", () => {
    useLocation.mockReturnValue({ pathname: "/people" });
    useFavorites.mockReturnValue({ favoritesCount: 0 });
    render(
      <MemoryRouter>
        <Navigation />
      </MemoryRouter>
    );
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});
