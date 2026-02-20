import pytest
from fastapi.testclient import TestClient
from models import ProjectRead

def test_create_project(client: TestClient):
    response = client.post(
        "/projects",
        json={
            "title": "API Test Project",
            "description": "Integration test",
            "start_date": "2026-01-01T00:00:00",
            "deadline": "2026-12-31T23:59:59"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "API Test Project"
    assert "id" in data

def test_get_projects(client: TestClient):
    # Add a project first
    client.post("/projects", json={
        "title": "Project 1",
        "start_date": "2026-01-01T00:00:00",
        "deadline": "2026-12-31T23:59:59"
    })
    
    response = client.get("/projects")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1

def test_project_not_found(client: TestClient):
    response = client.get("/projects/999")
    assert response.status_code == 404

def test_metrics_endpoint(client: TestClient):
    # Trigger some metrics
    client.get("/projects")
    
    response = client.get("/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "cpm_runs" in data
    assert "tasks_scored" in data
    assert "risk_evaluations" in data
