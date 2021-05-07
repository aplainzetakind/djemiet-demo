"""
The module for top-level views.
"""
from django.shortcuts import redirect

def redirect_root(request):
    """ Redirect to /content. """
    return redirect('content')
