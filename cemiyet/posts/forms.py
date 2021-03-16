from .models import Post, Tag
from django import forms
from posts.utils import get_refs


class PostForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ('title', 'body', 'tags')

    def clean(self):
        cd = self.cleaned_data

        body = cd['body']
        try:
            self.refs = get_refs(body)
        except Post.DoesNotExist:
            raise forms.ValidationError("Non-existent reference.")
