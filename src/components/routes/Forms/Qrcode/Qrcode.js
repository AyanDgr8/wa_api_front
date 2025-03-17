// src/components/routes/Forms/Qrcode/Qrcode.js

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Qrcode.css";
import axios from "axios";

const Qrcode = () => {
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');

    const navigate = useNavigate();
    const { instanceId: urlInstanceId } = useParams(); // Get instanceId from URL if available

    useEffect(() => {
        // Get instance ID from URL, session storage (reconnecting), or localStorage
        const reconnectingInstance = sessionStorage.getItem('reconnecting_instance');
        const storedInstance = localStorage.getItem('current_instance_id');
        const currentInstanceId = urlInstanceId || reconnectingInstance || storedInstance;

        if (currentInstanceId) {
            console.log("Instance ID retrieved:", currentInstanceId);
            // If we're reconnecting, clear the session storage
            if (reconnectingInstance) {
                sessionStorage.removeItem('reconnecting_instance');
            }
            fetchQRCode(currentInstanceId);
            startStatusPolling(currentInstanceId);
        } else {
            console.error("Instance ID is missing.");
            setError("Instance ID not found. Please create a new instance first.");
        }

        return () => stopStatusPolling();
    }, [urlInstanceId, navigate]);

    let statusCheckInterval = null;

    const startStatusPolling = (instanceId) => {
        // Check immediately
        checkConnectionStatus(instanceId);
        // Then start polling
        statusCheckInterval = setInterval(() => {
            checkConnectionStatus(instanceId);
        }, 5000); // Check every 5 seconds
    };

    const stopStatusPolling = () => {
        if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
        }
    };

    const checkConnectionStatus = async (instanceId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
    
            const apiUrl = process.env.REACT_APP_API_URL;
            const response = await axios.get(
                `${apiUrl}/${instanceId}/status`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
    
            if (response.data.success) {
                const status = response.data.status;
                setConnectionStatus(status);
    
                if (status === 'connected') {
                    setIsAuthenticated(true);
                    localStorage.setItem('current_instance_id', instanceId);
                } else if (status === 'disconnected' || status === 'closed') {
                    setIsAuthenticated(false);
                    // Remove the QR code reset logic here
                    // fetchQRCode(instanceId); // This line should be removed
                }
            }
        } catch (error) {
            console.error('Error checking connection status:', error);
            if (error.response?.status === 403) {
                navigate('/login');
            }
        }
    };
    

    const fetchQRCode = async (instanceId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            setLoading(true);
            setError(null);
            const apiUrl = process.env.REACT_APP_API_URL;
            console.log("Fetching QR code for instance:", instanceId);

            const response = await axios.get(
                `${apiUrl}/${instanceId}/qrcode`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.isAuthenticated) {
                setIsAuthenticated(true);
                localStorage.setItem('current_instance_id', instanceId);
                return;
            }

            if (response.data.qrCode) {
                setQrCodeUrl(response.data.qrCode);
                setIsAuthenticated(false);
            
            } else {
                // Handle case where no QR code is returned
                throw new Error('No QR code received from server');
            }

        } catch (error) {
            console.error('Error fetching QR code:', error);
            setError(error.response?.data?.message || error.message);
            if (error.response?.status === 403) {
                navigate('/login');
            }
            // Add retry logic for 500 errors
            if (error.response?.status === 500) {
                console.log('Server error, retrying in 3 seconds...');
                setTimeout(() => fetchQRCode(instanceId), 3000);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        try {
            const currentInstanceId = urlInstanceId || localStorage.getItem('current_instance_id');
            if (!currentInstanceId) {
                throw new Error('No instance ID available');
            }
    
            setLoading(true);
            const token = localStorage.getItem('token');
            const apiUrl = process.env.REACT_APP_API_URL;
    
            await axios.post(
                `${apiUrl}/${currentInstanceId}/reset`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
    
            // Fetch new QR code after reset
            await fetchQRCode(currentInstanceId);
        } catch (error) {
            console.error('Error resetting instance:', error);
            setError(error.response?.data?.message || 'Failed to reset instance');
        } finally {
            setLoading(false);
        }
    };
    

    const handleContinue = () => {
        const currentInstanceId = urlInstanceId || localStorage.getItem('current_instance_id');
        if (currentInstanceId) {
            navigate(`/${currentInstanceId}/message`);
        }
    };

    return (
        <div className="qr-container">
            <h1 className="qr_headi">WhatsApp Connection</h1>
            
            {error && <div className="error-message">{error}</div>}
            
            
            {connectionStatus === 'connecting' && (
                <div className="status-message">Connecting to WhatsApp...</div>
            )}
            
            {connectionStatus === 'connected' ? (
                <div className="success-container">
                    <div className="success-message">WhatsApp connected successfully!</div>
                    <button 
                        className="continue-button"
                        onClick={handleContinue}
                    >
                        Continue to Messenger
                    </button>
                </div>
            ) : qrCodeUrl ? (
                <>
                    <img src={qrCodeUrl} alt="WhatsApp QR Code" className="qr-image" />
                    <p className="qr-instruction">
                        Scan this QR code with WhatsApp on your phone
                    </p>
                    <button 
                        className="reset-button" 
                        onClick={handleReset}
                        disabled={loading}
                    >
                        {loading ? "Resetting..." : "Reset Connection"}
                    </button>
                </>
            ) : (
                <div className="loading-message">
                    {loading ? "Generating QR Code..." : "Checking connection status..."}
                </div>
            )}
        </div>
    );
};

export default Qrcode;