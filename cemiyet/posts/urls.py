from django.urls import path
from . import views

urlpatterns = [
    path('post', views.PostingFormView.as_view(), name='post'),
    path('p/<int:slug>', views.PostDetailView.as_view(), name='post_detail'),
    path('respond/<int:postid>', views.PostingFormView.as_view(),
        name='respond'),
    path('watch', views.add_to_watchlist, name='watchlist')
]
