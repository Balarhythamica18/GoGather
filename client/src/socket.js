import io from "socket.io-client";
import { API_BASE_URL } from "./config";

// Centralized socket connection
const socket = io(API_BASE_URL, {
    transports: ['polling', 'websocket']
});

export default socket;
