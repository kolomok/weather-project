from django.urls import path
from django.contrib import admin
from . import views
from django.conf.urls.i18n import set_language
from weather import views

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", views.index, name="index"),
    path('login/', views.login_page, name='login'),
    path('api/login/', views.login_user, name='api_login'),
    path("register/", views.register_page, name='register'),
    path('api/register/', views.register_user, name='register_user'),
    path("search/", views.city_search_page, name="city_search"),
    path("favorites/", views.favorites_page, name="favorites"),
    path("api/favorites/", views.favorites_list, name="favorites_list"),
    path("api/favorites/add/", views.favorites_add, name="favorites_add"),
    path("api/favorites/remove/", views.favorites_remove, name="favorites_remove"),
    path("logout/", views.logout_view, name="logout"),
     path("i18n/setlang/", set_language, name="set_language"),
]
