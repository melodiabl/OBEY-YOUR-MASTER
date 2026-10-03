package obey.proxy;

import com.sedmelluq.discord.lavaplayer.player.AudioPlayerManager;
import com.sedmelluq.discord.lavaplayer.source.AudioSourceManager;
import com.sedmelluq.discord.lavaplayer.tools.io.HttpConfigurable;
import org.apache.http.HttpHost;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

@Service
public final class YtdlpWarpProxy {
  private final AudioPlayerManager manager;
  private final String host;
  private final int port;
  private final String userAgent;

  public YtdlpWarpProxy(AudioPlayerManager manager,
                        @Value("${lavalink.server.httpConfig.proxyHost:127.0.0.1}") String host,
                        @Value("${lavalink.server.httpConfig.proxyPort:41081}") int port,
                        @Value("${plugins.pulselink.ytdlp.userAgent}") String userAgent) {
    this.manager = manager;
    this.host = host;
    this.port = port;
    this.userAgent = userAgent;
  }

  @EventListener(ApplicationReadyEvent.class)
  public void configure() {
    for (AudioSourceManager source : manager.getSourceManagers()) {
      if (source.getClass().getName().equals("com.github.itzrandom23.pulselink.ytdlp.YtdlpAudioSourceManager")) {
        // PulseLink registers this source after Lavalink configures its HTTP source.
        // Match the extractor's User-Agent when opening its signed media URL.
        ((HttpConfigurable) source).configureBuilder(builder -> builder
            .setProxy(new HttpHost(host, port, "http"))
            .setUserAgent(userAgent));
        System.out.println("OBEY: yt-dlp audio stream proxy and User-Agent configured");
        return;
      }
    }
    throw new IllegalStateException("OBEY: yt-dlp source manager not found");
  }
}
