// src/components/routes/Home/Home.js

import React from "react";
import Header from "../Header/Header";
import Afirst from "../Afirst/Afirst";


const Home = ()  =>{
    return (
        <div className="everything">
            <div className="main-first">
                <Header />
            </div>
            <div className="main-second">
                <div className="second-form">
                    <Afirst />
                </div>
            </div>
        </div>
    );
};

export default Home;