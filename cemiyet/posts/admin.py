from django.contrib import admin
from .models import Post,Tag

#admin liste gorunumu
class PostAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'author', 'tags')

#admin.site.register(Post)


admin.site.register(Post, PostAdmin)
admin.site.register(Tag)