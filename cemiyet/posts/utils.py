"""
Put utility functions here.
"""
import re
from collections import OrderedDict
from .models import Post

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
    """
    Collect all ancestors of post as a QuerySet.
    """
    ancestors = post.parents.all()
    if ancestors.count():
        for ancestor in ancestors:
            ancestors = ancestors.union(get_ancestors(ancestor))
    return ancestors

def reset_descendants():
    """
    Recalculates descendants fields of all the posts in the database.
    """
    postsdict = OrderedDict()
    for post in Post.objects.all().order_by('-pk'):
        postsdict[post] = 0

    while postsdict:
        post, count = postsdict.popitem(0)
        post.descendants = count
        post.save()
        for ancestor in get_ancestors(post):
            postsdict[ancestor] += 1

def init_popularity(post):
    """ Sets initial popularity based on the created_on field. """
    ctime = post.created_on.timestamp()
    pop = int(ctime * 10)

    post.popularity = pop

def update_popularity(post, response):
    """ Bumps the popularity of a post based on the response. """
    # MOVE THIS PARAMETER TO A SETTING FILE
    parameter = 0.5
    if post.author != response.author:
        pop = post.popularity
        newtime = response.created_on.timestamp() * 10

        post.popularity = int((parameter * newtime) + ((1 - parameter) * pop))

def reset_popularities():
    """ To be used to apply any changes to the entire db table. """
    for post in Post.objects.all():
        init_popularity(post)
        for response in post.children.all():
            update_popularity(post, response)
        post.save()
