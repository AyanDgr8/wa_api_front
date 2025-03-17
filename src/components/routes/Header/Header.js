// src/components/routes/Other/Header/Header.js

import React from "react";
import { useNavigate, Link } from 'react-router-dom';
// import FileUpload from './FileUpload';
import "./Header.css";

const Header = () => {
    const navigate = useNavigate(); 

    const handleLogout = async () => {
        const confirmLogout = window.confirm("Are you sure you want to log out?");
        if (confirmLogout) {
            try {
                const token = localStorage.getItem("token");
                const apiUrl = process.env.REACT_APP_API_URL; // Get the base URL from the environment variable
    
                const response = await fetch(`${apiUrl}/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`, // Pass the token for auth
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    localStorage.removeItem("token");
                    navigate("/login");
                } else {
                    alert("Error during logout, please try again.");
                }
            } catch (error) {
                console.error("Logout error:", error);
                alert("Failed to logout. Please try again later.");
            }
        }
    };

    const isLoggedIn = !!localStorage.getItem("token");

    return (
        <div className="header-container">
            {/* <Link to="/:id/qrcode"> */}
                <img 
                    src="/uploads/logo.webp"
                    className="logo"
                    alt="Company Logo"
                    aria-label="Logo"
                />
            {/* </Link> */}
            <div className="header-right">
                {isLoggedIn ? (
                    <>
                    {/* Add Reports button here */}
                    <Link to="/reports" className="reports-link">
                        <button className="reports-button">Reports</button>
                    </Link>

                    <div className="profile-section">
                        <img 
                        src="/uploads/profile.svg"
                        className="pro-icon"
                        alt="profile icon"
                        aria-label="Profile"
                        onClick={handleLogout} // Logout on click
                        />
                        <span onClick={handleLogout} style={{ cursor: 'pointer', marginLeft: '8px', fontSize: '0.85rem', color: '#666' }}>Logout</span>
                    </div>
                </>

                ) : (
                    <Link to="/login">
                        <img 
                            src="/uploads/profile.svg"
                            className="pro-icon"
                            alt="profile icon"
                            aria-label="Profile"
                        />
                    </Link>
                )}
            </div> 
        </div>
    );
};

export default Header;
