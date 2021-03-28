"""
This follows
https://docs.djangoproject.com/en/3.1/howto/custom-template-tags/
to process the post body according to a very minimal markdown-like syntax.
"""
import re
from django import template
from django.utils.html import conditional_escape
from django.utils.safestring import mark_safe

register = template.Library()

@register.filter(needs_autoescape=True)
def postfilter(value, autoescape=True):
    """
    Hardcoding the url pattern here is probably bad.
    Normally, django.urls.reverse('post_detail', args=(1,)) returns '/p/1',
    but I don't know how to pass the matched regex to args as an integer.
    Doing stuff like args=(r'\1',) doesn't seem to work.
    """
    if autoescape:
        result = conditional_escape(value)
    else:
        result = value
    result = re.sub(r'\[\[([0-9]*)\]\]', r'<a href="/p/\1">#\1</a>', result)
    result = re.sub(r'[\t\r\f\v]*\n[\t\r\f\v]*\n\s*', r'</p><p>', result)
    result = re.sub(r'[\t\r\f\v]*\n\s*', r'</br>', result)
    result = '<p>' + result + '</p>'
    return mark_safe(result)

@register.filter(needs_autoescape=True)
def titlefilter(value, autoescape=True):
    """
    Hardcoding the url pattern here is probably bad.
    Normally, django.urls.reverse('post_detail', args=(1,)) returns '/p/1',
    but I don't know how to pass the matched regex to args as an integer.
    Doing stuff like args=(r'\1',) doesn't seem to work.
    """
    if autoescape:
        result = conditional_escape(value)
    else:
        result = value
    result = re.sub(r'\[\[([0-9]*)\]\]', r'<a href="/p/\1">\1</a>', result)
    return mark_safe(result)
