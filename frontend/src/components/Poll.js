import React, { useState } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const API_URL = process.env.REACT_APP_API_URL;

function Poll({ poll, onDelete, onUpdate }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [error, setError] = useState("");

  const getVoterId = () => {
    let voterId = localStorage.getItem("voterId");
    if (!voterId) {
      voterId = uuidv4();
      localStorage.setItem("voterId", voterId);
    }
    return voterId;
  };

  const handleVote = async () => {
    if (selectedOption === null) return setError("Select an option to vote.");
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
      console.error("Voting error:", err);
      setError("Could not submit vote.");
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/api/polls/${poll.id}`);
      onDelete(poll.id);
    } catch (err) {
      console.error("Delete error:", err);
      setError("Could not delete poll.");
    }
  };

  return (
    <div className="poll">
      <h3>{poll.question}</h3>
      <ul>
        {poll.options.map((option, i) => (
          <li key={i}>
            <label>
              <input
                type="radio"
                name={`poll-${poll.id}`}
                checked={selectedOption === i}
                onChange={() => setSelectedOption(i)}
              />
              {option.option} ({option.votes} votes)
            </label>
          </li>
        ))}
      </ul>
      <div>
        <button onClick={handleVote}>Vote</button>
        <button onClick={handleDelete}>Delete</button>
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default Poll;
