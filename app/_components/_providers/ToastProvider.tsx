'use client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ToastProvider() {
    return (
        <ToastContainer
            position="top-center"
            autoClose={2800}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss
            draggable={false}
            pauseOnHover
            theme="light"
            hideProgressBar
            icon={false}
            closeButton={false}
            toastClassName="ios-toast"
            className="ios-toast-container"
            style={{ zIndex: 999999 }}
        />
    );
}
