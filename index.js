import { saveAs } from 'file-saver';
import { cleanSvg } from './helpers';
import { drawPath, drawFillerDots } from './drawing';
import { calculateSectionPoints, calculateFillerDots } from './calc';
import './index.css';

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
let popup = document.getElementById('popup');
let innerLabel = document.getElementById('inner-label');
let innerOptions = document.getElementById('inner-options');
let sectionBordersCheck = document.getElementById('section-borders');
let fillerDotsCheck = document.getElementById('filler-dots');
let totTitle = document.getElementById('tot');
let notification = document.getElementById('notification');
let buttons = document.getElementById('buttons');
let exportPointsBtn = document.getElementById('export-points');
let exportBordersBtn = document.getElementById('export-borders');
let exportAllBtn = document.getElementById('export-all');

// initial state
let center = {x: 400, y:280};
let wpWidth = center.x *2;
let wpHeight = center.y *2;
let min_radius = 75;
let max_radius = 235;
let gapRad = max_radius - min_radius;
let angleSize = 42;
let numSections = 5;
let gapLines = 1;
let startIncline = -17;
let rows = 12;
let mepRad = 4;
// assign initial state to input elements
minRadiusInput.value = min_radius;
maxRadiusInput.value = max_radius;
sectionSizeInput.value = angleSize;
numSectionsInput.value =  numSections;
gapSectionSizeInput.value = gapLines;
startInclineInput.value = startIncline;

widthInput.value = wpWidth;
heightInput.value = wpHeight;

rowsInput.value = rows;
mepRadInput.value = mepRad;

// create additional nodes: svg and main (to append ui elements)
let containerDiv = document.createElement('main');
let root = document.createElementNS("http://www.w3.org/2000/svg", "svg");

// dynamically set attributes of newly generated element
containerDiv.style.width = wpWidth + 'px';
containerDiv.style.height = wpHeight + 'px';
containerDiv.setAttribute('id', 'svg-container');

root.setAttribute('width', wpWidth);
root.setAttribute('height', wpHeight);
root.setAttribute('class', 'svg-root');

// append ui element and svg to container
containerDiv.appendChild(innerLabel);
containerDiv.appendChild(innerOptions);
containerDiv.appendChild(popup);
containerDiv.appendChild(buttons);

containerDiv.appendChild(root);
// append container to body
body.appendChild(containerDiv);

// global variables to control whether object needs to be
// redrawn or not
let dotMissing = false;
let pathMissing = false;

// export variables
let toExportPoints = 'x, y\n';

drawHemicycle();

/* 
main function. It:
        - validates input
        - group data
        - remove any svg child element
        - calculates path values
        - draw paths
        - calculates dot values
        - draw dots
 */
function drawHemicycle(){
    
    validateInput();

    let sectionData = {
        origin: center,
        r1: min_radius,
        r2: max_radius,
        angle: angleSize
    };

    let patternOptions = {
        n: numSections,
        startAngle: startIncline,
        gapAngle: gapLines
    };

    let fillerData = {
        rows: rows,
        dotRadius: mepRad
    };

    cleanSvg(root);
    let sectionPoints = calculateSectionPoints(sectionData, patternOptions);
    // ux check(there could be a checked option and no draw)
    if(sectionBordersCheck.checked) {
        pathMissing = false;
        // draw section borders
        for(let section of sectionPoints){
            drawPath(root, section, min_radius, max_radius);
        };
    } else {
        pathMissing = true;
    };
    // ux check(there could be a checked option and no draw)
    if(fillerDotsCheck.checked) {
        dotMissing = false;
        let pointCoordsArr = calculateFillerDots(sectionData, fillerData, patternOptions);
        for(let d=0;d<pointCoordsArr.sectionsMepCoords.length; d++){
            let points = drawFillerDots(root, pointCoordsArr.sectionsMepCoords[d], mepRad, center);
            points.forEach(point => toExportPoints += `${point.x}, ${point.y}\n`);
        };
        totTitle.innerText = pointCoordsArr.total;
        addPopup();
    } else {
        dotMissing = true;
    };
}

function validateInput(){
 // validation - if error restore previous values
    if(+maxRadiusInput.value > Math.min(center.x, center.y) ){
        widthInput.value =  wpWidth;
        heightInput.value = wpHeight;
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

    if( (+rowsInput.value) * (+mepRadInput.value*2) > 
         +maxRadiusInput.value - +minRadiusInput.value) {
        rowsInput.value = rows;
        mepRadInput.value = mepRad;
        maxRadiusInput.value = max_radius;
        minRadiusInput.value = min_radius;
        throw Error('content is too squeezed. Please increase the height of the section or reduce the number of rows or the dot radius');
    }
    
    // values are valids, so they are assigned to the variables
    wpWidth = +widthInput.value;
    wpHeight = +heightInput.value;
    root.setAttribute('width', wpWidth);
    root.setAttribute('height',  wpHeight);
    
    containerDiv.style.width = wpWidth + 'px';
    containerDiv.style.height =  wpHeight + 'px';

    center.x = wpWidth /2;
    center.y = wpHeight/2;

    min_radius = +minRadiusInput.value;
    max_radius = +maxRadiusInput.value;
    gapRad = +maxRadiusInput.value - +minRadiusInput.value;
    angleSize = +sectionSizeInput.value;
    numSections = +numSectionsInput.value;
    gapLines = +gapSectionSizeInput.value;
    startIncline= +startInclineInput.value;
    rows = +rowsInput.value;
    mepRad = +mepRadInput.value;
}

// ux functions 
function addPopup(){
    let pts = document.querySelectorAll('#svg-container .dot');
    pts.forEach(pt => {
        pt.addEventListener('mouseover', displayPopup);
         pt.addEventListener('mouseout', removePopup)
    });
}

function displayPopup(){
    let x = parseFloat(this.getAttribute('cx'));
    let y = parseFloat(this.getAttribute('cy'));
    let pos = this.getAttribute('data-attr');
    // position the box bottom-right of cursor
    popup.style.top =  (y + 10) + 'px';
    popup.style.left =  (x + 20)  + 'px';
    popup.innerText = `pos: ${pos}`;
    popup.classList.add('fadeIn');
}

function removePopup(){
    popup.classList.remove('fadeIn');
}

function displayNotification(e){
    notification.innerText = e.message;
    notification.classList.add('slideIn');
    setTimeout(() => {
        notification.classList.remove('slideIn');
    }, 3000);
}

function toggleDots(){
    let dots = document.querySelectorAll('#svg-container .dot');
    innerLabel.classList.toggle('hidden');
    for(let i=0; i<dots.length; i++){
        dots[i].classList.toggle('hidden');
    };
    if(dotMissing) drawHemicycle();
}

function togglePaths(){
    let paths = document.querySelectorAll('#svg-container path');
    for(let i=0; i<paths.length; i++){
        paths[i].classList.toggle('hidden');
    }
    if(pathMissing) drawHemicycle();
}

function exportCsvCoords(){
    let blob = new Blob([toExportPoints], {type: "text/csv;charset=utf-8"});
    saveAs(blob, "hemicycle-dots.csv");
}

function exportSvg(e){
    let newRoot = '';
    let borders = document.querySelectorAll('.svg-root path');
    if(e.target.id === 'export-borders') {
        newRoot = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        newRoot.setAttribute('width', wpWidth);
        newRoot.setAttribute('height', wpHeight);
        borders.forEach(border => {
            let newBorder = border.cloneNode(false);
            newRoot.appendChild(newBorder)
        });
    } else if(e.target.id === 'export-all') {
        newRoot = root.cloneNode(true);
    } 
    

    // credits to defghi1977 [STACK OVERFLOW]
    let serializer = new XMLSerializer();
    let source = serializer.serializeToString(newRoot);
    // required if used as external image
    source = '<?xml version="1.0" ?>\r\n' + source;

    let url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
     
    saveAs(url, "hemicycle.svg");
}

// input event listener allow cool dynamic change but is risky
// when typing
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

exportPointsBtn.addEventListener('click', exportCsvCoords);
exportBordersBtn.addEventListener('click', exportSvg);
exportAllBtn.addEventListener('click', exportSvg);

window.addEventListener('error', displayNotification)