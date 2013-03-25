
function get(prop, def) {
    return function (o) {
        if (prop in o) {
            return o[prop];
        } else {
            return def;
        }
    };
}

function bind(type, handler) {
    return function(d, i) {
        var el = this;
        el.addEventListener(type, function(e) {
            handler.call(el, e, d, i);
        });
    };
}

function cat() {
    var args = Array.prototype.slice.call(arguments);
    return function(o) {
        var ret = '';
        args.forEach(function(arg) {
            if (typeof arg === 'function') {
                ret += arg.call(null, o)
            } else {
                ret += arg
            }
        });
        return ret;
    }
}

function ident(d) { return d; };

/* Python(ish) string formatting:
 * >>> format('{0}', ['zzz'])
 * "zzz"
 * >>> format('{0}{1}', 1, 2)
 * "12"
 * >>> format('{x}', {x: 1})
 * "1"
 */
var format = (function() {
    var re = /\{([^}]+)\}/g;
    return function(s, args) {
        if (!s) {
            throw "Format string is empty!";
        }
        if (!args) return;
        if (!(args instanceof Array || args instanceof Object))
            args = Array.prototype.slice.call(arguments, 1);
        return s.replace(re, function(_, match){ return args[match]; });
    };
})();
function template(s) {
    if (!s) {
        throw "Template string is empty!";
    }
    return function(args) { return format(s, args); };
}



/* Objects */
var Asset = {
    dragstart: bind('dragstart', function(e, d) {
        e.dataTransfer.setData('url', d.url);
    })
};


var proj = {
    width: 320,
    height: 480,
    pages: [
        {
            id: 'home',
            src: 'home.jpg',
            links: [
                {
                    top: 0,
                    left: 0,
                    width: 50,
                    height: 50,
                    href: 'search'
                }
            ]
        },
        {
            id: 'search',
            src: 'search.jpg',
            links: [
                {
                    top: 50,
                    left: 0,
                    width: 50,
                    height: 50,
                    href: 'home'
                }
            ]
        }
    ]
};

var assets = [];

var currentPage = proj.pages[0];

function updateUI() {

    var pages = d3.select('#pages').selectAll('li.page')
        .data(proj.pages)

    pages.enter().insert('li', '.add')
        .text(get('id'))
        .attr('class', 'page')
        .on('click', function(d) {
            currentPage = d;
            updateUI();
        });

    pages.classed('active', function(d) { return d === currentPage; });

    displayPage(currentPage);

    d3.select('#assets ul').selectAll('li.asset')
        .data(assets)
        .enter().insert('li', '.add')
            .attr('title', get('name'))
            .attr('class', 'asset')
            .attr('draggable', 'true')
            .each(Asset.dragstart)
            .style('max-height', function (d) {
                return d.height * 160 / d.width + 'px';
            })
            .style('background-image', cat('url(',get('url'),')'))
            .append('img')
                .attr('src', get('url'));

}

function displayPage(p) {
    d3.select('#doc').html('').selectAll('section')
        .data([p])
        .enter().append('section')
            .style('width', proj.width + 'px')
            .style('height', proj.height + 'px')
            .call(renderPage);
}

function renderPage(p) {
    p.append('img')
        .attr('src', get('src'))

    p.selectAll('a')
        .data(get('links', []))
        .enter().append('a')
            .attr('class', 'region')
            .style('top', cat(get('top'), 'px'))
            .style('left', cat(get('left'), 'px'))
            .style('width', cat(get('width'), 'px'))
            .style('height', cat(get('height'), 'px'))
            .attr('href', cat('#', get('href')))
}

updateUI();

proj.pages.push({id: 'detail'});
proj.pages.push({id: 'purchase'});

updateUI();

var fileSelect = document.querySelector('#assets .add'),
    fileElem = document.getElementById("uploadAsset");
    fileElem.onchange = function(e) {
        var files = this.files;
        for (var i=0; i<files.length; i++) {
            (function(f) {
                var i = new Image();
                var url = URL.createObjectURL(f);
                i.src = url;
                i.onload = function() {
                    assets.push({
                        name: f.name,
                        url: url,
                        width: i.width,
                        height: i.height
                    });
                    updateUI();
                };
            })(files[i]);
        }
    };

fileSelect.addEventListener("click", function (e) {
  if (fileElem) {
    fileElem.click();
  }
  e.preventDefault();
});


d3.select('#doc').each(bind('drop', function(e, d) {
    e.stopPropagation();
    e.preventDefault();
    var data = e.dataTransfer.getData('url');
    currentPage.src = data;
    updateUI();
    return false;
})).each(bind('dragover', function(e) {
    e.dataTransfer.dropEffect = 'move';
    e.preventDefault();
    return false;
}));
        // .bind('drop', function (e) {
        //     e.preventDefault();
        //     var files = e.originalEvent.dataTransfer.files,
        // reader = new FileReader();
        // reader.onload = function(e) {
        // var el = "<li><div><img src='" + e.target.result + "'></div><span>" + f.name + "</span><a class='delete'>x</a></li>";
        // $("#list").append(el);
        //     }
        // for (var i=0; i<files.length; i++) {
        //   var f = files[i];
        //       reader.readAsDataURL(f);
        //     }
        //     setTimeout(redraw,0);
        //  });
