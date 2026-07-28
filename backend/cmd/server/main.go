package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type Msg struct {
	Branch string `json:"branch"`
	Status string `json:"status"`
}

func main() {
	http.HandleFunc("/test", func(w http.ResponseWriter, r *http.Request) {
		var p Msg
		json.NewDecoder(r.Body).Decode(&p)
		fmt.Println("Branch:", p.Branch, "Status:", p.Status)
		w.Write([]byte("ok"))
	})
	http.ListenAndServe(":6767", nil)
}
