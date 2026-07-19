FROM golang:1.23-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /soar-api ./cmd/api

FROM alpine:3.19
RUN apk add --no-cache tzdata ca-certificates
WORKDIR /app
COPY --from=builder /soar-api .
COPY plugins/ ./plugins/
COPY migrations/ ./migrations/

EXPOSE 8888
CMD ["./soar-api"]