"""
Put utility functions here.
"""
import re
from posts.models import Post

def get_refs(text):
    """ This function takes a string and returns the posts with id <postid> for
    every substring "[[<postid>]]" in the string. """
    return [Post.objects.get(pk=int(x.group(1)))
            for x in re.finditer(r'\[\[([0-9]*)\]\]', text)]
