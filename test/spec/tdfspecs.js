describe("TDF", function() {
    var tdf;

    var dataPerPlayer = {"standings": {
        "ITG": {
            "player1": [
                {"x": 1, "y": 1},
                {"x": 2, "y": 2}
            ],
            "player2": [
                {"x": 1, "y": 2},
                {"x": 2, "y": 1}
            ],
        }
    }};

    var domains = {"x": [1, 2], "y": [1, 2]}; // expected x and y domains

    beforeEach(function() {
        tdf = new TDF();
        tdf._setData(dataPerPlayer);
    });

    it("find domains in standingsdata", function() {
        expect(tdf.findDomains("ITG")).toEqual(domains);
    });
});
