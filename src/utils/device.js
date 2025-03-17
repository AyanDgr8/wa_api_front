// src/utils/device.js 

import { v4 as uuidv4 } from 'uuid';

export const getDeviceId = () => {
    let deviceId = sessionStorage.getItem('deviceId');
    if (!deviceId) {
        deviceId = uuidv4();
        sessionStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
};

export const clearDeviceId = () => {
    sessionStorage.removeItem('deviceId');
};