import React, { useEffect, useState } from "react";
import axios from "axios";
import PollForm from "./components/PollForm";
import Poll from "./components/Poll";
import RegisterForm from "./components/RegisterForm";
import io from "socket.io-client";

const API_URL = "https://polling-app-backend-scuj.onrender.com";

function App() {
  const [polls, setPolls] = useState([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [socket, setSocket] = useState(null);

  // Fetch polls on load
  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/polls`);
        setPolls(response.data);
      } catch (error) {
        console.error("Failed to fetch polls:", error);
      }
    };

    fetchPolls();
  }, []);

  // Connect to WebSocket after registration
  useEffect(() => {
    if (isRegistered) {
      const socketInstance = io(API_URL);
      setSocket(socketInstance);

      socketInstance.on("pollUpdated", (updatedPoll) => {
        setPolls((prevPolls) =>
          prevPolls.map((poll) =>
            poll.id === updatedPoll.id ? updatedPoll : poll
          )
        );
      });

      return () => socketInstance.disconnect();
    }
  }, [isRegistered]);

  // Add new poll to list
  const handlePollCreated = (newPoll) => {
    setPolls((prevPolls) => [...prevPolls, newPoll]);
  };

  // Remove poll from list
  const handleDeletePoll = (pollId) => {
    setPolls((prevPolls) => prevPolls.filter((poll) => poll.id !== pollId));
  };

  // Update poll after voting
  const handleUpdatePoll = (updatedPoll) => {
    setPolls((prevPolls) =>
      prevPolls.map((poll) => (poll.id === updatedPoll.id ? updatedPoll : poll))
    );
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center" }}>Polling App</h1>

      {!isRegistered ? (
        <RegisterForm onRegister={() => setIsRegistered(true)} />
      ) : (
        <>
          <PollForm onPollCreated={handlePollCreated} />
          <h2 style={{ marginTop: "20px" }}>Available Polls</h2>
          {polls.length === 0 ? (
            <p>No polls available.</p>
          ) : (
            polls.map((poll) => (
              <Poll
                key={poll.id}
                poll={poll}
                onDelete={handleDeletePoll}
                onUpdate={handleUpdatePoll}
              />
            ))
          )}
        </>
      )}
    </div>
  );
}

export default App;
