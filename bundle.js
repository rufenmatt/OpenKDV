(function() {
    function r(e, n, t) {
        function o(i, f) {
            if (!n[i]) {
                if (!e[i]) {
                    var c = "function" == typeof require && require;
                    if (!f && c) return c(i, !0);
                    if (u) return u(i, !0);
                    var a = new Error("Cannot find module '" + i + "'");
                    throw a.code = "MODULE_NOT_FOUND", a
                }
                var p = n[i] = {
                    exports: {}
                };
                e[i][0].call(p.exports, function(r) {
                    var n = e[i][1][r];
                    return o(n || r)
                }, p, p.exports, r, e, n, t)
            }
            return n[i].exports
        }
        for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) o(t[i]);
        return o
    }
    return r
})()({
    //app
    1: [function(require, module, exports) {
        "use strict";
        var md = new MobileDetect(window.navigator.userAgent);
        var slideout = new Slideout({
            panel: document.getElementById("panel"),
            menu: document.getElementById("menu"),
            padding: 256,
        });
        d3.select("#toggle-button").on("click", function() {
            slideout.toggle()
        });
        //line-chart
        var app = {
            color: d3.scaleSequential(d3.interpolateViridis).domain([1871, 2019]),
            countDone: 0,
            dispatch: d3.dispatch("end", "show"),
            duration: 10,
            fadeDuration: 0,
            format: d3.format(".1f"),
            formatYear: d3.timeFormat("%Y"),
            margin: {
                top: 0,
                right: 20,
                bottom: 20,
                left: 40,
            },
            padding: 10,
            red: "#990000",
            root: "../",
            running: false,
            viz: []
        };
        app.setWidth = function(count) {
            return d3.min([700, Math.floor((window.innerWidth - 20 * count) / count)])
        };
        app.heightLineChart = 300 - app.margin.top - app.margin.bottom;
        app.showMobileWarning = function() {
            if (md.mobile()) {
                var alert = d3.select("div#alert");
                alert.style("display", "block").on("click", function() {
                    alert.style("display", "none")
                })
            }
        };
        //time controller
        app.fastForward = function() {
            d3.selectAll(".vertical-line, .hover-text").attr("visibility", "hidden");
            if (app.running) {
                d3.select("#status").classed("icon-play3", true);
                d3.select("#status").classed("icon-pause2", false);
                app.viz.forEach(function(v) {
                    v.svg.dispatch("end")
                })
            } else {
                d3.select("#status").classed("icon-play3", false);
                d3.select("#status").classed("icon-pause2", true);
                app.viz.forEach(function(v) {
                    v.svg.dispatch("start")
                })
            }
            app.running = !app.running
        };
        app.dispatch.on("end", function() {
            d3.selectAll("svg, span#status").on("click", null);
            app.countDone += 1;
            d3.select("#status").style("opacity", .2);
            app.running = false;
            if (app.countDone === app.viz.length) {
                app.countDone = 0;
                d3.timeout(function() {
                    d3.selectAll("text.year").text("");
                    d3.selectAll("path.period").transition().duration(app.fadeDuration).attr("opacity", 0);
                    d3.timeout(function restart() {
                        app.start();
                        d3.select("#status").style("opacity", 1)
                    }, app.fadeDuration)
                }, 3500)
            }
        });
        app.dispatch.on("show", function() {
            var year = this.year;
            var month = this.month || 12;
            app.viz.forEach(function(v) {
                v.showUntil(year, month)
            })
        });
        app.start = function() {
            app.viz.forEach(function(v) {
                v.svg.dispatch("start")
            });
            d3.selectAll("svg, span#status").on("click", app.fastForward);
            app.running = true
        };
        module.exports = app
    }, {}],
    // linear-chart
    3: [function(require, module, exports) {
        "use strict";
        var app = require("./app.js");
        var duration = app.duration;
        var color = app.color;
        var margin = app.margin;
        var padding = app.padding;
        var formatYear = app.formatYear;
        var format = app.format;
        module.exports = function emissionsChart() {
            var width = app.width - app.margin.left - app.margin.right;
            var height = app.heightLineChart;
            var domain = [0, 1];
            var unit = "";
            var delay = function(d, index) {
                return index * duration
            };
            var xScale = d3.scaleTime().domain([new Date(1871, 1, 1), new Date(2019, 12, 1)]).range([padding, width]).clamp(true);
            var yScale = d3.scaleLinear().domain(domain).range([height - padding, padding]);
            var xAxis = d3.axisBottom().scale(xScale).tickFormat(formatYear);
            var yAxis = d3.axisLeft().scale(yScale);
            var line = d3.line().x(function(d) {
                if (d.month) {
                    return xScale(new Date(d.year, d.month))
                } else {
                    return xScale(new Date(d.year, 0))
                }
            }).y(function(d) {
                return yScale(d.value)

            });
            var mousemove = function() {
                if (chart.running) {
                    return false
                }
                var date = xScale.invert(d3.mouse(this)[0]);
                var year = date.getFullYear();
                var month = date.getMonth();
                app.dispatch.call("show", {
                    year: year,
                    month: month
                })
            };

            function chart(selection) {
                var data = selection.data()[0];
                chart.data = data;
                chart.lastYear = data[data.length - 1].year;
                var svg = selection.append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                var lines = svg.append("g");
                svg.append("g").attr("transform", "translate(0," + height + ")").attr("class", "x axis").call(xAxis);
                svg.append("g").attr("class", "y axis").call(yAxis);
                chart.vertLine = svg.append("line").attr("class", "vertical-line").attr("y1", yScale.range()[0]).attr("y2", yScale.range()[1]).attr("stroke", "gray").attr("stroke-width", "1");
                chart.vertLineText = svg.append("text").attr("class", "hover-text");
                chart.vertLineMonth = svg.append("text").attr("class", "hover-text");
                chart.vertLineYear = svg.append("text").attr("class", "hover-text");
                svg.append("rect").attr("width", width).attr("height", height).style("fill", "none").style("pointer-events", "all").on("mousemove", mousemove);
                data.forEach(function(item, index) {
                    if (index >= data.length - 1) {
                        return
                    }
                    var currentData = data.slice(index, index + 2);
                    lines.append("path").datum(currentData).attr("d", line).attr("class", "period").attr("stroke", color(currentData[0].year)).attr("opacity", 0)
                });
                svg.on("start", chart.run);
                svg.on("end", chart.stop);
                chart.svg = svg
            }
            chart.domain = function(value) {
                if (!arguments.length) return domain;
                domain = value;
                yScale.domain(domain);
                return chart
            };
            chart.unit = function(value) {
                if (!arguments.length) return unit;
                unit = value;
                return chart
            };
            chart.delay = function(value) {
                if (!arguments.length) return delay;
                delay = value;
                return chart
            };
            chart.run = function() {
                chart.svg.selectAll("path.period[opacity='0.2']").attr("opacity", 0);
                chart.svg.selectAll("path.period[opacity='0']").transition().delay(delay).attr("opacity", 1).on("end", function(d) {
                    if (d[d.length - 1].year === chart.lastYear) {
                        app.dispatch.call("end");
                        chart.running = false
                    }
                });
                chart.svg.select("rect").on("mousemove", null);
                chart.running = true
            };
            chart.stop = function() {
                chart.svg.select("rect").on("mousemove", mousemove);
                chart.svg.selectAll("path.period").interrupt();
                chart.svg.selectAll("path.period:not([opacity='0'])").attr("opacity", 1);
                chart.svg.selectAll("path.period[opacity='0']").attr("opacity", .2);
                chart.running = false
            };
            chart.showUntil = function(year, month) {
                var date = new Date(year, month);
                chart.svg.selectAll("path.period").attr("opacity", function(d) {
                    if (d[1].year < year || d[1].year === year && d[1].month <= month) {
                        return 1
                    } else {
                        return .2
                    }
                });
                var value = chart.data.find(function(item) {
                    if (item.month) {
                        return item.year === year && item.month === month
                    } else {
                        return item.year === year
                    }
                });
                if (value && value.value !== null) {
                    value = format(value.value) + " " + unit
                } else {
                    value = ""
                }
                //vertical controller  line
                chart.vertLine.attr("visibility", "visible").attr("x1", xScale(date)).attr("x2", xScale(date));
                chart.vertLineText.attr("visibility", "visible").attr("x", xScale(date)).attr("y", .1 * yScale.range()[0]).text(value);
                var bbox = chart.vertLineText.node().getBBox();
                chart.vertLineText.attr("dx", "-" + (bbox.width + 5) + "px")

                function month_name(month) {
                    var months = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
                    return months[month - 1];
                };

                chart.vertLineMonth.attr("visibility", "visible").attr("x", xScale(date)).attr("y", .9 * yScale.range()[0]).text(month_name(month));
                var bbox2 = chart.vertLineMonth.node().getBBox();
                chart.vertLineMonth.attr("dx", "-" + (bbox2.width + 5) + "px")

                chart.vertLineYear.attr("visibility", "visible").attr("x", xScale(date)).attr("y", .95 * yScale.range()[0]).text(year);
                var bbox3 = chart.vertLineYear.node().getBBox();
                chart.vertLineYear.attr("dx", "-" + (bbox3.width + 5) + "px")

            };
            return chart
        }
    }, {
        "./app.js": 1
    }],
    // load-data
    4: [function(require, module, exports) {
        "use strict";
        var app = require("./app.js");

        function row(d) {
            var obj = {
                year: +d.year,
                month: +d.month,
                value: +d.value
            };

            return obj
        }
        module.exports = {

            temperatureData: function loadTemperature(callback) {


                var station = document.getElementsByName('sample7')[0];
                var period = document.getElementsByName('sample6')[0];

                function loadSyncedData() {

                    if (station.value == "optionBAS" && period.value == "1871-1900") {
                        return "/data/BAS_data_1871-1900.csv";
                    } else if (station.value == "optionBAS" && period.value == "1961-1990") {
                        return "/data/BAS_data_1961-1990.csv";
                    } else if (station.value == "optionBAS" && period.value == "1981-2010") {
                        return "/data/BAS_data_1981-2010.csv";
                    } else if (station.value == "optionBER" && period.value == "1871-1900") {
                        return "/data/BER_data_1871-1900.csv";
                    } else if (station.value == "optionBER" && period.value == "1961-1990") {
                        return "/data/BER_data_1961-1990.csv";
                    } else if (station.value == "optionBER" && period.value == "1981-2010") {
                        return "/data/BER_data_1981-2010.csv";
                    } else if (station.value == "optionCHM" && period.value == "1871-1900") {
                        return "/data/CHM_data_1871-1900.csv";
                    } else if (station.value == "optionCHM" && period.value == "1961-1990") {
                        return "/data/CHM_data_1961-1990.csv";
                    } else if (station.value == "optionCHM" && period.value == "1981-2010") {
                        return "/data/CHM_data_1981-2010.csv";
                    } else if (station.value == "optionDAV" && period.value == "1871-1900") {
                        return "/data/DAV_data_1871-1900.csv";
                    } else if (station.value == "optionDAV" && period.value == "1961-1990") {
                        return "/data/DAV_data_1961-1990.csv";
                    } else if (station.value == "optionDAV" && period.value == "1981-2010") {
                        return "/data/DAV_data_1981-2010.csv";
                    } else if (station.value == "optionENG" && period.value == "1871-1900") {
                        return "/data/ENG_data_1871-1900.csv";
                    } else if (station.value == "optionENG" && period.value == "1961-1990") {
                        return "/data/ENG_data_1961-1990.csv";
                    } else if (station.value == "optionENG" && period.value == "1981-2010") {
                        return "/data/ENG_data_1981-2010.csv";
                    } else if (station.value == "optionGSB" && period.value == "1871-1900") {
                        return "/data/GSB_data_1871-1900.csv";
                    } else if (station.value == "optionGSB" && period.value == "1961-1990") {
                        return "/data/GSB_data_1961-1990.csv";
                    } else if (station.value == "optionGSB" && period.value == "1981-2010") {
                        return "/data/GSB_data_1981-2010.csv";
                    } else if (station.value == "optionGVE" && period.value == "1871-1900") {
                        return "/data/GVE_data_1871-1900.csv";
                    } else if (station.value == "optionGVE" && period.value == "1961-1990") {
                        return "/data/GVE_data_1961-1990.csv";
                    } else if (station.value == "optionGVE" && period.value == "1981-2010") {
                        return "/data/GVE_data_1981-2010.csv";
                    } else if (station.value == "optionLUG" && period.value == "1871-1900") {
                        return "/data/LUG_data_1871-1900.csv";
                    } else if (station.value == "optionLUG" && period.value == "1961-1990") {
                        return "/data/LUG_data_1961-1990.csv";
                    } else if (station.value == "optionLUG" && period.value == "1981-2010") {
                        return "/data/LUG_data_1981-2010.csv";
                    } else if (station.value == "optionSAE" && period.value == "1871-1900") {
                        return "/data/SAE_data_1871-1900.csv";
                    } else if (station.value == "optionSAE" && period.value == "1961-1990") {
                        return "/data/SAE_data_1961-1990.csv";
                    } else if (station.value == "optionSAE" && period.value == "1981-2010") {
                        return "/data/SAE_data_1981-2010.csv";
                    } else if (station.value == "optionSIA" && period.value == "1871-1900") {
                        return "/data/SIA_data_1871-1900.csv";
                    } else if (station.value == "optionSIA" && period.value == "1961-1990") {
                        return "/data/SIA_data_1961-1990.csv";
                    } else if (station.value == "optionSIA" && period.value == "1981-2010") {
                        return "/data/SIA_data_1981-2010.csv";
                    } else if (station.value == "optionSIO" && period.value == "1871-1900") {
                        return "/data/SIO_data_1871-1900.csv";
                    } else if (station.value == "optionSIO" && period.value == "1961-1990") {
                        return "/data/SIO_data_1961-1990.csv";
                    } else if (station.value == "optionSIO" && period.value == "1981-2010") {
                        return "/data/SIO_data_1981-2010.csv";
                    } else if (station.value == "optionSMA" && period.value == "1871-1900") {
                        return "/data/SMA_data_1871-1900.csv";
                    } else if (station.value == "optionSMA" && period.value == "1961-1990") {
                        return "/data/SMA_data_1961-1990.csv";
                    } else if (station.value == "optionSMA" && period.value == "1981-2010") {
                        return "/data/SMA_data_1981-2010.csv";
                    }
                }

                if (!period.value) {
                    return;
                }

                d3.csv(loadSyncedData(), row, function(error, data) {
                    if (error) throw error;
                    app.temperatureData = data;
                    callback(null)
                })
            }
        }
    }, {
        "./app.js": 1
    }],
    // spiral-chart
    5: [function(require, module, exports) {
        "use strict";
        var app = require("./app.js");
        var duration = app.duration;
        var color = app.color;
        module.exports = function radialChart() {
            var radius = app.radius;
            var width = app.width;
            var height = app.height;
            var domain = [0, 1];
            var unit = "";
            var months = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
            var timescale = d3.scaleLinear().range([2 / 12 * Math.PI, 2 * Math.PI]).domain([1, 12]);
            var r = d3.scaleLinear().range([0, radius]);
            var line = d3.radialLine().radius(function(d) {
                return r(d.value)
            }).angle(function(d) {
                return timescale(d.month)
            });

            function chart(selection) {
                var data = selection.data()[0];
                chart.data = data;
                chart.lastYear = data[data.length - 1].year;
                chart.lastMonth = data[data.length - 1].month;
                var svg = selection.append("svg").attr("class", "circle").attr("width", app.width).attr("height", app.height).attr("viewBox", "0 0 " + width + " " + height).attr("preserveAspectRatio", "xMidYMid meet").append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
                var gr = svg.append("g").attr("class", "r axis").selectAll("g").data(r.ticks(4).slice(1)).enter().append("g");
                gr.append("circle").attr("r", r);
                gr.append("text").attr("y", function(d) {
                    return -r(d) - 4
                }).style("text-anchor", "middle").text(function(d) {
                    return d + " " + unit
                });
                var leg = svg.append("g").attr("class", "r axis").selectAll("g").data(timescale.ticks(12).slice(0, 11)).enter().append("g");
                leg.append("text").attr("y", -1.05 * radius).attr("transform", function(d) {
                    return "rotate(" + 30 * d + ")"
                }).style("text-anchor", "middle").text(function(d) {
                    return months[d - 1]
                });
                chart.text = svg.append("text").attr("class", "year").attr("x", -17).attr("dy", 5);
                data.forEach(function(item, index) {
                    if (index >= data.length - 1) {
                        return
                    }
                    var currentData = data.slice(index, index + 2);
                    if (currentData[1].year > chart.lastYear) {
                        return
                    }
                    var interpolate = d3.interpolate(currentData[0].value, currentData[1].value);
                    var points = 4;
                    var interpolatedData = d3.range(points + 1).map(function(index) {
                        var obj = {
                            value: interpolate(index / points),
                            month: currentData[0].month + index / points,
                            year: currentData[0].year
                        };
                        return obj
                    });
                    svg.append("path").datum(interpolatedData).attr("class", "period").attr("d", line).attr("opacity", 0).attr("fill", "none")
                });
                var pathSize = svg.selectAll("path.period").size();
                chart.last = d3.select(svg.selectAll("path.period").nodes()[pathSize - 1]);
                svg.on("start", chart.run);
                svg.on("end", chart.stop);
                chart.svg = svg
            }
            chart.run = function() {
                chart.svg.selectAll("path.period[opacity='0']").attr("stroke-width", 10).attr("stroke", "white").transition().delay(function(d, index) {
                    if (d[0].month === 1) {
                        chart.text.transition().delay(index * duration).text(d[0].year)
                    }
                    return index * duration
                }).attr("opacity", .5).attr("stroke-width", 2).attr("stroke", function(d) {
                    return color(d[0].year)
                }).on("end", function(d) {
                    if (d[d.length - 1].year === chart.lastYear && d[d.length - 1].month === chart.lastMonth) {
                        chart.running = false;
                        app.dispatch.call("end")
                    }
                });
                chart.running = true
            };
            chart.stop = function() {
                chart.text.interrupt();
                chart.svg.selectAll("path.period").interrupt();
                chart.svg.selectAll("path.period:not([opacity='0'])").transition().duration(100).attr("stroke-width", 2).attr("opacity", .5).attr("stroke", function(d) {
                    return color(d[0].year)
                });
                chart.running = false
            };
            chart.showUntil = function(year, month) {
                chart.svg.selectAll("path.period").attr("stroke-width", 2).attr("stroke", function(d) {
                    return color(d[0].year)
                }).attr("opacity", function(d) {
                    if (d[1].year < year || d[1].year === year && d[1].month <= month) {
                        return .5
                    } else {
                        return 0
                    }
                });
                chart.text.text(d3.min([year, chart.lastYear]))
            };
            chart.domain = function(value) {
                if (!arguments.length) return domain;
                domain = value;
                r.domain(domain);
                return chart
            };
            chart.unit = function(value) {
                if (!arguments.length) return unit;
                unit = value;
                return chart
            };
            return chart
        }
    }, {
        "./app.js": 1
    }],
    // temperature
    6: [function(require, module, exports) {
        "use strict";
        var app = require("./app");
        var load = require("./load-data.js");
        var viz = require("./viz.js");
        app.showMobileWarning();
        app.width = 600;
        app.height = app.width;
        app.radius = app.width / 2 - 25;
        
        // onchange listening                  
        const station = document.getElementById('sample7');
        const period = document.getElementById('sample6');

        station.onchange = function() {

            station.value = document.getElementById('station_token').innerHTML = station.value


            d3.selectAll("svg").remove()

            d3.selectAll("svg, span#status").on("click", null);
            app.countDone += 1;
            d3.select("#status").style("opacity", .2);
            app.running = false;

            app.countDone = 0;
            d3.timeout(function() {
                d3.selectAll("text.year").text("");
                d3.selectAll("path.period").transition().duration(app.fadeDuration).attr("opacity", 0);
                d3.timeout(function restart() {
                    app.start();
                    d3.select("#status").style("opacity", 1)
                }, app.fadeDuration)
            }, 0)


            var q = d3.queue();
            q.defer(load.temperatureData);
            q.await(function startVisualisation(error) {
                if (error) throw error;
                viz.temperatureSpiral();
                viz.temperatureLinear();
                app.start()
            })

        }

        period.onchange = function() {

            period.value = document.getElementById('period_token').innerHTML = period.value


            d3.selectAll("svg").remove()

            d3.selectAll("svg, span#status").on("click", null);
            app.countDone += 1;
            d3.select("#status").style("opacity", .2);
            app.running = false;

            app.countDone = 0;
            d3.timeout(function() {
                d3.selectAll("text.year").text("");
                d3.selectAll("path.period").transition().duration(app.fadeDuration).attr("opacity", 0);
                d3.timeout(function restart() {
                    app.start();
                    d3.select("#status").style("opacity", 1)
                }, app.fadeDuration)
            }, 0)


            var q = d3.queue();
            q.defer(load.temperatureData);
            q.await(function startVisualisation(error) {
                if (error) throw error;
                viz.temperatureSpiral();
                viz.temperatureLinear();
                app.start()
            })

        }

    }, {
        "./app": 1,
        "./load-data.js": 4,
        "./viz.js": 7
    }],
    // viz
    7: [function(require, module, exports) {
        "use strict";
        var app = require("./app");
        var spiralChart = require("./spiral-chart");
        var linearChart = require("./linear-chart");
        module.exports = {
            temperatureSpiral: function() {
                var temperatureSpiral = spiralChart().domain([-12, 10]).unit("°C");
                app.viz.push(temperatureSpiral);
                d3.select("#temperature-spiral").datum(app.temperatureData).call(temperatureSpiral).selectAll("circle").attr("class", function(d) {
                    if (d === 5) {
                        return "red"
                    }
                });
                return temperatureSpiral
            },
            temperatureLinear: function() {
                // Scale + plotting °C on time line controller
                var temperatureLinear = linearChart().domain([-12, 8]).unit("°C");
                app.viz.push(temperatureLinear);
                d3.select("#temperature-linear").datum(app.temperatureData).call(temperatureLinear)
            }
        }
    }, {
        "./app": 1,
        "./linear-chart": 3,
        "./spiral-chart": 5
    }]
}, {}, [6]);