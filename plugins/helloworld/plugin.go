package helloworld

import (
	"fmt"
)

type App struct{}

func (a *App) Execute(action string, args map[string]interface{}, context map[string]interface{}) (map[string]interface{}, error) {
	name := "World"
	if v, ok := args["name"]; ok {
		if s, ok := v.(string); ok {
			name = s
		}
	}
	return map[string]interface{}{
		"result": fmt.Sprintf("Hello %s", name),
	}, nil
}