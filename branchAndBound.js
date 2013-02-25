(function () {

    this.branchAndBound = {
        run: function (type, lowerBoundFunc, upperBoundFunc, initialBox, tolerance, iterationCallback) {

            var setBounds = function (box) {
                box.upperBound = upperBoundFunc(box);
                box.lowerBound = lowerBoundFunc(box);
            };

            var updateBoundary = function (box) {

                if (type === 'min' && box.upperBound < minUpperBound) {
                    minUpperBound = box.upperBound;
                    bestBox = box;
                    return true;
                } else if (type === 'max' && box.lowerBound > maxLowerBound) {
                    maxLowerBound = initialBox.lowerBound;
                    bestBox = box;
                    return true;
                }
                return false;
            };

            var clearBoxes = function () {

                maxUpperBound = -Infinity;
                minLowerBound = Infinity;
                var removedBox;

                if (type === 'min') {
                    boxQueue.all(function (box, index) {
                        if (box.lowerBound > minUpperBound) {
                            remaining -= Math.pow(0.5, box.split);
                            boxQueue.removeAt(index);
                        } else {
                            if (box.lowerBound < minLowerBound) { minLowerBound = box.lowerBound; }
                        }
                    });
                } else if (type === 'max') {
                    boxQueue.all(function (box, index) {
                        if (box.upperBound < maxLowerBound) {
                            remaining -= Math.pow(0.5, box.split);
                            boxQueue.removeAt(index);
                        } else {
                            if (box.upperBound > maxUpperBound) { maxUpperBound = box.upperBound; }
                        }
                    });
                }

            };

            var weights = [];
            var isDiscrete = [];

            var getBoxSize = function (box) {

                var size = 1;

                for (var i = 0; i < weights.length; i++) {
                    size *= weights[i] * (1 + box.vars[i].max - box.vars[i].min);
                }
                return size;
            };

            var splitBox = function (box) {

                var maxDistance = 0;
                var maxIndex = 0;

                var leftChild = { vars: [], split: (box.split || 0) + 1 };
                var rightChild = { vars: [], split: (box.split || 0) + 1 };

                for (var i = 0; i < box.vars.length; i++) {
                    var currentVar = box.vars[i];
                    var distance = (weights[i] || 1) * (currentVar.max - currentVar.min);
                    if (distance > maxDistance) {
                        maxDistance = distance;
                        maxIndex = i;
                    }

                    leftChild.vars.push({ min: currentVar.min, max: currentVar.max });
                    rightChild.vars.push({ min: currentVar.min, max: currentVar.max });

                }

                var maxVar = box.vars[maxIndex];

                var middle = maxVar.min + (maxVar.max - maxVar.min) * 0.51;

                var leftMax = middle;
                var rightMin = middle;

                if (isDiscrete[maxIndex]) {
                    leftMax = Math.floor(leftMax);
                    rightMin = Math.ceil(rightMin);
                }

                leftChild.vars[maxIndex].max = leftMax;
                rightChild.vars[maxIndex].min = rightMin;

                setBounds(leftChild);
                setBounds(rightChild);

                return { leftChild: leftChild, rightChild: rightChild };

            };

            for (var i = 0; i < initialBox.vars.length; i++) {
                weights.push(initialBox.vars[i].weight);
                isDiscrete.push(initialBox.vars[i].isDiscrete);
            }

            var boxQueue = new Queue();
            boxQueue.enqueue(initialBox);
            var bestBox = initialBox;
            setBounds(initialBox);

            var minUpperBound, maxUpperBound, maxLowerBound, minLowerBound;
            var remaining = 1;

            if (type === 'min') {
                minUpperBound = initialBox.upperBound; // We want the minimum upper bound
                maxUpperBound = initialBox.upperBound;
            } else if (type === 'max') {
                maxLowerBound = initialBox.lowerBound; // we want the maximum lower bound
                minLowerBound = initialBox.lowerBound;
            } else {
                throw 'Invalid optimization type';
            }

            var abortAt = 50000000;
            var count = 0;
            var boxToSplit;
            var result;
            var leftChild;
            var rightChild;
            var clearAt = 100000;

            while (count++ < abortAt) {

                if (count % clearAt === 0) {
                    boxQueue.clean();
                }

                // pick a box to split
                boxToSplit = boxQueue.dequeue();

                // pick a variable to split on
                result = splitBox(boxToSplit);
                leftChild = result.leftChild;
                rightChild = result.rightChild;

                if (updateBoundary(leftChild)) {
                    clearBoxes();
                    boxQueue.cheat(leftChild);
                } else {
                    boxQueue.enqueue(leftChild);
                }

                if (updateBoundary(rightChild)) {
                    clearBoxes();
                    boxQueue.cheat(rightChild);
                } else {
                    boxQueue.enqueue(rightChild);

                }

                if (typeof iterationCallback === 'function') {
                    if (type === 'min') {
                        iterationCallback({
                            remainingPercent: remaining,
                            remainingCount: boxQueue.length(),
                            lowerBound: minLowerBound,
                            upperBound: minUpperBound,
                            iterations: count
                        });
                    }
                    if (type === 'max') {
                        iterationCallback({
                            remainingPercent: remaining,
                            remainingCount: boxQueue.length(),
                            lowerBound: maxLowerBound,
                            upperBound: maxUpperBound,
                            iterations: count
                        });
                    }
                }

                if (type === 'min' && (minUpperBound - minLowerBound) <= tolerance) {
                    return bestBox;
                } else if (type === 'max' && (maxUpperBound - maxLowerBound) <= tolerance) {
                    return bestBox;
                }
            }

        }
    };
})();
