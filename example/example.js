(function() {

    // (4-2x)xy - y
    // 4xy - 2x^2y - y
    // 2x^2y - 4xy + y

    // x = 1, y = 20
    //   40 - 80 + 20 = -20


    var bnb = new Bnb('min');

    bnb.lowerBound = function(box) {
        return 2*box.x.min*box.x.min*box.y.min - 4*box.x.max*box.y.max + box.y.min;
    };

    bnb.upperBound = function(box) {
        return 2*box.x.max*box.x.max*box.y.max - 4*box.x.min*box.y.min + box.y.max;
    };

    bnb.initialBox = { 
        x: { min: 0, max: 2, isDiscrete: true, splitWeight: 100 }, 
        y: { min: 0, max: 20 }
    };

    bnb.tolerance = 0.1;
    bnb.loopAbort = 1000000;

    bnb.iteration = function (status) {
        if (status.count % 250 === 0) {
            console.dir(status);
        }
    };

    bnb.start(function (err, bnb) {
        console.log('Finished');
        console.log('X range = ' + bnb.bestBox.x.min + ' to ' + bnb.bestBox.x.max);
        console.log('Y range = ' + bnb.bestBox.y.min + ' to ' + bnb.bestBox.y.max);
    });
})();