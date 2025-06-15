Star Wars Character Explorer
This is a React application that allows users to explore characters from the Star Wars universe, view their detailed information, and save their favorite characters. The project is built to be resilient and performant by pre-loading all necessary data from the SWAPI (Star Wars API) into the browser's IndexedDB. This approach provides a seamless offline-first experience after the initial data fetch.

Table of Contents
Setup and Execution

High-Level Application Flow

Architectural Decision: Why IndexedDB?

Pros of this Approach

Setup and Execution
Prerequisites
Node.js (version 14.x or higher)

npm (or yarn)

Installation
Clone the repository:

git clone [https://github.com/syedparvezhussain/allica-assignment.git](https://github.com/syedparvezhussain/allica-assignment.git)

Navigate to the project directory:

cd allica-assignment

Install the dependencies:

npm install

or

yarn install

Running the Project
To start the development server, run:

npm start

or

yarn start

This will open the application in your default browser at http://localhost:3000.

Running Tests
To run the test suite, use the following command:

npm test

or

yarn test

High-Level Application Flow
Initial Load & Data Caching:
When the application first loads, the useSwapi custom hook checks if the Star Wars data is already cached in IndexedDB.

If the data is not cached, it initiates a comprehensive fetch of all required data (people, planets, starships, vehicles, species, and films) from the SWAPI.

During this initial fetch, a progress indicator is displayed to the user, showing the status of the data download.

All fetched data is stored in separate object stores within the browser's IndexedDB.

Displaying the Character List:
Once the data is initialized (either from the cache or after the initial fetch), the PeopleList component retrieves all characters from IndexedDB and displays them in a grid.

Users can search for specific characters using the search bar.

Viewing Character Details:
Clicking on a character card navigates the user to the PersonDetail page.

This component fetches the detailed information for the selected character, along with all their relations (homeworld, films, species, etc.), directly from IndexedDB. This is possible because all the related data has already been fetched and stored.

Favorites Management:
Users can add or remove characters from their favorites list from both the PeopleList and PersonDetail pages.

The FavoritesContext manages the state of the favorite characters, persisting the list in the browser's localStorage.

The FavoritesList component displays all the characters that the user has marked as favorites.

Architectural Decision: Why IndexedDB?
The Challenge with the API
The Star Wars API (SWAPI) is a rich source of data, but it has a limitation that makes building a highly interactive and relational application challenging: the data is hyperlinked, but not embedded.

For instance, when you fetch a character, their films, species, and homeworld are represented as an array of URLs. To get the actual details of each film or the character's homeworld, you would need to make separate API calls for each of those URLs. This would lead to a cascade of network requests, resulting in a slow and inefficient user experience.

The IndexedDB Solution
To overcome this limitation and to build a fast, offline-capable application, a decision was made to pre-fetch all the data and create a local database using IndexedDB.

The swapiIndexedDB.js service is the core of this architecture. It is responsible for:

Fetching all data from the various API endpoints (/people, /planets, etc.).

Storing each entity (person, planet, etc.) in its own object store within IndexedDB.

Resolving relationships locally. When a user views a character's details, the application queries IndexedDB for the character and then uses the stored relational data to look up the full details of their films, starships, and so on. This avoids the need for additional network requests.

Pros of this Approach
Exceptional Performance: After the initial data load, the application becomes incredibly fast. All data is read directly from the local IndexedDB, eliminating network latency.

Offline Capability: Since all the data is stored locally, the application is fully functional without an internet connection after the initial sync.

Reduced API Calls: This architecture significantly reduces the number of calls to the SWAPI. Instead of making numerous small requests, it performs a bulk fetch at the beginning, which is more efficient.

Simplified State Management: By treating IndexedDB as the single source of truth for the Star Wars data, the in-component state management is simplified. Components can declaratively fetch the data they need without worrying about the complexities of making and coordinating multiple API calls.

Improved User Experience: The combination of speed, offline access, and seamless data display provides a superior user experience compared to a traditional API-driven approach for this specific use case.
