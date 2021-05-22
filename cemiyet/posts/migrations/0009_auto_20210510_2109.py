# Generated by Django 3.1.7 on 2021-05-10 21:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('posts', '0008_profile_invited_by'),
    ]

    operations = [
        migrations.AlterField(
            model_name='post',
            name='parents',
            field=models.ManyToManyField(blank=True, related_name='children', to='posts.Post'),
        ),
    ]