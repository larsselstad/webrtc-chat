var html = require('choo/html');

module.exports = function renderJoin(state, emit) {
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

        state.dc.send(line);

        emit('render');
    }

    function copyAnswer() {
        document.querySelector('#answer').select();
        document.execCommand('copy');
    }
};
