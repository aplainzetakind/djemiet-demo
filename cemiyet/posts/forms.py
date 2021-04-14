"""
The posting form.
"""
from django import forms
from django.core.exceptions import ObjectDoesNotExist
from posts.utils import get_refs
from .models import Post
from .utils import TagError, normalize_tag


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
        fields = ('title', 'body', 'parents','tags')

    #  tags = forms.ModelMultipleChoiceField(
        #  queryset=Tag.objects.all(),
    #  )

    tag_text=forms.CharField()

    def clean(self):
        cln_data = self.cleaned_data

        body = cln_data['body']
        title= cln_data['title']

        if not cln_data.get('tag_text'):
            raise forms.ValidationError("Provide a tag for the post.")

        taginput = cln_data['tag_text']
        try:
            cln_data['tag_text'] = normalize_tag(taginput)
        except TagError as exc:
            raise forms.ValidationError(str(exc)) from exc

        try:
            cln_data['parents'] = get_refs(title) + get_refs(body)
        except ObjectDoesNotExist as exc:
            raise forms.ValidationError("Non-existent reference.") from exc
