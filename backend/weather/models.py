from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class City(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name
    
class FavouriteCity(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorite_cities')
    name = models.CharField(max_length=100)
    country = models.CharField(max_length=2, blank=True, default="")
    lat = models.FloatField(null=True, blank=True)
    lon = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'name', 'country')
        ordering = ['-created_at']