# Include .env
include .env.docker

# Docker Commands
up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f mssql

# Wait until MSSQL healthy
wait-db:
	@echo "Waiting for MSSQL to be ready..."
	@powershell -Command "while ((docker inspect --format='{{.State.Health.Status}}' mssql_db) -ne 'healthy') { Start-Sleep -Seconds 3 }"

# Create Database (pakai mssql-tools container)
create-db:
	MSYS_NO_PATHCONV=1 docker run --rm \
		--network nest-employee-mssql_app_net \
		mcr.microsoft.com/mssql-tools \
		/opt/mssql-tools/bin/sqlcmd \
		-S mssql -U $(DB_USER) -P '$(DB_PASSWORD)' \
		-Q "IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '$(DB_NAME)') CREATE DATABASE [$(DB_NAME)]"

# Drizzle Commands
generate:
	npx drizzle-kit generate

migrate:
	npx drizzle-kit migrate

studio:
	npx drizzle-kit studio

# Clean start
reset-db:
	docker-compose down -v
	docker-compose up -d
	@make wait-db
	@make create-db
	npx drizzle-kit generate
	npx drizzle-kit migrate

# Initial setup
setup:
	@make up
	@make wait-db
	@make create-db
	@make generate
	@make migrate
	@echo "✅ MSSQL ready & migrations applied!"

dev:
	pnpm start:dev