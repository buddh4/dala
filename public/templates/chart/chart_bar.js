(function() {
    var init = function() {
        this.data['chart'] = {
            categories : ['speed', 'rating', 'safety'],
            yLabel : 'Amount',
            max : 10,
            data : {
                'fiat': {
                    'speed': 1.0,
                    'rating': 2.0,
                    'safety': 5.0,
                    'color': 'red'
                },
                'audi': {
                    'speed': 1.0,
                    'rating': 3.0,
                    'safety': 9.0,
                    'color': 'blue'
                }
            }
        };
        this.exec('render');
    };

    var activate = function() {
        //TODO...
    };

    var render = function() {
        var chart = this.data['chart'];
        _renderContent.apply(this);
        _renderDefinitionBar.apply(this);
    };

    var BAR_WIDTH = 10;
    var _renderContent = function() {
        var that = this;
        var svg = this.diagram.svg;
        var chart = this.data['chart'];
        var background = this.getInnerSVG('background');
        var bottomY = background.getBottomY();

        var padding = 20;
        var distance = 4;
        var width = 10;
        var x = background.x();
        var ratio = background.height() / chart.max;
        $.each(chart.categories, function(index, category) {
            x += padding;
            var startX = x;
            $.each(chart.data, function(key, cfg) {
                var bar = that.root.append(svg.rect().height(ratio * cfg[category]).width(width).fill(cfg.color));
                var y = bottomY - bar.height();
                bar.translate(x, y);
                x += bar.width() + distance;
            });

            background.width(x + padding);
            that.root.append(svg.text(category).translate(startX, bottomY + 10).attr('class', 'alignScale'));
        });
    };


    var _renderDefinitionBar = function() {
        var that = this;
        var svg = this.diagram.svg;
        var chart = this.data['chart'];
        var svgBar = this.root.append(svg.g({id: that.getNodeSelector('definition')}));

        var count = 0;
        var padding = 10;
        var x = padding;
        var boxSize = 10;
        $.each(chart.data, function(key, cfg) {
            var definitionGroup = svgBar.append(svg.g().attr('class', 'alignScale').translate(x, padding));
            definitionGroup.append(svg.rect().height(boxSize).width(boxSize).fill(cfg.color));
            var text = definitionGroup.append(svg.text(key).translate(boxSize + padding, 0));
            x += definitionGroup.width() + padding;
        });

        var background = this.getInnerSVG('background');
        //Align to Center
        //TODO: implement svg.alignXCenter / svg.alignCenter / svg.alingYCenter / svg.alingXRight...
        svgBar.translate(background.getCenter().x - (svgBar.width() / 2), background.height() + 20);
    };


    dala.require('templateManager').registerTemplate('chart_bar', {
        description : "Simple Class Template with textareas for methods and attributes",
        svg : '<g><rect id="background_{node_id}" class="alignScaleStroke" height="200px" width="500px" style="fill: url(#test-pattern) #000;stroke:silver;stroke-width:1px;"/></g>',
        dataKey : 'chartData',
        on: {
            'init' : init,
           'render' : render
        },
        resize : [
            {bind:"root", value:"scale", even:true}
        ]
        /*edit: {
            distance : {
                type : "number",
                label : "Distance",
                databind : "distance"
            }
            data : {
                type : "list",
                label : "Attributes",
                databind : "data"
            }
        }*/
    });
})();