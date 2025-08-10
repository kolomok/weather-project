from django.test import TestCase, Client
from django.contrib.auth.models import User
from weather.models import FavouriteCity

class ApiTest(TestCase):
    def setUp(self):
        self.client = Client()

    def test_register_success(self):
        resp = self.client.post("/api/register/", data={
            "username": "vasya",
            "password1": "qwe12345",
            "password2": "qwe12345",
        }, content_type="application/json")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json().get("success"))
        self.assertTrue(User.objects.filter(username="vasya").exists())

    def test_register_password_mismatch(self):
        resp = self.client.post("/api/register/", data={
            "username": "masha",
            "password1": "qwe12345",
            "password2": "qwe12345X", 
        }, content_type="application/json" )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("Пароли не совпадают", resp.json().get("error", ""))

    def test_login_success(self):
        User.objects.create_user(username="oleg", password="pass12345")
        resp = self.client.post("/api/login/", data={
            "username":"oleg",
            "password": "pass12345"
        }, content_type="application/json")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json().get("success"))

        resp2 = self.client.get("/api/favorites/")

        self.assertNotEqual(resp2.status_code, 302)

    def test_favorites_requires_auth(self):
        resp = self.client.get("/api/favorites/")

        self.assertEqual(resp.status_code, 302)
        self.assertIn("/accounts/login/", resp["Location"])

    def test_favorites_add_list_remove(self):
        user = User.objects.create_user(username="test", password="p@ssw0rd")
        self.client.login(username="test", password="p@ssw0rd")

        resp = self.client.get("/api/favorites/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIsInstance(data.get("items"), list)
        self.assertEqual(len(data["items"]), 0)

        payload = {"name": "Prague", "country": "CZ", "lat": 50.08, "lon": 14.43}

        add = self.client.post("/api/favorites/add/", data=payload, content_type="application/json")

        self.assertEqual(add.status_code, 200, add.content)
        add_data = add.json()
        self.assertTrue(add_data.get("OK"))
        self.assertTrue(add_data.get("created"))
        fav_id = add_data.get("id")
        self.assertTrue(FavouriteCity.objects.filter(user=user, name="Prague").exists())

        add2 = self.client.post("/api/favorites/add/", data=payload, content_type="application/json")
        self.assertEqual(add2.status_code, 200)
        self.assertTrue(add2.json().get("OK"))
        self.assertFalse(add2.json().get("created"))

        resp2 = self.client.get("/api/favorites/")
        self.assertEqual(resp2.status_code, 200)
        items = resp2.json().get("items", [])
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["name"], "Prague")

        self.assertIn("lat", items[0])
        self.assertIn("lon", items[0])

        rm = self.client.post("/api/favorites/remove/", data={"id": fav_id}, content_type="application/json")
        self.assertEqual(rm.status_code, 200, rm.content)
        self.assertTrue(rm.json().get("ok"))
        self.assertEqual(FavouriteCity.objects.filter(user=user).count(), 0)

    def test_remove_by_name_country(self):
        user = User.objects.create_user(username="test2", password="p@ssw0rd")
        self.client.login(username="test2", password="p@ssw0rd")

        FavouriteCity.objects.create(user=user, name="Berlin", country="DE", lat=52.52, lon=13.41)

        rm = self.client.post(
            "/api/favorites/remove/",
            data={"name": "Berlin", "country":"DE"},
            content_type="application/json")
        
        self.assertEqual(rm.status_code, 200, rm.content)
        self.assertTrue(rm.json().get("success"))
        self.assertFalse(FavouriteCity.objects.filter(user=user, name="Berlin").exists())