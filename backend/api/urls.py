from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.health, name="health"),
    path("hello/", views.hello, name="hello"),
    path("styles/", views.styles, name="styles"),
    path("generations/", views.create_generation, name="create_generation"),
    path("generations/<uuid:generation_id>/", views.get_generation, name="get_generation"),
]
