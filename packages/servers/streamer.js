import { WebSocketServer } from 'ws';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const STREAMER_PORT = 3000;

function main() {
    let streamUrl = process.env.YOUTUBE_KEY
        ? 'rtmp://a.rtmp.youtube.com/live2/' + process.env.YOUTUBE_KEY
        : null;

    if (streamUrl) {
        console.info('Initial stream URL:', streamUrl);
    } else {
        console.info('No initial stream key provided. Waiting for update...');
    }

    let ffmpegProcess = null;
    let currentClient = null;
    let wss = null;

    function startFfmpeg() {
        if (!streamUrl) {
            console.warn('Cannot start ffmpeg: no stream URL set');
            return;
        }

        if (ffmpegProcess) {
            console.log('Killing existing ffmpeg process...');
            ffmpegProcess.kill('SIGINT');
            ffmpegProcess = null;
        }

        console.log('Starting ffmpeg with URL:', streamUrl);

        ffmpegProcess = spawn('ffmpeg', [
            '-re',
            '-f', 'webm',
            '-i', '-', // input from stdin
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-tune', 'zerolatency',
            '-c:a', 'aac',
            '-strict', '-2',
            '-ar', '44100',
            '-b:a', '128k',
            '-pix_fmt', 'yuv420p',
            '-f', 'flv',
            streamUrl,
        ]);

        ffmpegProcess.stdin.on('error', (e) => {
            console.error('FFmpeg stdin error:', e);
        });

        ffmpegProcess.stderr.on('data', (data) => {
            console.log('FFmpeg:', data.toString());
        });

        ffmpegProcess.on('close', (code, signal) => {
            console.log(`FFmpeg exited with code ${code} and signal ${signal}`);
            ffmpegProcess = null;
        });
    }

    function startWebSocketServer() {
        if (wss) {
            console.warn('WebSocket server already started.');
            return;
        }
        wss = new WebSocketServer({ port: STREAMER_PORT });
        console.log(`RTMP WebSocket server started for ws://localhost:${STREAMER_PORT}`);

        wss.on('connection', (ws) => {
            if (currentClient) {
                console.log('Rejecting new client: already have one connected.');
                ws.close(1013, 'Server allows only one client at a time.');
                return;
            }

            console.log('Client connected');
            currentClient = ws;

            startFfmpeg();

            ws.on('message', (msg) => {
                if (ffmpegProcess && ffmpegProcess.stdin.writable) {
                    ffmpegProcess.stdin.write(msg);
                }
            });

            ws.on('close', () => {
                console.log('Client disconnected');
                currentClient = null;

                if (ffmpegProcess) {
                    ffmpegProcess.stdin.end();
                    ffmpegProcess.kill('SIGINT');
                    ffmpegProcess = null;
                }
            });

            ws.on('error', (err) => {
                console.error('WebSocket error:', err);
                currentClient = null;
                if (ffmpegProcess) {
                    ffmpegProcess.stdin.end();
                    ffmpegProcess.kill('SIGINT');
                    ffmpegProcess = null;
                }
            });
        });
    }

    // Start WebSocket server only if we have a stream URL
    if (streamUrl) {
        startWebSocketServer();
    }

    process.on('message', (msg) => {
        if (msg.type === 'updateStreamUrl') {
            if (typeof msg.url === 'string' && msg.url.trim() !== '') {
                console.log('Updating stream URL to:', msg.url);
                streamUrl = msg.url.trim();

                // If server not started yet, start it now
                if (!wss) {
                    startWebSocketServer();
                }

                // Restart ffmpeg only if client connected
                if (currentClient) {
                    startFfmpeg();
                }
            }
        }
    });
}

// Run server if executed from cmd line
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
    if (!process.env.YOUTUBE_KEY) {
        console.warn('Missing environment variable YOUTUBE_KEY - server will wait for stream key update');
    }
    main();
}

export default main;
