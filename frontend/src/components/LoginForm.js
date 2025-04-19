import React, { useState } from "react";
import axios from "axios";

const API_URL = "https://polling-app-backend-n6zk.onrender.com"; // Replace with your Render URL if deployed

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${API_URL}/api/login`, {
        username,
        password,
      });
      localStorage.setItem("token", response.data.token);
      onLogin();
      setError(null);
    } catch (err) {
      console.error("Error logging in:", err);
      setError("Invalid username or password.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
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
      <button type="submit">Login</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}

export default LoginForm;