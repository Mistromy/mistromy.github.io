package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"

	"github.com/coder/websocket"
	"github.com/coder/websocket/wsjson"
)

type ServerMsg struct {
	Server string `json:"server"`
	Status string `json:"status"`
	Cpu    int    `json:"cpu"`
	Uptime uint64 `json:"stats"`
}

type NirupamaMsg struct {
	Messages    int     `json:"messages_tracked"`
	Servers     int     `json:"guild_count"`
	Members     int     `json:"user_count"`
	Uptime      float32 `json:"uptime"`
	Epoch_MS    int64   `json:"epoch_ms"`           // per-message — updates constantly, drives latency
	HeartbeatMS int64   `json:"heartbeat_epoch_ms"` // periodic "phone home" — drives online/offline
}

const port = ":6767"

var (
	mu     sync.Mutex
	latest NirupamaMsg
)

// the list of everyone currently connected to the public websocket,
// and the function that sends a copy of an update to all of them.
type Hub struct {
	mu      sync.Mutex
	clients map[*websocket.Conn]struct{}
}

func newHub() *Hub {
	return &Hub{clients: make(map[*websocket.Conn]struct{})}
}

func (h *Hub) add(c *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[c] = struct{}{}
}

func (h *Hub) remove(c *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.clients, c)
}

func (h *Hub) broadcast(msg NirupamaMsg) {
	h.mu.Lock()
	defer h.mu.Unlock()
	for c := range h.clients {
		go wsjson.Write(context.Background(), c, msg)
	}
}

func withCORS(h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "https://mista.tech")
		h(w, r)
	}
}

func main() {
	fmt.Println("Server is running on port " + port + "...")

	hub := newHub()

	http.HandleFunc("/api/nirupama", withCORS(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		mu.Lock()
		snapshot := latest
		mu.Unlock()
		json.NewEncoder(w).Encode(snapshot)
	}))

	http.HandleFunc("/api/nirupama/live", withCORS(func(w http.ResponseWriter, r *http.Request) {
		conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{
			InsecureSkipVerify: true,
		})
		if err != nil {
			return
		}
		defer conn.CloseNow()

		hub.add(conn)
		defer hub.remove(conn)

		mu.Lock()
		snapshot := latest
		mu.Unlock()
		wsjson.Write(r.Context(), conn, snapshot) // send what we already know, right away

		for { // this connection isn't sending anything — just watch for it closing
			if _, _, err := conn.Read(r.Context()); err != nil {
				return
			}
		}
	}))

	http.HandleFunc("/nirupama/live", func(w http.ResponseWriter, r *http.Request) {
		conn, err := websocket.Accept(w, r, nil)
		if err != nil {
			return
		}
		defer conn.CloseNow()

		for {
			var p NirupamaMsg
			if err := wsjson.Read(r.Context(), conn, &p); err != nil {
				return
			}
			mu.Lock()
			latest.Messages = p.Messages
			if p.Epoch_MS > 0 {
				latest.Epoch_MS = p.Epoch_MS
			}
			if p.HeartbeatMS > 0 {
				latest.HeartbeatMS = p.HeartbeatMS
			}
			if p.Servers > 0 {
				latest.Servers = p.Servers
			}
			if p.Members > 0 {
				latest.Members = p.Members
			}
			if p.Uptime > 0 {
				latest.Uptime = p.Uptime
			}
			snapshot := latest
			mu.Unlock()
			fmt.Println("updated:", snapshot)

			hub.broadcast(snapshot) // send the full snapshot to every connected client
		}
	})
	http.ListenAndServe(port, nil)
}
