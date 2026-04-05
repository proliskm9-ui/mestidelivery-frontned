export const generateDisplacementMap = (width: number, height: number, bezel: number = 0.5): string => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // We already have the roundedBoxSDF logic from before.
    // To make refraction "stronger" visually in the map itself, 
    // we can ensure the gradient covers more area or is sharper.
    // The previous implementation was correct mathematically.
    // The main strength control is the SVG filter `scale`. 
    // However, let's optimize the map generation slightly to ensure full range [0, 255] usage.

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 30;

    // Helper SDF for Rounded Box
    const roundedBoxSDF = (px: number, py: number, w: number, h: number, r: number) => {
        const x = Math.abs(px) - (w / 2 - r);
        const y = Math.abs(py) - (h / 2 - r);
        return Math.min(Math.max(x, y), 0.0) + Math.sqrt(Math.max(x, 0.0) ** 2 + Math.max(y, 0.0) ** 2) - r;
    };

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const rx = x - centerX;
            const ry = y - centerY;
            const dist = roundedBoxSDF(rx, ry, width, height, radius);

            let red = 128;
            let green = 128;
            let alpha = 255;

            if (dist <= 0) { // Inside
                const d = -dist;
                // Increase bezel area to make the curve gentler/wider, affecting more pixels?
                // Or keep consistent.
                const bezelWidth = Math.min(width, height) * bezel * 0.5;

                if (d < bezelWidth) {
                    const t = d / bezelWidth;
                    const delta = 1.0; // Slightly larger delta for smoother gradient check
                    const d1 = roundedBoxSDF(rx + delta, ry, width, height, radius);
                    const d2 = roundedBoxSDF(rx - delta, ry, width, height, radius);
                    const d3 = roundedBoxSDF(rx, ry + delta, width, height, radius);
                    const d4 = roundedBoxSDF(rx, ry - delta, width, height, radius);

                    let nx = (d1 - d2);
                    let ny = (d3 - d4);
                    const len = Math.sqrt(nx * nx + ny * ny);
                    if (len > 0) { nx /= len; ny /= len; }

                    // Surface curve shape: Convex Power
                    // Power 2 is spherical. Higher power flattens center more.
                    // (1-t)^2 gives a nice curve from 1 (edge) to 0 (flat start).
                    const mag = Math.pow(1 - t, 2);

                    // Map -1..1 to 0..255
                    red = 128 + nx * 127 * mag;
                    green = 128 + ny * 127 * mag;
                }
            } else {
                // Outside: Let's make it fully transparent? 
                // No, standard displacement map alpha doesn't clip usually.
                // Standard alpha=0 might fail. Keep opaque neutral gray.
                red = 128; green = 128; alpha = 0; // Transparent outside helps clean edges?
            }

            const index = (y * width + x) * 4;
            data[index] = red;
            data[index + 1] = green;
            data[index + 2] = 128;
            data[index + 3] = alpha;
        }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL();
};
