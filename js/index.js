/*globals RTCPeerConnection*/

var choo = require('choo');

var renderStart = require('./renderStart');
var renderJoin = require('./renderJoin');

var configuration = {
    iceServers: [{
        urls: [
            'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302',
        ]
    }]
};

var app = choo();

app.use(function (state, emitter) {
    state.step = 0;
    state.joinStep = 1;
    state.lines = [];

    state.pc = new RTCPeerConnection(configuration);

    state.pc.onicecandidate = function (e) {
        if (e.candidate === null) {
            if (state.step === 2) {
                state.offer = state.pc.localDescription;

                state.step = 2;

                emitter.emit('render');
            }

            if (state.joinStep === 3) {
                state.answer = state.pc.localDescription;

                state.step = 3;

                emitter.emit('render');
            }
        }
    };

    state.pc.ondatachannel = function (evt) {
        var channel = evt.channel;

        channel.onmessage = function (event) {
            state.lines.push({
                user: 'remote',
                text: event.data
            });

            emitter.emit('render');
        };

        channel.onopen = function () {
            console.log("datachannel open");
        };

        channel.onclose = function () {
            console.log("datachannel close");
        };
    };

    state.dc = state.pc.createDataChannel('sendChannel');
});

app.route('*', function (state, emit) {
    if (!state.join) {
        return renderStart(state, emit);
    } else {
        return renderJoin(state, emit);
    }
});

app.mount('body');
