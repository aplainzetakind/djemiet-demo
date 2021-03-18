from django.urls import path
from . import views

urlpatterns = [
    path('post', views.PostingFormView.as_view(), name='post'),
    path('', views.autocomplete, name='autocomplete'),
]