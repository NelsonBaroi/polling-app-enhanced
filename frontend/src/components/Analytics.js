import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

const API_URL = process.env.REACT_APP_API_URL;

function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [chartType, setChartType] = useState("bar");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/analytics`);
        if (res.data.voteTrends.length === 0) {
          setAnalytics({ totalVotes: 0, mostPopularPoll: null, voteTrends: [] });
        } else {
          setAnalytics(res.data);
        }
      } catch (err) {
        console.error("Analytics error:", err);
      }
    };
    fetchData();
  }, []);

  if (!analytics) return <p>Loading analytics...</p>;
  if (analytics.voteTrends.length === 0) {
    return (
      <div className="container">
        <h1>Analytics Dashboard</h1>
        <p>No polls available for analytics.</p>
      </div>
    );
  }

  const voteTrendsData = {
    labels: analytics.voteTrends.flatMap((poll) =>
      poll.options.map((opt) => `${poll.question} - ${opt.option}`)
    ),
    datasets: [
      {
        label: "Votes",
        data: analytics.voteTrends.flatMap((poll) =>
          poll.options.map((opt) => opt.votes)
        ),
        backgroundColor: ["#007bff", "#28a745", "#ffc107", "#dc3545"],
        borderColor: ["#007bff", "#28a745", "#ffc107", "#dc3545"],
        borderWidth: 1,
      },
    ],
  };

  const voteTrendsOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Vote Trends" },
    },
  };

  const renderChart = () => {
    switch (chartType) {
      case "bar":
        return <Bar data={voteTrendsData} options={voteTrendsOptions} />;
      case "pie":
        return <Pie data={voteTrendsData} options={voteTrendsOptions} />;
      case "line":
        return <Line data={voteTrendsData} options={voteTrendsOptions} />;
      default:
        return <Bar data={voteTrendsData} options={voteTrendsOptions} />;
    }
  };

  const exportAsPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18).text("Polling App Analytics", 10, 10);
    doc.setFontSize(14).text(`Total Votes: ${analytics.totalVotes}`, 10, 20);

    if (analytics.mostPopularPoll) {
      doc.text(
        `Most Popular Poll: ${analytics.mostPopularPoll.question} (${analytics.mostPopularPoll.votes} votes)`,
        10,
        30
      );
    } else {
      doc.text("No popular poll available.", 10, 30);
    }

    doc.text("Vote Trends:", 10, 40);
    analytics.voteTrends.forEach((poll, index) => {
      const line = `- ${poll.question}: ${poll.options
        .map((o) => `${o.option} (${o.votes})`)
        .join(", ")}`;
      doc.text(line, 10, 50 + index * 10);
    });

    doc.save("polling-analytics.pdf");
  };

  const exportChartAsImage = () => {
    const chart = document.querySelector(".chart-container");
    if (chart) {
      html2canvas(chart).then((canvas) => {
        const img = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = img;
        link.download = "polling-chart.png";
        link.click();
      });
    }
  };

  return (
    <div className="container" style={{ padding: "20px" }}>
      <h1>Analytics Dashboard</h1>

      <div style={{ marginBottom: "20px" }}>
        <h2>Total Votes</h2>
        <p>{analytics.totalVotes}</p>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h2>Most Popular Poll</h2>
        {analytics.mostPopularPoll ? (
          <>
            <p>
              <strong>Question:</strong> {analytics.mostPopularPoll.question}
            </p>
            <p>
              <strong>Votes:</strong> {analytics.mostPopularPoll.votes}
            </p>
          </>
        ) : (
          <p>No popular poll available.</p>
        )}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <button onClick={exportAsPDF} style={{ marginRight: "10px" }}>
          Export as PDF
        </button>
        <button onClick={exportChartAsImage}>Export Chart as Image</button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="chartType" style={{ marginRight: "10px" }}>
          Select Chart Type:
        </label>
        <select
          id="chartType"
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
        >
          <option value="bar">Bar Chart</option>
          <option value="pie">Pie Chart</option>
          <option value="line">Line Chart</option>
        </select>
      </div>

      <div>
        <h2>Vote Trends</h2>
        <div className="chart-container" style={{ maxWidth: "600px", margin: "0 auto" }}>
          {renderChart()}
        </div>
      </div>
    </div>
  );
}

export default Analytics;
