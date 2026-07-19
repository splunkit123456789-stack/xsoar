package plugin

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sync"
)

// Plugin APP 插件接口
type Plugin interface {
	Execute(action string, args map[string]interface{}, context map[string]interface{}) (map[string]interface{}, error)
}

// Manifest APP 元信息
type Manifest struct {
	Identification string `json:"identification"`
	IsPublic       bool   `json:"is_public"`
	Name           string `json:"name"`
	Version        string `json:"version"`
	Description    string `json:"description"`
	Type           string `json:"type"`
	Actions        []Action `json:"action"`
	Args           map[string][]Arg `json:"args"`
}

type Action struct {
	Name string `json:"name"`
	Func string `json:"func"`
}

type Arg struct {
	Key         string   `json:"key"`
	Type        string   `json:"type"`
	Required    bool     `json:"required"`
	Default     string   `json:"default,omitempty"`
	Description string   `json:"description,omitempty"`
	Data        []string `json:"data,omitempty"`
}

// AppInfo 前端展示的 APP 信息
type AppInfo struct {
	Code        string   `json:"code"`
	Name        string   `json:"name"`
	Version     string   `json:"version"`
	Type        string   `json:"type"`
	Description string   `json:"description"`
	Icon        string   `json:"icon"`
	Status      string   `json:"status"`
	Actions     []Action `json:"actions"`
}

// Registry 插件注册表
type Registry struct {
	mu      sync.RWMutex
	plugins map[string]Plugin
	manifests map[string]*Manifest
	appsPath string
}

var (
	instance *Registry
	once     sync.Once
)

func GetRegistry() *Registry {
	once.Do(func() {
		instance = &Registry{
			plugins:   make(map[string]Plugin),
			manifests: make(map[string]*Manifest),
		}
	})
	return instance
}

func Init(appsPath string) {
	r := GetRegistry()
	r.appsPath = appsPath
	r.loadApps()
}

// loadApps 扫描 apps 目录加载 APP
func (r *Registry) loadApps() {
	entries, err := os.ReadDir(r.appsPath)
	if err != nil {
		log.Printf("[plugin] failed to read apps dir %s: %v", r.appsPath, err)
		return
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		appDir := filepath.Join(r.appsPath, entry.Name())
		manifestPath := filepath.Join(appDir, "app.json")

		data, err := os.ReadFile(manifestPath)
		if err != nil {
			log.Printf("[plugin] %s: missing app.json", entry.Name())
			continue
		}

		var manifest Manifest
		if err := json.Unmarshal(data, &manifest); err != nil {
			log.Printf("[plugin] %s: invalid app.json: %v", entry.Name(), err)
			continue
		}

		if manifest.Identification != "soar" {
			log.Printf("[plugin] %s: invalid identification: %s", entry.Name(), manifest.Identification)
			continue
		}

		// 注册内置 APP（无 Go plugin 实现）
		r.manifests[entry.Name()] = &manifest
		log.Printf("[plugin] loaded: %s (%s v%s)", manifest.Name, entry.Name(), manifest.Version)
	}

	log.Printf("[plugin] loaded %d apps", len(r.manifests))
}

// Register 注册 Go 插件实例
func (r *Registry) Register(code string, p Plugin) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.plugins[code] = p
}

// GetAppList 获取 APP 列表
func (r *Registry) GetAppList() []AppInfo {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []AppInfo
	for code, m := range r.manifests {
		iconPath := fmt.Sprintf("/app/%s/icon.png", code)
		list = append(list, AppInfo{
			Code:        code,
			Name:        m.Name,
			Version:     m.Version,
			Type:        m.Type,
			Description: m.Description,
			Icon:        iconPath,
			Status:      "enabled",
			Actions:     m.Actions,
		})
	}
	return list
}

// GetManifest 获取 APP 元信息
func (r *Registry) GetManifest(code string) *Manifest {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.manifests[code]
}

// Execute 执行 APP 动作
func (r *Registry) Execute(code, action string, args map[string]interface{}, context map[string]interface{}) (map[string]interface{}, error) {
	r.mu.RLock()
	p, exists := r.plugins[code]
	r.mu.RUnlock()

	if !exists {
		return nil, fmt.Errorf("APP_NOT_FOUND: plugin %s not registered", code)
	}

	return p.Execute(action, args, context)
}

// GetPlugin 获取插件实例
func (r *Registry) GetPlugin(code string) Plugin {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.plugins[code]
}