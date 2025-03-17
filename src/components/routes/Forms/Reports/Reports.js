// src/components/routes/Forms/Reports/Reports.js

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Reports.css";
import axios from "axios";
import { format } from 'date-fns';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [statusSummary, setStatusSummary] = useState({});
  const [dailyCounts, setDailyCounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(
    format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [recipient, setRecipient] = useState("");
  const [status, setStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("reports");
  const [storedInstanceId, setStoredInstanceId] = useState(null);

  useEffect(() => {
    // Retrieve the instance ID from localStorage
    const instanceId = localStorage.getItem('current_instance_id');
    if (instanceId) {
      setStoredInstanceId(instanceId);
    } else {
      setError("Instance ID not found");
    }
  }, []);

  useEffect(() => {
    if (storedInstanceId) {
      fetchReports();
      fetchStatusSummary();
      fetchDailyCounts();
    }
  }, [storedInstanceId, startDate, endDate, status, recipient, currentPage, activeTab]);

  const fetchReports = async () => {
    if (activeTab !== "reports") return;
    
    try {
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL;
      const token = localStorage.getItem("token");
      
      const limit = 10;
      const offset = (currentPage - 1) * limit;
      
      const response = await axios.get(
        `${apiUrl}/${storedInstanceId}/message-reports`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            start_date: startDate ? `${startDate} 00:00:00` : undefined,
            end_date: endDate ? `${endDate} 23:59:59` : undefined,
            recipient: recipient || undefined,
            status: status || undefined,
            limit,
            offset
          }
        }
      );

      if (response.data.success) {
        const startNumber = (currentPage - 1) * limit + 1;
        setReports(response.data.reports.map((report, index) => ({
          ...report,
          sno: startNumber + index
        })));
        setTotalPages(Math.ceil(response.data.pagination.total / limit));
      } else {
        setError("Failed to fetch reports");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusSummary = async () => {
    if (activeTab !== "summary") return;
    
    try {
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL;
      const token = localStorage.getItem("token");
      
      const response = await axios.get(
        `${apiUrl}/${storedInstanceId}/message-status-summary`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            start_date: startDate ? `${startDate} 00:00:00` : undefined,
            end_date: endDate ? `${endDate} 23:59:59` : undefined
          }
        }
      );

      if (response.data.success) {
        setStatusSummary(response.data.summary);
      } else {
        setError("Failed to fetch status summary");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyCounts = async () => {
    if (activeTab !== "daily") return;
    
    try {
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL;
      const token = localStorage.getItem("token");
      
      const response = await axios.get(
        `${apiUrl}/${storedInstanceId}/daily-message-count`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            start_date: startDate ? `${startDate} 00:00:00` : undefined,
            end_date: endDate ? `${endDate} 23:59:59` : undefined
          }
        }
      );

      if (response.data.success) {
        setDailyCounts(response.data.dailyCounts);
      } else {
        setError("Failed to fetch daily counts");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchReports();
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return "N/A";
    const date = new Date(dateTimeStr);
    return format(date, 'yyyy-MM-dd HH:mm:ss');
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'sent': return 'status-sent';
      case 'delivered': return 'status-delivered';
      case 'read': return 'status-read';
      case 'failed': return 'status-failed';
      case 'pending': return 'status-pending';
      default: return '';
    }
  };

  // Prepare chart data for daily counts
  const chartData = {
    labels: dailyCounts.map(item => format(new Date(item.date), 'yyyy-MM-dd')),
    datasets: [
      {
        label: 'Sent',
        data: dailyCounts.map(item => item.sent),
        backgroundColor: '#4CAF50',
      },
      {
        label: 'Delivered',
        data: dailyCounts.map(item => item.delivered),
        backgroundColor: '#2196F3',
      },
      {
        label: 'Read',
        data: dailyCounts.map(item => item.read),
        backgroundColor: '#9C27B0',
      },
      {
        label: 'Failed',
        data: dailyCounts.map(item => item.failed),
        backgroundColor: '#F44336',
      },
      {
        label: 'Pending',
        data: dailyCounts.map(item => item.pending),
        backgroundColor: '#FF9800',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Daily Message Status',
      },
    },
    scales: {
      x: {
        stacked: false,
        type: 'category',
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        stacked: false,
        beginAtZero: true
      },
    },
  };

  return (
    <div className="reports-container">
      <div className="headerr-container">
        <Link to={`/${storedInstanceId}/message`}>
          <img src="/uploads/house-fill.svg" alt="Home" className="home-icon" />
        </Link>
        <h1 className="reports-title">Message Reports</h1>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="reports-tabs">
        <button 
          className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => handleTabChange('reports')}
        >
          Reports
        </button>
        <button 
          className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => handleTabChange('summary')}
        >
          Summary
        </button>
        <button 
          className={`tab-button ${activeTab === 'daily' ? 'active' : ''}`}
          onClick={() => handleTabChange('daily')}
        >
          Trends
        </button>
      </div>
      
      <div className="filter-section">
        <form onSubmit={handleFilter}>
          <div className="filter-row">
            <div className="filter-group">
              <label className="form-labell">From</label>
              <input
                type="date"
                className="form-inputt"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label className="form-labell">To</label>
              <input
                type="date"
                className="form-inputt"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            
            {activeTab === 'reports' && (
              <>
                <div className="filter-group">
                  <label className="form-labell">Number</label>
                  <input
                    type="text"
                    className="form-inputt"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Phone number"
                  />
                </div>
                
                <div className="filter-group">
                  <label className="form-labell">Status</label>
                  <select
                    className="form-inputt"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="sent">Sent</option>
                    <option value="delivered">Delivered</option>
                    <option value="read">Read</option>
                    <option value="failed">Failed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </>
            )}
            
            <button type="submit" className="filter-button">Filter</button>
          </div>
        </form>
      </div>
      
      <div className="content-area">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {activeTab === 'reports' && (
              <div className="reports-content">
                <div className="reports-table-container">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>S.no.</th>
                        <th>Number</th>
                        <th>Message</th>
                        <th>Status</th>
                        <th>Initiated</th>
                        <th>Sent</th>
                        <th>Delivered</th>
                        <th>Read</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.length > 0 ? (
                        reports.map((report) => (
                          <tr key={report.id}>
                            <td>{report.sno}</td>
                            <td>{report.recipient}</td>
                            <td className="message-cell">
                              {report.message || (report.media ? 'Media message' : 'N/A')}
                              {report.caption && <div className="caption">Caption: {report.caption}</div>}
                            </td>
                            <td>
                              <span className={`status-badge ${getStatusClass(report.message_status)}`}>
                                {report.message_status}
                              </span>
                            </td>
                            <td>{formatDateTime(report.initiated_time)}</td>
                            <td>{formatDateTime(report.sent_time)}</td>
                            <td>{formatDateTime(report.delivered_time)}</td>
                            <td>{formatDateTime(report.read_time)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="no-data">No reports found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {reports.length > 0 && (
                  <div className="pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="page-button"
                    >
                      Previous
                    </button>
                    <span className="page-info">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="page-button"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'summary' && (
              <div className="summary-container">
                <h2>Status Summary</h2>
                <div className="status-cards">
                  <div className="status-card sent">
                    <h3>Sent</h3>
                    <div className="status-count">{statusSummary.sent || 0}</div>
                  </div>
                  <div className="status-card delivered">
                    <h3>Delivered</h3>
                    <div className="status-count">{statusSummary.delivered || 0}</div>
                  </div>
                  <div className="status-card read">
                    <h3>Read</h3>
                    <div className="status-count">{statusSummary.read || 0}</div>
                  </div>
                  <div className="status-card failed">
                    <h3>Failed</h3>
                    <div className="status-count">{statusSummary.failed || 0}</div>
                  </div>
                  <div className="status-card pending">
                    <h3>Pending</h3>
                    <div className="status-count">{statusSummary.pending || 0}</div>
                  </div>
                </div>
                
                <div className="total-summary">
                  <h3>Total Messages</h3>
                  <div className="total-count">
                    {Object.values(statusSummary).reduce((sum, count) => sum + count, 0)}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'daily' && (
              <div className="chart-container">
                <h2>Daily Trends</h2>
                {dailyCounts.length > 0 ? (
                  <Bar data={chartData} options={chartOptions} />
                ) : (
                  <div className="no-data">No data available for the selected date range</div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;