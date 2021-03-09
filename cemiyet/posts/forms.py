from .models import Post, Tag
from django import forms


class PostForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ('tags', 'refs', 'body')
