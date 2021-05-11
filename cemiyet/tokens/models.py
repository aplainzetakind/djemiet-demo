"""
The model for registration tokens.
"""
from random import choice
from string import ascii_letters
from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model

class RegistrationToken(models.Model):
    """ The model for tokens. """
    token = models.CharField(max_length=8, unique=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL,
            related_name='tokens',
            on_delete=models.SET_NULL,
            default=1,
            blank=True,
            null=True)
    uses = models.IntegerField(default=1)

    def __str__(self):
        return self.token

def new_token(uses=1, ownerid=1):
    """ Generates a random token. """
    model = get_user_model()
    owner = model.objects.get(pk=ownerid)
    token = ''.join([ choice(ascii_letters) for _ in range(8)])
    return RegistrationToken.objects.create(token=token, owner=owner,
            uses=uses)
