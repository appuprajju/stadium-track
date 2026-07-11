import sys
import os
import unittest
from fastapi.testclient import TestClient

# Add root folder and backend folder to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

class TestStadiumMindAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_get_incidents(self):
        response = self.client.get("/api/v1/incidents")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    def test_get_gates(self):
        response = self.client.get("/api/v1/gates")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)
        self.assertGreater(len(response.json()), 0)

    def test_get_staff(self):
        response = self.client.get("/api/v1/staff")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)
        self.assertGreater(len(response.json()), 0)

    def test_search_sops(self):
        response = self.client.get("/api/v1/sops/search?q=cardiac")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

if __name__ == "__main__":
    unittest.main()
