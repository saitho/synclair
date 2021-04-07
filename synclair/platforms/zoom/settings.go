package zoom

import (
	"github.com/therecipe/qt/widgets"

	"github.com/saitho/synclair/qt"
)

func jwtForm(parent *widgets.QTabWidget) *widgets.QWidget {
	widget := qt.NewWidgetFromFile(":/qml/login-credentials.ui", parent)

	label := widgets.NewQLabelFromPointer(qt.FindChildPtr(widget, "label"))
	label.SetEnabled(true)
	label.SetText(`Please <a href="https://marketplace.zoom.us/develop/create">create a new JWT app</a> on your personal Zoom account. Then enter the API Key and Secret below.<br/><br/>Please note that your Zoom status can only be updated every 60 seconds!`)

	labelUsername := widgets.NewQLabelFromPointer(qt.FindChildPtr(widget, "labelUsername"))
	labelUsername.SetText("JWT API Key")

	labelPassword := widgets.NewQLabelFromPointer(qt.FindChildPtr(widget, "labelPassword"))
	labelPassword.SetText("JWT API Secret")


	pushButtonSubmit := widgets.NewQPushButtonFromPointer(qt.FindChildPtr(widget, "pushButtonSubmit"))
	pushButtonSubmit.ConnectClicked(func (bool) {
		// Todo: validate and save
	})

	pushButtonAbort := widgets.NewQPushButtonFromPointer(qt.FindChildPtr(widget, "pushButtonAbort"))
	pushButtonAbort.ConnectClicked(func (bool) {
		widget.Destroy(true, true)
	})
	return widget
}

func oauthForm(parent *widgets.QTabWidget) *widgets.QWidget {
	widget := qt.NewWidgetFromFile(":/qml/login-oauth.ui", parent)

	label := widgets.NewQLabelFromPointer(qt.FindChildPtr(widget, "label"))
	label.SetEnabled(true)
	label.SetText(`Please authenticate access to your Zoom account via OAuth.`)

	labelConnectedAccount := widgets.NewQLabelFromPointer(qt.FindChildPtr(widget, "labelConnectedAccount"))
	labelConnectedAccount.SetText("Connected account: -")

	pushButtonAuthenticate := widgets.NewQPushButtonFromPointer(qt.FindChildPtr(widget, "pushButtonAuthenticate"))
	pushButtonAuthenticate.ConnectClicked(func (bool) {
		// todo: validate OAuth
	})

	pushButtonSettings := widgets.NewQPushButtonFromPointer(qt.FindChildPtr(widget, "pushButtonSettings"))
	pushButtonSettings.ConnectClicked(func (bool) {
		// todo: open OAuth2 settings
	})

	pushButtonAbort := widgets.NewQPushButtonFromPointer(qt.FindChildPtr(widget, "pushButtonAbort"))
	pushButtonAbort.ConnectClicked(func (bool) {
		widget.Destroy(true, true)
	})

	return widget
}

func NewSettingsWidget(parent *widgets.QWidget) *widgets.QTabWidget {
	tabWidget := widgets.NewQTabWidget(parent)
	tabWidget.AddTab(jwtForm(tabWidget), "JWT")
	tabWidget.AddTab(oauthForm(tabWidget), "OAuth2")
	return tabWidget
}
