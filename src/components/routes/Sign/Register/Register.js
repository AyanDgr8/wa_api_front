// /src/components/routes/Sign/Register/Register.js

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Register.css"

const Register = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // Step 1: Phone verification, Step 2: Registration form, Step 3: OTP verification
    const [verificationEmail, setVerificationEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [otpTimer, setOtpTimer] = useState(60); // Changed from 15 to 60 seconds
    const [isLoading, setIsLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null);
    const [alertType, setAlertType] = useState('text'); // Add new state for alert type
    const [formData, setFormData] = useState({
        username: "",
        telephone: "",
        email: "",
        password: "",
        confirm_password: "",
        address: "",
        card_select: "Aadhaar", // Default to Aadhaar
        card_detail: "",
        company_name: "",
        company_gst: "",
        transactionId: "",
        fwdp: "",
        codeVerifier: "",
        totalAttempts: 0, // Track total attempts (including resends)
    });

    // Check if user is already registered
    useEffect(() => {
        const checkRegistrationStatus = async () => {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    // Verify if token is valid
                    const response = await axios.get(`${process.env.REACT_APP_API_URL}/current-user`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (response.status === 200) {
                        navigate('/login');
                    } else {
                        // If token is invalid, remove it
                        localStorage.removeItem('token');
                        localStorage.removeItem('isRegistered');
                    }
                }
            } catch (error) {
                // If token verification fails, remove it
                localStorage.removeItem('token');
                localStorage.removeItem('isRegistered');
            }
        };

        checkRegistrationStatus();
    }, [navigate]);

    // Validation functions
    const isPanValid = (pan) => {
        const panRegex = /^[A-Z0-9]{0,10}$/;
        return panRegex.test(pan);
    };

    const isAadharValid = (aadhar) => {
        const aadharRegex = /^[0-9]{0,12}$/;
        return aadharRegex.test(aadhar);
    };

    const isGSTValid = (gst) => {
        // Allow partial input for better UX
        if (gst.length < 15) {
            const partialGSTRegex = /^[0-9]{0,2}[A-Z]{0,5}[0-9]{0,4}[A-Z]{0,1}[1-9A-Z]{0,1}Z{0,1}[0-9A-Z]{0,1}$/;
            return partialGSTRegex.test(gst);
        }
        // Full validation for complete GST number
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        return gstRegex.test(gst);
    };

    const isPasswordValid = (password) => {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        return passwordRegex.test(password);
    };

    const handlePhoneVerification = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            // First check if user is already registered in the register table
            const checkRegistrationResponse = await axios.get(`${process.env.REACT_APP_API_URL}/check-registration/${verificationEmail}`);
            
            if (checkRegistrationResponse.data.isRegistered) {
                setAlertType('text');
                setAlertMessage('This email is already registered. Please login instead.');
                setTimeout(() => {
                    navigate('/login', { replace: true });
                }, 2000);
                return;
            }

            // If not registered, proceed with verification
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/verify-registration/${verificationEmail}`);
            const registrationData = response.data.data;
            
            // Pre-fill the form with data from website_registration
            setFormData({
                ...formData,
                username: `${registrationData.f_name} ${registrationData.l_name}`,
                telephone: registrationData.phone,
                email: registrationData.email,
                address: registrationData.address || "",
                company_name: registrationData.company_name || "",
                company_gst: registrationData.company_gst || "",
            });
            
            setStep(2); // Move to registration form
        } catch (error) {
            if (error.response?.status === 404) {
                setAlertType('text');
                setAlertMessage('Phone number not found in registrations. Please complete the payment process first.');
            } else {
                setAlertType('text');
                setAlertMessage(error.response?.data?.message || 'Verification failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Prevent changing card_select
        if (name === 'card_select') {
            return;
        }

        if (name === 'card_detail') {
            if (formData.card_select === 'Aadhaar') {
                // Only allow digits for Aadhar and max length of 12
                if (/^\d*$/.test(value) && value.length <= 12) {
                    setFormData(prev => ({ ...prev, card_detail: value }));
                    
                    // Log when Aadhar number is complete
                    if (value.length === 12) {
                        console.log('Aadhar number validation complete');
                    }
                }
            } else if (formData.card_select === 'PAN') {
                // Convert to uppercase for PAN
                const upperValue = value.toUpperCase();
                if (isPanValid(upperValue)) {
                    setFormData(prev => ({ ...prev, card_detail: upperValue }));
                }
            }
        } else if (name === 'company_gst') {
            // Convert GST to uppercase and validate
            const upperValue = value.toUpperCase();
            if (isGSTValid(upperValue) || upperValue === '') {
                setFormData(prev => ({ ...prev, company_gst: upperValue }));
            }
        } else {
            setFormData(prevState => ({
                ...prevState,
                [name]: value
            }));
        }
    };

    const validateForm = () => {
        console.log('Starting form validation');
        const { username, telephone, email, password, confirm_password, address, card_select, card_detail, company_gst } = formData;

        // Check if email is valid
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setAlertType('text');
            setAlertMessage('Please enter a valid email address');
            return false;
        }

        // Check if password meets requirements
        if (password.length < 6) {
            setAlertType('text');
            setAlertMessage('Password must be at least 6 characters long');
            return false;
        }

        // Check if passwords match
        if (password !== confirm_password) {
            setAlertType('text');
            setAlertMessage('Passwords do not match');
            return false;
        }

        // Check specifically for card details first
        if (!card_select || !card_detail) {
            console.log('Missing card details');
            setAlertType('text');
            setAlertMessage('Please fill in your identification details (Aadhaar)');
            return false;
        }

        if (!username || !telephone || !email || !password || !address) {
            console.log('Missing required fields:', {
                username: !username,
                telephone: !telephone,
                email: !email,
                password: !password,
                address: !address
            });
            setAlertType('text');
            setAlertMessage('Please fill in all required fields');
            return false;
        }

        // Password validation
        if (!isPasswordValid(password)) {
            console.log('Invalid password format');
            setAlertType('text');
            setAlertMessage('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number');
            return false;
        }

        // Card validation
        if (card_select === 'PAN' && !isPanValid(card_detail)) {
            console.log('Invalid PAN format');
            setAlertType('text');
            setAlertMessage('Please enter a valid PAN number');
            return false;
        }

        if (card_select === 'Aadhaar' && !isAadharValid(card_detail)) {
            console.log('Invalid Aadhar format');
            setAlertType('text');
            setAlertMessage('Please enter a valid Aadhaar number');
            return false;
        }

        // GST validation (if provided)
        if (company_gst && !isGSTValid(company_gst)) {
            console.log('Invalid GST format');
            setAlertType('text');
            setAlertMessage('Please enter a valid GST number');
            return false;
        }

        console.log('Form validation passed');
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        try {
            setIsLoading(true);
            
            // Directly initiate KYC with all user data
            const kycResponse = await axios.post(
                `${process.env.REACT_APP_API_URL}/kyc/initiate`,
                {
                    uniqueId: formData.telephone,
                    uid: formData.card_detail,
                    f_name: formData.username.split(' ')[0],
                    l_name: formData.username.split(' ').slice(1).join(' '),
                    email: formData.email,
                    phone: formData.telephone,
                    address: formData.address,
                    company_name: formData.company_name || null,
                    password: formData.password,
                    card_select: formData.card_select,
                    card_detail: formData.card_detail,
                    company_gst: formData.company_gst || null
                }
            );

            console.log('KYC Response:', kycResponse.data);

            // Handle direct login cases
            if (kycResponse.data.success && kycResponse.data.proceedToLogin) {
                setAlertType('text');
                setAlertMessage('Registration successful! Please login to continue.');
                setTimeout(() => navigate('/login'), 2000);
                return;
            }

            // Handle OTP generation success
            if (kycResponse.data.code === "200" || kycResponse.data.otpGenerated) {
                setFormData({
                    ...formData,
                    transactionId: kycResponse.data.model?.transactionId,
                    fwdp: kycResponse.data.model?.fwdp,
                    codeVerifier: kycResponse.data.model?.codeVerifier
                });
                setStep(3); // Move to OTP verification
                setOtpTimer(60); // Changed from 15 to 60 seconds
                setAlertType('text');
                setAlertMessage(kycResponse.data.message || 'Please enter the OTP sent to your Aadhar-linked mobile number');
                return;
            }

            // If we reach here, something went wrong
            throw new Error(kycResponse.data.message || 'KYC initiation failed');

        } catch (error) {
            console.error('Submit error:', error);
            setIsLoading(false);
            setAlertType('text');
            setAlertMessage(error.response?.data?.message || error.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (otpValue) => {
        try {
            if (!otpValue || otpValue.length !== 6) {
                setAlertType('text');
                setAlertMessage('Please enter a valid 6-digit OTP');
                return;
            }

            // Check total attempts (including resends)
            if (formData.totalAttempts >= 3) {
                setAlertType('text');
                setAlertMessage('Maximum attempts reached. Please contact our support team to complete the process. You can reach us via email at support@voicemeetme.com or by phone at +91 93110 45247');
                setTimeout(() => navigate('/login'), 3000);
                return;
            }

            setIsLoading(true);
            
            // Verify all required transaction details are present
            if (!formData.transactionId || !formData.fwdp || !formData.codeVerifier) {
                console.error('Missing transaction details:', {
                    transactionId: formData.transactionId,
                    fwdp: formData.fwdp,
                    codeVerifier: formData.codeVerifier
                });
                setAlertType('text');
                setAlertMessage('Missing transaction details. Please try again.');
                return;
            }

            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/kyc/submit-otp`,
                {
                    transactionId: formData.transactionId,
                    fwdp: formData.fwdp,
                    codeVerifier: formData.codeVerifier,
                    otp: otpValue,
                    shareCode: "1234",
                    isSendPdf: true,
                    email: formData.email,
                    totalAttempts: formData.totalAttempts
                }
            );

            const { data } = response;

            if (data.success) {
                setAlertType('text');
                setAlertMessage('Registration completed successfully!');
                setTimeout(() => navigate('/login'), 2000);
                return;
            }

            // Increment total attempts
            const newTotalAttempts = formData.totalAttempts + 1;
            setFormData(prev => ({
                ...prev,
                totalAttempts: newTotalAttempts
            }));

            // Check if this was the last attempt
            if (newTotalAttempts >= 3) {
                setAlertType('text');
                setAlertMessage('Maximum attempts reached. Please contact our support team to complete the process. You can reach us via email at support@voicemeetme.com or by phone at +91 93110 45247');
                setTimeout(() => navigate('/login'), 3000);
                return;
            }

            
            // Clear OTP input fields on error
            setOtpValues(['', '', '', '', '', '']);
            if (otpRefs[0]?.current) {
                otpRefs[0].current.focus();
            }

            // Reset timer to 0 to show Resend OTP button immediately
            setOtpTimer(0);

        } catch (error) {
            console.error('Error verifying OTP:', error.response?.data || error);
            
            // Increment total attempts even on error
            const newTotalAttempts = formData.totalAttempts + 1;
            setFormData(prev => ({
                ...prev,
                totalAttempts: newTotalAttempts
            }));

            // Check if this was the last attempt
            if (newTotalAttempts >= 3) {
                setAlertType('text');
                setAlertMessage('Maximum attempts reached. Please contact our support team to complete the process. You can reach us via email at support@voicemeetme.com or by phone at +91 93110 45247');
                setTimeout(() => navigate('/login'), 3000);
                return;
            }

            const remainingAttempts = 3 - newTotalAttempts;
            const attemptsMessage = remainingAttempts > 0 ? ` (${remainingAttempts} ${remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining)` : '';
            
            setAlertType('text');
            const errorMessage = typeof error.response?.data?.message === 'object' 
                ? JSON.stringify(error.response.data.message) 
                : error.response?.data?.message || `Error verifying OTP${attemptsMessage}`;
            setAlertMessage(errorMessage);
            
            // Clear OTP input fields on error
            setOtpValues(['', '', '', '', '', '']);
            if (otpRefs[0]?.current) {
                otpRefs[0].current.focus();
            }

            // Reset timer to 0 to show Resend OTP button immediately
            setOtpTimer(0);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        try {
            // Check if we've reached max total attempts (including current attempt)
            if (formData.totalAttempts >= 2) { // Changed from 3 to 2 since this will be another attempt
                setAlertType('text');
                setAlertMessage('Maximum attempts reached. Please contact our support team to complete the process. You can reach us via email at support@voicemeetme.com or by phone at +91 93110 45247');
                setTimeout(() => navigate('/login'), 3000);
                return;
            }

            setIsLoading(true);
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/kyc/initiate`,
                { 
                    uniqueId: formData.telephone, 
                    uid: formData.card_detail,
                    isResend: true,
                    totalAttempts: formData.totalAttempts
                }
            );

            if (response.data.success && response.data.model) {
                // Always update transaction details from the response
                const { transactionId, fwdp, codeVerifier } = response.data.model;
                
                // Increment total attempts on resend
                setFormData(prev => ({
                    ...prev,
                    transactionId,
                    fwdp,
                    codeVerifier,
                    totalAttempts: prev.totalAttempts + 1
                }));
                
                setOtpTimer(60); // Changed from 15 to 60 seconds
                setOtpValues(['', '', '', '', '', '']); // Clear OTP fields
                
                const remainingAttempts = 3 - (formData.totalAttempts + 1);
                const attemptsMessage = remainingAttempts > 0 ? ` (${remainingAttempts} ${remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining)` : '';
                
                setAlertType('text');
                setAlertMessage(`OTP sent successfully! Please enter the new OTP.` + attemptsMessage);
                
                // Focus first OTP input
                if (otpRefs[0]?.current) {
                    otpRefs[0].current.focus();
                }
            } else {
                setAlertType('text');
                setAlertMessage(response.data.message || 'Failed to send OTP. Please try again.');
            }
        } catch (error) {
            console.error('Resend OTP Error:', error.response?.data || error);
            setAlertType('text');
            setAlertMessage(error.response?.data?.message || 'Failed to resend OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
    // Create refs properly at the component level
    const otpRefs = [
        useRef(null),
        useRef(null),
        useRef(null),
        useRef(null),
        useRef(null),
        useRef(null)
    ];

    // Add this useEffect to focus on first OTP input when step changes to 3
    useEffect(() => {
        if (step === 3 && otpRefs[0]?.current) {
            otpRefs[0].current.focus();
        }
    }, [step]);

    const handleOTPInput = (index, value) => {
        if (!/^\d*$/.test(value)) return;

        const newOtpValues = [...otpValues];
        newOtpValues[index] = value;
        setOtpValues(newOtpValues);

        // Auto-focus next input
        if (value !== '' && index < 5) {
            otpRefs[index + 1].current.focus();
        }

        // Auto-verify when all digits are entered
        if (newOtpValues.every(v => v !== '') && newOtpValues.join('').length === 6) {
            handleVerifyOTP(newOtpValues.join(''));
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && otpValues[index] === '' && index > 0) {
            otpRefs[index - 1].current.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newOtpValues = [...otpValues];
        
        for (let i = 0; i < pastedData.length; i++) {
            if (i < 6) newOtpValues[i] = pastedData[i];
        }
        
        setOtpValues(newOtpValues);
        
        if (pastedData.length === 6) {
            handleVerifyOTP(pastedData);
        } else if (pastedData.length > 0) {
            otpRefs[pastedData.length].current.focus();
        }
    };

    const renderOTPInput = () => (
        <div className="form-group otp-container">
            <div className="otp-input-wrapper">
                <div className="otp-boxes">
                    {otpValues.map((value, index) => (
                        <input
                            key={index}
                            ref={otpRefs[index]}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={value}
                            onChange={(e) => handleOTPInput(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={handlePaste}
                            disabled={isLoading}
                            required
                            autoComplete="off"
                            className="otp-box"
                            autoFocus={index === 0}
                        />
                    ))}
                </div>
                {otpTimer > 0 && (
                    <div className="otp-timer">
                        Time remaining: {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}
                    </div>
                )}
            </div>
            <div className="otp-actions">
                {otpTimer > 0 ? (
                    <button 
                        type="button" 
                        onClick={() => handleVerifyOTP(otpValues.join(''))}
                        disabled={otpValues.join('').length !== 6 || isLoading || formData.totalAttempts >= 3}
                        className="verify-btn"
                    >
                        {isLoading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => {
                            handleResendOTP();
                            setOtpValues(['', '', '', '', '', '']);
                            setFormData(prev => ({ ...prev, totalAttempts: 0 })); // Reset attempts on resend
                        }}
                        disabled={isLoading}
                        className="resend-btn"
                    >
                        {isLoading ? 'Sending...' : 'Resend OTP'}
                    </button>
                )}
            </div>
            {formData.totalAttempts > 0 && (
                <div className="otp-attempts">
                    Attempts remaining: {Math.max(0, 3 - formData.totalAttempts)}
                </div>
            )}
        </div>
    );

    const startOtpTimer = () => {
        setOtpTimer(60); // Reset timer to 60 seconds
        const timer = setInterval(() => {
            setOtpTimer(prev => {
                if (prev <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        let timer;
        if (otpTimer > 0) {
            timer = setInterval(() => {
                setOtpTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [otpTimer]);

    useEffect(() => {
        if (alertMessage) {
            alert(alertMessage);
            setAlertMessage(null);
        }
    }, [alertMessage]);

    // Add CSS for alert links
    const alertStyle = {
        textAlign: 'center',
        margin: '10px 0',
        padding: '10px',
        borderRadius: '4px',
        backgroundColor: '#f8d7da',
        color: '#721c24',
    };

    const alertLinkStyle = {
        color: '#721c24',
        textDecoration: 'underline',
        fontWeight: 'bold',
    };

    if (step === 1) {
        return (
            <div>
                <h2 className="register-headi">Verify Registration</h2>
                <div className="register-container">
                    <div className="register-left">
                        <form onSubmit={handlePhoneVerification}>
                            <div className="form-grouppp">
                                <label>Enter the email from which you registered</label>
                                <input 
                                    type="email" 
                                    value={verificationEmail}
                                    onChange={(e) => setVerificationEmail(e.target.value)}
                                    pattern="^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$"
                                    required
                                />
                            </div>
                            <button type="submit" disabled={isLoading}>
                                {isLoading ? 'Submitting...' : 'Submit'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 3) {
        return (
            <div>
                <h2 className="register-headi">Verify OTP</h2>
                <div className="register-container">
                    <div className="register-left">
                        <div className="otp-label" style={{ textAlign: 'center', marginBottom: '15px' }}>
                            Enter the OTP sent to your Aadhar-linked mobile number
                        </div>
                        {renderOTPInput()}
                    </div>
                </div>
            </div>
        );
    }

    // Step 2: Registration form
    return (
        <div>
            <h2 className="register-headi">Complete Registration</h2>
            <div className="register-container">
                {alertMessage && (
                    <div className="alert" style={alertStyle}>
                        {alertMessage}
                    </div>
                )}
                <div className="register-left">
                    <form onSubmit={handleSubmit} noValidate={false}>
                        <div className="form-imppp">
                            <span className="form-imp-1">
                                <div className="form-grouppp">
                                    <label>Name</label>
                                    <input 
                                        type="text" 
                                        name="username" 
                                        value={formData.username} 
                                        disabled
                                    />
                                </div>
                                <div className="form-grouppp">
                                    <label>Telephone</label>
                                    <input 
                                        type="tel" 
                                        name="telephone" 
                                        value={formData.telephone} 
                                        disabled
                                    />
                                </div>
                                <div className="form-grouppp">
                                    <label>Email</label>
                                    <input 
                                        type="email" 
                                        name="email" 
                                        value={formData.email} 
                                        disabled
                                    />
                                </div>
                                <div className="form-grouppp">
                                    <label>Password*</label>
                                    <input 
                                        type="password" 
                                        name="password" 
                                        placeholder="Enter password"
                                        value={formData.password} 
                                        onChange={handleInputChange} 
                                        required 
                                        title="Password is required"
                                    />
                                    {/* Add password requirements display */}
                                    {formData.password && (
                                        <div className="password-requirements">
                                            <small>Password requirements:</small>
                                            <ul>
                                                <li style={{ color: formData.password.length >= 8 ? 'green' : 'red' }}>
                                                    {formData.password.length >= 8 ? '✓' : '×'} At least 8 characters
                                                </li>
                                                <li style={{ color: /([A-Z])/.test(formData.password) ? 'green' : 'red' }}>
                                                    {/([A-Z])/.test(formData.password) ? '✓' : '×'} One uppercase letter
                                                </li>
                                                <li style={{ color: /([a-z])/.test(formData.password) ? 'green' : 'red' }}>
                                                    {/([a-z])/.test(formData.password) ? '✓' : '×'} One lowercase letter
                                                </li>
                                                <li style={{ color: /(\d)/.test(formData.password) ? 'green' : 'red' }}>
                                                    {/(\d)/.test(formData.password) ? '✓' : '×'} One number
                                                </li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                <div className="form-grouppp">
                                    <label>Confirm Password*</label>
                                    <input 
                                        type="password" 
                                        name="confirm_password" 
                                        placeholder="Confirm password"
                                        value={formData.confirm_password} 
                                        onChange={handleInputChange} 
                                        required 
                                        title="Please confirm your password"
                                    />
                                </div>
                                <div className="form-grouppp">
                                    <label>Address</label>
                                    <textarea 
                                        name="address" 
                                        value={formData.address} 
                                        disabled
                                    />
                                </div>
                            </span>
                            
                            <span className="form-imp-2">
                                <div className="form-grouppp">
                                    <label>Company Name</label>
                                    <input 
                                        type="text" 
                                        name="company_name" 
                                        value={formData.company_name} 
                                        disabled
                                    />
                                </div>
                                <div className="form-grouppp">
                                    <label>Company GST</label>
                                    <input 
                                        type="text" 
                                        name="company_gst" 
                                        value={formData.company_gst} 
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-grouppp">
                                    <label>Card Type*</label>
                                    <select 
                                        name="card_select" 
                                        value="Aadhaar" 
                                        disabled
                                        required
                                        title="Card type is required"
                                    >
                                        <option value="Aadhaar">Aadhar Card</option>
                                    </select>
                                </div>
                                <div className="form-grouppp">
                                    <label>Aadhaar Number*</label>
                                    <input
                                        type="text"
                                        name="card_detail"
                                        value={formData.card_detail}
                                        onChange={handleInputChange}
                                        placeholder="Enter Aadhaar Number"
                                        maxLength={12}
                                        minLength={12}
                                        pattern="\d{12}"
                                        required
                                        title="Please enter a valid 12-digit Aadhaar number"
                                        onInvalid={(e) => {
                                            if (e.target.validity.valueMissing) {
                                                e.target.setCustomValidity('Aadhaar number is required');
                                            } else if (e.target.validity.patternMismatch) {
                                                e.target.setCustomValidity('Please enter a valid 12-digit Aadhaar number');
                                            }
                                        }}
                                        onInput={(e) => e.target.setCustomValidity('')}
                                    />
                                </div>
                            </span>
                        </div>
                        <button 
                            type="submit"
                            className="submit-button"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Processing...' : 'Complete Registration'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;