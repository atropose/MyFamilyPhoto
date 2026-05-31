const { useState, useEffect, useRef, useCallback } = React;

const CORRECT_PIN = "1234";
const PIN_LENGTH = 4;

function LogoMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {/* photo frame with little mountain + sun */}
      <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="9" cy="10" r="1.4" fill="currentColor"/>
      <path d="M5.5 17.5L10 13l3 2.5 2.5-2 3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function BackspaceIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 6h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9L2 12l7-6Z"
            stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M13 9.5l5 5M18 9.5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function App() {
  const [pin, setPin] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | verifying | error | success
  const [pressed, setPressed] = useState(null);
  const timersRef = useRef([]);

  const queueTimer = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  };

  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  const submit = useCallback((value) => {
    setPhase("verifying");
    queueTimer(() => {
      if (value === CORRECT_PIN) {
        setPhase("success");
        queueTimer(() => {
          window.location.href = "Gallery.html";
        }, 1000);
      } else {
        setPhase("error");
        queueTimer(() => {
          setPin("");
          setPhase("idle");
        }, 900);
      }
    }, 380);
  }, []);

  const pressDigit = useCallback((d) => {
    if (phase !== "idle") return;
    setPin(prev => {
      if (prev.length >= PIN_LENGTH) return prev;
      const next = prev + d;
      if (next.length === PIN_LENGTH) submit(next);
      return next;
    });
  }, [phase, submit]);

  const pressDelete = useCallback(() => {
    if (phase !== "idle") return;
    setPin(prev => prev.slice(0, -1));
  }, [phase]);

  // Keyboard support
  useEffect(() => {
    const onKey = (e) => {
      if (e.key >= "0" && e.key <= "9") {
        setPressed(e.key);
        queueTimer(() => setPressed(null), 120);
        pressDigit(e.key);
      } else if (e.key === "Backspace") {
        setPressed("del");
        queueTimer(() => setPressed(null), 120);
        pressDelete();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pressDigit, pressDelete]);

  const dotState = (i) => {
    if (phase === "error" && i < PIN_LENGTH) return "error";
    if (phase === "success" && i < PIN_LENGTH) return "success";
    return i < pin.length ? "filled" : "";
  };

  const status =
    phase === "verifying" ? "확인 중…" :
    phase === "error"     ? "패스코드가 일치하지 않습니다" :
    phase === "success"   ? "환영합니다" :
    pin.length === 0      ? "" :
                            `${pin.length} / ${PIN_LENGTH}`;

  const keys = [
    { v: "1" }, { v: "2" }, { v: "3" },
    { v: "4" }, { v: "5" }, { v: "6" },
    { v: "7" }, { v: "8" }, { v: "9" },
    { spacer: true }, { v: "0" }, { del: true },
  ];

  return (
    <div className="app">
      <div className="bg-blur" aria-hidden="true"></div>
      <div className="bg-grain" aria-hidden="true"></div>

      <div className="card" role="dialog" aria-label="패스코드 입력">
        <div className="brand">
          <div className="brand-mark"><LogoMark /></div>
          <div className="brand-name">MyPicManager</div>
        </div>

        <h1 className="heading">패스코드를 입력하세요</h1>
        <p className="subheading">우리 가족의 추억을 열어볼게요</p>

        <div className="hint">힌트 · 데모 패스코드 1 2 3 4</div>

        <div className={`dots ${phase === "error" ? "shake" : ""}`} aria-live="polite">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div key={i} className={`dot ${dotState(i)}`} />
          ))}
        </div>

        <div className={`status ${phase === "error" ? "error" : phase === "success" ? "success" : ""}`}>
          {status}
        </div>

        <div className="keypad" role="group" aria-label="숫자 키패드">
          {keys.map((k, i) => {
            if (k.spacer) return <div key={i} className="key spacer" aria-hidden="true" />;
            if (k.del) {
              return (
                <button
                  key={i}
                  className={`key delete ${pressed === "del" ? "pressed" : ""}`}
                  onClick={pressDelete}
                  disabled={phase !== "idle" || pin.length === 0}
                  aria-label="삭제"
                >
                  <BackspaceIcon />
                </button>
              );
            }
            return (
              <button
                key={i}
                className={`key ${pressed === k.v ? "pressed" : ""}`}
                onClick={() => pressDigit(k.v)}
                disabled={phase !== "idle"}
                aria-label={`숫자 ${k.v}`}
              >
                <div className="key-stack">
                  <span>{k.v}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="foot">
          가족 전용 서비스입니다
          <span className="dot-sep"></span>
          v 0.1
        </div>

        {phase === "success" && (
          <div className="success-mark show" aria-hidden="true">
            <div className="success-circle"><CheckIcon /></div>
            <div className="success-text">환영합니다 👋</div>
          </div>
        )}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
