import React, { useState } from "react";
import axios from "axios";

const API_URL = "https://polling-app-backend-n6zk.onrender.com"; // Replace with your deployed backend URL

function PollForm({ onPollCreated }) {
  const [question, setQuestion] = useState(""); // State for poll question
  const [options, setOptions] = useState(["", ""]); // State for poll options
  const [error, setError] = useState(null); // State to track errors

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate question
    if (!question.trim()) {
      setError("Question is required.");
      return;
    }

    // Validate options (at least two non-empty options are required)
    const validOptions = options.filter((opt) => opt.trim());
    if (validOptions.length < 2) {
      setError("At least two options are required.");
      return;
    }

    try {
      setError(null); // Clear any previous error
      const response = await axios.post(`${API_URL}/api/polls`, {
        question,
        options: validOptions, // Send only non-empty options
      });
      onPollCreated(response.data); // Notify parent component of new poll
      setQuestion(""); // Reset question field
      setOptions(["", ""]); // Reset options fields
    } catch (err) {
      console.error("Error creating poll:", err);
      setError("Failed to create poll. Please try again.");
    }
  };

  // Add a new option field
  const addOption = () => {
    setOptions([...options, ""]);
  };

  // Remove an option field
  const removeOption = (index) => {
    if (options.length > 2) {
      const updatedOptions = options.filter((_, i) => i !== index);
      setOptions(updatedOptions);
    } else {
      setError("You must have at least two options.");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ border: "1px solid #ccc", padding: "16px", margin: "16px 0" }}>
      <h2>Create a New Poll</h2>

      {/* Question Input */}
      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "8px" }}>
          Question:
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </label>
      </div>

      {/* Options Input */}
      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "8px" }}>Options:</label>
        {options.map((option, index) => (
          <div key={index} style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
            <input
              type="text"
              value={option}
              onChange={(e) => {
                const newOptions = [...options];
                newOptions[index] = e.target.value;
                setOptions(newOptions);
              }}
              style={{ flex: 1, padding: "8px" }}
            />
            <button
              type="button"
              onClick={() => removeOption(index)}
              style={{
                marginLeft: "8px",
                padding: "8px 12px",
                background: "#ff4d4d",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addOption}
          style={{
            marginTop: "8px",
            padding: "8px 12px",
            background: "#28a745",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Add Option
        </button>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        style={{
          padding: "10px 20px",
          background: "#007bff",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        Create Poll
      </button>

      {/* Error Message */}
      {error && <p style={{ color: "red", marginTop: "16px" }}>{error}</p>}
    </form>
  );
}

export default PollForm;