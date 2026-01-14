'use client';
// ============================================
// Retro Overlay - HUD with block counter
// ============================================

import { useBlockCount, useMode } from '../../store/useVoxelStore';

interface RetroOverlayProps {
    isReady?: boolean;
    fps?: number;
}

export default function RetroOverlay({ isReady = false, fps }: RetroOverlayProps) {
    const blockCount = useBlockCount();
    const mode = useMode();

    return (
        <div className="retro-overlay">
            {/* Status Indicator */}
            <div className="status-indicator">
                <span className={`status-dot ${isReady ? 'ready' : 'loading'}`} />
                <span className="status-text">{isReady ? 'READY' : 'LOADING...'}</span>
            </div>

            {/* Block Counter */}
            <div className="block-counter">
                <span className="counter-label">BLOCKS</span>
                <span className="counter-value">{blockCount}</span>
            </div>

            {/* Mode Indicator */}
            <div className={`mode-indicator ${mode.toLowerCase()}`}>
                <span className="mode-icon">{mode === 'BUILD' ? '🔨' : '🧭'}</span>
                <span className="mode-text">{mode}</span>
            </div>

            {/* Instructions */}
            <div className="instructions">
                <p>✋ 1 HAND = BUILD</p>
                <p>🤲 2 HANDS = NAVIGATE</p>
                <p>👌 PINCH = PLACE BLOCK</p>
            </div>

            {/* FPS Counter (optional) */}
            {fps !== undefined && (
                <div className="fps-counter">
                    <span>{fps} FPS</span>
                </div>
            )}

            <style jsx>{`
        .retro-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 100;
          font-family: 'Press Start 2P', 'Courier New', monospace;
          color: #00FFFF;
          text-shadow: 0 0 10px #00FFFF, 0 0 20px #00FFFF;
        }

        .status-indicator {
          position: absolute;
          top: 20px;
          left: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          animation: pulse 1s infinite;
        }

        .status-dot.ready {
          background: #00FF00;
          box-shadow: 0 0 10px #00FF00;
        }

        .status-dot.loading {
          background: #FFFF00;
          box-shadow: 0 0 10px #FFFF00;
        }

        .status-text {
          font-size: 14px;
          letter-spacing: 2px;
        }

        .block-counter {
          position: absolute;
          top: 20px;
          right: 20px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .counter-label {
          font-size: 10px;
          opacity: 0.7;
          letter-spacing: 3px;
        }

        .counter-value {
          font-size: 32px;
          color: #FF00FF;
          text-shadow: 0 0 10px #FF00FF, 0 0 20px #FF00FF;
        }

        .mode-indicator {
          position: absolute;
          top: 80px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: 2px solid currentColor;
          border-radius: 4px;
        }

        .mode-indicator.build {
          color: #00FFFF;
          border-color: #00FFFF;
          box-shadow: 0 0 10px #00FFFF;
        }

        .mode-indicator.navigate {
          color: #4169E1;
          border-color: #4169E1;
          box-shadow: 0 0 10px #4169E1;
        }

        .mode-icon {
          font-size: 20px;
        }

        .mode-text {
          font-size: 12px;
          letter-spacing: 2px;
        }

        .instructions {
          position: absolute;
          bottom: 20px;
          left: 20px;
          font-size: 10px;
          line-height: 2;
          opacity: 0.8;
        }

        .instructions p {
          margin: 0;
        }

        .fps-counter {
          position: absolute;
          bottom: 20px;
          right: 20px;
          font-size: 10px;
          color: #FFFF00;
          opacity: 0.7;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
        </div>
    );
}
