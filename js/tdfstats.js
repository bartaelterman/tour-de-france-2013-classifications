var TDF = function() {

    var data;

    var _setData = function(d) {
        // function for testing purposes.
        data = d;
    }
    this._setData = _setData;

    var findDomains = function(classifType) {
        var players = Object.getOwnPropertyNames(data.standings[classifType]); // mind you that if classifType = ETG, "players" are actually teams
        var allDataPoints = [];
        for (var i=0; i<players.length; i++) {
            var player = players[i];
            var playerData = data.standings[classifType][player];
            playerData.map(function (d) {allDataPoints.push(d);});
        }
        xDomain = d3.extent(allDataPoints, function(d) {return d.x;});
        yDomain = d3.extent(allDataPoints, function(d) {return d.y;});
        return {"x": xDomain, "y": yDomain};
    }


    var _init_ = function() {
        var indata = d3.json("tourdata.json", function(error, alldata) {
            data = alldata;
            fill_select("ITG");
            var domains = findDomains("ITG");
            draw(domains, "ITG");
        });
    }

    // expose some functions
    this.findDomains = findDomains;
    this._init_ = _init_;

    function draw(domains, classifType) {
        var w = 1100;
        var h = 600;
        var pad = 40;

        var svg = d3.select("#display").append("svg");

        svg.attr("width", w)
            .attr("height", h)
            .attr("id", "chart");

        // Define axes
        var xScale = d3.scale.linear().domain(domains.x).range([pad, w-pad]);
        var xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickSize(h-pad).ticks(21);
        var yScale = d3.scale.linear().domain(domains.y).range([pad, h-pad]);
        var yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(4);

        // Draw xAxis
        var gx = svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0, " + (pad/2) + ")")
            .call(xAxis);
        gx.selectAll("g").filter(function(d) {return d; })
            .classed("minor", true);

        // Draw yAxis
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + pad + ", 0)")
            .call(yAxis);

        // Define linefunction
        var lineFunction = d3.svg.line()
            .x(function(d) {return xScale(d.x)})
            .y(function(d) {return yScale(d.y)})
            .interpolate("monotone");

        // create the tooltip
        var div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // create a blur filter
        var filter = svg.append("defs")
            .append("filter")
            .attr("id", "blur");

        filter.append("feGaussianBlur")
            .attr("stdDeviation", 3)
            .attr("result", "offsetBlur");

        var feMerge = filter.append("feMerge");

        feMerge.append("feMergeNode")
            .attr("in", "offsetBlur");

        feMerge.append("feMergeNode")
            .attr("in", "SourceGraphic");

        for (var playerid in data.standings[classifType]) {
            var standingdata = data.standings[classifType][playerid];
            if (classifType != "ETG") {
                var playerName = data.players[playerid].name;
                var teamId = data.players[playerid].team;
            } else {
                var teamId = playerid;
                var playerName = "";
            }
            var teamName = data.teams[teamId].name;
            var teamColor = data.teams[teamId].color;
            var playerLine = svg.append("g")
                .append("path")
                .attr("d", lineFunction(standingdata))
                .attr("id", "line-" + playerid)
                .attr("stroke", "#000")
                .attr("stroke-width", 2)
                .attr("opacity", ".4")
                .attr("fill", "none")
                .attr("player", playerName)
                .attr("teamid", teamId)
                .attr("team", teamName)
                .attr("team-color", teamColor)
                .on("mouseover", function(d) {
                    var color = d3.select(this).attr("team-color");
                    d3.select(this).attr("filter", "url(#blur)")
                        .attr("opacity", "1")
                        .attr("stroke", color);
                })
                .on("mouseout", function(d) {
                    div.transition()
                        .duration(300)
                        .style("opacity", 0);
                    d3.select(this).attr("filter", "")
                        .attr("opacity", ".4")
                        .attr("stroke", "#000");
                })
                .on("click", function(d) {
                    div.transition()
                        .duration(200)
                        .style("opacity", .9);
                    div.html("<p>" + d3.select(this).attr("player") + "</p><p>" + d3.select(this).attr("team") + "</p>")
                    //div.html("<p>" + d.player + "</p>")
                        .style("border-color", d3.select(this).attr("team-color"))
                        .style("left", (d3.event.pageX - 40) + "px")
                        .style("top", (d3.event.pageY - 120) + "px"); 
                });
        }

    }

    var redraw = function() {
        var svg = d3.select("#display svg");
        svg.remove();
        var classifsel = d3.select("#classif-select").node();
        var classifType = classifsel.options[classifsel.selectedIndex].value;
        var domains = findDomains(classifType);
        if (classifType == "ETG") {
            d3.select("#player-select").attr("disabled", "disabled");
        } else {
            d3.select("#player-select").attr("disabled", null);
        }
        draw(domains, classifType);
    }

    var highlightPlayer = function() {
        var sel = d3.select("#player-select").node();
        var playerId = sel.options[sel.selectedIndex].value;
        d3.selectAll("path").attr("opacity", ".4").attr("stroke", "#000").attr("filter", "");
        d3.select("#line-" + playerId)
            .attr("opacity", "1")
            .attr("filter", "url(#blur)")
            .attr("stroke", d3.select("#line-" + playerId).attr("team-color"));
    }

    var highlightTeam = function() {
        var sel = d3.select("#team-select").node();
        var team = sel.options[sel.selectedIndex].value.split("-");
        var teamid = team[0];
        var teamcolor = team[1];
        d3.selectAll("path").attr("opacity", ".4").attr("stroke", "#000").attr("filter", "");
        d3.selectAll("[teamid='" + teamid + "']")
            .attr("opacity", "1")
            .attr("filter", "url(#blur)")
            .attr("stroke", teamcolor);
    }

    var fill_select = function(classifType) {
        var selectid = "#player-select";
        var sel = d3.select(selectid);
        var playersArr = [];
            Object.getOwnPropertyNames(data.players).map(function (player_id) {playersArr.push(data.players[player_id]);});
            playersArr.sort(sortByName);
            for (var i=0; i<playersArr.length; i++) {
                var player = playersArr[i];
                sel.append("option")
                    .text(player.name)
                    .attr("value", player.id);
            }
        sel.on("change", highlightPlayer);
        sel = d3.select("#team-select");
        var teamsArr = [];
        Object.getOwnPropertyNames(data.teams).map(function (team_id) {teamsArr.push(data.teams[team_id]);});
        teamsArr.sort(sortByName);
        for (var i=0; i<teamsArr.length; i++) {
            var team = teamsArr[i];
            sel.append("option")
                .text(team.name)
                .attr("value", team.id + "-" + team.color);
        }
        sel.on("change", highlightTeam);
        sel = d3.select("#classif-select");
        sel.on("change", redraw);
    }

    var sortByName = function(a,b) {
        if (a.name < b.name) {
            return -1;
        }
        if (a.name > b.name) {
            return 1;
        }
        return 0;
    }

}

var tdf = new TDF();
tdf._init_();
