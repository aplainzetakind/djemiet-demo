from django.urls import include, path
from . import views

urlpatterns = [
        path('<str:token>/', views.TokenRegView.as_view()),
        ]
