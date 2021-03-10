from .models import Post, Tag
from django import forms


class PostForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ('title', 'body', 'tags')

# Not sure about this part
#    def __init__(self, *args, **kwargs):
#        user = kwargs.pop('user','')
#        super(PostForm, self).__init__(*args, **kwargs)
#        self.fields['tags']=forms.ModelChoiceField(queryset=Tag.objects.all())
