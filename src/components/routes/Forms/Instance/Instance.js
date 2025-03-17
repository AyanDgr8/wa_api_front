// src/components/routes/Forms/Instance/Instance.js

import React, { useEffect, useState } from "react";
import "./Instance.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Instance = () => {
    const [formDataa, setFormDataa] = useState({
        instance_id: "",
    });
    const [alertMessage, setAlertMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [email, setEmail] = useState(null);
    const navigate = useNavigate();
    
    useEffect(() => {
        const storedEmail = localStorage.getItem('email');
        if (storedEmail) {
            console.log("Email retrieved from localStorage:", storedEmail);
            setEmail(storedEmail);
        } else {
            navigate('/login'); // Redirect to login if username is missing
        }
    }, [navigate]);

    // Function to validate form inputs
    const validateForm = () => {
        const { instance_id } = formDataa;
        if (!instance_id) {
            setAlertMessage('Please fill in Instance ID');
            return false;
        }
        if (instance_id.length < 4) {
            setAlertMessage('Please enter an Instance ID with a minimum length of 4 characters');
            return false;
        }
        return true;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormDataa((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setAlertMessage(null);

        if (!validateForm()) {
            setLoading(false);
            return;
        }

        try {
            const apiUrl = process.env.REACT_APP_API_URL;
            const token = localStorage.getItem('token');
            const email = localStorage.getItem('email');

            // Create instance with user association
            const instanceData = {
                instance_id: formDataa.instance_id,
                register_id: email  // Add the email as register_id
            };

            const response = await axios.post(`${apiUrl}/save-instance`, instanceData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Store the instance ID
            localStorage.setItem('current_instance_id', formDataa.instance_id);
            
            // Navigate to QR code page
            navigate(`/${formDataa.instance_id}/qrcode`);
        } catch (error) {
            console.error("Error creating instance:", error);
            setAlertMessage(error.response?.data?.message || "Failed to create instance");
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="instance-headi">Generate your Unique ID</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-instance">
                    <div className="form-groupie">
                        <label>Enter your unique Instance ID *</label>
                        <input 
                            type="text" 
                            name="instance_id" 
                            placeholder="Enter minimum 4 characters Instance ID"
                            value={formDataa.instance_id} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <button type="submit" disabled={loading}>
                        {loading ? "Generating..." : "Generate"}
                    </button>
                </div>
            </form>
            {alertMessage && <p className="alertttt">{alertMessage}</p>}
            {error && <p className="error">{error}</p>}
            {loading && <p>Loading...</p>}
        </div>
    );
};

export default Instance;