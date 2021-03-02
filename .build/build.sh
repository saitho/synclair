#!/bin/bash
npm --unsafe-perm=true install
npm run build
npm run pack
npm run pack:deb
