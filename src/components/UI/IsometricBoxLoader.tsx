import React from 'react';

interface IsometricBoxLoaderProps {
    isSuccess: boolean;
}

const IsometricBoxLoader: React.FC<IsometricBoxLoaderProps> = ({ isSuccess }) => {
    const repeatCount = isSuccess ? "1" : "indefinite";
    const fill = isSuccess ? "freeze" : "remove";
    // Using a key forces the SVG to restart all CSS and SMIL animations when isSuccess changes to true
    return (
        <svg key={isSuccess ? 'success' : 'loading'} className={`isometric-anim-svg ${isSuccess ? 'success' : 'loading'}`} viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="checkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#46F59B" />
                    <stop offset="100%" stopColor="#21EA7C" />
                </linearGradient>
                <linearGradient id="tapeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(255, 255, 255, 0.4)" />
                    <stop offset="100%" stopColor="rgba(255, 255, 255, 0.1)" />
                </linearGradient>
            </defs>

            {/* Main Floor Shadow */}
            <ellipse className="box-shadow" cx="300" cy="360" rx="140" ry="70" fill="#000" />

            {/* Isometric Box */}
            <g className="box-drop">
                <g transform="translate(100, 100)">
                    {/* Floor Inside */}
                    <polygon points="200,200 300,250 200,300 100,250" fill="#814A17" />

                    {/* Inside Walls */}
                    <polygon points="200,200 100,250 100,150 200,100" fill="#9F6024" />
                    <polygon points="200,200 300,250 300,150 200,100" fill="#8D531D" />

                    {/* Flap 2 (Inner Back-Left) */}
                    <polygon id="flap2">
                        <animate attributeName="points"
                            values="
                                200,100 100,150 100,200 200,150;
                                200,100 100,150 100,200 200,150;
                                200,100 100,150 50,125 150,75;
                                200,100 100,150 100,100 200,50;
                                200,100 100,150 150,175 250,125;
                                200,100 100,150 150,175 250,125"
                            keyTimes="0; 0.18; 0.23; 0.28; 0.33; 1" dur="4s" repeatCount={repeatCount} fill={fill} />
                        <animate attributeName="fill"
                            values="#B77735; #B77735; #FFC887; #C9833A; #D9944C; #D9944C"
                            keyTimes="0; 0.18; 0.23; 0.28; 0.33; 1" dur="4s" repeatCount={repeatCount} fill={fill} />
                    </polygon>

                    {/* Flap 1 (Inner Back-Right) */}
                    <polygon id="flap1">
                        <animate attributeName="points"
                            values="
                                200,100 300,150 300,200 200,150; 
                                200,100 300,150 300,200 200,150; 
                                200,100 300,150 350,125 250,75; 
                                200,100 300,150 300,100 200,50; 
                                200,100 300,150 250,175 150,125; 
                                200,100 300,150 250,175 150,125"
                            keyTimes="0; 0.18; 0.23; 0.28; 0.33; 1" dur="4s" repeatCount={repeatCount} fill={fill} />
                        <animate attributeName="fill"
                            values="#9E6730; #9E6730; #FFC887; #D9944C; #EAAA6A; #EAAA6A"
                            keyTimes="0; 0.18; 0.23; 0.28; 0.33; 1" dur="4s" repeatCount={repeatCount} fill={fill} />
                    </polygon>

                    {/* Front Walls Outside */}
                    <polygon points="100,250 200,300 200,200 100,150" fill="#DE9A4E" />
                    <polygon points="300,250 200,300 200,200 300,150" fill="#CA8134" />
                    <polygon points="100,250 200,300 200,290 100,240" fill="rgba(255,255,255,0.15)" />

                    {/* Flap 4 (Outer Front-Left) */}
                    <polygon id="flap4">
                        <animate attributeName="points"
                            values="
                                100,150 200,200 200,250 100,200;
                                100,150 200,200 200,250 100,200;
                                100,150 200,200 150,225 50,175;
                                100,150 200,200 200,150 100,100;
                                100,150 200,200 250,175 150,125;
                                100,150 200,200 250,175 150,125"
                            keyTimes="0; 0.33; 0.38; 0.43; 0.48; 1" dur="4s" repeatCount={repeatCount} fill={fill} />
                        <animate attributeName="fill"
                            values="#D9944C; #D9944C; #FFF0CA; #D9944C; #FFC887; #FFC887"
                            keyTimes="0; 0.33; 0.38; 0.43; 0.48; 1" dur="4s" repeatCount={repeatCount} fill={fill} />
                    </polygon>

                    {/* Flap 3 (Outer Front-Right) */}
                    <polygon id="flap3">
                        <animate attributeName="points"
                            values="
                                300,150 200,200 200,250 300,200;
                                300,150 200,200 200,250 300,200;
                                300,150 200,200 250,225 350,175;
                                300,150 200,200 200,150 300,100;
                                300,150 200,200 150,175 250,125;
                                300,150 200,200 150,175 250,125"
                            keyTimes="0; 0.33; 0.38; 0.43; 0.48; 1" dur="4s" repeatCount={repeatCount} fill={fill} />
                        <animate attributeName="fill"
                            values="#C9833A; #C9833A; #FFF0CA; #EAAA6A; #FFD49A; #FFD49A"
                            keyTimes="0; 0.33; 0.38; 0.43; 0.48; 1" dur="4s" repeatCount={repeatCount} fill={fill} />
                    </polygon>

                    {/* Sealing Tape */}
                    <polygon fill="#B08B62">
                        <animate attributeName="points"
                            values="
                                140,170 160,180 160,180 140,170;
                                140,170 160,180 160,180 140,170;
                                140,170 160,180 260,130 240,120;
                                140,170 160,180 260,130 240,120"
                            keyTimes="0; 0.48; 0.53; 1" dur="4s" repeatCount={repeatCount} fill={fill} />
                        <animate attributeName="opacity"
                            values="0; 0; 0.95; 0.95"
                            keyTimes="0; 0.48; 0.49; 1" dur="4s" repeatCount={repeatCount} fill={fill} />
                    </polygon>

                    <polygon fill="url(#tapeGrad)">
                        <animate attributeName="points"
                            values="
                                140,170 160,180 160,180 140,170;
                                140,170 160,180 160,180 140,170;
                                140,170 160,180 260,130 240,120;
                                140,170 160,180 260,130 240,120"
                            keyTimes="0; 0.48; 0.53; 1" dur="4s" repeatCount={repeatCount} fill={fill} />
                        <animate attributeName="opacity"
                            values="0; 0; 1; 1"
                            keyTimes="0; 0.48; 0.49; 1" dur="4s" repeatCount={repeatCount} fill={fill} />
                    </polygon>
                </g>
            </g>

            {/* Checkmark Shadow */}
            <ellipse className="check-shadow" cx="300" cy="370" rx="60" ry="30" fill="#000" />

            {/* Checkmark Confirmed */}
            <g className="check-wrapper">
                <circle cx="300" cy="280" r="100" fill="url(#checkGrad)" filter="drop-shadow(0 20px 30px rgba(33, 234, 124, 0.4))" />
                <path d="M 255 285 L 285 315 L 350 245" fill="none" stroke="#fff" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
            </g>

            {/* Burst Particles */}
            <circle className="particle p1" cx="0" cy="0" r="16" fill="#21EA7C" />
            <circle className="particle p2" cx="0" cy="0" r="12" fill="#21EA7C" />
            <circle className="particle p3" cx="0" cy="0" r="20" fill="#21EA7C" />
            <circle className="particle p4" cx="0" cy="0" r="14" fill="#21EA7C" />
            <circle className="particle p5" cx="0" cy="0" r="10" fill="#21EA7C" />

        </svg>
    );
};

export default IsometricBoxLoader;
