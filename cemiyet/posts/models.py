from django.db import models
from django.template.defaultfilters import slugify
from django.contrib.auth.models import User
from django.urls import reverse
from django.contrib.postgres.fields import ArrayField
from annoying.fields import AutoOneToOneField

class Tag(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name


class Post(models.Model):
    title = models.CharField(max_length=255, blank=True)
    parents = models.ManyToManyField('self', related_name = 'children', symmetrical=False, blank=True, null=True)
    body = models.TextField()
    created_on = models.DateTimeField(auto_now_add=True)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, blank=False,
            null=True)
    tags = models.ForeignKey(Tag, on_delete=models.CASCADE, null=True)
    image = models.CharField(max_length=255,blank=True, null=True)

    def __str__(self):
        return '#' + str(self.pk)

class Profile(models.Model):
    user = AutoOneToOneField(User, on_delete=models.CASCADE, unique=True)
    watchlist = models.ManyToManyField(Post, related_name= 'watched_by', blank=True)
