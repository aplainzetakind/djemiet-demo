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
from django.conf import settings
from django.conf.urls.static import static
import posts.views
from . import views

urlpatterns = [
    path('', views.redirect_root, name='root'), #  Redirect
    path('content', posts.views.ContentView.as_view(), name='content'),
    path('card', posts.views.SingleCard.as_view(), name='card'),
    path('gallery', posts.views.GalleryView.as_view(), name='gallery'),
    path('popups', posts.views.PopupsView.as_view(), name='popups'),
    path('ac/', posts.views.autocomplete, name='autocomplete'),
    path('watch', posts.views.add_to_watchlist, name='watchlist'),
    path('admin/', admin.site.urls),
    path('accounts/login', LoginView.as_view(redirect_authenticated_user=True), name='login'),
    path('accounts/', include('django.contrib.auth.urls')),
    path('reg/', include('tokens.urls'))
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
