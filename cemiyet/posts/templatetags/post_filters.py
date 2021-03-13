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

register = template.Library()

@register.filter(needs_autoescape=True)
def postfilter(value, autoescape=True):
    if autoescape:
        result = conditional_escape(value)
    else:
        result = value
    result = re.sub(r'\[\[([0-9]*)\]\]', r'<a href="/p/\1">\1</a>', result)
    result = re.sub(r'\n', r'</br>', result)
    return mark_safe(result)
