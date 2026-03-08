import React from "react";
import "./Head.css";

import { Link } from "react-router-dom";

const Head = () => {
  return (
    <div className="head-section">
      <div className="content-box">
        <h1>
          One Platform for All Your Events, Anytime, Anywhere.
        </h1>

        <p>
          Choose, book, and step into a world of
          unforgettable moments.
        </p>

        <div className="btn-row">
          <button className="btn-primary">
            <Link to="/Events" className="HeadExplore">Explore Events</Link>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Head;
