from django.contrib import admin
from .models import Post,Tag

class PostAdmin(admin.ModelAdmin):
    """ Admin panel list view """
    list_display = ('id', 'title', 'author', 'tags')

admin.site.register(Post, PostAdmin)
admin.site.register(Tag)
