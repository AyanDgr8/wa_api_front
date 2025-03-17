// src/components/routes/Forms/Messenger/Messenger.js

import React, { useState, useEffect } from "react";
import "./Messenger.css";
import axios from "axios";
import Subscription from "../Subscription/Subscription";

const Messenger = () => {
    const [filePath, setFilePath] = useState("");
    const [selectedFileName, setSelectedFileName] = useState("");
    const [selectedCSVName, setSelectedCSVName] = useState("");
    const [numbers, setNumbers] = useState("");
    const [caption, setCaption] = useState("");
    const [message, setMessage] = useState("");
    const [scheduleTime, setScheduleTime] = useState("");
    const [storedInstanceId, setStoredInstanceId] = useState(null); // State to hold the instance ID
    const [loading, setLoading] = useState(false); // Optional: loading state
    const [error, setError] = useState(null); // Optional: error state
    const [isConnected, setIsConnected] = useState(false);
    const [refreshSubscription, setRefreshSubscription] = useState(0);

    useEffect(() => {
      // Retrieve the instance ID from localStorage
      const storedInstanceId = localStorage.getItem('current_instance_id');
      if (storedInstanceId) {
          console.log("Instance ID retrieved:", storedInstanceId);
          setStoredInstanceId(storedInstanceId);
      } else {
          console.error("Instance ID is missing.");
          setError("Instance ID not found");
      }
  }, []);

    useEffect(() => {
      // Check connection status when component mounts and when instance ID changes
      const checkConnection = async () => {
        try {
          const apiUrl = process.env.REACT_APP_API_URL;
          const token = localStorage.getItem("token");
          const instanceId = localStorage.getItem('current_instance_id');
          
          if (!instanceId) {
            console.error("No instance ID found");
            setIsConnected(false);
            return;
          }

          if (!token) {
            console.error("No token found");
            setIsConnected(false);
            window.location.href = '/login';
            return;
          }

          const response = await axios.get(`${apiUrl}/${instanceId}/status`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.data.success) {
            setIsConnected(response.data.connected);
            
            if (!response.data.connected) {
              if (response.data.status === 'disconnected' || response.data.status === 'closed') {
                console.log("WhatsApp is disconnected. Redirecting to QR code scan...");
                // Store current instance ID before redirect
                sessionStorage.setItem('reconnecting_instance', instanceId);
                window.location.href = `/qrcode/${instanceId}`;
              } else if (response.data.status === 'reconnecting') {
                console.log("WhatsApp is reconnecting...");
              }
            } else {
              console.log("WhatsApp connected successfully!");
            }
          } else {
            setIsConnected(false);
            console.error(response.data.message);
          }
        } catch (error) {
          console.error("Failed to check connection status:", error);
          setIsConnected(false);
          
          if (error.response?.status === 403) {
            window.location.href = '/login';
          } else if (error.response?.status === 404) {
            window.location.href = '/qrcode';
          }
        }
      };

      // Initial check
      checkConnection();
      
      // Poll every 5 seconds
      const interval = setInterval(checkConnection, 5000);
      return () => clearInterval(interval);
    }, [storedInstanceId]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Set the selected file name
        setSelectedFileName(file.name);

        // Show loading state
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const token = localStorage.getItem("token");
            const apiUrl = process.env.REACT_APP_API_URL;

            if (!storedInstanceId) {
                throw new Error("Instance ID not found");
            }

            // Log the request details
            console.log("Upload details:", {
                instanceId: storedInstanceId,
                url: `${apiUrl}/${storedInstanceId}/upload-media`,
                fileName: file.name,
                fileSize: file.size
            });

            const response = await axios.post(
                `${apiUrl}/${storedInstanceId}/upload-media`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            console.log("Upload response:", response.data);

            if (response.data.success) {
                setFilePath(response.data.filePath);
                alert("Media file uploaded successfully!");
            } else {
                throw new Error(response.data.message || "Failed to upload media file");
            }
        } catch (error) {
            console.error("File upload failed:", error);
            console.error("Error details:", {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            const errorMessage = error.response?.data?.message || error.message || "Failed to upload media file";
            setError(errorMessage);
            alert(errorMessage);
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };
  
    const handleCSVUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Set the selected CSV file name
        setSelectedCSVName(file.name);

        // Show loading state
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);
  
        try {
            const token = localStorage.getItem("token");
            const apiUrl = process.env.REACT_APP_API_URL;
  
            if (!storedInstanceId) {
                throw new Error("Instance ID not found");
            }
  
            console.log("Uploading CSV for instance:", storedInstanceId);
  
            const response = await axios.post(
                `${apiUrl}/${storedInstanceId}/upload-csv`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
  
            if (response.data.phoneNumbers && response.data.phoneNumbers.length > 0) {
                const formattedNumbers = response.data.phoneNumbers.join(", ");
                setNumbers(formattedNumbers);
                alert(`Successfully loaded ${response.data.phoneNumbers.length} phone numbers`);
            } else {
                throw new Error("No valid phone numbers found in CSV");
            }
  
        } catch (error) {
            console.error("CSV upload failed:", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to upload CSV";
            setError(errorMessage);
            alert(errorMessage);
            // Clear the file name on error
            setSelectedCSVName("");
        } finally {
            setLoading(false);
        }
    };
    
    const checkSubscription = async (instanceId) => {
        try {
            const token = localStorage.getItem("token");
            const apiUrl = process.env.REACT_APP_API_URL;
            
            const response = await axios.get(`${apiUrl}/${instanceId}/check-subscription`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            return response.data.success && response.data.hasSubscription;
        } catch (error) {
            console.error("Error checking subscription:", error);
            return false;
        }
    };

    // Validate phone numbers input
    const validatePhoneNumbers = (input) => {
        // Only allow numbers, +, comma and spaces
        return /^[0-9+,\s]*$/.test(input);
    };

    const handleNumbersChange = (e) => {
        const input = e.target.value;
        if (validatePhoneNumbers(input)) {
            setNumbers(input);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Validate required fields
            if (!numbers) {
                throw new Error("Please enter phone numbers");
            }

            if (!selectedFileName && !message) {
                throw new Error("Please either upload a media file or enter a message");
            }

            const token = localStorage.getItem("token");
            const apiUrl = process.env.REACT_APP_API_URL;

            // Check subscription before proceeding
            const hasValidSubscription = await checkSubscription(storedInstanceId);
            if (!hasValidSubscription) {
                throw new Error("No active subscription found. Please subscribe first.");
            }

            // Format phone numbers
            const phoneNumbers = numbers.split(",").map(num => num.trim());

            // Prepare request data
            const requestData = {
                numbers: phoneNumbers,
                message: message,
                caption: caption,
                filePath: filePath,
                scheduleTime: scheduleTime || null
            };

            // Send message
            const response = await axios.post(
                `${apiUrl}/${storedInstanceId}/send-media`,
                requestData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.data.success) {
                alert("Message sent successfully!");
                // Clear form fields except the file name and path
                setNumbers("");
                setMessage("");
                setCaption("");
                setScheduleTime("");
                setRefreshSubscription(prev => prev + 1);
            } else {
                throw new Error(response.data.message || "Failed to send message");
            }
        } catch (error) {
            console.error("Message sending failed:", error);
            const errorMessage = error.response?.data?.message || error.message;
            setError(errorMessage);
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="messenger-container">
            <div className="sendinggg_twos">
                <div className="form-container">
                    <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <label className="form-label">Upload phone numbers file (only .csv files are allowed):</label>
                        <div className="file-upload-container">
                            <input
                                type="file"
                                onChange={handleCSVUpload}
                                accept=".csv"
                                className="form-input file-input"
                                id="csv-upload"
                            />
                            <input
                                type="text"
                                value={selectedCSVName}
                                readOnly
                                placeholder="No CSV file selected"
                                className="form-input file-name-input"
                            />
                        </div>
                    </div>
                    <div className="form-section">
                        <label className="form-label">Enter mobile phone numbers with country code (comma separated):</label>
                        <input
                        type="text"
                        value={numbers}
                        onChange={handleNumbersChange}
                        placeholder="+910123456789, +910123456789"
                        className="form-input"
                        required
                        />
                    </div>

                    <div className="form-section">
                        <label className="form-label">
                            Media File <span className="file-types">(.jpg, .jpeg, .png, .mp4, .mov, .mp3, .wav, .ogg, .pdf, .doc, .docx)</span>
                        </label>
                        <div className="file-upload-container">
                            <input
                                type="file"
                                onChange={handleFileUpload}
                                className="form-input file-input"
                                id="file-upload"
                            />
                            <input
                                type="text"
                                value={selectedFileName}
                                readOnly
                                placeholder="No file selected"
                                className="form-input file-name-input"
                            />
                        </div>
                    </div>
                    {/* <div className="form-section">
                        <label className="form-label">Media File Path:</label>
                        <input
                        type="text"
                        value={filePath}
                        readOnly
                        placeholder="Media file path"
                        className="form-input"
                        />
                    </div> */}
                    <div className="form-section">
                        <label className="form-label">Caption to be displayed with media file only:</label>
                        <input
                        type="text"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Enter caption"
                        className="form-input"
                        />
                    </div>
                    <div className="form-section">
                        <label className="form-label">Message:</label>
                        <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Enter your message"
                        className="form-textarea"
                        />
                    </div>
                    {/* <div className="form-section">
                        <label className="form-label">Schedule Time: (Optional)</label>
                        <input
                        type="datetime-local"
                        value={scheduleTime || new Date().toISOString().slice(0, 16)}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="form-input"
                        />
                    </div> */}
                    <button 
                        type="submit" 
                        className="form-button"
                        disabled={loading || !isConnected}
                    >
                        {loading ? "Sending..." : "Send"}
                    </button>
                    </form>
                </div>

                <div>
                    <Subscription refreshTrigger={refreshSubscription} />
                </div>
            </div>
        </div>
    );
};

export default Messenger;
