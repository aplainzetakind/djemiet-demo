from django.shortcuts import render, get_object_or_404
from .models import Post, Tag
from .forms import PostForm

# Create your views here.


# Built by following https://djangocentral.com/creating-comments-system-with-django/
# I think post page should eventually be a popup rather than a separate page you navigate to --KBA
def post(request):
    template_name = 'post.html'

    if request.method == 'POST':
        post_form = PostForm(data=request.POST)
        if post_form.is_valid():
            # Create Comment object but don't save to database yet
            new_post = post_form.save(commit=False)
            # Assign the current post to the comment
            new_post.title = post_form.fields["title"]
            new_post.body = post_form.fields["body"]
            new_post.tags = post_form.fields["tags"]  # Error here
#            new_post.tags = Tag.objects.get(id=tag_name)
#            new_post.refs = post_form.refs
            # Save to the database
            new_post.save()
    else:
        post_form = PostForm()

    return render(request, template_name, {'post_form': post_form})
