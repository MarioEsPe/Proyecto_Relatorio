# Relatorio API: Shift Management System

## Project Vision

Relatorio API is a robust backend system designed to digitize and centralize the shift report completion process for a thermoelectric power plant's Shift Superintendent, based on procedure `O-2120-103`. This project transforms a manual, paper-dependent operational procedure into a modern, secure, and scalable RESTful API, laying the groundwork for future data analysis and visualization tools.

## Problem Context

The manual procedure aims to "ensure the correct and efficient completion of the Shift Superintendent's report" so that the information is useful for consultation and analysis. While functional, this traditional process presents challenges such as difficulty in querying historical data, lack of data centralization, and the risk of inconsistencies. This API directly addresses these issues by providing a single, digital, and accessible source of truth.

## Key Features

The API implements all modules described in the operational procedure, allowing for comprehensive shift management:

- **Shift Management:** Create, close, and query operational shifts, ensuring the incoming superintendent has full visibility of the plant's status.
- **Personnel & Attendance Control:** Log personnel assigned to a shift and update their status (absences, substitutions, etc.).
- **Main Equipment Status:** Track the status of equipment (in-service, available, out-of-service) and the reasons for unavailability.
- **Operational Event Log:** Record all significant operational events, such as protection trips, forced outages, unit synchronizations, or shutdowns.
- **Consumables Monitoring:** Capture fuel and water (potable and demineralized) tank levels.
- **License Management:** Administer licenses with the Control Area, logging the license number, affected unit, reason, and duration.
- **Maintenance Tracking:** Create and track "defects" or maintenance tickets for unavailable equipment.
- **Novelties and Safety:** A module to record safety incidents, special instructions, or other relevant novelties.
- **Generation Ramp Self-Assessment:** Log and evaluate compliance with generation adjustment ramps instructed by CENACE.
- **Operational Parameters:** Capture crucial parameter readings to analyze the performance of the generating units.

## Tech Stack

- **Language:** Python 3.10+
- **Framework:** FastAPI
- **Database:** SQLite (via SQLModel for ORM and validation)
- **Authentication:** JWT (JSON Web Tokens)
- **Server:** Uvicorn

## Architecture and Design

This project was built following modern software design principles to ensure maintainability and scalability:

- **Separation of Concerns:** A clear distinction between database models (`models.py`) and API schemas (`schemas.py`), allowing the API contract to evolve independently of the database structure.
- **Modularity:** Business logic is organized into domain-specific routers (equipment, personnel, licenses, etc.), making the codebase easier to navigate and maintain.
- **Dependency Injection:** Heavy use of FastAPI's dependency injection system to manage database sessions and user authentication, promoting clean and reusable code.
- **Authentication & Authorization:** Implementation of a JWT-based authentication system and role-based authorization to protect critical endpoints.

## Setup and Usage Guide

### Prerequisites

- Python 3.10 or higher
- Git

### Installation Steps

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/MarioEsPe/Proyecto_Relatorio.git](https://github.com/MarioEsPe/Proyecto_Relatorio.git)
    cd Proyecto_Relatorio
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the application:**
    ```bash
    uvicorn app.main:app --reload
    ```
    The API will be available at `http://127.0.0.1:8000`.

## API Contract

The API's documentation is auto-generated and interactive. Once the application is running, you can access:

- **Swagger UI:** `http://127.0.0.1:8000/docs` to test the endpoints.
- **ReDoc:** `http://127.0.0.1:8000/redoc` for an alternative documentation view.

## Future Enhancements

- **Cloud Deployment:** Package the application for deployment on a platform like Render or Railway.
- **Interactive Frontend:** Develop a web application (React, Vue) that consumes this API to provide a graphical user interface for Shift Superintendents.
- **Analytics Module:** Create new endpoints to generate reports and statistics from historical data.