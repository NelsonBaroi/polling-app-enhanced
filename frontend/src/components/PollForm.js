import React, { useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000"; // Replace with your Render URL if deployed

function PollForm({ onPollCreated }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [error, setError] = useState(null);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!question.trim()) {
      setError("Question is required.");
      return;
    }

    if (options.filter((opt) => opt.trim()).length < 2) {
      setError("At least two options are required.");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/polls`, {
        question,
        options: options.filter((opt) => opt.trim()),
      });
      onPollCreated(response.data);
      setQuestion("");
      setOptions(["", ""]);
      setError(null);
    } catch (err) {
      console.error("Error creating poll:", err);
      setError("Failed to create poll. Please try again.");
    }
  };

  // Add a new option field
  const addOption = () => {
    setOptions([...options, ""]);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create a New Poll</h2>
      <div>
        <label>
          Question:
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>Options:</label>
        {options.map((option, index) => (
          <div key={index}>
            <input
              type="text"
              value={option}
              onChange={(e) => {
                const newOptions = [...options];
                newOptions[index] = e.target.value;
                setOptions(newOptions);
              }}
            />
          </div>
        ))}
        <button type="button" onClick={addOption}>
          Add Option
        </button>
      </div>
      <button type="submit">Create Poll</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}

export default PollForm;