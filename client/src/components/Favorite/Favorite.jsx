import React from "react";
import { useFavorites } from "../../context/FavoritesContext";
import "./Favorite.css";

const Favorite = () => {
  const { favorites, removeFavorite } = useFavorites();

  if (favorites.length === 0) {
    return <h2 style={{ padding: "20px" }}>No favorite events ❤️</h2>;
  }

  return (
    <div className="favorite-page">
      <h1>My Favorites</h1>

      {favorites.map((event) => (
        <div key={event.id} className="favorite-card">
          <img src={event.image} alt={event.title} />
          
          <div>
            <p>{event.title}</p>
            <button>Book Now</button>
          </div>

          <button onClick={() => removeFavorite(event.id)}>❌</button>
        </div>
      ))}
    </div>
  );
};

export default Favorite;
