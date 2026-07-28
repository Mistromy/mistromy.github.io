package main

import (
	"net/http"
	"strings"
)

func main() {
	resp, err := http.Post("http://localhost:6767/test", "application/json",
		strings.NewReader(`{"branch":"testServer","status":"success"}`))
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
}
