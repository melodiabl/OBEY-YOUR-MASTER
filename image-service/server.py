import importlib.util
import os
from pathlib import Path
from flask import Flask, jsonify, request
from PIL import Image, ImageFont, ImageDraw

Image.MAX_IMAGE_PIXELS = 4_000_000
Image.ANTIALIAS = Image.Resampling.LANCZOS
for directory in ['assets/emoji', 'assets/twemoji']:
    Path(directory).mkdir(parents=True, exist_ok=True)
# Original MIT generators use Pillow's old font sizing API.
ImageFont.FreeTypeFont.getsize = lambda self, text: (self.getbbox(text)[2], self.getbbox(text)[3])
ImageDraw.ImageDraw.textsize = lambda self, text, font=None, **kwargs: (self.textbbox((0, 0), text, font=font, **kwargs)[2], self.textbbox((0, 0), text, font=font, **kwargs)[3])
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16_000_000
modules = {}
for file in Path('upstream/endpoints').glob('*.py'):
    spec = importlib.util.spec_from_file_location('generator_' + file.stem, file)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    candidates = [value for value in vars(module).values() if isinstance(value, type) and value.__module__ == module.__name__]
    if candidates:
        modules[file.stem] = candidates[0]()

@app.get('/health')
def health():
    return jsonify(ok=True, generators=sorted(modules))

@app.post('/generate/<name>')
def generate(name):
    generator = modules.get(name)
    if generator is None:
        return jsonify(error='Unknown generator'), 404
    body = request.get_json()
    avatars = body.get('avatars', [])[:3]
    usernames = [str(value)[:80] for value in body.get('usernames', [])[:3]]
    text = str(body.get('text', ''))[:1500]
    needed = sum(param.startswith('avatar') for param in generator.params)
    if needed and not avatars:
        return jsonify(error='Missing avatar'), 400
    while len(avatars) < needed:
        avatars.append(avatars[-1])
    while len(usernames) < 3:
        usernames.append(usernames[-1] if usernames else 'Usuario')
    kwargs = {'text1': text, 'text2': str(body.get('text2', text))[:1500], 'text3': text}
    try:
        return generator.generate(avatars, text, usernames, kwargs)
    except Exception as error:
        app.logger.warning('Generator %s failed: %s', name, type(error).__name__)
        return jsonify(error='Could not generate image'), 422

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=int(os.getenv('PORT', '3203')), threaded=False)
