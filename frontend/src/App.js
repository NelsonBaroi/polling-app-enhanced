import React, { useState, useEffect } from "react";
import axios from "axios";
import Poll from "./components/Poll";
import PollForm from "./components/PollForm";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import Analytics from "./components/Analytics";
import io from "socket.io-client";

// Backend API URL
const API_URL = "https://polling-app-backend-n6zk.onrender.com"; // Replace with your deployed backend URL
const socket = io(API_URL, {
  auth: {
    token: localStorage.getItem("token") || null,
  },
});

function App() {
  const [polls, setPolls] = useState([]); // State to store all polls
  const [token, setToken] = useState(localStorage.getItem("token") || null); // Authentication token
  const [showAnalytics, setShowAnalytics] = useState(false); // Toggle between polls and analytics view

  // Fetch all polls when the component mounts
  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/polls`);
        setPolls(response.data);
      } catch (error) {
        console.error(
          "Error fetching polls:",
          error.response?.data?.error || error.message
        );
      }
    };
    fetchPolls();
  }, []);

  // Listen for real-time updates via Socket.IO
  useEffect(() => {
    // Update the token in Socket.IO if it changes
    if (token) {
      socket.auth = { token };
      socket.connect();
    }

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

    // Handle unauthorized WebSocket connections
    socket.on("error", (error) => {
      console.error("Socket.IO error:", error);
      if (error === "Unauthorized") {
        alert("You are not authorized to perform this action.");
      }
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off("pollCreated");
      socket.off("pollUpdated");
      socket.off("pollDeleted");
      socket.off("error");
    };
  }, [token]);

  // Handle poll creation
  const handlePollCreated = (newPoll) => {
    setPolls((prevPolls) => [...prevPolls, newPoll]);
  };

  // Handle poll deletion
  const handlePollDeleted = (deletedPollId) => {
    setPolls((prevPolls) => prevPolls.filter((poll) => poll.id !== deletedPollId));
  };

  // Handle login
  const handleLogin = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    socket.disconnect(); // Disconnect WebSocket on logout
  };

  // Add authorization header to Axios requests
  axios.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return (
    <div className="container" style={{ padding: "20px" }}>
      <h1>Polling App</h1>

      {/* Navigation Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        {!token ? (
          <>
            <LoginForm onLogin={handleLogin} />
            <RegisterForm onRegister={handleLogin} />
          </>
        ) : (
          <>
            <button onClick={handleLogout} style={{ padding: "10px 20px" }}>
              Logout
            </button>
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              style={{ padding: "10px 20px" }}
            >
              {showAnalytics ? "Back to Polls" : "View Analytics"}
            </button>
          </>
        )}
      </div>

      {/* Main Content Section */}
      {showAnalytics ? (
        <Analytics />
      ) : (
        <>
          {/* Poll Creation Form (only visible to logged-in users) */}
          {token && <PollForm onPollCreated={handlePollCreated} />}

          {/* Display Polls */}
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