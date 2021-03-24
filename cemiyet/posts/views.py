from django.http import HttpResponse, JsonResponse
from django.utils.decorators import method_decorator
from django.views.generic.edit import FormView
from django.views.generic.detail import DetailView
from django.contrib.auth.decorators import login_required
from .models import Post
from .forms import PostForm

@method_decorator(login_required, name='dispatch')
class PostingFormView(FormView):
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
    slug_field = 'pk'
    model = Post

def addToWatchlist(request):
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
        except Exception as exp:
            return JsonResponse({ 'error': str(exp) }, status=500)
    else:
        return HttpResponse(status=500)
