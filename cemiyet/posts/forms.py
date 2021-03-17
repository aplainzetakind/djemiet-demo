from .models import Post, Tag
from django import forms
from posts.utils import get_refs


class PostForm(forms.ModelForm):
    class Meta:
        model = Post
        #  We do not render the 'parents' field in the template, but instead
        #  parse its contents from the 'body' field in clean() below. This works
        #  but feels awkward since in principle a user can POST that field by
        #  overriding stuff.  But since we ignore whatever would be posted and
        #  overwrite it, that shouldn't be a problem.
        fields = ('title', 'body', 'tags', 'parents')

    def clean(self):
        cd = self.cleaned_data

        body = cd['body']
        try:
            cd['parents'] = get_refs(body)
        except Post.DoesNotExist:
            raise forms.ValidationError("Non-existent reference.")
