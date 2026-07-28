package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"runtime"
)

type Msg struct {
	Server string `json:"server"`
	Status string `json:"status"`
	Cpu    int    `json:"cpu"`
}

func main() {
	msg := Msg{
		Server: "testServer",
		Status: "success",
		Cpu:    runtime.NumCPU(),
	}
	jsonData, err := json.Marshal(msg)
	if err != nil {
		panic(err)
	}
	resp, err := http.Post("http://localhost:6767/test", "application/json",
		bytes.NewReader(jsonData))
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		panic("Request failed with status: " + resp.Status)
	}
}
