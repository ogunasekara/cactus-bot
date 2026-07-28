.PHONY: help build up down restart logs deploy ps

help:
	@echo "Available targets:"
	@echo "  make build    Build Docker image"
	@echo "  make up       Start bot container in background"
	@echo "  make down     Stop and remove container"
	@echo "  make restart  Restart bot container"
	@echo "  make logs     Follow bot logs"
	@echo "  make deploy   Deploy Discord slash commands"
	@echo "  make ps       Show container status"

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose restart bot

logs:
	docker compose logs -f bot

deploy:
	docker compose run --rm bot npm run deploy-commands

ps:
	docker compose ps
