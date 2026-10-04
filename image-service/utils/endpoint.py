from pathlib import Path
from io import BytesIO
from PIL import ImageFont

class Assets:
    def get(self, name):
        path = Path(name).resolve()
        if not path.is_relative_to(Path('assets').resolve()):
            raise ValueError('Invalid asset path')
        return BytesIO(path.read_bytes())
    def get_font(self, name, size=20):
        return ImageFont.truetype(self.get(name), size=size)

class Endpoint:
    assets = Assets()
    @staticmethod
    def text_fields(kwargs, count):
        values = [kwargs.get('text' + str(i), '') for i in range(1, count + 1)]
        if not all(values):
            raise ValueError('Provide the required text fields')
        return values

def setup(cls):
    return cls
