import re
from posts.models import Post

def get_refs(text):
    return [Post.objects.get(pk=int(x.group(1)))
            for x in re.finditer(r'\[\[([0-9]*)\]\]', text)]
