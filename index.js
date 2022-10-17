var connect = require('connect'),
    path = require("path"),
    fs = require("fs"),
    url = require("url"),
    Router = require('router'),
    serveStatic = require('serve-static'),
    mustache = require("mustache"),
    requirejs = require("requirejs")
var http = require('http'),
    https = require('https');
var app = connect();
var router = Router();

// gzip/deflate outgoing responses
var compression = require('compression');
app.use(compression());

// store session state in browser cookie
var cookieSession = require('cookie-session');
app.use(cookieSession({
    keys: ['secret1', 'secret2']
}));

// parse urlencoded request bodies into req.body
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: false
}));

var userName, html, template = "",
    parentTmpl, tmplFile;
app.use(function (req, res) {
    userName = {
        firstName: req.body.firstName,
        lastName: req.body.lastName
    };
    tmplFile = fs.createReadStream(path.join(__dirname, 'public/index.html'), {
        encoding: "utf8"
    });

    tmplFile.on("data", function (data) {
        template += data;
    });
    tmplFile.on("end", function () {
        html = mustache.render(template, userName);
        res.end(html);
    });
});
app.use(serveStatic(path.join(__dirname, 'public')));
app.use(router.get("/sayHello/:firstName/:lastName", function (req, res) {
    userName = req.params.firstName + " " + req.params.lastName;
    html = "<html lang=\"en\"><head><title>Hello " + userName + "</title></head>" +
        "<body>" + userName + ", you are in nowhere</div></body></html>";
    res.end(html);
}));

app.use(router.use("/builder", function (req, res) {
    var options = {
        shim: req.body.html5shim,
        flash: req.body.useFlash,
        sockets: req.body.useWebSockets,
        jsonp: req.body.useJsonp
    };
    requirejs(["text!public/js/builder.js"], function (tmpl) {
        var js = mustache.render(tmpl, options);
        res.writeHead(200, {
            "Content-Type": "application/javascript",
            "Content-Length": js.length
        });
        res.end(js);
    });
}));

app.use(router.use("/theme", function (req, res) {
    var theme = {
        main: req.body.mainColor,
        secondary: req.body.secondaryColor,
        border: req.body.borderStyle,
        corners: req.body.borderRadius
    };
    requirejs(["text!public/css/theme.css"], function (tmpl) {
        var css = mustache.render(tmpl, theme);
        res.writeHead(200, {
            "Content-Type": "text/css",
            "Content-Length": css.length
        });
        res.end(css);
    });
}));

const server = http.createServer(app);
const {
    Server
} = require("socket.io");
/*const {
    RESERVED_EVENTS
} = require('socket.io/dist/socket');*/
const io = new Server(server).listen(1337);
//create node.js http server and listen on port
io.on('connection', (socket) => {
    console.log('a user connected');
});
server.listen(3000, () => {
    console.log('listening on *:3000');
});

function render(res, filename, data, style, script, callback) {
    requirejs(["text!public/" + filename], function (tmpl) {
        if (callback) {
            callback(res, tmpl, data, style, script);
        } else {
            var html = mustache.render(
                parentTmpl, {
                    content: data
                }, {
                    content: tmpl,
                    stylesheets: style || "",
                    scripts: script || ""
                }
            );
            res.end(html);
        }
    })
}