.PHONY: api worker test build clean lint

# 后端服务
api:
	go run ./cmd/api

worker:
	go run ./cmd/worker

# 测试
test:
	go test ./...

test-verbose:
	go test -v ./...

test-cover:
	go test -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

# 构建
build:
	go build -o bin/soar-api ./cmd/api
	go build -o bin/soar-worker ./cmd/worker

build-linux:
	GOOS=linux GOARCH=amd64 go build -o bin/soar-api-linux ./cmd/api
	GOOS=linux GOARCH=amd64 go build -o bin/soar-worker-linux ./cmd/worker

# 工具
lint:
	go vet ./...
	staticcheck ./...

fmt:
	go fmt ./...

tidy:
	go mod tidy

# 清理
clean:
	rm -rf bin/ tmp/ coverage.out coverage.html

# 前端
frontend-install:
	cd web/console && npm install

frontend-dev:
	cd web/console && npm run dev

frontend-build:
	cd web/console && npm run build

# Playwright 测试
playwright-install:
	cd docs/playwright && npm install && npx playwright install chromium

playwright-test:
	cd docs/playwright && npx playwright test

# Docker
docker-build:
	docker compose build

docker-up:
	docker compose up -d

docker-down:
	docker compose down

# 全部
all: build frontend-build
	@echo "Build complete"