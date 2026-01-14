'use client';
// ============================================
// Loading Screen Component
// Shows while app is initializing
// ============================================

import { useEffect, useState } from 'react';

interface LoadingScreenProps {
    isReady: boolean;
}

export default function LoadingScreen({ isReady }: LoadingScreenProps) {
    const [show, setShow] = useState(true);
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        if (isReady) {
            // Start fade out animation
            setFadeOut(true);
            // Remove from DOM after animation
            const timer = setTimeout(() => setShow(false), 500);
            return () => clearTimeout(timer);
        }
    }, [isReady]);

    if (!show) return null;

    return (
        <div
            className={`loading-screen ${fadeOut ? 'fade-out' : ''}`}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                transition: 'opacity 0.5s ease-out',
                opacity: fadeOut ? 0 : 1,
            }}
        >
            {/* Logo/Title */}
            <h1 style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                color: '#00FFFF',
                textShadow: '0 0 20px #00FFFF, 0 0 40px #00FFFF',
                marginBottom: '2rem',
                fontFamily: 'monospace',
            }}>
                STARKTOUCH 3D
            </h1>

            {/* Spinner */}
            <div className="spinner" style={{
                width: '60px',
                height: '60px',
                border: '4px solid rgba(0, 255, 255, 0.2)',
                borderTop: '4px solid #00FFFF',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '2rem',
            }} />

            {/* Loading Text */}
            <p style={{
                color: '#FFFFFF',
                fontSize: '1.2rem',
                opacity: 0.8,
                animation: 'pulse 1.5s ease-in-out infinite',
            }}>
                Loading AR Experience...
            </p>

            {/* Sub Text */}
            <p style={{
                color: '#888',
                fontSize: '0.9rem',
                marginTop: '1rem',
            }}>
                Initializing Camera & Hand Tracking
            </p>

            {/* CSS Animations */}
            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.8; }
                    50% { opacity: 0.4; }
                }
            `}</style>
        </div>
    );
}
