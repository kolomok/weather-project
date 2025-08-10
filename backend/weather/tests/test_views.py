from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User

class IndexPageTests(TestCase):
    def test_index_status_200(self):
        url = reverse('index')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)

class FavoritesPageTests(TestCase):
    def test_redirect_to_login_when_anonymous(self):
        url = reverse('favorites') 
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 302)
        self.assertIn('/accounts/login/', resp['Location'])

    def test_open_when_logged_in(self):
        user = User.objects.create_user(username='u1', password='p1')
        self.client.login(username='u1', password='p1')
        url = reverse('favorites')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)

class SearchPageTests(TestCase):
    def test_search_page_renders(self):
        url = reverse('city_search')  
        resp = self.client.get(url, {'q': 'Київ'})
        self.assertEqual(resp.status_code, 200)
