"""
The views pertaining to posts. These are:
    - PostingFormView: Called from post and respond pages.
    - add_to_watchlist: This expects POST requests from the frontend to add posts
      to the user's watchlist.
"""
from django.http import HttpResponse, JsonResponse
from django.utils.decorators import method_decorator
from django.core.exceptions import ObjectDoesNotExist
from django.shortcuts import render
from django.views.generic import View, ListView, TemplateView
from django.views.generic.edit import FormView
from django.contrib.auth.decorators import login_required
from django.core.serializers import serialize
import json
from cemiyet import settings
from .models import Post, Tag, update_popularity, init_popularity
from .forms import PostForm

@method_decorator(login_required, name='dispatch')
class ContentView(View):

    def get(self, request, *args, **kwargs):
        view = IndexView.as_view()
        return view(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        view = PostingFormView.as_view()
        return view(request, *args, **kwargs)


@method_decorator(login_required, name='dispatch')
class IndexView(TemplateView):
    paginate_by = settings.POSTS_COUNT_PER_PAGE
    template_name = 'content.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form'] = PostForm()
        query = self.request.GET
        context['query'] = json.dumps({k: query.getlist(k) for k in query.keys()})
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
class PostsView(ListView):
    template_name = 'posts/posts.html'

    def get(self, request, *args, **kwargs):
        if request.GET.get('as') == "gallery":
            self.paginate_by = settings.POSTS_COUNT_PER_PAGE
        return super().get(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['favourites'] = self.request.user.profile.watchlist.all()
        context['gallery'] = False
        context['idprefix'] = "post-"
        mode = self.request.GET.get('as')
        if mode == "gallery":
            context['gallery'] = True
            context['class'] = ""
        elif mode == "hover":
            context['class'] = " hoverpost"
            context['idprefix'] = "pop-"
        return context

    def get_queryset(self):
        queryset = Post.objects.all()

        watch = self.request.GET.get('watch')
        if watch:
            wlist = self.request.user.profile.watchlist.all()
            queryset = queryset.filter(parents__in=wlist)

        parent = self.request.GET.get('parent')
        if parent:
            queryset = queryset.filter(parents=parent)

        tags = self.request.GET.getlist('tag')
        if tags:
            queryset = queryset.filter(tags__name__in=tags)

        ids = self.request.GET.getlist('id')
        if ids:
            queryset = queryset.filter(pk__in=ids)

        return queryset.order_by('-popularity', '-created_on')


@method_decorator(login_required, name='dispatch')
class PostingFormView(FormView):
    """
    The view for creating new forms. We expect PostForm to pass 'title', 'body',
    'tags' and 'parents' fields. The fill attribute is used to autofill ids of
    the post being replied to.
    """
    form_class = PostForm
    template_name = 'content.html'
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
