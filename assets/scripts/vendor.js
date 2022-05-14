const usrInput = document.getElementById('input-number');
const mineIDField = document.getElementById('mine-id');
const mineScanRangeField = document.getElementById('scan-range');
const reinforcementTimeField = document.getElementById('reinforcement-time');
var minesList = document.getElementById("mines-available");
const addBtn = document.getElementById('btn-add');
const subtractBtn = document.getElementById('btn-subtract');
const multiplyBtn = document.getElementById('btn-multiply');
const divideBtn = document.getElementById('btn-divide');

const currentResultOutput = document.getElementById('current-result');
const currentCalculationOutput = document.getElementById('current-calculation');

function outputResult(result, text) {
  currentResultOutput.textContent = result;
  currentCalculationOutput.textContent = text;
}
