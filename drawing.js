import { polarToCartesian, toDegree } from './helpers';

export function drawPoint(svgElement, cx, cy, 
                            rad, origin={x:0,y:0},
                            col="#222", data=undefined){
    let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");

    circle.setAttribute('cx', origin.x + cx);
    circle.setAttribute('cy', origin.y - cy);
    circle.setAttribute('r', rad);
    circle.setAttribute('fill', col);
    circle.setAttribute('class', 'dot');
    if(data){
        circle.setAttribute('data-attr', data);
    }

    svgElement.appendChild(circle);

    return {x: origin.x + cx, y: origin.y - cy}
}

export function drawPath(svgElement, points, r1, r2){
    let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    let pathVals = "";
    pathVals += `M${points[0].x} ${points[0].y} `;
    pathVals += `A ${r1} ${r1} 0 0 0 ${points[1].x} ${points[1].y} `;
    pathVals += `L${points[3].x} ${points[3].y} `;
    pathVals += `A ${r2} ${r2} 1 0 1 ${points[2].x} ${points[2].y} `;
    pathVals += `L${points[0].x} ${points[0].y} `;

    path.setAttribute('d', pathVals);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#222');

    svgElement.appendChild(path);
};

export function drawFillerDots(svgElement, pointCoords, dotRadius, origin){
    let pointArr = [];
    pointCoords.forEach(dot => {
        // each point have its coords translated to cartesian and
        // drawn in user coords system
        // center is moved up, otherwise it will be 
        // drawn on the perimeter (dot must be inside).
        // Is moved up by a factor of 3/2 to have it inside plus a 
        // minimum padding
        let pt = polarToCartesian((dot.radius + (dotRadius *3/2)),toDegree(dot.angle));
        let drawnPoint = drawPoint(svgElement, pt.x, pt.y, dotRadius,
                    {x:origin.x, y:origin.y}, 
                    undefined, dot.pos);
        pointArr.push(drawnPoint);
    });
    return pointArr;
}