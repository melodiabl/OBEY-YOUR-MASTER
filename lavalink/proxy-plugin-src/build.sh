#!/usr/bin/env bash
set -euo pipefail

source_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
lavalink_dir=$(dirname -- "$source_dir")
build_dir=$(mktemp -d)
trap 'rm -rf -- "$build_dir"' EXIT
chmod 755 "$build_dir"

# Compile against the exact dependencies bundled with the deployed Lavalink.
podman cp obey_lavalink:/opt/Lavalink/Lavalink.jar "$build_dir/Lavalink.jar" >/dev/null
unzip -q "$build_dir/Lavalink.jar" 'BOOT-INF/lib/*.jar' -d "$build_dir"
dependencies="$build_dir/BOOT-INF/lib/*"
mkdir -p "$build_dir/classes"
javac --release 17 -cp "$dependencies" -d "$build_dir/classes" \
  "$source_dir/obey/proxy/YtdlpWarpProxy.java"
cp -R "$source_dir/lavalink-plugins" "$build_dir/classes/"
jar --create --file "$lavalink_dir/plugins/obey-ytdlp-warp-proxy.jar" \
  -C "$build_dir/classes" .

if [[ ${1:-} == --probe ]]; then
  shift
  # The probe reports failures itself; omit signed media URLs from debug logs.
  cat > "$build_dir/probe-logback.xml" <<'EOF'
<configuration><root level="OFF"/></configuration>
EOF
  javac --release 17 \
    -cp "$dependencies:$lavalink_dir/plugins/PulseLink-v1.6.0.jar:$lavalink_dir/plugins/obey-ytdlp-warp-proxy.jar" \
    -d "$build_dir/classes" "$source_dir/test/AudioStreamProbe.java"
  for video_id in "$@"; do
    podman run --rm --network host --memory 512m --entrypoint java \
      -v "$build_dir:/probe:ro" -v "$lavalink_dir:/config:ro" \
      localhost/obey-lavalink-warp:4.2.2 \
      -Xms64M -Xmx256M -Dlogback.configurationFile=/probe/probe-logback.xml \
      -cp '/probe/classes:/probe/BOOT-INF/lib/*:/config/plugins/PulseLink-v1.6.0.jar:/config/plugins/obey-ytdlp-warp-proxy.jar' \
      AudioStreamProbe /config/application.yml "$video_id" "${OBEY_PROBE_SECONDS:-3}"
  done
fi
