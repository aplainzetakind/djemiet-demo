"""
Handles the registration view using unique registration tokens.
"""
from django.http import HttpResponseNotFound
from django.shortcuts import redirect
from django.views.generic.edit import FormView
from django.contrib.auth.forms import UserCreationForm
from .models import RegistrationToken

class TokenRegView(FormView):
    """ If the token passed from the url is valid, expose a registration form,
    and upon successful registration, delete the token from the database. This
    should be extended such that tokens would know to whom they were given, and
    eventually that should pass to the newly created user's profile as an
    invited_by field."""
    form_class = UserCreationForm
    template_name = 'register.html'
    success_url = '/'

    def get(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect('/')
        token = kwargs['token']
        query = RegistrationToken.objects.filter(token=token)
        if query.exists() and query.first().uses > 0:
            return super().get(request, *args, **kwargs)
        return HttpResponseNotFound('You have been misled.')

    def post(self, request, *args, **kwargs):
        form = self.get_form()
        token = kwargs['token']
        if form.is_valid():
            tkn = RegistrationToken.objects.get(token=token)
            user = form.save()
            user.profile.invited_by = tkn.owner
            user.save()
            if tkn.uses > 1:
                tkn.uses -= 1
                tkn.save()
            else:
                tkn.delete()
            return self.form_valid(form)
        return self.form_invalid(form)
