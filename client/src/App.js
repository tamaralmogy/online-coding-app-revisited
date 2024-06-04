import logo from "./logo.svg";

// src/App.js

import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Lobby from "./Lobby"; // Ensure this import path is correct
import CodeBlock from "./CodeBlock";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/code-block/:id" element={<CodeBlock />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
