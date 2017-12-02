# P3D

## Header

```
    4 int Smallest_Alpha
    4 int Smallest_Gamma
    4 unsigned Initial_file_size
    4 int NumberComponents

    for each component:
        4 float Qpas=quantization step
        4 float t_xmin
        4 float t_ymin
        4 float t_zmin

    1 char colored
    if colored == true:
    	1 boolean isOneColor
    if colored && !(boolean)isOneColor:
        4 float Color_Quantization_Step
        for [C0, C1, C2]:
        	4 float Ci_Min:smallest abs position 
    	4 int Smallest_C0, Smallest_C1, Smallest_C2
    if colored && isOneColor:
    	4 float OnlyColor[3]

    while(get &= 80){
        &7F >> file_size
    }

```

## Bits Stream
+ header and basemesh
```
    1bits isClosed for each component
    1bits isBijectionEnabled
    for each component:
        8bits int numberOperation // getMaxAsGlobalCountOperation
        4bits int Qbit            // Initial quantization bit of bufferGeometry => QBit_list
                                 // Qbit+4 => MAXQbit
        4bits int NCQ             // => NumberChangeQuantization
        3bits int color_quantization_change
    15bits int Number_basemesh_vertex
    16bits int Number_basemesh_facet

    // bufferGeometry
    for each base mesh vertex:
        MaxQBit+1 int x, y, z => change int to real
        if(colored && not oneColor)
            Ci_QUNTINZATION int ci => float L, A, B //!TODO maybe ci_q = 1bits here

    // topology
    for each facet:
        facet_index_bit_length int facet_index: 1, 2, 3

    // seed gate
    from 0 to 2*NumberComponents:
        facet_index_bit_length_bits int seedgate_id_number (named basemesh_vertex_number)
        
    if(isColored && !isOneColor) for [C0, C1, C2]:
        (Ci_QUANTIZATION + 1)bits Ci_Range -> color_i_model_alphabet
```

+ next level

```
    2bits Operation
    // un_regulartion
    // QBitLen = Qbit[componentId] + NCQ[componentId]
    QbitLen bits int alphaRange
    QbitLen bits int alphaOffset
    QbitLen bits int gammaRange
    QbitLen bits int gammaOffset
    
```

## Building Half Edge
+ go through facet
  - conquer every half edge of this facet: prev_edge, next_edge, ...


## Exist Problem
+ Distortion
  - todo: test obj read in precision and find out whether Qbits counts
+ Web file stream implementation
+ Compare with other method
+ redundant code remove


## Caution
+ QPas => Quantization_step[i], QPas*2^NCQ = step
+ NCQ => NumberChangeQuantization is a list
+ Qbit//QBit_list, Maxbit bufferGeometry coordinate bits length

+ Max_Qbit, Qbit_list[i] and NCQ[i] now is messy
+ if no manifold provided, many problem comes

## External Data Structure
+ Vertex
  - Seed_Edge = OTHER_COORD, sgId
  - Component_Number = -1, and then set to compoent_number
  - vertexFlag = FREE, 
  - vertexSign = NOSIGN


+ Facet
  - fTag = -1, and then set to compoentNumber
  - facetFlag = FREE,
  

## Code Efficiency
+ decompress_init
  - find seed edge -> facet -> all edges
  - set **UPPER** external data structure



