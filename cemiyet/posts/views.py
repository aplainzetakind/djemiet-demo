"""
The views pertaining to posts. These are:
    - PostingFormView: Called from post and respond pages.
    - PostDetailView: To display a single post.
    - add_to_watchlist: This expects POST requests from the frontend to add posts
      to the user's watchlist.
"""
from django.http import HttpResponse, JsonResponse
from django.utils.decorators import method_decorator
from django.core.exceptions import ObjectDoesNotExist
from django.views.generic.edit import FormView
from django.views.generic.detail import DetailView
from django.contrib.auth.decorators import login_required
from .models import Post
from .forms import PostForm

@method_decorator(login_required, name='dispatch')
class PostingFormView(FormView):
    """
    The view for creating new forms. We expect PostForm to pass 'title', 'body',
    'tags' and 'parents' fields. The fill attribute is used to autofill ids of
    the post being replied to.
    """
    form_class = PostForm
    template_name = 'post.html'
    success_url = '/content'
    fill = ''

    #  Probably better to do this by overriding __init__
    def get(self, request, *args, **kwargs):
        postid = kwargs.get('postid')
        if postid is not None:
            self.fill = '[[' + str(postid) + ']]\n'
        return super().get(request, *args, **kwargs)

    def get_initial(self):
        return {'body' : self.fill }

    def form_valid(self, form):
        post = form.save(commit=False)
        post.author = self.request.user
        post.save()
        form.save_m2m()
        return super().form_valid(form)

@method_decorator(login_required, name='dispatch')
class PostDetailView(DetailView):
    """ Shows a single post. """
    slug_field = 'pk'
    model = Post

@login_required
def add_to_watchlist(request):
    """ Adds the post with POSTed id to user's watchlist. """
    if request.method == 'POST':
        postid = int(request.body)
        try:
            post = Post.objects.get(pk=postid)
            user = request.user
            if post in user.profile.watchlist.all():
                user.profile.watchlist.remove(post)
            else:
                request.user.profile.watchlist.add(post)
            return HttpResponse(status=200)
        except ObjectDoesNotExist as exp:
            return JsonResponse({ 'error': str(exp) }, status=500)
    else:
        return HttpResponse(status=500)
