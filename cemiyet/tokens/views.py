from django.shortcuts import render
from django.http import HttpResponseNotFound
from django.views.generic.edit import FormView
from .models import RegistrationToken
from django.contrib.auth.forms import UserCreationForm
from django.views.defaults import page_not_found
from django.shortcuts import redirect

class TokenRegView(FormView):
    form_class = UserCreationForm
    template_name = 'register.html'
    success_url = '/'

    def get(self, request, token):
        if request.user.is_authenticated:
            return redirect('/')
        query = RegistrationToken.objects.filter(token=token)
        if query.exists():
            return super().get(request, token)
        return HttpResponseNotFound('You have been misled.')

    def post(self, request, token):
        form = self.get_form()
        if form.is_valid():
            form.save()
            RegistrationToken.objects.filter(token=token).first().delete()
            return self.form_valid(form)
        return self.form_invalid(form)
