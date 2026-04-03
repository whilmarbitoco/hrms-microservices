Docker Compose
Learn how to use Docker Compose with Dokploy

Dokploy integrates with Docker Compose and Docker Stack to provide flexible deployment solutions. Whether you are developing locally or deploying at scale, Dokploy facilitates application management through these powerful Docker tools.

Configuration Methods
Dokploy provides two methods for creating Docker Compose configurations:

Docker Compose: Ideal for standard Docker Compose configurations.
Stack: Geared towards orchestrating applications using Docker Swarm. Note that some Docker Compose features, such as build, are not available in this mode.
General
Configure the source of your code, the way your application is built, and also manage actions like deploying, updating, and deleting your application, and stopping it.

Environment
The code editor in Dokploy allows you to define environment variables for your Docker Compose deployment. By default, Dokploy saves these variables to a .env file in the same directory as your docker-compose.yml.

Environment variables set in the UI are written to the .env file, but are not automatically injected into containers. You have two options:

1. Inject all variables — Use the env_file option in your docker-compose.yml to load every variable from the .env file into the container:

services:
app:
env_file: - .env 2. Use specific variables — Reference only the variables you need using the standard ${VAR_NAME} syntax in your docker-compose.yml:

services:
app:
environment: - DATABASE_URL=${DATABASE_URL}
      - API_KEY=${API_KEY}
Monitoring
Monitor each service individually within Dokploy. If your application consists of multiple services, each can be monitored separately to ensure optimal performance.

Logs
Access detailed logs for each service through the Dokploy log viewer, which can help in troubleshooting and ensuring the stability of your services.

Deployments
You can view the last 10 deployments of your application. When you deploy your application in real time, a new deployment record will be created and it will gradually show you how your application is being built.

We also offer a button to cancel deployments that are in queue. Note that those in progress cannot be canceled.

We provide a webhook so that you can trigger your own deployments by pushing to your GitHub, Gitea, GitLab, Bitbucket repository.

Advanced
This section provides advanced configuration options for experienced users. It includes tools for custom commands within the container and volumes.

Command: Dokploy has a defined command to run the Docker Compose file, ensuring complete control through the UI. However, you can append flags or options to the command.

Using Private Registries with Docker Stack

If you're deploying with Docker Stack (Docker Swarm mode) using replicas and a private registry, you need to add the --with-registry-auth flag to ensure that registry credentials are properly distributed to all nodes in your swarm.

Without this flag, worker nodes may fail to pull images from private registries, resulting in authentication errors like "no such image" or "docker authentication failed".

This flag ensures that Docker shares the registry credentials with all swarm nodes during deployment, enabling them to authenticate and pull images from your private registry (GitHub Container Registry, Docker Hub private repos, etc.).

Volumes: To ensure data persistence across deployments, configure storage volumes for your application.

home og image
Volumes

Docker volumes are a way to persist data generated and used by Docker containers. They are particularly useful for maintaining data between container restarts or for sharing data among different containers.

Dokploy supports two methods for data persistence in Docker Compose:

Method 1: Bind Mounts (../files folder)
Use bind mounts for simple persistence needs, configuration files, or when you need direct access to files on the host. This method maps a directory from the host machine into the container.

Important: Avoid using absolute host paths, as they will be cleaned up during deployments:

volumes:

- "/folder:/path/in/container" ❌
  Instead, use the ../files folder to ensure your data persists between deployments:

volumes:

- "../files/my-database:/var/lib/mysql" ✅
- "../files/my-configs:/etc/my-app/config" ✅
  Use bind mounts when:

You need simple data persistence
You're mounting configuration files or small datasets
You want direct file access on the host
You don't need automated backups via Dokploy's Volume Backups feature
Method 2: Docker Named Volumes
Use Docker named volumes when you need automated backups, better portability, or Docker-managed storage. Named volumes are managed by Docker and can be backed up automatically using Dokploy's Volume Backups feature.

services:
app:
image: dokploy/dokploy:latest
volumes: - my-database:/var/lib/mysql - my-app-data:/app/data
volumes:
my-database:
my-app-data:
Use named volumes when:

You need automated backups to S3 (via Volume Backups)
You want Docker-managed storage (better portability)
You're storing databases or large datasets
You need backup and restore capabilities
Note: Volume Backups only work with Docker named volumes, not with bind mounts (../files). If you need backup functionality, use named volumes instead of bind mounts.

Choosing the Right Method
Feature Bind Mounts (../files) Named Volumes
Simple persistence ✅ Yes ✅ Yes
Direct host access ✅ Yes ❌ No
Automated backups ❌ No ✅ Yes
Docker-managed ❌ No ✅ Yes
Best for config files ✅ Yes ⚠️ Possible but less common
Best for databases ⚠️ Possible ✅ Recommended
Important: If you need to use files from your repository (configuration files, scripts, etc.), you must move them to Dokploy's File Mounts (via Advanced → Mounts) instead of mounting them directly from the repository. When using AutoDeploy, Dokploy performs a git clone on each deployment, which clears the repository directory. Mounting files directly from your repository using relative paths (e.g., ./ or ./config/file.conf) will cause them to be lost or empty in subsequent deployments. See the Troubleshooting guide for more details.
Docker Compose
Domains
Configure domains for your Docker Compose application.

When using Docker Compose, there are two ways to configure domains for your services:

Method 1: Using Dokploy Domains (Recommended)
The easiest way to configure domains is using Dokploy's native domain management feature. This method allows you to configure domains directly through the Dokploy UI without manually editing your Docker Compose file.

Recommended: Since v0.7.0, Dokploy supports domains natively. You can configure your domains directly in the Dokploy UI through the Domains tab of your Docker Compose application. This is the simplest and most user-friendly approach.

To use this method:

Navigate to your Docker Compose application in Dokploy
Go to the Domains tab
Click Add Domain and configure your domain
Dokploy will automatically handle the routing configuration
How It Works
At runtime, during the deployment phase, Dokploy automatically adds Traefik labels internally to your Docker Compose file. You don't need to manually add these labels - Dokploy handles this automatically based on the domains you configure in the UI.

Example:

Here's a default Docker Compose file:

version: "3.8"
services:
beszel:
image: henrygd/beszel:0.10.2
restart: unless-stopped
ports: - 8090
volumes: - beszel_data:/beszel_data - /var/run/docker.sock:/var/run/docker.sock:ro
volumes:
beszel_data: {}
Preview Compose Feature:

You can click the Preview Compose button to see the final Docker Compose file that will be executed. If you have at least one domain added, the preview will show the compose file with all the labels and network configurations automatically added.

Here's what the final compose file looks like when deployed (this example uses Isolated Deployments):

version: "3.8"
services:
beszel:
image: henrygd/beszel:0.10.2
restart: unless-stopped
ports: - 8090
volumes: - beszel_data:/beszel_data - /var/run/docker.sock:/var/run/docker.sock:ro
networks: - a-beszel-a95pzl
labels: - traefik.http.routers.a-beszel-a95pzl-715-web.rule=Host(`a-beszel-d073ee-31-220-108-27.traefik.me`) - traefik.http.routers.a-beszel-a95pzl-715-web.entrypoints=web - traefik.http.services.a-beszel-a95pzl-715-web.loadbalancer.server.port=8090 - traefik.http.routers.a-beszel-a95pzl-715-web.service=a-beszel-a95pzl-715-web - traefik.enable=true
volumes:
beszel_data: {}
networks:
a-beszel-a95pzl:
name: a-beszel-a95pzl
external: true
Important Notes:

If you don't add any domains through the UI and don't use Isolated Deployments, your application will be deployed exactly as you specified in your original Docker Compose file - no labels or network modifications will be added.
If you're not using Isolated Deployments, Dokploy will add the dokploy-network to the service you selected, however you need to add dokploy-network to the other services to maintain connectivity.
The Preview Compose button is useful for verifying how Dokploy will modify your compose file before deployment.
All label generation and network configuration is handled automatically by Dokploy based on your domain settings.
For detailed instructions on using Dokploy's domain management, see the Domains guide.

Method 2: Manual Configuration (Advanced)
If you prefer to configure domains manually using Traefik labels in your Docker Compose file, you can do so by following the steps below. This method gives you more control but requires manual configuration.

Manual configuration is more complex and requires editing your Docker Compose file. We recommend using Method 1 (Dokploy Domains) unless you have specific requirements that need manual Traefik label configuration.

Manual Configuration Steps
Key Steps for manual configuration:

Add the service to the dokploy-network.
Use Traefik labels to configure routing.
Example Scenario
Let's consider an application with three components: a frontend, a backend, and a database. We'll start with a basic Docker Compose file and then enhance it with manual domain configuration.

version: "3.8"
services:
frontend:
build:
context: ./frontend
dockerfile: Dockerfile
volumes: - ./frontend:/app
ports: - "3000:3000"
depends_on: - backend
backend:
build:
context: ./backend
dockerfile: Dockerfile
volumes: - ./backend:/app
ports: - "5000:5000"
environment: - DATABASE_URL=postgres://postgres:password@database:5432/mydatabase
depends_on: - database
database:
image: postgres:13
environment:
POSTGRES_USER: postgres
POSTGRES_PASSWORD: password
POSTGRES_DB: mydatabase
volumes: - db-data:/var/lib/postgresql/data
volumes:
db-data:
Step 1: Add the Network
First, we'll add the dokploy-network to our services:

Tip: If you prefer to isolate all services and avoid adding them to the dokploy-network, you can use the Isolated Deployments feature. This feature isolates all services and eliminates the need to manually add them to the dokploy-network. See the Isolated Deployments guide for more information.

version: "3.8"
services:
frontend: # ... (previous configuration)
networks: - dokploy-network
backend: # ... (previous configuration)
networks: - dokploy-network
database: # ... (previous configuration)
networks: - dokploy-network
volumes:
db-data:
networks:
dokploy-network:
external: true
Step 2: Configuring Traefik Labels
Now, let's add Traefik labels to route domains to our services. We'll focus on the frontend and backend services:

Important for Docker Stack: If you're using Docker Stack (Docker Swarm mode), the Traefik labels must be placed in the deploy.labels section instead of directly in the labels section. See the Docker Stack example below.

version: "3.8"
services:
frontend:
build:
context: ./frontend
dockerfile: Dockerfile
volumes: - ./frontend:/app
expose: - 3000
depends_on: - backend
networks: - dokploy-network
labels: - traefik.enable=true - traefik.http.routers.frontend-app.rule=Host(`frontend.dokploy.com`) - traefik.http.routers.frontend-app.entrypoints=web - traefik.http.services.frontend-app.loadbalancer.server.port=3000
backend:
build:
context: ./backend
dockerfile: Dockerfile
volumes: - ./backend:/app
expose: - 5000
environment: - DATABASE_URL=postgres://postgres:password@database:5432/mydatabase
depends_on: - database
networks: - dokploy-network
labels: - traefik.enable=true - traefik.http.routers.backend-app.rule=Host(`backend.dokploy.com`) - traefik.http.routers.backend-app.entrypoints=web - traefik.http.services.backend-app.loadbalancer.server.port=5000
database: # ... (same as before)
volumes:
db-data:
networks:
dokploy-network:
external: true
Understanding Traefik Labels
traefik.enable=true Enables Traefik routing for the service.
traefik.http.routers.<UNIQUE-RULE>.rule=Host('your-domain.dokploy.com') Specifies the domain for the service
traefik.http.routers.<UNIQUE-RULE>.entrypoints=web Sets the service to be accessible via HTTP.
traefik.http.services.<UNIQUE-RULE>.loadbalancer.server.port=3000 Specifies the port your service is using internally.
Note: Replace <UNIQUE-RULE> with a unique identifier for each service (e.g., frontend-app, backend-app, etc.).

Docker Stack Configuration
When using Docker Stack (Docker Swarm mode), labels must be placed under the deploy.labels section. Additionally, Docker Stack does not support the build directive, so you must use pre-built images from a registry:

Important: Docker Stack does not support the build directive. You must build your images separately and push them to a Docker registry, then reference them using the image: directive.

version: "3.8"
services:
frontend:
image: your-registry.com/frontend:latest # Pre-built image from registry
volumes: - ./frontend:/app
expose: - 3000
networks: - dokploy-network
deploy:
labels: - traefik.enable=true - traefik.http.routers.frontend-app.rule=Host(`frontend.dokploy.com`) - traefik.http.routers.frontend-app.entrypoints=web - traefik.http.services.frontend-app.loadbalancer.server.port=3000
backend:
image: your-registry.com/backend:latest # Pre-built image from registry
volumes: - ./backend:/app
expose: - 5000
networks: - dokploy-network
deploy:
labels: - traefik.enable=true - traefik.http.routers.backend-app.rule=Host(`backend.dokploy.com`) - traefik.http.routers.backend-app.entrypoints=web - traefik.http.services.backend-app.loadbalancer.server.port=5000
networks:
dokploy-network:
external: true
The key differences for Docker Stack are:

Labels must be nested under deploy.labels (not directly under labels)
You must use image: with a pre-built image from a registry (Docker Stack does not support build)
Build your images separately and push them to a registry before deploying with Docker Stack
Important Considerations
Port Exposure: Use expose instead of ports to limit port access to the container network, avoiding exposure to the host machine.
DNS Configuration: Ensure you create A records pointing to your domain in your DNS Provider Settings.
HTTPS: For HTTPS, you can use Let's Encrypt or other SSL/TLS certificates.
Isolated Deployments: As an alternative to manually adding services to dokploy-network, you can use the Isolated Deployments feature, which automatically isolates all services and handles networking configuration for you.
Deployment
With these manual configurations in place, you're now ready to deploy your application using Docker Compose. This setup should be sufficient to get your services up and running with custom domain routing through Traefik.

Remember: For most use cases, we recommend using Method 1 (Dokploy Domains) as it's simpler and doesn't require manual Docker Compose file editing. See the Domains guide for more information.
