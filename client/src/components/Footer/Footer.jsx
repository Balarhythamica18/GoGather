import React from "react";
import "./Footer.css";
import logo from "../../assets/logo.png";
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
            <img src={logo} alt="GoGather Logo" />
          </div>
          <p className="footer-description">
            GoGather is a modern self-service event ticketing platform
            that empowers anyone to create, promote, discover and
            attend events with ease. From concerts and conferences
            to workshops and local meetups, GoGather makes event
            experiences simple, seamless, and accessible for everyone.
          </p>

          <div className="footer-socials">
           <img src={fb} alt="Facebook" />
           <img src={twitter} alt="Twitter" />
           <img src={linkedin} alt="LinkedIn" />
          </div>
        </div>

        {/* Links */}
        <div className="footer-links">
          <h4>Plan Events</h4>
          <ul>
            <li><a href="#">Create and Set Up</a></li>
            <li><a href="#">Sell Tickets</a></li>
            <li><a href="#">Online RSVP</a></li>
            <li><a href="#">Online Events</a></li>
          </ul>
        </div>

        <div className="footer-links">
          <h4>Go Gather</h4>
          <ul>
            <li><a href="#">About Us</a></li>
            <li><a href="#">Press</a></li>
            <li><a href="#">Contact Us</a></li>
            <li><a href="#">Help Center</a></li>
            <li><a href="#">How it Works</a></li>
            <li><a href="#">Privacy</a></li>
            <li><a href="#">Terms</a></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div className="footer-newsletter">
          <h4>Stay In The Loop</h4>
          <p>
            Join our mailing list to stay in the loop with our newest
            features and event content.
          </p>

          <div className="newsletter-form">
            <input type="email" placeholder="Enter your email address" />
            <button>Subscribe Now</button>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        Copyright © 2025 Balarhythamica
      </div>
    </footer>
  );
};

export default Footer;
