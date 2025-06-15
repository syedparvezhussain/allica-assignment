// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import { FavoritesProvider } from './contexts/FavoritesContext';
import Navigation from './components/Navigation';
import PeopleList from './components/PeopleList';
import PersonDetail from './components/PersonDetail';
import FavoritesList from './components/FavoritesList';
import './App.css';

function App() {
  return (
    <FavoritesProvider>
      <Router>
        <div className="App">
          <Navigation />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/people" replace />} />
              <Route path="/people" element={<PeopleList />} />
              <Route path="/people/:id" element={<PersonDetail />} />
              <Route path="/favorites" element={<FavoritesList />} />
            </Routes>
          </main>
        </div>
      </Router>
    </FavoritesProvider>
  );
}

export default App;