#!/bin/bash
echo "📝 Preparando commit de los cambios..."
git add src/music/musicManager.js src/eventos/client/ready.js
git commit -m "Fix: Inicializar Lavalink correctamente después del login del bot

- Agregada función startLavalink() en musicManager.js
- Modificado evento ready.js para llamar a startLavalink()
- Esto soluciona el problema de conexión con Lavalink local
- Ahora manager.init() se llama después de que el bot esté conectado"
echo "✅ Commit creado. Para subir los cambios ejecuta: git push origin main"
