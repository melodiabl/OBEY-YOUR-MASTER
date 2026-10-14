package obey.direct;

import com.sedmelluq.discord.lavaplayer.player.AudioPlayerManager;
import com.sedmelluq.discord.lavaplayer.source.AudioSourceManager;
import com.sedmelluq.discord.lavaplayer.tools.io.HttpConfigurable;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

@Service
public final class YtdlpDirect {
  private final AudioPlayerManager manager;
  private final String userAgent;

  public YtdlpDirect(AudioPlayerManager manager,
                        @Value("${plugins.pulselink.ytdlp.userAgent}") String userAgent) {
    this.manager = manager;
    this.userAgent = userAgent;
  }

  @EventListener(ApplicationReadyEvent.class)
  public void configure() {
    for (AudioSourceManager source : manager.getSourceManagers()) {
      if (source.getClass().getName().equals("com.github.itzrandom23.pulselink.ytdlp.YtdlpAudioSourceManager")) {
        // PulseLink registers this source after Lavalink configures its HTTP source.
        // Match the extractor's User-Agent when opening its signed media URL.
        ((HttpConfigurable) source).configureBuilder(builder -> builder
            .setUserAgent(userAgent));
        System.out.println("OBEY: yt-dlp direct audio stream User-Agent configured");
        return;
      }
    }
    throw new IllegalStateException("OBEY: yt-dlp source manager not found");
  }
}
