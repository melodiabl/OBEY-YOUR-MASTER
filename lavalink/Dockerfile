FROM ghcr.io/lavalink-devs/lavalink:4.2.2-alpine

USER root
RUN wget -q -O /usr/local/bin/yt-dlp https://github.com/yt-dlp/yt-dlp/releases/download/2026.08.19/yt-dlp_musllinux \
    && echo 'f3dec9cfeaf304cec98290fe41c6ad465d4b747d302473559643e7af24929722  /usr/local/bin/yt-dlp' | sha256sum -c - \
    && chmod 755 /usr/local/bin/yt-dlp
USER lavalink
