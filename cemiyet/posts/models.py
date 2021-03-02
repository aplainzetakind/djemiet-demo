from django.db import models
from django.template.defaultfilters import slugify
from django.contrib.auth.models import User
from django.urls import reverse
from django.contrib.postgres.fields import ArrayField


class Tag(models.Model):
    name = models.CharField(max_length=255)

class Post(models.Model):
    title = models.CharField(max_length=255)
    refs = models.ForeignKey('self',blank=True, null=True, on_delete=models.CASCADE, related_name='answer')
    body = models.TextField()
    created_on = models.DateTimeField(auto_now_add=True)
    author = models.TextField()
    tags = models.ManyToManyField(Tag, null=True)
    image = models.CharField(max_length=255,blank=True, null=True)

