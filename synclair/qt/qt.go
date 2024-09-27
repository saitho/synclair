package qt

import (
	"unsafe"

	"github.com/therecipe/qt/core"
	"github.com/therecipe/qt/uitools"
	"github.com/therecipe/qt/widgets"
)

func FindChildPtr(widget *widgets.QWidget, name string) unsafe.Pointer {
	return widget.FindChild(name, core.Qt__FindChildrenRecursively).Pointer()
}

func NewWidgetFromFile(name string, parent widgets.QWidget_ITF) *widgets.QWidget {
	file := core.NewQFile2(name)
	file.Open(core.QIODevice__ReadOnly)
	defer file.Close()
	return uitools.NewQUiLoader(nil).Load(file, parent)
}
