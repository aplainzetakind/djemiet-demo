from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, HttpResponseRedirect
from django.views.generic.detail import DetailView
from .models import Post, Tag
from .forms import PostForm
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.generic.edit import FormView

@method_decorator(login_required, name='dispatch')
class PostingFormView(FormView):
    form_class = PostForm
    template_name = 'post.html'
    success_url = 'content'

    def form_valid(self, form):
        post = form.save(commit=False)
        post.author = self.request.user
        post.save()
        return super().form_valid(form)

@method_decorator(login_required, name='dispatch')
class PostDetailView(DetailView):
    slug_field = 'pk'
    model = Post
