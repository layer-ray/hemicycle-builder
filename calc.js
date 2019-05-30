import {polarToCartesian, toRadians} from './helpers';

function setPoints(n, containerData, gap=0, base=0) {
    let cartesianEndPoints;
    let pointArr = [];
    let point;
    // create points (translating from polar coords to cartesian) and 
    // for each subsequent point add spread (the section angular 
    // dimension) and, if set, gap (the angular dimension of the space 
    // left empty between two sections)
    for(let i=0;i<n;i++){
        cartesianEndPoints = polarToCartesian(containerData.length, base);
        point = setPoint(cartesianEndPoints.x, cartesianEndPoints.y, containerData.origin);
        pointArr.push(point);
        base += containerData.angle;
        
        if(gap > 0) {
            cartesianEndPoints = polarToCartesian(containerData.length, base);
            point = setPoint(cartesianEndPoints.x, cartesianEndPoints.y, containerData.origin);
            pointArr.push(point);
            base += gap;
        };

    };

    return pointArr;
};

function setPoint(cx, cy, origin){
    return {x: origin.x + cx, y: origin.y - cy}
}

// count number of circles (chord = diameter) lying on an arc
export function countCirclesOnArc(circleRadius, arcRadius, arcAngle, degree=true) {
    const angle = degree ? toRadians(arcAngle) : arcAngle;
    // chordLength = 2 * arcRadius * Math.sin(radians(angle)/2);
    
    // The chord we suppose to have the length of is equal to the diameter of the circle; since it will be
    // divided by 2 to fit the equation we use its radius as is
    const oneCircleArcAngle = 2 * Math.asin(circleRadius/arcRadius);
    const totalCircles = Math.round(angle / oneCircleArcAngle); // approx.
    return {single: oneCircleArcAngle, total: totalCircles};
};

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
export function coordsGenerator (radiusArr, circleRadius, arcAngle, base=0, nDrawn=-1) {
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

export function calculateSectionPoints(sectionData, patternOptions){
    let containerData = {
        origin: {
            x: sectionData.origin.x,
            y: sectionData.origin.y
        },
        length: sectionData.r1,
        angle: sectionData.angle
    };    

    // get the section vertex coordinates, using min and max radius
    let lowerPoints = setPoints(patternOptions.n, containerData, patternOptions.gapAngle, patternOptions.startAngle);

    containerData.length = sectionData.r2;

    let upperPoints = setPoints(patternOptions.n, containerData, patternOptions.gapAngle, patternOptions.startAngle);

    // different number of vertex between inner and outer means trouble
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

    return sectionPoints;
};

export function calculateFillerDots(sectionData, fillerData, patternOptions){
    let stripe = (sectionData.r2 - sectionData.r1)/fillerData.rows;
    let radArr = [];
    // prepares array with the radii dimension
    for(let i=0; i<fillerData.rows; i++){
        radArr.push(sectionData.r1 + stripe*i);
    };
    let tot = 0;
    let sectionsMepCoords = [];
    for(let s=0;s<patternOptions.n;s++){
        // this is the base angular value the dots begin to be drawn
        let base = (sectionData.angle + patternOptions.gapAngle)*s + patternOptions.startAngle;

        let mepCoords = coordsGenerator(radArr, fillerData.dotRadius, sectionData.angle, base,s+1);
        
        tot += mepCoords.length;
        sectionsMepCoords.push(mepCoords);
    };
    return {sectionsMepCoords, total: tot};
};