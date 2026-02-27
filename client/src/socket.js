import io from "socket.io-client";

// Centralized socket connection
const socket = io("https://gogather-server.onrender.com");

export default socket;
