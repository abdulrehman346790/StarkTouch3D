// ============================================
// Sound Manager - Play Minecraft-style sounds
// ============================================

// Cache audio elements to avoid recreating them
const audioCache: { [key: string]: HTMLAudioElement } = {};

/**
 * Play a sound effect
 * @param soundPath - Path relative to /public folder
 * @param volume - Volume level 0-1
 */
export function playSound(soundPath: string, volume: number = 0.5): void {
    if (typeof window === 'undefined') return;

    try {
        // Check cache first
        let audio = audioCache[soundPath];

        if (!audio) {
            audio = new Audio(soundPath);
            audioCache[soundPath] = audio;
        }

        // Clone the audio to allow overlapping sounds
        const soundClone = audio.cloneNode() as HTMLAudioElement;
        soundClone.volume = Math.min(1, Math.max(0, volume));
        soundClone.play().catch(() => {
            // Ignore autoplay errors
        });
    } catch (e) {
        console.warn('Sound play failed:', e);
    }
}

// Predefined sound effects
export const SOUNDS = {
    BLOCK_PLACE: '/sounds/block_place.wav',
    BLOCK_BREAK: '/sounds/block_break.wav', // For future use
};

/**
 * Play block placement sound
 */
export function playBlockPlaceSound(): void {
    playSound(SOUNDS.BLOCK_PLACE, 0.6);
}

/**
 * Play block break sound  
 */
export function playBlockBreakSound(): void {
    playSound(SOUNDS.BLOCK_BREAK, 0.6);
}
