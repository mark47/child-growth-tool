$(document).ready(function () {

	var line = null;
  var currentDate = new Date();
  var formWeight, formAge, formGender, formLength, formBirthday, formBMI;
  var json, jsonPercents, findZScore, arraySelect;
  var xTitle, yTitle, xPoint, yPoint;


/*** Math functions ***/

function calcBMI(weight, height) {
    var resultBMI = weight / (Math.pow((height / 100), 2));
    return resultBMI;
}
// calculates z-score for l,m,s
function valueToZScore(l, m, s, value) {
    if (l === 0) {
  return Math.log(value/m) / s;
    } else {
  return (Math.pow(value/m, l) - 1) / (l*s);
    }
}

/*** End - Math functions ***/

  // get data on ready - Note: farther down we get JSON charting data only after triggers
  $.getJSON('data/z-scores.json', function(data) {
      jsonPercents = data;       
    });

  function loadIndicators(gender)  {
    console.log(gender);
    if (gender == "female") {
      $.getJSON('data/whoIndicators_f.json', function(data) {
        json = data;
      });
    } else {
      $.getJSON('data/whoIndicators_m.json', function(data) {
        json = data;
      });
    }
  }

  $("body").on("click", function(){
        console.log(json);  
  })

    // Percent based on z-score
    function findPercentage(passedZ) {
      // If it's outside z-score range, return N/A
      if (passedZ > 3.5 || passedZ < -3.5) {
        return "N/A";
      }
      var closest = null;
      var percentOutput = null;
      var calcZ = Math.abs(passedZ);

      $.each(jsonPercents, function(){
          for (var i = 0; i < jsonPercents.length; i++) {
              if (closest === null || Math.abs(jsonPercents[i][0] - calcZ) < Math.abs(closest - calcZ)) {
                  closest = jsonPercents[i][0];
                  percentOutput = jsonPercents[i][1];
              }
          }
      });
      if (passedZ > 0) {
        // Find percentage if above .5, convert to percentage w/ one decimal
        return ((percentOutput * 100).toFixed(1) + "%");  
      } else {
        // Since our z-score table only goes from .5 up, we do some math to find the percent if it's below 50%
        var calcNeg = (0.5 - (percentOutput - 0.5));
        return ((calcNeg * 100).toFixed(1) + "%");  
      }
    }
    

    // Attempt at more generic calculator. First input will be gender, 2nd input will be the x variable
    function getCalculation(gender, xVar, col, calcMetric) {
      line = null;
      console.log(xVar + "---" + calcMetric);
      //small private helper
      var findRow = 
        function(arr, xVar) {
          for(var i = 0; i < arr.length; i ++) {
            if (arr[i][0] == xVar) {
              line = arr[i];
              break;
            }
          }
          return line;
        }
      //console.log(json[calcMetric][gender]);
      line = findRow(json[calcMetric], xVar);
      console.log(line);
      return line != null ? line : 'N.A.';
    }

  // Array of indicators. 2nd field is x-axis value. 3rd field is essentially y-axis.
  var calcArray = new Array(
    ["who_weight_length_45-110", "length", "weight"],
    ["who_weight_day_0-1856","age", "weight"],
    ["who_lengthHeight_day_0-1856","age", "length"],
    ["who_bmi_day_0-1856","age", "bmi"]
  )

  function runCalc(){
    var findZScore, findPercent = null;
    // Must have gender and age filled in
    if (formAge && formGender) {

      // Generic calculator, uses calcArray
      // Change to only run row when it has needed values?
      for (var i = 0; i < calcArray.length; i++) {
          var xValue, zScoreAbs = null;
          var zScoreWarning = 'success';

          // Output debug
          if (calcArray[i][1] == 'age') {
            xValue = formAge;
          } else {
            xValue = formLength;
          }
          $('#result' + i).text(getCalculation(formGender, xValue, 3, calcArray[i][0]));

          if (calcArray[i][2] == 'bmi') {
            formBMI = calcBMI(formWeight, formLength);
            $("#formBMI").val(formBMI.toFixed(1));
            findZScore = valueToZScore(line[1], line[2], line[3],  formBMI);
          } else if (calcArray[i][2] == 'length') {
            findZScore = valueToZScore(line[1], line[2], line[3],  formLength);
          } else {
            findZScore = valueToZScore(line[1], line[2], line[3],  formWeight);
          }
          // Set CSS class for table rows based on z-score range (in absolute value)
          // 0-1 = A good score, adds green - class="success"
          // 1-2 = Hmm, adds yellow - class="warning"
          // 2-3.5 = Uhoh, this is a bad score, adds red - class="error"
          // Above 3.5 = Yields N/A for percent - class="error"
          zScoreAbs = Math.abs(findZScore);
          if (zScoreAbs > 2) {
            zScoreWarning = 'error';
          } else if ( zScoreAbs > 1 ) {
            zScoreWarning = 'warning';
          }
          $("#calc" + i).text(findZScore.toFixed(2)).parent('tr').removeClass().addClass(zScoreWarning).find('img').addClass('chart-launch');
          findPercent = findPercentage(findZScore);
          $("#calcP" + i).text(findPercent);

      }

    }
  }


	var jsonChartData = [];
  function getChartLines(metric, gender) {
    // Clears array - needed if gender is switched
    jsonChartData.length = 0;
    // TODO - should probably load all the data, then have separate funcitons to select what's needed.
    // Cuts down on the number of calls. Need to smart about this -- maybe have one call for everything
    // based on gender - would reduce the data by 50%.
    var genderShort;
    if (gender == "female") {
      genderShort = 'f';
    } else {
      genderShort = 'm';
    }
    $.getJSON('data/dataChartStddevs_'+genderShort+'.json', function(data) {
      for(var i = 0; i < data[metric][gender].length; i ++) {
        jsonChartData.push([data[metric][gender][i][0], data[metric][gender][i][1], data[metric][gender][i][2], data[metric][gender][i][3], data[metric][gender][i][4], data[metric][gender][i][5], data[metric][gender][i][6], data[metric][gender][i][7]]); 
      }
      var lineData = jsonChartData;
      console.log(jsonChartData);
      // Executes the drawChart function
      drawChart(metric, lineData);
    });
    
  }
	
	
/*** Options for Highcharts ***/
  var chart;
  var series = [];
  var chartOptions = {
    chart: {
      renderTo: 'container',
   	  plotBorderWidth: 1,
   	  width: 600
    },
    title: {
      text: null
    },
    credits: {
      enabled: false
    },
    legend: {
    	align: 'right',
    	layout: 'vertical',
    	verticalAlign: 'top'
    },
    yAxis: {
      labels: {
        formatter: function() {
          return this.value
        }
      },
      // Letting highcharts determine the min and max by commenting these out
      //min: 0,
      //max: 25,
      //tickInterval: 2,
      endOnTick: false,
      gridLineColor: "#eeeeee",
      gridLineWidth: 1
    },
    tooltip: {
      crosshairs: [{
	        width: 1,
	        color: 'red',
	        dashStyle: 'shortdot'
	    }, {
	        width: 1,
	        color: 'red',
	        dashStyle: 'shortdot'
	    }],
      shared: true
    },
    xAxis: {
      labels: {
        formatter: function() {
          return this.value
        }
      },
      //min: 45,
      //max: 110,
      //tickInterval: 5,
      gridLineColor: "#eeeeee",
      gridLineWidth: 1
    },
    plotOptions: {
        scatter: {
            marker: {
                radius: 6,
                symbol: 'circle'
            },
            showInLegend: false,
            tooltip: {
                headerFormat: '<b>{series.name}</b><br>',
                pointFormat: '{point.y} - {point.x}'
            }
        },
        spline: {
            color: '#663399',
            marker: {
                enabled: false
            },
            shadow: false,
            enableMouseTracking: false
        }
    },
    series: []
  };

  

    // Draws a chart for single series only.
  function drawChart(passTitle, passLine) {

    var xData = formLength;
    var yData = formWeight;

    if (xPoint == 'age') {
      xData = formAge;
    }
    if (yPoint == 'length') {
      yData = formLength;
    } else if (yPoint == 'bmi') {
      yData = formBMI.toFixed(1);
    }

    var formData = [[Math.abs(xData), Math.abs(yData)]]; 
  	// Need to use Math.abs to make sure Highcharts recognizes inputs as number
  	

    //var options = chartOptions;
  	for(var i = 0; i < 7; i ++) {
  		var lineCalc = [];
  		var lineColor = "#333333";
  		var lineName = "3SD";
  		for(var k = 1; k < passLine.length; k ++) {
  			lineCalc.push([passLine[k][0], passLine[k][i+1]])
  		}
  		if (i == 1 || i == 5) {
  			lineColor = "#b94a48";
  			lineName = "2SD";
  		} else if ( i == 2 || i == 4 ) {
  			lineColor = "#c09853";
  			lineName = "1SD";
  		} else if ( i == 3 ) {
  			lineColor = "#468847";
  			lineName = "Median";
  		}
  		if (i > 3) {
  			lineName = "+" + lineName;
  		} else if (i < 3) {
  			lineName = "-" + lineName;
  		}
  		chartOptions.series[i] = {data: lineCalc, type: 'spline', color: lineColor, name: lineName};	
  	}
  	chartOptions.series[7] = {data: formData, name: passTitle, type: 'scatter'};
    chartOptions.chart.renderTo = 'container';

    // This is how we can highlight the point -- FIXME - the tooltip refresh isn't working
    // for some reason.
    function callback(chart) {
    	//chart.series[7].data[0].setState('hover');
    	//chart.tooltip.refresh(chart.series[7].data[0]);
    }

    // Boom - executes chart drawing
 	  chart = new Highcharts.Chart(chartOptions, callback);
 	  // Passes title to chart modal
    $("#modalChartTitle").html(passTitle);
    // Opens modal
    $("#modalChart").modal();
    // Set axis titles for chart
    chart.yAxis[0].setTitle({
        text: yTitle
    });
    chart.xAxis[0].setTitle({
        text: xTitle
    });
  }

/*** End Highcharts options ***/

    

/*** Triggers ***/

  // Trigger calculator when form values change
  $("#formGender").on("change", function(){    
    formGender = $(this).val();
    loadIndicators(formGender);
    runCalc();
  });
  $("#formBirthday").focusout(function(){    
    //var formBirthday = new Date("2013-08-01");
    formBirthday = new Date($(this).val());
    var diff = new Date(currentDate - formBirthday);
    formAge = Math.round(diff/1000/60/60/24);
    console.log(formAge);
    runCalc();
  });
  $("#formWeight").focusout(function(){
    formWeight = $(this).val();
    runCalc();
  });
  $("#formHeight").focusout(function(){
    formLength = $(this).val();
    runCalc();
  });
  // Main single line chart used with rows and subrows
  $("body").on('click', '.chart-launch', (function() {
    arraySelect = $(this).attr("data-metric");
    xTitle = $(this).attr("data-xtitle");
    yTitle = $(this).attr("data-ytitle");
    xPoint = $(this).attr("data-xpoint");
    yPoint = $(this).attr("data-ypoint");
    // Set chart title and series name
    getChartLines(arraySelect, formGender);
    return false;
  }));
/*** End triggers ***/
  

/*** Misc functions ***/

// Testing - doesn't work yet.
  $("#modalChartTitle").on("click", function(){
  	chart.data[0].setState('hover');
    chart.tooltip.refresh(series[7].data[0]);
  })

  // Reset series values on close of modal chart
  $("#modalChartMany").on('hidden', function () {
    chartOptionsMany.series = [];
  });
  $("#modalChart").on('hidden', function () {
    chartOptions.series = [];
  });
  
/*** End misc functions ***/


});