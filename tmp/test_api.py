import requests
import json

url = "http://127.0.0.1:5001/api/cat/next-question"
data = {
    "user_id": "bb8e036a-1f54-468b-9411-ba8c1c034596",
    "course_id": "69746c85-6109-4370-9334-1490cd2334b0",
    "assignment_id": "ca5bf6ee-5df4-40f0-abef-2de57ca6bccb",
    "answered_questions": [],
    "last_response": [],
    "current_theta": 0
}

response = requests.post(url, json=data)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")
