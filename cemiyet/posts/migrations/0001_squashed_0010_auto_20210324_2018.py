# Generated by Django 3.1.7 on 2021-03-24 20:19

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import posts.models


class Migration(migrations.Migration):

    replaces = [('posts', '0001_initial'), ('posts', '0002_auto_20210302_0923'), ('posts', '0003_auto_20210302_0924'), ('posts', '0004_auto_20210302_1244'), ('posts', '0005_auto_20210309_2036'), ('posts', '0006_auto_20210316_1936'), ('posts', '0007_auto_20210316_2233'), ('posts', '0008_watchlist'), ('posts', '0009_auto_20210322_0819')]

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Tag',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='Post',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(blank=True, max_length=255)),
                ('body', models.TextField()),
                ('created_on', models.DateTimeField(auto_now_add=True)),
                ('author', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ('image', models.CharField(blank=True, max_length=255, null=True)),
                ('tags', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='posts.tag')),
                ('parents', models.ManyToManyField(blank=True, null=True, related_name='children', to='posts.Post')),
            ],
        ),
        migrations.CreateModel(
            name='Profile',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('user', posts.models.AutoOneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('watchlist', models.ManyToManyField(blank=True, related_name='watched_by', to='posts.Post')),
            ],
        ),
    ]
