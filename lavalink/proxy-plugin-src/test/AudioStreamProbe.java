import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import com.github.itzrandom23.pulselink.ytdlp.YtdlpAudioSourceManager;
import com.sedmelluq.discord.lavaplayer.player.AudioPlayer;
import com.sedmelluq.discord.lavaplayer.player.DefaultAudioPlayerManager;
import com.sedmelluq.discord.lavaplayer.player.event.AudioEventAdapter;
import com.sedmelluq.discord.lavaplayer.tools.FriendlyException;
import com.sedmelluq.discord.lavaplayer.track.AudioTrack;
import com.sedmelluq.discord.lavaplayer.track.playback.AudioFrame;
import obey.proxy.YtdlpWarpProxy;
import org.yaml.snakeyaml.Yaml;

/** Exercises extraction, HTTP download and audio decoding without joining Discord. */
public final class AudioStreamProbe {
  private static Map<?, ?> section(Map<?, ?> parent, String key) {
    return (Map<?, ?>) parent.get(key);
  }

  private static String[] arguments(Map<?, ?> config, String key) {
    return ((List<?>) config.get(key)).stream().map(Object::toString).toArray(String[]::new);
  }

  public static void main(String[] args) throws Exception {
    Map<?, ?> config;
    try (var input = Files.newInputStream(Path.of(args[0]))) {
      config = new Yaml().load(input);
    }
    Map<?, ?> ytdlp = section(section(section(config, "plugins"), "pulselink"), "ytdlp");
    Map<?, ?> proxy = section(section(section(config, "lavalink"), "server"), "httpConfig");
    DefaultAudioPlayerManager manager = new DefaultAudioPlayerManager();
    AudioPlayer player = manager.createPlayer();
    AtomicReference<String> error = new AtomicReference<>();
    try {
      manager.registerSourceManager(new YtdlpAudioSourceManager(
          ytdlp.get("path").toString(), 3,
          arguments(ytdlp, "customLoadArgs"), arguments(ytdlp, "customPlaybackArgs")));
      new YtdlpWarpProxy(manager, proxy.get("proxyHost").toString(),
          ((Number) proxy.get("proxyPort")).intValue(), ytdlp.get("userAgent").toString()).configure();
      AudioTrack track = (AudioTrack) manager.loadItemSync("https://www.youtube.com/watch?v=" + args[1]);
      player.addListener(new AudioEventAdapter() {
        @Override
        public void onTrackException(AudioPlayer ignored, AudioTrack failed, FriendlyException exception) {
          Throwable root = exception;
          while (root.getCause() != null) root = root.getCause();
          error.set(root.getMessage());
        }
      });
      player.playTrack(track);
      int seconds = args.length > 2 ? Integer.parseInt(args[2]) : 3;
      int expectedFrames = seconds * 50;
      int frames = 0;
      long bytes = 0;
      long nextFrameAt = System.nanoTime();
      long deadline = System.nanoTime() + (seconds + 45L) * 1_000_000_000L;
      while (System.nanoTime() < deadline && error.get() == null && frames < expectedFrames) {
        AudioFrame frame = player.provide();
        if (frame != null && frame.getDataLength() > 0) {
          frames++;
          bytes += frame.getDataLength();
          if (seconds > 3 && frames % 3000 == 0) {
            System.out.println("STREAM_PROGRESS seconds=" + frames / 50 + " bytes=" + bytes);
          }
        }
        if (player.getPlayingTrack() == null && frames > 0 && frames < expectedFrames) {
          track = track.makeClone();
          player.playTrack(track);
        }
        nextFrameAt += 20_000_000L;
        long remaining = nextFrameAt - System.nanoTime();
        if (remaining > 0) Thread.sleep(remaining / 1_000_000L, (int) (remaining % 1_000_000L));
      }
      System.out.println("STREAM_PROBE video=" + args[1] + " frames=" + frames
          + " bytes=" + bytes + " position=" + track.getPosition() + " error=" + error.get());
      if (frames < expectedFrames || error.get() != null) {
        throw new IllegalStateException("Audio stream did not produce " + seconds + " seconds of audio");
      }
    } finally {
      player.destroy();
      manager.shutdown();
    }
  }
}
