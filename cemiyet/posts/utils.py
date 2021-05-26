"""
Put utility functions here.
"""
import re
from collections import OrderedDict
from posts.models import Post

def get_refs(text):
    """ This function takes a string and returns the posts with id <postid> for
    every substring "[[<postid>]]" in the string. """
    return [Post.objects.get(pk=int(x.group(1))) \
            for x in re.finditer(r'\[\[([0-9]*)\]\]', text)]

class TagError(Exception):
    """ To be thrown for ill-formed tag strings. """

def normalize_tag(text):
    """ Takes a string, strips spaces, chunks together sequences of whitespace,
    then checks for length and whether all characters are letters, spaces of
    hyphens. """
    text = text.strip().lower()
    text = re.sub(r'\s+', ' ', text)

    if len(text) > 30:
        raise TagError("Tag too long.")

    if not re.match(r'^[\w\ -]+$', text):
        raise TagError("Tags can only contain letters, spaces and hyphens.")

    return text

def get_ancestors(post):
    result = post.parents.all()
    if result.count():
        for p in result:
            result = result.union(get_ancestors(p))
    return result

def reset_descendants():
    postsdict = OrderedDict()
    for post in Post.objects.all().order_by('-pk'):
        postsdict[post] = 0

    while postsdict:
        post, count = postsdict.popitem(0)
        post.descendants = count
        post.save()
        for ancestor in get_ancestors(post):
            postsdict[ancestor] += 1
