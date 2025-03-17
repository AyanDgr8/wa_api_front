// src/components/routes/Sign/Login/Login.js

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import CryptoJS from "crypto-js";
import api from '../../../../utils/api';  
import { getDeviceId } from '../../../../utils/device';
import "./Login.css";

const Login = () => {
    const [alertMessage, setAlertMessage] = useState(null);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleEmailChange = async (e) => {
        const email = e.target.value;
        setFormData(prev => ({ ...prev, email }));
        
        if (email) {
            try {
                const response = await api.post('/check-user-password', { email });
                setShowForgotPassword(response.data.verified === 'yes' && response.data.hasPassword);
            } catch (error) {
                console.error('Error checking user status:', error);
                setShowForgotPassword(false);
            }
        } else {
            setShowForgotPassword(false);
        }
    };

    const handlePasswordChange = (e) => {
        setFormData({ ...formData, password: e.target.value });
    };

    const validateForm = () => {
        const { email, password } = formData;
        if (!email || !password) {
            setAlertMessage('Please fill in all the required fields');
            return false;
        }
        if (password.length < 8) {
            setAlertMessage('Please enter a password with a minimum length of 8 characters');
            return false;
        }
        return true;
    };

    // Function to generate a random 16-character string
    const generateRandomString = () => {
        return CryptoJS.lib.WordArray.random(8).toString(CryptoJS.enc.Base64).slice(0, 16); // 16 characters
    };
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            // Get device ID
            const deviceId = getDeviceId();
            
            // Login user using our api service with device ID in headers
            const loginResponse = await api.post('/login', formData, {
                headers: {
                    'x-device-id': deviceId
                }
            });
            
            // Check if user is verified
            if (loginResponse.data.verified === 'no') {
                setAlertMessage('Your account is not verified. Please contact support for verification.');
                setLoading(false);
                return;
            }

            const { token, username, email } = loginResponse.data;
            
            // Store token and email
            localStorage.setItem("token", token);
            localStorage.setItem("email", email);

            // Check if user has an instance using api service
            const instanceResponse = await api.get('/user-instance');

            if (instanceResponse.data.hasInstance) {
                const { instanceId } = instanceResponse.data;
                
                // Store instance ID
                localStorage.setItem("current_instance_id", instanceId);
                
                // Redirect to QR code page if instance exists
                navigate(`/${instanceId}/qrcode`);
            } else {
                // Generate random username if we need to create a new instance
                const randomUsername = generateRandomString();
                localStorage.setItem("username", randomUsername);
                
                // Redirect to create instance page
                navigate('/create-instance');
            }
        } catch (error) {
            console.error('Login error:', error);
            setAlertMessage(error.response?.data?.message || 'An error occurred during login');
            setLoading(false);
        }
    };

    useEffect(() => {
        if (alertMessage) {
            alert(alertMessage);
            setAlertMessage(null);
        }
    }, [alertMessage]);

    return (
        <div className="login-page">
            <h2 className="login-headi">Login</h2>
            <div className="login-container">
                <div className="login-left">
                    <form onSubmit={handleSubmit}>
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleEmailChange}
                            placeholder="Email"
                            required
                        />
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handlePasswordChange}
                            placeholder="Password"
                            required
                        />
                        {showForgotPassword && (
                            <div className="forgot-password-link">
                                <Link to="/forgot-password">Forgot Password?</Link>
                            </div>
                        )}
                        <button type="submit" disabled={loading}>
                            {loading ? "Login.." : "Login"}
                        </button>
                    </form>
                </div>

                <div className="login-right">
                    <img
                        src="/uploads/sign.webp"
                        className="sign-icon"
                        alt="sign icon"
                        aria-label="sign"
                    />
                </div>
            </div>
        </div>
    );
};

export default Login;