"""
Database models for posts.
"""
import django
from django.db import models
from django.conf import settings
import os
import time


#  REFACTOR THIS TO A SEPARATE FILE
#
#  Below is the code for AutoOneToOneField, copy pasted from the package
#  django-annoying. I found it redundant to include an entire package for one
#  class.
from django.db.models import OneToOneField
from django.db.transaction import atomic
try:
    from django.db.models.fields.related_descriptors import (
        ReverseOneToOneDescriptor,
    )
except ImportError:
    from django.db.models.fields.related \
            import SingleRelatedObjectDescriptor as ReverseOneToOneDescriptor

class AutoSingleRelatedObjectDescriptor(ReverseOneToOneDescriptor):
    """
    The descriptor that handles the object creation for an AutoOneToOneField.
    """

    @atomic
    def __get__(self, instance, instance_type=None):
        model = getattr(self.related, 'related_model', self.related.model)

        try:
            return (
                super().__get__(instance, instance_type)
            )
        except model.DoesNotExist:
            # Using get_or_create instead() of save() or create() as it better
            # handles race conditions
            obj, _ = model.objects.get_or_create(**{self.related.field.name: instance})

            # Update Django's cache, otherwise first 2 calls to obj.relobj
            # will return 2 different in-memory objects
            if django.VERSION >= (2, 0):
                self.related.set_cached_value(instance, obj)
                self.related.field.set_cached_value(obj, instance)
            else:
                setattr(instance, self.cache_name, obj)
                setattr(obj, self.related.field.get_cache_name(), instance)
            return obj

class AutoOneToOneField(OneToOneField):
    """
    OneToOneField creates related object on first call if it doesnt exist yet.
    Use it instead of original OneToOne field.

    example:

        class MyProfile(models.Model):
            user = AutoOneToOneField(User, primary_key=True)
            home_page = models.URLField(max_length=255, blank=True)
            icq = models.IntegerField(max_length=255, null=True)
    """

    def contribute_to_related_class(self, cls, related):
        setattr(
            cls,
            related.get_accessor_name(),
            AutoSingleRelatedObjectDescriptor(related)
        )
#  END OF AutoOneToOneField




class Tag(models.Model):
    """ A tag is just a word. """
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return str(self.name)

def assign_filename(instance, filename):
    temp = os.path.splitext(filename)
    return str(time.time_ns()) + temp[1]

class Post(models.Model):
    """ The central model of Djemiet. """
    title = models.CharField(max_length=255, blank=True)
    parents = models.ManyToManyField('self',
            related_name = 'children',
            symmetrical=False,
            blank=True)
    body = models.TextField()
    created_on = models.DateTimeField(auto_now_add=True)
    popularity = models.BigIntegerField(blank=False, null=False, default=0)
    image = models.ImageField(null=True, blank=True, upload_to=assign_filename)
    author = models.ForeignKey(settings.AUTH_USER_MODEL,
            on_delete=models.SET_NULL,
            blank=False,
            null=True)
    tags = models.ForeignKey(Tag,
            related_name = 'tagged_posts',
            on_delete=models.CASCADE,
            blank=True,
            null=True)

    def __str__(self):
        return '#' + str(self.pk)

def init_popularity(post):
    """ Sets initial popularity based on the created_on field. """
    ctime = post.created_on.timestamp()
    pop = int(ctime * 10)

    post.popularity = pop

def update_popularity(post, response):
    """ Bumps the popularity of a post based on the response. """
    # MOVE THIS PARAMETER TO A SETTING FILE
    parameter = 0.5
    pop = post.popularity
    newtime = response.created_on.timestamp() * 10

    post.popularity = int((parameter * newtime) + ((1 - parameter) * pop))

def reset_popularities():
    """ To be used to apply any changes to the entire db table. """
    for post in Post.objects.all():
        init_popularity(post)
        for response in post.children.all():
            update_popularity(post, response)
        post.save()

class Profile(models.Model):
    """ This follows the advice here:
    https://docs.djangoproject.com/en/3.1/topics/auth/customizing/#extending-the-existing-user-model
    """
    user = AutoOneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, unique=True)
    watchlist = models.ManyToManyField(Post, related_name= 'watched_by', blank=True)
    invited_by = models.ForeignKey(settings.AUTH_USER_MODEL,
            related_name='invitees',
            on_delete=models.SET_NULL,
            default=1,
            blank=True,
            null=True)
