import React, { useState } from "react";
import axios from "axios";

const API_URL = "https://polling-app-backend-scuj.onrender.com"; // Replace with your deployed backend URL

function RegisterForm({ onRegister }) {
  const [username, setUsername] = useState(""); // State for username input
  const [password, setPassword] = useState(""); // State for password input
  const [error, setError] = useState(null); // State to track errors

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }

    try {
      setError(null); // Clear any previous error
      await axios.post(`${API_URL}/api/register`, {
        username,
        password,
      });

      // Notify parent component of successful registration
      onRegister();
      setUsername(""); // Reset username field
      setPassword(""); // Reset password field
    } catch (err) {
      console.error("Error registering:", err);
      setError(
        err.response?.data?.error || "Failed to register. Please try again."
      ); // Display error message from backend or fallback
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ border: "1px solid #ccc", padding: "16px", margin: "16px 0" }}>
      <h2>Register</h2>

      {/* Username Input */}
      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "8px" }}>
          Username:
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              marginTop: "4px",
              boxSizing: "border-box",
            }}
          />
        </label>
      </div>

      {/* Password Input */}
      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "8px" }}>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              marginTop: "4px",
              boxSizing: "border-box",
            }}
          />
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        style={{
          padding: "10px 20px",
          background: "#28a745",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        Register
      </button>

      {/* Error Message */}
      {error && <p style={{ color: "red", marginTop: "16px" }}>{error}</p>}
    </form>
  );
}

export default RegisterForm;