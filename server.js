const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const codeBlocks = [
  { id: 1, name: "Async case", code: "// Async case initial code" },
  { id: 2, name: "Promise example", code: "// Promise example initial code" },
  {
    id: 3,
    name: "Callback function",
    code: "// Callback function initial code",
  },
  { id: 4, name: "Fetch API usage", code: "// Fetch API usage initial code" },
];

// API endpoint to get code blocks
app.get("/", (req, res) => {
  res.json(codeBlocks);
});

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

let users = {}; // Object to keep track of users and roles
let mentorAssigned = false; // Flag to check if the mentor has been assigned
let studentSessions = {};

io.on("connection", (socket) => {
  console.log("New client connected", socket.id);

  // Assign role
  if (!mentorAssigned) {
    users[socket.id] = { role: "mentor" };
    mentorAssigned = true;
    console.log("Mentor connected:", socket.id);
  } else {
    users[socket.id] = { role: "student" };
    console.log("Student connected:", socket.id);
  }
  console.log("Current users:", users);
  socket.emit("role_assignment", { role: users[socket.id].role });

  // Join room specific to a code block
  socket.on("joinRoom", (codeBlockId) => {
    console.log(`Socket ${socket.id} attempting to join room ${codeBlockId}`);
    socket.join(codeBlockId);
    users[socket.id].codeBlockId = codeBlockId;
    console.log(`Socket ${socket.id} joined room ${codeBlockId}`);
    console.log("Current users:", users);

    if (users[socket.id].role === "student") {
      // Create a separate session for each student and each code block
      const sessionKey = `${socket.id}-${codeBlockId}`;
      if (!studentSessions[sessionKey]) {
        const block = codeBlocks.find(
          (block) => block.id === parseInt(codeBlockId)
        );
        studentSessions[sessionKey] = block ? block.code : "";
      }
      socket.emit("loadCode", studentSessions[sessionKey]);

      // Notify the mentor about the new student's session
      const mentorSocketId = Object.keys(users).find(
        (socketId) => users[socketId].role === "mentor"
      );
      if (mentorSocketId) {
        io.to(mentorSocketId).emit("studentJoined", {
          studentId: sessionKey,
          code: studentSessions[sessionKey],
        });
      }
    } else {
      // Mentor gets the code from the general code block
      const block = codeBlocks.find(
        (block) => block.id === parseInt(codeBlockId)
      );
      if (block) {
        socket.emit("loadCode", block.code);
      }

      // Send all student sessions to the mentor
      Object.keys(studentSessions).forEach((sessionKey) => {
        io.to(socket.id).emit("studentJoined", {
          studentId: sessionKey,
          code: studentSessions[sessionKey],
        });
      });
    }
  });

  socket.on("codeChange", ({ id, code }) => {
    const sessionKey = `${socket.id}-${id}`;
    if (users[socket.id].role === "student") {
      studentSessions[sessionKey] = code; // Update the student's session code

      // Find the mentor in the room and send the update to the mentor only
      const mentorSocketId = Object.keys(users).find(
        (socketId) => users[socketId].role === "mentor"
      );

      if (mentorSocketId) {
        io.to(mentorSocketId).emit("updateCode", {
          studentId: sessionKey,
          code,
        });
      }
    } else {
      const blockIndex = codeBlocks.findIndex(
        (block) => block.id === parseInt(id)
      );
      if (blockIndex !== -1) {
        codeBlocks[blockIndex].code = code;

        // Broadcast the updated code to all clients in the room
        io.to(id).emit("updateCode", code);
      }
    }
  });
  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
    if (users[socket.id]?.role === "mentor") {
      mentorAssigned = false;
      console.log("Mentor disconnected, position is now open");
    }

    if (users[socket.id]?.role === "student") {
      const sessionKey = `${socket.id}-${users[socket.id].codeBlockId}`;
      const mentorSocketId = Object.keys(users).find(
        (socketId) => users[socketId].role === "mentor"
      );
      if (mentorSocketId) {
        io.to(mentorSocketId).emit("studentLeft", { studentId: sessionKey });
      }
      delete studentSessions[sessionKey]; // Clean up the student's session
    }

    delete users[socket.id];
    delete studentSessions[socket.id]; // Clean up the student's session
    console.log("Updated users after disconnect:", users);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
