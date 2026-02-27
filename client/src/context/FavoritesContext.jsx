import React, { createContext, useContext, useEffect, useState } from "react";

const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
  const [userId, setUserId] = useState(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    return user ? user._id : null;
  });

  const [favorites, setFavorites] = useState([]);

  // Function to load favorites for the current user
  const loadFavorites = (uid) => {
    const key = uid ? `favorites_${uid}` : "favorites_guest";
    const stored = localStorage.getItem(key);
    setFavorites(JSON.parse(stored) || []);
  };

  useEffect(() => {
    const handleStorage = () => {
      const user = JSON.parse(localStorage.getItem("user"));
      const newUid = user ? user._id : null;
      if (newUid !== userId) {
        setUserId(newUid);
      }
    };

    window.addEventListener("storageChange", handleStorage);
    window.addEventListener("storage", handleStorage);

    // Initial load
    loadFavorites(userId);

    return () => {
      window.removeEventListener("storageChange", handleStorage);
      window.removeEventListener("storage", handleStorage);
    };
  }, [userId]);

  useEffect(() => {
    const key = userId ? `favorites_${userId}` : "favorites_guest";
    localStorage.setItem(key, JSON.stringify(favorites));
  }, [favorites, userId]);

  const addFavorite = (event) => {
    setFavorites((prev) =>
      prev.some((e) => e.id === event.id) ? prev : [...prev, event]
    );
  };

  const removeFavorite = (id) => {
    setFavorites((prev) => prev.filter((e) => e.id !== id));
  };

  const isFavorite = (id) => {
    return favorites.some((e) => e.id === id);
  };

  return (
    <FavoritesContext.Provider
      value={{ favorites, addFavorite, removeFavorite, isFavorite }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoritesContext);
