from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.views import generic
from posts.models import Post, Tag
from django.core.paginator import Paginator
from . import settings
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator

def auth_wall(request):
    """ Present the user with a login prompt if not already logged in, else
    redirect to content. """
    if request.user.is_authenticated:
        return redirect('content')
    return redirect('login')

@method_decorator(login_required, name='dispatch')
class PostList(generic.ListView):
    def get_queryset(self):
        queryset = Post.objects.all()

        if self.request.GET.get('t'):
            queryset = queryset.filter(tags__name=self.request.GET.get('t'))
        return queryset


        # qs = Post.objects.order_by('-created_on')
        # if self.request.GET.get('t'):
        #     return Post.objects.filter(tag__name__iexact=self.request.GET.get['t'])
        # return qs.order_by('-created_on')

#    queryset = Post.objects.order_by('-created_on')
    paginate_by = settings.POSTS_COUNT_PER_PAGE
    template_name = 'content.html'
