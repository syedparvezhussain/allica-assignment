import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ClearDatabaseButton from "./ClearDatabaseButton";
import swapiDB from "../services/swapiIndexedDB";


jest.mock("../services/swapiIndexedDB", () => ({
  clearAllData: jest.fn(),
}));


global.confirm = jest.fn(() => true);
Object.defineProperty(window, "location", {
  value: {
    reload: jest.fn(),
  },
  writable: true,
});

describe("ClearDatabaseButton", () => {
  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
  });

  test("renders the button and introductory text", () => {
    render(<ClearDatabaseButton />);
    expect(screen.getByText("Clear Cached Data")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Clicking this button will permanently delete all Star Wars data/
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Clear All Cached Star Wars Data/i })
    ).toBeInTheDocument();
  });

  test("shows an error message if clearing the database fails", async () => {
    const errorMessage = "Database is locked";
    swapiDB.clearAllData.mockRejectedValueOnce(new Error(errorMessage));
    render(<ClearDatabaseButton />);

    const clearButton = screen.getByRole("button", {
      name: /Clear All Cached Star Wars Data/i,
    });
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(swapiDB.clearAllData).toHaveBeenCalledTimes(0);
    });

    expect(clearButton).not.toBeDisabled();
    expect(window.location.reload).not.toHaveBeenCalled();
  });

  test("does nothing if the user cancels the confirmation dialog", () => {
    global.confirm.mockReturnValueOnce(false);
    render(<ClearDatabaseButton />);

    const clearButton = screen.getByRole("button", {
      name: /Clear All Cached Star Wars Data/i,
    });
    fireEvent.click(clearButton);

    expect(swapiDB.clearAllData).not.toHaveBeenCalled();
    expect(window.location.reload).not.toHaveBeenCalled();
  });
});
