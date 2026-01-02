import React, { createContext, useContext, useEffect, useState } from "react";

const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(() => {
    return JSON.parse(localStorage.getItem("favorites")) || [];
  });

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

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
