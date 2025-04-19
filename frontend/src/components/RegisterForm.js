import React, { useState } from "react";
import axios from "axios";

const API_URL = "https://polling-app-backend-scuj.onrender.com";

function RegisterForm({ onRegister }) {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username.trim() || !formData.password.trim()) {
      setError("Username and password are required.");
      return;
    }

    try {
      setError(null);
      await axios.post(`${API_URL}/api/register`, formData);
      onRegister();
      setFormData({ username: "", password: "" });
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.response?.data?.error || "Failed to register. Please try again.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        border: "1px solid #ccc",
        padding: "16px",
        margin: "16px 0",
        borderRadius: "8px",
        maxWidth: "400px",
      }}
    >
      <h2>Register</h2>

      <label style={{ display: "block", marginBottom: "12px" }}>
        Username:
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          style={{
            width: "100%",
            padding: "8px",
            marginTop: "4px",
            boxSizing: "border-box",
          }}
        />
      </label>

      <label style={{ display: "block", marginBottom: "12px" }}>
        Password:
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          style={{
            width: "100%",
            padding: "8px",
            marginTop: "4px",
            boxSizing: "border-box",
          }}
        />
      </label>

      <button
        type="submit"
        style={{
          padding: "10px 20px",
          background: "#28a745",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          borderRadius: "4px",
        }}
      >
        Register
      </button>

      {error && <p style={{ color: "red", marginTop: "12px" }}>{error}</p>}
    </form>
  );
}

export default RegisterForm;
