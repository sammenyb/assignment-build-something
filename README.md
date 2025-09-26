# Cloud Storage App (Kubernetes Edition)

This project is a simple cloud storage web application built with **FastAPI**, **React**, **MinIO**, and **SQLite**, orchestrated using **Kubernetes**.  
It demonstrates user authentication, file upload/download, and secure storage using modern cloud-native practices.

---

## Features

- **User Registration & Login** (JWT-based authentication)
- **File Upload, Download, and Delete** (with per-user permissions)
- **MinIO** for object storage (S3-compatible)
- **SQLite** for metadata and user management
- **React Frontend** with Material UI
- **Kubernetes** deployments for all services
- **Secrets management** using Kubernetes Secrets

---

## Architecture

- **auth-service**: Handles user registration, login, and JWT issuance.
- **storage-service**: Handles file metadata, permissions, and interacts with MinIO for file storage.
- **frontend-service**: React app for user interaction.
- **minio**: S3-compatible object storage.

All services are containerized and managed by Kubernetes Deployments and Services.

---

## Prerequisites

- [Minikube](https://minikube.sigs.k8s.io/) (recommended)   
or    
[Docker Desktop](https://www.docker.com/products/docker-desktop/) with Kubernetes enabled (Not tested)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- [Python 3.11+](https://www.python.org/)
- [Node.js 18+](https://nodejs.org/)

---

## Quick Start (with Minikube)

1. **Start Minikube**
    ```sh
    minikube start
    ```
2. **Reset and Deploy Everything**
    ```sh
    ./clean-k8s-start.sh
    ```
    This script:
    - Deletes all existing resources
    - **Creates a new JWT secret**
    - Applies all Kubernetes manifests
    - Waits for the frontend to be ready and opens it in your browser

3. **Access the App**  
    The frontend should open automatically in your browser.  
    If not, your terminal will display output similar to the following, showing the accessible URL:


    <table>
      <tr>
        <th style="border:1px solid #ccc;padding:4px;">Namespace</th>
        <th style="border:1px solid #ccc;padding:4px;">Service</th>
        <th style="border:1px solid #ccc;padding:4px;">Target Port</th>
        <th style="border:1px solid #ccc;padding:4px;">URL (Example)</th>
      </tr>
      <tr>
        <td style="border:1px solid #ccc;padding:4px;">default</td>
        <td style="border:1px solid #ccc;padding:4px;">frontend-service</td>
        <td style="border:1px solid #ccc;padding:4px;">3000</td>
        <td style="border:1px solid #ccc;padding:4px;"><a href="http://192.168.49.2:30000">http://192.168.49.2:30000</a></td>
      </tr>
    </table>

---

## Alternative: Docker Compose

If you prefer not to use Kubernetes, a `docker-compose.yml` file is included for local development and testing.

1. **Start all services with Docker Compose**
    ```sh
    docker-compose up --build
    ```
2. **Update Service URLs**  
    To make the app work locally, update the API URLs in the following files to use `localhost` and the correct ports as defined in `docker-compose.yml`:
    - `auth-service/main.py`
    - `storage-service/main.py`
    - `frontend-service/login.js`
    - `frontend-service/FileManager.js`

3. **Access the App**  
    The frontend will be available at [http://localhost:3000](http://localhost:3000).
