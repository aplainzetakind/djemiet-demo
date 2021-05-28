"""
The views pertaining to posts. The app runs as a single page app, served at
/content. ContentView forwards requests based on method to IndexView or
PostingFormView. IndexView serves the single page app, so it is meant to be
accessed only once as the entry point. Serving posts for partial page updates
are handled by PostsView. These three views provide the basic functionality.

There are three other views:
autocomplete: Endpoint for jQuery autocompletion of tags.
tokens: Serves a list of invitation URLs held by by the user.
add_to_watchlist: Toggles watchlist for a given post.
"""
import json
from django.http import HttpResponse, JsonResponse
from django.utils.decorators import method_decorator
from django.core.exceptions import ObjectDoesNotExist
from django.views.generic import View, ListView, TemplateView
from django.views.generic.edit import FormView
from django.contrib.auth.decorators import login_required
from tokens.models import new_token
from cemiyet import settings
from .utils import get_ancestors, update_popularity, init_popularity
from .models import Post, Tag
from .forms import PostForm

@method_decorator(login_required, name='dispatch')
class ContentView(View):
    """
    The view served at content. Redirects based on request methods. Forms that
    are POSTed are handled by PostingFormView, and GETs are redirected to
    IndexView.
    """
    def get(self, request, *args, **kwargs):
        """ Serve content page. """
        view = IndexView.as_view()
        return view(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        """ Process posting form. """
        view = PostingFormView.as_view()
        return view(request, *args, **kwargs)


@method_decorator(login_required, name='dispatch')
class IndexView(TemplateView):
    """
    The single page app served at /content. This renders the template,
    passes initial state from the GET parameters as JSON to Javascript. Further
    mutations of the page state are handled by the frontend.
    """
    paginate_by = settings.POSTS_COUNT_PER_PAGE
    template_name = 'content.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form'] = PostForm()
        query = self.request.GET
        #  We pass the query parameters to the frontend as a JSON object.
        context['query'] = json.dumps({k: query.getlist(k) for k in query.keys()})
        return context



class PostsView(ListView):
    """ The view which serves html for posts for partial loads. Different
    sections of the page use the same endpoint. Different purposes are conveyed
    by the `mode` GET parameter, according to which the classes of the elements
    vary. """
    template_name = 'posts/posts.html'

    def get(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            if request.GET.get('as') == "gallery":
                self.paginate_by = settings.POSTS_COUNT_PER_PAGE
            return super().get(request, *args, **kwargs)
        login_url = '/accounts/login/?next=/content'
        return JsonResponse(json.dumps(login_url), status=403, safe=False)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['favourites'] = self.request.user.profile.watchlist.all()
        #  This boolean decides whether the template response renders the
        #  `#navigation` div.
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

        #  The `watch` GET parameter determines whether only responses to
        #  watched posts are served.
        watch = self.request.GET.get('watch')
        if watch:
            wlist = self.request.user.profile.watchlist.all()
            queryset = queryset.filter(parents__in=wlist)

        #  The `parent` GET parameter hold the post id which, if present,
        #  filters the queryset to replies to the post with that id.
        parent = self.request.GET.get('parent')
        if parent:
            queryset = queryset.filter(parents=parent)

        #  Filter queryset to posts whose tag is among the `tag` parameters.
        tags = self.request.GET.getlist('tag')
        if tags:
            queryset = queryset.filter(tags__name__in=tags)

        #  The posts whose ids are given in the `id` parameters are served only.
        ids = self.request.GET.getlist('id')
        if ids:
            queryset = queryset.filter(pk__in=ids)

        #  If we are serving multiple posts but not in the gallery, sort them
        #  latest-first. In the gallery, sort first by popularity.
        if self.request.GET.get('as') == 'gallery':
            sorting = ('-popularity','-created_on')
        else:
            sorting = ('created_on',)

        return queryset.order_by(*sorting)


@method_decorator(login_required, name='dispatch')
class PostingFormView(FormView):
    """
    The view for creating new forms. We expect PostForm to pass 'title', 'body',
    'tags' and 'parents' fields. The fill attribute is used to autofill ids of
    the post being replied to.
    """
    form_class = PostForm

    def form_valid(self, form):
        post = form.save(commit=False)
        post.author = self.request.user
        taginput = form.cleaned_data.get('tag_text')

        #  If the tag supplied in the form does not exist, create it.
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

        #  Update the popularity of posts to which the newly posted post is a
        #  reply.
        for parent in post.parents.all():
            update_popularity(parent, post)
            parent.save()

        #  Increment the descendant count of all ancestors of the present post.
        ancestors = get_ancestors(post)
        for ancestor in ancestors:
            ancestor.descendants += 1
            ancestor.save()
        response_json = json.dumps({ ancestor.pk : [ancestor.children.count(),
            ancestor.descendants] for ancestor in ancestors })

        #  DEMO ONLY: if the post is a response to post number 9, then award a
        #  token.
        if 9 in [ parent.pk for parent in post.parents.all() ]:
            new_token(1, post.author.pk)

        return JsonResponse(response_json, status=200, safe=False)

    def form_invalid(self, form):
        resp = form.errors.as_json()
        return JsonResponse(resp, status=400, safe=False)

@login_required
def autocomplete(request):
    """ Respond to GET requests for autocomplete options. """
    if 'term' in request.GET:
        term = request.GET.get('term').lower()
        qs = Tag.objects.filter(name__icontains=term)
        titles = list()
        for tag in qs:
            titles.append(tag.name)
        return JsonResponse(titles, safe=False)
    return HttpResponse(status=400)

@login_required
def tokens(request):
    """ Serve the list of registration URLs of the user. """
    domain = request.META['HTTP_HOST']
    response = [ domain + '/reg/' + token.token
                for token in request.user.tokens.all() ]
    return JsonResponse(json.dumps(response), safe=False)

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
            return JsonResponse({ 'error': str(exp) }, status=400)
    else:
        return HttpResponse(status=500)
