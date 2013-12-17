$(document).ready(function () {

/** Set variables and contstants **/
	var line = null;
  var currentDate = new Date();
  var formUnit, formWeight, formAge, formGender, formHeight, formBirthday, formBMI, formMeasureDate;
  var json, jsonPercents, findZScore, arraySelect;
  var xTitle, yTitle, xPoint, yPoint;

  // Constants used for date/time unit conversion. Taken from EW's old
  // graphSetup code.
  growthConstants = {};
  //Days in a tropical (solar) year as of Jan 1, 2000. Source http://en.wikipedia.org/wiki/Tropical_year#Mean_tropical_year_current_value
  //This one isn't much use here. It is approxamtily what you get when you enter 'days in a year' in to Google though. 
  growthConstants.daysInTropicalYear = 365.2421897;
  //Days in a year based on the Gregorian calendar. This is probably the most accurate and useful value to use in the long term. 
  growthConstants.daysInGregorianYear = 365.2425;
  //Days in a year based on the Julian calendar. The only reason this is here is because this is the value specified by the WHO guidelines. 
  growthConstants.daysInJulianYear = 365.25;
  //Nobody disagrees on this. La la la la http://en.wikipedia.org/wiki/Leap_second I can't hear you.
  growthConstants.secondsInADay = 86400;
  growthConstants.millisecondsInAGregorianYear 
      = 1000 * growthConstants.secondsInADay * growthConstants.daysInGregorianYear;
  growthConstants.millisecondsInAGregorianMonth
      = growthConstants.millisecondsInAGregorianYear / 12;
  growthConstants.millisecondsInAJulianMonth
      = 1000 * growthConstants.secondsInADay * growthConstants.daysInJulianYear / 12;
/** End - Set variables and contstants **/

/** Misc functions to be used **/
  
  // calculates z-score for l,m,s
  function valueToZScore(l, m, s, value) {
    if (l === 0) {
      return Math.log(value/m) / s;
    } else {
      return (Math.pow(value/m, l) - 1) / (l*s);
    }
  }

  // Calculates BMI
  function calcBMI(weight, height) {
    var resultBMI = weight / (Math.pow((height / 100), 2));
    return resultBMI;
  } 

  // Get age at a certain date
  function getAgeAtDate(birthday, apptDate) {
    var checkDiff = new Date(apptDate - birthday);
    return Math.round(checkDiff/1000/60/60/24);
  }
  // Get age in months
  function getMonths(birthDate, date) {
    var age = (date - birthDate) * (1 / growthConstants.millisecondsInAGregorianMonth);
    return age;
  }
  // Get age in years
  function getYears(birthDate, date) {
    var age = (date - birthDate) * (1 / growthConstants.millisecondsInAGregorianYear);
    return age;
  }

  // Conversions
  function convInCm(value){
    var calcVal = (value * 2.54).toFixed(1);
    return calcVal;
  }
  function convLbKg(value){
    var calcVal = (value * 0.453592).toFixed(1);
    return calcVal;
  }

/** End - Misc functions to be used **/

  // get data on ready - Note: farther down we get JSON charting data only after triggers
  $.getJSON('data/z-scores.json', function(data) {
      jsonPercents = data;       
    });

  function loadIndicators(gender)  {
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
    ["who_weight_day_0-3650","age", "weight"],
    ["who_lengthHeight_day_0-6935","age", "length"],
    ["who_bmi_day_0-6935","age", "bmi"]
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
            xValue = formHeight;
          }
          $('#result' + i).text(getCalculation(formGender, xValue, 3, calcArray[i][0]));

          if (calcArray[i][2] == 'bmi') {
            formBMI = calcBMI(formWeight, formHeight);
            $("#formBMI").text(formBMI.toFixed(1));
            findZScore = valueToZScore(line[1], line[2], line[3],  formBMI);
          } else if (calcArray[i][2] == 'length') {
            findZScore = valueToZScore(line[1], line[2], line[3],  formHeight);
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

    } else {
      console.log('no dice');
    }
  }


	var jsonChartData = [];
  function getChartLines(metric, gender) {
    console.log(metric);
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
      console.log(data[metric].length);
      for(var i = 0; i < data[metric].length; i ++) {
        jsonChartData.push([data[metric][i][0], data[metric][i][1], data[metric][i][2], data[metric][i][3], data[metric][i][4], data[metric][i][5], data[metric][i][6], data[metric][i][7]]); 
      }
      drawChart(metric, jsonChartData);
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

    var xData = formHeight;
    var yData = formWeight;

    if (xPoint == 'age') {
      xData = formAge;
    }
    if (yPoint == 'length') {
      yData = formHeight;
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
  
  // Check if fields are filled, if so, run calculator
  function fieldCheck() {
    var anyFieldIsEmpty = $("form input.trigger-calc").filter(function() {
              return $.trim(this.value).length === 0;
          }).length > 0;
    if (!anyFieldIsEmpty) {
      runCalc();
    } else {
      console.log('empty!');
    }
  }

  // Unit conversion
  $("input[name=unitType").on("change", function(){    
    formUnit = $(this).val();
    if (formUnit == 'imperial') {
      $("#formHeight, #formWeight").addClass('imperial').val("");
      $(".form-help-metric").fadeOut('200', function(){
        $(".form-help-imperial").fadeIn('600');
      });
      formWeight, formHeight = '';
    } else {
      $("#formHeight, #formWeight").removeClass('imperial').val("");
      $(".form-help-imperial").fadeOut('200', function(){
        $(".form-help-metric").fadeIn('600');
      });
      formWeight, formHeight = '';
    }
  });

  // Trigger calculator when form values change
  $("#formGender").on("change", function(){    
    formGender = $(this).val();
    loadIndicators(formGender);
    fieldCheck();
  });
  $("#formBirthday").focusout(function(){    
    formBirthday = new Date($(this).val());
    if (formMeasureDate) {
      formAge = getAgeAtDate(formBirthday, formMeasureDate);
      $("#formCalcAge").text(formAge);
      fieldCheck();
    }
  });
  $("#formMeasureDate").focusout(function(){    
    formMeasureDate = new Date($(this).val());
    if (formBirthday) {
      formAge = getAgeAtDate(formBirthday, formMeasureDate);
      $("#formCalcAge").text(formAge);
      fieldCheck();
    }
  });
  $("#formWeight").focusout(function(){
    if ($(this).hasClass('imperial')) {
      var toConv = $(this).val();
      formWeight = convLbKg(toConv);
    } else {
      formWeight = $(this).val();
    }
    fieldCheck();
  });
  $("#formHeight").focusout(function(){
    if ($(this).hasClass('imperial')) {
      var toConv = $(this).val();
      formHeight = convInCm(toConv);
    } else {
      // Need to round to nearest tenth for length-weight measure
      formHeight = parseFloat($(this).val()).toFixed(1);
    }
    console.log(formHeight);
    fieldCheck();
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

/*** Test fill-in - just used for filling in dummy data quickly ***/
  // Only kind of works
  $("body").on('click','.test-trigger', function(){
    var testAppt = $(this).attr('data-appt');
    var testBirth = $(this).attr('data-birth');
    var testGender = $(this).attr('data-gender');
    var testHeight = $(this).attr('data-height');
    var testUnit = $(this).attr('data-unit');
    var testWeight = $(this).attr('data-weight');
    $("#formBirthday").val(testBirth).trigger('focusout');
    $("#formGender").val(testGender).trigger('change');
    $("#formHeight").val(testHeight).trigger('focusout');
    $("#formMeasureDate").val(testAppt).trigger('focusout');
    $("#formWeight").val(testWeight).trigger('focusout');
    $('input[name=unitType][value='+testUnit+']').prop("checked",true);
    //runCalc();
  });

/*** End - Test fill-in ***/  

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