"""
The module for top-level views.
"""
from django.shortcuts import redirect
from django.views import generic
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from posts.models import Post, Tag
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
    paginate_by = settings.POSTS_COUNT_PER_PAGE
    template_name = 'content.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['favourites'] = self.request.user.profile.watchlist.all()
        return context

    def get_queryset(self):
        #  This should be extended to accept multiple tags.
        if self.request.GET.get('t'):
            tag = Tag.objects.get(name=self.request.GET.get('t'))
            queryset = tag.tagged_posts.all()
        else:
            queryset = Post.objects.all()

        return queryset.order_by('-popularity', '-created_on')
