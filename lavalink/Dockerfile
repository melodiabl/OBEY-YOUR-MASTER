FROM ghcr.io/lavalink-devs/lavalink:4.2.2-alpine

USER root
RUN apk add --no-cache proxychains-ng \
    && wget -q -O /usr/local/bin/yt-dlp-real https://github.com/yt-dlp/yt-dlp/releases/download/2026.08.19/yt-dlp_musllinux \
    && echo 'f3dec9cfeaf304cec98290fe41c6ad465d4b747d302473559643e7af24929722  /usr/local/bin/yt-dlp-real' | sha256sum -c - \
    && chmod 755 /usr/local/bin/yt-dlp-real
COPY proxychains.conf /etc/proxychains/proxychains.conf
COPY yt-dlp-wrapper /usr/local/bin/yt-dlp
ENV PROXYCHAINS_QUIET_MODE=1
USER lavalink

ENTRYPOINT ["proxychains4", "java", "-jar", "Lavalink.jar"]
