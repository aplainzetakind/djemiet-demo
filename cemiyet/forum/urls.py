# pages/urls.py
from django.urls import path
from django.views.generic.base import TemplateView 
from .views import auth_wall

urlpatterns = [
    path('', auth_wall)
]
