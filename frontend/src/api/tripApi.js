import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export async function planTrip(payload) {
  const { data } = await apiClient.post('/api/trips/plan/', payload)
  return data
}

export async function getTrips() {
  const { data } = await apiClient.get('/api/trips/')
  return data
}

export async function getTripDetail(id) {
  const { data } = await apiClient.get(`/api/trips/${id}/`)
  return data
}

export async function healthCheck() {
  const { data } = await apiClient.get('/api/health/')
  return data
}
