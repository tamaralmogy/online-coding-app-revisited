// src/Lobby.js

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "./socket";

const Lobby = () => {
  const [codeBlocks, setCodeBlocks] = useState([]);
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("https://coding-app-server-production.up.railway.app")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Received data:", data);
        setCodeBlocks(data);
      })
      .catch((error) => console.error("Error fetching code blocks:", error));

    socket.on("role_assignment", (data) => {
      console.log("Your role is:", data.role);
      setRole(data.role);
    });

    return () => {
      socket.off("role_assignment");
    };
  }, []);

  const handleSelectBlock = (id) => {
    navigate(`/code-block/${id}`, { state: { role } });
  };

  return (
    <div>
      <h1>Welcome to the Lobby</h1>
      <h2>Choose code block</h2>
      <ul>
        {codeBlocks.map((block) => (
          <li key={block.id} onClick={() => handleSelectBlock(block.id)}>
            {block.name}
          </li>
        ))}
      </ul>
      <p>Check the console for your role!</p>
    </div>
  );
};

export default Lobby;
