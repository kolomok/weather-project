from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from .models import City, FavouriteCity
import json
import requests


def index(request):
    return render(request, "index.html")


def register_page(request):
    return render(request, "register.html")


def login_page(request):
    return render(request, "login.html")


@login_required
def favorites_page(request):
    return render(request, "favorites.html")

def logout_view(request):
    logout(request)
    return redirect('/')

def city_search_page(request):
    query = request.GET.get("q", "")
    cities = []
    weather_data = None

    if query:
        cities = City.objects.filter(name__icontains=query)

        api_key = "a9c23e068a0e62f0ae23ab4a0336b395"
        url = f"https://api.openweathermap.org/data/2.5/weather?q={query}&appid={api_key}&units=metric&lang=ru"
        response = requests.get(url)
        weather_data = response.json() if response.status_code == 200 else {"error": "Город не найден"}

    return render(
        request,
        "cities.html",
        {"query": query, "cities": cities, "weather": weather_data},
    )

@csrf_exempt
def register_user(request):
    if request.method != "POST":
        return JsonResponse({"error": "Только POST"}, status=405)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Неверные данные"}, status=400)

    username = data.get("username")
    password1 = data.get("password1")
    password2 = data.get("password2")

    if not username or not password1 or not password2:
        return JsonResponse({"error": "Все поля обязательны"}, status=400)
    if password1 != password2:
        return JsonResponse({"error": "Пароли не совпадают"}, status=400)
    if User.objects.filter(username=username).exists():
        return JsonResponse({"error": "Пользователь уже существует"}, status=400)

    user = User.objects.create_user(username=username, password=password1)
    login(request, user)
    return JsonResponse({"success": True})


@csrf_exempt
def login_user(request):
    if request.method != "POST":
        return JsonResponse({"error": "Только POST"}, status=405)

    data = json.loads(request.body)
    user = authenticate(request, username=data.get("username"), password=data.get("password"))
    if not user:
        return JsonResponse({"error": "Неверный логин или пароль"}, status=400)
    login(request, user)
    return JsonResponse({"success": True})

@login_required
def favorites_list(request):
    """GET /api/favorites/ — список избранного текущего пользователя (JSON)"""
    items = list(
        FavouriteCity.objects.filter(user=request.user)
        .values("id", "name", "country", "lat", "lon", "created_at")  
    )
    return JsonResponse({"success": True, "items": items})


@require_POST
@login_required
def favorites_add(request):
    try:
        payload = json.loads(request.body.decode('utf-8'))
        name = (payload.get('name') or '').strip()
        country = (payload.get('country') or '').strip().upper()
        lat = payload.get('lat')
        lon = payload.get('lon')

        if not name:
            return JsonResponse({'error': 'name is required'}, status=400)

        obj, created = FavouriteCity.objects.get_or_create(
            user=request.user,
            name=name,
            country=country or '',
            defaults={'lat': lat, 'lon': lon}
        )

        if not created and (lat is not None or lon is not None):
            changed = False
            if lat is not None and obj.lat != lat:
                obj.lat = lat
                changed = True
            if lon is not None and obj.lon != lon:
                obj.lon = lon
                changed = True
            if changed:
                obj.save(update_fields=['lat', 'lon'])

        return JsonResponse({'OK': True, 'ok': True, 'success': True, 'created': created, 'id': obj.id})


    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@require_POST
@login_required
def favorites_remove(request):
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"error": "Bad JSON"}, status=400)

    fav_id = payload.get("id")
    name = (payload.get("name") or "").strip()
    country = (payload.get("country") or "").strip().upper()

    qs = FavouriteCity.objects.filter(user=request.user)

    if fav_id:
        qs = qs.filter(id=fav_id)
    elif name:
        qs = qs.filter(name=name)
        if country:
            qs = qs.filter(country=country)
    else:
        return JsonResponse({"error": "id or name required"}, status=400)

    deleted, _ = qs.delete()
    return JsonResponse({"OK": True, "ok": True, "success": True, "deleted": deleted})


