import { WebSocketServer } from 'ws';
import { spawn } from 'node:child_process';

if (!process.env.YOUTUBE_KEY) {
    console.info('\nEnvironment variable KEY is not set.\n');
    console.info('KEY=your-key-here node ' + import.meta.url + '\n');
    process.exit(-9);
}

const STREAM_URL = 'rtmp://a.rtmp.youtube.com/live2/' + process.env.YOUTUBE_KEY;

console.info('STREAM_URL', STREAM_URL);

const wss = new WebSocketServer({ port: 3000 });

wss.on('connection', (ws) => {
    console.log('Client connected');

    // With audio:
    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-f', 'webm', // -f matroska
        '-i', '-', // ie stdin
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-tune', 'zerolatency',
        '-c:a', 'aac',
        '-strict', '-2',
        '-ar', '44100',
        '-b:a', '128k',
        '-pix_fmt', 'yuv420p',
        '-f', 'flv',
        STREAM_URL,
    ]);

    // If no  audio:
    // const ffmpeg = spawn('ffmpeg', [
    //     '-re',
    //     // Input 0: video via stdin
    //     '-f', 'webm', // or 'matroska' if needed
    //     '-i', '-',

    //     // Input 1: silent audio
    //     '-f', 'lavfi',
    //     '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',

    //     // Video encoding
    //     '-c:v', 'libx264',
    //     '-preset', 'veryfast',
    //     '-tune', 'zerolatency',

    //     // Audio encoding
    //     '-c:a', 'aac',
    //     '-ar', '44100',
    //     '-b:a', '128k',

    //     // Pixel format
    //     '-pix_fmt', 'yuv420p',

    //     // Ensure shortest duration (in case video ends before audio)
    //     '-shortest',

    //     // Output format and URL
    //     '-f', 'flv',
    //     STREAM_URL,
    // ]);


    ffmpeg.stdin.on('error', (e) => {
        console.error('FFmpeg stdin error:', e);
    });

    ffmpeg.stderr.on('data', (data) => {
        console.log('FFmpeg:', data.toString());
    });

    ffmpeg.on('close', (code) => {
        console.log(`FFmpeg exited with code ${code}`);
    });

    ws.on('message', (msg) => {
        if (ffmpeg.stdin.writable) {
            ffmpeg.stdin.write(msg);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        ffmpeg.stdin.end();
    });

    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
        ffmpeg.stdin.end();
    });
});

console.log('RTMP WebSocket server running at ws://localhost:3000');
