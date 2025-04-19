// src/components/Poll.js

import React, { useState } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const API_URL = process.env.REACT_APP_API_URL || "https://polling-app-backend-scuj.onrender.com";

function Poll({ poll, onDelete, onUpdate }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [error, setError] = useState("");

  // Retrieve or generate a persistent voter ID
  const getVoterId = () => {
    let voterId = localStorage.getItem("voterId");
    if (!voterId) {
      voterId = uuidv4();
      localStorage.setItem("voterId", voterId);
    }
    return voterId;
  };

  const handleVote = async () => {
    if (selectedOption === null) {
      return setError("Please select an option to vote.");
    }

    try {
      const voterId = getVoterId();
      const response = await axios.post(`${API_URL}/api/polls/${poll.id}/vote`, {
        optionIndex: selectedOption,
        voterId,
      });

      onUpdate(response.data);
      setSelectedOption(null);
      setError("");
    } catch (err) {
      console.error("Error voting:", err);
      setError(err.response?.data?.error || "Failed to submit vote.");
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/api/polls/${poll.id}`);
      onDelete(poll.id);
    } catch (err) {
      console.error("Error deleting poll:", err);
      setError("Failed to delete poll.");
    }
  };

  return (
    <div className="poll-card">
      <h3>{poll.question}</h3>
      {poll.options.length > 0 ? (
        <ul className="poll-options">
          {poll.options.map((option, index) => (
            <li key={index}>
              <label>
                <input
                  type="radio"
                  name={`poll-${poll.id}`}
                  checked={selectedOption === index}
                  onChange={() => setSelectedOption(index)}
                />
                {option.option} ({option.votes} votes)
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p>No options available for this poll.</p>
      )}

      <div className="poll-actions">
        <button onClick={handleVote} disabled={poll.options.length === 0}>
          Vote
        </button>
        <button onClick={handleDelete} className="delete-btn">
          Delete
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

export default Poll;
