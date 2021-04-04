"""
The posting form.
"""
from django import forms
from django.core.exceptions import ObjectDoesNotExist
from posts.utils import get_refs
from .models import Post


class PostForm(forms.ModelForm):
    """
    We do not render the 'parents' field in the template, but instead
    parse its contents from the 'body' field in clean() below. This works
    but feels awkward since in principle a user can POST that field by
    overriding stuff.  But since we ignore whatever would be posted and
    overwrite it, that shouldn't be a problem.
    """
    class Meta:
        model = Post
        #  We do not render the 'parents' field in the template, but instead
        #  parse its contents from the 'body' field in clean() below. This works
        #  but feels awkward since in principle a user can POST that field by
        #  overriding stuff.  But since we ignore whatever would be posted and
        #  overwrite it, that shouldn't be a problem.
        fields = ('title', 'body', 'parents')

    #  tags = forms.ModelMultipleChoiceField(
        #  queryset=Tag.objects.all(),
    #  )

    tag_text=forms.CharField()

    def clean(self):
        cln_data = self.cleaned_data

        body = cln_data['body']
        title= cln_data['title']
        try:
            cln_data['parents'] = get_refs(title) + get_refs(body)

        except ObjectDoesNotExist as exc:
            raise forms.ValidationError("Non-existent reference.") from exc
