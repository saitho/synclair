# Contributing

## Development

### Requirements

* Python 3
* NodeJS
* C++ compiler (Ubuntu: e.g. `apt install g++`)
* CMake (Ubuntu: `apt install cmake`)
* GL (Ubuntu: `apt install libgl1-mesa-dev`)

You may also want to try the Debian-based Docker image `saitho/buildenv:debian-nodegui` which has these requirements preinstalled.

Also make sure to install the NPM packages:

```
npm install
```

### Run application

```
npm run start
```


### Build distributable

```
docker run --rm -u `id -u`:`id -g` --privileged -v `pwd`:/w -w /w saitho/buildenv:debian-nodegui ./.build/build.sh
```

This builds a `synclair.deb` file.
