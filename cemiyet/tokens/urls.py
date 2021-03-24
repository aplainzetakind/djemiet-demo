"""
Token-related urls.
"""
from django.urls import path
from . import views

urlpatterns = [
        path('<str:token>/', views.TokenRegView.as_view()),
        ]
