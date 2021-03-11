from django.contrib import admin
from .models import Post,Tag

#admin liste gorunumu
class PostAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'author', 'tags')
    autocomplete_fields = ['tags']

class TagAdmin(admin.ModelAdmin):
    search_fields = ['name']
#admin.site.register(Post)


admin.site.register(Post, PostAdmin)
admin.site.register(Tag, TagAdmin)