## Installation

    bun install

    choco install ffmpeg-full # For libx264
    
    brew reinstall ffmpeg --with-libx264

    sudo add-apt-repository ppa:savoury1/ffmpeg4
    sudo apt update
    sudo apt install ffmpeg

    # Test the ffmpeg setup

    export KEY="..."
    ffmpeg -re \
    -f lavfi -i testsrc=size=1280x720:rate=30 \
    -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 \
    -c:v libx264 -preset veryfast -tune zerolatency \
    -c:a aac -b:a 128k -ar 44100 -pix_fmt yuv420p \
    -shortest -f flv rtmp://a.rtmp.youtube.com/live2/$KEY

    # Run this package
    bun run dev
    node node/server.js
