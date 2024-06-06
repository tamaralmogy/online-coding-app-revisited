// src/CodeBlockDetail.js

// import React from "react";
import { useParams, useLocation } from "react-router-dom";
import React, { useEffect, useState, useRef } from "react";
import socket from "./socket";

const CodeBlock = () => {
  const { id } = useParams();
  const location = useLocation();
  const [code, setCode] = useState("");
  const [studentCodes, setStudentCodes] = useState({});
  const textareaRef = useRef(null);
  const role = location.state?.role || "student";

  console.log(role);

  useEffect(() => {
    console.log(`Joining room: ${id}`);
    socket.emit("joinRoom", id);

    socket.on("loadCode", (loadedCode) => {
      console.log(`Loaded code for room ${id}: ${loadedCode}`);
      setCode(loadedCode);
    });

    socket.on("updateCode", ({ studentId, code }) => {
      console.log(`Code updated by student ${studentId}: ${code}`);
      setStudentCodes((prev) => ({ ...prev, [studentId]: code }));
    });

    socket.on("studentLeft", ({ studentId }) => {
      console.log(`Student ${studentId} left`);
      setStudentCodes((prev) => {
        const updated = { ...prev };
        delete updated[studentId];
        return updated;
      });
    });

    // Cleanup on unmount
    return () => {
      socket.off("loadCode");
      socket.off("updateCode");
      socket.off("studentJoined");
      socket.off("studentLeft");
    };
  }, [id]);

  // no need for useEffect, event driven
  const handleCodeChange = (event) => {
    const updatedCode = event.target.value;
    setCode(updatedCode);
    socket.emit("codeChange", { id, code: updatedCode });
  };

  return (
    <div>
      <h1>Code Block: {id}</h1>
      <textarea
        ref={textareaRef}
        value={code}
        onChange={handleCodeChange}
        readOnly={role === "mentor"}
        style={{
          width: "100%",
          height: "300px",
          fontFamily: '"Fira code", "Fira Mono", monospace',
          fontSize: 16,
          padding: "10px",
          border: "1px solid #ddd",
          borderRadius: "4px",
          whiteSpace: "pre-wrap",
          overflowWrap: "break-word",
        }}
      />
      {role === "mentor" && (
        <div>
          <h2>Student's Code Blocks</h2>
          {Object.keys(studentCodes).map((studentId) => (
            <div key={studentId}>
              <h3>Student {studentId}</h3>
              <pre
                style={{
                  width: "100%",
                  height: "300px",
                  fontFamily: '"Fira code", "Fira Mono", monospace',
                  fontSize: 16,
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "break-word",
                }}
              >
                {studentCodes[studentId]}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CodeBlock;
