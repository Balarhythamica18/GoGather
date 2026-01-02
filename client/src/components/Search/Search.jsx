import React from 'react'
import "./Search.css";

const Search = () => {
  return (
    <div className="search-container">
      <div className="search-box">
        <div className="field">
          <label>Search Event</label>
          <input type="text" placeholder="Food Fest" />
        </div>

        <div className="field">
          <label>Place</label>
          <input type="text" placeholder="Chennai" />
        </div>

        <div className="field">
          <label>Time</label>
          <select>
            <option>Any date</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default Search
