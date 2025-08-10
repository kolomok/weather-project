from django.test import TestCase, Client
from django.contrib.auth.models import User

class PagesTest(TestCase):
    def setUp(self):
        self.client = Client()

    def test_index_anonymous_shows_login(self):
        resp = self.client.get("/")
        self.assertEqual(resp.status_code, 200)
        html = resp.content.decode("utf-8")

        self.assertIn("Войти", html)

    def test_index_authenticated_shows_username(self):
        user = User.objects.create_user(username="masha", password="12345678")
        self.client.login(username="masha", password="12345678")

        resp = self.client.get("/")
        self.assertEqual(resp.status_code, 200)
        html = resp.content.decode("utf-8")
        self.assertIn("masha", html)

        self.assertNotIn('class="btn-login"', html)