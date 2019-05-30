// remove only specific elements from svg
export function cleanNodes(svgNode, children){
    for(let i=0; i< children.length; i++){
        svgNode.removeChild(children[i]);
    };
};

// clean up everything on svg
export function cleanSvg(svgNode){
    while(svgNode.childNodes[0]) {
        svgNode.removeChild(svgNode.childNodes[0]);
    };
};

export function polarToCartesian (r, angle) {
    let x = r * Math.cos(toRadians(angle));
    let y = r * Math.sin(toRadians(angle));
    return {x, y};
};

export function cartesianToPolar (x, y) {
    let r = Math.sqrt(x**2 + y**2);
    let angle = toDegree(Math.atan(y/x));
    return {r, angle};
};

export function toRadians (degree) {return (degree * Math.PI)/180};
export function toDegree  (radians) {return (radians * 180)/Math.PI};

