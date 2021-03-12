from django.shortcuts import render
from django.http import Http404
from django.views.generic.edit import FormView
#  from django.views import View
#  from .models import RegistrationToken
from django.contrib.auth.forms import UserCreationForm
from django.views.defaults import page_not_found

class TokenRegView(FormView):
    # Need redirection logic here.
    #
    # * If an actually registered user lands in this
    # view, they should get some sort of 'you are already logged in' message.
    #
    # * If the token name dispatched from the url '/reg/<token>' does not exist
    # in the RegistrationToken table of the database, we should 404.
    #
    # I havent figured out how to insert such a decision into this class-based
    # view.
    form_class = UserCreationForm
    template_name = 'register.html'
    success_url = '/'

    def form_valid(self, form):
        form.save()
        return super().form_valid(form)
