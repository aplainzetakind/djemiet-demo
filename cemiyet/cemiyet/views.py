from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.views import generic
from posts.models import Post, Tag

def auth_wall(request):
    """ Present the user with a login prompt if not already logged in, else
    redirect to content. """
    if not request.user.is_authenticated:
        return redirect('/accounts/login')
    return redirect('content')

# Create your views here.

class PostList(generic.ListView):
    queryset = Post.objects.order_by('-created_on')
    template_name = 'content.html'
