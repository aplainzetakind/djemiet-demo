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
from django.shortcuts import render
from django.views.generic import ListView, TemplateView
from django.views.generic.edit import FormView
from django.views.generic.detail import DetailView
from django.contrib.auth.decorators import login_required
from cemiyet import settings
from .models import Post, Tag, update_popularity, init_popularity
from .forms import PostForm

@method_decorator(login_required, name='dispatch')
class IndexView(TemplateView):
    paginate_by = settings.POSTS_COUNT_PER_PAGE
    template_name = 'content.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['favourites'] = self.request.user.profile.watchlist.all()
        context['posts'] = self.request.GET.getlist('postid')
        print(self.request.GET)
        return context

    def get_queryset(self):
        #  This should be extended to accept multiple tags.
        if self.request.GET.get('t'):
            tag = Tag.objects.get(name=self.request.GET.get('t'))
            queryset = tag.tagged_posts.all()
        else:
            queryset = Post.objects.all()

        return queryset.order_by('-popularity', '-created_on')


@method_decorator(login_required, name='dispatch')
class GalleryView(ListView):
    paginate_by = settings.POSTS_COUNT_PER_PAGE
    template_name = 'posts/gallery.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['favourites'] = self.request.user.profile.watchlist.all()
        posts = context['post_list']
        return context

    def get_queryset(self):
        #  This should be extended to accept multiple tags.
        queryset = Post.objects.all()
        parent = self.request.GET.get('parent')
        if parent:
            queryset = queryset.filter(parents=parent)
        if self.request.GET.get('tag'):
            queryset = queryset.filter(tags=self.request.GET.get('tag'))

        return queryset.order_by('-popularity', '-created_on')



@method_decorator(login_required, name='dispatch')
class SingleCard(ListView):
    template_name = "posts/post_card.html"
    model = Post

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['class'] = "ten columns offset-by-one content-card small-square"
        context['style'] = "display: none"
        context['favourites'] = self.request.user.profile.watchlist.all()
        return context

    def get_queryset(self):
        idlist = self.request.GET.getlist('id')

        queryset = Post.objects.filter(pk__in=idlist)
        return queryset.order_by('-popularity', '-created_on')


@method_decorator(login_required, name='dispatch')
class PopupsView(ListView):
    template_name = 'posts/hovers.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['favourites'] = self.request.user.profile.watchlist.all()
        return context

    def get_queryset(self):
        idlist = self.request.GET.getlist('id')

        queryset = Post.objects.filter(pk__in=idlist)
        return queryset.order_by('-popularity', '-created_on')



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
    tag = ''

    def get(self, request, *args, **kwargs):
        postid = kwargs.get('postid')
        if postid is not None:
            try:
                post = Post.objects.get(pk=postid)
                self.fill = '[[' + str(postid) + ']]\n'
                self.tag = post.tags
                return super().get(request, *args, **kwargs)
            except ObjectDoesNotExist:
                # This needs to be handled in a more polished manner.
                return HttpResponse(status=500)
        else:
            return super().get(request, *args, **kwargs)

    def get_initial(self):
        return {'body':self.fill,
                'tags':self.tag}

    #  Test what happens with bad input.
    def form_valid(self, form):
        post = form.save(commit=False)
        post.author = self.request.user
        taginput = form.cleaned_data.get('tag_text')
        if Tag.objects.filter(name=taginput):
            post.tags = Tag.objects.get(name=taginput)
        else:
            tag = Tag(name=taginput)
            tag.save()
            post.tags = Tag.objects.get(name=taginput)
        post.save()
        init_popularity(post)
        post.save()
        form.save_m2m()
        for parent in post.parents.all():
            update_popularity(parent, post)
            parent.save()
        return super().form_valid(form)

@method_decorator(login_required, name='dispatch')
class PostDetailView(DetailView):
    """ Shows a single post. """
    slug_field = 'pk'
    model = Post



@login_required
def autocomplete(request):
    """ Respond to GET requests for autocomplete suggestions. """
    if 'term' in request.GET:
        term = request.GET.get('term').lower()
        qs = Tag.objects.filter(name__icontains=term)
        titles = list()
        for tag in qs:
            titles.append(tag.name)
        return JsonResponse(titles, safe=False)
    return render(request, 'post')


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
