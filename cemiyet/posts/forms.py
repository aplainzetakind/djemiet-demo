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
        fields = ('title', 'body', 'parents', 'tags')

    tags = forms.ModelMultipleChoiceField(
        queryset=Tag.objects.all(),
    )

    tag_text=forms.CharField()

    def clean(self):
        cd = self.cleaned_data

        body = cd['body']
        title= cd['title']
        tt=cd['tag_text']
        try:
            cd['parents'] = get_refs(title) + get_refs(body)

        except Post.DoesNotExist:
            raise forms.ValidationError("Non-existent reference.")

        try:
            cd['tags'] = Tag(name=tt)

        except Tag.DoesNotExist:
            raise forms.ValidationError("Non-existent reference.")        
