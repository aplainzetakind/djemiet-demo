# Generated by Django 3.1.6 on 2021-03-16 19:36

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('posts', '0005_auto_20210309_2036'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='post',
            name='refs',
        ),
        migrations.AddField(
            model_name='post',
            name='children',
            field=models.ManyToManyField(blank=True, null=True, related_name='_post_children_+', to='posts.Post'),
        ),
        migrations.AddField(
            model_name='post',
            name='parents',
            field=models.ManyToManyField(blank=True, null=True, related_name='_post_parents_+', to='posts.Post'),
        ),
    ]