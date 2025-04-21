import React, { useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/login`, {
        username,
        password,
      });
      localStorage.setItem("token", response.data.token);
      setUsername("");
      setPassword("");
      setError("");
      onLogin();
    } catch (err) {
      console.error("Login failed:", err);
      setError("Invalid credentials or server error.");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ border: "1px solid #ccc", padding: "16px", marginBottom: "20px" }}>
      <h2>Login</h2>

      <div>
        <label>Username:</label>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>

      <div>
        <label>Password:</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>

      <button type="submit">Login</button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}

export default LoginForm;
