package storage

import (
	"context"
	"log"

	"github.com/redis/go-redis/v9"
)

var RDB *redis.Client
var Ctx = context.Background()

func InitRedis(addr, password string, db int) error {
	RDB = redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})

	_, err := RDB.Ping(Ctx).Result()
	if err != nil {
		return err
	}

	log.Println("[storage] Redis connected")
	return nil
}

func CloseRedis() {
	if RDB != nil {
		RDB.Close()
	}
}