import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";

import Poll from "./components/Poll";
import PollForm from "./components/PollForm";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import Analytics from "./components/Analytics";

// Backend URL
const API_URL = "https://polling-app-backend-scuj.onrender.com";

function App() {
  const [polls, setPolls] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const socketRef = useRef(null);

  // Add token to all axios requests
  useEffect(() => {
    axios.interceptors.request.use((config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }, [token]);

  // Fetch all polls once on mount
  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/polls`);
        setPolls(response.data);
      } catch (error) {
        console.error("Error fetching polls:", error.response?.data?.error || error.message);
      }
    };
    fetchPolls();
  }, []);

  // Handle WebSocket connection
  useEffect(() => {
    if (!token) return;

    const socket = io(API_URL, {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("pollCreated", (newPoll) => {
      setPolls((prev) => [...prev, newPoll]);
    });

    socket.on("pollUpdated", (updatedPoll) => {
      setPolls((prev) =>
        prev.map((poll) => (poll.id === updatedPoll.id ? updatedPoll : poll))
      );
    });

    socket.on("pollDeleted", (pollId) => {
      setPolls((prev) => prev.filter((poll) => poll.id !== pollId));
    });

    socket.on("error", (error) => {
      console.error("WebSocket error:", error);
      if (error === "Authentication error") {
        alert("You are not authorized.");
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  // Handle login
  const handleLogin = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    if (socketRef.current) socketRef.current.disconnect();
  };

  return (
    <div className="container" style={{ padding: "20px" }}>
      <h1>Polling App</h1>

      {/* Auth / Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
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
              onClick={() => setShowAnalytics((prev) => !prev)}
              style={{ padding: "10px 20px" }}
            >
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
          {token && <PollForm onPollCreated={(newPoll) => setPolls([...polls, newPoll])} />}

          <div>
            {polls.length > 0 ? (
              polls.map((poll) => (
                <Poll
                  key={poll.id}
                  poll={poll}
                  onDelete={(deletedId) =>
                    setPolls((prev) => prev.filter((p) => p.id !== deletedId))
                  }
                  onUpdate={(updatedPoll) =>
                    setPolls((prev) =>
                      prev.map((p) => (p.id === updatedPoll.id ? updatedPoll : p))
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
