from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, HttpResponseRedirect
from django.views.generic.detail import DetailView
from .models import Post, Tag, Profile
from .forms import PostForm
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.generic.edit import FormView

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
                print('Here')
                user.profile.watchlist.remove(post)
            else:
                print('There')
                request.user.profile.watchlist.add(post)
            return HttpResponse(status=200)
        except Exception as e:
            print(e)
            return HttpResponse(status=500)
