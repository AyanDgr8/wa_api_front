// src/components/routes/Afirst/Afirst.js

import React from "react";
import { Routes, Route } from 'react-router-dom';
import Login from "../Sign/Login/Login";
import Logout from "../Sign/Logout/Logout";
import Register from "../Sign/Register/Register";
import Instance from "../Forms/Instance/Instance";
import Qrcode from "../Forms/Qrcode/Qrcode";
import Messenger from "../Forms/Messenger/Messenger";
import Subscription from "../Forms/Subscription/Subscription";
import ForgotPassword from "../Sign/ForgotPassword/ForgotPassword";
import ResetPassword from "../Sign/ResetPassword/ResetPassword";
import Reports from "../Forms/Reports/Reports";

const Afirst = () => {
    return (
        <Routes>
            
            {/* Register a new user */}
            <Route path="/register" element={<Register />} />

            {/* Login route */}
            <Route path="/login" element={<Login />} />

            {/* Logout route */}
            <Route path="/logout" element={<Logout />} />

            {/* Forgot password route */}
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Reset password route - updated to include both id and token */}
            <Route path="/reset-password/:id/:token" element={<ResetPassword />} />

            {/* Create instance route */}
            <Route path="/create-instance" element={<Instance />} />

            {/* qrcode route */}
            <Route path="/:id/generate" element={<Instance />} />

            {/* qrcode route */}
            <Route path="/:id/instance" element={<Qrcode />} />

            {/* qrcode route */}
            <Route path="/:id/qrcode" element={<Qrcode />} />

            {/* Post message route */}
            <Route path="/:id/message" element={<Messenger />} />

            {/* Subscription route */}
            <Route path="/:id/subscription" element={<Subscription />} />

            {/* Reports route */}
            <Route path="/reports" element={<Reports />} />

            {/* qrcode route */}
            {/* <Route path="/:id/generation" element={<Qrcode />} /> */}

            {/* qrcode route */}
            {/* <Route path="/:id/reset" element={<Qrcode />} /> */}
            {/* <Route path="/:id/reset" element={<Qrcode />} /> */}

            {/* Post message route */}
            {/* <Route path="/:id/upload-media" element={<Messenger />} /> */}

            {/* Post message route */}
            {/* <Route path="/:id/upload-csv" element={<Messenger />} /> */}

            {/* Post message route */}
            {/* <Route path="/:id/send-media" element={<Messenger />} /> */}

        </Routes>
    );
};

export default Afirst;
