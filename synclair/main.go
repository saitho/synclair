package main

import (
	"fmt"
	"github.com/therecipe/qt/core"
	"github.com/therecipe/qt/gui"
	"github.com/therecipe/qt/widgets"
)

func main() {
	core.QCoreApplication_SetAttribute(core.Qt__AA_EnableHighDpiScaling, true)
	//gui.NewQGuiApplication(len(os.Args), os.Args)
	//var app = qml.NewQQmlApplicationEngine(nil)
	//app.Load(core.NewQUrl3("qrc:/qml/material.qml", 0))
	//gui.QGuiApplication_Exec()
	//return

	app := widgets.NewQApplication(0, nil)
	app.SetQuitOnLastWindowClosed(false)
	app.SetWindowIcon(gui.NewQIcon5(fmt.Sprintf(":/qml/icons/app.ico")))

	// Systray
	sys := NewSystray(app)
	sys.Show()

	widgets.QApplication_Exec()
}
