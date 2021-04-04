"""cemiyet URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from django.contrib.auth.views import LoginView
import posts.views
from . import views

urlpatterns = [
    path('', views.auth_wall, name='root'),
    path('content', views.PostList.as_view(), name='content'),
    path('ac/', posts.views.autocomplete, name='autocomplete'),
    path('posts/', include('posts.urls')),
    path('admin/', admin.site.urls),
    path('accounts/login', LoginView.as_view(redirect_authenticated_user=True), name='login'),
    path('accounts/', include('django.contrib.auth.urls')),
    path('reg/', include('tokens.urls')),
    path('post', posts.views.PostingFormView.as_view(), name='post'),
    path('p/<int:slug>', posts.views.PostDetailView.as_view(), name='post_detail'),
    path('respond/<int:postid>', posts.views.PostingFormView.as_view(),
        name='respond'),
    path('watch', posts.views.add_to_watchlist, name='watchlist')
]
