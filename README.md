## Installation

    bun install

    bun run make-certs # Or put yours in ./certs/

    choco install ffmpeg-full # For libx264
    
    brew reinstall ffmpeg --with-libx264

    sudo add-apt-repository ppa:savoury1/ffmpeg4
    sudo apt update
    sudo apt install ffmpeg

    # Test the ffmpeg setup

    export YOUTUBE_KEY="your-youtube-broadcast-key"
    ffmpeg -re \
    -f lavfi -i testsrc=size=1280x720:rate=30 \
    -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 \
    -c:v libx264 -preset veryfast -tune zerolatency \
    -c:a aac -b:a 128k -ar 44100 -pix_fmt yuv420p \
    -shortest -f flv rtmp://a.rtmp.youtube.com/live2/$YOUTUBE_KEY

    # Run this package
    bun run dev           # The UI, eventually in server.js
    bun node/server.js    # WebRTC exchange
    bun node/streamer.js  # Streams to YT

## Certs

To use the camera/mic from an external device, you will need to
either used a trusted CA or use `mkcert -CAROOT` to locate the
root CA and install it on the device with a `crt` extension.

## Use

1. Drag and drop or paste videos into the window.
1. Click the button to open the broadcast widow.
1. Edit the banner text by clicking it
1. Edit the news ticker by clicking it
1. Set the banner image by dragging or pasting an image into the window.
1. If you connect a remote camera, you may need to click a button on the broadcast screen.
