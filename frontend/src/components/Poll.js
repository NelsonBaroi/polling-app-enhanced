import React, { useState } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid"; // Import UUID generator

const API_URL = "https://polling-app-backend-n6zk.onrender.com"; // Replace with your deployed backend URL

function Poll({ poll, onDelete, onUpdate }) {
  const [selectedOption, setSelectedOption] = useState(null); // Tracks the selected option for voting
  const [error, setError] = useState(null); // Tracks any errors during voting or deletion

  // Generate or retrieve a unique voter ID for the browser
  const getVoterId = () => {
    let voterId = localStorage.getItem("voterId");
    if (!voterId) {
      voterId = uuidv4(); // Generate a new UUID
      localStorage.setItem("voterId", voterId); // Store it in localStorage
    }
    return voterId;
  };

  // Handle voting
  const handleVote = async () => {
    if (selectedOption === null) {
      setError("Please select an option to vote.");
      return;
    }

    try {
      setError(null); // Clear any previous error
      const voterId = getVoterId(); // Retrieve or generate the voter ID
      const response = await axios.post(`${API_URL}/api/polls/${poll.id}/vote`, {
        optionIndex: selectedOption,
        voterId, // Send the voter ID to the backend
      });
      onUpdate(response.data); // Update the parent component with the updated poll data
      setSelectedOption(null); // Reset the selected option
    } catch (err) {
      console.error("Error voting:", err);
      if (err.response?.data?.error) {
        setError(err.response.data.error); // Display the error message from the backend
      } else {
        setError("Failed to submit vote. Please try again.");
      }
    }
  };

  // Handle deletion
  const handleDelete = async () => {
    try {
      setError(null); // Clear any previous error
      await axios.delete(`${API_URL}/api/polls/${poll.id}`);
      onDelete(poll.id); // Notify the parent component to remove the poll from the list
    } catch (err) {
      console.error("Error deleting poll:", err);
      setError("Failed to delete poll. Please try again.");
    }
  };

  return (
    <div className="poll" style={{ border: "1px solid #ccc", padding: "16px", margin: "16px 0" }}>
      <h3>{poll.question}</h3>
      {poll.options.length > 0 ? (
        <ul>
          {poll.options.map((option, index) => (
            <li key={index}>
              <label>
                <input
                  type="radio"
                  name={`poll-${poll.id}`}
                  value={index}
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
      <div style={{ marginTop: "10px" }}>
        <button onClick={handleVote} disabled={poll.options.length === 0}>
          Vote
        </button>
        <button onClick={handleDelete} style={{ marginLeft: "10px" }}>
          Delete
        </button>
      </div>
      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
    </div>
  );
}

export default Poll;