# Contributing

## Development

### Requirements

* Python 3
* NodeJS
* C++ compiler (Ubuntu: e.g. `apt install g++`)
* CMake (Ubuntu: `apt install cmake`)
* GL (Ubuntu: `apt install libgl1-mesa-dev`)

### Run application

```
npm run start
```


### Build distributable

```
docker run --rm -v `pwd`:/w -w /w saitho/buildenv:debian-nodegui ./.build/build.sh
```

This builds a `synclair.deb` file.
