package main

import (
	"fmt"

	"github.com/therecipe/qt/gui"
	"github.com/therecipe/qt/widgets"
)

type Status int

const (
	STATUS_ONLINE Status = iota // 0
	STATUS_AWAY = iota // 1
	STATUS_DND = iota // 2
)

var (
	StatusIcons = make(map[Status]*gui.QIcon)
)

func GetStatusIcon(status Status) *gui.QIcon {
	if val, ok := StatusIcons[status]; ok {
		return val
	}
	icon := gui.NewQIcon5(fmt.Sprintf(":/qml/icons/status-%d.ico", status))
	StatusIcons[status] = icon
	return icon
}

func NewSystray(app *widgets.QApplication) *widgets.QSystemTrayIcon {
	// todo: pull and apply initial status from config

	sys := widgets.NewQSystemTrayIcon(nil)
	sys.SetIcon(GetStatusIcon(STATUS_ONLINE))
	menu := widgets.NewQMenu(nil)

	statusOnline := menu.AddAction("Online")
	statusOnline.ConnectTriggered(func(bool) {
		sys.SetIcon(GetStatusIcon(STATUS_ONLINE))
	})

	statusAway := menu.AddAction("Away")
	statusAway.ConnectTriggered(func(bool) {
		sys.SetIcon(GetStatusIcon(STATUS_AWAY))
	})

	statusDnd := menu.AddAction("Do not disturb")
	statusDnd.ConnectTriggered(func(bool) {
		sys.SetIcon(GetStatusIcon(STATUS_DND))
	})

	menu.AddSeparator()

	settings := menu.AddAction("Settings...")
	settings.ConnectTriggered(func(bool) {
		//NewSettingsFactory(nil, "")().Show()
		NewSettingsWidget(nil).Show()
	})

	exit := menu.AddAction("Exit")
	exit.ConnectTriggered(func(bool) { app.Exit(0) })
	sys.SetContextMenu(menu)

	return sys
}
