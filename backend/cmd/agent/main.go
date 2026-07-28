package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/host"
)

type Msg struct {
	Server string `json:"server"`
	Status string `json:"status"`
	Cpu    int    `json:"cpu"`
	Uptime uint64 `json:"stats"`
}

func main() {
	cpupercent, _ := cpu.Percent(time.Second, false)
	var currentCpu int
	if len(cpupercent) > 0 {
		currentCpu = int(cpupercent[0])
	}

	info, err := host.Info()
	if err != nil {
		panic(err)
	}

	msg := Msg{
		Server: "testServer",
		Status: "success",
		Cpu:    currentCpu,
		Uptime: info.Uptime,
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
