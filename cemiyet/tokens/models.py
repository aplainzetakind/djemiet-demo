from django.db import models
from random import choice
from string import ascii_letters

# Create your models here.

class RegistrationToken(models.Model):
    token = models.CharField(max_length=8, unique=True)

    def __str__(self):
        return self.token

def new_token():
    tkn = ''.join([ choice(ascii_letters) for _ in range(8)])
    return RegistrationToken.objects.create(token=tkn)
