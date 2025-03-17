// src/components/Main/Main.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './Main.css';
import Home from '../routes/Home/Home';
import Landing from '../routes/Landing/Landing';

const Main = () => {
    return (
        <Router>

                <Routes>
                    {/* Route to the Landing component at the root path */}
                    <Route path="/" element={<Landing />} />
                    {/* Add a route for the Afirst component */}
                    <Route path="*" element={<Home />} />
                </Routes>
        </Router>
    );
};


export default Main;
