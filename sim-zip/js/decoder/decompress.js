function Decompression(array_buffer) {
    //file informations
    this.decoder = new ArithmeticDecoder(array_buffer); //data
    this.code_bytes = 0; //data length

    //global parameters
    this.Quantization_Step_List = [];
    this.xmin_list = [];
    this.ymin_list = [];
    this.zmin_list = [];
    this.NumberComponents = 0;

    //color reletive parameters///////////////////////////////
    this.IsColored = false;
    this.IsOneColor = false;
    this.Color_Quantization_Step = 0;
    //float
    this.C0_Min = 0;
    this.C1_Min = 0;
    this.C2_Min = 0;
    //integer
    this.Smallest_C0 = 0;
    this.Smallest_C1 = 0;
    this.Smallest_C2 = 0;
    this.OnlyColor = [];
    ///< The statistical model used for color_0
    this.Color_0_Model = new AdaptiveDataModel();
    this.Color_1_Model = new AdaptiveDataModel();
    this.Color_2_Model = new AdaptiveDataModel();
    ///< The index model
    this.Index_Model = new AdaptiveDataModel();

    //mesh informations////////////////////////////////
    this.IsClosed = [];
    this.Is_Bijection_Enabled = false;
    this.Qbit_list = [];
    this.NumberChangeQuantization = [];
    this.NumberColorQuantization = [];
    this.Number_color_quantization_change = [];
    this.ComponentOperations = [];

    //mesh
    this.mesh = new HfMesh();

    //decode information///////////////////////////////////////
    this.decompress_count = 0;
    this.Smallest_Alpha = 0;
    this.Smallest_Gamma = 0;
    this.GlobalCountOperation = 0;//GlobalCountOperation==total_layer
    this.Current_level = 0;
    this.IsDecompress = false;
    this.Total_layer = 0;
}

Decompression.prototype.decodeProcess = function () {
    // get raw info and then prepare arithmetic decoder
    this.readHeader();
    this.decoder.initial(); //after this, getBits is available

    //if base mesh length reached, setTimeout()
    var t = performance.now();
    this.decodeBasemesh();
    console.log("decode basemesh at " + (performance.now() - t) + " ms");
    outputInfo("Total level", this.Total_layer);

    while (this.Current_level < this.Total_layer) {
        this.Current_level = this.decode_each_step();
    }
};

Decompression.prototype.readHeader = function () {
    var shift = 0;

    //!TODO: 2016/10/5 use file api to avoid put all in memory

    //read head informations//////////////////////
    //!TODO, 4 is size of int should be determined by the encode program in server side, use sizeof(int)
    this.Smallest_Alpha = this.decoder.bytes2integer(this.decoder.getbytes(4));
    this.Smallest_Gamma = this.decoder.bytes2integer(this.decoder.getbytes(4));
    var Initial_file_size = this.decoder.bytes2integer(this.decoder.getbytes(4));
    this.NumberComponents = this.decoder.bytes2integer(this.decoder.getbytes(4));
    if (this.NumberComponents != 1) alert("Number Component!=1, Non-manifold Mesh");

    for (var i = 0; i < this.NumberComponents; ++i) {
        //float numbers
        var Qpas = this.decoder.bytes2float(this.decoder.getbytes(4));
        var t_xmin = this.decoder.bytes2float(this.decoder.getbytes(4));
        var t_ymin = this.decoder.bytes2float(this.decoder.getbytes(4));
        var t_zmin = this.decoder.bytes2float(this.decoder.getbytes(4));

        //used for decode integer
        this.Quantization_Step_List.push(Qpas);
        this.xmin_list.push(t_xmin);
        this.ymin_list.push(t_ymin);
        this.zmin_list.push(t_zmin);
    }

    /////////////////COLOR INFORMATION/////////////////////////////////////
    var Colored = this.decoder.getc();
    this.IsOneColor = false;
    if (Colored === 1) {
        this.IsColored = true;
        var One_color = this.decoder.getc();
        if (One_color === 1)
            this.IsOneColor = true;
    } else this.IsColored = false;

    // read color information for each component
    if ((this.IsColored) && (!this.IsOneColor)) {
        this.Color_Quantization_Step = this.decoder.bytes2float(this.decoder.getbytes(4));
        // smallest absolute position of c0
        this.C0_Min = this.decoder.bytes2float(this.decoder.getbytes(4));
        this.C1_Min = this.decoder.bytes2float(this.decoder.getbytes(4));
        this.C2_Min = this.decoder.bytes2float(this.decoder.getbytes(4));
        //smallest quantized positions
        this.Smallest_C0 = this.decoder.bytes2integer(this.decoder.getbytes(4));
        this.Smallest_C1 = this.decoder.bytes2integer(this.decoder.getbytes(4));
        this.Smallest_C2 = this.decoder.bytes2integer(this.decoder.getbytes(4));
    }

    if ((this.IsColored) && (this.IsOneColor)) {
        // smallest absolute position of c0
        this.OnlyColor[0] = this.decoder.bytes2float(this.decoder.getbytes(4));
        // smallest value of c1
        this.OnlyColor[1] = this.decoder.bytes2float(this.decoder.getbytes(4));
        // smallest value of c2
        this.OnlyColor[2] = this.decoder.bytes2float(this.decoder.getbytes(4));
    }

    //!TODO remove this code_bytes computation in both encoder and decoder
    do {
        var file_byte = this.decoder.getc();
        if (file_byte === undefined) alert("error in decoder");

        var tmp = (file_byte & 0x7F) << shift;
        this.code_bytes |= tmp;
        shift += 7;
    } while (file_byte & 0x80);

    outputInfo("code_bytes", this.code_bytes);
};

Decompression.prototype.decodeBasemesh = function () {
    if (this.NumberComponents != 1) alert("decode_mesh error: non-minifold");
    var i;
    // To know if each component is colored or not, and closed or not.
    for (i = 0; i < this.NumberComponents; ++i) {
        if (this.decoder.getBits(1) === 0)
            this.IsClosed.push(true);
        else
            this.IsClosed.push(false);
    }
    this.Is_Bijection_Enabled = this.decoder.getBits(1) === 1;

    this.GlobalCountOperation = -1; //for further decode process
    var Max_Qbit = 0;
    for (i = 0; i < this.NumberComponents; ++i) {

        var Number_operation = this.decoder.getBits(8); // Number of total operations.

        this.ComponentOperations.push(Number_operation);
        if (Number_operation > this.GlobalCountOperation)
            this.GlobalCountOperation = Number_operation;

        var t_Qbit = this.decoder.getBits(4); // Initial quantization bit of geometry
        t_Qbit += 4;
        this.Qbit_list.push(t_Qbit);

        var t_NCQ = this.decoder.getBits(4); //change times of geometry quantization
        this.NumberChangeQuantization.push(t_NCQ);

        var color_quantization_change = this.decoder.getBits(3); // Number of change of color quantization
        this.NumberColorQuantization.push(color_quantization_change);

        if ((this.Qbit_list[i] >>> 0) > (Max_Qbit >>> 0))
            Max_Qbit = this.Qbit_list[i];
    }
    outputInfo("Max_Qbit", Max_Qbit);

    ////MESH INFORMAITON////////////////////////////////////////////////////////
    var Number_basemesh_vertex = this.decoder.getBits(15); // Number of vertices of base mesh
    var Number_basemesh_facet = this.decoder.getBits(16); // Number of facets of base mesh

    outputInfo("Base mesh vertices number", Number_basemesh_vertex);
    outputInfo("Base mesh facets number", Number_basemesh_facet);

    for (var i = 0; i < Number_basemesh_vertex; i++) {
        var Pt_int = new HfVertex();

        Pt_int.coord.x = this.decoder.getBits(Max_Qbit + 1); // Read geometry info
        Pt_int.coord.y = this.decoder.getBits(Max_Qbit + 1);
        Pt_int.coord.z = this.decoder.getBits(Max_Qbit + 1);

        // All vertices have quantization precision of component 0
        // That'll be corrected below.
        this.Change_Int_Real(Pt_int.coord, 0);
        this.mesh.add(this.mesh.verts, Pt_int);

        //!TODO: add color support 16/11/30 LML
        if ((this.IsColored) && (!this.IsOneColor)) {
            alert("not color support now!!");
        }
    }

    // Read connectivity information
    var Facet_index_bit = Math.ceil(Math.log((Number_basemesh_vertex + 1)) / Math.log(2));
    for (var i = 0; i < Number_basemesh_facet; ++i) {
        var v_array = [];
        v_array.push(this.decoder.getBits(Facet_index_bit));
        v_array.push(this.decoder.getBits(Facet_index_bit));
        v_array.push(this.decoder.getBits(Facet_index_bit));
        var f = new HfFace(v_array);
        this.mesh.addFacet(f);
    }

    //INITIATION FOR MESH DECOMPRESSION/////////////////////////////////////
    this.mesh.build();
    //!TODO mesh.compute_normals()

    // Seed Edges; forward
    var seedEdgeIds = [];
    for (var i = 0; i < 2 * this.NumberComponents; ++i) {
        var Vertex_number = this.decoder.getBits(Facet_index_bit);
        seedEdgeIds[Vertex_number] = i;
    }

    //backward vertex->seed_edge
    // for cube10.p3d, v0 -> c0, v3 -> c1
    var Count_detected_vertices = 0;
    for (var pVertex = 0; pVertex < this.mesh.verts.length; ++pVertex) {
        if (Count_detected_vertices < this.NumberComponents * 2) {
            if (typeof seedEdgeIds[pVertex] !== "undefined") {
                this.mesh.verts[pVertex].Seed_Edge = seedEdgeIds[pVertex];
                Count_detected_vertices++;
            }
        } else
            this.mesh.verts[pVertex].Seed_Edge = OTHER_COORDINATE;
        this.mesh.verts[pVertex].Component_Number = -1;
    }

    var Color_small_step = 0.0; //float
    if (this.IsColored) {
        alert("Color decompression is not supported now");
        throw new Error();
    }

    if ((this.IsColored) && (!this.IsOneColor)) {
        this.C0_Range = this.decoder.getBits(C0_QUANTIZATION + 1);
        this.Color_0_Model.set_alphabet(this.C0_Range);
        this.C1_Range = this.decoder.getBits(C1_QUANTIZATION + 1);
        this.Color_1_Model.set_alphabet(this.C1_Range);
        this.C2_Range = this.decoder.getBits(C2_QUANTIZATION + 1);
        this.Color_2_Model.set_alphabet(this.C2_Range);
    }
    if ((this.IsColored) && (this.IsOneColor)) {
        // for mesh.verts.length //!TODO color support
    }

    //Get number of vertices of each component and restore the real position of vertices
    for (var i = 0; i < this.mesh.faces.length; ++i) {
        if (typeof this.mesh.faces[i] === "undefined") continue;
        this.mesh.faces[i].fTag = -1;
    }

    for (var Component_number = 0; Component_number < this.NumberComponents; Component_number++) {
        //find component correspond seed edge
        var seedEdgeId = 0;
        while (typeof this.mesh.edges[seedEdgeId] === "undefined" ||
        this.mesh.edges[seedEdgeId].vert.Seed_Edge != 2 * Component_number ||
        this.mesh.edges[seedEdgeId].oppo.vert.Seed_Edge != 2 * Component_number + 1) {
            ++seedEdgeId;
        }
        //!TODO: more efficient method to find seedEdge

        var fh = this.mesh.edges[seedEdgeId].face;
        var facets = [fh]; // FIFO

        while (facets.length > 0) {
            var F = facets[0];
            facets.splice(0, 1); //pop_front
            F.fTag = Component_number;

            var pHalfedge = F.edge;

            do {
                // tag the vertex to its corresponding component number
                var vert = pHalfedge.vert;
                if (vert.Component_Number === -1) {
                    vert.Component_Number = Component_number;
                    // commented by LML, 16/12/10
                    // The correct position of vertex used to restored, actually not need
                    //!TODO add Color
                }

                var pNFacet = pHalfedge.oppo.face;
                if (typeof pNFacet !== "undefined" &&
                    pNFacet.fTag === -1) {
                    //!TODO strange push front && pop front
                    // DFS maybe change to BFS
                    //facets.splice(0, 0, pNFacet);//push front, DFS
                    facets.push(pNFacet);//BFS
                    pNFacet.fTag = Component_number;
                }

                //go to next halfedge
                pHalfedge = pHalfedge.next;
            } while (pHalfedge !== F.edge);
        }
    }
    //////////////////////////////////////////////////////////////////////////

    this.IsDecompress = true;
    this.Current_level = 0;

    this.Total_layer = this.GlobalCountOperation;
};
///////////////////////////START DECOMPRESSION/////////////////////////////////
Decompression.prototype.decode_each_step = function () {
    var t0 = performance.now();
    for (var componetId = 0; componetId < this.NumberComponents; componetId++) {
        var operation = this.decoder.getBits(2);
        var unsimpSpace = new Unsimplify();
        if (operation === 0) {
            unsimpSpace.unRegulation(this, componetId);
            unsimpSpace.unDecimation(this, componetId);
        } else if (operation === 1)
            unsimpSpace.augmentGeometry(this, componetId);
        else if (operation === 2)
            unsimpSpace.augmentColor(this, componetId);
        else console.log("error op layer" + this.decompress_count);
    }
    //!TODO: _pMesh.compute_normals();

    this.decompress_count++;
    t0 = performance.now() - t0;
    console.log("extract lv_" + this.decompress_count + " in " + t0 + "ms");
    return this.decompress_count;
};

Decompression.prototype.Change_Int_Real = function (Point, Component_ID) {
    var Q_step = 0;

    // If the quantization resolution is decreased, 
    // we increase the step of quantization by a power of two.
    if (this.NumberChangeQuantization[Component_ID] === 0) //Number Change Quantization
        Q_step = this.Quantization_Step_List[Component_ID];
    else
        Q_step = this.Quantization_Step_List[Component_ID] * Math.pow(2, this.NumberChangeQuantization[Component_ID]);

    Point.x = this.xmin_list[Component_ID] + (Point.x + 0.5) * Q_step;
    Point.y = this.ymin_list[Component_ID] + (Point.y + 0.5) * Q_step;
    Point.z = this.zmin_list[Component_ID] + (Point.z + 0.5) * Q_step;
};

// Description : Change a point coordinates in real to integer coordinates
Decompression.prototype.Change_Real_Int = function (pt, Component_ID) {
    var Quantization_step = 0.0;

    // If the quantization resolution is decreased, 
    // we increase the step of quantization by a power of two.
    if (this.NumberChangeQuantization[Component_ID] === 0) //!TODO integer
        Quantization_step = this.Quantization_Step_List[Component_ID];
    else
        Quantization_step = this.Quantization_Step_List[Component_ID] * Math.pow(2.0, this.NumberChangeQuantization[Component_ID]);

    var xmin = this.xmin_list[Component_ID];
    var ymin = this.ymin_list[Component_ID];
    var zmin = this.zmin_list[Component_ID];

    var x = pt.x;
    var y = pt.y;
    var z = pt.z;

    var Point = new THREE.Vector3();
    Point.x = Math.ceil((x - xmin) / Quantization_step) - 1;
    if (Point.x === -1)
        Point.x = 0;

    Point.y = Math.ceil((y - ymin) / Quantization_step) - 1;
    if (Point.y === -1)
        Point.y = 0;

    Point.z = Math.ceil((z - zmin) / Quantization_step) - 1;
    if (Point.z === -1)
        Point.z = 0;
    return Point;
};
