import React, { useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000"; // Replace with your Render URL if deployed

function RegisterForm({ onRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${API_URL}/api/register`, {
        username,
        password,
      });
      onRegister();
      setError(null);
    } catch (err) {
      console.error("Error registering:", err);
      setError("Failed to register. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>
      <div>
        <label>
          Username:
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
      </div>
      <button type="submit">Register</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}

export default RegisterForm;