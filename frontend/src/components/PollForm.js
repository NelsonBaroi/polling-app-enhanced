import React, { useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

function PollForm({ onPollCreated }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validOptions = options.map((opt) => opt.trim()).filter(Boolean);
    if (!question.trim()) return setError("Question is required.");
    if (validOptions.length < 2) return setError("At least two options are required.");

    try {
      const response = await axios.post(`${API_URL}/api/polls`, {
        question: question.trim(),
        options: validOptions,
      });
      onPollCreated(response.data);
      setQuestion("");
      setOptions(["", ""]);
      setError("");
    } catch (err) {
      console.error("Error creating poll:", err);
      setError("Failed to create poll.");
    }
  };

  const updateOption = (i, value) => {
    const updated = [...options];
    updated[i] = value;
    setOptions(updated);
  };

  const addOption = () => setOptions([...options, ""]);
  const removeOption = (i) => {
    if (options.length > 2) setOptions(options.filter((_, index) => index !== i));
  };

  return (
    <form onSubmit={handleSubmit} style={{ border: "1px solid #ccc", padding: "16px", marginBottom: "20px" }}>
      <h2>Create New Poll</h2>
      <div>
        <label>Question:</label>
        <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} />
      </div>
      <div>
        <label>Options:</label>
        {options.map((opt, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <input
              type="text"
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              style={{ flex: 1 }}
            />
            {options.length > 2 && <button type="button" onClick={() => removeOption(i)}>Remove</button>}
          </div>
        ))}
        <button type="button" onClick={addOption}>Add Option</button>
      </div>
      <button type="submit">Create Poll</button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}

export default PollForm;
