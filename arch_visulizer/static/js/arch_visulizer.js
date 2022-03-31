function VisualMatched(diag1, diag2)
{
    // if (!(diag1 instanceof go.Diagram) || !(diag2 instanceof go.Diagram)) throw new Error("VisualDifferencer needs two Diagrams");
    this._diagram1 = diag1;
    this._diagram2 = diag2;
    this._originalOpacities = new go.Map();
    this._originalToolTips = new go.Map();
    this._isRunning = false;

    var self = this;
    this._updateOtherDiagram = function(e) {
        var diag = e.diagram;
        var other = (diag === self._diagram1) ? self._diagram2 : self._diagram1;
        // other.scale = diag.scale;
        // other.position = diag.position;
    };

    var $ = go.GraphObject.make;
    this.RemovedAdornmentTemplate =
    $(go.Adornment, "Auto",
        $(go.Shape, { fill: null, stroke: "red", strokeWidth: 5 }),
        $(go.Placeholder, { margin: 8 })
    );

    this.RemovedLinkAdornmentTemplate =
    $(go.Adornment, "Link",
        $(go.Shape, { isPanelMain: true, stroke: "red", strokeWidth: 5 }),
    );

    this.RemovedToolTip =
    $(go.Adornment, "Auto",
        $(go.Shape, { fill: "red", strokeWidth: 0 }),
        $(go.TextBlock, { margin: 5 },
        new go.Binding("text", "", this._propertiesList))
    );

    this.AddedAdornmentTemplate =
    $(go.Adornment, "Auto",
        $(go.Shape, { fill: null, stroke: "yellow", strokeWidth: 8 }),
        $(go.Placeholder, { margin: 8 })
    );

    this.AddedLinkAdornmentTemplate =
    $(go.Adornment, "Link",
        $(go.Shape, { isPanelMain: true, stroke: "yellow", strokeWidth: 8 }),
    );

    this.AddedToolTip =
    $(go.Adornment, "Auto",
        $(go.Shape, { fill: "yellow", strokeWidth: 0 }),
        $(go.TextBlock, { margin: 5 },
            new go.Binding("text", "", this._propertiesList))
    );

    this.ChangedAdornmentTemplate =
    $(go.Adornment, "Auto",
        $(go.Shape, { fill: null, stroke: "transparent", strokeWidth: 0 }),
        $(go.Placeholder, { margin: 8 })
    );

    this.ChangedLinkAdornmentTemplate =
    $(go.Adornment, "Link",
        $(go.Shape, { isPanelMain: true, stroke: "transparent", strokeWidth: 0 }),
    );

    this.ChangedToolTip =
    $(go.Adornment, "Auto",
        $(go.Shape, { fill: "transparent", strokeWidth: 0 }),
        $(go.TextBlock, { margin: 5 },
            new go.Binding("text", "", this._propertiesList))
    );
}

/**
* Start showing the differences between the two diagrams/models.
*/
VisualMatched.prototype.start = function()
{
    var diag1 = this._diagram1;
    var diag2 = this._diagram2;

    var self = this;

    diag1.skipsUndoManager = true;
    // diag1.animationManager=true;
    diag1.startTransaction();
    diag2.skipsUndoManager = true;
    // diag2.animationManager=true;
    diag2.startTransaction();

    if (!this._isRunning)
    {
        this._isRunning = true;
        diag1.addDiagramListener("ViewportBoundsChanged", this._updateOtherDiagram);
        diag2.addDiagramListener("ViewportBoundsChanged", this._updateOtherDiagram);
        this._setOpacities(diag1, true);
        this._setOpacities(diag2, true);
        diag2.scale = diag1.scale;
        diag2.position = diag1.position;
    }

    // set Layer.opacity
    diag1.layers.each(function(l) { l.opacity = 0.75; });
    diag2.layers.each(function(l) { l.opacity = 0.75; });

    // set Part.opacity depending on whether there are differences
    var a1 = diag1.model.nodeDataArray;
    a1.forEach(function(d1) {
        var k = diag1.model.getKeyForNodeData(d1);
        var n1 = diag1.findNodeForData(d1);
        // assume both models use the same keys
        var d2 = diag2.model.findNodeDataForKey(k);
        var n2 = diag2.findNodeForData(d2);
        if (n2 !== null)
        {
            // self._diffParts(n1, n2);
            self._SameParts(n1,n2);
        }
        else
        {
            self._onlyPart(n1);
        }
    });

    if (diag1.model instanceof go.GraphLinksModel)
    {
        a1 = diag1.model.linkDataArray;
        // if (a1.length > 0 && diag1.model.linkKeyProperty === "") throw new Error("Diagram1's model does not have linkKeyProperty set to a non-empty string");
        a1.forEach(function(d1) {
            var k = diag1.model.getKeyForLinkData(d1);
            var l1 = diag1.findLinkForData(d1);
            // assume both models use the same keys
            var d2 = diag2.model.findLinkDataForKey(k);
            var l2 = diag2.findLinkForData(d2);
            if (l2 !== null)
            {
                self._SameParts(l1,l2);
            }
            else
            {
                self._onlyPart(l1);
            }
        });
    }

    var a2 = diag2.model.nodeDataArray;
    a2.forEach(function(d2) {
        var k = diag2.model.getKeyForNodeData(d2);
        var n2 = diag2.findNodeForData(d2);
        // assume both models use the same keys
        var d1 = diag1.model.findNodeDataForKey(k);
        var n1 = diag1.findNodeForData(d1);
        if (n1 !== null)
        {
            self._SameParts(n1,n2);
        }
        else
        {
            self._onlyPart(n2);
        }
    });

    if (diag2.model instanceof go.GraphLinksModel)
    {
        a2 = diag2.model.linkDataArray;
        if (a2.length > 0 && diag2.model.linkKeyProperty === "")
        {
            throw new Error("Diagram2's model does not have linkKeyProperty set to a non-empty string");
        }

        a2.forEach(function(d2) {
            var k = diag2.model.getKeyForLinkData(d2);
            var l2 = diag2.findLinkForData(d2);
            // assume both models use the same keys
            var d1 = diag1.model.findLinkDataForKey(k);
            var l1 = diag1.findLinkForData(d1);
            if (l1 !== null)
            {
                self._SameParts(l1,l2);
            }
            else
            {
                self._onlyPart(l2);
            }
        });
    }

    diag1.commitTransaction();
    diag1.skipsUndoManager = false;
    // diag1.animationManager=false;
    diag2.commitTransaction();
    diag2.skipsUndoManager = false;
}

VisualMatched.prototype._propertiesList = function(data)
{
    var str = "";

    for (var p in data)
    {
        if (p === "__gohashid")
        {
            continue;
        }
        if (str !== "")
        {
            str += "\n";
        }
        str += p + ": " + data[p].toString();
    }

    return str;
}

VisualMatched.prototype._addAdornment = function(part, adtempl)
{
    var ad = adtempl.copy();
    if (part instanceof go.Link && part.path !== null)
    {
        ad.adornedObject = part.path;
        ad.location = part.path.getDocumentPoint(go.Spot.TopLeft);
    }
    else
    {
        ad.adornedObject = part;
        ad.location = part.position;
    }
    //ad.placeholder.desiredSize = part.actualBounds.size;
    part.addAdornment("VisualDifferencer", ad);
}

VisualMatched.prototype._onlyPart = function(part)
{
    part.opacity = 0.15;
    if (part.diagram === this._diagram1)
    {
        part.toolTip = this.RemovedToolTip;
        if (part instanceof go.Link)
        {
            // this._addAdornment(part, this.RemovedLinkAdornmentTemplate);
        }
        else
        {
            // this._addAdornment(part, this.RemovedAdornmentTemplate);
        }
    }
    else
    {
        part.toolTip = this.AddedToolTip;
        if (part instanceof go.Link)
        {
            // this._addAdornment(part, this.AddedLinkAdornmentTemplate);
        }
        else
        {
            // this._addAdornment(part, this.AddedAdornmentTemplate);
        }
    }
}

VisualMatched.prototype._SameParts = function(part1, part2)
{
    // only considering differences in model data
    if (this._areValuesDifferent(part1.data, part2.data))
    {
        // part1.opacity = 0.15;
        // part2.opacity = 0.15;
        // part1.toolTip = this.ChangedToolTip;
        // part2.toolTip = this.ChangedToolTip;
        if (part1 instanceof go.Link)
        {
            this._addAdornment(part1, this.ChangedLinkAdornmentTemplate);
        }
        else
        {
            this._addAdornment(part1, this.ChangedAdornmentTemplate);
        }

        if (part2 instanceof go.Link)
        {
            this._addAdornment(part2, this.ChangedLinkAdornmentTemplate);
        }
        else
        {
            this._addAdornment(part2, this.ChangedAdornmentTemplate);
        }

    }
    else
    {  // if they're the same, de-emphasize them
        part1.opacity = 1.0;
        part2.opacity = 1.0;
        // part1.toolTip = part2.toolTip = true;
        part1.toolTip = this.ChangedToolTip;
        part2.toolTip = this.ChangedToolTip;
        // part1.removeAdornment("VisualDifferencer");
        // part2.removeAdornment("VisualDifferencer");
    }
}

// VisualMatched.prototype._diffParts = function(part1, part2) {
//   // only considering differences in model data
//   if (this._areValuesDifferent(part1.data, part2.data)) {
//     part1.opacity = 1.0;
//     part2.opacity = 1.0;
//     part1.toolTip = this.ChangedToolTip;
//     part2.toolTip = this.ChangedToolTip;
//      if (part1 instanceof go.Link) {
//        this._addAdornment(part1, this.ChangedLinkAdornmentTemplate);
//      } else {
//        this._addAdornment(part1, this.ChangedAdornmentTemplate);
//      }
//      if (part2 instanceof go.Link) {
//        this._addAdornment(part2, this.ChangedLinkAdornmentTemplate);
//      } else {
//        this._addAdornment(part2, this.ChangedAdornmentTemplate);
//      }
//   } else {  // if they're the same, de-emphasize them
//     part1.opacity = 0.15;
//     part2.opacity = 0.15;
//     part1.toolTip = part2.toolTip = null;
//     part1.removeAdornment("VisualDifferencer");
//     part2.removeAdornment("VisualDifferencer");
//   }
// }

VisualMatched.prototype._areValuesDifferent = function(val1, val2)
{
    if (val1 === val2)
    {
        return false;
    }

    if (Array.isArray(val1) && Array.isArray(val2))
    {
        return this._areArraysDifferent(val1, val2);
    }

    if (typeof val1 === "object" && typeof val2 === "object")
    {
        return this._areObjectsDifferent(val1, val2);
    }

    // NaN !== NaN, but treat as same
    if (typeof val1 === "number" && isNaN(val1) && typeof val2 === "number" && isNaN(val2))
    {
        return false;
    }

    return true;
}

VisualMatched.prototype._areObjectsDifferent = function(obj1, obj2)
{
    if (obj1 === obj2) return false;
    // allow object-specific equality test
    if (typeof obj1["equals"] === "function" && typeof obj2["equals"] === "function")
    {
        return !obj1["equals"](obj2);
    }
    // see if there are any properties on OBJ1 that aren't on OBJ2 or have different values
    for (var p in obj1)
    {
        if (p === "__gohashid")
        {
            continue;
        }

        if (this._areValuesDifferent(obj1[p], obj2[p]))
        {
            return true;
        }
    }
    // see if there are any properties on OBJ2 that aren't on OBJ1
    for (var q in obj2)
    {
        if (q === "__gohashid")
        {
            continue;
        }

        if (obj1[q] === undefined && obj2[q] !== undefined)
        {
            return true;
        }
    }

    return false;
}

VisualMatched.prototype._areArraysDifferent = function(arr1, arr2)
{
    if (arr1 === arr2)
    {
        return false;
    }

    if (arr1.length !== arr2.length)
    {
        return true;
    }

    for (var i = 0; i < arr1.length; i++)
    {
        if (this._areValuesDifferent(arr1[i], arr2[i]))
        {
            return true;
        }
    }

    return false;
}

/**
* Stop showing the differences between the two diagrams/models.
*/
VisualMatched.prototype.stop = function() {
    if (this._isRunning)
    {
        this._isRunning = false;
        var diag1 = this._diagram1;
        var diag2 = this._diagram2;
        this._setOpacities(diag1, false);
        this._setOpacities(diag2, false);
        this._originalOpacities.clear();
        this._originalToolTips.clear();
        diag1.removeDiagramListener("ViewportBoundsChanged", this._updateOtherDiagram);
        diag2.removeDiagramListener("ViewportBoundsChanged", this._updateOtherDiagram);
    }
}

VisualMatched.prototype._setOpacities = function(diag, save)
{
    var omap = this._originalOpacities;
    var ttmap = this._originalToolTips;
    diag.skipsUndoManager = true;
    // diag.animationManager=true;
    diag.startTransaction();
    diag.layers.each(function(l) {

        if (save)
        {
            omap.set(l, l.opacity);
        }
        else
        {
            l.opacity = omap.get(l);
        }

        l.parts.each(function(p) {
            if (save)
            {
                omap.set(p, p.opacity);
                ttmap.set(p, p.toolTip);

            }
            else
            {
                p.opacity = omap.get(p);
                p.toolTip = ttmap.get(p);
                p.removeAdornment("VisualDifferencer");
            }
        });

    });

    diag.commitTransaction("");
    diag.skipsUndoManager = false;
}
//end

function VisualDifferencer(diag1, diag2)
{
    if (!(diag1 instanceof go.Diagram) || !(diag2 instanceof go.Diagram))
    {
        throw new Error("VisualDifferencer needs two Diagrams");
    }
    this._diagram1 = diag1;
    this._diagram2 = diag2;
    this._originalOpacities = new go.Map();
    this._originalToolTips = new go.Map();
    this._isRunning = false;

    var self = this;
    this._updateOtherDiagram = function(e) {
        var diag = e.diagram;
        var other = (diag === self._diagram1) ? self._diagram2 : self._diagram1;
        // other.scale = diag.scale;
        // other.position = diag.position;
    };

    var $ = go.GraphObject.make;
    this.RemovedAdornmentTemplate =
        $(go.Adornment, "Auto",
        $(go.Shape, { fill: null, stroke: "red", strokeWidth: 5 }),
        $(go.Placeholder, { margin: 8 })
    );

    this.RemovedLinkAdornmentTemplate =
        $(go.Adornment, "Link",
        $(go.Shape, { isPanelMain: true, stroke: "red", strokeWidth: 5 }),
    );

    this.RemovedToolTip =
        $(go.Adornment, "Auto",
        $(go.Shape, { fill: "red", strokeWidth: 0 }),
        $(go.TextBlock, { margin: 5 }, new go.Binding("text", "", this._propertiesList))
    );

    this.AddedAdornmentTemplate =
        $(go.Adornment, "Auto",
        $(go.Shape, { fill: null, stroke: "yellow", strokeWidth: 8 }),
        $(go.Placeholder, { margin: 8 })
    );

    this.AddedLinkAdornmentTemplate =
        $(go.Adornment, "Link",
        $(go.Shape, { isPanelMain: true, stroke: "yellow", strokeWidth: 8 }),
    );

    this.AddedToolTip =
        $(go.Adornment, "Auto",
        $(go.Shape, { fill: "yellow", strokeWidth: 0 }),
        $(go.TextBlock, { margin: 5 }, new go.Binding("text", "", this._propertiesList))
    );

    this.ChangedAdornmentTemplate =
        $(go.Adornment, "Auto",
        $(go.Shape, { fill: null, stroke: "cyan", strokeWidth: 0 }),
        $(go.Placeholder, { margin: 8 })
    );

    this.ChangedLinkAdornmentTemplate =
        $(go.Adornment, "Link",
        $(go.Shape, { isPanelMain: true, stroke: "cyan", strokeWidth: 0 }),
    );

    this.ChangedToolTip =
        $(go.Adornment, "Auto",
        $(go.Shape, { fill: "cyan", strokeWidth: 0 }),
        $(go.TextBlock, { margin: 5 }, new go.Binding("text", "", this._propertiesList))
    );
}

/**
* Start showing the differences between the two diagrams/models.
*/
VisualDifferencer.prototype.start = function()
{
    var diag1 = this._diagram1;
    var diag2 = this._diagram2;

    var self = this;

    diag1.skipsUndoManager = true;
    // diag1.animationManager=true;
    diag1.startTransaction();
    diag2.skipsUndoManager = true;
    // diag2.animationManager=true;
    diag2.startTransaction();

    if (!this._isRunning)
    {
        this._isRunning = true;
        diag1.addDiagramListener("ViewportBoundsChanged", this._updateOtherDiagram);
        diag2.addDiagramListener("ViewportBoundsChanged", this._updateOtherDiagram);
        this._setOpacities(diag1, true);
        this._setOpacities(diag2, true);
        diag2.scale = diag1.scale;
        diag2.position = diag1.position;
    }

    // set Layer.opacity
    diag1.layers.each(function(l) { l.opacity = 0.75; });
    diag2.layers.each(function(l) { l.opacity = 0.75; });

    // set Part.opacity depending on whether there are differences
    var a1 = diag1.model.nodeDataArray;
    a1.forEach(function(d1) {
        var k = diag1.model.getKeyForNodeData(d1);
        var n1 = diag1.findNodeForData(d1);
        // assume both models use the same keys
        var d2 = diag2.model.findNodeDataForKey(k);
        var n2 = diag2.findNodeForData(d2);
        if (n2 !== null)
        {
            self._diffParts(n1, n2);
            //   self._SameParts(n1,n2);
        }
        else
        {
            // self._onlyPart(n1);
        }
    });

    if (diag1.model instanceof go.GraphLinksModel)
    {
        a1 = diag1.model.linkDataArray;
        if (a1.length > 0 && diag1.model.linkKeyProperty === "")
        {
            throw new Error("Diagram1's model does not have linkKeyProperty set to a non-empty string");
        }

        a1.forEach(function(d1) {
            var k = diag1.model.getKeyForLinkData(d1);
            var l1 = diag1.findLinkForData(d1);
            // assume both models use the same keys
            var d2 = diag2.model.findLinkDataForKey(k);
            var l2 = diag2.findLinkForData(d2);
            if (l2 !== null)
            {
                self._diffParts(l1,l2);
            }
            else
            {
                // self._onlyPart(l1);
            }
        });
    }

    var a2 = diag2.model.nodeDataArray;
    a2.forEach(function(d2) {
        var k = diag2.model.getKeyForNodeData(d2);
        var n2 = diag2.findNodeForData(d2);
        // assume both models use the same keys
        var d1 = diag1.model.findNodeDataForKey(k);
        var n1 = diag1.findNodeForData(d1);
        if (n1 !== null)
        {
            self._diffParts(n1,n2);
        }
        else
        {
            // self._onlyPart(n2);
        }
    });

    if (diag2.model instanceof go.GraphLinksModel)
    {
        a2 = diag2.model.linkDataArray;
        if (a2.length > 0 && diag2.model.linkKeyProperty === "")
        {
            throw new Error("Diagram2's model does not have linkKeyProperty set to a non-empty string");
        }
        a2.forEach(function(d2) {
            var k = diag2.model.getKeyForLinkData(d2);
            var l2 = diag2.findLinkForData(d2);
            // assume both models use the same keys
            var d1 = diag1.model.findLinkDataForKey(k);
            var l1 = diag1.findLinkForData(d1);
            if (l1 !== null)
            {
                self._diffParts(l1,l2);
            }
            else
            {
                // self._onlyPart(l2);
            }
        });
    }

    diag1.commitTransaction();
    diag1.skipsUndoManager = false;
    diag2.commitTransaction();
    diag2.skipsUndoManager = false;
}

VisualDifferencer.prototype._propertiesList = function(data)
{
    var str = "";

    for (var p in data)
    {
        if (p === "__gohashid")
        {
            continue;
        }

        if (str !== "")
        {
            str += "\n";
        }

        str += p + ": " + data[p].toString();
    }
    return str;
}

VisualDifferencer.prototype._addAdornment = function(part, adtempl)
{
    var ad = adtempl.copy();
    if (part instanceof go.Link && part.path !== null)
    {
        ad.adornedObject = part.path;
        ad.location = part.path.getDocumentPoint(go.Spot.TopLeft);
    }
    else
    {
        ad.adornedObject = part;
        ad.location = part.position;
    }
    //ad.placeholder.desiredSize = part.actualBounds.size;
    part.addAdornment("VisualDifferencer", ad);
}

VisualDifferencer.prototype._onlyPart = function(part)
{
    part.opacity = 1.0;
    // if (part.diagram === this._diagram1) {
      // part.toolTip = this.RemovedToolTip;
    //   if (part instanceof go.Link) {
    //     // this._addAdornment(part, this.RemovedLinkAdornmentTemplate);
    //   } else {
    //     // this._addAdornment(part, this.RemovedAdornmentTemplate);
    //   }
    // } else {
    //   part.toolTip = this.AddedToolTip;
    //   if (part instanceof go.Link) {
    //     // this._addAdornment(part, this.AddedLinkAdornmentTemplate);
    //   } else {
    //     // this._addAdornment(part, this.AddedAdornmentTemplate);
    //   }
    // }
}

VisualDifferencer.prototype._SameParts = function(part1, part2)
{
    // only considering differences in model data
    if (this._areValuesDifferent(part1.data, part2.data))
    {
        // part1.opacity = 0.15;
        // part2.opacity = 0.15;
        // part1.toolTip = this.ChangedToolTip;
        // part2.toolTip = this.ChangedToolTip;
        if (part1 instanceof go.Link)
        {
            this._addAdornment(part1, this.ChangedLinkAdornmentTemplate);
        }
        else
        {
            this._addAdornment(part1, this.ChangedAdornmentTemplate);
        }

        if (part2 instanceof go.Link)
        {
            this._addAdornment(part2, this.ChangedLinkAdornmentTemplate);
        }
        else
        {
            this._addAdornment(part2, this.ChangedAdornmentTemplate);
        }

    }
    else
    {
        // if they're the same, de-emphasize them
        part1.opacity = 1.0;
        part2.opacity = 1.0;
        part1.toolTip = part2.toolTip = true;
        // part1.removeAdornment("VisualDifferencer");
        // part2.removeAdornment("VisualDifferencer");
    }
}

VisualDifferencer.prototype._diffParts = function(part1, part2)
{
    // only considering differences in model data
    if (this._areValuesDifferent(part1.data, part2.data))
    {
        part1.opacity = 1.0;
        part2.opacity = 1.0;
        part1.toolTip = this.ChangedToolTip;
        part2.toolTip = this.ChangedToolTip;
        // if (part1 instanceof go.Link) {
        //   this._addAdornment(part1, this.ChangedLinkAdornmentTemplate);
        // } else {
        //   this._addAdornment(part1, this.ChangedAdornmentTemplate);
        // }
        // if (part2 instanceof go.Link) {
        //   this._addAdornment(part2, this.ChangedLinkAdornmentTemplate);
        // } else {
        //   this._addAdornment(part2, this.ChangedAdornmentTemplate);
        // }
    }
    else
    {
        // if they're the same, de-emphasize them
        part1.opacity = 0.15;
        part2.opacity = 0.15;
        part1.toolTip = part2.toolTip = null;
        part1.removeAdornment("VisualDifferencer");
        part2.removeAdornment("VisualDifferencer");
    }
}

VisualDifferencer.prototype._areValuesDifferent = function(val1, val2)
{
    if (val1 === val2)
    {
        return false;
    }

    if (Array.isArray(val1) && Array.isArray(val2))
    {
        return this._areArraysDifferent(val1, val2);
    }

    if (typeof val1 === "object" && typeof val2 === "object")
    {
        return this._areObjectsDifferent(val1, val2);
    }

    // NaN !== NaN, but treat as same
    if (typeof val1 === "number" && isNaN(val1) && typeof val2 === "number" && isNaN(val2))
    {
        return false;
    }

    return true;
}

VisualDifferencer.prototype._areObjectsDifferent = function(obj1, obj2)
{
    if (obj1 === obj2)
    {
        return false;
    }

    // allow object-specific equality test
    if (typeof obj1["equals"] === "function" && typeof obj2["equals"] === "function")
    {
      return !obj1["equals"](obj2);
    }

    // see if there are any properties on OBJ1 that aren't on OBJ2 or have different values
    for (var p in obj1)
    {
        if (p === "__gohashid")
        {
            continue;
        }
        if (this._areValuesDifferent(obj1[p], obj2[p]))
        {
            return true;
        }
    }

    // see if there are any properties on OBJ2 that aren't on OBJ1
    for (var q in obj2)
    {
        if (q === "__gohashid")
        {
            continue;
        }

        if (obj1[q] === undefined && obj2[q] !== undefined)
        {
            return true;
        }
    }

    return false;

}

VisualDifferencer.prototype._areArraysDifferent = function(arr1, arr2)
{
    if (arr1 === arr2)
    {
        return false;
    }

    if (arr1.length !== arr2.length)
    {
        return true;
    }

    for (var i = 0; i < arr1.length; i++)
    {
        if (this._areValuesDifferent(arr1[i], arr2[i]))
        {
            return true;
        }
    }

    return false;
}

/**
* Stop showing the differences between the two diagrams/models.
*/
VisualDifferencer.prototype.stop = function()
{
    if (this._isRunning)
    {
        this._isRunning = false;
        var diag1 = this._diagram1;
        var diag2 = this._diagram2;
        this._setOpacities(diag1, false);
        this._setOpacities(diag2, false);
        this._originalOpacities.clear();
        this._originalToolTips.clear();
        diag1.removeDiagramListener("ViewportBoundsChanged", this._updateOtherDiagram);
        diag2.removeDiagramListener("ViewportBoundsChanged", this._updateOtherDiagram);
    }
}

VisualDifferencer.prototype._setOpacities = function(diag, save)
{
    var omap = this._originalOpacities;
    var ttmap = this._originalToolTips;
    diag.skipsUndoManager = true;
    diag.startTransaction();

    diag.layers.each(function(l) {
        if (save)
        {
            omap.set(l, l.opacity);
        }
        else
        {
            l.opacity = omap.get(l);
        }

        l.parts.each(function(p) {
            if (save)
            {
                omap.set(p, p.opacity);
                ttmap.set(p, p.toolTip);
            }
            else
            {
                p.opacity = omap.get(p);
                p.toolTip = ttmap.get(p);
                p.removeAdornment("VisualDifferencer");
            }
        });
    });
    diag.commitTransaction("");
    diag.skipsUndoManager = false;
}

// end VisualDifferencer
function WheelLayout()
{
    go.CircularLayout.call(this);
}

go.Diagram.inherit(WheelLayout, go.CircularLayout);

// override makeNetwork to set the diameter of each node and ignore the TextBlock label
WheelLayout.prototype.makeNetwork = function (coll)
{
    var net = go.CircularLayout.prototype.makeNetwork.call(this, coll);

    net.vertexes.each(function (cv) {
        cv.diameter = 20;  // because our desiredSize for nodes is (20, 20)
    });

    return net;
}

// override commitNodes to rotate nodes so the text goes away from the center,
// and flip text if it would be upside-down
WheelLayout.prototype.commitNodes = function ()
{
    go.CircularLayout.prototype.commitNodes.call(this);
    this.network.vertexes.each(function (v) {
        var node = v.node;
        if (node === null)
        {
            return;
        }
        // get the angle of the node towards the center, and rotate it accordingly
        var a = v.actualAngle;
        if (a > 90 && a < 270)
        {
            // make sure the text isn't upside down
            var textBlock = node.findObject("TEXTBLOCK");
            textBlock.angle = 180;
        }

        node.angle = a;
    });

};

// override commitLinks in order to make sure all of the Bezier links are "inside" the ellipse;
// this helps avoid links crossing over any other nodes
WheelLayout.prototype.commitLinks = function ()
{
    go.CircularLayout.prototype.commitLinks.call(this);
    if (this.network.vertexes.count > 4)
    {
        this.network.vertexes.each(function (v) {
            v.destinationEdges.each(function (de) {

                var dv = de.toVertex;
                var da = dv.actualAngle;
                var sa = v.actualAngle;

                if (da - sa > 180)
                {
                    da -= 360;
                }
                else if (sa - da > 180)
                {
                    sa -= 360;
                }

                de.link.curviness = (sa > da) ? 15 : -15;
            })
        })
    }
}
// end WheelLayout class

var highlightColor = "red";  // color parameterization

function init(nodes, edges)
{
    if (window.goSamples)
    {
        goSamples();  // init for these samples -- you don't need to call this
    }

    var $ = go.GraphObject.make;  // for conciseness in defining templates

    myDiagram =
    $(go.Diagram, "myDiagramDiv", // must be the ID or reference to div
    {
        initialAutoScale: go.Diagram.Uniform,
        padding: 10,
        contentAlignment: go.Spot.Center,
        layout:
            $(WheelLayout,  // set up a custom CircularLayout
            // set some properties appropriate for this sample
            {
                arrangement: go.CircularLayout.ConstantDistance,
                nodeDiameterFormula: go.CircularLayout.Circular,
                spacing: 10,
                aspectRatio: 0.7,
                sorting: go.CircularLayout.Optimized
            }),
            "undoManager.isEnabled": true,
            // "animationManager.isInitial": false,
            // "animationManager.isEnabled" : true,
            "ModelChanged": function(e) {     // just for demonstration purposes,
                if (e.isTransactionFinished) {  // show the model data in the page's TextArea
                    document.getElementById("mySavedModel1").textContent = e.model.toJson();
                }
            },
        click:
            function (e) {  // background click clears any remaining highlighteds
                e.diagram.startTransaction("clear");
                e.diagram.clearHighlighteds();
                e.diagram.commitTransaction("clear");
            }
    });

    myDiagram2 =
    $(go.Diagram, "myDiagramDiv2", // must be the ID or reference to div
    {
        initialAutoScale: go.Diagram.Uniform,
        padding: 10,
        contentAlignment: go.Spot.Center,
        layout:
            $(WheelLayout,  // set up a custom CircularLayout
            // set some properties appropriate for this sample
            {
                arrangement: go.CircularLayout.ConstantDistance,
                nodeDiameterFormula: go.CircularLayout.Circular,
                spacing: 10,
                aspectRatio: 0.7,
                sorting: go.CircularLayout.Optimized
            }),
            "undoManager.isEnabled": true,
            // "animationManager.isInitial": false,
            "ModelChanged": function(e) {     // just for demonstration purposes,
                if (e.isTransactionFinished) {  // show the model data in the page's TextArea
                    document.getElementById("mySavedModel2").textContent = e.model.toJson();
                }
            },
        click:
            function (e) {  // background click clears any remaining highlighteds
                e.diagram.startTransaction("clear");
                e.diagram.clearHighlighteds();
                e.diagram.commitTransaction("clear");
            }
    });

    // define the Node template
    myDiagram.nodeTemplate =
    $(go.Node, "Horizontal",
    {
        selectionAdorned: false,
        locationSpot: go.Spot.Center,  // Node.location is the center of the Shape
        locationObjectName: "SHAPE",
        mouseEnter:
            function (e, node) {
                node.diagram.clearHighlighteds();
                node.linksConnected.each(function (l) { highlightLink(l, true); });
                node.isHighlighted = false;
                var tb = node.findObject("TEXTBLOCK");
                if (tb !== null)
                {
                    tb.stroke = highlightColor;
                }
            },
        mouseLeave:
            function (e, node) {
                node.diagram.clearHighlighteds();
                var tb = node.findObject("TEXTBLOCK");
                if (tb !== null)
                {
                    tb.stroke = "black";
                }
            }
      },

        new go.Binding("text", "key"),  // for sorting the nodes
        $(go.Shape, "RoundedRectangle",
        {
            name: "SHAPE",
            fill: "#fba69d",  // default value, but also data-bound
            stroke: "transparent",  // modified by highlighting
            strokeWidth: 2,
            desiredSize: new go.Size(20, 20),
            portId: ""
        },  // so links will go to the shape, not the whole node
        new go.Binding("fill", "color"),
        new go.Binding("stroke", "isHighlighted",
            function (h)
            {
                return h ? highlightColor : "transparent";
            }
        ).ofObject()),
        $(go.TextBlock,
            {
                name: "TEXTBLOCK"
            },  // for search
        new go.Binding("text", "key"))
    );

    myDiagram2.nodeTemplate =
    $(go.Node, "Horizontal",
    {
        selectionAdorned: false,
        locationSpot: go.Spot.Center,  // Node.location is the center of the Shape
        locationObjectName: "SHAPE",
        mouseEnter: function (e, node)
        {
            node.diagram.clearHighlighteds();
            node.linksConnected.each(function (l) { highlightLink(l, true); });
            node.isHighlighted = false;
            var tb = node.findObject("TEXTBLOCK");
            if (tb !== null)
            {
                tb.stroke = highlightColor;
            }
        },
        mouseLeave: function (e, node)
        {
            node.diagram.clearHighlighteds();
            var tb = node.findObject("TEXTBLOCK");
            if (tb !== null)
            {
                tb.stroke = "black";
            }
        }
    },
    new go.Binding("text", "key"),  // for sorting the nodes
    $(go.Shape, "RoundedRectangle",
    {
        name: "SHAPE",
        // fill: "#057c6e",  // default value, but also data-bound
        fill: "#138686",
        stroke: "transparent",  // modified by highlighting
        strokeWidth: 2,
        desiredSize: new go.Size(20, 20),
        portId: ""
    },  // so links will go to the shape, not the whole node
        new go.Binding("fill", "color"),
        new go.Binding("stroke", "isHighlighted",
            function (h)
            {
                return h ? highlightColor : "transparent";
            }
        ).ofObject()
    ),
      $(go.TextBlock,
        { name: "TEXTBLOCK" },  // for search
        new go.Binding("text", "key"))
    );

    function highlightLink(link, show)
    {
        link.isHighlighted = show;
        link.fromNode.isHighlighted = show;
        link.toNode.isHighlighted = show;
    }

    // define the Link template
    myDiagram.linkTemplate =
    $(
        go.Link,
        {
            routing: go.Link.Normal,
            curve: go.Link.Bezier,
            selectionAdorned: false,
            mouseEnter: function (e, link) { highlightLink(link, false); },
            mouseLeave: function (e, link) { highlightLink(link, false); }
        },
        $(
            go.Shape,
            new go.Binding
            (
                "stroke",
                "isHighlighted",
                function (h, shape)
                {
                    return h ? highlightColor : "black";
                }
            ).ofObject(),
            new go.Binding
            (
                "strokeWidth",
                "isHighlighted",
                function (h)
                {
                    return h ? 2 : 1;
                }
            ).ofObject()
        ),
        $(
            go.Shape,
            {
                toArrow: "Standard",
                stroke: null
            },
            new go.Binding("fill", "color")
        )
      // no arrowhead -- assume directionality of relationship need not be shown
    );


    //generateGraph2();

    myDiagram2.linkTemplate =
    $(
        go.Link,
        {
            routing: go.Link.Normal,
            curve: go.Link.Bezier,
            selectionAdorned: false,
            mouseEnter: function (e, link)
            {
                highlightLink(link, false);
            },
            mouseLeave: function (e, link)
            {
                highlightLink(link, false);
            }
        },
        $(
            go.Shape,
            new go.Binding(
                "stroke",
                "isHighlighted",
                function (h, shape)
                {
                    return h ? highlightColor : "black";
                }
            ).ofObject(),
            new go.Binding(
                "strokeWidth",
                "isHighlighted",
                function (h)
                {
                    return h ? 2 : 1;
                }
            ).ofObject()
        ),
        $(
            go.Shape,
            {
                toArrow: "Standard",
                stroke: null
            },
            new go.Binding(
                "fill",
                "color"
            )
        )
        // no arrowhead -- assume directionality of relationship need not be shown
    );

    generateGraph(nodes, edges);

}

function generateGraph(nodes, edges)
{
    console.log("Test");
    var sc1_id = document.getElementById("scenario1-list").selectedIndex;
    console.log(sc1_id);
    var sc2_id = document.getElementById("scenario2-list").selectedIndex;
    console.log(sc2_id);

    var sc1_nodes = nodes;
    var sc1_edges = edges;

    var sc2_nodes = nodes;
    var sc2_edges = edges;

    var nodeArray = [];
    var linkArray = [];

    sc1_nodes_arr = sc1_nodes[sc1_id];
    console.log(sc1_nodes_arr);



  // var arr = {{ sc1_nodes| safe }};
  // console.log(arr[0]);
// <!--      var arr = ['FormCreate', 'AddModule', 'AddModel', 'LoadCRHM', 'Accept', 'UpDateModelMenu', 'UpDateHelpMenu', 'Convert', 'TAnalysis', 'FormActivate', 'FileExistsSp', 'OnHint', 'PrjOpenClick', 'DoPrjOpen', 'ObsCloseClick', '', 'WMMainUpdateDim', 'UpdateDim', 'MacroLoad', 'ClearModules', 'FindFileName', 'OpenObsFile', 'DataReadFile', 'Classmacro', 'review_HRU_OBS', 'addfilter', 'readargs', 'error', 'WMLogException', 'LogError', '~Classfilter', 'Encode24', 'Veto_Freq', 'fixup', 'WMMainUpdateStatus', 'execute', 'doFunctions', 'doFunc', '~Classmacro', 'IndexOf', 'CheckforModule', 'InitModules', 'decl', 'Variation_Skip', 'CheckUnitsString', 'AKAhook', 'Myparser', 'eval_exp', 'get_token', 'eval_exp2', 'eval_exp3', 'eval_exp4', 'eval_exp5', 'eval_exp6', 'atom', 'ParseDivUnitExpr', 'ParseMulUnitExpr', 'ParsePowUnitExpr', 'ParseUnitPhase1', 'ParseUnitPhase2', 'LookupUnit', 'ExpandUnitExpr', 'SetBasicUnit', 'MulUnitK', 'PowUnit', 'quickPow', 'MulUnit', 'DivUnit', 'CheckUnitsObs', 'declobsfunc', 'declgetvar', 'declputvar', 'Label4Click', 'Variation_Decide', 'DeclObsName', 'ClassPar', 'SetSharedParams', 'Change', '~ClassPar', 'Same', 'SqueezeParams', 'PrjExitClick']-->
    for (var i in sc1_nodes_arr)
    {

        nodeArray.push(
            {
                key: sc1_nodes_arr[i]
                // text: sc1_nodes_arr[i],
                // fill: go.Brush.red,
                // color: go.Brush.lightgreen,
                //   color: go.Brush.randomColor(128, 240)
            }
        );

    }

    console.log(nodeArray);
    sc1_edges_arr = sc1_edges[sc1_id];
    console.log(sc1_edges_arr);
    // console.log(sc1_edges_arr[1])

    // var edgegrp1 = {};
    // edgegrp1 = {{ sc1_edges|safe }};


    // <!--      var arr1 = {'FormCreate' : 'FormCreate', 'FormCreate': 'AddModule', 'FormCreate': 'AddModel', 'FormCreate': 'LoadCRHM', 'FormCreate': 'Accept', 'FormCreate': 'UpDateModelMenu', 'UpDateModelMenu':'UpDateHelpMenu' , 'DataReadFile': 'Classmacro','DataReadFile': 'review_HRU_OBS', 'DataReadFile': 'addfilter', 'DataReadFile': 'Encode24', 'DataReadFile': 'Veto_Freq', 'DataReadFile': 'fixup', 'DataReadFile': 'WMMainUpdateStatus', 'DataReadFile': 'execute', 'DataReadFile': '~Classmacro', 'addfilter': 'readargs', 'addfilter': '~Classfilter', 'readargs': 'error', 'readargs': 'review_HRU_OBS', 'error': 'WMLogException', 'WMLogException': 'LogError'}-->

    for (var i in sc1_edges_arr)
    {
        // console.log(sc1_edges_arr[i])
        // for(var elem in sc1_edges_arr[i])
        // {
        //     console.log(elem);
            // var words = sc1_edges_arr[i].split(" ");
            // var from = words[0];
            // console.log(from)
            // var to = words[2]
        linkArray.push(
            {
                from: sc1_edges_arr[i][0],
                to: sc1_edges_arr[i][1]
            }
        );

    }

    console.log(linkArray);

    var nodeArray2 =[];
    var linkArray2 = [];

    sc2_nodes_arr = sc2_nodes[sc2_id];
    sc2_edges_arr= sc2_edges[sc2_id];

    // var array = {{sc2_nodes|safe}};
    // console.log(array.toString());
    // <!--      var arr = ['FormCreate', 'AddModule', 'AddModel', 'LoadCRHM', 'Accept', 'UpDateModelMenu', 'UpDateHelpMenu', 'Convert', 'TAnalysis', 'FormActivate', 'FileExistsSp', 'OnHint', 'PrjOpenClick', 'DoPrjOpen', 'ObsCloseClick', '', 'WMMainUpdateDim', 'UpdateDim', 'MacroLoad', 'ClearModules', 'FindFileName', 'OpenObsFile', 'DataReadFile', 'Classmacro', 'review_HRU_OBS', 'addfilter', 'readargs', 'error', 'WMLogException', 'LogError', '~Classfilter', 'Encode24', 'Veto_Freq', 'fixup', 'WMMainUpdateStatus', 'execute', 'doFunctions', 'doFunc', '~Classmacro', 'IndexOf', 'CheckforModule', 'InitModules', 'decl', 'Variation_Skip', 'CheckUnitsString', 'AKAhook', 'Myparser', 'eval_exp', 'get_token', 'eval_exp2', 'eval_exp3', 'eval_exp4', 'eval_exp5', 'eval_exp6', 'atom', 'ParseDivUnitExpr', 'ParseMulUnitExpr', 'ParsePowUnitExpr', 'ParseUnitPhase1', 'ParseUnitPhase2', 'LookupUnit', 'ExpandUnitExpr', 'SetBasicUnit', 'MulUnitK', 'PowUnit', 'quickPow', 'MulUnit', 'DivUnit', 'CheckUnitsObs', 'declobsfunc', 'declgetvar', 'declputvar', 'Label4Click', 'Variation_Decide', 'DeclObsName', 'ClassPar', 'SetSharedParams', 'Change', '~ClassPar', 'Same', 'SqueezeParams', 'PrjExitClick']-->
    for (var i in sc2_nodes_arr)
    {
        nodeArray2.push(
            {
                key: sc2_nodes_arr[i]
                // text: sc2_nodes_arr[i],
                // color: go.Brush.lightblue,
                //   color: go.Brush.randomColor(128, 240)
            }
        );
    }


    // var edgegrp2= {};
    // edgegrp2= {{sc2_edges|safe}};

    for (var i in sc2_edges_arr)
    {
        // console.log(sc1_edges_arr[i])
        // for(var elem in sc1_edges_arr[i])
        // {
        //     console.log(elem);
        // var words = sc1_edges_arr[i].split(" ");
        // var from = words[0];
        // console.log(from)
        // var to = words[2]
        linkArray2.push(
            {
                from: sc2_edges_arr[i][0],
                to: sc2_edges_arr[i][1]
            }
        );

    }

    // window.custom = false;
    myDiagram.animationManager.initialAnimationStyle = go.AnimationManager.None;
    myDiagram.addDiagramListener(
        'InitialAnimationStarting',
        function(e)
        {
            var animation = e.subject.defaultAnimation;
            animation.easing = go.Animation.EaseOutExpo;
            animation.duration = 1500;
            // animation.add(e.diagram, 'scale', 0.01, 1);
            animation.add(e.diagram, 'opacity', 0, 1);
        }
    );

    myDiagram2.animationManager.initialAnimationStyle = go.AnimationManager.None;
    myDiagram2.addDiagramListener(
        'InitialAnimationStarting',
        function(e)
        {
            var animation = e.subject.defaultAnimation;
            animation.easing = go.Animation.EaseOutExpo;
            animation.duration = 1500;
            // animation.add(e.diagram, 'scale', 0.01,1);
            animation.add(e.diagram, 'opacity', 0, 1);
        }
    );
    myDiagram.model = new go.GraphLinksModel(nodeArray, linkArray);
    myDiagram.model.linkKeyProperty = "key";
    //     zoomSlider = new ZoomSlider(myDiagram);
    myDiagram2.model = new go.GraphLinksModel(nodeArray2, linkArray2);
    myDiagram2.model.linkKeyProperty = "key";
    //   zoomSlider = new ZoomSlider(myDiagram2);
    match =new VisualMatched(myDiagram,myDiagram2);
    myDiff = new VisualDifferencer(myDiagram, myDiagram2);
}

// function generateGraph2()
// {
// var nodeArray2 =[];
//   var linkArray2 = [];
//
//   var array = {{nodegrp2|safe}};
//   console.log(array.toString());
//     // <!--      var arr = ['FormCreate', 'AddModule', 'AddModel', 'LoadCRHM', 'Accept', 'UpDateModelMenu', 'UpDateHelpMenu', 'Convert', 'TAnalysis', 'FormActivate', 'FileExistsSp', 'OnHint', 'PrjOpenClick', 'DoPrjOpen', 'ObsCloseClick', '', 'WMMainUpdateDim', 'UpdateDim', 'MacroLoad', 'ClearModules', 'FindFileName', 'OpenObsFile', 'DataReadFile', 'Classmacro', 'review_HRU_OBS', 'addfilter', 'readargs', 'error', 'WMLogException', 'LogError', '~Classfilter', 'Encode24', 'Veto_Freq', 'fixup', 'WMMainUpdateStatus', 'execute', 'doFunctions', 'doFunc', '~Classmacro', 'IndexOf', 'CheckforModule', 'InitModules', 'decl', 'Variation_Skip', 'CheckUnitsString', 'AKAhook', 'Myparser', 'eval_exp', 'get_token', 'eval_exp2', 'eval_exp3', 'eval_exp4', 'eval_exp5', 'eval_exp6', 'atom', 'ParseDivUnitExpr', 'ParseMulUnitExpr', 'ParsePowUnitExpr', 'ParseUnitPhase1', 'ParseUnitPhase2', 'LookupUnit', 'ExpandUnitExpr', 'SetBasicUnit', 'MulUnitK', 'PowUnit', 'quickPow', 'MulUnit', 'DivUnit', 'CheckUnitsObs', 'declobsfunc', 'declgetvar', 'declputvar', 'Label4Click', 'Variation_Decide', 'DeclObsName', 'ClassPar', 'SetSharedParams', 'Change', '~ClassPar', 'Same', 'SqueezeParams', 'PrjExitClick']-->
//   for (var i in array) {
//
//     nodeArray2.push({
//
//       key: i,
//       text: array[i].toString(),
//       color: go.Brush.randomColor(128, 240),
//       linkKeyProperty: array[i]
//     });
//
//   }
//
//
//     var edgegrp2= {};
//
//   for (i in edgegrp2) {
//
//          var words = edgegrp2[i].split(" ");
//          var from = words[0];
//          var to =words[2]
//          linkArray2.push(
//           {from: from, to: to,routing: go.Link.Normal ,color: go.Brush.randomColor(0, 127)}
//
//         );
//
//     }
//    myDiagram2.model = new go.GraphLinksModel(nodeArray2, linkArray2);
//
//    myDiff = new VisualDifferencer(myDiagram, myDiagram2);
//
// }

// Exchange the two Diagrams' DIVs zIndex.  Only the front-most DIV/Diagram will receive mouse input.
function swapDiagramsZOrder()
{
    var div1 = myDiagram.div;
    var div2 = myDiagram2.div;
    var temp = div1.style.zIndex;
    div1.style.zIndex = div2.style.zIndex;
    div2.style.zIndex = temp;
}


// Show one Diagram or both, depending on radio button value.
function toggleDiagram(diagnum)
{
    var div1 = myDiagram.div;
    var div2 = myDiagram2.div;
    div1.style.display = (diagnum == 1 || diagnum == 3) ? "inline" : "none";
    div2.style.display = (diagnum == 2 || diagnum == 3) ? "inline" : "none";
}

function showDiagrams()
{

    generateGraph();
    // var sc1_id = document.getElementById("scenario1-list").selectedIndex;
    // var sc2_id = document.getElementById("scenario2-list").selectedIndex;
    // var node_c = document.getElementById("node_count");
    // var comp_index = document.getElementById("comp").selectedIndex;
    // node_c.innerTML= total_node_list[sc1_id][sc2_id][0];
    //
    var sc1_id = document.getElementById("scenario1-list").selectedIndex;
    var sc2_id = document.getElementById("scenario2-list").selectedIndex;
    //var node_c1 = document.getElementById("node_count_1");
    //var node_c2 = document.getElementById("node_count_2");
    var comp_index = document.getElementById("comp").selectedIndex;
    // node_c1.innerTML= total_node_list[sc1_id][sc1_id][sc1_id][0];
    // node_c2.innerTML= total_node_list[sc2_id][sc2_id][sc2_id][0];
    // if(sc1_id==sc2_id)
    // {
    //
    //         node_c1.innerText= total_node_list[sc1_id][sc2_id][sc1_id][1];
    //         // console.log(total_node_list[sc1_id][sc1_id][sc1_id][1])
    //         node_c2.innerText= total_node_list[sc1_id][sc2_id][2][1];
    // }


    if (comp_index==1)
    {
        // myDiff.stop();
        myDiff.stop();
        match.start();
        //      node_c1.innerText= "Scenario 1  ( Node Count of Scenario 1 : " + total_node_list[sc1_id][sc2_id][0][1] + ")";
        // console.log(total_node_list[sc1_id][sc1_id][sc1_id][1])
        //    node_c2.innerText= "Scenario 2  ( Node Count of Scenario 2 :  " + total_node_list[sc1_id][sc2_id][1][1] + ")";
        // console.log(total_node_list[sc2_id][sc2_id][sc1_id][1])
    }
    else if (comp_index==2)
    {
        myDiff.stop();
        myDiff.start();
        //  node_c1.innerText= "Scenario 1  ( Node Count of Scenario 1 : " + total_node_list[sc1_id][sc2_id][0][2] + ")";
        // console.log(total_node_list[sc1_id][sc2_id][1][2]);
        //node_c2.innerText= "Scenario 2  ( Node Count of Scenario 2 : " +total_node_list[sc1_id][sc2_id][1][2]+ ")";
        // console.log(total_node_list[1][1][1][2]);
        // console.log(total_node_list[sc1_id][sc2_id][2][2]);
    }
    else if (comp_index==3)
    {
        show_chart();
        //node_c1.innerText= "Scenario 1  ( Node Count of Scenario 1 : "+ total_node_list[sc1_id][sc2_id][0][0]+ ")";
        // console.log(total_node_list[sc1_id][sc1_id][sc1_id][0])
        //node_c2.innerText= "Scenario 2  ( Node Count of Scenario 2 : " +total_node_list[sc1_id][sc2_id][1][0]+ ")";
        //
    }
    else
    {
        myDiff.stop();
        //node_c1.innerText= "Scenario 1  ( Node Count of Scenario 1 : " +total_node_list[sc1_id][sc2_id][0][0] +  ")";
        // console.log(total_node_list[sc1_id][sc1_id][sc1_id][0])
        //node_c2.innerText= "Scenario 2  ( Node Count of Scenario 2 : "+ total_node_list[sc1_id][sc2_id][1][0]+ ")";
        // console.log(total_node_list[sc1_id][sc1_id][sc1_id][0])
    }

}



// Called when a "showDiagramRadio" button changes.
//   function showDiagrams() {
//     var radio = document.getElementsByName("showDiagramsRadio");
//     for (var i = 0; i < radio.length; i++) {
//       if (radio[i].checked) {
//         toggleDiagram(radio[i].value);
// <!--        break;-->
//       }
//     }
//   }




//     for (var i = 0; i < radio.length; i++) {
//       if (radio[i].checked) {
//         toggleDiagram(radio[i].value);
// <!--        break;-->
//       }
//   }
// }
//
