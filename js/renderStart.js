var html = require('choo/html');

module.exports = function renderStart(state, emit) {
    if (state.step === 0) {
        return html`
            <body>
                <h1>Velg type chat</h1>
                <button onclick=${startChatroom}>Start new chat</button>
                <button onclick=${joinChatrom}>Join chat</button>
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

    function joinChatrom() {
        state.join = true;

        emit('render');
    }

    function copyOffer() {
        document.querySelector('#offer').select();
        document.execCommand('copy');
    }
};
