from django.db import models

# Create your models here.
class RegistrationToken(models.Model):
    token = models.CharField(max_length=12, unique=True)
