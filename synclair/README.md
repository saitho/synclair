## System Requirements

* Install Qt 5.15.2 with "Desktop gcc"
  * Offline installer: https://www.qt.io/download-qt-installer
  * Select the "Qt 5.15.2" version and make sure to download all packages inside that version
* Remove unused features from QT
  ```
  cd ~/Qt/5.15.2/Src
  ./configure -release -confirm-license -opensource -optimize-size -skip qtconnectivity -skip qtgamepad -skip qtmultimedia -skip qtwayland -skip qtmqtt -skip qtcoap -skip qt3d -skip qtcharts -skip qtimageformats -skip qtvirtualkeyboard -skip qtserialport -skip qtandroidextras -skip qtlocation -skip qtwayland -skip qtsensors -skip qtspeech -skip qtwebchannel
  make
  sudo make install
  ```
* Set up the QT binding for Go (see https://github.com/therecipe/qt#default-version)
  ```
  export QT_VERSION=5.15.2
  go get -v -tags=no_env github.com/therecipe/qt/cmd/...
  $GOPATH/bin/qtsetup
  ```

## Running

```
export QT_VERSION=5.15.2
qtrcc && go run .
```

## Building

```
export QT_VERSION=5.15.2
qtdeploy build desktop
```

### Windows

```
docker pull therecipe/qt:windows_32_shared

export QT_VERSION=5.15.2
qtdeploy -docker build windows_32_shared
```

### macOS

```
cd $(go env GOPATH)/src/github.com/therecipe/qt/internal/vagrant/darwin && vagrant up darwin

export QT_VERSION=5.15.2
qtdeploy -vagrant build darwin/darwin
```
