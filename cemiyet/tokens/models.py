"""
The model for registration tokens. It needs to be extended to keep track of
which user it was given to.
"""
from random import choice
from string import ascii_letters
from django.db import models

class RegistrationToken(models.Model):
    """ The model for tokens. """
    token = models.CharField(max_length=8, unique=True)

    def __str__(self):
        return self.token

def new_token():
    """ Generates a random token. """
    tkn = ''.join([ choice(ascii_letters) for _ in range(8)])
    return RegistrationToken.objects.create(token=tkn)
