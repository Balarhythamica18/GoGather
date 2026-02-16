import React, { useState } from "react";
import { FaFilter } from "react-icons/fa";
import "./Search.css";

const Search = ({ events, setFilteredEvents }) => {
  const [showFilter, setShowFilter] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [category, setCategory] = useState("All");
  const [date, setDate] = useState("");

  const handleSearch = () => {
    const filtered = events.filter((event) => {
      const nameMatch = event.name
        .toLowerCase()
        .includes(searchName.toLowerCase());

      const categoryMatch =
        category === "All" || event.category === category;

      const dateMatch =
        !date || event.date === date;

      return nameMatch && categoryMatch && dateMatch;
    });

    setFilteredEvents(filtered);
    setShowFilter(false); // close after search
  };

  return (
    <div className="search-container">

      {/* Filter Icon */}
      <div className="filter-icon" onClick={() => setShowFilter(!showFilter)}>
        <FaFilter size={22} />
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <div className="filter-panel">

          <div className="field">
            <label>Event Name</label>
            <input
              type="text"
              placeholder="Food Fest"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="All">All</option>
              <option value="Music">Music</option>
              <option value="Food">Food</option>
              <option value="Tech">Tech</option>
            </select>
          </div>

          <div className="field">
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <button onClick={handleSearch}>Apply</button>
        </div>
      )}

    </div>
  );
};

export default Search;
