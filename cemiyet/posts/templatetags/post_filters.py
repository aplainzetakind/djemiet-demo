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

def render(num, user):
    post = Post.objects.get(pk=int(num))
    output = '#' + num
    if post in user.profile.watchlist.all():
        output = output + '★'
    if post.author == user:
        output = '<i>' + output + '</i>'
    return '<a class="reflink" reftarget=' + num + ' href=' \
            + reverse('post_detail', kwargs={"slug":num}) + '>' + output + '</a>'

def linkify_nums(result, user):
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
