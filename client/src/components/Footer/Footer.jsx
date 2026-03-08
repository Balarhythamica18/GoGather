import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";
import Logo from "../common/Logo";
import fb from "../../assets/fb.png";
import twitter from "../../assets/twitter.png";
import linkedin from "../../assets/linkedin.png";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Left Section */}
        <div className="footer-brand">
          <div className="footer-logo">
            <Logo variant="light" />
          </div>
          <p className="footer-description">
            GoGather is a modern event ticketing platform that empowers
            communities to create, promote, discover and attend
            extraordinary events with ease.
          </p>

          <div className="footer-socials">
            <img src={fb} alt="Facebook" />
            <img src={twitter} alt="Twitter" />
            <img src={linkedin} alt="LinkedIn" />
          </div>
        </div>

        {/* Links */}
        <div className="footer-links">
          <h4>Explore</h4>
          <ul>
            <li><Link to="/events">Browse Events</Link></li>
            <li><Link to="/my-bookings">My Tickets</Link></li>
            <li><Link to="/favorites">Favorites</Link></li>
          </ul>
        </div>

        <div className="footer-links">
          <h4>GoGather</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><a href="#">Help Center</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div className="footer-newsletter">
          <h4>Stay Connected</h4>
          <p>
            Join our mailing list to stay in the loop with the newest
            events and community features.
          </p>

          <div className="newsletter-form">
            <input type="email" placeholder="Enter your email" />
            <button>Subscribe Now</button>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        Copyright © {new Date().getFullYear()} Balarhythamica · GoGather
      </div>
    </footer>
  );
};

export default Footer;
