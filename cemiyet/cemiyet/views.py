"""
The module for top-level views.
"""
from django.shortcuts import redirect
from django.views import generic
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from posts.models import Post
from . import settings

def auth_wall(request):
    """ Present the user with a login prompt if not already logged in, else
    redirect to content. """
    if request.user.is_authenticated:
        return redirect('content')
    return redirect('login')

@method_decorator(login_required, name='dispatch')
class PostList(generic.ListView):
    """ THIS BELONGS UNDER posts/ """
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['favourites'] = self.request.user.profile.watchlist.all()
        posts = context['post_list']
        parents = Post.objects.none()
        for post in posts:
            parents = parents.union(post.parents.all())
        context['hovers'] = parents
        return context

    def get_queryset(self):
        queryset = Post.objects.all()
        ordering_prefix = "-"
        if self.request.GET.get('t'):
            queryset = queryset.filter(tags__name=self.request.GET.get('t'))
        return queryset.order_by(ordering_prefix + 'created_on')
    paginate_by = settings.POSTS_COUNT_PER_PAGE
    template_name = 'content.html'
