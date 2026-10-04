import base64
from io import BytesIO
from PIL import Image

def get_image(value, **kwargs):
    if not isinstance(value, str) or len(value) > 8_000_000:
        raise ValueError('Invalid image data')
    data = base64.b64decode(value, validate=True)
    image = Image.open(BytesIO(data))
    if image.width * image.height > 4_000_000:
        raise ValueError('Image too large')
    image.load()
    return image
