# Flask API Template for Production

A production-ready Flask REST API template with enterprise-grade security, clean architecture, and best practices built-in. This template is designed to help developers quickly bootstrap new API projects with a solid foundation, allowing them to focus on business logic rather than infrastructure setup.

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Database Migrations](#database-migrations)
- [Security Features](#security-features)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Contributing Guidelines](#contributing-guidelines)
- [Maintenance Guidelines](#maintenance-guidelines)
- [License](#license)

## Project Overview

This is a Flask REST API template designed as a starting point for building production-grade web APIs. It implements a clean, decoupled architecture with comprehensive security features, making it suitable for real-world applications.

### Purpose

This template serves as a foundation that you can customize and extend for your specific needs. It eliminates the need to set up common infrastructure components from scratch, including:

- Authentication and authorization systems
- Database integration with migrations
- Security middleware and protections
- Input validation and sanitization
- Error handling
- Logging configuration
- Environment-based configuration management

### Who Should Use This Template

- Developers starting new Flask API projects
- Teams looking for a standardized project structure
- Anyone needing production-ready security features out of the box
- Developers learning clean architecture patterns in Flask

## Architecture

This project follows a modular, layered architecture with clear separation of concerns. Each module is self-contained and organized into distinct layers:

### Layered Structure

```
Route (HTTP) → Controller (HTTP Layer) → Service (Business Logic) → Repository (Data Access) → Database
```

### Module Organization

Each feature module contains four layers:

- **Model**: Marshmallow schemas for input validation and output serialization
- **Service**: Pure business logic, framework-agnostic, returns domain objects
- **Repository**: Database operations and queries
- **Controller**: HTTP layer handling validation, serialization, and token generation

### Benefits of This Architecture

- **Testability**: Business logic can be tested without HTTP context
- **Reusability**: Services can be used in CLI commands, background jobs, or other interfaces
- **Maintainability**: Clear boundaries between layers make code easier to understand and modify
- **Flexibility**: Easy to swap frameworks or add new interfaces without changing business logic

## Features

### Security

- JWT-based authentication with access and refresh tokens
- Role-based access control
- Password hashing using PBKDF2
- CORS configuration with credential support
- Rate limiting per endpoint and globally
- Input sanitization to prevent XSS and SQL injection
- Security headers (HSTS, CSP, X-Frame-Options) via Flask-Talisman
- HTTPOnly cookies for refresh tokens

### Development Features

- Environment-based configuration (development, production, testing)
- Database migrations with Alembic
- Structured logging
- Centralized error handling
- Factory pattern for app initialization
- SQLAlchemy ORM with parameterized queries

### Code Quality

- Clean, modular architecture
- Type hints where applicable
- Comprehensive error messages
- Consistent code organization
- Separation of concerns

## Technology Stack

### Core Framework

- **Flask 3.1.3**: Lightweight WSGI web application framework
- **Gunicorn 25.1.0**: Production WSGI HTTP server

### Database

- **SQLAlchemy 2.0.46**: SQL toolkit and ORM
- **Flask-SQLAlchemy 3.1.1**: Flask integration for SQLAlchemy
- **Alembic 1.18.4**: Database migration tool
- **Flask-Migrate 4.1.0**: Flask wrapper for Alembic

### Security

- **Flask-JWT-Extended 4.7.1**: JWT authentication
- **Flask-CORS 5.0.0**: Cross-Origin Resource Sharing
- **Flask-Limiter 3.8.0**: Rate limiting
- **Flask-Talisman 1.1.0**: Security headers
- **Bleach 6.2.0**: HTML sanitization
- **Werkzeug 3.1.6**: Password hashing utilities

### Validation

- **Marshmallow 4.2.2**: Object serialization and validation
- **Pydantic 2.12.5**: Data validation using Python type annotations

### Utilities

- **python-dotenv 1.2.1**: Environment variable management

## Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package installer)
- Virtual environment tool (venv, virtualenv, or conda)
- Git (for cloning the repository)

### Step-by-Step Setup

1. **Clone the repository**

```bash
git clone https://github.com/whilmarbitoco/flask-api-template.git

cd flask-api-template
```

2. **Create and activate a virtual environment**

On Windows:

```bash
python -m venv venv
venv\Scripts\activate
```

On macOS/Linux:

```bash
python3 -m venv venv
source venv/bin/activate
```

3. **Install dependencies**

```bash
pip install -r requirements.txt
```

4. **Set up environment variables**

Copy the sample environment file and configure it:

```bash
cp .env.sample .env
```

Edit `.env` and set your configuration values:

```env
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
DATABASE_URL=sqlite:///app.db
CORS_ORIGINS=http://localhost:3000,http://localhost:5000
```

**Important**: Generate strong, random secret keys for production. Never commit your `.env` file to version control.

5. **Initialize the database**

```bash
flask db upgrade
```

This will create the database and apply all migrations.

6. **Run the application**

For development:

```bash
python wsgi.py
```

For production (using Gunicorn):

```bash
gunicorn -w 4 -b 0.0.0.0:8000 wsgi:app
```

The API will be available at `http://localhost:5000` (development) or `http://localhost:8000` (production).

## Usage

This template provides a working authentication system and user management as examples. You should customize and extend these features for your specific needs.

### Example: User Registration and Authentication

1. **Register a new user**

```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "securepassword123",
    "age": 25
  }'
```

Response:

```json
{
  "message": "User registered successfully",
  "user_id": 1
}
```

2. **Login to get access token**

```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }' \
  -c cookies.txt
```

Response:

```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

The refresh token is automatically set as an HTTPOnly cookie.

3. **Access protected endpoints**

```bash
curl -X GET http://localhost:5000/users \
  -H "Authorization: Bearer <your-access-token>"
```

4. **Refresh access token**

```bash
curl -X POST http://localhost:5000/auth/refresh \
  -b cookies.txt
```

### Customizing the Template

This template is meant to be customized. Here are common customization tasks:

#### Adding a New Module

1. Create a new directory under `app/modules/`:

```
app/modules/products/
├── model.py       # Validation schemas
├── service.py     # Business logic
├── repository.py  # Database operations
└── controller.py  # HTTP layer
```

2. Create the database model in `app/database/schema.py`

3. Create a migration:

```bash
flask db migrate -m "create products table"
flask db upgrade
```

4. Create routes in `app/api/v1/products/route.py`

5. Register the blueprint in `app/__init__.py`

#### Modifying Authentication Logic

The authentication logic is in `app/modules/auth/service.py`. You can modify:

- Password requirements
- User registration validation
- Authentication methods (add OAuth, LDAP, etc.)

#### Changing Database

To use PostgreSQL or MySQL instead of SQLite:

1. Install the appropriate driver:

```bash
pip install psycopg2-binary  # PostgreSQL
# or
pip install pymysql  # MySQL
```

2. Update `DATABASE_URL` in `.env`:

```env
# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost/dbname

# MySQL
DATABASE_URL=mysql+pymysql://user:password@localhost/dbname
```

## Project Structure

```
flask-api-template-for-prod/
├── app/
│   ├── api/                    # API routes organized by version
│   │   └── v1/
│   │       ├── auth/
│   │       │   └── route.py    # Authentication endpoints
│   │       └── users/
│   │           └── route.py    # User management endpoints
│   ├── core/
│   │   ├── config.py           # Environment-based configuration
│   │   └── logging.py          # Logging configuration
│   ├── database/
│   │   └── schema.py           # SQLAlchemy models
│   ├── errors/
│   │   └── handlers.py         # Custom error classes
│   ├── modules/                # Feature modules
│   │   ├── auth/
│   │   │   ├── controller.py   # HTTP layer
│   │   │   ├── model.py        # Validation schemas
│   │   │   ├── repository.py   # Database operations
│   │   │   └── service.py      # Business logic
│   │   └── users/
│   │       ├── controller.py
│   │       ├── model.py
│   │       ├── repository.py
│   │       └── service.py
│   ├── utils/
│   │   ├── auth.py             # Authentication utilities
│   │   ├── lib.py              # Helper functions
│   │   └── sanitizer.py        # Input sanitization
│   ├── __init__.py             # App factory
│   └── extensions.py           # Flask extensions initialization
├── migrations/                 # Database migrations
│   └── versions/
├── .env.sample                 # Environment variables template
├── .gitignore
├── requirements.txt            # Python dependencies
└── wsgi.py                     # Application entry point
```

## Configuration

Configuration is managed through environment variables and Python classes in `app/core/config.py`.

### Environment Variables

| Variable         | Description                                  | Default               | Required         |
| ---------------- | -------------------------------------------- | --------------------- | ---------------- |
| `FLASK_ENV`      | Environment (development/production/testing) | development           | No               |
| `SECRET_KEY`     | Flask secret key for sessions                | fallback-secret       | Yes (production) |
| `JWT_SECRET_KEY` | Secret key for JWT tokens                    | Uses SECRET_KEY       | Yes (production) |
| `DATABASE_URL`   | Database connection string                   | sqlite:///app.db      | Yes (production) |
| `CORS_ORIGINS`   | Comma-separated allowed origins              | http://localhost:3000 | No               |

### Configuration Classes

- **BaseConfig**: Common settings for all environments
- **DevelopmentConfig**: Debug mode enabled, relaxed security
- **ProductionConfig**: Debug disabled, strict security, requires DATABASE_URL
- **TestingConfig**: In-memory database, testing mode enabled

### JWT Configuration

- Access token expiry: 15 minutes
- Refresh token expiry: 30 days
- Token locations: Headers and cookies
- Cookie security: HTTPOnly, Secure (production), SameSite=Strict

### Rate Limiting

Default limits:

- Global: 200 requests per day, 50 per hour
- Registration: 5 per hour
- Login: 10 per minute
- User endpoints: 30 per minute

Customize limits in route decorators or `app/extensions.py`.

## Database Migrations

This project uses Alembic for database migrations through Flask-Migrate.

### Common Migration Commands

**Create a new migration after model changes:**

```bash
flask db migrate -m "description of changes"
```

**Apply migrations:**

```bash
flask db upgrade
```

**Rollback last migration:**

```bash
flask db downgrade
```

**View migration history:**

```bash
flask db history
```

**View current migration:**

```bash
flask db current
```

### Migration Best Practices

1. Always review auto-generated migrations before applying
2. Test migrations on a copy of production data
3. Write both upgrade and downgrade functions
4. Use descriptive migration messages
5. Never modify applied migrations; create new ones instead

## Security Features

### Authentication Flow

1. User registers with email and password
2. Password is hashed using Werkzeug's PBKDF2
3. User logs in and receives:
   - Access token (JWT, 15-minute expiry) in response body
   - Refresh token (JWT, 30-day expiry) in HTTPOnly cookie
4. Access token is sent in Authorization header for protected routes
5. Refresh token is used to obtain new access tokens

### Input Sanitization

All request data is automatically sanitized to prevent:

- XSS attacks (HTML tags removed)
- SQL injection (dangerous characters filtered)
- Script injection

Sanitization is applied in routes before validation.

### SQL Injection Protection

- SQLAlchemy ORM uses parameterized queries
- Additional input sanitization layer
- Type validation via Marshmallow schemas

### Rate Limiting

Rate limiting is IP-based and uses in-memory storage by default. For production, configure Redis:

```python
# app/extensions.py
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="redis://localhost:6379"
)
```

### Security Headers

Flask-Talisman adds security headers in production:

- Strict-Transport-Security (HSTS)
- Content-Security-Policy (CSP)
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN

## API Documentation

### Authentication Endpoints

#### POST /auth/register

Register a new user.

**Request Body:**

```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securepassword123",
  "age": 25
}
```

**Response:** 201 Created

```json
{
  "message": "User registered successfully",
  "user_id": 1
}
```

**Rate Limit:** 5 per hour

#### POST /auth/login

Authenticate and receive tokens.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:** 200 OK

```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

Sets `refresh_token` cookie (HTTPOnly).

**Rate Limit:** 10 per minute

#### POST /auth/refresh

Get a new access token using refresh token.

**Headers:**

- Cookie: refresh_token (automatically sent by browser)

**Response:** 200 OK

```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Authentication:** Requires valid refresh token in cookie

#### POST /auth/logout

Logout and clear refresh token.

**Headers:**

- Authorization: Bearer <access_token>

**Response:** 200 OK

```json
{
  "message": "Logged out successfully"
}
```

**Authentication:** Required

### User Endpoints

All user endpoints require JWT authentication.

#### GET /users

List all users.

**Headers:**

- Authorization: Bearer <access_token>

**Response:** 200 OK

```json
[
  {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "age": 25
  }
]
```

**Rate Limit:** 30 per minute

#### POST /users

Create a new user.

**Headers:**

- Authorization: Bearer <access_token>

**Request Body:**

```json
{
  "email": "newuser@example.com",
  "name": "Jane Smith",
  "age": 30
}
```

**Response:** 201 Created

```json
{
  "id": 2,
  "email": "newuser@example.com",
  "name": "Jane Smith",
  "age": 30
}
```

**Rate Limit:** 10 per minute

#### GET /users/<user_id>

Get a specific user by ID.

**Headers:**

- Authorization: Bearer <access_token>

**Response:** 200 OK

```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "age": 25
}
```

**Rate Limit:** 30 per minute

### Error Responses

All errors follow a consistent format:

```json
{
  "error": "Error message description",
  "status_code": 400
}
```

**Common Status Codes:**

- 400: Bad Request (validation errors)
- 401: Unauthorized (missing or invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found (resource doesn't exist)
- 409: Conflict (duplicate resource)
- 500: Internal Server Error

## Testing

### Running Tests

This template is designed to be easily testable. Here's how to set up and run tests:

1. **Install testing dependencies:**

```bash
pip install pytest pytest-flask pytest-cov
```

2. **Create test directory structure:**

```
tests/
├── __init__.py
├── conftest.py          # Pytest fixtures
├── services/
│   ├── test_auth_service.py
│   └── test_user_service.py
├── controllers/
│   ├── test_auth_controller.py
│   └── test_user_controller.py
└── routes/
    ├── test_auth_routes.py
    └── test_user_routes.py
```

3. **Run tests:**

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/services/test_auth_service.py

# Run with verbose output
pytest -v
```

### Testing Strategy

The decoupled architecture enables different testing levels:

**Unit Tests (Services):**

- Test business logic without HTTP context
- Fast and isolated
- No database mocking needed

**Integration Tests (Controllers):**

- Test HTTP layer with business logic
- Validate serialization and validation

**End-to-End Tests (Routes):**

- Test full HTTP request/response cycle
- Validate authentication and authorization

### Example Test

```python
# tests/services/test_auth_service.py
import pytest
from app.modules.auth.service import AuthService
from app.errors.handlers import ConflictError

def test_register_user_success(db_session):
    service = AuthService()

    user = service.register_user(
        email="test@example.com",
        name="Test User",
        password="password123",
        age=25
    )

    assert user.id is not None
    assert user.email == "test@example.com"

def test_register_duplicate_email_raises_error(db_session):
    service = AuthService()

    service.register_user("test@example.com", "User 1", "pass123")

    with pytest.raises(ConflictError):
        service.register_user("test@example.com", "User 2", "pass456")
```

## Contributing Guidelines

We welcome contributions to improve this template. Please follow these guidelines:

### Code Style

1. **Python Style Guide:**
   - Follow PEP 8 conventions
   - Use 4 spaces for indentation
   - Maximum line length: 100 characters
   - Use descriptive variable and function names

2. **Import Organization:**
   - Standard library imports first
   - Third-party imports second
   - Local application imports last
   - Alphabetically sorted within each group

3. **Type Hints:**
   - Use type hints for function parameters and return values
   - Example: `def get_user(user_id: int) -> User:`

4. **Docstrings:**
   - Use docstrings for all public functions and classes
   - Follow Google or NumPy docstring format

### Git Workflow

1. **Fork the repository**

2. **Create a feature branch:**

```bash
git checkout -b feature/your-feature-name
```

Use prefixes:

- `feature/` for new features
- `fix/` for bug fixes
- `docs/` for documentation
- `refactor/` for code refactoring

3. **Make your changes:**
   - Write clean, readable code
   - Add tests for new functionality
   - Update documentation as needed

4. **Commit your changes:**

```bash
git commit -m "Add feature: description of changes"
```

Commit message format:

- Use present tense ("Add feature" not "Added feature")
- First line: brief summary (50 characters or less)
- Blank line, then detailed description if needed

5. **Push to your fork:**

```bash
git push origin feature/your-feature-name
```

6. **Create a Pull Request**

### Pull Request Process

1. **Before Submitting:**
   - Ensure all tests pass
   - Update documentation if needed
   - Check code style compliance
   - Rebase on latest main branch

2. **PR Description Should Include:**
   - Clear description of changes
   - Motivation and context
   - Related issue numbers (if applicable)
   - Screenshots (for UI changes)
   - Breaking changes (if any)

3. **Review Process:**
   - At least one maintainer approval required
   - Address all review comments
   - Keep PR focused on a single concern
   - Be responsive to feedback

4. **After Approval:**
   - Maintainer will merge the PR
   - Delete your feature branch

### Code Review Guidelines

**For Contributors:**

- Be open to feedback
- Explain your reasoning
- Keep discussions professional and constructive

**For Reviewers:**

- Be respectful and constructive
- Explain why changes are needed
- Approve when standards are met

### Reporting Issues

When reporting bugs or requesting features:

1. **Search existing issues** to avoid duplicates

2. **Use issue templates** if available

3. **Provide detailed information:**
   - Clear, descriptive title
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Environment details (OS, Python version)
   - Error messages and stack traces

4. **Label appropriately:**
   - bug: Something isn't working
   - enhancement: New feature or request
   - documentation: Documentation improvements
   - question: Further information requested

## Maintenance Guidelines

### Dependency Management

1. **Regular Updates:**
   - Review dependencies monthly for security updates
   - Test thoroughly after updates
   - Update `requirements.txt` with specific versions

2. **Security Vulnerabilities:**
   - Monitor security advisories
   - Apply security patches promptly
   - Use tools like `pip-audit` or `safety`:

```bash
pip install pip-audit
pip-audit
```

3. **Version Pinning:**
   - Pin major and minor versions in production
   - Example: `Flask==3.1.3` not `Flask>=3.0.0`
   - Document reasons for version constraints

### Database Maintenance

1. **Backup Strategy:**
   - Regular automated backups
   - Test restore procedures
   - Store backups securely off-site

2. **Migration Management:**
   - Test migrations on staging before production
   - Keep migrations reversible when possible
   - Document complex migrations

3. **Performance Monitoring:**
   - Monitor slow queries
   - Add indexes as needed
   - Regular database optimization

### Code Maintenance

1. **Code Quality:**
   - Run linters regularly (pylint, flake8)
   - Maintain test coverage above 80%
   - Refactor when complexity increases

2. **Documentation:**
   - Keep README up to date
   - Document API changes
   - Update architecture docs when structure changes
   - Maintain changelog

3. **Technical Debt:**
   - Track technical debt in issues
   - Allocate time for refactoring
   - Address deprecation warnings promptly

### Monitoring and Logging

1. **Application Monitoring:**
   - Monitor error rates
   - Track response times
   - Set up alerts for critical issues

2. **Log Management:**
   - Rotate logs regularly
   - Archive old logs
   - Monitor disk space usage

3. **Security Monitoring:**
   - Review authentication logs
   - Monitor rate limit violations
   - Track failed login attempts

### Production Deployment

1. **Pre-Deployment Checklist:**
   - All tests passing
   - Security scan completed
   - Database migrations tested
   - Environment variables configured
   - Backup created

2. **Deployment Process:**
   - Use blue-green or rolling deployments
   - Monitor application during deployment
   - Have rollback plan ready

3. **Post-Deployment:**
   - Verify critical functionality
   - Monitor error rates
   - Check performance metrics

### Environment Management

1. **Development:**
   - Keep development environment similar to production
   - Use Docker for consistency
   - Document setup process

2. **Staging:**
   - Mirror production configuration
   - Test all changes in staging first
   - Use production-like data (anonymized)

3. **Production:**
   - Strict access controls
   - Automated deployments
   - Comprehensive monitoring

### Documentation Maintenance

1. **Keep Updated:**
   - README for setup and usage
   - API documentation for endpoints
   - Architecture docs for design decisions
   - Changelog for version history

2. **Review Regularly:**
   - Quarterly documentation review
   - Update outdated information
   - Add missing documentation

3. **User Feedback:**
   - Collect feedback on documentation clarity
   - Address common questions in docs
   - Provide examples for complex features

## LICENSE

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Getting Help

If you encounter issues or have questions:

1. Check the documentation in this README
2. Search existing issues on GitHub
3. Create a new issue with detailed information

## Acknowledgments

This template incorporates best practices from the Flask community and production-grade API development patterns. It is designed to be a starting point that you can adapt to your specific requirements.

Happy coding!
