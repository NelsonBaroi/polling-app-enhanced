// src/components/PollForm.js

import React, { useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "https://polling-app-backend-scuj.onrender.com";

function PollForm({ onPollCreated }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedQuestion = question.trim();
    const validOptions = options.map((opt) => opt.trim()).filter(Boolean);

    if (!trimmedQuestion) {
      return setError("Question is required.");
    }

    if (validOptions.length < 2) {
      return setError("At least two valid options are required.");
    }

    try {
      const response = await axios.post(`${API_URL}/api/polls`, {
        question: trimmedQuestion,
        options: validOptions,
      });

      onPollCreated(response.data);
      setQuestion("");
      setOptions(["", ""]);
      setError("");
    } catch (err) {
      console.error("Error creating poll:", err);
      setError("Failed to create poll. Please try again.");
    }
  };

  const handleOptionChange = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    } else {
      setError("You must have at least two options.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="poll-form">
      <h2>Create a New Poll</h2>

      <div className="form-group">
        <label>Question:</label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter your poll question"
        />
      </div>

      <div className="form-group">
        <label>Options:</label>
        {options.map((option, index) => (
          <div key={index} className="option-input">
            <input
              type="text"
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
            />
            <button type="button" onClick={() => removeOption(index)} className="remove-btn">
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={addOption} className="add-btn">
          Add Option
        </button>
      </div>

      <button type="submit" className="submit-btn">
        Create Poll
      </button>

      {error && <p className="error-text">{error}</p>}
    </form>
  );
}

export default PollForm;
