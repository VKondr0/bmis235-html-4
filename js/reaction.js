// Original F1 Reaction Challenge, made with ChatGPT.
(() => {
    const game = document.querySelector(".reaction-game");
    const lights = game.querySelectorAll(".reaction-light");
    const button = game.querySelector(".reaction-button");
    const result = game.querySelector(".reaction-result");
    const message = game.querySelector(".reaction-message");
    const bestDisplay = game.querySelector(".reaction-best");

    let state = "ready";
    let startTime = 0;
    let timers = [];
    let bestTime = null;

    try {
        const saved = localStorage.getItem("f1ReactionBest");

        if (saved !== null &&
            Number.isFinite(Number(saved)) &&
            Number(saved) >= 0) {
            bestTime = Number(saved);
            bestDisplay.textContent = "Best time: " + bestTime + " ms";
        }
    } catch (error) {
        // Game works without saved results
    }

    function clearLights() {
        lights.forEach(light => {
            light.classList.remove("on");
        });
    }

    function clearTimers() {
        timers.forEach(timer => clearTimeout(timer));
        timers = [];
    }

    function startGame() {
        clearTimers();
        clearLights();

        state = "waiting";
        result.textContent = "GET READY";
        message.textContent = "Don't click before lights out";
        button.textContent = "WAIT...";

        lights.forEach((light, index) => {
            const timer = setTimeout(() => {
                light.classList.add("on");
            }, (index + 1) * 1000);

            timers.push(timer);
        });

        const randomDelay = 500 + Math.random() * 2000;

        const timer = setTimeout(() => {
            clearLights();
            startTime = performance.now();

            state = "go";
            result.textContent = "GO!";
            message.textContent = "Click now!";
            button.textContent = "CLICK!";
        }, 5000 + randomDelay);

        timers.push(timer);
    }

    function jumpStart() {
        clearTimers();
        clearLights();

        state = "finished";
        result.textContent = "JUMP START";
        message.textContent = "You clicked too early";
        button.textContent = "TRY AGAIN";
    }

    function finishGame() {
        const reaction = Math.round(performance.now() - startTime);

        state = "finished";
        result.textContent = reaction + " ms";
        button.textContent = "TRY AGAIN";

        if (reaction < 200) {
            message.textContent = "Amazing reaction!";
        } else if (reaction < 350) {
            message.textContent = "Nice start!";
        } else {
            message.textContent = "Try to beat your time";
        }

        if (bestTime === null || reaction < bestTime) {
            bestTime = reaction;
            bestDisplay.textContent = "Best time: " + bestTime + " ms";

            try {
                localStorage.setItem("f1ReactionBest", bestTime);
            } catch (error) {
                // Saving is optional
            }
        }
    }

    button.addEventListener("click", () => {
        if (state === "ready" || state === "finished") {
            startGame();
        } else if (state === "waiting") {
            jumpStart();
        } else if (state === "go") {
            finishGame();
        }
    });
})();
