import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Bar,
  Pie,
  Line,
} from "react-chartjs-2"; // Import different chart types
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

// Register required components
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

const API_URL = "https://polling-app-backend-n6zk.onrender.com"; // Replace with your Render URL if deployed

function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [chartType, setChartType] = useState("bar"); // Default chart type

  // Fetch analytics data on component mount
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/analytics`);
        setAnalytics(response.data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      }
    };
    fetchAnalytics();
  }, []);

  if (!analytics) {
    return <p>Loading analytics...</p>;
  }

  // Prepare chart data for vote trends
  const voteTrendsData = {
    labels: analytics.voteTrends.flatMap((poll) =>
      poll.options.map((option) => `${poll.question} - ${option.option}`)
    ),
    datasets: [
      {
        label: "Votes",
        data: analytics.voteTrends.flatMap((poll) =>
          poll.options.map((option) => option.votes)
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
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Vote Trends",
      },
    },
  };

  // Render the selected chart type
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

  // Export analytics data as a PDF
  const exportAsPDF = () => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text("Polling App Analytics", 10, 10);

    // Add total votes
    doc.setFontSize(14);
    doc.text(`Total Votes: ${analytics.totalVotes}`, 10, 20);

    // Add most popular poll
    doc.setFontSize(14);
    doc.text(
      `Most Popular Poll: ${analytics.mostPopularPoll.question} (${analytics.mostPopularPoll.votes} votes)`,
      10,
      30
    );

    // Add vote trends
    doc.setFontSize(14);
    doc.text("Vote Trends:", 10, 40);
    analytics.voteTrends.forEach((poll, index) => {
      doc.text(
        `- ${poll.question}: ${poll.options
          .map((option) => `${option.option} (${option.votes} votes)`)
          .join(", ")}`,
        10,
        50 + index * 10
      );
    });

    // Save the PDF
    doc.save("polling-analytics.pdf");
  };

  // Export chart as an image (PNG)
  const exportChartAsImage = () => {
    const chartContainer = document.querySelector(".chart-container");

    if (chartContainer) {
      html2canvas(chartContainer).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = imgData;
        link.download = "polling-chart.png";
        link.click();
      });
    }
  };

  return (
    <div className="container">
      <h1>Analytics Dashboard</h1>

      {/* Total Votes */}
      <div>
        <h2>Total Votes</h2>
        <p>{analytics.totalVotes}</p>
      </div>

      {/* Most Popular Poll */}
      <div>
        <h2>Most Popular Poll</h2>
        <p>
          <strong>Question:</strong> {analytics.mostPopularPoll.question}
        </p>
        <p>
          <strong>Votes:</strong> {analytics.mostPopularPoll.votes}
        </p>
      </div>

      {/* Export Buttons */}
      <div style={{ marginBottom: "20px" }}>
        <button onClick={exportAsPDF}>Export as PDF</button>
        <button onClick={exportChartAsImage}>Export Chart as Image</button>
      </div>

      {/* Chart Type Selector */}
      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="chartType">Select Chart Type:</label>
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

      {/* Vote Trends Chart */}
      <div>
        <h2>Vote Trends</h2>
        <div
          className="chart-container"
          style={{ maxWidth: "600px", margin: "0 auto" }}
        >
          {renderChart()}
        </div>
      </div>
    </div>
  );
}

export default Analytics;