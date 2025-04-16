import React, { useState, useEffect } from "react";
import axios from "axios";
import Poll from "./components/Poll";
import PollForm from "./components/PollForm";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import Analytics from "./components/Analytics";
import io from "socket.io-client";

const API_URL = "https://polling-app-backend.onrender.com"; // Replace with your Render URL if deployed
const socket = io(API_URL); // Connect to the Socket.IO server

function App() {
  const [polls, setPolls] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Fetch all polls on component mount
  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/polls`);
        setPolls(response.data);
      } catch (error) {
        console.error("Error fetching polls:", error);
      }
    };
    fetchPolls();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    // Handle new poll creation
    socket.on("pollCreated", (newPoll) => {
      setPolls((prevPolls) => [...prevPolls, newPoll]);
    });

    // Handle poll updates
    socket.on("pollUpdated", (updatedPoll) => {
      setPolls((prevPolls) =>
        prevPolls.map((poll) => (poll.id === updatedPoll.id ? updatedPoll : poll))
      );
    });

    // Handle poll deletion
    socket.on("pollDeleted", (pollId) => {
      setPolls((prevPolls) => prevPolls.filter((poll) => poll.id !== pollId));
    });

    return () => {
      socket.off("pollCreated");
      socket.off("pollUpdated");
      socket.off("pollDeleted");
    };
  }, []);

  // Handle poll creation
  const handlePollCreated = (newPoll) => {
    setPolls([...polls, newPoll]);
  };

  // Handle poll deletion
  const handlePollDeleted = (deletedPollId) => {
    setPolls(polls.filter((poll) => poll.id !== deletedPollId));
  };

  // Handle login
  const handleLogin = () => {
    setToken(localStorage.getItem("token"));
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  // Add authorization header to Axios requests
  axios.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return (
    <div className="container">
      <h1>Polling App</h1>

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {!token ? (
          <>
            <LoginForm onLogin={handleLogin} />
            <RegisterForm onRegister={handleLogin} />
          </>
        ) : (
          <>
            <button onClick={handleLogout}>Logout</button>
            <button onClick={() => setShowAnalytics(!showAnalytics)}>
              {showAnalytics ? "Back to Polls" : "View Analytics"}
            </button>
          </>
        )}
      </div>

      {/* Main Content */}
      {showAnalytics ? (
        <Analytics />
      ) : (
        <>
          {token && <PollForm onPollCreated={handlePollCreated} />}
          <div>
            {polls.length > 0 ? (
              polls.map((poll) => (
                <Poll
                  key={poll.id}
                  poll={poll}
                  onDelete={handlePollDeleted}
                  onUpdate={(updatedPoll) =>
                    setPolls(
                      polls.map((p) => (p.id === updatedPoll.id ? updatedPoll : p))
                    )
                  }
                />
              ))
            ) : (
              <p>No polls available. Create one!</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;