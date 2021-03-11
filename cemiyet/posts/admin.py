from django.contrib import admin
from .models import Post,Tag

class PostAdmin(admin.ModelAdmin):
    """ Admin panel list view """
    list_display = ('id', 'title', 'author', 'tags')
    autocomplete_fields = ['tags']

class TagAdmin(admin.ModelAdmin):
    search_fields = ['name']
#admin.site.register(Post)


admin.site.register(Post, PostAdmin)
admin.site.register(Tag, TagAdmin)