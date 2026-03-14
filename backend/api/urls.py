from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.health, name="health"),
    path("hello/", views.hello, name="hello"),
    path("styles/", views.styles, name="styles"),
    path("generations/", views.create_generation, name="create_generation"),
    path("generations/<uuid:generation_id>/", views.get_generation, name="get_generation"),
    path("auth/register/", views.auth_register, name="auth_register"),
    path("auth/login/", views.auth_login, name="auth_login"),
    path("auth/logout/", views.auth_logout, name="auth_logout"),
    path("auth/me/", views.auth_me, name="auth_me"),
    path("my-styles/", views.my_styles, name="my_styles"),
    path("my-styles/<uuid:generation_id>/", views.my_style_detail, name="my_style_detail"),
    path("daily-look/", views.create_daily_look, name="create_daily_look"),
]
