var choo = require('choo');
var html = require('choo/html');

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
        console.log('ondatachannel');
        var channel = evt.channel;

        channel.onmessage = function (event) {
            console.log('ekstra onmessage');
            console.log(event);
            console.log("received: " + event.data);

            state.lines.push({
                user: 'remote',
                text: event.data
            });

            emitter.emit('render');
        };

        channel.onopen = function () {
            console.log("ekstra datachannel open");
        };

        channel.onclose = function () {
            console.log("ekstra datachannel close");
        };
    };

    state.dc= state.pc.createDataChannel('sendChannel');
});

app.route('/', function (state, emit) {
    if (state.step === 0) {
        return html`
            <body>
                <h1>Velg type chat</h1>
                <div><button onclick=${startChatroom}>Nytt chatrom</button></div>
                <div><a href="/join">Bli med i chatrom</a></div>
            </body>
        `;
    } else if (state.step === 1) {
        state.pc.createOffer().then(function (offer) {
            state.offer = offer;

            state.pc.setLocalDescription(offer);

            state.step = 2;

            emit('render');
        }).catch(function(e) {
            console.log(e);
            console.log("createOffer failed");
        });

        return html `
            <body>
                <h1>Lager offer</h1>
            </body>
        `;
    } else if (state.step === 2) {
        return html `
            <body>
                <h1>Offer</h1>
                <textarea name="offer" id="offer" cols="30" rows="10">${JSON.stringify(state.offer)}</textarea>
                <div><button onclick=${copyOffer}>Kopier tekst</button></div>
                <div><button onclick=${offerOk}>OK!</button></div>
            </body>
        `;
    } else if (state.step === 3) {
        return html `
            <body>
                <h1>Answer</h1>
                <form action="/" onsubmit=${answerOk}>
                    <textarea name="answer" id="answer" cols="30" rows="10"></textarea>
                    <div><button>OK!</button></div>
                </form>
            </body>
        `;
    } else if (state.step === 4) {
        return html`
            <body>
                <h1>Start chatting</h1>
                <ul>
                    ${state.lines.map(function (line) {
                        return html`<li>${line.user}: ${line.text}</li>`;
                    })}
                </ul>
                <form action="/" onsubmit=${lineSend}>
                    <div>
                        <input type="text" placeholder="Skriv noe" />
                    </div>
                    <button>Send</button>
                </form>
            </body>
        `;
    } else {
        return html `
            <body>
                <h1>Noe gikk galt</h1>
            </body>
        `;
    }

    function offerOk() {
        state.step = 3;

        emit('render');
    }

    function answerOk(e) {
        e.preventDefault();

        var textarea = e.target.querySelector('textarea');
        state.answer = textarea.value;

        state.pc.setRemoteDescription(JSON.parse(state.answer)).then(function () {
            state.step = 4;

            emit('render');
        }).catch(function (e) {
            console.log(e);
            console.log('setRemoteDescription feilet på master');
        });
    }

    function lineSend(e) {
        e.preventDefault();

        var line = e.target.querySelector('input').value;

        state.lines.push({
            user: 'me',
            text: line
        });

        state.dc.send(line);

        emit('render');
    }

    function startChatroom() {
        state.step = 1;

        emit('render');
    }

    function copyOffer() {
        document.querySelector('#offer').select();
        document.execCommand('copy');
    }
});

app.route('/join', function (state, emit) {
    if (state.joinStep === 1) {
        return html `
            <body>
                <h1>Legg inn Offer</h1>
                <form action="/" onsubmit=${offerSubmit}>
                    <textarea name="offer" id="offer" cols="30" rows="10"></textarea>
                    <div><button>OK!</button></div>
                </form>
            </body>
        `;
    } else if (state.joinStep === 2) {
        state.pc.createAnswer().then(function (answer) {
            state.answer = answer;

            state.pc.setLocalDescription(answer);

            state.joinStep = 3;

            emit('render');
        }).catch(function(e) {
            console.log(e);
            console.log("createAnswer failed");
        });

        return html `
            <body>
                <h1>Lager answer</h1>
            </body>
        `;
    } else if (state.joinStep === 3) {
        return html `
            <body>
                <h1>Answer</h1>
                <textarea name="answer" id="answer" cols="30" rows="10">${JSON.stringify(state.answer)}</textarea>
                <div><button onclick=${copyAnswer}>Kopier tekst</button></div>
                <div><button onclick=${answerOk}>OK!</button></div>
            </body>
        `;
    } else if (state.joinStep === 4) {
        return html`
            <body>
                <h1>Start chatting</h1>
                <ul>
                    ${state.lines.map(function (line) {
                        return html`<li>${line.user}: ${line.text}</li>`;
                    })}
                </ul>
                <form action="/" onsubmit=${lineSend}>
                    <div>
                        <input type="text" placeholder="Skriv noe" />
                    </div>
                    <button>Send</button>
                </form>
            </body>
        `;
    } else {
        return html `
            <body>
                <h1>Noe gikk galt i step: ${state.joinStep}</h1>
            </body>
        `;
    }

    function offerSubmit(e) {
        e.preventDefault();

        var textarea = e.target.querySelector('textarea');
        state.answer = textarea.value;

        state.pc.setRemoteDescription(JSON.parse(state.answer)).then(function () {
            state.joinStep = 2;

            emit('render');
        }).catch(function (e) {
            console.log(e);
            console.log('setRemoteDescription feilet på joiner');
        });
    }

    function answerOk() {
        state.joinStep = 4;

        emit('render');
    }

    function lineSend(e) {
        e.preventDefault();

        var line = e.target.querySelector('input').value;

        state.lines.push({
            user: 'me',
            text: line
        });

        console.log(line);

        state.dc.send(line);

        emit('render');
    }

    function copyAnswer() {
        document.querySelector('#answer').select();
        document.execCommand('copy');
    }
});

app.mount('body');
