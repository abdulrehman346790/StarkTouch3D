/**
 * types for screen/video dimensions
 */
export interface Dimensions {
    width: number;
    height: number;
}

/**
 * Calculates the scale and offsets to simulate 'object-fit: contain'
 * Ensures the entire video is visible and centered, preserving aspect ratio.
 */
export function getContainDimensions(video: Dimensions, screen: Dimensions) {
    if (video.width === 0 || video.height === 0 || screen.width === 0 || screen.height === 0) {
        return { scale: 1, offsetX: 0, offsetY: 0, scaledWidth: 0, scaledHeight: 0 };
    }

    const videoRatio = video.width / video.height;
    const screenRatio = screen.width / screen.height;

    let scale = 1;

    if (screenRatio > videoRatio) {
        // Screen is wider than video - fit to height (bars on sides)
        scale = screen.height / video.height;
    } else {
        // Screen is taller than video - fit to width (bars on top/bottom)
        scale = screen.width / video.width;
    }

    // Calculate dimensions after scaling
    const scaledWidth = video.width * scale;
    const scaledHeight = video.height * scale;

    // Calculate centering offsets
    const offsetX = (screen.width - scaledWidth) / 2;
    const offsetY = (screen.height - scaledHeight) / 2;

    return { scale, offsetX, offsetY, scaledWidth, scaledHeight };
}

/**
 * Transforms normalized video coordinates (0-1) to screen coordinates (pixels)
 * based on 'cover' fitting.
 */
export function videoToScreenCoordinates(
    xNorm: number,
    yNorm: number,
    video: Dimensions,
    screen: Dimensions,
    mirrorX: boolean = true
) {
    const { scale, offsetX, offsetY } = getContainDimensions(video, screen);

    // X is mirrored for selfie view
    const xVideo = mirrorX ? (1 - xNorm) : xNorm;

    // Scale and offset
    const xScreen = (xVideo * video.width * scale) + offsetX;
    const yScreen = (yNorm * video.height * scale) + offsetY;

    return { x: xScreen, y: yScreen };
}

/**
 * Transforms normalized video coordinates (0-1) to Normalized Device Coordinates (NDC) (-1 to 1)
 * This effectively converts "Video Space" directly to "Three.js Screen Space" without intermediate pixels if needed,
 * but going via screen pixels is often safer for intermediate logic.
 */
export function videoToNDC(
    xNorm: number,
    yNorm: number,
    video: Dimensions,
    screen: Dimensions,
    mirrorX: boolean = true
) {
    const screenPos = videoToScreenCoordinates(xNorm, yNorm, video, screen, mirrorX);

    // Convert screen pixels to NDC (-1 to 1)
    return {
        x: (screenPos.x / screen.width) * 2 - 1,
        y: -(screenPos.y / screen.height) * 2 + 1 // Y is inverted in 3D
    };
}
