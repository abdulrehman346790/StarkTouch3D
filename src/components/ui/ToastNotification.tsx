'use client';
// ============================================
// Toast Notification Component
// Shows feedback for Save/Load/Clear actions
// ============================================

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
    icon: string;
}

// Global toast state
let toastId = 0;
let addToastFn: ((message: string, type: ToastType, icon: string) => void) | null = null;

// Helper function to show toast from anywhere
export function showToast(message: string, type: ToastType = 'info', icon: string = '📢') {
    if (addToastFn) {
        addToastFn(message, type, icon);
    }
}

// Preset toasts for common actions
export const Toasts = {
    saving: () => showToast('Saving...', 'info', '💾'),
    saved: () => showToast('Game Saved!', 'success', '✅'),
    loading: () => showToast('Loading...', 'info', '📂'),
    loaded: () => showToast('Game Loaded!', 'success', '✅'),
    cleared: () => showToast('All Blocks Cleared!', 'warning', '🗑️'),
    error: (msg: string) => showToast(msg, 'error', '❌'),
};

export default function ToastContainer() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        // Register the add toast function globally
        addToastFn = (message: string, type: ToastType, icon: string) => {
            const newToast: Toast = {
                id: toastId++,
                message,
                type,
                icon,
            };
            setToasts((prev) => [...prev, newToast]);

            // Auto remove after 2.5 seconds
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
            }, 2500);
        };

        return () => {
            addToastFn = null;
        };
    }, []);

    const getBackgroundColor = (type: ToastType) => {
        switch (type) {
            case 'success': return 'rgba(76, 175, 80, 0.95)';
            case 'warning': return 'rgba(255, 152, 0, 0.95)';
            case 'error': return 'rgba(244, 67, 54, 0.95)';
            default: return 'rgba(33, 150, 243, 0.95)';
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
        }}>
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    style={{
                        background: getBackgroundColor(toast.type),
                        color: '#FFFFFF',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '1rem',
                        fontWeight: '500',
                        animation: 'slideIn 0.3s ease-out',
                        minWidth: '200px',
                    }}
                >
                    <span style={{ fontSize: '1.2rem' }}>{toast.icon}</span>
                    {toast.message}
                </div>
            ))}

            <style jsx>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(100px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
        </div>
    );
}
