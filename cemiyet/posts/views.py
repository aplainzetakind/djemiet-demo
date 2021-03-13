from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, HttpResponseRedirect
from django.views.generic.detail import DetailView
from .models import Post, Tag
from .forms import PostForm

def post(request):
    template_name = 'post.html'

    if request.method == 'POST':
        post_form = PostForm(data=request.POST)
        if post_form.is_valid():
            # Create Comment object but don't save to database yet
            new_post = post_form.save(commit=False)
            # Assign the current post to the comment
            new_post.title = post_form.cleaned_data["title"]
            new_post.body = post_form.cleaned_data["body"]
            new_post.tags = post_form.cleaned_data["tags"]
            new_post.save()

            return HttpResponseRedirect('/content')

    else:
        post_form = PostForm()

    return render(request, template_name, {'post_form': post_form})

class PostDetailView(DetailView):
    slug_field = 'pk'
    model = Post
