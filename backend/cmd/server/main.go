package main

import (
	"fmt"
	"net/http"
)

func main() {
	http.HandleFunc("/test", func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("testithink")
		w.Write([]byte("ok"))
	})
	http.ListenAndServe(":6767", nil)
}
