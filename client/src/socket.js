// src/socket.js

import { io } from "socket.io-client";

const socket = io("https://coding-app-server-production.up.railway.app");

export default socket;
