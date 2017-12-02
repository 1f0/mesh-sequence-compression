# Project: sim-zip

## Script Calling Tree
+ index.html -> main.js
+ main.js -> decompress.js
+ debug_test.js <- decompress.js:output_info function
+ debug_test.js <- mesh_lib.js:output_info function
+ main.js -> construct viewer
+ decompress.js viewer call jym_add_model

## Useful Website
Many Example: x3dom.org/x3dom/exmaple

## distortion report
origin: v -6.537736 13.503677 28.752518
after: v -6.53272 13.5135 28.808

## Trial Actually
+ 4225 vertices * 15bit * 3
+ 8192 faceties * 2byte * 3
+ sum: 74502 ~ 74K
+ ctm: 11K
+ p3d: 5.5K (10bit quant)

## TODO
+ now half-edge mesh's vertex are tag using BFS, which used to be DFS, reflect on it
