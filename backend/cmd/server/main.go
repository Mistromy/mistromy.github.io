package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type Msg struct {
	Server string `json:"server"`
	Status string `json:"status"`
	Cpu    int    `json:"cpu"`
	Uptime uint64 `json:"stats"`
}

func main() {
	http.HandleFunc("/test", func(w http.ResponseWriter, r *http.Request) {
		var p Msg
		err := json.NewDecoder(r.Body).Decode(&p)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		fmt.Println("Server:", p.Server, "| Status:", p.Status, "| CPU:", p.Cpu, "| Uptime:", p.Uptime)
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})
	http.ListenAndServe(":6767", nil)
}
