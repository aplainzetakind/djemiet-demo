from django.shortcuts import render, redirect
from django.http import HttpResponse

def auth_wall(request):
    """ Present the user with a login prompt if not already logged in, else
    redirect to content. """
    if not request.user.is_authenticated:
        return redirect('/accounts/login')
    return render(request, 'content.html')
