package main

import (
	"fmt"
	"github.com/therecipe/qt/gui"
	"github.com/therecipe/qt/widgets"
	"strings"

	"github.com/saitho/synclair/platforms/zoom"
	"github.com/saitho/synclair/qt"
)

func NewSettingsFactory(parent *widgets.QWidget, platformName string) func() *widgets.QMainWindow {
	return func() *widgets.QMainWindow {
		win := widgets.NewQMainWindow(parent, 0)
		win.SetFixedWidth(400)
		win.SetFixedHeight(300)
		win.SetCentralWidget(nil)

		switch strings.ToLower(platformName) {
			case "zoom":
				win.SetCentralWidget(zoom.NewSettingsWidget(parent))
			default:
				win.SetCentralWidget(NewSettingsWidget(parent))
		}
		win.SetWindowTitle(fmt.Sprintf("%s settings", strings.Title(platformName)))


		if win.CentralWidget() == nil {
			return nil
		}

		return win
	}
}

func NewPlatformSettingsButton(parent *widgets.QWidget, platformName string, iconName string) *widgets.QPushButton {
	button := widgets.NewQPushButton2(platformName, parent)
	if len(iconName) > 0 {
		button.SetIcon(gui.NewQIcon5(fmt.Sprintf(":/qml/platforms/%s", iconName)))
	}
	button.ConnectClicked(func(bool) {
		settingsWindow := NewSettingsFactory(parent, platformName)()
		if settingsWindow != nil {
			settingsWindow.Show()
		}
	})
	return button
}

func NewSettingsWidget(parent *widgets.QWidget) *widgets.QWidget {
	formWidget := qt.NewWidgetFromFile(":/qml/settings.ui", parent)

	// Todo: evaluate config file and set values in form

	comboBoxStatus := widgets.NewQComboBoxFromPointer(qt.FindChildPtr(formWidget, "comboBoxStatus"))
	comboBoxStatus.AddItems([]string{"Online", "Away", "Do not disturb"})

	horizontalLayoutPlatforms := widgets.NewQHBoxLayoutFromPointer(qt.FindChildPtr(formWidget, "horizontalLayoutPlatforms"))

	// Platform buttons
	horizontalLayoutPlatforms.AddWidget(NewPlatformSettingsButton(formWidget, "Zoom", "zoom-icon.png"), 0, 0)
	horizontalLayoutPlatforms.AddWidget(NewPlatformSettingsButton(formWidget, "Mattermost", "mattermost-icon.png"), 0, 0)

	checkBoxUpdateStatusAfterLaunch := widgets.NewQCheckBoxFromPointer(qt.FindChildPtr(formWidget, "checkBoxUpdateStatusAfterLaunch"))
	checkBoxUpdateStatusAfterLaunch.SetChecked(false)

	pushButtonSave := widgets.NewQPushButtonFromPointer(qt.FindChildPtr(formWidget, "pushButtonSave"))
	pushButtonSave.ConnectClicked(func (bool) {
		// todo: save config
		formWidget.Destroy(true, true)
	})

	return formWidget
}
