// src/components/routes/Forms/Subscription/Subscription.js

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { AiOutlineInfoCircle } from "react-icons/ai";
import './Subscription.css';

const Subscription = () => {
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showTooltip, setShowTooltip] = useState(false);
    const { id: urlInstanceId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const reconnectingInstance = sessionStorage.getItem("reconnecting_instance");
        const storedInstance = localStorage.getItem("current_instance_id");
        const currentInstanceId = urlInstanceId || reconnectingInstance || storedInstance;

        if (currentInstanceId) {
            console.log("Instance ID retrieved:", currentInstanceId);
            if (reconnectingInstance) {
                sessionStorage.removeItem("reconnecting_instance");
            }
            fetchSubscription(currentInstanceId);
            // Set up interval for periodic updates
            const interval = setInterval(() => fetchSubscription(currentInstanceId), 2000);
            
            // Clear interval on component unmount
            return () => clearInterval(interval);
        } else {
            console.error("Instance ID is missing.");
            setError("Instance ID not found. Please create a new instance first.");
            setLoading(false);
        }
    }, [urlInstanceId]);

    const fetchSubscription = async (instanceId) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("Authentication token not found. Please log in again.");
                setLoading(false);
                return;
            }

            const apiUrl = process.env.REACT_APP_API_URL;
            console.log("Fetching subscription details for instance:", instanceId);

            const response = await axios.get(`${apiUrl}/${instanceId}/subscription`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                // Transform the package stats data if needed
                const subscriptionData = response.data.data;
                if (!subscriptionData.packageStats) {
                    // Initialize package stats if not present in response
                    subscriptionData.packageStats = {
                        "Trial": 0,
                        "Neo": 0,
                        "Starter": 0,
                        "Pro": 0,
                        "Pro Max": 0,
                        "Enterprise": 0
                    };
                }
                setSubscription(subscriptionData);
            } else {
                throw new Error(response.data.message || "Failed to fetch subscription details");
            }
        } catch (err) {
            console.error("Failed to fetch subscription details:", err);
            setError(err.response?.data?.message || err.message || "Failed to fetch subscription details");
            if (err.response?.status === 403) {
                navigate("/login"); // Redirect to login if token is invalid
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="subscription-loading">Loading subscription details...</div>;
    if (error) return <div className="subscription-error">{error}</div>;
    if (!subscription) return <div className="subscription-not-found">No subscription found</div>;

    const getProgressBarColor = () => {
        const percentage = (subscription.current.messages_remaining / subscription.current.total_messages) * 100;
        if (percentage > 60) return '#4CAF50';
        if (percentage > 30) return '#FFA726';
        return '#F44336';
    };

    const calculateProgress = () => {
        return (subscription.current.messages_remaining / subscription.current.total_messages) * 100;
    };

    const isLowRemaining = () => {
        return subscription.current.messages_remaining <= (subscription.current.total_messages * 0.1);
    };

    return (
        <div className="subscription-container">
            {/* <h2 className="subscription-heading">Your Subscription Details</h2> */}
            
            {/* Current Package Stats */}
            <div className="subscription-card">
                <div className="subscription-header">
                    <h3 className="package-name">Current Package: {subscription.current.package}</h3>
                    <span className="expiry-date">
                        Expires: {new Date(subscription.current.date_expiry).toLocaleDateString()}
                    </span>
                </div>

                <div className="message-stats">
                    <div className="stat-item">
                        <label>Total Messages</label>
                        <span>{subscription.current.total_messages.toLocaleString()}</span>
                    </div>
                    <div className="stat-item">
                        <label>Total Initiated</label>
                        <span>{subscription.current.messages_sent.toLocaleString()}</span>
                    </div>
                    <div className="stat-item">
                        <label>Remaining</label>
                        <span className={isLowRemaining() ? 'low-remaining' : ''}>
                            {subscription.current.messages_remaining.toLocaleString()}
                        </span>
                    </div>
                    <div className="stat-item">
                        <label>Successful</label>
                        <span>{subscription.current.successful_messages.toLocaleString()}</span>
                    </div>
                    <div className="stat-item">
                        <label>
                            Failed 
                            <div className="tooltip-container">
                                <AiOutlineInfoCircle 
                                    style={{ cursor: 'pointer', color: 'white', marginLeft: '15px' }} 
                                    size={16}
                                />
                                <span className="tooltip-text">
                                    Messages failed due to device disconnection !
                                </span>
                            </div>
                        </label>
                        <span>{subscription.current.failed_messages.toLocaleString()}</span>
                    </div>
                    <div className="stat-item">
                        <label>
                            Days Left
                            <div className="tooltip-container">
                                <AiOutlineInfoCircle 
                                    style={{ cursor: 'pointer', color: 'white', marginLeft: '10px' }} 
                                    size={16}
                                />
                                <span className="tooltip-text">
                                    No. of days remaining in your current subscription package 
                                </span>
                            </div>
                        </label>
                        <span>{subscription.current.days_remaining || 0}</span>
                    </div>
                </div>

                <div className="progress-section">
                    <label>Usage</label>
                    <div className="progress-bar-container">
                        <div 
                            className="progress-bar"
                            style={{
                                width: `${calculateProgress()}%`,
                                backgroundColor: getProgressBarColor()
                            }}
                        />
                    </div>
                </div>

                <div className="subscription-footer">
                    <span>Purchase Date: {new Date(subscription.current.date_purchased).toLocaleDateString()}</span>
                </div>
            </div>

            {/* All-time Stats */}
            <div className="subscription-card all-time">
                <div className="subscription-headerr">
                    <h3 className="package-name">Life-Time Statistics</h3>
                </div>

                <div className="message-statss">
                    <div className="stat-itemm">
                        <label>Total Messages </label>
                        <span>{subscription.allTime.total_messages.toLocaleString()}</span>
                    </div>
                    <div className="stat-itemm">
                        <label>Total Sent</label>
                        <span>{subscription.allTime.messages_sent.toLocaleString()}</span>
                    </div>
                    <div className="stat-itemm">
                        <label>Total Successful</label>
                        <span>{subscription.allTime.successful_messages.toLocaleString()}</span>
                    </div>
                    <div className="stat-itemm">
                        <label>Total Failed</label>
                        <span>{subscription.allTime.failed_messages.toLocaleString()}</span>
                    </div>
                </div>

                {/* Package Statistics */}
                <div className="package-stats">
                    <h4 className="package-stats-heading"> Package Purchases</h4>
                    <div className="package-stat-list">
                        {["Trial", "Neo", "Starter", "Pro", "Pro Max", "Enterprise"].map((pkg) => (
                            <div key={pkg} className="package-stat-item">
                                <span className="package-namee">{pkg}:</span>
                                <span className="package-count">
                                    {subscription.packageStats?.[pkg] || 0}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Subscription;
