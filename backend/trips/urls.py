from django.urls import path

from .views import (
    HealthCheckView,
    TripDetailView,
    TripListView,
    TripPlanView,
)

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('trips/', TripListView.as_view(), name='trip-list'),
    path('trips/<int:pk>/', TripDetailView.as_view(), name='trip-detail'),
    path('trips/plan/', TripPlanView.as_view(), name='trip-plan'),
]
