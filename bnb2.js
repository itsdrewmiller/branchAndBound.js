/**
 * Created by Drew on 9/27/13.
 */

function Bnb(type) {

    var me = this;

    me.loopAbort = 10;

    if (type === 'min') {

    } else {
        throw 'Only minimizes for now.';
    }

    var setBounds = function (box) {
        box.upper = me.upperBound(box);
        box.lower = me.lowerBound(box);
    };

    var splitBox = function (box, properties) {

        var maxDistance = 0;
        var maxProperty = 0;

        var leftChild = { split: (box.split || 0) + 1 };
        var rightChild = { split: (box.split || 0) + 1 };

        for (var i = 0; i < properties.length; i++) {
            var prop = properties[i];
            var currentVar = box[prop];
            var distance = currentVar.max - currentVar.min;
            if (currentVar.splitWeight) {
                distance *= currentVar.splitWeight;
            }
            if (distance >= maxDistance) {
                maxDistance = distance;
                maxProperty = prop;
            }
            leftChild[prop] = { min: currentVar.min, max: currentVar.max, isDiscrete: !!currentVar.isDiscrete, splitWeight: currentVar.splitWeight || 1 };
            rightChild[prop] = { min: currentVar.min, max: currentVar.max, isDiscrete: !!currentVar.isDiscrete, splitWeight: currentVar.splitWeight || 1 };
        }

        var maxVar = box[maxProperty];

        var middle = maxVar.min + (maxVar.max - maxVar.min) * 0.51;

        var leftMax = middle;
        var rightMin = middle;

        if (maxVar.isDiscrete) {
            leftMax = Math.floor(leftMax);
            rightMin = Math.ceil(rightMin);
        }

        leftChild[maxProperty].max = leftMax;
        rightChild[maxProperty].min = rightMin;

        return { left: leftChild, right: rightChild };

    };

    var updateBoxesAndBounds = function (boxes, bounds) {

        console.log('Came in with ' + bounds.minLower + ' to ' + bounds.minUpper);

        var bestBox = null;
        bounds.minLower = Infinity;
        bounds.minUpper = Infinity;

        boxes.all(function (box, index) {
            if (!box) { return; }
            if (box.lower < bounds.minLower) {
                bounds.minLower = box.lower;
            }
            if (box.upper < bounds.minUpper) {
                bounds.minUpper = box.upper;
                bestBox = box;
            }
        });

        console.log('left with ' + bounds.minLower + ' to ' + bounds.minUpper);

        return bestBox;
    };

    this.start = function (callback) {

        // do some prep
        var properties = [];
        for (prop in this.initialBox) {
            if (this.initialBox.hasOwnProperty(prop) && typeof(this.initialBox[prop]) === 'object') {
                properties.push(prop);
            }
        }

        // set boundaries based on the initial box
        setBounds(this.initialBox);

        var bounds = {
            minLower: this.initialBox.lower,
            minUpper: this.initialBox.upper
        }

        var boxes = new Queue();
        boxes.enqueue(this.initialBox);

        // do the logic
        //   split that box, recalculate boundaries, and if any of them change clear boxes and rejigger
        //   (this includes if they change from the removal of the box being split)
        //   check bounds against tolerance and return if within range

        var count = 0;
        if (!this.bestBox) { this.bestBox = this.initialBox; }

        var needToUpdate = false;
        var updateRange = 1000;
        var autoCleanRange = 50000;

        while (count++ < this.loopAbort) {

            var boxToSplit = null;
            while (boxToSplit === null) {
                boxToSplit = boxes.dequeue();
                if (boxToSplit.lower > bounds.minUpper) {
                    boxToSplit = null;
                }
            }
            var split = splitBox(boxToSplit, properties);


            if (boxToSplit.lower === bounds.minLower || boxToSplit.upper === bounds.minUpper) {
                needToUpdate = true;
            }

            // If the box forces us to resize we might be onto something, let's bump it to the front of the queue

            var leftBox = split.left;
            setBounds(leftBox);
            if (leftBox.lower < bounds.minLower || leftBox.upper < bounds.minUpper) {
                if (leftBox.lower < bounds.minLower) { bounds.minLower = leftBox.lower; }
                if (leftBox.upper < bounds.minUpper) {
                    bounds.minUpper = leftBox.upper;
                    this.bestBox = leftBox;
                }
                boxes.cheat(leftBox);
            } else {
                boxes.enqueue(leftBox);
            }

            var rightBox = split.right;
            setBounds(rightBox);
            if (rightBox.lower < bounds.minLower || rightBox.upper < bounds.minUpper) {
                if (rightBox.lower < bounds.minLower) { bounds.minLower = rightBox.lower; }
                if (rightBox.upper < bounds.minUpper) {
                    bounds.minUpper = rightBox.upper;
                    this.bestBox = rightBox;
                }
                boxes.cheat(rightBox);
            } else {
                boxes.enqueue(rightBox);
            }

            if (needToUpdate && !(count % updateRange )) {
                this.bestBox = updateBoxesAndBounds(boxes, bounds);
                needToUpdate = false;
            }

            if (!(count % autoCleanRange )) {
                this.bestBox = updateBoxesAndBounds(boxes, bounds);
            }

            this.iteration({
                count: count,
                bounds: bounds,
                bestBox: this.bestBox
            });

            if (bounds.minUpper - bounds.minLower <= this.tolerance) {
                console.log('Done!  Lower: ' + bounds.minLower + '.  Upper: ' + bounds.minUpper + '.');
                boxes.clean();
                console.dir(boxes.array);
                callback(null, this);
                return;
            }
        }
    }

}
