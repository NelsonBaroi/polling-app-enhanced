import React, { useEffect, useState } from "react";
import axios from "axios";
import PollForm from "./components/PollForm";
import Poll from "./components/Poll";
import RegisterForm from "./components/RegisterForm";
import Analytics from "./components/Analytics";
import io from "socket.io-client";

const API_URL = process.env.REACT_APP_API_URL;

function App() {
  const [polls, setPolls] = useState([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [socket, setSocket] = useState(null);

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

  const handlePollCreated = (newPoll) => {
    setPolls((prevPolls) => [...prevPolls, newPoll]);
  };

  const handleDeletePoll = (pollId) => {
    setPolls((prevPolls) => prevPolls.filter((poll) => poll.id !== pollId));
  };

  const handleUpdatePoll = (updatedPoll) => {
    setPolls((prevPolls) =>
      prevPolls.map((poll) => (poll.id === updatedPoll.id ? updatedPoll : poll))
    );
  };

  return (
    <div className="container">
      <h1>Polling App</h1>

      {!isRegistered ? (
        <RegisterForm onRegister={() => setIsRegistered(true)} />
      ) : (
        <>
          <PollForm onPollCreated={handlePollCreated} />
          <Analytics />
          <h2>Available Polls</h2>
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
