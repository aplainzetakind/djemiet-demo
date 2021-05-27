"""
This follows
https://docs.djangoproject.com/en/3.1/howto/custom-template-tags/
to process the post body according to a very minimal markdown-like syntax.
"""
import re
from django import template
from django.utils.html import conditional_escape, urlize
from django.utils.safestring import mark_safe
from posts.models import Post

register = template.Library()

@register.filter
def concat_str(str1, str2):
    """ The filter `add` coerces arguments to integers, so this is needed. """
    return str(str1) + str(str2)

def renderref(num, viewing_user, post_author):
    """ Turns a marked-down number into a <span> element, adding classes to the
    element depending on whether
    - The cited post is on the viewing user's watchlist.
    - The cited post is viewing user's own.
    - The cited post is post author's own.
    """
    cited_post = Post.objects.get(pk=int(num))
    cited_author = cited_post.author
    cls = "reflink star-" + str(num)
    if cited_post in viewing_user.profile.watchlist.all():
        cls += " watched"
    if cited_author == viewing_user:
        cls += " ownref"
    if cited_author == post_author:
        cls += " autocite"
    return '<span class="'+ cls +'" reftarget=' + num +\
            ' onclick="clickref($(this))">' + num + '</span>'

def linkify_nums(text, viewer, author):
    """ Applies post citation markdown. """
    return re.sub(r'\[\[([0-9]*)\]\]', lambda x: renderref(x.group(1), viewer,
        author), text)

@register.simple_tag
def render_body(post, viewer):
    """
    When rendering the post body, reference links are styled depending on
    both the viewing user and the post author. We compute the resulting post
    body using a simple tag.
    """
    body_text = post.body
    author = post.author

    result = linkify_nums(conditional_escape(body_text), viewer, author)
    result = re.sub(r'^(&gt.*)$',
            lambda x: '<span class="quote">' + x.group(1) + '</span>',
            result,
            flags=re.MULTILINE)
    result = re.sub(r'[\t\r\f\v]*\n[\t\r\f\v]*\n\s*', r'</p><p>', result)
    result = re.sub(r'[\t\r\f\v]*\n\s*', r'</br>', result)
    result = '<p>' + result + '</p>'
    return mark_safe(urlize(result))

@register.simple_tag
def render_title(post, viewer):
    """
    Like render_body but with fewer modifications to the content.
    """
    title_text = post.title
    post_author = post.author

    result = linkify_nums(conditional_escape(title_text), viewer, post_author)
    return mark_safe(result)
