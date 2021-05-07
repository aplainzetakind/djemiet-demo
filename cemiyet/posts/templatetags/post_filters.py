"""
This follows
https://docs.djangoproject.com/en/3.1/howto/custom-template-tags/
to process the post body according to a very minimal markdown-like syntax.
"""
import re
from django.urls import reverse
from django import template
from django.utils.html import conditional_escape
from django.utils.safestring import mark_safe
from posts.models import Post

register = template.Library()

@register.filter
def concat_str(str1, str2):
    """ The filter `add` coerces arguments to integers, so this is needed. """
    return str(str1) + str(str2)

def render(num, user):
    """ Turns a number into a link, italicizes it and/or puts a star at the end
    depending on whether the referenced post is user's own or is on user's
    watchlist. """
    post = Post.objects.get(pk=int(num))
    cls = "reflink star-" + str(num)
    if post in user.profile.watchlist.all():
        cls += " watched"
    if post.author == user:
        cls += " ownref"
    return '<span class="'+ cls +'" reftarget=' + num + '>' + num + '</span>'

def linkify_nums(result, user):
    """ Applies post citation markdown. """
    return re.sub(r'\[\[([0-9]*)\]\]', lambda x: render(x.group(1), user), result)

@register.filter(needs_autoescape=True)
def postfilter(value, user, autoescape=True):
    """ Markdown for post body. """
    if autoescape:
        result = conditional_escape(value)
    else:
        result = value

    result = linkify_nums(result, user)
    result = re.sub(r'[\t\r\f\v]*\n[\t\r\f\v]*\n\s*', r'</p><p>', result)
    result = re.sub(r'[\t\r\f\v]*\n\s*', r'</br>', result)
    result = '<p>' + result + '</p>'
    return mark_safe(result)

@register.filter(needs_autoescape=True)
def titlefilter(value, user, autoescape=True):
    """ Markdown for post title. """
    if autoescape:
        result = conditional_escape(value)
    else:
        result = value
    result = linkify_nums(result, user)
    return mark_safe(result)
