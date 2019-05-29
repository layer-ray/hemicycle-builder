let body = document.getElementsByTagName('body')[0];

// Hemicycle variables
let minRadiusInput = document.getElementById('min-radius');
let maxRadiusInput = document.getElementById('max-radius');
let numSectionsInput = document.getElementById('num-sections');
let sectionSizeInput = document.getElementById('section-size');
let gapSectionSizeInput = document.getElementById('gap-section');
let startInclineInput = document.getElementById('start-incline');

// viewport variables
let widthInput = document.getElementById('width');
let heightInput = document.getElementById('height');

// content variables
let rowsInput = document.getElementById('rows');
let mepRadInput = document.getElementById('dot-radius');

// ux variables
let notification = document.getElementById('notification');
let innerLabel = document.getElementById('inner-label');
let innerOptions = document.getElementById('inner-options');
let sectionBordersCheck = document.getElementById('section-borders');
let fillerDotsCheck = document.getElementById('filler-dots');
let totTitle = document.getElementById('tot');

// initial state
let center = [400, 280];
let min_radius = 70;
let max_radius = 250;
let gapRad = max_radius - min_radius;
let angleSize = 42;
let numSections = 5;
let gapLines = 1;
let startIncline = -17;

// assign initial state to input elements
minRadiusInput.value = min_radius;
maxRadiusInput.value = max_radius;
sectionSizeInput.value = angleSize;
numSectionsInput.value =  numSections;
gapSectionSizeInput.value = gapLines;
startInclineInput.value = startIncline;

widthInput.value = center[0] * 2;
heightInput.value = center[1] * 2;

// create additional nodes: svg and main (to append ui elements)
let containerDiv = document.createElement('main');
let root = document.createElementNS("http://www.w3.org/2000/svg", "svg");

// dynamically set attributes of newly generated element
containerDiv.style.width = (center[0]*2) + 'px';
containerDiv.style.height = (center[1]*2) + 'px';
containerDiv.setAttribute('id', 'svg-container');

root.setAttribute('width', center[0]*2);
root.setAttribute('height', center[1]*2);
root.setAttribute('class', 'svg-root');

// append ui element and svg to container
containerDiv.appendChild(innerLabel);
containerDiv.appendChild(innerOptions);
containerDiv.appendChild(root);
// append container to body
body.appendChild(containerDiv);

// global variables to control whether object needs to be
// redrawn or not
let dotMissing = false;
let pathMissing = false;

drawHemicycle();

function drawHemicycle(){ 
    // validation - if error restore previous values
    if(+widthInput.value/2 <= max_radius ||  +heightInput.value/2 <= max_radius){
        widthInput.value =  center[0] * 2;
        heightInput.value = center[1] * 2;
        throw Error('Max dimension reached. Please increase the size of viewport to create bigger hemicycles');
    };

    if(+maxRadiusInput.value > Math.min(...center) ){
        maxRadiusInput.value = max_radius;
        throw Error('Max dimension reached. Please increase the size of viewport to create bigger hemicycles');
    };

    if(+minRadiusInput.value + 10 > +maxRadiusInput.value){
        minRadiusInput.value = min_radius;
        maxRadiusInput.value = max_radius;
        throw Error('Min radius too close to max radius');
    };

    if((+gapSectionSizeInput.value + +sectionSizeInput.value) * +numSectionsInput.value >= 360){
        sectionSizeInput.value = angleSize;
        numSectionsInput.value =  numSections;
        gapSectionSizeInput.value = gapLines;
        throw Error('Whole circle reached');
    };
    
    // values are valids, so they are assigned to the variables
    center[0] = +widthInput.value/2;
    center[1] = +heightInput.value/2;
    root.setAttribute('width', +widthInput.value);
    root.setAttribute('height',  +heightInput.value);
    
    containerDiv.style.width = widthInput.value + 'px';
    containerDiv.style.height =  heightInput.value + 'px';

    min_radius = +minRadiusInput.value;
    max_radius = +maxRadiusInput.value;
    gapRad = +maxRadiusInput.value - +minRadiusInput.value;
    angleSize = +sectionSizeInput.value;
    numSections = +numSectionsInput.value;
    gapLines = +gapSectionSizeInput.value;
    startIncline= +startInclineInput.value;

    cleanSvg(root);
    // get the section vertex coordinates, using min and max radius
    let lowerPoints = setPoints(numSections, min_radius, angleSize, gapLines, startIncline);
    let upperPoints = setPoints(numSections, max_radius, angleSize, gapLines, startIncline);

    // different number of vertex among inner and outer means trouble
    if(lowerPoints.length !== upperPoints.length) {
        throw Error('Something went wrong');
    };

    let sectionPoints = [];

    // sectionPoints arr is build taking 2 points from lower radius
    // and two from the upper. Those will be joined and used as 
    // vertexes to build the path
    for(let i=0;i<lowerPoints.length; i+=2){
        let lowSecPoints = [ lowerPoints[i], lowerPoints[i+1] ];
        let upSecPoints = [ upperPoints[i], upperPoints[i+1] ];
        sectionPoints.push(lowSecPoints.concat(upSecPoints));
    };

    // ux check(there could be a checked option and no draw)
    if(sectionBordersCheck.checked) {
        pathMissing = false;
        for(let section of sectionPoints){
            // draw section borders
            drawPath(section);
        };
    } else {
        pathMissing = true;
    };

    if(fillerDotsCheck.checked) {
        dotMissing = false;
        // draw points
        populateHemicycle();
    } else {
        dotMissing = true;
    };
}

function populateHemicycle(){
    let rows = rowsInput.value;
    let mepRad = mepRadInput.value;
    let stripe = (max_radius - min_radius)/rows;
    let radArr = [];
    // prepares array with the radii dimension
    for(let i=1; i<rows; i++){
        radArr.push(min_radius + stripe*i);
    };
    let tot = 0;

    for(let s=0;s<numSections;s++){
        // this is the base angular value the dots begin to be drawn
        let base = (angleSize + gapLines)*s + startIncline;

        /*  coordsGen takes 5 par:
            - radArr: length array. It contains all the arcs radii that 
                        will be filled with circles
            - mepRad: the size of a single circle
            - angleSize: section dimension (the arc size)
            - base: see above comment
            - s+1: a optional parameter used to track the position of dots
                    through different sections

            returns an array of objects with polar coords and draw order
         */
        let mepCoords = coordsGenerator(radArr, mepRad, angleSize, base,s+1);
        // store total number of points(coordinates) returned
        tot += mepCoords.length;
        mepCoords.forEach(dot => {
            // each point have its coords translated to cartesian and
            // drawn in user coords system
            let pt = polarToCartesian(dot.radius,toDegree(dot.angle));
            drawPoint( pt.x, pt.y, mepRad, undefined, dot.pos);
        });
    };
    let pts = document.querySelectorAll('#svg-container .dot');
    pts.forEach(pt => {
        pt.addEventListener('mouseover', displayNotification);
         pt.addEventListener('mouseout', removeNotification)
    });
    totTitle.innerText = tot;
}

function displayNotification(e){
    let x = parseFloat(this.getAttribute('cx'));
    let y = parseFloat(this.getAttribute('cy'));
    let pos = this.getAttribute('data-attr');
    // position the box bottom-right of cursor
    notification.style.top =  (y + 10) + 'px';
    notification.style.left =  (x + 20)  + 'px';
    notification.innerText = `pos: ${pos}`;
    notification.classList.add('fadeIn');
}

function removeNotification(e){
    notification.classList.remove('fadeIn');
}

function drawCircle(radius, fill='none', stroke="none"){
    let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");

    circle.setAttribute('cx', center[0]);
    circle.setAttribute('cy', center[1]);
    circle.setAttribute('r', radius);
    circle.setAttribute('stroke', stroke);
    circle.setAttribute('fill', fill);

    root.appendChild(circle);
};

function setPoints(n, radius, spread, gap=0, base=0) {
    let cartesianEndPoints;
    let pointArr = [];
    let point;
    // create points (translating from polar coords to cartesian) and 
    // for each subsequent point add spread (the section angular 
    // dimension) and, if set, gap (the angular dimension of the space 
    // left empty between two sections)
    for(let i=0;i<n;i++){
        cartesianEndPoints = polarToCartesian(radius, base);
        point = setPoint(cartesianEndPoints.x, cartesianEndPoints.y);
        pointArr.push(point);
        base += spread;
        
        if(gap > 0) {
            cartesianEndPoints = polarToCartesian(radius, base);
            point = setPoint(cartesianEndPoints.x, cartesianEndPoints.y);
            pointArr.push(point);
            base += gap;
        };

    };

    return pointArr;
};

function setPoint(cx, cy){
    return {x: center[0] + cx, y: center[1] - cy}
}

function drawPoint(cx, cy, rad, col="#222", data){
    let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");

    circle.setAttribute('cx', center[0] + cx);
    circle.setAttribute('cy', center[1] - cy);
    circle.setAttribute('r', rad);
    circle.setAttribute('fill', col);
    circle.setAttribute('class', 'dot');
    if(data){
        circle.setAttribute('data-attr', data);
    }

    root.appendChild(circle);

    return {x: center[0] + cx, y: center[1] - cy}
}

function drawPath(points){
    let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    let pathVals = "";
    pathVals += `M${points[0].x} ${points[0].y} `;
    pathVals += `A ${min_radius} ${min_radius} 0 0 0 ${points[1].x} ${points[1].y} `;
    pathVals += `L${points[3].x} ${points[3].y} `;
    pathVals += `A ${max_radius} ${max_radius} 1 0 1 ${points[2].x} ${points[2].y} `;
    pathVals += `L${points[0].x} ${points[0].y} `;

    path.setAttribute('d', pathVals);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#222');

    root.appendChild(path);
}

// count number of circles (chord = diameter) lying on an arc
function countCirclesOnArc(circleRadius, arcRadius, arcAngle, degree=true) {
    const angle = degree ? toRadians(arcAngle) : arcAngle;
    // chordLength = 2 * arcRadius * Math.sin(radians(angle)/2);
    
    // The chord we suppose to have the length of is equal to the diameter of the circle; since it will be
    // divided by 2 to fit the equation we use its radius as is
    const oneCircleArcAngle = 2 * Math.asin(circleRadius/arcRadius);
    const totalCircles = Math.round(angle / oneCircleArcAngle); // approx.
    return {single: oneCircleArcAngle, total: totalCircles};
};

function coordsGenerator (radiusArr, circleRadius, arcAngle, base=0, nDrawn=-1) {
    const coordsArr = [];
    let MAX_ANGLE = 0;
    radiusArr.forEach((rad, i) => {
        const placementData = countCirclesOnArc(circleRadius, rad, arcAngle);
        
        // (angle needed to accomodate one circle * n circles) - angle/2
        // Last subtraction needed because the first element is centered
        // (means that half circle is not evaluated)
        MAX_ANGLE = (placementData.single * placementData.total) - (placementData.single/2);

        for(let j=1; j <= placementData.total; j++) {
            const centerAngle = j * placementData.single;
            if(centerAngle > MAX_ANGLE) return;
            
            const dot = {angle: centerAngle + toRadians(base), radius: rad, pos:[i, j]};

            if(nDrawn !== -1) dot.pos.push(nDrawn);
            coordsArr.push(dot);
        };
    });
    return coordsArr;
};

// ux functions used to make visible/hidden paths and dots
function toggleDots(){
    let dots = document.querySelectorAll('#svg-container .dot');
    innerLabel.classList.toggle('hidden');
    for(let i=0; i<dots.length; i++){
        dots[i].classList.toggle('hidden');
    };
    if(dotMissing) drawHemicycle();
};

function togglePaths(){
    let paths = document.querySelectorAll('#svg-container path');
    for(let i=0; i<paths.length; i++){
        paths[i].classList.toggle('hidden');
    }
    if(pathMissing) drawHemicycle();
}

// remove only specific elements from svg
function cleanNodes(svgNode, children){
    for(let i=0; i< children.length; i++){
        svgNode.removeChild(children[i]);
    };
};

// clean up everything on svg
function cleanSvg(svgNode){
    while(svgNode.childNodes[0]) {
        svgNode.removeChild(svgNode.childNodes[0]);
    };
};


function polarToCartesian (r, angle) {
    let x = r * Math.cos(toRadians(angle));
    let y = r * Math.sin(toRadians(angle));
    return {x, y};
};

function cartesianToPolar (x, y) {
    let r = Math.sqrt(x**2 + y**2);
    let angle = toDegree(Math.atan(y/x));
    return {r, angle};
};

function toRadians (degree) {return (degree * Math.PI)/180};
function toDegree  (radians) {return (radians * 180)/Math.PI};

// input listener allow cool dynamic change but is risky when typing
minRadiusInput.addEventListener('change', drawHemicycle);
maxRadiusInput.addEventListener('change', drawHemicycle);
numSectionsInput.addEventListener('change', drawHemicycle);
sectionSizeInput.addEventListener('change', drawHemicycle);
gapSectionSizeInput.addEventListener('change', drawHemicycle);
startInclineInput.addEventListener('change', drawHemicycle);

rowsInput.addEventListener('change', drawHemicycle);
mepRadInput.addEventListener('change', drawHemicycle);

widthInput.addEventListener('change', drawHemicycle);
heightInput.addEventListener('change', drawHemicycle);

sectionBordersCheck.addEventListener('change', togglePaths);
fillerDotsCheck.addEventListener('change', toggleDots);